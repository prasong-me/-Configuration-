export const ProviderRuntimeResult = Object.freeze({
  CONTINUE: "CONTINUE",
  RESPOND: "RESPOND",
  BLOCK: "BLOCK",
  DROP: "DROP",
  ERROR: "ERROR",
  TIMEOUT: "TIMEOUT",
});

export const ProviderTransport = Object.freeze({
  UDP: "UDP",
  TCP: "TCP",
  DOT: "DOT",
  DOH: "DOH",
});

export const ProviderFailureAction = Object.freeze({
  FAST_FAIL: "FAST_FAIL",
  SKIP_STAGE: "SKIP_STAGE",
  FALLBACK: "FALLBACK",
});

export const ProviderLifecycleState = Object.freeze({
  CREATED: "CREATED",
  STARTING: "STARTING",
  RUNNING: "RUNNING",
  STOPPING: "STOPPING",
  STOPPED: "STOPPED",
  FAILED: "FAILED",
});

const POSITIVE = value => Number.isInteger(value) && value > 0;
const NON_EMPTY = value => typeof value === "string" && value.trim().length > 0;
const unique = values => [...new Set(values)];

export function createProviderRuntimeContract(input = {}) {
  const source = input?.providerRuntime ?? input;
  const stages = Array.isArray(source.stages)
    ? source.stages.map((stage, index) => ({
        id: NON_EMPTY(stage?.id) ? stage.id.trim() : `stage-${index + 1}`,
        order: Number.isInteger(stage?.order) ? stage.order : index + 1,
        dependsOn: Array.isArray(stage?.dependsOn)
          ? unique(stage.dependsOn.filter(NON_EMPTY).map(value => value.trim()))
          : [],
        input: "DNS_CONTEXT",
        output: "STAGE_RESULT",
        mutation: stage?.mutation === "MUTABLE_CONTEXT" ? "MUTABLE_CONTEXT" : "IMMUTABLE_CONTEXT",
        timeoutMs: POSITIVE(stage?.timeoutMs) ? stage.timeoutMs : null,
      })).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
    : [];

  const transports = Array.isArray(source.transports)
    ? unique(source.transports.filter(value => Object.values(ProviderTransport).includes(value)))
    : [];

  return {
    version: "1.0",
    targetEngine: "APPLE_DNS_PROXY_PROVIDER",
    flow: {
      input: "OS_INTERCEPTED_DNS_FLOW",
      transport: ["UDP", "TCP"],
      read: ["DATAGRAMS", "STREAM_DATA"],
      write: ["DATAGRAMS", "STREAM_DATA"],
    },
    parser: {
      input: "RAW_DNS_DATA",
      output: "DNS_MESSAGE",
      implementation: "APPLICATION_RUNTIME",
    },
    stages,
    transports,
    failure: {
      timeout: source.failure?.timeout || ProviderFailureAction.FAST_FAIL,
      parseError: source.failure?.parseError || ProviderFailureAction.FAST_FAIL,
      upstreamError: source.failure?.upstreamError || ProviderFailureAction.FALLBACK,
    },
    resources: {
      maxBufferedBytes: source.resources?.maxBufferedBytes ?? null,
      perFlowBufferedBytes: source.resources?.perFlowBufferedBytes ?? null,
      maxConcurrentFlows: source.resources?.maxConcurrentFlows ?? null,
    },
    lifecycle: {
      states: Object.values(ProviderLifecycleState),
      cancellation: "COOPERATIVE",
      terminalStates: [ProviderLifecycleState.STOPPED, ProviderLifecycleState.FAILED],
    },
  };
}

export function validateProviderRuntimeContract(contract) {
  const errors = [];
  if (contract?.version !== "1.0") errors.push("PROVIDER_RUNTIME_CONTRACT_VERSION_REQUIRED");
  if (contract?.targetEngine !== "APPLE_DNS_PROXY_PROVIDER") errors.push("PROVIDER_RUNTIME_TARGET_REQUIRED");
  if (!Array.isArray(contract?.stages) || contract.stages.length === 0) errors.push("PROVIDER_RUNTIME_STAGES_REQUIRED");
  if (!Array.isArray(contract?.transports) || contract.transports.length === 0) errors.push("PROVIDER_RUNTIME_TRANSPORT_REQUIRED");
  if (!contract?.parser || contract.parser.implementation !== "APPLICATION_RUNTIME") errors.push("PROVIDER_RUNTIME_PARSER_REQUIRED");

  const ids = new Set();
  for (const stage of contract?.stages || []) {
    if (!NON_EMPTY(stage.id) || ids.has(stage.id)) errors.push("PROVIDER_RUNTIME_STAGE_ID_UNIQUE");
    ids.add(stage.id);
    if (!POSITIVE(stage.order)) errors.push(`PROVIDER_RUNTIME_STAGE_ORDER_INVALID:${stage.id}`);
    if (stage.timeoutMs !== null && !POSITIVE(stage.timeoutMs)) errors.push(`PROVIDER_RUNTIME_STAGE_TIMEOUT_INVALID:${stage.id}`);
    for (const dependency of stage.dependsOn || []) {
      if (!ids.has(dependency)) errors.push(`PROVIDER_RUNTIME_STAGE_DEPENDENCY_ORDER:${stage.id}:${dependency}`);
    }
  }

  for (const field of ["maxBufferedBytes", "perFlowBufferedBytes", "maxConcurrentFlows"]) {
    const value = contract?.resources?.[field];
    if (value !== null && !POSITIVE(value)) errors.push(`PROVIDER_RUNTIME_RESOURCE_INVALID:${field}`);
  }

  const actions = Object.values(ProviderFailureAction);
  for (const key of ["timeout", "parseError", "upstreamError"]) {
    if (!actions.includes(contract?.failure?.[key])) errors.push(`PROVIDER_RUNTIME_FAILURE_ACTION_INVALID:${key}`);
  }

  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}

export function isProviderRuntimeAdmissionAllowed(contract) {
  return validateProviderRuntimeContract(contract).valid;
}
