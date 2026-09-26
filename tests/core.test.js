import test from "node:test";
import assert from "node:assert/strict";
import { normalizePolicy, compatibilityReport, compile, processDnsQuery } from "../packages/core/src/index.js";
import { listTargetManifests } from "../packages/targets/src/index.js";

test("normalizePolicy creates canonical shape",()=>{assert.deepEqual(normalizePolicy({vpn:true,blocking:{trackers:true}}),{version:"0.1",policy:{vpn:true,dns:false,routing:false,blocking:{malware:false,trackers:true}}});});
test("unknown targets cannot export",()=>{const r=compatibilityReport({vpn:true},"does-not-exist");assert.equal(r.exportable,false);assert.ok(r.diagnostics.some(x=>x.code==="TARGET_UNKNOWN"));});
test("verified Surge VPN capability does not create an unknown-capability block",()=>{const r=compatibilityReport({vpn:true},"surge");assert.equal(r.exportable,true);assert.equal(r.capabilities.vpn.state,"SUPPORTED");});
test("unknown capabilities remain blocking",()=>{const r=compatibilityReport({vpn:true},"mihomo");assert.equal(r.exportable,false);assert.equal(r.capabilities.vpn.state,"UNKNOWN");assert.ok(r.diagnostics.some(x=>x.code==="CAPABILITY_UNKNOWN"));});
test("verified reference capability can report exportability",()=>{const r=compatibilityReport({vpn:true},"example");assert.equal(r.exportable,true);assert.equal(r.capabilities.vpn.state,"SUPPORTED");});
test("compile refuses missing adapter",()=>{const r=compile({vpn:true},"example",null);assert.equal(r.ok,false);assert.equal(r.report.exportable,false);assert.ok(r.report.diagnostics.some(x=>x.code==="ADAPTER_UNAVAILABLE"));});
test("target registry exposes evidence records",()=>{const surge=listTargetManifests().find(x=>x.id==="surge");assert.equal(surge.status,"verified");assert.equal(surge.evidence[0].level,"OFFICIAL");});

test("DNS pipeline preserves provider, protocol, role and order",()=>{
  const p=normalizePolicy({
    dns:true,
    dnsPipeline:[
      {id:"b",name:"Backup",provider:"Google",protocol:"DoH",role:"resolver",order:2},
      {id:"a",name:"Threat",provider:"Quad9",protocol:"DoT",role:"threat",order:1}
    ]
  });
  assert.deepEqual(p.policy.dnsPipeline.map(x=>x.id),["a","b"]);
  assert.equal(p.policy.dnsPipeline[0].provider,"Quad9");
  assert.equal(p.policy.dnsPipeline[0].protocol,"DoT");
});

test("DNS pipeline continues after PASS and stops on BLOCK",()=>{
  const result=processDnsQuery("example.com",[
    {id:"a",provider:"A",order:1},
    {id:"b",provider:"B",order:2}
  ],{
    a:()=>({result:"PASS"}),
    b:()=>({result:"BLOCK"})
  });
  assert.equal(result.result,"BLOCK");
  assert.deepEqual(result.trace.map(x=>x.result),["PASS","BLOCK"]);
});

test("DNS pipeline stops on RESPOND",()=>{
  let called=false;
  const result=processDnsQuery("example.com",[
    {id:"a",order:1},
    {id:"b",order:2}
  ],{
    a:()=>({result:"RESPOND",response:{answer:["1.2.3.4"]}}),
    b:()=>{called=true;return {result:"PASS"}}
  });
  assert.equal(result.result,"RESPOND");
  assert.equal(called,false);
});

test("generic web entry is preserved in normalized policy",()=>{
  const p=normalizePolicy({
    name:"Work DNS",
    webEntry:{name:"Configuration Web",url:"https://example.com",icon:"https://example.com/icon.png"}
  });
  assert.equal(p.policy.webEntry.name,"Configuration Web");
  assert.equal(p.policy.webEntry.url,"https://example.com");
});
