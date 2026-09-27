// Apple-only DNS command layer. Each semantic layer owns its own command array.
// These structures never cross into another target's schema.
export const AppleDnsCommand = Object.freeze({
  PROTOCOL: "DNSProtocol",
  SERVER_URL: "ServerURL",
  SERVER_ADDRESSES: "ServerAddresses",
  SERVER_NAME: "ServerName",
  SUPPLEMENTAL_MATCH_DOMAINS: "SupplementalMatchDomains",
  ALLOW_FAILOVER: "AllowFailover",
});

const stringValue = value => typeof value === "string" ? value.trim() : "";

export function createAppleDnsCommand(name, value, meta = {}) {
  if (!Object.values(AppleDnsCommand).includes(name)) throw new TypeError("Unsupported Apple DNS command: " + name);
  return Object.freeze({target: "apple", command: name, value, ...meta});
}

export function createAppleDnsCommandLayers(input = {}) {
  const source = input?.policy ?? input ?? {};
  const protocol = stringValue(source.dnsProtocol).toUpperCase();
  const serverUrl = stringValue(source.dnsServerUrl);
  const serverName = stringValue(source.dnsServerName);
  const addresses = Array.isArray(source.dnsServers) ? source.dnsServers.filter(v => typeof v === "string" && v.trim()).map(v => v.trim()) : [];
  const domains = Array.isArray(source.dnsDomains) ? source.dnsDomains.filter(v => typeof v === "string" && v.trim()).map(v => v.trim()) : [];
  const layers = [];
  if (protocol) layers.push({layer: "protocol", commands: [createAppleDnsCommand(AppleDnsCommand.PROTOCOL, protocol)]});
  if (serverUrl) layers.push({layer: "server-url", commands: [createAppleDnsCommand(AppleDnsCommand.SERVER_URL, serverUrl)]});
  if (addresses.length) layers.push({layer: "server-addresses", commands: [createAppleDnsCommand(AppleDnsCommand.SERVER_ADDRESSES, addresses)]});
  if (serverName) layers.push({layer: "server-name", commands: [createAppleDnsCommand(AppleDnsCommand.SERVER_NAME, serverName)]});
  if (domains.length) layers.push({layer: "supplemental-match-domains", commands: [createAppleDnsCommand(AppleDnsCommand.SUPPLEMENTAL_MATCH_DOMAINS, domains)]});
  if (typeof source.dnsAllowFailover === "boolean") layers.push({layer: "allow-failover", commands: [createAppleDnsCommand(AppleDnsCommand.ALLOW_FAILOVER, source.dnsAllowFailover)]});
  return layers;
}

export function flattenAppleDnsCommandLayers(layers = []) {
  if (!Array.isArray(layers)) throw new TypeError("Apple DNS command layers must be an array.");
  return layers.flatMap(layer => Array.isArray(layer?.commands) ? layer.commands : []);
}
