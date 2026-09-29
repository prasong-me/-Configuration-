import test from "node:test";
import assert from "node:assert/strict";
import {
  StageMutationMode,
  StageResult,
  StageFailureResult,
} from "../packages/apple-adapter/src/provider-stage-contract.js";
import {
  createProviderStageExecutionEngine,
  FAILURE_TYPES,
} from "../packages/apple-adapter/src/provider-stage-execution.js";

const stage=(id, order, extra={})=>({
  version:"1.0", id, order, dependsOn:extra.dependsOn||[], input:"DNS_CONTEXT", output:"STAGE_RESULT",
  mutation:extra.mutation||StageMutationMode.IMMUTABLE, resultOnSuccess:extra.resultOnSuccess||StageResult.CONTINUE,
  failure:{
    onParseError:extra.onParseError||StageFailureResult.ERROR,
    onTimeout:extra.onTimeout||StageFailureResult.TIMEOUT,
    onUpstreamError:extra.onUpstreamError||StageFailureResult.FALLBACK,
  },
  timeoutMs:extra.timeoutMs??null,
});

test("executes dependencies before dependent stages deterministically", async()=>{
  const seen=[];
  const engine=createProviderStageExecutionEngine({
    stages:[stage("b",2,{dependsOn:["a"]}),stage("a",1)],
    handlers:{a:async()=>{seen.push("a");return StageResult.CONTINUE;},b:async()=>{seen.push("b");return StageResult.BLOCK;}},
  });
  const result=await engine.execute({});
  assert.equal(engine.valid,true);
  assert.deepEqual(engine.order,["a","b"]);
  assert.deepEqual(seen,["a","b"]);
  assert.equal(result.kind,"TERMINAL");
  assert.equal(result.result,StageResult.BLOCK);
});

test("fails closed when a handler is missing", async()=>{
  const engine=createProviderStageExecutionEngine({stages:[stage("a",1)],handlers:{}});
  const result=await engine.execute({});
  assert.equal(result.kind,"FAILURE");
  assert.equal(result.failureType,"HANDLER_MISSING");
  assert.equal(result.action,StageFailureResult.ERROR);
});

test("preserves immutable context and accepts explicit mutable context", async()=>{
  let immutableWasFrozen=false;
  const engine=createProviderStageExecutionEngine({
    stages:[stage("a",1),stage("b",2,{mutation:StageMutationMode.MUTABLE})],
    handlers:{
      a:async context=>{immutableWasFrozen=Object.isFrozen(context);return StageResult.CONTINUE;},
      b:async context=>{context.value=2;return {result:StageResult.CONTINUE,context};},
    },
  });
  const result=await engine.execute({value:1});
  assert.equal(immutableWasFrozen,true);
  assert.equal(result.kind,"CONTINUE");
  assert.equal(result.context.value,2);
});

test("maps parse failures to the stage parse-failure action", async()=>{
  const engine=createProviderStageExecutionEngine({
    stages:[stage("a",1,{onParseError:StageFailureResult.FALLBACK})],
    handlers:{a:async()=>{const e=new Error("bad packet");e.failureType=FAILURE_TYPES.PARSE;throw e;}},
  });
  const result=await engine.execute({});
  assert.equal(result.failureType,FAILURE_TYPES.PARSE);
  assert.equal(result.action,StageFailureResult.FALLBACK);
});

test("maps timeout to explicit timeout action and never converts it to PASS", async()=>{
  const engine=createProviderStageExecutionEngine({
    stages:[stage("a",1,{timeoutMs:5,onTimeout:StageFailureResult.ERROR})],
    handlers:{a:()=>new Promise(resolve=>setTimeout(()=>resolve(StageResult.CONTINUE),50))},
  });
  const result=await engine.execute({});
  assert.equal(result.failureType,"TIMEOUT");
  assert.equal(result.action,StageFailureResult.ERROR);
});

test("terminal stage stops the pipeline", async()=>{
  let called=false;
  const engine=createProviderStageExecutionEngine({
    stages:[stage("a",1,{resultOnSuccess:StageResult.RESPOND}),stage("b",2)],
    handlers:{
      a:async()=>StageResult.RESPOND,
      b:async()=>{called=true;return StageResult.CONTINUE;},
    },
  });
  const result=await engine.execute({});
  assert.equal(result.result,StageResult.RESPOND);
  assert.equal(called,false);
});

test("invalid dependency graph is rejected before execution", async()=>{
  const engine=createProviderStageExecutionEngine({
    stages:[stage("a",1,{dependsOn:["missing"]})],
    handlers:{a:async()=>StageResult.CONTINUE},
  });
  assert.equal(engine.valid,false);
  const result=await engine.execute({});
  assert.equal(result.failureType,"CONTRACT");
  assert.equal(result.action,"FAST_FAIL");
});
