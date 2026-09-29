import {
  StageResult,
  StageFailureResult,
  StageMutationMode,
  validateProviderStageContract,
  resolveProviderStageExecutionOrder,
} from "./provider-stage-contract.js";

const FAILURE_TYPES = Object.freeze({
  PARSE: "PARSE",
  UPSTREAM: "UPSTREAM",
});

const isObject = value => value !== null && typeof value === "object";

function cloneContext(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function immutableContext(value) {
  if (!isObject(value)) return value;
  const seen = new WeakSet();
  const freeze = current => {
    if (!isObject(current) || seen.has(current)) return current;
    seen.add(current);
    for (const key of Object.keys(current)) freeze(current[key]);
    return Object.freeze(current);
  };
  return freeze(cloneContext(value));
}

function failure(error, stage, failureType) {
  const action = failureType === FAILURE_TYPES.PARSE
    ? stage.failure.onParseError
    : stage.failure.onUpstreamError;
  return {
    kind: "FAILURE",
    stageId: stage.id,
    failureType,
    action,
    error,
  };
}

async function runWithTimeout(handler, context, stage) {
  if (!stage.timeoutMs) return handler(context, stage);
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(() => handler(context, stage)),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          const error = new Error(`Provider stage timed out: ${stage.id}`);
          error.code = "PROVIDER_STAGE_TIMEOUT";
          reject(error);
        }, stage.timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function createProviderStageExecutionEngine({ stages = [], handlers = {} } = {}) {
  const validation = stages.map(validateProviderStageContract);
  const validationErrors = validation.flatMap(result => result.errors);
  const execution = resolveProviderStageExecutionOrder(stages);

  if (validationErrors.length || !execution.valid) {
    return Object.freeze({
      valid: false,
      errors: Object.freeze([...validationErrors, ...execution.errors]),
      async execute() {
        return {
          kind: "FAILURE",
          failureType: "CONTRACT",
          action: "FAST_FAIL",
          errors: [...validationErrors, ...execution.errors],
        };
      },
    });
  }

  return Object.freeze({
    valid: true,
    errors: Object.freeze([]),
    order: Object.freeze(execution.stages.map(stage => stage.id)),
    async execute(initialContext = {}) {
      let context = cloneContext(initialContext);
      const trace = [];

      for (const stage of execution.stages) {
        const handler = handlers[stage.id];
        if (typeof handler !== "function") {
          return {
            kind: "FAILURE",
            stageId: stage.id,
            failureType: "HANDLER_MISSING",
            action: StageFailureResult.ERROR,
            trace,
          };
        }

        const stageContext = stage.mutation === StageMutationMode.MUTABLE
          ? cloneContext(context)
          : immutableContext(context);

        try {
          const output = await runWithTimeout(handler, stageContext, stage);
          const result = isObject(output) ? output.result : output;

          if (!Object.values(StageResult).includes(result)) {
            return {
              kind: "FAILURE",
              stageId: stage.id,
              failureType: "INVALID_STAGE_RESULT",
              action: StageFailureResult.ERROR,
              trace,
            };
          }

          if (stage.mutation === StageMutationMode.MUTABLE && isObject(output) && "context" in output) {
            context = cloneContext(output.context);
          }

          trace.push(Object.freeze({ stageId: stage.id, result }));

          if (result !== StageResult.CONTINUE) {
            return { kind: "TERMINAL", result, stageId: stage.id, context, trace };
          }
        } catch (error) {
          if (error?.code === "PROVIDER_STAGE_TIMEOUT") {
            return {
              kind: "FAILURE",
              stageId: stage.id,
              failureType: "TIMEOUT",
              action: stage.failure.onTimeout,
              error,
              trace,
            };
          }

          const failureType = error?.failureType === FAILURE_TYPES.PARSE
            ? FAILURE_TYPES.PARSE
            : FAILURE_TYPES.UPSTREAM;
          const result = failure(error, stage, failureType);
          result.trace = trace;
          return result;
        }
      }

      return { kind: "CONTINUE", context, trace };
    },
  });
}

export { FAILURE_TYPES };
