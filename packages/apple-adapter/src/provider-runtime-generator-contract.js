import { validateProviderRuntimeIR } from "./provider-runtime-ir.js";

export const GeneratorLanguage = Object.freeze({ SWIFT: "SWIFT" });
export const GeneratorRuntimeTarget = Object.freeze({ NETWORK_EXTENSION: "NETWORK_EXTENSION" });
export const GeneratorUnit = Object.freeze({ FLOW: "FLOW", DNS_WIRE_PARSER: "DNS_WIRE_PARSER", STAGE: "STAGE", TRANSPORT: "TRANSPORT", FAILURE: "FAILURE", RESOURCES: "RESOURCES", LIFECYCLE: "LIFECYCLE" });

const SUPPORTED_LANGUAGES = new Set(Object.values(GeneratorLanguage));
const SUPPORTED_TARGETS = new Set(Object.values(GeneratorRuntimeTarget));
const SUPPORTED_UNITS = new Set(Object.values(GeneratorUnit));
const NON_EMPTY = value => typeof value === "string" && value.trim().length > 0;

export function createProviderRuntimeGeneratorContract(input = {}) {
  const language = input.language || GeneratorLanguage.SWIFT;
  const runtimeTarget = input.runtimeTarget || GeneratorRuntimeTarget.NETWORK_EXTENSION;
  const entrypoint = NON_EMPTY(input.entrypoint) ? input.entrypoint.trim() : "DNSProxyProvider";
  const units = Array.isArray(input.units) && input.units.length ? [...new Set(input.units.filter(unit => SUPPORTED_UNITS.has(unit)))] : Object.values(GeneratorUnit);
  return Object.freeze({
    version: "1.0",
    input: { contract: "PROVIDER_RUNTIME_IR", version: "1.0", required: true },
    output: { artifact: "GENERATED_RUNTIME_SOURCE", language, runtimeTarget, implementation: "GENERATED_APPLICATION_RUNTIME" },
    generator: { deterministic: true, semanticInvention: false, failClosed: true, provenancePreserved: true, stageOrderPreserved: true },
    mapping: {
      units,
      source: { flow: "FLOW", parser: "DNS_WIRE_PARSER", stages: "STAGE", transports: "TRANSPORT", failure: "FAILURE", resources: "RESOURCES", lifecycle: "LIFECYCLE" }
    },
    forbidden: [
      "FLATTEN_ORDERED_STAGES_TO_NATIVE_RESOLVER_LIST",
      "DROP_UNSUPPORTED_RUNTIME_COMPONENT",
      "INVENT_APPLE_CAPABILITY",
      "REORDER_STAGE_SEMANTICS",
      "ALTER_FAILURE_SEMANTICS",
      "DROP_PROVENANCE"
    ],
    artifact: { language, runtimeTarget, entrypoint, files: [], units: [], sourceChainId: null }
  });
}

export function validateProviderRuntimeGeneratorContract(contract) {
  const errors = [];
  if (contract?.version !== "1.0") errors.push("PROVIDER_RUNTIME_GENERATOR_VERSION_REQUIRED");
  if (contract?.input?.contract !== "PROVIDER_RUNTIME_IR") errors.push("PROVIDER_RUNTIME_GENERATOR_INPUT_REQUIRED");
  if (contract?.input?.version !== "1.0") errors.push("PROVIDER_RUNTIME_GENERATOR_INPUT_VERSION_REQUIRED");
  if (!SUPPORTED_LANGUAGES.has(contract?.output?.language)) errors.push("PROVIDER_RUNTIME_GENERATOR_LANGUAGE_UNSUPPORTED");
  if (!SUPPORTED_TARGETS.has(contract?.output?.runtimeTarget)) errors.push("PROVIDER_RUNTIME_GENERATOR_TARGET_UNSUPPORTED");
  if (contract?.output?.artifact !== "GENERATED_RUNTIME_SOURCE") errors.push("PROVIDER_RUNTIME_GENERATOR_OUTPUT_REQUIRED");
  for (const key of ["deterministic", "semanticInvention", "failClosed", "provenancePreserved", "stageOrderPreserved"]) {
    if (typeof contract?.generator?.[key] !== "boolean") errors.push("PROVIDER_RUNTIME_GENERATOR_INVARIANT_REQUIRED:" + key);
  }
  if (contract?.generator?.deterministic !== true) errors.push("PROVIDER_RUNTIME_GENERATOR_DETERMINISM_REQUIRED");
  if (contract?.generator?.semanticInvention !== false) errors.push("PROVIDER_RUNTIME_GENERATOR_SEMANTIC_INVENTION_FORBIDDEN");
  if (contract?.generator?.failClosed !== true) errors.push("PROVIDER_RUNTIME_GENERATOR_FAIL_CLOSED_REQUIRED");
  if (contract?.generator?.provenancePreserved !== true) errors.push("PROVIDER_RUNTIME_GENERATOR_PROVENANCE_REQUIRED");
  if (contract?.generator?.stageOrderPreserved !== true) errors.push("PROVIDER_RUNTIME_GENERATOR_STAGE_ORDER_REQUIRED");
  if (!Array.isArray(contract?.mapping?.units) || contract.mapping.units.length === 0) errors.push("PROVIDER_RUNTIME_GENERATOR_MAPPING_REQUIRED");
  else for (const unit of contract.mapping.units) if (!SUPPORTED_UNITS.has(unit)) errors.push("PROVIDER_RUNTIME_GENERATOR_UNIT_UNSUPPORTED:" + unit);
  if (!Array.isArray(contract?.forbidden) || contract.forbidden.length === 0) errors.push("PROVIDER_RUNTIME_GENERATOR_FORBIDDEN_RULES_REQUIRED");
  if (!NON_EMPTY(contract?.artifact?.entrypoint)) errors.push("PROVIDER_RUNTIME_GENERATOR_ENTRYPOINT_REQUIRED");
  if (!Array.isArray(contract?.artifact?.files)) errors.push("PROVIDER_RUNTIME_GENERATOR_FILES_REQUIRED");
  if (!Array.isArray(contract?.artifact?.units)) errors.push("PROVIDER_RUNTIME_GENERATOR_ARTIFACT_UNITS_REQUIRED");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze([...new Set(errors)]) });
}

export function isProviderRuntimeGeneratorAdmissionAllowed({ contract, runtimeIR } = {}) {
  const contractResult = validateProviderRuntimeGeneratorContract(contract);
  const irResult = validateProviderRuntimeIR(runtimeIR);
  return Object.freeze({ allowed: contractResult.valid && irResult.valid, contract: contractResult, runtimeIR: irResult });
}