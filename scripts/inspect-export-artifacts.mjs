import { compileTargetExport } from "../packages/targets/src/exporters.js";
import { listTargetData } from "../packages/targets/src/target-data.js";

const scenarioId = "proxy";
const targets = listTargetData().filter(target => target.capabilities.includes("proxy"));

const proxy = {
  name: "Proxy-Inspection",
  type: "http",
  server: "proxy.example.net",
  port: 8080,
  username: "inspection-user",
  password: "inspection-pass",
  tls: true,
  udp: true
};

const proxyGroup = {
  name: "Inspection-Group",
  type: "select",
  proxies: ["Proxy-Inspection", "DIRECT"]
};

const input = {
  policy: {
    name: "Proxy Export Inspection",
    proxies: [proxy],
    proxyGroups: [proxyGroup],
    rules: [
      { type: "DOMAIN-SUFFIX", value: "proxy.example", policy: "Proxy-Inspection" }
    ],
    finalPolicy: "DIRECT"
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

function requireText(targetId, artifact, value, code, message) {
  if (!artifact.includes(value)) fail(targetId, code, message);
}

await fs.mkdir(outputPath, { recursive: true });
await fs.rm(path.join(outputPath, scenarioId), { recursive: true, force: true });

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
    fail(target.id, "EMPTY_ARTIFACT", "Proxy exporter produced an empty artifact.");
    continue;
  }

  if (result.filename !== `${target.id}-config${target.output.extension}`) {
    fail(target.id, "FILENAME_MISMATCH", `Expected ${target.output.extension} for ${target.id}.`);
  }

  if (result.mime !== target.output.mime) {
    fail(target.id, "MIME_MISMATCH", `Exporter MIME ${result.mime} differs from target data MIME ${target.output.mime}.`);
  }

  requireText(target.id, artifact, proxy.name, "PROXY_NAME_LOSS", "Proxy name was not preserved.");
  requireText(target.id, artifact, proxy.server, "PROXY_SERVER_LOSS", "Proxy server was not preserved.");
  requireText(target.id, artifact, String(proxy.port), "PROXY_PORT_LOSS", "Proxy port was not preserved.");

  if (target.id === "surge") {
    requireText(target.id, artifact, "Proxy-Inspection = http, proxy.example.net, 8080", "SURGE_PROXY_ENTRY_MISSING", "Surge proxy entry was not emitted.");
    requireText(target.id, artifact, "inspection-user", "SURGE_PROXY_USERNAME_LOSS", "Surge proxy username was not emitted.");
    requireText(target.id, artifact, "inspection-pass", "SURGE_PROXY_PASSWORD_LOSS", "Surge proxy password was not emitted.");
    requireText(target.id, artifact, "tls=true", "SURGE_PROXY_TLS_LOSS", "Surge proxy TLS option was not emitted.");
    requireText(target.id, artifact, "udp=true", "SURGE_PROXY_UDP_LOSS", "Surge proxy UDP option was not emitted.");
  }

  if (["mihomo", "stash"].includes(target.id)) {
    requireText(target.id, artifact, "proxies:", "PROXY_SECTION_MISSING", "YAML proxy section is missing.");
    requireText(target.id, artifact, "name", "PROXY_NAME_FIELD_MISSING", "YAML proxy name field is missing.");
    requireText(target.id, artifact, "server", "PROXY_SERVER_FIELD_MISSING", "YAML proxy server field is missing.");
    requireText(target.id, artifact, "port", "PROXY_PORT_FIELD_MISSING", "YAML proxy port field is missing.");
    requireText(target.id, artifact, "proxy-groups:", "PROXY_GROUP_SECTION_MISSING", "YAML proxy group section is missing.");
    requireText(target.id, artifact, "Inspection-Group", "PROXY_GROUP_LOSS", "Proxy group was not preserved.");
  }

  if (["shadowrocket", "loon"].includes(target.id)) {
    requireText(target.id, artifact, "Proxy-Inspection", "PROXY_ENTRY_MISSING", "Proxy entry was not emitted.");
    requireText(target.id, artifact, "proxy.example.net", "PROXY_SERVER_LOSS", "Proxy server was not emitted.");
    requireText(target.id, artifact, "8080", "PROXY_PORT_LOSS", "Proxy port was not emitted.");
    requireText(target.id, artifact, "Inspection-Group", "PROXY_GROUP_LOSS", "Proxy group was not emitted.");
  }

  if (target.id === "quantumult-x") {
    requireText(target.id, artifact, "[server_local]", "QX_SERVER_SECTION_MISSING", "Quantumult X server_local section is missing.");
    requireText(target.id, artifact, "Proxy-Inspection", "QX_PROXY_ENTRY_MISSING", "Quantumult X proxy entry was not emitted.");
    requireText(target.id, artifact, "proxy.example.net", "QX_PROXY_SERVER_LOSS", "Quantumult X proxy server was not emitted.");
    requireText(target.id, artifact, "8080", "QX_PROXY_PORT_LOSS", "Quantumult X proxy port was not emitted.");
    requireText(target.id, artifact, "[policy]", "QX_POLICY_SECTION_MISSING", "Quantumult X policy section is missing.");
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
      proxy: {
        name: proxy.name,
        type: proxy.type,
        server: proxy.server,
        port: proxy.port,
        username: true,
        password: true,
        tls: proxy.tls,
        udp: proxy.udp
      },
      proxyGroup
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
