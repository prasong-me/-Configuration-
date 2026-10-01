import assert from "node:assert/strict";
import { executeDnsRuntimePipeline } from "../packages/apple-adapter/src/provider-runtime-pipeline.js";
import { StageMutationMode } from "../packages/apple-adapter/src/provider-stage-contract.js";

const query = Uint8Array.from([
  0x12,0x34,0x01,0x00,0x00,0x01,0x00,0x00,0x00,0x00,0x00,0x00,
  0x07,0x65,0x78,0x61,0x6d,0x70,0x6c,0x65,0x03,0x63,0x6f,0x6d,0x00,
  0x00,0x01,0x00,0x01
]);
const stage = id => ({
  version:"1.0", id, order:1, dependsOn:[], input:"DNS_CONTEXT", output:"STAGE_RESULT",
  mutation:StageMutationMode.IMMUTABLE_CONTEXT, resultOnSuccess:"CONTINUE",
  failure:{onParseError:"ERROR",onTimeout:"TIMEOUT",onUpstreamError:"FALLBACK"}, timeoutMs:null
});
const result = await executeDnsRuntimePipeline({
  input:query, stages:[stage("observe")], handlers:{observe: context => ({result:"CONTINUE", context})}
});
assert.equal(result.kind,"OUTPUT");
assert.deepEqual(Array.from(result.output),Array.from(query));
assert.equal(result.message.transactionId,0x1234);

const blocked = await executeDnsRuntimePipeline({input:query,stages:[stage("block")],handlers:{block:() => ({result:"BLOCK"})}});
assert.equal(blocked.kind,"TERMINAL");
assert.equal(blocked.output,null);

const respondMissing = await executeDnsRuntimePipeline({input:query,stages:[stage("respond")],handlers:{respond:() => ({result:"RESPOND"})}});
assert.equal(respondMissing.kind,"FAILURE");
assert.equal(respondMissing.code,"PIPELINE_RESPONSE_MESSAGE_REQUIRED");

const malformed = await executeDnsRuntimePipeline({input:Uint8Array.of(0,1),stages:[stage("observe")],handlers:{observe:() => ({result:"CONTINUE"})}});
assert.equal(malformed.kind,"FAILURE");
assert.equal(malformed.code,"PIPELINE_DECODE_FAILED");

const missingHandler = await executeDnsRuntimePipeline({input:query,stages:[stage("observe")],handlers:{}});
assert.equal(missingHandler.kind,"FAILURE");
assert.equal(missingHandler.code,"PIPELINE_STAGE_FAILED");

console.log("provider-runtime-pipeline tests: 5 passed");
