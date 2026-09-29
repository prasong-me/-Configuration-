import { compileTargetExport } from "../packages/targets/src/exporters.js";
import { listTargetData } from "../packages/targets/src/target-data.js";

const scenarioId = "dns";
const targets = listTargetData().filter(target => target.capabilities.includes("dns"));
const httpsUrl = ["https:", "", "dns.example.com", "dns-query"].join("/");
const scenarios = [
  {
    id: "servers",
    input: { policy: { name: "DNS Servers", dnsServers: ["1.1.1.1", "1.0.0.1"], dnsProtocol: "TLS", dnsServerName: "dns.example.com" } },
    supported: new Set(targets.map(target => target.id)),
    required: ["1.1.1.1", "1.0.0.1"]
  },
  {
    id: "https",
    input: { policy: { name: "DNS HTTPS", dnsServers: ["1.1.1.1", "1.0.0.1"], dnsProtocol: "HTTPS", dnsServerUrl: httpsUrl, dnsDomains: ["example.com"] } },
    supported: new Set(["apple-mobileconfig", "apple-dns-declaration", "apple-mobileconfig-legacy"]),
    requiredByTarget: new Map([
      ["apple-mobileconfig", ["DNSProtocol", "ServerURL", "SupplementalMatchDomains"]],
      ["apple-dns-declaration", ["DNSProtocol", "ServerURL", "SupplementalMatchDomains"]],
      ["apple-mobileconfig-legacy", ["DNSProtocol", "ServerURL", "SupplementalMatchDomains"]]
    ])
  },
  {
    id: "tls",
    input: { policy: { name: "DNS TLS", dnsServers: ["9.9.9.9"], dnsProtocol: "TLS", dnsServerName: "dns.example.com", dnsDomains: ["internal.example"] } },
    supported: new Set(["apple-mobileconfig", "apple-dns-declaration", "apple-mobileconfig-legacy"]),
    requiredByTarget: new Map([
      ["apple-mobileconfig", ["DNSProtocol", "ServerName", "SupplementalMatchDomains"]],
      ["apple-dns-declaration", ["DNSProtocol", "ServerName", "SupplementalMatchDomains"]],
      ["apple-mobileconfig-legacy", ["DNSProtocol", "ServerName", "SupplementalMatchDomains"]]
    ])
  },
  {
    id: "profiles",
    input: { policy: { name: "DNS Profiles", dnsProfiles: [
      { id: "primary", name: "Primary DNS", protocol: "HTTPS", servers: ["1.1.1.1"], endpoint: httpsUrl, domains: ["example.com"], enabled: true },
      { id: "backup", name: "Backup DNS", protocol: "TLS", servers: ["9.9.9.9"], serverName: "dns9.example.com", domains: ["internal.example"], enabled: true }
    ] } },
    supported: new Set(["apple-mobileconfig", "apple-mobileconfig-legacy"]),
    requiredByTarget: new Map([
      ["apple-mobileconfig", ["Primary DNS", "Backup DNS", "dns9.example.com"]],
      ["apple-mobileconfig-legacy", ["Primary DNS", "Backup DNS", "dns9.example.com"]]
    ])
  }
];

const failures = [];
const artifacts = [];
function fail(targetId, code, message) { failures.push({ scenarioId, targetId, code, message }); }
for (const target of targets) {
  for (const scenario of scenarios) {
    const shouldSupport = scenario.supported.has(target.id);
    try {
      const result = compileTargetExport(target.id, scenario.input);
      const artifact = String(result.representation ?? "");
      if (!shouldSupport) {
        fail(target.id, "UNSUPPORTED_NOT_REJECTED", scenario.id + ": unsupported DNS data was accepted.");
        continue;
      }
      if (!artifact.trim()) { fail(target.id, "EMPTY_ARTIFACT", scenario.id + ": empty artifact."); continue; }
      const required = scenario.requiredByTarget?.get(target.id) ?? scenario.required ?? [];
      for (const value of required) if (!artifact.includes(value)) fail(target.id, "DNS_FIELD_LOSS", scenario.id + ": missing " + value);
      artifacts.push({ scenarioId, scenarioIdDetail: scenario.id, targetId: target.id, filename: result.filename, mime: result.mime, outputFormat: result.outputFormat, bytes: Buffer.byteLength(artifact) });
    } catch (error) {
      const message = String(error?.message ?? error);
      if (shouldSupport) fail(target.id, "COMPILE_FAILED", scenario.id + ": " + message);
      else if (!message.includes("UNSUPPORTED_CAPABILITY")) fail(target.id, "WRONG_REJECTION", scenario.id + ": " + message);
    }
  }
}
const report = { inspection: "target-export-artifacts", scenarioId, targetCount: targets.length, scenarioCount: scenarios.length, generatedArtifacts: artifacts.length, passed: failures.length === 0, failureCount: failures.length, failures, artifacts };
console.log(JSON.stringify(report, null, 2));
process.exitCode = failures.length ? 1 : 0;
