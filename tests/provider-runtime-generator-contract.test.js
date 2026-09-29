import test from "node:test";
import assert from "node:assert/strict";
import { createProviderRuntimeGeneratorContract, validateProviderRuntimeGeneratorContract, isProviderRuntimeGeneratorAdmissionAllowed, GeneratorLanguage, GeneratorRuntimeTarget, GeneratorUnit } from "../packages/apple-adapter/src/provider-runtime-generator-contract.js";
import { createProviderRuntimeIR } from "../packages/apple-adapter/src/provider-runtime-ir.js";

const ir = createProviderRuntimeIR({
  sourceChainId: "dns-chain-a",
  parser: { limits: { maxMessageBytes: 4096, maxNameLength: 255, maxRecords: 256 }, inspect: ["A", "AAAA"] },
  stages: [{ id: "a", order: 1 }, { id: "b", order: 2, dependsOn: ["a"] }],
  transports: ["UDP", "DOH"],
  resources: { maxBufferedBytes: 65536, perFlowBufferedBytes: 16384, maxConcurrentFlows: 32 },
});

test("generator contract maps every runtime IR domain", () => {
  const contract = createProviderRuntimeGeneratorContract({});
  assert.equal(contract.input.contract, "PROVIDER_RUNTIME_IR");
  assert.equal(contract.output.language, GeneratorLanguage.SWIFT);
  assert.equal(contract.output.runtimeTarget, GeneratorRuntimeTarget.NETWORK_EXTENSION);
  assert.deepEqual(contract.mapping.units, Object.values(GeneratorUnit));
  assert.equal(contract.generator.deterministic, true);
  assert.equal(contract.generator.semanticInvention, false);
  assert.equal(validateProviderRuntimeGeneratorContract(contract).valid, true);
});

test("generator admission requires a valid runtime IR", () => {
  const contract = createProviderRuntimeGeneratorContract({});
  const result = isProviderRuntimeGeneratorAdmissionAllowed({ contract, runtimeIR: ir });
  assert.equal(result.allowed, true);
});

test("generator admission fails closed for invalid runtime IR", () => {
  const contract = createProviderRuntimeGeneratorContract({});
  const result = isProviderRuntimeGeneratorAdmissionAllowed({ contract, runtimeIR: { version: "1.0", targetEngine: "APPLE_DNS_PROXY_PROVIDER" } });
  assert.equal(result.allowed, false);
  assert.equal(result.runtimeIR.valid, false);
});

test("generator contract rejects semantic invention and stage reordering", () => {
  const contract = createProviderRuntimeGeneratorContract({});
  const invalid = { ...contract, generator: { ...contract.generator, semanticInvention: true, stageOrderPreserved: false } };
  const result = validateProviderRuntimeGeneratorContract(invalid);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("PROVIDER_RUNTIME_GENERATOR_SEMANTIC_INVENTION_FORBIDDEN"));
  assert.ok(result.errors.includes("PROVIDER_RUNTIME_GENERATOR_STAGE_ORDER_REQUIRED"));
});