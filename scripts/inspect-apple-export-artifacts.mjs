import { compileTargetExport } from "../packages/targets/src/exporters.js";

const scenarioId = "apple";
const fs = await import("node:fs/promises");
const path = await import("node:path");
const outputPath = path.resolve(new URL("../artifacts/export-inspection/", import.meta.url).pathname);

const scenarios = [
  {
    id: "mobileconfig-all-payloads",
    targetId: "apple-mobileconfig",
    input: {
      policy: {
        name: "Apple Complete Export Inspection",
        dnsProtocol: "HTTPS",
        dnsServerUrl: "https://cloudflare-dns.com/dns-query",
        dnsServers: ["1.1.1.1", "1.0.0.1"],
        dnsDomains: ["example.com", "internal.example"],
        applePayloads: { dns: true, webclip: true, wifi: true, vpn: false, globalProxy: true },
        webAppUrl: "https://example.com/app",
        webAppIconData: "iVBORw0KGgo=",
        wifiSSID: "InspectionWiFi",
        wifiName: "Inspection Wi-Fi",
        wifiPassword: "inspection-password",
        wifiAutoJoin: true,
        wifiEncryptionType: "WPA2",
        wifiHidden: false,
        proxyServer: "proxy.example.com:8080"
      }
    },
    required: [
      "com.apple.dnsSettings.managed",
      "<key>ServerURL</key><string>https://cloudflare-dns.com/dns-query</string>",
      "<key>SupplementalMatchDomains</key>",
      "<string>example.com</string>",
      "com.apple.webClip.managed",
      "<key>Icon</key><data>iVBORw0KGgo=</data>",
      "<key>URL</key><string>https://example.com/app</string>",
      "com.apple.wifi.managed",
      "<key>SSID_STR</key><string>InspectionWiFi</string>",
      "<key>Password</key><string>inspection-password</string>",
      "com.apple.proxy.http.global",
      "<key>ProxyServer</key><string>proxy.example.com</string>",
      "<key>ProxyServerPort</key><integer>8080</integer>"
    ]
  },
  {
    id: "mobileconfig-ikev2",
    targetId: "apple-mobileconfig",
    input: {
      policy: {
        name: "Apple IKEv2 Export Inspection",
        applePayloads: { dns: false, webclip: false, wifi: false, vpn: true, globalProxy: false },
        vpn: true,
        vpnProtocol: "ikev2",
        vpnName: "Inspection IKEv2",
        vpnRemoteAddress: "vpn.example.com",
        vpnLocalIdentifier: "client@example.com",
        vpnRemoteIdentifier: "vpn.example.com",
        vpnAuthenticationMethod: "SharedSecret",
        vpnSharedSecret: "inspection-shared-secret"
      }
    },
    required: [
      "com.apple.vpn.managed",
      "<key>VPNType</key><string>IKEv2</string>",
      "<key>RemoteAddress</key><string>vpn.example.com</string>",
      "<key>LocalIdentifier</key><string>client@example.com</string>",
      "<key>RemoteIdentifier</key><string>vpn.example.com</string>",
      "<key>SharedSecret</key><string>inspection-shared-secret</string>"
    ]
  },
  {
    id: "mobileconfig-l2tp",
    targetId: "apple-mobileconfig",
    input: {
      policy: {
        name: "Apple L2TP Export Inspection",
        applePayloads: { dns: false, webclip: false, wifi: false, vpn: true, globalProxy: false },
        vpn: true,
        vpnProtocol: "l2tp",
        vpnName: "Inspection L2TP",
        vpnRemoteAddress: "vpn.example.com",
        vpnAuthName: "l2tp-user",
        vpnAuthPassword: "inspection-password",
        vpnSharedSecret: "inspection-shared-secret"
      }
    },
    required: [
      "com.apple.vpn.managed",
      "<key>VPNType</key><string>L2TP</string>",
      "<key>CommRemoteAddress</key><string>vpn.example.com</string>",
      "<key>AuthName</key><string>l2tp-user</string>",
      "<key>AuthPassword</key><string>inspection-password</string>",
      "<key>SharedSecret</key><string>inspection-shared-secret</string>"
    ]
  },
  {
    id: "legacy-dns",
    targetId: "apple-mobileconfig-legacy",
    input: {
      policy: {
        name: "Apple Legacy DNS Inspection",
        dnsProtocol: "TLS",
        dnsServerName: "dns.example.com",
        dnsServers: ["9.9.9.9"],
        applePayloads: { dns: true, webclip: false, wifi: false, vpn: false, globalProxy: false }
      }
    },
    required: [
      "com.apple.dnsSettings.managed",
      "<key>DNSProtocol</key><string>TLS</string>",
      "<key>ServerName</key><string>dns.example.com</string>",
      "<key>ServerAddresses</key>"
    ]
  },
  {
    id: "declarative-dns-https",
    targetId: "apple-dns-declaration",
    input: {
      policy: {
        name: "Apple Declarative DNS HTTPS Inspection",
        dnsProtocol: "HTTPS",
        dnsServerUrl: "https://dns.example.com/dns-query",
        dnsServers: ["1.1.1.1", "1.0.0.1"],
        dnsDomains: ["example.com"],
        dnsDeclarationIdentifier: "com.example.dns.https",
        dnsServerToken: "inspection-token"
      }
    },
    required: [
      '"Type": "com.apple.configuration.network.dns-settings"',
      '"Identifier": "com.example.dns.https"',
      '"ServerToken": "inspection-token"',
      '"DNSProtocol": "HTTPS"',
      '"ServerURL": "https://dns.example.com/dns-query"',
      '"ServerAddresses": ['",
      '"SupplementalMatchDomains": ['"
    ]
  },
  {
    id: "declarative-dns-tls",
    targetId: "apple-dns-declaration",
    input: {
      policy: {
        name: "Apple Declarative DNS TLS Inspection",
        dnsProtocol: "TLS",
        dnsServerName: "dns.example.com",
        dnsServers: ["9.9.9.9"],
        dnsAllowFailover: true,
        dnsDeclarationIdentifier: "com.example.dns.tls",
        dnsServerToken: "inspection-token-tls"
      }
    },
    required: [
      '"DNSProtocol": "TLS"',
      '"ServerName": "dns.example.com"',
      ""ServerAddresses": [",
      '"AllowFailover": true'"
    ]
  }
];

const failures = [];
const artifacts = [];

function fail(targetId, code, message) {
  failures.push({ scenarioId, targetId, code, message });
}

await fs.mkdir(outputPath, { recursive: true });
await fs.rm(path.join(outputPath, scenarioId), { recursive: true, force: true });

for (const scenario of scenarios) {
  let result;
  try {
    result = compileTargetExport(scenario.targetId, scenario.input);
  } catch (error) {
    fail(scenario.targetId, "COMPILE_FAILED", scenario.id + ": " + (error instanceof Error ? error.message : String(error)));
    continue;
  }

  const artifact = String(result.representation ?? "");
  if (!artifact.trim()) {
    fail(scenario.targetId, "EMPTY_ARTIFACT", scenario.id + ": empty Apple artifact.");
    continue;
  }

  for (const value of scenario.required) {
    if (!artifact.includes(value)) fail(scenario.targetId, "FIELD_LOSS", scenario.id + ": missing " + value);
  }

  const targetDir = path.join(outputPath, scenarioId, scenario.id);
  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(path.join(targetDir, result.filename), artifact, "utf8");

  const manifest = {
    scenarioId,
    scenarioIdDetail: scenario.id,
    targetId: scenario.targetId,
    filename: result.filename,
    mime: result.mime,
    outputFormat: result.outputFormat,
    verifiedStatus: result.verifiedStatus,
    bytes: Buffer.byteLength(artifact, "utf8"),
    warnings: result.warnings
  };
  await fs.writeFile(path.join(targetDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  artifacts.push(manifest);
}

const report = {
  inspection: "target-export-artifacts",
  scenarioId,
  scenarioCount: scenarios.length,
  generatedArtifacts: artifacts.length,
  passed: failures.length === 0,
  failureCount: failures.length,
  failures,
  artifacts
};

await fs.writeFile(path.join(outputPath, scenarioId, "manifest.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify(report, null, 2));
process.exitCode = failures.length ? 1 : 0;
