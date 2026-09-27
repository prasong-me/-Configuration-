import test from "node:test";
import assert from "node:assert/strict";
import { jsonSerializer } from "../packages/core/src/target/serializers/json.js";

test("JSON serializer declares the json output format", () => {
  assert.equal(jsonSerializer.format, "json");
});

test("JSON serializer emits deterministic pretty JSON", () => {
  const representation = {
    target: "example",
    profiles: [{ id: "profile-1", enabled: true }],
  };

  assert.equal(
    jsonSerializer.serialize(representation),
    JSON.stringify(representation, null, 2),
  );
});

test("JSON serializer rejects values that produce no JSON string", () => {
  for (const value of [undefined, function ignored() {}, Symbol("ignored")]) {
    assert.throws(() => jsonSerializer.serialize(value), TypeError);
  }
});

test("JSON serializer preserves the original cause for circular references", () => {
  const representation = {};
  representation.self = representation;

  assert.throws(
    () => jsonSerializer.serialize(representation),
    (error) => {
      assert.equal(error.name, "Error");
      assert.match(error.message, /Failed to serialize representation to JSON/);
      assert.ok(error.cause instanceof TypeError);
      return true;
    },
  );
});

test("JSON serializer follows JSON semantics for non-finite numbers", () => {
  assert.equal(
    jsonSerializer.serialize({ nan: Number.NaN, positive: Infinity, negative: -Infinity }),
    '{\n  "nan": null,\n  "positive": null,\n  "negative": null\n}',
  );
});

test("JSON serializer does not mutate the representation", () => {
  const representation = { nested: { value: 1 } };
  const before = JSON.stringify(representation);

  jsonSerializer.serialize(representation);

  assert.equal(JSON.stringify(representation), before);
});
