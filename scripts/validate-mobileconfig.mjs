#!/usr/bin/env node
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { getExportArtifact } from "../packages/targets/src/exporters.js";

function run(command,args){
  const result=spawnSync(command,args,{encoding:"utf8"});
  if(result.error) throw result.error;
  if(result.status!==0) throw new Error(`${command} failed: ${result.stderr||result.stdout||"unknown error"}`);
  return result.stdout;
}

function assert(condition,message){
  if(!condition) throw new Error(message);
}

const profiles=[
  {id:"p1",name:"Privacy",provider:"Cloudflare",protocol:"DoH",servers:["1.1.1.1","1.0.0.1"],endpoint:"https://cloudflare-dns.com/dns-query",enabled:true,order:1},
  {id:"p2",name:"Security",provider:"Quad9",protocol:"DoH",servers:["9.9.9.9","149.112.112.112"],endpoint:"https://dns.quad9.net/dns-query",enabled:true,order:2},
  {id:"p3",name:"Backup",provider:"Google",protocol:"DoH",servers:["8.8.8.8","8.8.4.4"],endpoint:"https://dns.google/dns-query",enabled:true,order:3},
  {id:"disabled",name:"Disabled",provider:"Test",protocol:"DoH",servers:["192.0.2.1"],endpoint:"https://example.invalid/dns-query",enabled:false,order:4}
];

const artifact=getExportArtifact("apple-mobileconfig",{
  name:"CI MobileConfig",
  dns:true,
  dnsProfiles:profiles,
  applePayloads:{dns:true,webclip:true,wifi:true,vpn:true,globalProxy:true},
  webAppUrl:"https://example.com/",
  webAppIconUrl:"https://example.com/icon.png",
  wifiSSID:"CI-Test-WiFi",
  wifiPassword:"test-password",
  wifiHidden:false,
  vpnProtocol:"ikev2",
  vpnRemoteAddress:"vpn.example.com",
  vpnRemoteIdentifier:"vpn.example.com",
  vpnLocalIdentifier:"ci@example.com",
  vpnAuthenticationMethod:"SharedSecret",
  vpnSharedSecret:"ci-shared-secret",
  proxyServer:"proxy.example.com:8080",
  vpnName:"CI IKEv2",
  wifiName:"CI Wi-Fi"
});

const dir=mkdtempSync(join(tmpdir(),"configuration-mobileconfig-"));
const file=join(dir,"profile.mobileconfig");
const xml=join(dir,"profile.xml");
const decoded=join(dir,"decoded.plist");
writeFileSync(file,artifact,"utf8");

try{
  run("plutil",["-convert","xml1","-o",xml,file]);
  run("xmllint",["--noout",xml]);

  const parsed=JSON.parse(run("python3",["-c",`
import json, plistlib, sys
with open(sys.argv[1],"rb") as f:
    value=plistlib.load(f)
print(json.dumps(value))
`,xml]));

  assert(parsed.PayloadType==="Configuration","Top-level PayloadType must be Configuration");
  assert(Array.isArray(parsed.PayloadContent),"PayloadContent must be an array");

  const dnsPayloads=parsed.PayloadContent.filter(p=>p.PayloadType==="com.apple.dnsSettings.managed");
  assert(dnsPayloads.length===3,`Expected 3 enabled DNS payloads, got ${dnsPayloads.length}`);
  const payloadTypes=parsed.PayloadContent.map(p=>p.PayloadType);
  for(const type of ["com.apple.dnsSettings.managed","com.apple.webClip.managed","com.apple.wifi.managed","com.apple.vpn.managed","com.apple.proxy.http.global"]){
    assert(payloadTypes.includes(type),`Expected MobileConfig payload type ${type}`);
  }
  assert(parsed.PayloadContent.length===7,`Expected all enabled payloads: 3 DNS + WebClip + Wi-Fi + VPN + Global Proxy, got ${parsed.PayloadContent.length}`);

  const expected=profiles.filter(p=>p.enabled!==false);
  for(const profile of expected){
    const found=dnsPayloads.find(p=>p.DNSSettings?.ServerURL===profile.endpoint);
    assert(found,`DNS profile ${profile.id} was not represented in MobileConfig`);
    assert(found.PayloadIdentifier && found.PayloadUUID,"DNS payload is missing PayloadIdentifier/PayloadUUID");
    assert(Array.isArray(found.DNSSettings.ServerAddresses),"DNS ServerAddresses must be an array");
  }

  const disabledFound=dnsPayloads.some(p=>p.DNSSettings?.ServerURL==="https://example.invalid/dns-query");
  assert(!disabledFound,"Disabled DNS profile was exported unexpectedly");

  const signed=process.argv.includes("--signed");
  if(signed){
    assert(existsSync(process.argv[process.argv.indexOf("--signed")+1]),"Signed file argument missing");
    const signedFile=process.argv[process.argv.indexOf("--signed")+1];
    run("security",["cms","-V","-i",signedFile]);
  }

  console.log(JSON.stringify({
    valid:true,
    file,
    payloadCount:parsed.PayloadContent.length,
    dnsProfiles:dnsPayloads.length,
    signedChecked:signed
  }));
} finally {
  rmSync(dir,{recursive:true,force:true});
}
