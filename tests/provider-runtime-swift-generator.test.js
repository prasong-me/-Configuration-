import test from "node:test";
import assert from "node:assert/strict";
import { createProviderRuntimeGeneratorContract } from "../packages/apple-adapter/src/provider-runtime-generator-contract.js";
import { createProviderRuntimeIR } from "../packages/apple-adapter/src/provider-runtime-ir.js";
import { generateProviderRuntimeSwift, validateGeneratedProviderRuntimeSwift } from "../packages/apple-adapter/src/provider-runtime-swift-generator.js";

const ir = createProviderRuntimeIR({ sourceChainId: "dns-chain-a", parser: { limits: { maxMessageBytes: 4096, maxNameLength: 255, maxRecords: 256 }, inspect: ["A", "AAAA"] }, stages: [{ id: "a", order: 1 }, { id: "b", order: 2, dependsOn: ["a"] }], transports: ["UDP", "DOH"], resources: { maxBufferedBytes: 65536, perFlowBufferedBytes: 16384, maxConcurrentFlows: 32 } });

test("Swift generator produces admitted deterministic source", () => {
  const contract = createProviderRuntimeGeneratorContract({});
  const result = generateProviderRuntimeSwift({ contract, runtimeIR: ir });
  assert.equal(result.status, "GENERATED");
  assert.equal(result.artifact.language, "SWIFT");
  assert.equal(result.artifact.runtimeTarget, "NETWORK_EXTENSION");
  assert.equal(result.artifact.sourceChainId, "dns-chain-a");
  assert.ok(result.artifact.files[0].content.includes("class DNSProxyProvider: NEDNSProxyProvider"));
  assert.ok(result.artifact.files[0].content.includes("handleNewFlow(_ flow: NEAppProxyFlow) -> Bool"));
  assert.ok(result.artifact.files[0].content.includes("return false"));
  assert.ok(result.artifact.files[0].content.indexOf('GeneratedStage(id: "a"') < result.artifact.files[0].content.indexOf('GeneratedStage(id: "b"'));
  assert.equal(validateGeneratedProviderRuntimeSwift(result).valid, true);
});

test("Swift generator fails closed for invalid IR", () => {
  const result = generateProviderRuntimeSwift({ contract: createProviderRuntimeGeneratorContract({}), runtimeIR: { version: "1.0", targetEngine: "APPLE_DNS_PROXY_PROVIDER" } });
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.artifact, null);
});

test("Swift generator is deterministic", () => {
  const contract = createProviderRuntimeGeneratorContract({});
  const a = generateProviderRuntimeSwift({ contract, runtimeIR: ir });
  const b = generateProviderRuntimeSwift({ contract, runtimeIR: ir });
  assert.equal(a.artifact.files[0].content, b.artifact.files[0].content);
});