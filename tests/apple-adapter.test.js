import test from "node:test";
import assert from "node:assert/strict";
import {compileAppleMobileConfig,compileAppleDeclarativeDns} from "../packages/apple-adapter/src/index.js";

test("Apple MobileConfig emits DNS payload from semantic policy",()=>{
  const result=compileAppleMobileConfig({policy:{name:"Test DNS",dnsServers:["1.1.1.1","2606:4700:4700::1111"],dnsProtocol:"HTTPS",dnsServerUrl:"https://dns.example/dns-query"}});
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

test("Apple MobileConfig can emit multiple payload types in one profile",()=>{
  const result=compileAppleMobileConfig({policy:{name:"Multi Payload",dnsServers:["1.1.1.1"],dnsProtocol:"HTTPS",dnsServerUrl:"https://dns.example/dns-query",applePayloads:{dns:true,webclip:true,wifi:true,vpn:false,globalProxy:false},webEntry:{name:"Test Web App",url:"https://example.com",enabled:true},wifiSSID:"TestWiFi",wifiPassword:"password"}});
  assert.match(result.content,/com\.apple\.dnsSettings\.managed/);
  assert.match(result.content,/com\.apple\.webClip\.managed/);
  assert.match(result.content,/com\.apple\.wifi\.managed/);
  assert.match(result.content,/Test Web App/);
  assert.equal(result.payloadCount,3);
});

test("Apple MobileConfig uses canonical webEntry and does not emit disabled Web Clip",()=>{
  const enabled=compileAppleMobileConfig({policy:{name:"Web Entry",dnsServers:[],webEntry:{name:"Canonical",url:"https://example.com",enabled:true},applePayloads:{dns:false,webclip:true,wifi:false,vpn:false,globalProxy:false}}});
  assert.match(enabled.content,/com\.apple\.webClip\.managed/);
  assert.match(enabled.content,/https:\/\/example\.com/);

  const disabled=compileAppleMobileConfig({policy:{name:"Web Entry",webEntry:{name:"Canonical",url:"https://example.com",enabled:false},applePayloads:{dns:false,webclip:true,wifi:false,vpn:false,globalProxy:false}}});
  assert.doesNotMatch(disabled.content,/com\.apple\.webClip\.managed/);
  assert.equal(disabled.payloadCount,0);
});

test("Apple MobileConfig rejects non-HTTPS Web Clip URLs",()=>{
  const result=compileAppleMobileConfig({policy:{name:"Web Entry",webEntry:{url:"http://example.com",enabled:true},applePayloads:{dns:false,webclip:true,wifi:false,vpn:false,globalProxy:false}}});
  assert.doesNotMatch(result.content,/com\.apple\.webClip\.managed/);
  assert.ok(result.warnings.some(x=>x.code==="APPLE_WEBCLIP_URL_REQUIRED"));
});

test("Apple MobileConfig accepts Web Clip icon data but never embeds an icon URL as Icon",()=>{
  const result=compileAppleMobileConfig({policy:{name:"Web Entry",webEntry:{url:"https://example.com",enabled:true,iconUrl:"https://example.com/icon.png",iconData:"YWJjZA=="},applePayloads:{dns:false,webclip:true,wifi:false,vpn:false,globalProxy:false}}});
  assert.match(result.content,/<key>Icon<\/key><data>YWJjZA==<\/data>/);
  assert.ok(result.warnings.some(x=>x.code==="APPLE_WEBCLIP_ICON_URL_NOT_EMBEDDED"));
});

test("Apple MobileConfig normalizes target-neutral DNS profiles inside the Apple adapter",()=>{
  const result=compileAppleMobileConfig({policy:{name:"Profiles",dnsProfiles:[{id:"cloudflare",name:"Cloudflare",protocol:"DoH",servers:["1.1.1.1"],endpoint:"https://cloudflare-dns.com/dns-query",enabled:true},{id:"nextdns",name:"NextDNS",protocol:"DoH",endpoint:"https://dns.nextdns.io",enabled:true}]}});
  assert.equal(result.payloadCount,2);
  assert.match(result.content,/cloudflare-dns\.com/);
  assert.match(result.content,/dns\.nextdns\.io/);
});
