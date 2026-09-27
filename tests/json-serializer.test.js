import test from "node:test";
import assert from "node:assert/strict";
import { jsonSerializer } from "../packages/core/src/target/serializers/json.js";

test("JSON serializer declares the json output format", () => {
  assert.equal(jsonSerializer.format, "json");
});

test("JSON serializer emits deterministic pretty JSON", () => {
  const representation = {
    target: "example",
    profiles: [
      { id: "profile-1", enabled: true }
    ]
  };

  assert.equal(
    jsonSerializer.serialize(representation),
    JSON.stringify(representation, null, 2)
  );
});

test("JSON serializer does not mutate the representation", () => {
  const representation = { nested: { value: 1 } };
  const before = JSON.stringify(representation);

  jsonSerializer.serialize(representation);

  assert.equal(JSON.stringify(representation), before);
});
