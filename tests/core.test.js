import test from "node:test";
import assert from "node:assert/strict";
import { normalizePolicy, compatibilityReport, compile, processDnsQuery } from "../packages/core/src/index.js";
import { listTargetManifests } from "../packages/targets/src/index.js";

test("normalizePolicy creates canonical shape",()=>{assert.deepEqual(normalizePolicy({vpn:true,blocking:{trackers:true}}),{version:"0.1",policy:{vpn:true,dns:false,routing:false,blocking:{malware:false,trackers:true},dnsPipeline:[]}});});
test("unknown targets cannot export",()=>{const r=compatibilityReport({vpn:true},"does-not-exist");assert.equal(r.exportable,false);assert.ok(r.diagnostics.some(x=>x.code==="TARGET_UNKNOWN"));});
test("verified Surge VPN capability does not create an unknown-capability block",()=>{const r=compatibilityReport({vpn:true},"surge");assert.equal(r.exportable,true);assert.equal(r.capabilities.vpn.state,"SUPPORTED");});
test("unknown capabilities remain blocking",()=>{const r=compatibilityReport({vpn:true},"mihomo");assert.equal(r.exportable,false);assert.equal(r.capabilities.vpn.state,"UNKNOWN");assert.ok(r.diagnostics.some(x=>x.code==="CAPABILITY_UNKNOWN"));});
test("verified reference capability can report exportability",()=>{const r=compatibilityReport({vpn:true},"example");assert.equal(r.exportable,true);assert.equal(r.capabilities.vpn.state,"SUPPORTED");});
test("compile refuses missing adapter",()=>{const r=compile({vpn:true},"example",null);assert.equal(r.ok,false);assert.equal(r.report.exportable,false);assert.ok(r.report.diagnostics.some(x=>x.code==="ADAPTER_UNAVAILABLE"));});
test("target registry exposes evidence records",()=>{const surge=listTargetManifests().find(x=>x.id==="surge");assert.equal(surge.status,"verified");assert.equal(surge.evidence[0].level,"OFFICIAL");});

test("normalizePolicy preserves multiple named DNS profiles and resolver pairs",()=>{
  const p=normalizePolicy({
    dns:true,
    dnsProfiles:[
      {id:"privacy",name:"Privacy DNS",provider:"Cloudflare",protocol:"DoH",servers:["1.1.1.1","1.0.0.1"],endpoint:"https://cloudflare-dns.com/dns-query",order:1},
      {id:"security",name:"Security DNS",provider:"Quad9",protocol:"DoH",servers:["9.9.9.9","149.112.112.112"],endpoint:"https://dns.quad9.net/dns-query",order:2},
      {id:"backup",name:"Backup DNS",provider:"Google Public DNS",protocol:"DoH",servers:["8.8.8.8","8.8.4.4"],endpoint:"https://dns.google/dns-query",order:3}
    ]
  });
  assert.equal(p.policy.dnsProfiles.length,3);
  assert.deepEqual(p.policy.dnsProfiles.map(x=>x.name),["Privacy DNS","Security DNS","Backup DNS"]);
  assert.deepEqual(p.policy.dnsProfiles[0].servers,["1.1.1.1","1.0.0.1"]);
  assert.deepEqual(p.policy.dnsProfiles[1].servers,["9.9.9.9","149.112.112.112"]);
});

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


test("DNS controller stops on a stage BLOCK before resolving", async ()=>{
  let resolverCalled=false;
  const controller = new (await import("../packages/core/src/index.js")).DnsController({
    handlers:{security:()=>({result:"BLOCK"})},
    transports:{default:()=>{resolverCalled=true;return {result:"RESPOND"}}}
  });
  const result=await controller.resolve("blocked.example",{
    pipeline:[{id:"security",provider:"Quad9",order:1}],
    resolvers:[{id:"fallback",provider:"Cloudflare",order:1}]
  });
  assert.equal(result.result,"BLOCK");
  assert.equal(resolverCalled,false);
});

test("DNS controller continues after PASS and uses the first successful resolver", async ()=>{
  const calls=[];
  const controller = new (await import("../packages/core/src/index.js")).DnsController({
    handlers:{filter:()=>({result:"PASS"})},
    transports:{
      first:()=>{calls.push("first");return {result:"ERROR"}},
      second:()=>{calls.push("second");return {result:"RESPOND",response:{answer:["1.2.3.4"]}}}
    }
  });
  const result=await controller.resolve("example.com",{
    pipeline:[{id:"filter",provider:"Filter",order:1}],
    resolvers:[
      {id:"first",order:1},
      {id:"second",order:2}
    ]
  });
  assert.equal(result.result,"RESPOND");
  assert.deepEqual(calls,["first","second"]);
  assert.deepEqual(result.response.answer,["1.2.3.4"]);
});

test("DNS controller does not treat resolver failure as filter-stage PASS", async ()=>{
  const controller = new (await import("../packages/core/src/index.js")).DnsController({
    transports:{default:()=>({result:"ERROR"})}
  });
  const result=await controller.resolve("example.com",{
    resolvers:[{id:"resolver-a",order:1}]
  });
  assert.equal(result.ok,false);
  assert.equal(result.reason,"ALL_RESOLVERS_FAILED");
});

test("DNS profiles have no artificial three-profile limit and retain editable fields",()=>{
  const input=Array.from({length:6},(_,i)=>({
    id:`profile-${i+1}`,
    name:`Profile ${i+1}`,
    provider:`Provider ${i+1}`,
    protocol:i%2?"DoT":"DoH",
    role:i%2?"security":"privacy",
    servers:[`192.0.2.${i+1}`],
    endpoint:`https://dns${i+1}.example/dns-query`,
    enabled:i!==4,
    order:i+1
  }));
  const p=normalizePolicy({dns:true,dnsProfiles:input});
  assert.equal(p.policy.dnsProfiles.length,6);
  assert.equal(p.policy.dnsProfiles[4].enabled,false);
  assert.equal(p.policy.dnsProfiles[5].provider,"Provider 6");
  assert.equal(p.policy.dnsProfiles[5].role,"security");
  assert.deepEqual(p.policy.dnsProfiles.map(x=>x.order),[1,2,3,4,5,6]);
});


test("compatibility diagnostics classify supported, unknown and unsupported capabilities",async ()=>{
  const supported=compatibilityReport({vpn:true},"surge");
  assert.equal(supported.compatibility.vpn.level,"OK");
  assert.equal(supported.compatibility.vpn.state,"SUPPORTED");

  const unknown=compatibilityReport({vpn:true},"mihomo");
  assert.equal(unknown.compatibility.vpn.level,"WARNING");
  assert.equal(unknown.compatibility.vpn.state,"UNKNOWN");

  const unsupportedTarget={id:"test-unsupported",version:"1",status:"test",capabilities:{
    vpn:"UNSUPPORTED",dns:"SUPPORTED",routing:"SUPPORTED","blocking.malware":"SUPPORTED","blocking.trackers":"SUPPORTED"
  }};
  const {registerTargetManifest}=await import("../packages/targets/src/index.js");
  registerTargetManifest(unsupportedTarget);
  const unsupported=compatibilityReport({vpn:true},"test-unsupported");
  assert.equal(unsupported.compatibility.vpn.level,"UNSUPPORTED");
  assert.equal(unsupported.compatibility.vpn.state,"UNSUPPORTED");
});
