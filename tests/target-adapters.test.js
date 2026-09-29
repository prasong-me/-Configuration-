import test from "node:test";
import assert from "node:assert/strict";
import { getTargetAdapter, listTargetAdapters } from "../packages/targets/src/adapters.js";

test("Apple target adapters are registered by target id", () => {
  const mobileconfig = getTargetAdapter("apple-mobileconfig");
  const declaration = getTargetAdapter("apple-dns-declaration");

  assert.equal(mobileconfig.targetId, "apple-mobileconfig");
  assert.equal(typeof mobileconfig.compile, "function");
  assert.equal(declaration.targetId, "apple-dns-declaration");
  assert.equal(typeof declaration.compile, "function");
  assert.equal(getTargetAdapter("unknown"), null);
});

test("target adapter registry exposes adapter identity and format", () => {
  const targets=listTargetAdapters();
  assert.ok(targets.some(x=>x.targetId==="apple-mobileconfig"&&x.outputFormat==="plist"));
  assert.ok(targets.some(x=>x.targetId==="apple-dns-declaration"&&x.outputFormat==="json"));
  assert.ok(targets.some(x=>x.targetId==="surge"&&x.outputFormat==="text"));
});
