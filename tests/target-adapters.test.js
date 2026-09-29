import test from "node:test";
import assert from "node:assert/strict";
import { getTargetAdapter, listTargetAdapters } from "../packages/targets/src/adapters.js";

const EXPECTED_FORMATS={
  "apple-mobileconfig":"plist",
  "apple-dns-declaration":"json",
  "apple-mobileconfig-legacy":"plist",
  surge:"text",
  mihomo:"yaml",
  wireguard:"text",
  shadowrocket:"text",
  loon:"text",
  "quantumult-x":"text",
  stash:"yaml"
};

test("target adapter registry exposes all registered targets and formats",()=>{
  assert.deepEqual(
    Object.fromEntries(listTargetAdapters().map(x=>[x.targetId,x.outputFormat])),
    EXPECTED_FORMATS
  );
  for(const [targetId,outputFormat] of Object.entries(EXPECTED_FORMATS)){
    const adapter=getTargetAdapter(targetId);
    assert.equal(adapter.targetId,targetId);
    assert.equal(adapter.outputFormat,outputFormat);
    assert.equal(typeof adapter.compile,"function");
  }
  assert.equal(getTargetAdapter("unknown"),null);
});
