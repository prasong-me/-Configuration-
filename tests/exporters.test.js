import test from "node:test";
import assert from "node:assert/strict";
import { getExportArtifact } from "../packages/targets/src/exporters.js";

const profiles = [
  {id:"p1",name:"Privacy",provider:"Cloudflare",protocol:"DoH",servers:["1.1.1.1","1.0.0.1"],endpoint:"https://cloudflare-dns.com/dns-query",role:"resolver",enabled:true,order:1},
  {id:"p2",name:"Security",provider:"Quad9",protocol:"DoH",servers:["9.9.9.9","149.112.112.112"],endpoint:"https://dns.quad9.net/dns-query",role:"security",enabled:true,order:2},
  {id:"p3",name:"Backup",provider:"Google",protocol:"DoH",servers:["8.8.8.8","8.8.4.4"],endpoint:"https://dns.google/dns-query",role:"backup",enabled:true,order:3}
];

test("Apple MobileConfig exports every enabled DNS profile without collapsing to the first profile",()=>{
  const artifact=getExportArtifact("apple-mobileconfig",{name:"Multi DNS",dns:true,dnsProfiles:profiles,applePayloads:{dns:true,webclip:false,wifi:false,vpn:false,globalProxy:false}});
  assert.equal((artifact.match(/com\.apple\.dnsSettings\.managed/g)||[]).length,3);
  for(const p of profiles){
    assert.ok(artifact.includes(p.servers[0]));
    assert.ok(artifact.includes(p.endpoint));
  }
});

test("Apple MobileConfig excludes disabled DNS profiles",()=>{
  const artifact=getExportArtifact("apple-mobileconfig",{name:"Filtered DNS",dns:true,dnsProfiles:[profiles[0],{...profiles[1],enabled:false},profiles[2]],applePayloads:{dns:true,webclip:false,wifi:false,vpn:false,globalProxy:false}});
  assert.equal((artifact.match(/com\.apple\.dnsSettings\.managed/g)||[]).length,2);
  assert.ok(artifact.includes(profiles[0].endpoint));
  assert.ok(!artifact.includes(profiles[1].endpoint));
  assert.ok(artifact.includes(profiles[2].endpoint));
});

test("Surge export contains all enabled DNS servers",()=>{
  const artifact=getExportArtifact("surge",{dns:true,dnsProfiles:profiles});
  for(const p of profiles) for(const server of p.servers) assert.ok(artifact.includes(server));
});

test("WireGuard export contains DNS values from the normalized policy",()=>{
  const artifact=getExportArtifact("wireguard",{dnsServers:profiles[0].servers});
  assert.ok(artifact.includes("1.1.1.1"));
  assert.ok(artifact.includes("1.0.0.1"));
});

test("Shadowrocket export uses real line breaks and all enabled DNS servers",()=>{
  const artifact=getExportArtifact("shadowrocket",{dns:true,dnsProfiles:profiles,rules:[{match:"DOMAIN-SUFFIX,example.com",action:"DIRECT"}]});
  assert.ok(artifact.includes("[General]\ndns-server ="));
  assert.ok(artifact.includes("\n[Rule]\n"));
  for(const p of profiles) for(const server of p.servers) assert.ok(artifact.includes(server));
  assert.ok(artifact.includes("DOMAIN-SUFFIX,example.com, DIRECT"));
});
