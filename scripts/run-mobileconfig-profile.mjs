#!/usr/bin/env node
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { getExportArtifact } from "../packages/targets/src/exporters.js";

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `${command} failed`);
  return result.stdout;
}

const profiles = [
  { id: "p1", name: "Privacy", provider: "Cloudflare", protocol: "DoH", servers: ["1.1.1.1", "1.0.0.1"], endpoint: "https://cloudflare-dns.com/dns-query", enabled: true, order: 1 },
  { id: "p2", name: "Security", provider: "Quad9", protocol: "DoH", servers: ["9.9.9.9", "149.112.112.112"], endpoint: "https://dns.quad9.net/dns-query", enabled: true, order: 2 },
  { id: "p3", name: "Backup", provider: "Google", protocol: "DoH", servers: ["8.8.8.8", "8.8.4.4"], endpoint: "https://dns.google/dns-query", enabled: true, order: 3 }
];

const artifact = getExportArtifact("apple-mobileconfig", {
  name: "Run Profile",
  dns: true,
  dnsProfiles: profiles,
  applePayloads: { dns: true, webclip: true, wifi: true, vpn: true, globalProxy: true },
  webAppUrl: "https://example.com/",
  webAppIconUrl: "https://example.com/icon.png",
  wifiSSID: "CI-Test-WiFi",
  wifiPassword: "test-password",
  wifiHidden: false,
  vpnProtocol: "l2tp",
  vpnRemoteAddress: "219.100.37.123",
  vpnAuthName: "vpn",
  vpnAuthPassword: "vpn",
  vpnSharedSecret: "vpn",
  vpnName: "VPN Gate L2TP Test",
  proxyServer: "103.237.102.191:11111",
  wifiName: "CI Wi-Fi"
});

const output = process.argv[2] || "artifacts/mobileconfig-profile.mobileconfig";
const report = process.argv[3] || "artifacts/mobileconfig-profile.json";
writeFileSync(output, artifact, "utf8");

const dir = mkdtempSync(join(tmpdir(), "configuration-mobileconfig-profile-"));
const xml = join(dir, "profile.xml");

try {
  run("plutil", ["-convert", "xml1", "-o", xml, output]);
  const plist = JSON.parse(run("python3", ["-c", `
import json, plistlib, sys
with open(sys.argv[1], "rb") as f:
    print(json.dumps(plistlib.load(f)))
`, xml]));

  const payloads = plist.PayloadContent || [];
  const summary = payloads.map((payload) => ({
    type: payload.PayloadType,
    identifier: payload.PayloadIdentifier,
    uuid: payload.PayloadUUID,
    visibleName: payload.PayloadDisplayName || payload.PayloadDescription || null,
    dnsServerURL: payload.DNSSettings?.ServerURL || null,
    dnsServers: payload.DNSSettings?.ServerAddresses || null,
    webClipURL: payload.URL || null,
    wifiSSID: payload.SSID_STR || null,
    vpnType: payload.VPNType || null,
    vpnRemoteAddress: payload.PPP?.CommRemoteAddress || payload.IKEv2?.RemoteAddress || null,
    vpnAuthName: payload.PPP?.AuthName || payload.IKEv2?.AuthName || null,
    vpnHasSharedSecret: Boolean(payload.IPSec?.SharedSecret || payload.IKEv2?.SharedSecret),
    vpnOverridePrimary: payload.IPv4?.OverridePrimary ?? null,
    proxyServer: payload.ProxyServer || null,
    proxyPort: payload.ProxyServerPort || null
  }));

  writeFileSync(report, JSON.stringify({
    profile: plist.PayloadDisplayName,
    topLevelPayloadType: plist.PayloadType,
    payloadCount: payloads.length,
    payloads: summary
  }, null, 2) + "\n");
} finally {
  rmSync(dir, { recursive: true, force: true });
}
