import test from "node:test";
import assert from "node:assert/strict";
import { getTargetAdapter, listTargetAdapters } from "../packages/targets/src/adapters.js";
import { compileTargetExport } from "../packages/targets/src/exporters.js";
import { exportConfiguration } from "../packages/targets/src/exporter-bridge.js";

const targets=["apple-mobileconfig","apple-dns-declaration","surge","mihomo","wireguard","shadowrocket","loon","stash","quantumult-x"];

test("all application targets expose a compiler adapter",()=>{
  const ids=listTargetAdapters().map(x=>x.targetId);
  assert.deepEqual(ids,targets);
  for(const id of targets){
    const adapter=getTargetAdapter(id);
    assert.equal(adapter.targetId,id);
    assert.equal(typeof adapter.compile,"function");
  }
});

test("target exporters generate non-empty artifacts",()=>{
  const policy={policy:{
    name:"Test",
    dns:true,
    dnsServers:["1.1.1.1","1.0.0.1"],
    dnsProfiles:[{id:"dns",name:"Test DNS",protocol:"HTTPS",servers:["1.1.1.1","1.0.0.1"],endpoint:"https://cloudflare-dns.com/dns-query",enabled:true}],
    rules:[{type:"DOMAIN-SUFFIX",value:"example.com",policy:"DIRECT"}],
    finalPolicy:"DIRECT",
    bypassSystem:true
  }};
  for(const id of targets){
    const result=compileTargetExport(id,policy);
    assert.equal(result.targetId,id);
    assert.ok(result.representation.length>0,id);
  }
});

test("export bridge blocks failed processing before target compilation",()=>{
  const result=exportConfiguration({status:"FAILED",policy:{}},{targetId:"surge"});
  assert.equal(result.ok,false);
  assert.equal(result.blocked,true);
  assert.equal(result.diagnostics[0].code,"PROCESSING_FAILED");
});
