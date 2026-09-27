// Apple-only DNS command layer. These commands are scoped to the Apple target.
export const AppleDnsCommand = Object.freeze({
  PROTOCOL: "DNSProtocol",
  SERVER_URL: "ServerURL",
  SERVER_ADDRESSES: "ServerAddresses",
  SERVER_NAME: "ServerName",
  SUPPLEMENTAL_MATCH_DOMAINS: "SupplementalMatchDomains",
  ALLOW_FAILOVER: "AllowFailover",
  ON_DEMAND_RULES: "OnDemandRules",
});

const stringValue = value => typeof value === "string" ? value.trim() : "";

export function createAppleDnsCommand(name, value, meta = {}) {
  if (!Object.values(AppleDnsCommand).includes(name)) {
    throw new TypeError("Unsupported Apple DNS command: " + name);
  }
  return Object.freeze({ target: "apple", command: name, value, ...meta });
}

export function createAppleDnsCommandLayers(input = {}) {
  const source = input?.policy ?? input ?? {};
  const commands = [];
  const protocol = stringValue(source.dnsProtocol).toUpperCase();
  const serverUrl = stringValue(source.dnsServerUrl);
  const serverName = stringValue(source.dnsServerName);
  const addresses = Array.isArray(source.dnsServers) ? source.dnsServers.filter(v => typeof v === "string" && v.trim()).map(v => v.trim()) : [];
  const domains = Array.isArray(source.dnsDomains) ? source.dnsDomains.filter(v => typeof v === "string" && v.trim()).map(v => v.trim()) : [];
  if (protocol) commands.push(createAppleDnsCommand(AppleDnsCommand.PROTOCOL, protocol));
  if (serverUrl) commands.push(createAppleDnsCommand(AppleDnsCommand.SERVER_URL, serverUrl));
  if (addresses.length) commands.push(createAppleDnsCommand(AppleDnsCommand.SERVER_ADDRESSES, addresses));
  if (serverName) commands.push(createAppleDnsCommand(AppleDnsCommand.SERVER_NAME, serverName));
  if (domains.length) commands.push(createAppleDnsCommand(AppleDnsCommand.SUPPLEMENTAL_MATCH_DOMAINS, domains));
  if (typeof source.dnsAllowFailover === "boolean") commands.push(createAppleDnsCommand(AppleDnsCommand.ALLOW_FAILOVER, source.dnsAllowFailover));
  return commands;
}
