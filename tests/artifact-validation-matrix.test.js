import test from "node:test";
import assert from "node:assert/strict";
import { configurationExporter } from "../packages/core/src/index.js";
import { exportFormats } from "../packages/targets/src/exporters.js";

const applePolicy={name:"artifact-matrix",dnsServers:["1.1.1.1","2606:4700:4700::1111"],dnsProtocol:"HTTPS",dnsServerUrl:"https://dns.example/dns-query",webEntry:{name:"Configuration Web",url:"https://example.com",enabled:true},applePayloads:{dns:true,webclip:true,wifi:true,vpn:false,globalProxy:false},wifiSSID:"TestWiFi",wifiPassword:"password"};

const targetFixtures={
  "apple-mobileconfig":{version:"0.6",policy:applePolicy},
  "apple-dns-declaration":{version:"0.6",policy:{...applePolicy,applePayloads:{dns:true,webclip:false,wifi:false,vpn:false,globalProxy:false}}},
  "apple-mobileconfig-legacy":{version:"0.6",policy:{...applePolicy,applePayloads:{dns:true,webclip:false,wifi:false,vpn:false,globalProxy:false}}}
};

test("every export-registered target has a repository-side artifact fixture",()=>{
  const results=[];
  for(const format of exportFormats){
    if(format.id==="apple-dns-proxy-provider-runtime")continue;
    const result=configurationExporter.export({status:"SUCCESS",policy:targetFixtures[format.id]??{version:"0.6",policy:{name:"artifact-matrix"}}},format.id);
    assert.equal(result.status,"EXPORTED",format.id+" must export its minimal fixture");
    assert.ok(result.outputFormat,format.id+" must declare output format");
    assert.notEqual(result.artifact,null,format.id+" must produce an artifact");
    results.push(format.id);
  }
  assert.ok(results.length>=10);
});

test("Apple export matrix produces distinct declared artifacts for all public Apple formats",()=>{
  for(const id of ["apple-mobileconfig","apple-dns-declaration","apple-mobileconfig-legacy"]){
    const fixture=targetFixtures[id];
    const result=configurationExporter.export({status:"SUCCESS",policy:fixture.policy},id);
    assert.equal(result.status,"EXPORTED",id+" must export");
    assert.ok(typeof result.artifact==="string"||typeof result.artifact==="object");
  }
  const mobile=configurationExporter.export({status:"SUCCESS",policy:applePolicy},"apple-mobileconfig");
  assert.match(mobile.artifact,/com\.apple\.dnsSettings\.managed/);
  assert.match(mobile.artifact,/com\.apple\.webClip\.managed/);
  assert.match(mobile.artifact,/com\.apple\.wifi\.managed/);

  const legacy=configurationExporter.export({status:"SUCCESS",policy:targetFixtures["apple-mobileconfig-legacy"].policy},"apple-mobileconfig-legacy");
  assert.match(legacy.artifact,/com\.apple\.dnsSettings\.managed/);
  assert.doesNotMatch(legacy.artifact,/com\.apple\.webClip\.managed/);
});
