import assert from "node:assert/strict";
import test from "node:test";
import {
  CapabilityState,
  CapabilityDecision,
  evaluateCapability,
  createCapabilityRegistry,
  negotiateCapabilities,
  capabilityDiagnostics
} from "../packages/capabilities/src/index.js";

test("unknown values fail closed",()=>{
  const result=evaluateCapability("NOT_A_REAL_STATE");
  assert.equal(result.state,CapabilityState.UNKNOWN);
  assert.equal(result.decision,CapabilityDecision.BLOCK);
});

test("supported and transformable capabilities can proceed",()=>{
  assert.equal(evaluateCapability(CapabilityState.SUPPORTED).decision,CapabilityDecision.ALLOW);
  assert.equal(evaluateCapability(CapabilityState.TRANSFORMABLE).decision,CapabilityDecision.ALLOW);
});

test("limited and lossy capabilities require warning",()=>{
  assert.equal(evaluateCapability(CapabilityState.LIMITED).decision,CapabilityDecision.ALLOW_WITH_WARNING);
  assert.equal(evaluateCapability(CapabilityState.LOSSY).decision,CapabilityDecision.ALLOW_WITH_WARNING);
});

test("unsupported and unknown capabilities block",()=>{
  assert.equal(evaluateCapability(CapabilityState.UNSUPPORTED).decision,CapabilityDecision.BLOCK);
  assert.equal(evaluateCapability(CapabilityState.UNKNOWN).decision,CapabilityDecision.BLOCK);
});

test("registry rejects invalid and duplicate definitions",()=>{
  assert.throws(()=>createCapabilityRegistry([{id:"dns",states:["INVALID"]}]),/Unknown capability state/);
  const states=Object.values(CapabilityState);
  assert.equal(createCapabilityRegistry([{id:"dns",states}]).has("dns"),true);
  assert.throws(()=>createCapabilityRegistry([{id:"dns",states},{id:"dns",states}]),/Duplicate capability/);
});

test("negotiation fails closed when target evidence is absent",()=>{
  const result=negotiateCapabilities(
    {dns:true,vpn:true,routing:false},
    {dns:CapabilityState.SUPPORTED,vpn:CapabilityState.UNKNOWN,routing:CapabilityState.SUPPORTED}
  );
  assert.equal(result.dns.decision,CapabilityDecision.ALLOW);
  assert.equal(result.vpn.decision,CapabilityDecision.BLOCK);
  assert.equal(result.routing.requested,false);
});

test("diagnostics distinguish unknown, unsupported and non-blocking states",()=>{
  const diagnostics=capabilityDiagnostics({
    dns:{requested:true,state:CapabilityState.SUPPORTED},
    vpn:{requested:true,state:CapabilityState.UNKNOWN},
    routing:{requested:true,state:CapabilityState.LIMITED},
    blocking:{requested:true,state:CapabilityState.UNSUPPORTED}
  },{target:"example"});
  assert.deepEqual(diagnostics.map(x=>x.code),[
    "CAPABILITY_UNKNOWN",
    "CAPABILITY_LIMITED",
    "FEATURE_UNSUPPORTED"
  ]);
});
