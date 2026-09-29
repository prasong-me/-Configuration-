import test from "node:test";
import assert from "node:assert/strict";
import {
  ProviderFailureAction,
  ProviderTransport,
  createProviderRuntimeContract,
  isProviderRuntimeAdmissionAllowed,
  validateProviderRuntimeContract,
} from "../packages/apple-adapter/src/provider-runtime-contract.js";

test("Provider Runtime Contract models OS flow I/O separately from application parser", () => {
  const contract = createProviderRuntimeContract({
    stages: [{ id: "a", order: 1 }],
    transports: [ProviderTransport.DOH],
  });
  assert.deepEqual(contract.flow.transport, ["UDP", "TCP"]);
  assert.equal(contract.parser.input, "RAW_DNS_DATA");
  assert.equal(contract.parser.implementation, "APPLICATION_RUNTIME");
});

test("Provider Runtime Contract preserves explicit A-to-B-to-C stage dependencies", () => {
  const contract = createProviderRuntimeContract({
    stages: [
      { id: "a", order: 1 },
      { id: "b", order: 2, dependsOn: ["a"] },
      { id: "c", order: 3, dependsOn: ["b"] },
    ],
    transports: [ProviderTransport.UDP, ProviderTransport.DOT, ProviderTransport.DOH],
  });
  assert.deepEqual(contract.stages.map(stage => stage.id), ["a", "b", "c"]);
  assert.deepEqual(contract.stages[2].dependsOn, ["b"]);
  assert.equal(validateProviderRuntimeContract(contract).valid, true);
});

test("Provider Runtime Contract rejects an unresolved stage dependency", () => {
  const contract = createProviderRuntimeContract({
    stages: [{ id: "b", order: 1, dependsOn: ["a"] }],
    transports: [ProviderTransport.UDP],
  });
  const result = validateProviderRuntimeContract(contract);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("PROVIDER_RUNTIME_STAGE_DEPENDENCY_ORDER:b:a"));
  assert.equal(isProviderRuntimeAdmissionAllowed(contract), false);
});

test("Provider Runtime Contract requires explicit resource budgets without hard-coding a platform memory ceiling", () => {
  const contract = createProviderRuntimeContract({
    stages: [{ id: "a", order: 1, timeoutMs: 1000 }],
    transports: [ProviderTransport.TCP],
    resources: { maxBufferedBytes: 65536, perFlowBufferedBytes: 16384, maxConcurrentFlows: 32 },
    failure: { timeout: ProviderFailureAction.FAST_FAIL },
  });
  assert.equal(contract.resources.maxBufferedBytes, 65536);
  assert.equal(contract.resources.perFlowBufferedBytes, 16384);
  assert.equal(contract.resources.maxConcurrentFlows, 32);
  assert.equal(Object.prototype.hasOwnProperty.call(contract.resources, "memoryLimitMb"), false);
  assert.equal(isProviderRuntimeAdmissionAllowed(contract), true);
});
