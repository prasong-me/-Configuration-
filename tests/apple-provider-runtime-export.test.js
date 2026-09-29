import test from "node:test";
import assert from "node:assert/strict";
import { createConfigurationExporter } from "../packages/core/src/exporter.js";
import { createProviderRuntimeIR } from "../packages/apple-adapter/src/provider-runtime-ir.js";

const runtimeIR = createProviderRuntimeIR({
  sourceChainId: "dns-chain-a",
  parser: {
    limits: { maxMessageBytes: 4096, maxNameLength: 255, maxRecords: 256 },
    inspect: ["A", "AAAA"],
  },
  stages: [
    { id: "a", order: 1 },
    { id: "b", order: 2, dependsOn: ["a"] },
  ],
  transports: ["UDP", "DOH"],
  resources: { maxBufferedBytes: 65536, perFlowBufferedBytes: 16384, maxConcurrentFlows: 32 },
});

test("exporter integrates explicit Provider Runtime IR without native DNS flattening", () => {
  const result = createConfigurationExporter().export({
    status: "SUCCESS",
    policy: {
      name: "Provider Runtime",
      providerRuntimeIR: runtimeIR,
    },
    resultMetadata: { status: "SUCCESS", timestamp: "t0" },
  }, "apple-dns-proxy-provider-runtime");

  assert.equal(result.status, "EXPORTED");
  assert.equal(result.outputFormat, "text");
  assert.match(result.artifact, /class DNSProxyProvider: NEDNSProxyProvider/);
  assert.match(result.artifact, /GeneratedStage\(id: "a"/);
  assert.match(result.artifact, /GeneratedStage\(id: "b"/);
  assert.ok(result.artifact.indexOf('GeneratedStage(id: "a"') < result.artifact.indexOf('GeneratedStage(id: "b"'));
});

test("provider runtime export blocks when explicit Provider Runtime IR is absent", () => {
  const result = createConfigurationExporter().export({
    status: "SUCCESS",
    policy: { dnsPipeline: [{ id: "native-chain", order: 1 }] },
    resultMetadata: { status: "SUCCESS", timestamp: "t0" },
  }, "apple-dns-proxy-provider-runtime");

  assert.equal(result.status, "BLOCKED");
  assert.equal(result.artifact, null);
  assert.equal(result.diagnostics[0].code, "PROVIDER_RUNTIME_IR_REQUIRED");
});

test("provider runtime export remains fail-closed for invalid IR", () => {
  const result = createConfigurationExporter().export({
    status: "SUCCESS",
    policy: {
      providerRuntimeIR: { version: "1.0", targetEngine: "APPLE_DNS_PROXY_PROVIDER" },
    },
    resultMetadata: { status: "SUCCESS", timestamp: "t0" },
  }, "apple-dns-proxy-provider-runtime");

  assert.equal(result.status, "BLOCKED");
  assert.equal(result.artifact, null);
  assert.equal(result.diagnostics[0].code, "PROVIDER_RUNTIME_GENERATION_BLOCKED");
});
