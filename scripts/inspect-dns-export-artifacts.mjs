import { compileTargetExport } from "../packages/targets/src/exporters.js";
import { listTargetData } from "../packages/targets/src/target-data.js";

const scenarioId = "dns";
const targets = listTargetData().filter(target => target.capabilities.includes("dns"));
const baseline = {
  policy: {
    name: "DNS Export Inspection",
    dnsServers: ["1.1.1.1", "1.0.0.1"],
    dnsProtocol: "HTTPS",
    dnsServerUrl: "https://dns.example.com/dns-query",
    dnsDomains: ["example.com", "internal.example"]
  }
};

const scenarios = [
  {
    id: "servers",
    input: { policy: { ...baseline.policy, dnsProtocol: "HTTPS", dnsServerUrl: "" } },
    requiredByTarget: new Map(targets.map(target => [target.id, ["1.1.1.1", "1.0.0.1"]]))
  },
  {
    id: "https",
    input: { policy: baseline },
    supported: new Set(["apple-mobileconfig", "apple-dns-declaration", "apple-mobileconfig-legacy"]),
    requiredByTarget: new Map([
      ["apple-mobileconfig", [
        "DNSProtocol</key><string>HTTPS",
        "ServerURL</key><string>https://dns.example.com/dns-query",
        "SupplementalMatchDomains"
      ]],
      ["apple-dns-declaration", [
        '"DNSProtocol": "HTTPS"',
        '"ServerURL": "https://dns.example.com/dns-query"',
        '"SupplementalMatchDomains"'
      ]],
      ["apple-mobileconfig-legacy", [
        "DNSProtocol</key><string>HTTPS",
        "ServerURL</key><string>https://dns.example.com/dns-query",
        "SupplementalMatchDomains"
      ]]
    ])
  },
  {
    id: "tls",
    input: {
      policy: {
        ...baseline.policy,
        dnsProtocol: "TLS",
        dnsServerUrl: "",
        dnsServerName: "dns.example.com"
      }
    },
    supported: new Set(["apple-mobileconfig", "apple-dns-declaration", "apple-mobileconfig-legacy"]),
    requiredByTarget: new Map([
      ["apple-mobileconfig", [
        "DNSProtocol</key><string>TLS",
        "ServerName</key><string>dns.example.com",
        "SupplementalMatchDomains"
      ]],
      ["apple-dns-declaration", [
        '"DNSProtocol": "TLS"',
        '"ServerName": "dns.example.com"',
        '"SupplementalMatchDomains"'
      ]],
      ["apple-mobileconfig-legacy", [
        "DNSProtocol</key><string>TLS",
        "ServerName</key><string>dns.example.com",
        "SupplementalMatchDomains"
      ]]
    ])
  },
  {
    id: "profile",
    input: {
      policy: {
        ...baseline.policy,
        dnsProfiles: [
          {
            id: "primary",
            name: "Primary DNS",
            protocol: "HTTPS",
            servers: ["1.1.1.1", "1.0.0.1"],
            endpoint: "https://dns.example.com/dns-query",
            domains: ["example.com"],
            enabled: true
          },
          {
            id: "backup",
            name: "Backup DNS",
            protocol: "TLS",
            servers: ["9.9.9.9"],
            serverName: "dns9.example.com",
            domains: ["internal.example"],
            enabled: true
          }
        ]
      }
    },
    supported: new Set(["apple-mobileconfig", "apple-dns-declaration", "apple-mobileconfig-legacy"]),
    requiredByTarget: new Map([
      ["apple-mobileconfig", ["Primary DNS", "Backup DNS", "dns9.example.com"]],
      ["apple-dns-declaration", ['"DNSProtocol": "HTTPS"', '"ServerURL": "https://dns.example.com/dns-query"']],
      ["apple-mobileconfig-legacy", ["Primary DNS", "Backup DNS", "dns9.example.com"]]
    ])
  }
];

const failures = [];
const artifacts = [];
function fail(targetId, code, message) {
  failures.push({ scenarioId, targetId, code, message });
}
function record(targetId, scenario, result) {
  const artifact = String(result.representation ?? "");
  if (!artifact.trim()) return fail(targetId, "EMPTY_ARTIFACT", scenario.id + ": empty artifact.");
  for (const value of scenario.requiredByTarget.get(targetId) ?? []) {
    if (!artifact.includes(value)) fail(targetId, "DNS_FIELD_LOSS", scenario.id + ": missing " + value);
  }
  artifacts.push({ scenarioId, scenarioIdDetail: scenario.id, targetId, outputFormat: result.outputFormat, filename: result.filename, mime: result.mime, bytes: Buffer.byteLength(artifact) });
}

for (const target of targets) {
  for (const scenario of scenarios) {
    const shouldSupport = scenario.supported ? scenario.supported.has(target.id) : true;
    try {
      const result = compileTargetExport(target.id, scenario.input);
      if (!shouldSupport) {
        fail(target.id, "UNSUPPORTED_NOT_REJECTED", scenario.id + ": target accepted DNS fields it does not declare.");
        continue;
      }
      record(target.id, scenario, result);
    } catch (error) {
      if (shouldSupport) fail(target.id, "COMPILE_FAILED", scenario.id + ": " + (error instanceof Error ? error.message : String(error)));
      else if (!String(error?.message ?? error).includes("UNSUPPORTED_CAPABILITY")) fail(target.id, "WRONG_REJECTION", scenario.id + ": " + String(error?.message ?? error));
    }
  }
}

const report = {
  inspection: "target-export-artifacts",
  scenarioId,
  targetCount: targets.length,
  scenarioCount: scenarios.length,
  generatedArtifacts: artifacts.length,
  passed: failures.length === 0,
  failureCount: failures.length,
  failures,
  artifacts
};
console.log(JSON.stringify(report, null, 2));
process.exitCode = failures.length ? 1 : 0;
