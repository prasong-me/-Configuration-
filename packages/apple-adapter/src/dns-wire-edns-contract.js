export const DnsWireEdnsVersion = Object.freeze({ V0: 0 });

export const DnsWireEdnsOption = Object.freeze({
  CODE: "UINT16",
  LENGTH: "UINT16",
  DATA: "OCTETS",
});

export function createDnsWireEdnsContract(input = {}) {
  const source = input?.edns ?? input;
  return {
    version: "1.0",
    rrType: 41,
    ownerName: "ROOT",
    udpPayloadSize: "REQUIRED",
    extendedRcode: "REQUIRED",
    versionField: source.version ?? DnsWireEdnsVersion.V0,
    doBit: "EXPLICIT",
    zBits: "EXPLICIT",
    options: "OPTION_SEQUENCE",
    optionEncoding: Object.freeze({ ...DnsWireEdnsOption }),
    determinism: true,
    failClosed: true,
  };
}

export function validateDnsWireEdnsContract(contract) {
  const errors = [];
  if (contract?.version !== "1.0") errors.push("DNS_WIRE_EDNS_VERSION_REQUIRED");
  if (contract?.rrType !== 41) errors.push("DNS_WIRE_EDNS_RR_TYPE_REQUIRED");
  if (contract?.ownerName !== "ROOT") errors.push("DNS_WIRE_EDNS_OWNER_ROOT_REQUIRED");
  if (contract?.udpPayloadSize !== "REQUIRED") errors.push("DNS_WIRE_EDNS_UDP_PAYLOAD_REQUIRED");
  if (contract?.extendedRcode !== "REQUIRED") errors.push("DNS_WIRE_EDNS_EXTENDED_RCODE_REQUIRED");
  if (contract?.versionField !== 0) errors.push("DNS_WIRE_EDNS_VERSION_UNSUPPORTED");
  if (contract?.doBit !== "EXPLICIT") errors.push("DNS_WIRE_EDNS_DO_BIT_REQUIRED");
  if (contract?.zBits !== "EXPLICIT") errors.push("DNS_WIRE_EDNS_Z_BITS_REQUIRED");
  if (contract?.options !== "OPTION_SEQUENCE") errors.push("DNS_WIRE_EDNS_OPTIONS_REQUIRED");
  if (contract?.determinism !== true) errors.push("DNS_WIRE_EDNS_DETERMINISM_REQUIRED");
  if (contract?.failClosed !== true) errors.push("DNS_WIRE_EDNS_FAIL_CLOSED_REQUIRED");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}
