import test from "node:test";
import assert from "node:assert/strict";
import {compileAppleMobileConfig,compileAppleDeclarativeDns} from "../packages/apple-adapter/src/index.js";

test("Apple MobileConfig emits DNS payload from semantic policy",()=>{
  const result=compileAppleMobileConfig({policy:{
    name:"Test DNS",
    dnsServers:["1.1.1.1","2606:4700:4700::1111"],
    dnsProtocol:"HTTPS",
    dnsServerUrl:"https://dns.example/dns-query"
  }});
  assert.match(result.content,/com\.apple\.dnsSettings\.managed/);
  assert.match(result.content,/1\.1\.1\.1/);
  assert.equal(result.payloadCount,1);
});

test("Apple MobileConfig warns only when selected configuration needs missing information",()=>{
  const result=compileAppleMobileConfig({policy:{name:"Test DNS",dnsServers:["1.1.1.1"],dnsProtocol:"HTTPS"}});
  assert.ok(result.warnings.some(x=>x.code==="APPLE_DNS_SERVER_URL_REQUIRED"));
});

test("Apple declarative DNS uses the current declaration type",()=>{
  const result=compileAppleDeclarativeDns({policy:{name:"Test DNS",dnsServers:["1.1.1.1"],dnsProtocol:"HTTPS",dnsServerUrl:"https://dns.example/dns-query"}});
  assert.equal(result.Type,"com.apple.configuration.network.dns-settings");
  assert.equal(result.Payload.DNSSettings.ServerURL,"https://dns.example/dns-query");
});

test("Apple MobileConfig emits IKEv2 when required fields are present",()=>{
  const result=compileAppleMobileConfig({policy:{
    name:"IKEv2",
    applePayloads:{dns:false,webclip:false,wifi:false,vpn:true,globalProxy:false},
    vpnRemoteAddress:"vpn.example.com",
    vpnRemoteIdentifier:"vpn.example.com",
    vpnLocalIdentifier:"user@example.com",
    vpnSharedSecret:"secret"
  }});
  assert.match(result.content,/com\\.apple\\.vpn\\.managed/);
  assert.match(result.content,/vpn\.example\.com/);
  assert.equal(result.payloadCount,1);
});

test("Apple MobileConfig emits Global HTTP Proxy only for valid host:port",()=>{
  const result=compileAppleMobileConfig({policy:{
    name:"Global Proxy",
    proxyServer:"127.0.0.1:6152",
    applePayloads:{dns:false,webclip:false,wifi:false,vpn:false,globalProxy:true}
  }});
  assert.match(result.content,/com\\.apple\\.proxy\\.http\\.global/);
  assert.match(result.content,/6152/);
  assert.ok(result.warnings.some(x=>x.code==="APPLE_GLOBAL_PROXY_SUPERVISION"));
  assert.equal(result.payloadCount,1);
});

test("Apple MobileConfig rejects malformed Global HTTP Proxy without emitting a payload",()=>{
  const result=compileAppleMobileConfig({policy:{
    name:"Global Proxy",
    proxyServer:"127.0.0.1",
    applePayloads:{dns:false,webclip:false,wifi:false,vpn:false,globalProxy:true}
  }});
  assert.equal(result.payloadCount,0);
  assert.ok(result.warnings.some(x=>x.code==="APPLE_GLOBAL_PROXY_FORMAT"));
});

test("Apple MobileConfig can emit multiple payload types in one profile",()=>{
  const result=compileAppleMobileConfig({policy:{
    name:"Multi Payload",
    dnsServers:["1.1.1.1"],
    dnsProtocol:"HTTPS",
    dnsServerUrl:"https://dns.example/dns-query",
    applePayloads:{dns:true,webclip:true,wifi:true,vpn:false,globalProxy:false},
    webAppUrl:"https://example.com",
    wifiSSID:"TestWiFi",
    wifiPassword:"password"
  }});
  assert.match(result.content,/com\.apple\.dnsSettings\.managed/);
  assert.match(result.content,/com\.apple\.webClip\.managed/);
  assert.match(result.content,/com\.apple\.wifi\.managed/);
  assert.equal(result.payloadCount,3);
});
