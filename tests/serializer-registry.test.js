import test from "node:test";
import assert from "node:assert/strict";
import { SerializerRegistry } from "../packages/core/src/target/serializer-registry.js";

function serializer(format = "json") {
  return {
    format,
    serialize(value) {
      return JSON.stringify(value);
    },
  };
}

test("SerializerRegistry registers and resolves supported formats", () => {
  const registry = new SerializerRegistry();
  registry.register(serializer("json"));

  assert.equal(registry.has("json"), true);
  assert.equal(registry.get("json").format, "json");
  assert.deepEqual(registry.list().map((item) => item.format), ["json"]);
});

test("SerializerRegistry rejects unsupported formats at runtime", () => {
  const registry = new SerializerRegistry();

  assert.throws(
    () => registry.register(serializer("toml")),
    /not a supported output format/,
  );
});

test("SerializerRegistry rejects duplicate formats", () => {
  const registry = new SerializerRegistry();
  registry.register(serializer("json"));

  assert.throws(
    () => registry.register(serializer("json")),
    /already registered/,
  );
});

test("SerializerRegistry rejects serializers without serialize", () => {
  const registry = new SerializerRegistry();

  assert.throws(
    () => registry.register({ format: "json" }),
    /serialize function/,
  );
});

test("SerializerRegistry rejects serializers without a valid format", () => {
  const registry = new SerializerRegistry();

  assert.throws(
    () => registry.register({ format: "" , serialize() {} }),
    /valid format/,
  );
});
