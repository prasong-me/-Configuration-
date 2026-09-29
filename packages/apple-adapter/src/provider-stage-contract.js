export const StageMutationMode = Object.freeze({
  IMMUTABLE: "IMMUTABLE_CONTEXT",
  MUTABLE: "MUTABLE_CONTEXT",
});

export const StageResult = Object.freeze({
  CONTINUE: "CONTINUE",
  RESPOND: "RESPOND",
  BLOCK: "BLOCK",
  DROP: "DROP",
});

export const StageFailureResult = Object.freeze({
  ERROR: "ERROR",
  TIMEOUT: "TIMEOUT",
  FALLBACK: "FALLBACK",
});

const POSITIVE = value => Number.isInteger(value) && value > 0;
const NON_EMPTY = value => typeof value === "string" && value.trim().length > 0;

export function createProviderStageContract(input = {}) {
  return {
    version: "1.0",
    id: NON_EMPTY(input.id) ? input.id.trim() : "stage",
    order: POSITIVE(input.order) ? input.order : 1,
    dependsOn: Array.isArray(input.dependsOn)
      ? [...new Set(input.dependsOn.filter(NON_EMPTY).map(value => value.trim()))]
      : [],
    input: "DNS_CONTEXT",
    output: "STAGE_RESULT",
    mutation: input.mutation === StageMutationMode.MUTABLE ? StageMutationMode.MUTABLE : StageMutationMode.IMMUTABLE,
    resultOnSuccess: Object.values(StageResult).includes(input.resultOnSuccess)
      ? input.resultOnSuccess
      : StageResult.CONTINUE,
    failure: {
      onParseError: Object.values(StageFailureResult).includes(input.onParseError)
        ? input.onParseError
        : StageFailureResult.ERROR,
      onTimeout: Object.values(StageFailureResult).includes(input.onTimeout)
        ? input.onTimeout
        : StageFailureResult.TIMEOUT,
      onUpstreamError: Object.values(StageFailureResult).includes(input.onUpstreamError)
        ? input.onUpstreamError
        : StageFailureResult.FALLBACK,
    },
    timeoutMs: POSITIVE(input.timeoutMs) ? input.timeoutMs : null,
  };
}

export function validateProviderStageContract(stage) {
  const errors = [];
  if (stage?.version !== "1.0") errors.push("PROVIDER_STAGE_VERSION_REQUIRED");
  if (!NON_EMPTY(stage?.id)) errors.push("PROVIDER_STAGE_ID_REQUIRED");
  if (!POSITIVE(stage?.order)) errors.push("PROVIDER_STAGE_ORDER_REQUIRED");
  if (stage?.input !== "DNS_CONTEXT") errors.push("PROVIDER_STAGE_INPUT_REQUIRED");
  if (stage?.output !== "STAGE_RESULT") errors.push("PROVIDER_STAGE_OUTPUT_REQUIRED");
  if (!Object.values(StageMutationMode).includes(stage?.mutation)) errors.push("PROVIDER_STAGE_MUTATION_INVALID");
  if (!Object.values(StageResult).includes(stage?.resultOnSuccess)) errors.push("PROVIDER_STAGE_SUCCESS_RESULT_INVALID");
  if (stage?.timeoutMs !== null && !POSITIVE(stage?.timeoutMs)) errors.push("PROVIDER_STAGE_TIMEOUT_INVALID");
  for (const key of ["onParseError", "onTimeout", "onUpstreamError"]) {
    if (!Object.values(StageFailureResult).includes(stage?.failure?.[key])) {
      errors.push(`PROVIDER_STAGE_FAILURE_RESULT_INVALID:${key}`);
    }
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}

export function resolveProviderStageExecutionOrder(stages = []) {
  const nodes = new Map();
  const errors = [];

  for (const stage of stages) {
    if (nodes.has(stage.id)) {
      errors.push(`PROVIDER_STAGE_ID_DUPLICATE:${stage.id}`);
      continue;
    }
    nodes.set(stage.id, stage);
  }

  for (const stage of stages) {
    for (const dependency of stage.dependsOn || []) {
      if (!nodes.has(dependency)) errors.push(`PROVIDER_STAGE_DEPENDENCY_MISSING:${stage.id}:${dependency}`);
    }
  }
  if (errors.length) return Object.freeze({ valid: false, errors: Object.freeze(errors), stages: Object.freeze([]) });

  const state = new Map();
  const ordered = [];

  const visit = id => {
    const current = state.get(id);
    if (current === "VISITING") {
      errors.push("PROVIDER_STAGE_DEPENDENCY_CYCLE");
      return;
    }
    if (current === "VISITED") return;
    state.set(id, "VISITING");
    const stage = nodes.get(id);
    for (const dependency of stage.dependsOn || []) visit(dependency);
    state.set(id, "VISITED");
    ordered.push(stage);
  };

  [...nodes.keys()]
    .sort((a, b) => nodes.get(a).order - nodes.get(b).order || a.localeCompare(b))
    .forEach(visit);

  if (errors.length) return Object.freeze({ valid: false, errors: Object.freeze([...new Set(errors)]), stages: Object.freeze([]) });

  return Object.freeze({
    valid: true,
    errors: Object.freeze([]),
    stages: Object.freeze(ordered),
  });
}
