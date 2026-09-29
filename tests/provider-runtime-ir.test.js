import test from "node:test";
import assert from "node:assert/strict";
import {
  createProviderRuntimeIR,
  validateProviderRuntimeIR,
  isProviderRuntimeIRAdmissionAllowed,
  canonicalizeProviderRuntimeIR,
} from "../packages/apple-adapter/src/provider-runtime-ir.js";

const base = {
  sourceChainId: "dns-chain-a",
  parser: {
    limits: { maxMessageBytes: 4096, maxNameLength: 255, maxRecords: 256 },
    inspect: ["A", "AAAA"],
  },
  stages: [
    { id: "a", order: 1 },
    { id: "b", order: 2, dependsOn: ["a"] },
    { id: "c", order: 3, dependsOn: ["b"] },
  ],
  transports: ["UDP", "DOT", "DOH"],
  resources: { maxBufferedBytes: 65536, perFlowBufferedBytes: 16384, maxConcurrentFlows: 32 },
};

test("Runtime IR composes parser, stages, transports, lifecycle and resource contracts", () => {
  const ir = createProviderRuntimeIR(base);
  assert.equal(ir.targetEngine, "APPLE_DNS_PROXY_PROVIDER");
  assert.equal(ir.parser.output, "DNS_MESSAGE");
  assert.deepEqual(ir.stages.map(stage => stage.id), ["a", "b", "c"]);
  assert.deepEqual(ir.transports.transports, ["UDP", "DOT", "DOH"]);
  assert.equal(ir.resources.maxConcurrentFlows, 32);
  assert.deepEqual(ir.lifecycle.terminalStates, ["STOPPED", "FAILED"]);
  assert.equal(validateProviderRuntimeIR(ir).valid, true);
});

test("Runtime IR rejects cyclic stage graphs", () => {
  const ir = createProviderRuntimeIR({
    ...base,
    stages: [
      { id: "a", order: 1, dependsOn: ["b"] },
      { id: "b", order: 2, dependsOn: ["a"] },
    ],
  });
  const result = validateProviderRuntimeIR(ir);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes("GRAPH:PROVIDER_STAGE_DEPENDENCY_CYCLE")));
  assert.equal(isProviderRuntimeIRAdmissionAllowed(ir), false);
});

test("Runtime IR fails closed when parser bounds are absent", () => {
  const ir = createProviderRuntimeIR({
    ...base,
    parser: {},
  });
  const result = validateProviderRuntimeIR(ir);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes("DNS_WIRE_LIMIT_REQUIRED:maxMessageBytes")));
});

test("Runtime IR canonicalization is deterministic", () => {
  const a = createProviderRuntimeIR(base);
  const b = createProviderRuntimeIR({
    ...base,
    stages: [...base.stages].reverse(),
    transports: ["DOH", "UDP", "DOT"],
  });
  assert.equal(canonicalizeProviderRuntimeIR(a), canonicalizeProviderRuntimeIR(b));
});


test("canonicalization is stable for reordered dependency and parser sets", () => {
  const a = createProviderRuntimeIR({ sourceChainId: "x", parser: { limits: { maxMessageBytes: 4096, maxNameLength: 255, maxRecords: 10 }, inspect: ["AAAA", "A"], mutate: ["CNAME", "A"] }, stages: [{ id: "a", order: 1, dependsOn: [] }, { id: "b", order: 2, dependsOn: ["a"] }] });
  const b = createProviderRuntimeIR({ sourceChainId: "x", parser: { limits: { maxRecords: 10, maxNameLength: 255, maxMessageBytes: 4096 }, inspect: ["A", "AAAA"], mutate: ["A", "CNAME"] }, stages: [{ id: "a", order: 1, dependsOn: [] }, { id: "b", order: 2, dependsOn: ["a"] }] });
  assert.equal(canonicalizeProviderRuntimeIR(a), canonicalizeProviderRuntimeIR(b));
});
