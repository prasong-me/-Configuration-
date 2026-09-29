const DEFAULT_LIMITS = Object.freeze({
  maxMessageBytes: 4096,
  maxNameLength: 255,
  maxRecords: 256,
});

const TYPE_BY_CODE = Object.freeze({
  1: "A",
  2: "NS",
  5: "CNAME",
  12: "PTR",
  15: "MX",
  16: "TXT",
  28: "AAAA",
  33: "SRV",
  64: "SVCB",
  65: "HTTPS",
  41: "OPT",
});

const CODE_BY_TYPE = Object.freeze(Object.fromEntries(Object.entries(TYPE_BY_CODE).map(([k, v]) => [v, Number(k)])));

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function asBytes(input) {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  fail("DNS_WIRE_INPUT_TYPE", "DNS wire input must be a Uint8Array or ArrayBuffer.");
}

function u16(bytes, offset) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function readName(bytes, start, limits, sectionOffset) {
  let offset = start;
  let jumped = false;
  let nextOffset = start;
  const labels = [];
  let expandedLength = 0;
  const visited = new Set();
  let jumps = 0;

  while (true) {
    if (offset >= bytes.length) fail("DNS_WIRE_TRUNCATED", `Truncated DNS name in ${sectionOffset}.`);
    const length = bytes[offset];

    if ((length & 0xc0) === 0xc0) {
      if (offset + 1 >= bytes.length) fail("DNS_WIRE_TRUNCATED", "Truncated DNS compression pointer.");
      const pointer = ((length & 0x3f) << 8) | bytes[offset + 1];
      if (pointer >= bytes.length) fail("DNS_WIRE_COMPRESSION_INVALID", "DNS compression pointer is out of bounds.");
      if (pointer >= offset) fail("DNS_WIRE_COMPRESSION_INVALID", "Forward/self-referential DNS compression pointer is not allowed.");
      if (visited.has(pointer)) fail("DNS_WIRE_COMPRESSION_INVALID", "DNS compression pointer loop detected.");
      visited.add(pointer);
      if (++jumps > 128) fail("DNS_WIRE_COMPRESSION_INVALID", "DNS compression pointer depth exceeded.");
      if (!jumped) {
        nextOffset = offset + 2;
        jumped = true;
      }
      offset = pointer;
      continue;
    }

    if ((length & 0xc0) !== 0) fail("DNS_WIRE_COMPRESSION_INVALID", "Invalid DNS label prefix.");
    offset += 1;
    if (length === 0) {
      if (!jumped) nextOffset = offset;
      break;
    }
    if (length > 63 || offset + length > bytes.length) fail("DNS_WIRE_TRUNCATED", "Truncated DNS label.");
    const label = new TextDecoder("ascii", { fatal: true }).decode(bytes.subarray(offset, offset + length));
    labels.push(label);
    expandedLength += length + (labels.length > 1 ? 1 : 0);
    if (expandedLength > limits.maxNameLength) fail("DNS_WIRE_LIMIT_EXCEEDED", "DNS name length limit exceeded.");
    offset += length;
  }

  return { name: labels.join("."), nextOffset, labels };
}

function parseOptRdata(bytes, start, length) {
  if (length < 0) fail("DNS_WIRE_TRUNCATED", "Invalid OPT RDATA length.");
  const end = start + length;
  let cursor = start;
  const options = [];
  while (cursor < end) {
    if (cursor + 4 > end) fail("DNS_WIRE_TRUNCATED", "Truncated EDNS option header.");
    const code = u16(bytes, cursor);
    const optionLength = u16(bytes, cursor + 2);
    cursor += 4;
    if (cursor + optionLength > end) fail("DNS_WIRE_TRUNCATED", "Truncated EDNS option data.");
    options.push({ code, data: bytes.slice(cursor, cursor + optionLength) });
    cursor += optionLength;
  }
  if (cursor !== end) fail("DNS_WIRE_TRUNCATED", "Malformed EDNS option sequence.");
  return options;
}

function parseRecord(bytes, name, limits, section) {
  let cursor = name.nextOffset;
  if (cursor + 10 > bytes.length) fail("DNS_WIRE_TRUNCATED", `Truncated ${section} record header.`);
  const typeCode = u16(bytes, cursor);
  const recordClass = u16(bytes, cursor + 2);
  const ttl = (bytes[cursor + 4] * 0x1000000) + (bytes[cursor + 5] << 16) + (bytes[cursor + 6] << 8) + bytes[cursor + 7];
  const rdlength = u16(bytes, cursor + 8);
  cursor += 10;
  if (cursor + rdlength > bytes.length) fail("DNS_WIRE_TRUNCATED", `Truncated ${section} record data.`);
  const rawRdata = bytes.slice(cursor, cursor + rdlength);
  let record = {
    name: name.name,
    type: TYPE_BY_CODE[typeCode] || `TYPE${typeCode}`,
    typeCode,
    class: recordClass,
    ttl,
    rdlength,
    rdata: rawRdata,
  };
  if (typeCode === 41) {
    const extRcode = (ttl >>> 24) & 0xff;
    const version = (ttl >>> 16) & 0xff;
    const flags = ttl & 0xffff;
    record = {
      name: name.name,
      type: "OPT",
      typeCode: 41,
      udpPayloadSize: recordClass,
      extendedRcode: extRcode,
      version,
      do: Boolean(flags & 0x8000),
      z: flags & 0x7fff,
      rdlength,
      options: parseOptRdata(bytes, cursor, rdlength),
    };
  }
  return { record, nextOffset: cursor + rdlength };
}

export function decodeDnsWireMessage(input, options = {}) {
  const bytes = asBytes(input);
  const limits = { ...DEFAULT_LIMITS, ...(options.limits || {}) };
  for (const key of Object.keys(DEFAULT_LIMITS)) {
    if (!Number.isInteger(limits[key]) || limits[key] <= 0) fail("DNS_WIRE_LIMIT_INVALID", `Invalid DNS wire limit: ${key}.`);
  }
  if (bytes.byteLength > limits.maxMessageBytes) fail("DNS_WIRE_LIMIT_EXCEEDED", "DNS message size limit exceeded.");
  if (bytes.byteLength < 12) fail("DNS_WIRE_TRUNCATED", "DNS header is truncated.");

  const flags = u16(bytes, 2);
  const counts = [u16(bytes, 4), u16(bytes, 6), u16(bytes, 8), u16(bytes, 10)];
  const totalRecords = counts.reduce((a, b) => a + b, 0);
  if (totalRecords > limits.maxRecords) fail("DNS_WIRE_LIMIT_EXCEEDED", "DNS record count limit exceeded.");

  const message = {
    transactionId: u16(bytes, 0),
    flags,
    header: {
      qr: (flags >> 15) & 1,
      opcode: (flags >> 11) & 0xf,
      aa: (flags >> 10) & 1,
      tc: (flags >> 9) & 1,
      rd: (flags >> 8) & 1,
      ra: (flags >> 7) & 1,
      rcode: flags & 0xf,
    },
    questions: [],
    answers: [],
    authority: [],
    additional: [],
  };

  let offset = 12;
  const sections = [
    ["questions", counts[0], true],
    ["answers", counts[1], false],
    ["authority", counts[2], false],
    ["additional", counts[3], false],
  ];

  for (const [key, count, question] of sections) {
    for (let i = 0; i < count; i += 1) {
      const name = readName(bytes, offset, limits, key);
      offset = name.nextOffset;
      if (question) {
        if (offset + 4 > bytes.length) fail("DNS_WIRE_TRUNCATED", "Truncated DNS question.");
        message.questions.push({ name: name.name, typeCode: u16(bytes, offset), class: u16(bytes, offset + 2) });
        offset += 4;
      } else {
        const parsed = parseRecord(bytes, name, limits, key);
        message[key].push(parsed.record);
        offset = parsed.nextOffset;
      }
    }
  }

  if (offset !== bytes.length) fail("DNS_WIRE_TRAILING_DATA", "Trailing bytes remain after DNS message.");
  return Object.freeze(message);
}

function assertUint(value, max, code, message) {
  if (!Number.isInteger(value) || value < 0 || value > max) fail(code, message);
}

function encodeName(name, maxNameLength = 255) {
  if (typeof name !== "string") fail("DNS_WIRE_NAME_INVALID", "DNS name must be a string.");
  const normalized = name.trim().replace(/\\.$/, "");
  if (normalized.length === 0) return Uint8Array.of(0);
  const labels = normalized.split(".");
  let total = 1;
  const chunks = [];
  for (const label of labels) {
    const bytes = new TextEncoder().encode(label);
    if (bytes.length === 0 || bytes.length > 63) fail("DNS_WIRE_NAME_INVALID", "DNS label length must be 1..63 octets.");
    total += 1 + bytes.length;
    chunks.push(Uint8Array.of(bytes.length), bytes);
  }
  if (total > maxNameLength + 1 || total > 255) fail("DNS_WIRE_NAME_INVALID", "DNS name length limit exceeded.");
  return concatBytes([...chunks, Uint8Array.of(0)]);
}

function concatBytes(parts) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function u16Bytes(value) {
  assertUint(value, 0xffff, "DNS_WIRE_FIELD_INVALID", "DNS 16-bit field is invalid.");
  return Uint8Array.of((value >> 8) & 0xff, value & 0xff);
}

function u32Bytes(value) {
  assertUint(value, 0xffffffff, "DNS_WIRE_FIELD_INVALID", "DNS 32-bit field is invalid.");
  return Uint8Array.of((value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);
}

function bytesFrom(value, code = "DNS_WIRE_RDATA_INVALID") {
  if (value instanceof Uint8Array) return value;
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (Array.isArray(value) && value.every(byte => Number.isInteger(byte) && byte >= 0 && byte <= 255)) return Uint8Array.from(value);
  fail(code, "DNS RDATA must be a byte sequence.");
}

function encodeRdata(record) {
  const type = record.type || (Number.isInteger(record.typeCode) ? TYPE_BY_CODE[record.typeCode] : undefined);
  const rdata = record.rdata;
  if (type === "A" || type === "AAAA" || type === "TXT") {
    const bytes = bytesFrom(rdata);
    const expected = type === "A" ? 4 : type === "AAAA" ? 16 : null;
    if (expected !== null && bytes.length !== expected) fail("DNS_WIRE_RDATA_INVALID", `${type} RDATA must contain ${expected} octets.`);
    return bytes.slice();
  }

  if (type === "CNAME" || type === "NS" || type === "PTR") {
    const target = record.target ?? record.rdataName;
    if (typeof target !== "string") fail("DNS_WIRE_RDATA_STRUCTURED_REQUIRED", `${type} requires a structured target name for deterministic encoding.`);
    return encodeName(target);
  }

  if (type === "MX") {
    const exchange = record.exchange ?? record.rdataName;
    if (typeof exchange !== "string") fail("DNS_WIRE_RDATA_STRUCTURED_REQUIRED", "MX requires a structured exchange name.");
    return concatBytes([u16Bytes(record.preference), encodeName(exchange)]);
  }

  if (type === "SRV") {
    const target = record.target ?? record.rdataName;
    if (typeof target !== "string") fail("DNS_WIRE_RDATA_STRUCTURED_REQUIRED", "SRV requires a structured target name.");
    return concatBytes([
      u16Bytes(record.priority),
      u16Bytes(record.weight),
      u16Bytes(record.port),
      encodeName(target),
    ]);
  }

  if (type === "OPT") {
    if (record.name !== "" && record.name !== ".") fail("DNS_WIRE_RDATA_INVALID", "OPT owner name must be root.");
    if (record.version !== 0) fail("DNS_WIRE_EDNS_VERSION_UNSUPPORTED", "Only EDNS version 0 is supported.");
    assertUint(record.udpPayloadSize, 0xffff, "DNS_WIRE_RDATA_INVALID", "OPT UDP payload size is invalid.");
    assertUint(record.extendedRcode, 0xff, "DNS_WIRE_RDATA_INVALID", "OPT extended RCODE is invalid.");
    assertUint(record.version, 0xff, "DNS_WIRE_RDATA_INVALID", "OPT version is invalid.");
    assertUint(record.z, 0x7fff, "DNS_WIRE_RDATA_INVALID", "OPT Z bits are invalid.");
    const options = Array.isArray(record.options) ? record.options : [];
    return concatBytes(options.map(option => {
      assertUint(option?.code, 0xffff, "DNS_WIRE_RDATA_INVALID", "EDNS option code is invalid.");
      const data = bytesFrom(option?.data);
      if (data.length > 0xffff) fail("DNS_WIRE_RDATA_INVALID", "EDNS option data is too large.");
      return concatBytes([u16Bytes(option.code), u16Bytes(data.length), data]);
    }));
  }

  if (type === "SVCB" || type === "HTTPS") {
    const target = record.target ?? record.rdataName;
    if (typeof target !== "string") fail("DNS_WIRE_RDATA_STRUCTURED_REQUIRED", `${type} requires a structured target name.`);
    const parameters = Array.isArray(record.parameters) ? record.parameters : [];
    const encodedParameters = parameters.map(parameter => {
      if (!Number.isInteger(parameter?.key) || parameter.key < 0 || parameter.key > 0xffff) {
        fail("DNS_WIRE_RDATA_INVALID", `${type} parameter key is invalid.`);
      }
      const value = bytesFrom(parameter.value, "DNS_WIRE_RDATA_INVALID");
      return concatBytes([u16Bytes(parameter.key), u16Bytes(value.length), value]);
    });
    return concatBytes([u16Bytes(record.priority), encodeName(target), ...encodedParameters]);
  }

  fail("DNS_WIRE_RECORD_TYPE_UNSUPPORTED", `DNS wire encoder does not support record type: ${type || "UNKNOWN"}.`);
}

function encodeQuestion(question) {
  if (!question || typeof question.name !== "string") fail("DNS_WIRE_QUESTION_INVALID", "DNS question is invalid.");
  const typeCode = Number.isInteger(question.typeCode) ? question.typeCode : CODE_BY_TYPE[question.type];
  assertUint(typeCode, 0xffff, "DNS_WIRE_QUESTION_INVALID", "DNS question type is invalid.");
  return concatBytes([encodeName(question.name), u16Bytes(typeCode), u16Bytes(question.class)]);
}

function encodeRecord(record) {
  if (!record || typeof record.name !== "string") fail("DNS_WIRE_RECORD_INVALID", "DNS record owner name is invalid.");
  const typeCode = Number.isInteger(record.typeCode) ? record.typeCode : CODE_BY_TYPE[record.type];
  if (!Number.isInteger(typeCode)) fail("DNS_WIRE_RECORD_TYPE_UNSUPPORTED", "DNS record type is unsupported.");
  const rdata = encodeRdata(record);
  if (rdata.length > 0xffff) fail("DNS_WIRE_RDATA_INVALID", "DNS RDATA exceeds the 16-bit wire length.");
  let recordClass = record.class;
  let ttl = record.ttl;
  if (typeCode === 41) {
    recordClass = record.udpPayloadSize;
    ttl = ((record.extendedRcode & 0xff) << 24)
      | ((record.version & 0xff) << 16)
      | (record.do ? 0x8000 : 0)
      | (record.z & 0x7fff);
    ttl >>>= 0;
  }
  return concatBytes([
    encodeName(record.name),
    u16Bytes(typeCode),
    u16Bytes(recordClass),
    u32Bytes(ttl),
    u16Bytes(rdata.length),
    rdata,
  ]);
}

export function encodeDnsWireMessage(message, options = {}) {
  if (!message || !Number.isInteger(message.transactionId) || !Number.isInteger(message.flags)) {
    fail("DNS_WIRE_MESSAGE_INVALID", "DNS message header is invalid.");
  }
  assertUint(message.transactionId, 0xffff, "DNS_WIRE_MESSAGE_INVALID", "DNS transaction ID is invalid.");
  assertUint(message.flags, 0xffff, "DNS_WIRE_MESSAGE_INVALID", "DNS flags are invalid.");

  const limits = { ...DEFAULT_LIMITS, ...(options.limits || {}) };
  for (const key of Object.keys(DEFAULT_LIMITS)) {
    if (!Number.isInteger(limits[key]) || limits[key] <= 0) fail("DNS_WIRE_LIMIT_INVALID", `Invalid DNS wire limit: ${key}.`);
  }

  const sections = [
    message.questions || [],
    message.answers || [],
    message.authority || [],
    message.additional || [],
  ];
  if (!sections.every(Array.isArray)) fail("DNS_WIRE_MESSAGE_INVALID", "DNS message sections must be arrays.");
  const totalRecords = sections.slice(1).reduce((sum, section) => sum + section.length, 0);
  if (totalRecords > limits.maxRecords) fail("DNS_WIRE_LIMIT_EXCEEDED", "DNS record count limit exceeded.");
  const optCount = sections[3].filter(record => record?.type === "OPT" || record?.typeCode === 41).length;
  if (optCount > 1) fail("DNS_WIRE_EDNS_INVALID", "A DNS message may contain at most one OPT record.");
  if (sections.some(section => section.length > 0xffff)) fail("DNS_WIRE_MESSAGE_INVALID", "DNS section count exceeds the 16-bit wire limit.");

  const encodedSections = [
    sections[0].map(encodeQuestion),
    sections[1].map(encodeRecord),
    sections[2].map(encodeRecord),
    sections[3].map(encodeRecord),
  ];
  const body = concatBytes(encodedSections.flat());
  const bytes = concatBytes([
    u16Bytes(message.transactionId),
    u16Bytes(message.flags),
    ...sections.map(section => u16Bytes(section.length)),
    body,
  ]);
  if (bytes.length > limits.maxMessageBytes) fail("DNS_WIRE_LIMIT_EXCEEDED", "Encoded DNS message exceeds the configured size limit.");
  return bytes;
}

export { CODE_BY_TYPE };
