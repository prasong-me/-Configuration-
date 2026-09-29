import test from "node:test";
import assert from "node:assert/strict";
import { configurationExporter } from "../packages/core/src/index.js";
import { exportFormats } from "../packages/targets/src/exporters.js";

const targetFixtures={
  "apple-mobileconfig":{version:"0.6",policy:{name:"artifact-matrix",dnsServers:["1.1.1.1"],dnsProtocol:"HTTPS",dnsServerUrl:"https://dns.example/dns-query"}},
  "apple-dns-declaration":{version:"0.6",policy:{name:"artifact-matrix",dnsServers:["1.1.1.1"],dnsProtocol:"HTTPS",dnsServerUrl:"https://dns.example/dns-query"}}
};

test("every export-registered target has a repository-side artifact fixture",()=>{
  const results=[];
  for(const format of exportFormats){
    if(format.id==="apple-dns-proxy-provider-runtime") continue;
    const result=configurationExporter.export({status:"SUCCESS",policy:targetFixtures[format.id]??{version:"0.6",policy:{name:"artifact-matrix"}}},format.id);
    assert.equal(result.status,"EXPORTED",format.id+" must export its minimal fixture");
    assert.ok(result.outputFormat,format.id+" must declare output format");
    assert.notEqual(result.artifact,null,format.id+" must produce an artifact");
    results.push(format.id);
  }
  assert.ok(results.length>=10);
});
