import { compileTargetExport } from "../packages/targets/src/exporters.js";
import { listTargetData } from "../packages/targets/src/target-data.js";

const scenarioId = "routing-rules";
const targets = listTargetData().filter(target => target.capabilities.includes("routing") || target.capabilities.includes("rules"));

const input = {
  policy: {
    name: "Routing Rules Export Inspection",
    rules: [
      { type: "DOMAIN", value: "api.example.com", policy: "Inspection-Group" },
      { type: "DOMAIN-SUFFIX", value: "example.org", policy: "DIRECT" },
      { type: "DOMAIN", value: "blocked.example.net", policy: "REJECT" }
    ],
    finalPolicy: "Inspection-Group",
    proxyGroups: [
      { name: "Inspection-Group", type: "select", proxies: ["DIRECT"] }
    ]
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
    fail(target.id, "EMPTY_ARTIFACT", "Routing/rules exporter produced an empty artifact.");
    continue;
  }

  if (result.filename !== `${target.id}-config${target.output.extension}`) {
    fail(target.id, "FILENAME_MISMATCH", `Expected ${target.output.extension} for ${target.id}.`);
  }

  if (result.mime !== target.output.mime) {
    fail(target.id, "MIME_MISMATCH", `Exporter MIME ${result.mime} differs from target data MIME ${target.output.mime}.`);
  }

  for (const rule of input.policy.rules) {
    requireText(target.id, artifact, rule.type, "RULE_TYPE_LOSS", `Rule type ${rule.type} was not preserved.`);
    requireText(target.id, artifact, rule.value, "RULE_VALUE_LOSS", `Rule value ${rule.value} was not preserved.`);
    requireText(target.id, artifact, rule.policy, "RULE_POLICY_LOSS", `Rule policy ${rule.policy} was not preserved.`);
  }
  requireText(target.id, artifact, input.policy.finalPolicy, "FINAL_POLICY_LOSS", "Final policy was not preserved.");

  if (["surge", "shadowrocket", "loon", "quantumult-x"].includes(target.id)) {
    requireText(target.id, artifact, "DOMAIN,api.example.com,Inspection-Group", "INI_RULE_MISSING", `Native rule syntax missing for ${target.id}.`);
  }

  if (["mihomo", "stash"].includes(target.id)) {
    requireText(target.id, artifact, "rules:", "YAML_RULE_SECTION_MISSING", `YAML rules section missing for ${target.id}.`);
    requireText(target.id, artifact, "DOMAIN,api.example.com,Inspection-Group", "YAML_RULE_MISSING", `Native rule syntax missing for ${target.id}.`);
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
    inputCoverage: { rules: input.policy.rules, finalPolicy: input.policy.finalPolicy }
  };

  await fs.writeFile(path.join(targetDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
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
