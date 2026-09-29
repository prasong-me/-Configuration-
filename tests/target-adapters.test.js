import test from "node:test";
import assert from "node:assert/strict";
import { getTargetAdapter } from "../packages/targets/src/adapters.js";

test("Apple target adapters are registered by target id", () => {
  const mobileconfig = getTargetAdapter("apple-mobileconfig");
  const declaration = getTargetAdapter("apple-dns-declaration");

  assert.equal(mobileconfig.targetId, "apple-mobileconfig");
  assert.equal(typeof mobileconfig.compile, "function");
  assert.equal(declaration.targetId, "apple-dns-declaration");
  assert.equal(typeof declaration.compile, "function");
  assert.equal(getTargetAdapter("unknown"), null);
});
