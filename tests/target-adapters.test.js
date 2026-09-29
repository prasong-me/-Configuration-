import test from "node:test";
import assert from "node:assert/strict";
import { getTargetAdapter, listTargetAdapters } from "../packages/targets/src/adapters.js";

const EXPECTED_FORMATS={
  "apple-mobileconfig":"plist",
  "apple-dns-declaration":"json",
  "apple-mobileconfig-legacy":"plist",
  surge:"text",
  mihomo:"yaml",
  wireguard:"text",
  shadowrocket:"text",
  loon:"text",
  "quantumult-x":"text",
  stash:"yaml"
};

test("all exported targets are registered with an explicit output format",()=>{
  const registered=listTargetAdapters();
  assert.deepEqual(
    Object.fromEntries(registered.map(x=>[x.targetId,x.outputFormat])),
    EXPECTED_FORMATS
  );
  for(const [targetId,outputFormat] of Object.entries(EXPECTED_FORMATS)){
    const adapter=getTargetAdapter(targetId);
    assert.equal(adapter.targetId,targetId);
    assert.equal(adapter.outputFormat,outputFormat);
    assert.equal(typeof adapter.compile,"function");
  }
  assert.equal(getTargetAdapter("unknown"),null);
});

test("Apple adapters return the locked CompileResult shape",()=>{
  const mobileconfig=getTargetAdapter("apple-mobileconfig").compile({
    name:"Test",
    dns:true,
    dnsProfiles:[{
      id:"test-dns",
      name:"Test DNS",
      protocol:"HTTPS",
      servers:["1.1.1.1"],
      endpoint:"https://example.com/dns-query",
      enabled:true
    }]
  });
  assert.equal(mobileconfig.targetId,"apple-mobileconfig");
  assert.equal(mobileconfig.outputFormat,"plist");
  assert.equal(Object.hasOwn(mobileconfig,"representation"),true);
  assert.equal(typeof mobileconfig.representation,"string");

  const declaration=getTargetAdapter("apple-dns-declaration").compile({
    name:"Test",
    dns:true,
    dnsProfiles:[{
      id:"test-dns",
      name:"Test DNS",
      protocol:"HTTPS",
      servers:["1.1.1.1"],
      endpoint:"https://example.com/dns-query",
      enabled:true
    }]
  });
  assert.equal(declaration.targetId,"apple-dns-declaration");
  assert.equal(declaration.outputFormat,"json");
  assert.equal(Object.hasOwn(declaration,"representation"),true);
  assert.equal(typeof declaration.representation,"string");
});

test("non-Apple target adapters use the target exporter as their translator",()=>{
  for(const targetId of ["surge","mihomo","wireguard","shadowrocket","loon","stash","quantumult-x"]){
    const adapter=getTargetAdapter(targetId);
    const result=adapter.compile({
      dnsServers:["1.1.1.1","1.0.0.1"],
      rules:[{match:"example.com",action:"DIRECT"}],
      webAppUrl:"https://example.com"
    });
    assert.equal(result.targetId,targetId);
    assert.equal(result.outputFormat,EXPECTED_FORMATS[targetId]);
    assert.equal(Object.hasOwn(result,"representation"),true);
  }
});
