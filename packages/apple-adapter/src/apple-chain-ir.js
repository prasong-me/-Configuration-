// Apple Chain Composition Layer.
// Evidence-backed boundary between the canonical DNS pipeline and Apple adapters.
// This layer does not invent Apple policy and never treats ServerAddresses as ordered execution.

export const AppleClassification = Object.freeze({
  REPRESENTABLE: "REPRESENTABLE",
  TRANSFORMABLE: "TRANSFORMABLE",
  UNSUPPORTED: "UNSUPPORTED",
  UNKNOWN: "UNKNOWN",
});

export const AppleTopology = Object.freeze({
  EMPTY: "EMPTY",
  SINGLE: "SINGLE",
  LINEAR: "LINEAR",
  BRANCH: "BRANCH",
  FAN_OUT: "FAN_OUT",
  FAN_IN: "FAN_IN",
  CONDITIONAL: "CONDITIONAL",
  MULTI_CHAIN: "MULTI_CHAIN",
});

const stable = value => {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.keys(value).sort().reduce((out, key) => {
      out[key] = stable(value[key]);
      return out;
    }, {});
  }
  return value;
};

const canonicalJson = value => JSON.stringify(stable(value));
const isNonEmptyString = value => typeof value === "string" && value.trim().length > 0;

function normalizeStages(input = {}) {
  const source = input?.policy ?? input ?? {};
  const raw = Array.isArray(source.dnsPipeline)
    ? source.dnsPipeline
    : Array.isArray(source.dnsStages) ? source.dnsStages : [];
  return raw
    .map((stage, index) => ({
      id: isNonEmptyString(stage?.id) ? stage.id.trim() : `stage-${index + 1}`,
      order: Number.isFinite(Number(stage?.order)) ? Number(stage.order) : index,
      dependsOn: Array.isArray(stage?.dependsOn) ? stage.dependsOn.filter(isNonEmptyString).map(v => v.trim()) : [],
      enabled: stage?.enabled !== false,
      protocol: isNonEmptyString(stage?.protocol) ? stage.protocol.trim().toUpperCase() : null,
      endpoint: isNonEmptyString(stage?.endpoint) ? stage.endpoint.trim() : null,
      role: isNonEmptyString(stage?.role) ? stage.role.trim() : null,
      onMatch: isNonEmptyString(stage?.onMatch) ? stage.onMatch.trim().toUpperCase() : null,
      onNoMatch: isNonEmptyString(stage?.onNoMatch) ? stage.onNoMatch.trim().toUpperCase() : null,
    }))
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

export function analyzeAppleChainTopology(input = {}) {
  const stages = normalizeStages(input);
  if (!stages.length) return Object.freeze({topology: AppleTopology.EMPTY, stages: [], edges: []});
  if (stages.length === 1) return Object.freeze({topology: AppleTopology.SINGLE, stages, edges: []});

  const ids = new Set(stages.map(stage => stage.id));
  const edges = [];
  for (const stage of stages) {
    for (const dependency of stage.dependsOn) {
      if (ids.has(dependency)) edges.push({from: dependency, to: stage.id});
    }
  }

  const incoming = new Map(stages.map(stage => [stage.id, 0]));
  const outgoing = new Map(stages.map(stage => [stage.id, 0]));
  for (const edge of edges) {
    incoming.set(edge.to, incoming.get(edge.to) + 1);
    outgoing.set(edge.from, outgoing.get(edge.from) + 1);
  }

  if (stages.some(stage => stage.onMatch || stage.onNoMatch)) {
    return Object.freeze({topology: AppleTopology.CONDITIONAL, stages, edges});
  }
  if ([...outgoing.values()].some(value => value > 1)) {
    return Object.freeze({topology: AppleTopology.FAN_OUT, stages, edges});
  }
  if ([...incoming.values()].some(value => value > 1)) {
    return Object.freeze({topology: AppleTopology.FAN_IN, stages, edges});
  }
  if (edges.length === stages.length - 1) {
    return Object.freeze({topology: AppleTopology.LINEAR, stages, edges});
  }

  return Object.freeze({
    topology: stages.length > 1 ? AppleTopology.MULTI_CHAIN : AppleTopology.SINGLE,
    stages,
    edges,
  });
}

export function createSemanticPreservation(input = {}) {
  const topology = analyzeAppleChainTopology(input);
  const sequential = topology.topology === AppleTopology.LINEAR && topology.stages.length > 1;
  const loss = sequential
    ? [{dimension: "ordering", reason: "Apple ServerAddresses is documented as an unordered list; ordered pipeline execution is not established."}]
    : [];

  return Object.freeze({
    preserved: !sequential,
    dimensions: Object.freeze({
      ordering: !sequential,
      routing: true,
      matching: true,
      fallback: true,
      transformation: true,
      transport: true,
    }),
    loss: Object.freeze(loss),
  });
}

export function classifyAppleDnsChain(input = {}) {
  const topology = analyzeAppleChainTopology(input);
  const preservation = createSemanticPreservation(input);

  if (topology.topology === AppleTopology.EMPTY) {
    return Object.freeze({
      classification: AppleClassification.REPRESENTABLE,
      reasonCode: "APPLE_DNS_NO_CHAIN",
      topology,
      preservation,
      diagnostics: [],
    });
  }

  if (topology.topology === AppleTopology.SINGLE) {
    return Object.freeze({
      classification: AppleClassification.REPRESENTABLE,
      reasonCode: "APPLE_DNS_SINGLE_RESOLVER_CONFIGURATION",
      topology,
      preservation,
      diagnostics: [],
    });
  }

  return Object.freeze({
    classification: AppleClassification.UNKNOWN,
    reasonCode: "APPLE_DNS_CHAIN_SEMANTICS_NOT_ESTABLISHED",
    topology,
    preservation,
    diagnostics: [{
      code: "APPLE_DNS_CHAIN_SEMANTICS_NOT_ESTABLISHED",
      severity: "CRITICAL_TRANSFORMATION",
      message: "Apple documentation does not establish ordered native DNS A→B→C execution semantics for multiple resolver addresses/configurations.",
      nodeIds: topology.stages.map(stage => stage.id),
      impactSummary: "Compilation cannot claim semantic preservation for an ordered DNS pipeline.",
    }],
  });
}

export function createAppleChainIR(input = {}, target = {}) {
  const classification = classifyAppleDnsChain(input);
  const source = input?.policy ?? input ?? {};
  return Object.freeze({
    pipeline: Object.freeze({
      id: isNonEmptyString(source.id) ? source.id.trim() : null,
      sourcePipelineHash: canonicalJson(source),
    }),
    topology: classification.topology,
    target: Object.freeze({
      engine: isNonEmptyString(target.engine) ? target.engine.trim() : "APPLE_NATIVE_DNS",
      composition: isNonEmptyString(target.composition) ? target.composition.trim() : "DIRECT",
    }),
    classification: classification.classification,
    mappings: Object.freeze([]),
    preservation: classification.preservation,
    diagnostics: Object.freeze(classification.diagnostics),
  });
}

export function isAppleChainAdmissionAllowed(ir) {
  if (!ir || ir.classification === AppleClassification.UNKNOWN || ir.classification === AppleClassification.UNSUPPORTED) return false;
  return Boolean(ir.preservation?.preserved);
}
