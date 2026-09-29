import registry from "../../../data/targets/registry.json" with { type: "json" };
import appleMobileConfig from "../../../data/targets/apple/mobileconfig.json" with { type: "json" };
import appleDnsDeclaration from "../../../data/targets/apple/dns-declaration.json" with { type: "json" };
import appleMobileConfigLegacy from "../../../data/targets/apple/mobileconfig-legacy.json" with { type: "json" };
import surge from "../../../data/targets/surge.json" with { type: "json" };
import mihomo from "../../../data/targets/mihomo.json" with { type: "json" };
import wireguard from "../../../data/targets/wireguard.json" with { type: "json" };
import shadowrocket from "../../../data/targets/shadowrocket.json" with { type: "json" };
import loon from "../../../data/targets/loon.json" with { type: "json" };
import stash from "../../../data/targets/stash.json" with { type: "json" };
import quantumultX from "../../../data/targets/quantumult-x.json" with { type: "json" };

const targetData = new Map([
  [appleMobileConfig.id, appleMobileConfig],
  [appleDnsDeclaration.id, appleDnsDeclaration],
  [appleMobileConfigLegacy.id, appleMobileConfigLegacy],
  [surge.id, surge],
  [mihomo.id, mihomo],
  [wireguard.id, wireguard],
  [shadowrocket.id, shadowrocket],
  [loon.id, loon],
  [stash.id, stash],
  [quantumultX.id, quantumultX]
]);

const registryTargets = new Set(registry.targets);

if (registryTargets.size !== targetData.size) {
  throw new TypeError("Target registry and target data are inconsistent.");
}

for (const targetId of registryTargets) {
  if (!targetData.has(targetId)) {
    throw new TypeError(`Target data is missing: ${targetId}`);
  }
}

export function getTargetData(targetId) {
  const data = targetData.get(targetId);
  return data ? structuredClone(data) : null;
}

export function listTargetData() {
  return [...targetData.values()].map(data => structuredClone(data));
}

export function hasTargetData(targetId) {
  return targetData.has(targetId);
}

export function getTargetConditions(targetId) {
  const data = targetData.get(targetId);
  if (!data) return null;
  return {
    id: data.id,
    platforms: [...data.platforms],
    capabilities: [...data.capabilities],
    required: structuredClone(data.required),
    optional: [...data.optional],
    unsupported: [...data.unsupported],
    constraints: [...data.constraints],
    validation: [...data.validation],
    output: structuredClone(data.output),
    artifactStatus: structuredClone(data.artifactStatus)
  };
}
