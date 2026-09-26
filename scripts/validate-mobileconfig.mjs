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
    {id:"p1",name:"Privacy",protocol:"HTTPS",servers:["1.1.1.1","1.0.0.1"],endpoint:"https://cloudflare-dns.com/dns-query",enabled:true},
    {id:"p2",name:"NextDNS",protocol:"HTTPS",addressMode:"hostname",servers:["dns.nextdns.io"],endpoint:"https://dns.nextdns.io",serverName:"dns.nextdns.io",enabled:true},
    {id:"p3",name:"AdGuard DNS",protocol:"HTTPS",addressMode:"hostname",servers:["dns.adguard-dns.com"],endpoint:"https://dns.adguard-dns.com/dns-query",serverName:"dns.adguard-dns.com",enabled:true}
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
  "import plistlib,json,sys; print(json.dumps(plistlib.load(open(sys.argv[1],'rb'))))"
].join(";");

try {
  const p = spawnSync("plutil", ["-convert","xml1","-o",xml,file], {encoding:"utf8"});
  if (p.status !== 0) throw new Error(p.stderr || "plutil validation failed");
  const py = spawnSync("python3", ["-c",python,xml], {encoding:"utf8"});
  if (py.status !== 0) throw new Error(py.stderr || py.stdout || "plist parse failed");
  const plist = JSON.parse(py.stdout);
  const payloads = plist.PayloadContent || [];
  if (plist.PayloadType !== "Configuration") throw new Error("top-level PayloadType mismatch");
  if (payloads.length !== 7) throw new Error("payloadCount="+payloads.length+" types="+JSON.stringify(payloads.map(x=>x.PayloadType)));
  const dns = payloads.filter(x=>x.PayloadType==="com.apple.dnsSettings.managed");
  if (dns.length !== 3) throw new Error("dnsPayloadCount="+dns.length);
  const dnsServers = dns.map(x=>x.DNSSettings?.ServerAddresses);
  const expectedDns = [["1.1.1.1","1.0.0.1"],["dns.nextdns.io"],["dns.adguard-dns.com"]];
  if (JSON.stringify(dnsServers)!==JSON.stringify(expectedDns)) throw new Error("dnsServers="+JSON.stringify(dnsServers));
  const vpn = payloads.find(x=>x.PayloadType==="com.apple.vpn.managed");
  if (!vpn || vpn.VPNType!=="L2TP") throw new Error("VPN payload mismatch: "+JSON.stringify(vpn));
  if (vpn.PPP?.CommRemoteAddress!=="219.100.37.123" || vpn.PPP?.AuthName!=="vpn" || vpn.IPSec?.SharedSecret!=="vpn") throw new Error("L2TP fields mismatch: "+JSON.stringify(vpn));
  const proxy = payloads.find(x=>x.PayloadType==="com.apple.proxy.http.global");
  if (!proxy || proxy.ProxyServer!=="103.237.102.191" || proxy.ProxyServerPort!==11111) throw new Error("proxy mismatch: "+JSON.stringify(proxy));
  console.log("MobileConfig validation passed: 7 payloads, 3 DNS profiles, L2TP VPN, Global HTTP Proxy");
} finally {
  rmSync(dir,{recursive:true,force:true});
}
