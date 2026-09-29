import { compileTargetExport } from "../packages/targets/src/exporters.js";
import { listTargetData } from "../packages/targets/src/target-data.js";

const targets = listTargetData();
const dnsServers = ["9.9.9.9", "149.112.112.112"];
const input = {
  policy: {
    name: "Export Inspection",
    dns: true,
    dnsServers,
    dnsProfiles: [{
      id: "inspection-dns",
      name: "Inspection DNS",
      protocol: "HTTPS",
      servers: dnsServers,
      endpoint: "https://dns.quad9.net/dns-query",
      enabled: true
    }],
    rules: [
      { type: "DOMAIN-SUFFIX", value: "example.com", policy: "DIRECT" },
      { type: "DOMAIN-SUFFIX", value: "proxy.example", policy: "PROXY" }
    ],
    finalPolicy: "DIRECT",
    bypassSystem: true
  }
};

const expectedExtension = new Map(targets.map(t => [t.id, t.output.extension]));
const failures = [];
const warnings = [];

function fail(targetId, code, message) {
  failures.push({ targetId, code, message });
}
function warn(targetId, code, message) {
  warnings.push({ targetId, code, message });
}

for (const target of targets) {
  let result;
  try {
    result = compileTargetExport(target.id, input);
  } catch (error) {
    fail(target.id, "COMPILE_FAILED", error instanceof Error ? error.message : String(error));
    continue;
  }

  const artifact = String(result.representation ?? "");
  if (!artifact.trim()) fail(target.id, "EMPTY_ARTIFACT", "Exporter produced an empty artifact.");

  if (result.filename !== `${target.id}-config${expectedExtension.get(target.id)}`) {
    fail(target.id, "FILENAME_MISMATCH", `Expected target extension ${expectedExtension.get(target.id)}.`);
  }

  if (result.mime !== target.output.mime) {
    fail(target.id, "MIME_MISMATCH", `Exporter MIME ${result.mime} differs from target data MIME ${target.output.mime}.`);
  }

  const expectedFormat = target.output.format;
  const formatMap = { "plist": "plist", "json": "json", "yaml": "yaml", "text": "text", "ini": "text" };
  const expectedOutputFormat = formatMap[expectedFormat];
  if (expectedOutputFormat && result.outputFormat !== expectedOutputFormat) {
    fail(target.id, "OUTPUT_FORMAT_MISMATCH", `Target data declares ${expectedFormat}; exporter reports ${result.outputFormat}.`);
  }

  for (const server of dnsServers) {
    if (artifact.includes(server) === false && target.capabilities.includes("dns")) {
      warn(target.id, "DNS_NOT_EMITTED", `Input DNS server ${server} was not found in the exported artifact.`);
    }
  }

  if (artifact.includes("proxy.example") && !artifact.includes("PROXY")) {
    warn(target.id, "PROXY_TOKEN_NOT_PRESERVED", "The canonical PROXY rule may have been transformed; inspect policy semantics before accepting the artifact.");
  }

  if (target.id === "apple-dns-declaration") {
    try {
      const declaration = JSON.parse(artifact);
      if (declaration.Type !== "com.apple.configuration.network.dns-settings") {
        fail(target.id, "APPLE_DNS_TYPE", "Declarative DNS Type is not the expected Apple DNS declaration type.");
      }
      if (!declaration.Payload?.DNSSettings?.DNSProtocol) {
        fail(target.id, "APPLE_DNS_PROTOCOL", "Declarative DNS DNSProtocol is missing.");
      }
    } catch {
      fail(target.id, "JSON_INVALID", "Apple DNS declaration artifact is not valid JSON.");
    }
  }

  const requiredSections = {
    surge: ["[Proxy]", "[Rule]"],
    shadowrocket: ["[Proxy]", "[Rule]"],
    loon: ["[Proxy]", "[Proxy Group]", "[Rule]"],
    "quantumult-x": ["[dns]", "[policy]", "[filter_local]"],
    wireguard: ["[Interface]", "[Peer]"]
  };

  for (const section of requiredSections[target.id] ?? []) {
    if (!artifact.includes(section)) fail(target.id, "SECTION_MISSING", `Missing required structural marker ${section}.`);
  }

  if (["mihomo", "stash"].includes(target.id)) {
    for (const key of ["dns:", "proxies:", "proxy-groups:", "rules:"]) {
      if (!artifact.includes(key)) fail(target.id, "YAML_SECTION_MISSING", `Missing YAML marker ${key}.`);
    }
  }
}

const report = {
  inspection: "target-export-artifacts",
  targetCount: targets.length,
  passed: failures.length === 0,
  failureCount: failures.length,
  warningCount: warnings.length,
  failures,
  warnings
};

console.log(JSON.stringify(report, null, 2));
process.exitCode = failures.length ? 1 : 0;
