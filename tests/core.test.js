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

test("DNS controller runs every enabled DNS resolver in order by default", async ()=>{
  const calls=[];
  const controller = new (await import("../packages/core/src/index.js")).DnsController({
    handlers:{filter:()=>({result:"PASS"})},
    transports:{
      first:(query)=>{calls.push(["first",query.upstreamResponse]);return {result:"RESPOND",response:{answer:["1.1.1.1"]}}},
      second:(query)=>{calls.push(["second",query.upstreamResponse]);return {result:"RESPOND",response:{answer:["9.9.9.9"]}}},
      third:(query)=>{calls.push(["third",query.upstreamResponse]);return {result:"RESPOND",response:{answer:["8.8.8.8"]}}}
    }
  });
  const result=await controller.resolve("example.com",{
    pipeline:[{id:"filter",provider:"Filter",order:1}],
    resolvers:[
      {id:"first",order:1},
      {id:"second",order:2},
      {id:"third",order:3}
    ],
    policy:{dnsResolution:{mode:"sequential",requiredProfiles:3}}
  });
  assert.equal(result.result,"RESPOND");
  assert.deepEqual(calls.map(x=>x[0]),["first","second","third"]);
  assert.equal(calls[0][1],undefined);
  assert.deepEqual(calls[1][1].answer,["1.1.1.1"]);
  assert.deepEqual(calls[2][1].answer,["9.9.9.9"]);
  assert.deepEqual(result.response.answer,["8.8.8.8"]);
});

test("DNS controller can intentionally select only two DNS profiles", async ()=>{
  const calls=[];
  const controller = new (await import("../packages/core/src/index.js")).DnsController({
    transports:{
      first:()=>{calls.push("first");return {result:"RESPOND",response:{answer:["1.1.1.1"]}}},
      second:()=>{calls.push("second");return {result:"RESPOND",response:{answer:["9.9.9.9"]}}},
      third:()=>{calls.push("third");return {result:"RESPOND",response:{answer:["8.8.8.8"]}}}
    }
  });
  const result=await controller.resolve("example.com",{
    resolvers:[
      {id:"first",order:1},
      {id:"second",order:2},
      {id:"third",order:3}
    ],
    policy:{dnsResolution:{mode:"sequential",requiredProfiles:2}}
  });
  assert.equal(result.ok,true);
  assert.deepEqual(calls,["first","second"]);
  assert.equal(result.response.answer[0],"9.9.9.9");
});

test("DNS controller does not treat resolver failure as filter-stage PASS", async ()=>{
  const controller = new (await import("../packages/core/src/index.js")).DnsController({
    transports:{default:()=>({result:"ERROR"})}
  });
  const result=await controller.resolve("example.com",{
    resolvers:[{id:"resolver-a",order:1}]
  });
  assert.equal(result.ok,false);
  assert.equal(result.reason,"DNS_CHAIN_STAGE_FAILED");
});
