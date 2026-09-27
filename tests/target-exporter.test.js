import test from "node:test";
import assert from "node:assert/strict";
import { ConfigurationExporter } from "../packages/core/src/target/exporter.js";
import { ConfigurationTargetRegistry } from "../packages/core/src/target/registry.js";
import { SerializerRegistry } from "../packages/core/src/target/serializer-registry.js";
import { jsonSerializer } from "../packages/core/src/target/serializers/json.js";

function metadata(status = "SUCCESS") {
  return {
    status,
    timestamp: "2026-09-27T00:00:00.000Z",
    diagnostics: [],
    summary: {
      profilesTotal: 1,
      profilesProcessed: 1,
      profilesSkipped: 0,
      featuresRequired: 0,
      featuresOptional: 0,
      featuresSupported: 0,
      featuresPartial: 0,
      featuresUnsupported: 0,
      diagnosticsTotal: 0,
    },
  };
}

function input(status = "SUCCESS", targetId = "example", outputFormat = "json") {
  return {
    target: { targetId, outputFormat },
    effectiveProfiles: [],
    outcomes: [],
    resultMetadata: metadata(status),
  };
}

function setup({
  targetId = "example",
  targetFormat = "json",
  compile = () => ({
    targetId,
    outputFormat: targetFormat,
    representation: { profiles: [] },
  }),
  serializers = [jsonSerializer],
} = {}) {
  const targetRegistry = new ConfigurationTargetRegistry();
  const adapter = { targetId, compile };
  targetRegistry.register({
    target: { targetId, outputFormat: targetFormat },
    capabilities: [],
    adapter,
  });

  const serializerRegistry = new SerializerRegistry();
  for (const serializer of serializers) {
    serializerRegistry.register(serializer);
  }

  return {
    exporter: new ConfigurationExporter(targetRegistry, serializerRegistry),
    targetRegistry,
    serializerRegistry,
    adapter,
  };
}

test("Processing FAILED blocks before Registry, Adapter, and Serializer execution", () => {
  let registryCalls = 0;
  let serializerRegistryCalls = 0;
  let adapterCalls = 0;
  let serializerCalls = 0;
  const spySerializer = {
    format: "json",
    serialize(value) {
      serializerCalls += 1;
      return JSON.stringify(value);
    },
  };
  const { exporter, targetRegistry, serializerRegistry, adapter } = setup({
    serializers: [spySerializer],
  });

  const originalTargetGet = targetRegistry.get.bind(targetRegistry);
  targetRegistry.get = (...args) => {
    registryCalls += 1;
    return originalTargetGet(...args);
  };

  const originalSerializerGet = serializerRegistry.get.bind(serializerRegistry);
  serializerRegistry.get = (...args) => {
    serializerRegistryCalls += 1;
    return originalSerializerGet(...args);
  };

  adapter.compile = () => {
    adapterCalls += 1;
    throw new Error("must not run");
  };

  const result = exporter.export(input("FAILED"));

  assert.equal(result.status, "BLOCKED");
  assert.equal(result.resultMetadata.status, "FAILED");
  assert.equal(registryCalls, 0);
  assert.equal(adapterCalls, 0);
  assert.equal(serializerRegistryCalls, 0);
  assert.equal(serializerCalls, 0);
  assert.deepEqual(result.diagnostics, []);
});

test("PARTIAL Processing metadata exports unchanged", () => {
  const { exporter } = setup();
  const processingMetadata = metadata("PARTIAL");

  const result = exporter.export({
    ...input("PARTIAL"),
    resultMetadata: processingMetadata,
  });

  assert.equal(result.status, "EXPORTED");
  assert.equal(result.resultMetadata, processingMetadata);
  assert.equal(result.artifact.outputFormat, "json");
  assert.equal(result.artifact.content, JSON.stringify({ profiles: [] }, null, 2));
  assert.deepEqual(result.diagnostics, []);
});

test("SUCCESS Processing metadata exports", () => {
  const { exporter } = setup();
  const result = exporter.export(input("SUCCESS"));

  assert.equal(result.status, "EXPORTED");
  assert.equal(result.artifact.outputFormat, "json");
});

test("Missing target fails with TARGET_NOT_REGISTERED", () => {
  const targetRegistry = new ConfigurationTargetRegistry();
  const serializerRegistry = new SerializerRegistry();
  serializerRegistry.register(jsonSerializer);
  const exporter = new ConfigurationExporter(targetRegistry, serializerRegistry);

  const result = exporter.export(input());

  assert.equal(result.status, "FAILED");
  assert.equal(result.diagnostics[0].code, "TARGET_NOT_REGISTERED");
});

test("Exporter uses only the adapter resolved from the registered target", () => {
  let firstCalls = 0;
  let secondCalls = 0;
  const targetRegistry = new ConfigurationTargetRegistry();
  targetRegistry.register({
    target: { targetId: "first", outputFormat: "json" },
    capabilities: [],
    adapter: {
      targetId: "first",
      compile() {
        firstCalls += 1;
        return { targetId: "first", outputFormat: "json", representation: { selected: "first" } };
      },
    },
  });
  targetRegistry.register({
    target: { targetId: "second", outputFormat: "json" },
    capabilities: [],
    adapter: {
      targetId: "second",
      compile() {
        secondCalls += 1;
        return { targetId: "second", outputFormat: "json", representation: { selected: "second" } };
      },
    },
  });

  const serializerRegistry = new SerializerRegistry();
  serializerRegistry.register(jsonSerializer);
  const exporter = new ConfigurationExporter(targetRegistry, serializerRegistry);

  const result = exporter.export(input("SUCCESS", "second", "json"));

  assert.equal(result.status, "EXPORTED");
  assert.equal(firstCalls, 0);
  assert.equal(secondCalls, 1);
  assert.match(result.artifact.content, /"second"/);
});

test("Compile result target identity mismatch fails with TARGET_ID_MISMATCH", () => {
  const { exporter } = setup({
    compile() {
      return { targetId: "other", outputFormat: "json", representation: {} };
    },
  });

  const result = exporter.export(input());

  assert.equal(result.status, "FAILED");
  assert.equal(result.diagnostics[0].code, "TARGET_ID_MISMATCH");
});

test("Target output format mismatch fails with TARGET_OUTPUT_FORMAT_MISMATCH", () => {
  const { exporter } = setup({
    targetFormat: "json",
    compile() {
      return { targetId: "example", outputFormat: "text", representation: "value" };
    },
    serializers: [jsonSerializer, { format: "text", serialize: value => String(value) }],
  });

  const result = exporter.export(input());

  assert.equal(result.status, "FAILED");
  assert.equal(result.diagnostics[0].code, "TARGET_OUTPUT_FORMAT_MISMATCH");
});

test("Missing serializer fails with SERIALIZER_NOT_REGISTERED", () => {
  const { exporter } = setup({ serializers: [] });

  const result = exporter.export(input());

  assert.equal(result.status, "FAILED");
  assert.equal(result.diagnostics[0].code, "SERIALIZER_NOT_REGISTERED");
});

test("Adapter compile errors fail with COMPILE_FAILED and preserve cause", () => {
  const cause = new Error("compile failure");
  const { exporter } = setup({
    compile() {
      throw cause;
    },
  });

  const result = exporter.export(input());

  assert.equal(result.status, "FAILED");
  assert.equal(result.diagnostics[0].code, "COMPILE_FAILED");
  assert.equal(result.diagnostics[0].cause, cause);
});

test("Malformed compile result fails with INVALID_COMPILE_RESULT", () => {
  const { exporter } = setup({
    compile() {
      return { targetId: "example", outputFormat: "json" };
    },
  });

  const result = exporter.export(input());

  assert.equal(result.status, "FAILED");
  assert.equal(result.diagnostics[0].code, "INVALID_COMPILE_RESULT");
});

test("Compile result with an own representation property set to undefined reaches the serializer", () => {
  let serializerCalls = 0;
  const serializer = {
    format: "json",
    serialize(value) {
      serializerCalls += 1;
      return jsonSerializer.serialize(value);
    },
  };
  const { exporter } = setup({
    serializers: [serializer],
    compile() {
      return {
        targetId: "example",
        outputFormat: "json",
        representation: undefined,
      };
    },
  });

  const result = exporter.export(input());

  assert.equal(serializerCalls, 1);
  assert.equal(result.status, "FAILED");
  assert.equal(result.diagnostics[0].code, "SERIALIZE_FAILED");
});

test("Missing representation property is rejected before serialization", () => {
  let serializerCalls = 0;
  const serializer = {
    format: "json",
    serialize() {
      serializerCalls += 1;
      return "{}";
    },
  };
  const { exporter } = setup({
    serializers: [serializer],
    compile() {
      return { targetId: "example", outputFormat: "json" };
    },
  });

  const result = exporter.export(input());

  assert.equal(result.status, "FAILED");
  assert.equal(result.diagnostics[0].code, "INVALID_COMPILE_RESULT");
  assert.equal(serializerCalls, 0);
});

test("Serializer errors fail with SERIALIZE_FAILED and preserve cause", () => {
  const cause = new Error("serialize failure");
  const serializer = {
    format: "json",
    serialize() {
      throw cause;
    },
  };
  const { exporter } = setup({ serializers: [serializer] });

  const result = exporter.export(input());

  assert.equal(result.status, "FAILED");
  assert.equal(result.diagnostics[0].code, "SERIALIZE_FAILED");
  assert.equal(result.diagnostics[0].cause, cause);
});

test("Exporter keeps Processing diagnostics and Export diagnostics separate", () => {
  const processingMetadata = metadata("PARTIAL");
  processingMetadata.diagnostics.push({
    code: "SEMANTIC_LOSS",
    severity: "WARNING",
    message: "Processing warning",
  });

  const { exporter } = setup({
    compile() {
      return { targetId: "example", outputFormat: "json", representation: {} };
    },
  });

  const result = exporter.export({
    ...input("PARTIAL"),
    resultMetadata: processingMetadata,
  });

  assert.equal(result.status, "EXPORTED");
  assert.equal(result.resultMetadata, processingMetadata);
  assert.equal(result.resultMetadata.diagnostics.length, 1);
  assert.deepEqual(result.diagnostics, []);
});

test("Exporter returns the serialized artifact content and declared format", () => {
  const representation = { hello: "world", enabled: true };
  const { exporter } = setup({
    compile() {
      return { targetId: "example", outputFormat: "json", representation };
    },
  });

  const result = exporter.export(input());

  assert.equal(result.status, "EXPORTED");
  assert.equal(result.artifact.outputFormat, "json");
  assert.equal(result.artifact.content, JSON.stringify(representation, null, 2));
});
