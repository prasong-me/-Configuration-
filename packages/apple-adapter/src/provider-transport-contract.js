export const ProviderTransportMode = Object.freeze({
  UDP: "UDP",
  TCP: "TCP",
  DOT: "DOT",
  DOH: "DOH",
});

const NON_EMPTY = value => typeof value === "string" && value.trim().length > 0;

export function createProviderTransportContract(input = {}) {
  const transports = Array.isArray(input.transports)
    ? [...new Set(input.transports.filter(value => Object.values(ProviderTransportMode).includes(value)))]
    : [];

  return {
    version: "1.0",
    transports,
    endpoint: {
      input: "TRANSPORT_REQUEST",
      output: "DNS_MESSAGE",
      implementation: "APPLICATION_RUNTIME",
    },
    security: {
      encrypted: transports.filter(value => value === ProviderTransportMode.DOT || value === ProviderTransportMode.DOH),
      plaintext: transports.filter(value => value === ProviderTransportMode.UDP || value === ProviderTransportMode.TCP),
    },
    endpointRequirements: {
      udp: "HOST_PORT",
      tcp: "HOST_PORT",
      dot: "HOST_PORT_SERVER_NAME",
      doh: "HTTPS_URL",
    },
  };
}

export function validateProviderTransportContract(contract) {
  const errors = [];
  if (contract?.version !== "1.0") errors.push("PROVIDER_TRANSPORT_VERSION_REQUIRED");
  if (!Array.isArray(contract?.transports) || contract.transports.length === 0) {
    errors.push("PROVIDER_TRANSPORT_REQUIRED");
  }
  for (const transport of contract?.transports || []) {
    if (!Object.values(ProviderTransportMode).includes(transport)) {
      errors.push(`PROVIDER_TRANSPORT_UNSUPPORTED:${transport}`);
    }
  }
  if (contract?.endpoint?.input !== "TRANSPORT_REQUEST") errors.push("PROVIDER_TRANSPORT_INPUT_REQUIRED");
  if (contract?.endpoint?.output !== "DNS_MESSAGE") errors.push("PROVIDER_TRANSPORT_OUTPUT_REQUIRED");
  if (contract?.endpoint?.implementation !== "APPLICATION_RUNTIME") errors.push("PROVIDER_TRANSPORT_IMPLEMENTATION_REQUIRED");
  for (const key of ["udp", "tcp", "dot", "doh"]) {
    if (!NON_EMPTY(contract?.endpointRequirements?.[key])) {
      errors.push(`PROVIDER_TRANSPORT_ENDPOINT_REQUIREMENT_REQUIRED:${key}`);
    }
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}
