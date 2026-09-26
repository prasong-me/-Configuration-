import test from "node:test";
import assert from "node:assert/strict";
import { readyMadeDnsConfigs } from "../packages/catalog/src/ready-made-configs.js";
import { getExportArtifact } from "../packages/targets/src/exporters.js";

const config=readyMadeDnsConfigs.find(item=>item.id==="adguard-default");

test("ready-made AdGuard DNS preset contains verified public endpoints",()=>{
  assert.ok(config);
  assert.deepEqual(config.servers,["94.140.14.14","94.140.15.15"]);
  assert.equal(config.endpoint,"https://dns.adguard-dns.com/dns-query");
  assert.equal(config.serverName,"dns.adguard-dns.com");
  assert.equal(config.source,"https://adguard-dns.io/en/public-dns.html");
});

test("ready-made AdGuard preset exports without placeholder endpoints",()=>{
  const policy={policy:{
    name:config.name,
    dns:true,
    dnsProfiles:[{
      id:config.id,
      name:config.name,
      provider:config.provider,
      protocol:config.protocol,
      servers:config.servers,
      endpoint:config.endpoint,
      serverName:config.serverName,
      enabled:true,
      order:1
    }],
    dnsServers:config.servers,
    dnsProtocol:config.protocol,
    dnsServerUrl:config.endpoint,
    dnsServerName:config.serverName,
    dnsDomains:[],
    rules:[],
    applePayloads:{dns:true,webclip:false,wifi:false,vpn:false,globalProxy:false}
  }};
  const mobileconfig=getExportArtifact("apple-mobileconfig",policy);
  assert.match(mobileconfig,/94\.140\.14\.14/);
  assert.match(mobileconfig,/94\.140\.15\.15/);
  assert.match(mobileconfig,/https:\/\/dns\.adguard-dns\.com\/dns-query/);
  assert.doesNotMatch(mobileconfig,/example\.com|placeholder/i);

  const surge=getExportArtifact("surge",policy);
  assert.match(surge,/94\.140\.14\.14/);
  assert.match(surge,/94\.140\.15\.15/);

  const quantumult=getExportArtifact("quantumult-x",policy);
  assert.match(quantumult,/94\.140\.14\.14/);
  assert.match(quantumult,/94\.140\.15\.15/);
});
