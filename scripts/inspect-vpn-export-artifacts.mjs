import { compileTargetExport } from "../packages/targets/src/exporters.js";
import { listTargetData } from "../packages/targets/src/target-data.js";

const scenarioId = "vpn";
const targets = listTargetData().filter(target => target.capabilities.includes("vpn"));

const scenarios = [
  {
    id: "wireguard-full",
    targetId: "wireguard",
    input: {
      policy: {
        name: "WireGuard VPN Export Inspection",
        vpn: true,
        vpnAddress: "10.7.0.2/32",
        vpnPrivateKey: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        vpnPublicKey: "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=",
        vpnEndpoint: "vpn.example.com:51820",
        vpnAllowedIPs: ["0.0.0.0/0", "::/0"],
        vpnPersistentKeepalive: 25,
        vpnPresharedKey: "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC=",
        dnsServers: ["1.1.1.1", "1.0.0.1"]
      }
    },
    required: [
      "Address = 10.7.0.2/32",
      "PrivateKey = AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      "PublicKey = BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=",
      "Endpoint = vpn.example.com:51820",
      "AllowedIPs = 0.0.0.0/0, ::/0",
      "PersistentKeepalive = 25",
      "PresharedKey = CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC=",
      "DNS = 1.1.1.1, 1.0.0.1"
    ]
  },
  {
    id: "apple-ikev2-full",
    targetId: "apple-mobileconfig",
    input: {
      policy: {
        name: "Apple IKEv2 VPN Export Inspection",
        vpn: true,
        applePayloads: { dns: false, webclip: false, wifi: false, vpn: true },
        vpnProtocol: "ikev2",
        vpnName: "Inspection IKEv2",
        vpnRemoteAddress: "vpn.example.com",
        vpnLocalIdentifier: "client@example.com",
        vpnRemoteIdentifier: "vpn.example.com",
        vpnAuthenticationMethod: "SharedSecret",
        vpnSharedSecret: "inspection-shared-secret",
        vpnAuthName: "client",
        vpnAuthPassword: "inspection-password"
      }
    },
    required: [
      "com.apple.vpn.managed",
      "<key>VPNType</key><string>IKEv2</string>",
      "<key>RemoteAddress</key><string>vpn.example.com</string>",
      "<key>LocalIdentifier</key><string>client@example.com</string>",
      "<key>RemoteIdentifier</key><string>vpn.example.com</string>",
      "<key>SharedSecret</key><string>inspection-shared-secret</string>"
    ],
    unsupportedSecrets: []
  },
  {
    id: "apple-l2tp-full",
    targetId: "apple-mobileconfig",
    input: {
      policy: {
        name: "Apple L2TP VPN Export Inspection",
        vpn: true,
        applePayloads: { dns: false, webclip: false, wifi: false, vpn: true },
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
    ],
    unsupportedSecrets: []
  }
];

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

await fs.mkdir(outputPath, { recursive: true });
await fs.rm(path.join(outputPath, scenarioId), { recursive: true, force: true });

for (const target of targets) {
  if (target.id === "wireguard") {
    const scenario = scenarios.find(x => x.targetId === "wireguard");
    let result;
    try {
      result = compileTargetExport(target.id, scenario.input);
    } catch (error) {
      fail(target.id, "COMPILE_FAILED", error instanceof Error ? error.message : String(error));
      continue;
    }
    const artifact = String(result.representation ?? "");
    if (!artifact.trim()) {
      fail(target.id, "EMPTY_ARTIFACT", "WireGuard exporter produced an empty artifact.");
      continue;
    }
    for (const value of scenario.required) {
      if (!artifact.includes(value)) fail(target.id, "VPN_FIELD_LOSS", "Missing WireGuard field: " + value);
    }
    const targetDir = path.join(outputPath, scenarioId, target.id);
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(path.join(targetDir, result.filename), artifact, "utf8");
    const manifest = {
      scenarioId,
      scenarioIdDetail: scenario.id,
      targetId: target.id,
      declaredCapabilities: target.capabilities,
      filename: result.filename,
      mime: result.mime,
      outputFormat: result.outputFormat,
      verifiedStatus: result.verifiedStatus,
      bytes: Buffer.byteLength(artifact, "utf8"),
      inputCoverage: scenario.input.policy
    };
    await fs.writeFile(path.join(targetDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
    artifacts.push(manifest);
    continue;
  }

  if (target.id === "surge") {
    const scenario = {
      policy: {
        name: "Surge VPN Rejection Inspection",
        vpn: true,
        vpnProtocol: "generic",
        vpnRemoteAddress: "vpn.example.com"
      }
    };
    try {
      compileTargetExport(target.id, scenario);
      fail(target.id, "UNSUPPORTED_NOT_REJECTED", "Surge accepted canonical VPN fields without an explicit mapping.");
    } catch (error) {
      const message = String(error?.message ?? error);
      if (!message.includes("UNSUPPORTED_CAPABILITY")) {
        fail(target.id, "WRONG_REJECTION", message);
      } else {
        artifacts.push({
          scenarioId,
          targetId: target.id,
          declaredCapabilities: target.capabilities,
          rejected: true,
          rejection: message
        });
      }
    }
  }
}

for (const scenario of scenarios.filter(x => x.targetId === "apple-mobileconfig")) {
  const target = targets.find(x => x.id === scenario.targetId);
  let result;
  try {
    result = compileTargetExport(target.id, scenario.input);
  } catch (error) {
    fail(target.id, "COMPILE_FAILED", scenario.id + ": " + (error instanceof Error ? error.message : String(error)));
    continue;
  }
  const artifact = String(result.representation ?? "");
  if (!artifact.trim()) {
    fail(target.id, "EMPTY_ARTIFACT", scenario.id + ": Apple MobileConfig is empty.");
    continue;
  }
  for (const value of scenario.required) {
    if (!artifact.includes(value)) fail(target.id, "VPN_FIELD_LOSS", scenario.id + ": missing " + value);
  }
  const targetDir = path.join(outputPath, scenarioId, scenario.id);
  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(path.join(targetDir, result.filename), artifact, "utf8");
  const manifest = {
    scenarioId,
    scenarioIdDetail: scenario.id,
    targetId: target.id,
    declaredCapabilities: target.capabilities,
    filename: result.filename,
    mime: result.mime,
    outputFormat: result.outputFormat,
    verifiedStatus: result.verifiedStatus,
    bytes: Buffer.byteLength(artifact, "utf8"),
    warnings: result.warnings,
    inputCoverage: scenario.input.policy
  };
  await fs.writeFile(path.join(targetDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  artifacts.push(manifest);
}

const report = {
  inspection: "target-export-artifacts",
  scenarioId,
  targetCount: targets.length,
  scenarioCount: scenarios.length,
  generatedArtifacts: artifacts.length,
  passed: failures.length === 0,
  failureCount: failures.length,
  warningCount: warnings.length,
  failures,
  warnings,
  artifacts
};

await fs.writeFile(path.join(outputPath, scenarioId, "manifest.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify(report, null, 2));
process.exitCode = failures.length ? 1 : 0;
