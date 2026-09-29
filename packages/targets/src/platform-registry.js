const freeze = value => Object.freeze(value);

const manifests = new Map([
  ["ios", {
    id: "ios",
    label: "Apple iOS",
    family: "apple",
    capabilities: freeze(["dns", "vpn", "proxy", "routing", "mobileconfig"]),
    targets: freeze(["apple-mobileconfig", "apple-dns-declaration", "apple-mobileconfig-legacy", "surge", "wireguard"])
  }],
  ["ipados", {
    id: "ipados",
    label: "Apple iPadOS",
    family: "apple",
    capabilities: freeze(["dns", "vpn", "proxy", "routing", "mobileconfig"]),
    targets: freeze(["apple-mobileconfig", "apple-dns-declaration", "apple-mobileconfig-legacy", "surge", "wireguard"])
  }],
  ["macos", {
    id: "macos",
    label: "Apple macOS",
    family: "desktop",
    capabilities: freeze(["dns", "vpn", "proxy", "routing", "mobileconfig"]),
    targets: freeze(["apple-mobileconfig", "apple-dns-declaration", "apple-mobileconfig-legacy", "surge", "wireguard"])
  }],
  ["android", {
    id: "android",
    label: "Android",
    family: "mobile",
    capabilities: freeze(["dns", "vpn", "proxy", "routing"]),
    targets: freeze(["wireguard"])
  }],
  ["windows", {
    id: "windows",
    label: "Microsoft Windows",
    family: "desktop",
    capabilities: freeze(["dns", "vpn", "proxy", "routing"]),
    targets: freeze(["wireguard", "mihomo"])
  }],
  ["linux", {
    id: "linux",
    label: "Linux",
    family: "desktop",
    capabilities: freeze(["dns", "vpn", "proxy", "routing"]),
    targets: freeze(["wireguard", "mihomo", "stash"])
  }]
]);

export function getPlatformManifest(platformId) {
  const manifest = manifests.get(platformId);
  return manifest ? structuredClone(manifest) : null;
}

export function listPlatformManifests() {
  return [...manifests.values()].map(manifest => structuredClone(manifest));
}

export function getPlatformTargets(platformId) {
  const manifest = manifests.get(platformId);
  return manifest ? [...manifest.targets] : [];
}

export function isTargetCompatible(platformId, targetId) {
  return getPlatformTargets(platformId).includes(targetId);
}

export function assertTargetCompatible(platformId, targetId) {
  if (!manifests.has(platformId)) {
    throw new TypeError(`Unknown device platform: ${platformId}`);
  }
  if (!isTargetCompatible(platformId, targetId)) {
    throw new TypeError(`Target ${targetId} is not registered for platform ${platformId}`);
  }
  return true;
}
