import test from "node:test";
import assert from "node:assert/strict";
import { getTargetAdapter, listTargetAdapters } from "../packages/targets/src/adapters.js";
import { compileTargetExport } from "../packages/targets/src/exporters.js";
import {
  getSerializer,
  listSerializers,
  serializeRepresentation
} from "../packages/targets/src/serializer-registry.js";
import { exportConfiguration } from "../packages/targets/src/exporter-bridge.js";

const targets = [
  "apple-mobileconfig",
  "apple-dns-declaration",
  "apple-mobileconfig-legacy",
  "surge",
  "mihomo",
  "wireguard",
  "shadowrocket",
  "loon",
  "stash",
  "quantumult-x"
];

const policy = {
  policy: {
    name: "Test",
    dns: true,
    dnsServers: ["1.1.1.1", "1.0.0.1"],
    dnsProfiles: [{
      id: "dns",
      name: "Test DNS",
      protocol: "HTTPS",
      servers: ["1.1.1.1", "1.0.0.1"],
      endpoint: "https://cloudflare-dns.com/dns-query",
      enabled: true
    }],
    rules: [{type: "DOMAIN-SUFFIX", value: "example.com", policy: "DIRECT"}],
    finalPolicy: "DIRECT",
    bypassSystem: true
  }
};

test("all application targets expose a compiler adapter", () => {
  const ids = listTargetAdapters().map(x => x.targetId);
  assert.deepEqual(ids, targets);

  for (const id of targets) {
    const adapter = getTargetAdapter(id);
    assert.equal(adapter.targetId, id);
    assert.equal(typeof adapter.compile, "function");
  }
});

test("all target exporters generate non-empty artifacts", () => {
  for (const id of targets) {
    const result = compileTargetExport(id, policy);
    assert.equal(result.targetId, id);
    assert.equal(typeof result.outputFormat, "string");
    assert.equal(typeof result.filename, "string");
    assert.notEqual(result.representation, null, id);
  }
});

test("legacy Apple MobileConfig target resolves to an actual artifact", () => {
  const result = compileTargetExport("apple-mobileconfig-legacy", policy);
  assert.equal(result.outputFormat, "plist");
  assert.match(result.filename, /\.mobileconfig$/);
  assert.match(result.representation, /com\.apple\.dnsSettings\.managed/);
});

test("serializer registry exposes only the locked output formats", () => {
  assert.deepEqual(listSerializers(), ["text", "ini", "yaml", "json", "plist"]);

  for (const format of listSerializers()) {
    assert.ok(getSerializer(format));
  }

  assert.equal(serializeRepresentation("json", {ok: true}), "{\n  \"ok\": true\n}");
  assert.equal(serializeRepresentation("text", "artifact"), "artifact");
});

test("serializer registry rejects unsupported and duplicate registrations", async () => {
  const { registerSerializer } = await import("../packages/targets/src/serializer-registry.js");

  assert.throws(
    () => registerSerializer("toml", value => String(value)),
    /Unsupported serializer format/
  );

  assert.throws(
    () => registerSerializer("json", value => String(value)),
    /Serializer already registered/
  );
});

test("export bridge blocks failed processing before target compilation", () => {
  const result = exportConfiguration(
    {status: "FAILED", policy: {}},
    {targetId: "surge"}
  );

  assert.equal(result.ok, false);
  assert.equal(result.blocked, true);
  assert.equal(result.artifact, null);
  assert.equal(result.diagnostics[0].code, "PROCESSING_FAILED");
});

test("export bridge compiles and serializes a successful target result", () => {
  const metadata = Object.freeze({
    status: "SUCCEEDED",
    diagnostics: [{code: "INFO", message: "ready"}]
  });

  const result = exportConfiguration(
    {policy: policy.policy, resultMetadata: metadata},
    {targetId: "surge"}
  );

  assert.equal(result.ok, true);
  assert.equal(result.blocked, false);
  assert.equal(result.targetId, "surge");
  assert.equal(result.outputFormat, "ini");
  assert.equal(typeof result.artifact, "string");
  assert.ok(result.artifact.includes("[General]"));
  assert.equal(result.resultMetadata, metadata);
  assert.deepEqual(result.diagnostics, metadata.diagnostics);
});

test("export bridge fails closed on an unknown target", () => {
  const result = exportConfiguration(
    {policy: policy.policy},
    {targetId: "not-registered"}
  );

  assert.equal(result.ok, false);
  assert.equal(result.blocked, true);
  assert.equal(result.artifact, null);
  assert.equal(result.diagnostics[0].code, "TARGET_NOT_REGISTERED");
});
