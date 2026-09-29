export const DnsWireEncoderCompression = Object.freeze({
  NONE: "NONE",
});

export const DnsWireEncoderRdataMode = Object.freeze({
  A: "IPV4_OCTETS",
  AAAA: "IPV6_OCTETS",
  CNAME: "DOMAIN_NAME",
  MX: "MX",
  NS: "DOMAIN_NAME",
  PTR: "DOMAIN_NAME",
  SRV: "SRV",
  TXT: "TXT_CHUNKS",
  SVCB: "SVCB_PARAMETERS",
  HTTPS: "SVCB_PARAMETERS",
});

const SUPPORTED = new Set(["A", "AAAA", "CNAME", "MX", "NS", "PTR", "SRV", "TXT", "SVCB", "HTTPS"]);

export function createDnsWireEncoderContract(input = {}) {
  const source = input?.encoder ?? input;
  return {
    version: "1.0",
    input: "DNS_MESSAGE",
    output: "RAW_DNS_DATA",
    implementation: "APPLICATION_RUNTIME",
    operations: { encode: "REQUIRED" },
    header: { transactionId: "REQUIRED", flags: "REQUIRED", counts: "DERIVED" },
    compression: source.compression ?? DnsWireEncoderCompression.NONE,
    rdataModes: Object.freeze({ ...DnsWireEncoderRdataMode }),
    supportedRecordTypes: [...SUPPORTED],
    determinism: true,
    semanticInvention: false,
    failClosed: true,
    preserveTransactionId: true,
  };
}

export function validateDnsWireEncoderContract(contract) {
  const errors = [];
  if (contract?.version !== "1.0") errors.push("DNS_WIRE_ENCODER_VERSION_REQUIRED");
  if (contract?.input !== "DNS_MESSAGE") errors.push("DNS_WIRE_ENCODER_INPUT_REQUIRED");
  if (contract?.output !== "RAW_DNS_DATA") errors.push("DNS_WIRE_ENCODER_OUTPUT_REQUIRED");
  if (contract?.implementation !== "APPLICATION_RUNTIME") errors.push("DNS_WIRE_ENCODER_IMPLEMENTATION_REQUIRED");
  if (contract?.operations?.encode !== "REQUIRED") errors.push("DNS_WIRE_ENCODER_OPERATION_REQUIRED");
  if (contract?.compression !== DnsWireEncoderCompression.NONE) errors.push("DNS_WIRE_ENCODER_COMPRESSION_UNSUPPORTED");
  if (contract?.header?.transactionId !== "REQUIRED") errors.push("DNS_WIRE_ENCODER_TRANSACTION_ID_REQUIRED");
  if (contract?.header?.flags !== "REQUIRED") errors.push("DNS_WIRE_ENCODER_FLAGS_REQUIRED");
  if (contract?.header?.counts !== "DERIVED") errors.push("DNS_WIRE_ENCODER_COUNTS_MUST_BE_DERIVED");
  if (contract?.determinism !== true) errors.push("DNS_WIRE_ENCODER_DETERMINISM_REQUIRED");
  if (contract?.semanticInvention !== false) errors.push("DNS_WIRE_ENCODER_SEMANTIC_INVENTION_FORBIDDEN");
  if (contract?.failClosed !== true) errors.push("DNS_WIRE_ENCODER_FAIL_CLOSED_REQUIRED");
  if (contract?.preserveTransactionId !== true) errors.push("DNS_WIRE_ENCODER_TRANSACTION_ID_PRESERVATION_REQUIRED");
  for (const type of SUPPORTED) {
    if (!contract?.supportedRecordTypes?.includes(type)) errors.push(`DNS_WIRE_ENCODER_RECORD_TYPE_REQUIRED:${type}`);
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}
