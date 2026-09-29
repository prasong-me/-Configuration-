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

function parseRecord(bytes, offset, limits, section) {
  const name = readName(bytes, offset, limits, section);
  let cursor = name.nextOffset;
  if (cursor + 10 > bytes.length) fail("DNS_WIRE_TRUNCATED", `Truncated ${section} record header.`);
  const typeCode = u16(bytes, cursor);
  const recordClass = u16(bytes, cursor + 2);
  const ttl = (bytes[cursor + 4] * 0x1000000) + (bytes[cursor + 5] << 16) + (bytes[cursor + 6] << 8) + bytes[cursor + 7];
  const rdlength = u16(bytes, cursor + 8);
  cursor += 10;
  if (cursor + rdlength > bytes.length) fail("DNS_WIRE_TRUNCATED", `Truncated ${section} record data.`);
  return {
    record: {
      name: name.name,
      type: TYPE_BY_CODE[typeCode] || `TYPE${typeCode}`,
      typeCode,
      class: recordClass,
      ttl,
      rdlength,
      rdata: bytes.slice(cursor, cursor + rdlength),
    },
    nextOffset: cursor + rdlength,
  };
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
        const parsed = parseRecord(bytes, offset - (name.nextOffset - (offset)), limits, key);
        message[key].push(parsed.record);
        offset = parsed.nextOffset;
      }
    }
  }

  if (offset !== bytes.length) fail("DNS_WIRE_TRAILING_DATA", "Trailing bytes remain after DNS message.");
  return Object.freeze(message);
}

export function encodeDnsWireMessage(message) {
  if (!message || !Number.isInteger(message.transactionId) || !Number.isInteger(message.flags)) {
    fail("DNS_WIRE_MESSAGE_INVALID", "DNS message header is invalid.");
  }
  const all = [...(message.questions || []), ...(message.answers || []), ...(message.authority || []), ...(message.additional || [])];
  if (all.length > 65535) fail("DNS_WIRE_MESSAGE_INVALID", "Too many DNS records.");
  const bytes = new Uint8Array(12);
  bytes[0] = (message.transactionId >> 8) & 255; bytes[1] = message.transactionId & 255;
  bytes[2] = (message.flags >> 8) & 255; bytes[3] = message.flags & 255;
  const sections = [message.questions || [], message.answers || [], message.authority || [], message.additional || []];
  sections.forEach((section, index) => { bytes[4 + index * 2] = (section.length >> 8) & 255; bytes[5 + index * 2] = section.length & 255; });
  fail("DNS_WIRE_ENCODE_UNIMPLEMENTED", "Encoding parsed DNS messages requires an explicit wire-preservation implementation.");
}

export { CODE_BY_TYPE };
