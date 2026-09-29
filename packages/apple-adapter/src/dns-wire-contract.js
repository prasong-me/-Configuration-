export const DnsWireSection = Object.freeze({
  HEADER: "HEADER",
  QUESTION: "QUESTION",
  ANSWER: "ANSWER",
  AUTHORITY: "AUTHORITY",
  ADDITIONAL: "ADDITIONAL",
});

export const DnsWireRecordType = Object.freeze({
  A: "A",
  AAAA: "AAAA",
  CNAME: "CNAME",
  MX: "MX",
  NS: "NS",
  TXT: "TXT",
  HTTPS: "HTTPS",
  SVCB: "SVCB",
  PTR: "PTR",
  SRV: "SRV",
});

const POSITIVE = value => Number.isInteger(value) && value > 0;
const unique = values => [...new Set(values)];

export function createDnsWireParserContract(input = {}) {
  const source = input?.parser ?? input;
  const inspect = Array.isArray(source.inspect)
    ? unique(source.inspect.filter(value => Object.values(DnsWireRecordType).includes(value)))
    : [];
  const mutate = Array.isArray(source.mutate)
    ? unique(source.mutate.filter(value => Object.values(DnsWireRecordType).includes(value)))
    : [];

  return {
    version: "1.0",
    input: "RAW_DNS_DATA",
    output: "DNS_MESSAGE",
    implementation: "APPLICATION_RUNTIME",
    sections: Object.values(DnsWireSection),
    operations: {
      decode: "REQUIRED",
      inspect: "OPTIONAL",
      mutate: "OPTIONAL",
      encode: "REQUIRED",
    },
    inspect,
    mutate,
    limits: {
      maxMessageBytes: source.limits?.maxMessageBytes ?? null,
      maxNameLength: source.limits?.maxNameLength ?? null,
      maxRecords: source.limits?.maxRecords ?? null,
    },
    safety: {
      rejectTruncatedInput: true,
      rejectMalformedCompression: true,
      rejectLimitExceeded: true,
      preserveTransactionId: true,
    },
  };
}

export function validateDnsWireParserContract(contract) {
  const errors = [];
  if (contract?.version !== "1.0") errors.push("DNS_WIRE_CONTRACT_VERSION_REQUIRED");
  if (contract?.input !== "RAW_DNS_DATA") errors.push("DNS_WIRE_INPUT_REQUIRED");
  if (contract?.output !== "DNS_MESSAGE") errors.push("DNS_WIRE_OUTPUT_REQUIRED");
  if (contract?.implementation !== "APPLICATION_RUNTIME") errors.push("DNS_WIRE_IMPLEMENTATION_REQUIRED");

  for (const section of Object.values(DnsWireSection)) {
    if (!contract?.sections?.includes(section)) errors.push(`DNS_WIRE_SECTION_REQUIRED:${section}`);
  }

  for (const field of ["maxMessageBytes", "maxNameLength", "maxRecords"]) {
    const value = contract?.limits?.[field];
    if (!POSITIVE(value)) errors.push(`DNS_WIRE_LIMIT_REQUIRED:${field}`);
    else if (value <= 0) errors.push(`DNS_WIRE_LIMIT_INVALID:${field}`);
  }

  const allowed = new Set(Object.values(DnsWireRecordType));
  for (const type of [...(contract?.inspect || []), ...(contract?.mutate || [])]) {
    if (!allowed.has(type)) errors.push(`DNS_WIRE_RECORD_TYPE_UNSUPPORTED:${type}`);
  }

  if (contract?.safety?.rejectTruncatedInput !== true) errors.push("DNS_WIRE_TRUNCATION_POLICY_REQUIRED");
  if (contract?.safety?.rejectMalformedCompression !== true) errors.push("DNS_WIRE_COMPRESSION_POLICY_REQUIRED");
  if (contract?.safety?.rejectLimitExceeded !== true) errors.push("DNS_WIRE_LIMIT_POLICY_REQUIRED");

  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}
