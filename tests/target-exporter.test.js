import test from "node:test";
import assert from "node:assert/strict";
import { ConfigurationExporter } from "../packages/core/src/target/exporter.js";

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
      featuresUnknown: 0,
      diagnosticsTotal: 0
    }
  };
}

function input(status = "SUCCESS") {
  return {
    target: {
      targetId: "example",
      outputFormat: "json"
    },
    effectiveProfiles: [],
    outcomes: [],
    resultMetadata: metadata(status)
  };
}

test("Processing FAILED blocks adapter execution", () => {
  const exporter = new ConfigurationExporter();
  let called = false;
  exporter.registerAdapter({
    targetId: "example",
    compile() {
      called = true;
      throw new Error("must not run");
    }
  });

  const result = exporter.export(input("FAILED"));

  assert.equal(result.status, "BLOCKED");
  assert.equal(called, false);
  assert.equal(result.resultMetadata.status, "FAILED");
});

test("Exporter preserves Processing metadata on successful export", () => {
  const exporter = new ConfigurationExporter();
  const processingMetadata = metadata("PARTIAL");

  exporter.registerAdapter({
    targetId: "example",
    compile() {
      return {
        targetId: "example",
        outputFormat: "json",
        representation: { profiles: [] }
      };
    }
  });
  exporter.registerSerializer({
    format: "json",
    serialize(value) {
      return JSON.stringify(value);
    }
  });

  const result = exporter.export({
    ...input("PARTIAL"),
    resultMetadata: processingMetadata
  });

  assert.equal(result.status, "EXPORTED");
  assert.equal(result.resultMetadata, processingMetadata);
  assert.equal(result.artifact.outputFormat, "json");
  assert.equal(result.artifact.content, '{"profiles":[]}');
});

test("Target identity mismatch fails export", () => {
  const exporter = new ConfigurationExporter();
  exporter.registerAdapter({
    targetId: "example",
    compile() {
      return {
        targetId: "surge",
        outputFormat: "json",
        representation: {}
      };
    }
  });

  const result = exporter.export(input());

  assert.equal(result.status, "FAILED");
  assert.equal(result.artifact, undefined);
});

test("Serializer format mismatch cannot cross the boundary", () => {
  const exporter = new ConfigurationExporter();
  exporter.registerAdapter({
    targetId: "example",
    compile() {
      return {
        targetId: "example",
        outputFormat: "json",
        representation: {}
      };
    }
  });
  exporter.registerSerializer({
    format: "yaml",
    serialize() {
      return "{}";
    }
  });

  const result = exporter.export(input());

  assert.equal(result.status, "FAILED");
  assert.equal(result.artifact, undefined);
});
