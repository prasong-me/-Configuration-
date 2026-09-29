import { createProviderRuntimeContract, validateProviderRuntimeContract } from "./provider-runtime-contract.js";
import { createDnsWireParserContract, validateDnsWireParserContract } from "./dns-wire-contract.js";
import {
  createProviderStageContract,
  validateProviderStageContract,
  resolveProviderStageExecutionOrder,
} from "./provider-stage-contract.js";
import {
  createProviderTransportContract,
  validateProviderTransportContract,
} from "./provider-transport-contract.js";

const stable = value => {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  }
  return value;
};

const canonicalJson = value => JSON.stringify(stable(value));

export function createProviderRuntimeIR(input = {}) {
  const runtime = createProviderRuntimeContract(input.runtime || input);
  const parser = createDnsWireParserContract(input.parser || runtime.parser);
  const rawStages = Array.isArray(input.stages) && input.stages.length ? input.stages : runtime.stages;
  const stages = rawStages.map(stage => createProviderStageContract(stage));
  const transports = createProviderTransportContract({
    transports: Array.isArray(input.transports) && input.transports.length
      ? input.transports
      : runtime.transports,
  });

  const execution = resolveProviderStageExecutionOrder(stages);
  const provenance = {
    sourceChainId: typeof input.sourceChainId === "string" && input.sourceChainId.trim()
      ? input.sourceChainId.trim()
      : null,
  };

  return Object.freeze({
    version: "1.0",
    targetEngine: "APPLE_DNS_PROXY_PROVIDER",
    provenance,
    flow: stable(runtime.flow),
    parser: stable(parser),
    stages: execution.valid ? execution.stages.map(stable) : stages.map(stable),
    transports: stable(transports),
    failure: stable(runtime.failure),
    resources: stable(runtime.resources),
    lifecycle: stable(runtime.lifecycle),
  });
}

export function validateProviderRuntimeIR(ir) {
  const errors = [];

  if (ir?.version !== "1.0") errors.push("PROVIDER_RUNTIME_IR_VERSION_REQUIRED");
  if (ir?.targetEngine !== "APPLE_DNS_PROXY_PROVIDER") errors.push("PROVIDER_RUNTIME_IR_TARGET_REQUIRED");

  const runtime = {
    version: ir?.version,
    targetEngine: ir?.targetEngine,
    stages: ir?.stages,
    transports: ir?.transports?.transports,
    parser: ir?.parser,
    failure: ir?.failure,
    resources: ir?.resources,
  };
  const runtimeResult = validateProviderRuntimeContract(runtime);
  if (!runtimeResult.valid) errors.push(...runtimeResult.errors.map(error => `RUNTIME:${error}`));

  const parserResult = validateDnsWireParserContract(ir?.parser);
  if (!parserResult.valid) errors.push(...parserResult.errors.map(error => `PARSER:${error}`));

  const transportResult = validateProviderTransportContract(ir?.transports);
  if (!transportResult.valid) errors.push(...transportResult.errors.map(error => `TRANSPORT:${error}`));

  const stageResults = (ir?.stages || []).map(validateProviderStageContract);
  stageResults.forEach((result, index) => {
    if (!result.valid) errors.push(...result.errors.map(error => `STAGE:${index}:${error}`));
  });

  const execution = resolveProviderStageExecutionOrder(ir?.stages || []);
  if (!execution.valid) errors.push(...execution.errors.map(error => `GRAPH:${error}`));
  else if (execution.stages.length !== (ir?.stages || []).length) errors.push("GRAPH:PROVIDER_STAGE_COUNT_MISMATCH");

  if (!ir?.parser?.limits || Object.values(ir.parser.limits).some(value => !Number.isInteger(value) || value <= 0)) {
    errors.push("PARSER:BOUNDED_LIMITS_REQUIRED");
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze([...new Set(errors)]),
  });
}

export function isProviderRuntimeIRAdmissionAllowed(ir) {
  return validateProviderRuntimeIR(ir).valid;
}

export function canonicalizeProviderRuntimeIR(ir) {
  return canonicalJson(ir);
}
