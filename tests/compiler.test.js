import assert from "node:assert/strict";
import test from "node:test";
import { CompilerContract, mapPolicySemantics, compileToTargetIR } from "../packages/core/src/index.js";

test("compiler contract exposes deterministic semantic stages",()=>{
  assert.equal(CompilerContract.version,"1.0");
  assert.equal(CompilerContract.deterministic,true);
  assert.deepEqual(CompilerContract.stages,["NORMALIZE","MAP","IR"]);
});

test("semantic mapping preserves requested features without target-specific mutation",()=>{
  const result=mapPolicySemantics({
    version:"1.0",
    policy:{
      vpn:true,
      dns:true,
      routing:true,
      blocking:{malware:true,trackers:false},
      rules:[{match:"example.com",action:"DIRECT"}]
    }
  },"surge");
  assert.deepEqual(result.mappings.map(x=>x.feature),["vpn","dns","routing","blocking.malware","routing.rules"]);
  assert.equal(result.targetId,"surge");
  assert.deepEqual(result.policy.policy.rules,[{match:"example.com",action:"DIRECT"}]);
});

test("target IR is deterministic across object key ordering",()=>{
  const a=compileToTargetIR({
    version:"1.0",
    policy:{dns:true,vpn:false,routing:true,blocking:{trackers:true,malware:false},rules:[{action:"DIRECT",match:"example.com"}]}
  },"surge");
  const b=compileToTargetIR({
    policy:{rules:[{match:"example.com",action:"DIRECT"}],blocking:{malware:false,trackers:true},routing:true,vpn:false,dns:true},
    version:"1.0"
  },"surge");
  assert.deepEqual(a,b);
});

test("compiler emits no feature mapping for disabled features",()=>{
  const result=mapPolicySemantics({version:"1.0",policy:{vpn:false,dns:false,routing:false,blocking:{malware:false,trackers:false}}},"surge");
  assert.deepEqual(result.mappings,[]);
});
