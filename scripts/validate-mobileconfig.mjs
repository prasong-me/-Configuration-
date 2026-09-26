#!/usr/bin/env node
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { getExportArtifact } from "../packages/targets/src/exporters.js";

const policy = {
  name: "MobileConfig Validation",
  dns: true,
  dnsProfiles: [
    {id:"p1",name:"Privacy",protocol:"DoH",servers:["1.1.1.1","1.0.0.1"],endpoint:"https://cloudflare-dns.com/dns-query",enabled:true},
    {id:"p2",name:"Security",protocol:"DoH",servers:["9.9.9.9","149.112.112.112"],endpoint:"https://dns.quad9.net/dns-query",enabled:true},
    {id:"p3",name:"Backup",protocol:"DoH",servers:["8.8.8.8","8.8.4.4"],endpoint:"https://dns.google/dns-query",enabled:true}
  ],
  applePayloads:{dns:true,webclip:true,wifi:true,vpn:true,globalProxy:true},
  webAppUrl:"https://example.com/",
  wifiSSID:"CI-Test-WiFi",
  wifiPassword:"test-password",
  vpnProtocol:"l2tp",
  vpnRemoteAddress:"219.100.37.123",
  vpnAuthName:"vpn",
  vpnAuthPassword:"vpn",
  vpnSharedSecret:"vpn",
  proxyServer:"103.237.102.191:11111"
};

const artifact = getExportArtifact("apple-mobileconfig", policy);
const dir = mkdtempSync(join(tmpdir(), "configuration-mobileconfig-validation-"));
const file = join(dir, "profile.mobileconfig");
const xml = join(dir, "profile.xml");
writeFileSync(file, artifact, "utf8");

const python = [
  "import plistlib,sys",
  "with open(sys.argv[1],'rb') as f: p=plistlib.load(f)",
  "assert p['PayloadType']=='Configuration'",
  "payloads=p['PayloadContent']",
  "assert len(payloads)==7",
  "dns=[x for x in payloads if x['PayloadType']=='com.apple.dnsSettings.managed']",
  "assert len(dns)==3",
  "assert [x['DNSSettings']['ServerAddresses'] for x in dns]==[['1.1.1.1','1.0.0.1'],['9.9.9.9','149.112.112.112'],['8.8.8.8','8.8.4.4']]",
  "vpn=[x for x in payloads if x['PayloadType']=='com.apple.vpn.managed'][0]",
  "assert vpn['VPNType']=='L2TP'",
  "assert vpn['PPP']['CommRemoteAddress']=='219.100.37.123'",
  "assert vpn['PPP']['AuthName']=='vpn'",
  "assert vpn['IPSec']['SharedSecret']=='vpn'",
  "proxy=[x for x in payloads if x['PayloadType']=='com.apple.proxy.http.global'][0]",
  "assert proxy['ProxyServer']=='103.237.102.191'",
  "assert proxy['ProxyServerPort']==11111",
  "print('MobileConfig validation passed: 7 payloads, 3 DNS profiles, L2TP VPN, Global HTTP Proxy')"
].join(";");

try {
  const p = spawnSync("plutil", ["-convert","xml1","-o",xml,file], {encoding:"utf8"});
  if (p.status !== 0) throw new Error(p.stderr || "plutil validation failed");
  const py = spawnSync("python3", ["-c",python,xml], {encoding:"utf8"});
  if (py.status !== 0) throw new Error(py.stderr || py.stdout || "plist assertions failed");
  console.log(py.stdout.trim());
} finally {
  rmSync(dir,{recursive:true,force:true});
}
