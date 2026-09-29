import { compileTargetExport } from "../packages/targets/src/exporters.js";
import { listTargetData } from "../packages/targets/src/target-data.js";

const scenarioId = "dns";
const targets = listTargetData().filter(target => target.capabilities.includes("dns"));

const dnsServers = ["9.9.9.9", "149.112.112.112"];
const input = {
  policy: {
    name: "DNS Export Inspection",
    dns: true,
    dnsProtocol: "HTTPS",
    dnsServers,
    dnsServerUrl: "https://dns.quad9.net/dns-query",
    dnsServerName: "dns.quad9.net",
    dnsDomains: ["example.com", "internal.example"],
    dnsProfiles: [{
      id: "inspection-dns",
      name: "Inspection DoH",
      protocol: "HTTPS",
      servers: dnsServers,
      endpoint: "https://dns.quad9.net/dns-query",
      serverName: "dns.quad9.net",
      domains: ["example.com", "internal.example"],
      enabled: true
    }]
  }
};

const outputDir = new URL("../artifacts/export-inspection/", import.meta.url);
const fs = await import("node:fs/promises");
const path = await import("node:path");
const outputPath = path.resolve(outputDir.pathname);

const failures = [];
const warnings = [];
const artifacts = [];

function fail(targetId, code, message) {
  failures.push({ scenarioId, targetId, code, message });
}

function warn(targetId, code, message) {
  warnings.push({ scenarioId, targetId, code, message });
}

function hasAll(artifact, values) {
  return values.every(value => artifact.includes(value));
}

await fs.rm(outputPath, { recursive: true, force: true });
await fs.mkdir(outputPath, { recursive: true });

for (const target of targets) {
  let result;
  try {
    result = compileTargetExport(target.id, input);
  } catch (error) {
    fail(target.id, "COMPILE_FAILED", error instanceof Error ? error.message : String(error));
    continue;
  }

  const artifact = String(result.representation ?? "");
  if (!artifact.trim()) {
    fail(target.id, "EMPTY_ARTIFACT", "DNS exporter produced an empty artifact.");
    continue;
  }

  if (result.filename !== `${target.id}-config${target.output.extension}`) {
    fail(target.id, "FILENAME_MISMATCH", `Expected ${target.output.extension} for ${target.id}.`);
  }

  if (result.mime !== target.output.mime) {
    fail(target.id, "MIME_MISMATCH", `Exporter MIME ${result.mime} differs from target data MIME ${target.output.mime}.`);
  }

  const formatMap = { plist: "plist", json: "json", yaml: "yaml", text: "text", ini: "text" };
  const expectedOutputFormat = formatMap[target.output.format];
  if (expectedOutputFormat && result.outputFormat !== expectedOutputFormat) {
    fail(target.id, "OUTPUT_FORMAT_MISMATCH", `Target data declares ${target.output.format}; exporter reports ${result.outputFormat}.`);
  }

  if (!hasAll(artifact, dnsServers)) {
    fail(target.id, "DNS_SERVER_LOSS", "One or more canonical DNS server values were not preserved.");
  }

  if (target.id === "apple-dns-declaration") {
    try {
      const declaration = JSON.parse(artifact);
      const settings = declaration.Payload?.DNSSettings;
      if (declaration.Type !== "com.apple.configuration.network.dns-settings") {
        fail(target.id, "APPLE_DNS_TYPE", "Unexpected Apple declarative DNS Type.");
      }
      if (settings?.DNSProtocol !== "HTTPS") {
        fail(target.id, "APPLE_DNS_PROTOCOL", "Apple DNS declaration did not preserve DNSProtocol=HTTPS.");
      }
      if (settings?.ServerURL !== "https://dns.quad9.net/dns-query") {
        fail(target.id, "APPLE_DNS_SERVER_URL", "Apple DNS declaration did not preserve the DoH ServerURL.");
      }
      if (settings?.ServerName !== "dns.quad9.net") {
        fail(target.id, "APPLE_DNS_SERVER_NAME", "Apple DNS declaration did not preserve ServerName.");
      }
      if (!hasAll(JSON.stringify(settings?.SupplementalMatchDomains ?? []), input.policy.dnsDomains)) {
        warn(target.id, "DNS_DOMAINS_NOT_EMITTED", "Supplemental DNS domains were not preserved by the declarative DNS exporter.");
      }
    } catch {
      fail(target.id, "JSON_INVALID", "Apple DNS declaration artifact is not valid JSON.");
    }
  } else if (["apple-mobileconfig", "apple-mobileconfig-legacy"].includes(target.id)) {
    if (!artifact.includes("dns.quad9.net")) {
      fail(target.id, "DNS_ENDPOINT_LOSS", "Apple MobileConfig artifact did not preserve the configured DNS endpoint.");
    }
    if (!hasAll(artifact, dnsServers)) {
      fail(target.id, "DNS_SERVER_LOSS", "Apple MobileConfig artifact did not preserve all DNS server values.");
    }
    if (!artifact.includes("HTTPS")) {
      warn(target.id, "DNS_PROTOCOL_NOT_VISIBLE", "The serialized MobileConfig does not visibly contain the HTTPS protocol token; inspect the DNS payload structure before acceptance.");
    }
  } else {
    if (artifact.includes("dns-server") || artifact.includes("nameserver") || artifact.includes("server =")) {
      if (!artifact.includes("9.9.9.9") || !artifact.includes("149.112.112.112")) {
        fail(target.id, "DNS_SERVER_LOSS", "Target has a DNS field but did not preserve all DNS servers.");
      }
    } else {
      fail(target.id, "DNS_FIELD_MISSING", "Target is DNS-capable but exporter emitted no recognizable DNS field.");
    }

    if (artifact.includes("dns.quad9.net")) {
      warn(target.id, "DNS_ENDPOINT_TRANSFORMED", "The DoH endpoint hostname is present, but target-specific protocol semantics require separate validation.");
    } else {
      warn(target.id, "DNS_PROTOCOL_METADATA_NOT_EMITTED", "DNS server values were exported, but DoH endpoint/protocol metadata was not emitted.");
    }
  }

  const targetDir = path.join(outputPath, scenarioId, target.id);
  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(path.join(targetDir, result.filename), artifact, "utf8");

  const manifest = {
    scenarioId,
    targetId: target.id,
    declaredCapabilities: target.capabilities,
    declaredFormat: target.output.format,
    filename: result.filename,
    mime: result.mime,
    outputFormat: result.outputFormat,
    verifiedStatus: result.verifiedStatus,
    bytes: Buffer.byteLength(artifact, "utf8"),
    inputCoverage: {
      dnsServers,
      dnsProtocol: input.policy.dnsProtocol,
      dnsServerUrl: input.policy.dnsServerUrl,
      dnsServerName: input.policy.dnsServerName,
      dnsDomains: input.policy.dnsDomains
    }
  };

  await fs.writeFile(
    path.join(targetDir, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    "utf8"
  );

  artifacts.push(manifest);
}

const report = {
  inspection: "target-export-artifacts",
  scenarioId,
  targetCount: targets.length,
  generatedArtifacts: artifacts.length,
  passed: failures.length === 0,
  failureCount: failures.length,
  warningCount: warnings.length,
  failures,
  warnings,
  artifacts
};

await fs.writeFile(
  path.join(outputPath, scenarioId, "manifest.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8"
);

console.log(JSON.stringify(report, null, 2));
process.exitCode = failures.length ? 1 : 0;
