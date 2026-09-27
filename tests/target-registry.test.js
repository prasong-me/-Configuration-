import test from "node:test";
import assert from "node:assert/strict";
import { ConfigurationTargetRegistry } from "../packages/core/src/target/registry.js";

function registration(targetId = "example") {
  const adapter = {
    targetId,
    compile() {
      return { targetId, outputFormat: "json", representation: {} };
    },
  };

  return {
    target: {
      targetId,
      version: "1.0",
      outputFormat: "json",
      options: { mode: "test" },
    },
    capabilities: [
      {
        featureKey: "dns",
        supported: true,
        version: "1.0",
        notes: ["verified"],
      },
    ],
    adapter,
  };
}

test("registers and resolves a target registration", () => {
  const registry = new ConfigurationTargetRegistry();
  registry.register(registration());

  assert.equal(registry.has("example"), true);
  assert.equal(registry.getTarget("example").targetId, "example");
  assert.equal(registry.getAdapter("example").targetId, "example");
});

test("rejects duplicate target registration", () => {
  const registry = new ConfigurationTargetRegistry();
  registry.register(registration());

  assert.throws(() => registry.register(registration()), /already registered/);
});

test("rejects target and adapter identity mismatch", () => {
  const registry = new ConfigurationTargetRegistry();

  assert.throws(
    () =>
      registry.register({
        target: { targetId: "example", outputFormat: "json" },
        capabilities: [],
        adapter: { targetId: "surge", compile() {} },
      }),
    /does not match adapter/,
  );
});

test("rejects unsupported output format", () => {
  const registry = new ConfigurationTargetRegistry();
  const value = registration();
  value.target.outputFormat = "unknown";

  assert.throws(
    () => registry.register(value),
    /unsupported output format/,
  );
});

test("rejects invalid capability structure", () => {
  const invalid = [
    { featureKey: "", supported: true },
    { featureKey: "dns", supported: "yes" },
    { featureKey: "dns", supported: true, version: 1 },
    { featureKey: "dns", supported: true, notes: ["ok", 1] },
  ];

  for (const capability of invalid) {
    const registry = new ConfigurationTargetRegistry();
    const value = registration();
    value.capabilities = [capability];

    assert.throws(() => registry.register(value), TypeError);
  }
});

test("capabilities are returned as snapshots", () => {
  const registry = new ConfigurationTargetRegistry();
  registry.register(registration());

  const capabilities = registry.getCapabilities("example");
  capabilities[0].supported = false;
  capabilities[0].notes.push("mutated");

  const stored = registry.getCapabilities("example");
  assert.equal(stored[0].supported, true);
  assert.deepEqual(stored[0].notes, ["verified"]);
});

test("target metadata is returned as a snapshot", () => {
  const registry = new ConfigurationTargetRegistry();
  registry.register(registration());

  const target = registry.getTarget("example");
  target.options.mode = "modified";

  assert.equal(registry.getTarget("example").options.mode, "test");
});

test("get returns undefined and empty capabilities for unknown targets", () => {
  const registry = new ConfigurationTargetRegistry();

  assert.equal(registry.get("missing"), undefined);
  assert.equal(registry.getTarget("missing"), undefined);
  assert.equal(registry.getAdapter("missing"), undefined);
  assert.deepEqual(registry.getCapabilities("missing"), []);
});

test("list returns registered targets without exposing internal metadata state", () => {
  const registry = new ConfigurationTargetRegistry();
  registry.register(registration("example"));
  registry.register(registration("second"));

  const list = registry.list();
  assert.equal(list.length, 2);

  list[0].target.options.mode = "modified";
  list[0].capabilities[0].supported = false;

  assert.equal(registry.get("example").target.options.mode, "test");
  assert.equal(registry.get("example").capabilities[0].supported, true);
});
