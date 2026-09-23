const dnsServers = ["1.1.1.1", "1.0.0.1"];

export const exportFormats = [
  {
    id: "surge",
    label: "Surge",
    extension: ".conf",
    mime: "text/plain",
    status: "template",
    description: "INI-like profile with [General], [Proxy], [Proxy Group], [Rule] and related sections."
  },
  {
    id: "mihomo",
    label: "Mihomo / Clash-compatible",
    extension: ".yaml",
    mime: "text/yaml",
    status: "template",
    description: "YAML configuration using dns, proxies, proxy-groups and rules."
  },
  {
    id: "wireguard",
    label: "WireGuard",
    extension: ".conf",
    mime: "text/plain",
    status: "template",
    description: "Standard WireGuard INI-style configuration."
  },
  {
    id: "shadowrocket",
    label: "Shadowrocket",
    extension: ".conf",
    mime: "text/plain",
    status: "template",
    description: "Shadowrocket profile format; DNS and routing sections are separated."
  },
  {
    id: "loon",
    label: "Loon",
    extension: ".conf",
    mime: "text/plain",
    status: "template",
    description: "Loon section-based configuration with [General], [Proxy], [Proxy Group] and [Rule]."
  },
  {
    id: "stash",
    label: "Stash",
    extension: ".yaml",
    mime: "text/yaml",
    status: "template",
    description: "YAML configuration with dns and rules sections."
  },
  {
    id: "quantumult-x",
    label: "Quantumult X",
    extension: ".conf",
    mime: "text/plain",
    status: "template",
    description: "Quantumult X section-based configuration."
  },
  {
    id: "apple-dns-declaration",
    label: "Apple Network DNS Settings",
    extension: ".json",
    mime: "application/json",
    status: "reference",
    description: "Current declarative configuration format for com.apple.configuration.network.dns-settings."
  },
  {
    id: "apple-mobileconfig-legacy",
    label: "Apple DNSSettings (legacy)",
    extension: ".mobileconfig",
    mime: "application/xml",
    status: "legacy",
    description: "Legacy managed DNS payload; retained only for compatibility testing."
  }
];

function joinDns() {
  return dnsServers.join(", ");
}

export function exportSurge() {
  return `[General]
dns-server = ${joinDns()}
bypass-system = true

[Proxy]

[Proxy Group]
DIRECT = select, DIRECT

[Rule]
FINAL,DIRECT
`;
}

export function exportMihomo() {
  return `mode: rule
log-level: info

dns:
  enable: true
  nameserver:
    - 1.1.1.1
    - 1.0.0.1

proxies: []

proxy-groups:
  - name: PROXY
    type: select
    proxies:
      - DIRECT

rules:
  - MATCH,DIRECT
`;
}

export function exportWireGuard() {
  return `[Interface]
PrivateKey = <REPLACE_WITH_NEW_PRIVATE_KEY>
Address = 10.7.0.10/24
DNS = ${joinDns()}

[Peer]
PublicKey = <PEER_PUBLIC_KEY>
AllowedIPs = 10.7.0.1/32
Endpoint = 127.0.0.1:51820
PersistentKeepalive = 25
`;
}

export function exportShadowrocket() {
  return `[General]
dns-server = ${joinDns()}
bypass-system = true

[Rule]
FINAL,DIRECT
`;
}

export function exportLoon() {
  return `[General]
dns-server = ${joinDns()}
interface-mode = auto

[Proxy]

[Proxy Group]
Proxy = select,DIRECT

[Rule]
FINAL,Proxy
`;
}

export function exportStash() {
  return `mode: rule
log-level: info

dns:
  nameserver:
    - 1.1.1.1
    - 1.0.0.1

proxies: []

proxy-groups:
  - name: Proxy
    type: select
    proxies:
      - DIRECT

rules:
  - MATCH,DIRECT
`;
}

export function exportQuantumultX() {
  return `[general]
loglevel = notify

[dns]
server = 1.1.1.1
server = 1.0.0.1

[policy]
static=DIRECT, direct

[filter_local]
final, direct
`;
}

export function exportAppleDnsDeclaration() {
  return JSON.stringify({
    Type: "com.apple.configuration.network.dns-settings",
    Identifier: "<REPLACE_WITH_UNIQUE_IDENTIFIER>",
    ServerToken: "<REPLACE_WITH_SERVER_TOKEN>",
    Payload: {
      VisibleName: "Network Configuration DNS",
      DNSSettings: {
        DNSProtocol: "HTTPS",
        ServerURL: "https://cloudflare-dns.com/dns-query",
        ServerAddresses: ["1.1.1.1", "1.0.0.1"],
        AllowFailover: false
      }
    }
  }, null, 2);
}

export function exportAppleMobileConfigLegacy() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>DNSSettings</key>
      <dict>
        <key>DNSProtocol</key>
        <string>HTTPS</string>
        <key>ServerURL</key>
        <string>https://cloudflare-dns.com/dns-query</string>
        <key>ServerAddresses</key>
        <array>
          <string>1.1.1.1</string>
          <string>1.0.0.1</string>
        </array>
        <key>AllowFailover</key>
        <false/>
      </dict>
      <key>PayloadDisplayName</key>
      <string>Network Configuration DNS (Legacy)</string>
      <key>PayloadIdentifier</key>
      <string>com.example.networkconfiguration.dns</string>
      <key>PayloadType</key>
      <string>com.apple.dnsSettings.managed</string>
      <key>PayloadUUID</key>
      <string>REPLACE-WITH-UUID</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
    </dict>
  </array>
  <key>PayloadDisplayName</key>
  <string>Network Configuration DNS</string>
  <key>PayloadIdentifier</key>
  <string>com.example.networkconfiguration</string>
  <key>PayloadOrganization</key>
  <string>Local Test</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>REPLACE-WITH-UUID</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>
`;
}

export function getExportArtifact(id) {
  const map = {
    surge: exportSurge,
    mihomo: exportMihomo,
    wireguard: exportWireGuard,
    shadowrocket: exportShadowrocket,
    loon: exportLoon,
    stash: exportStash,
    "quantumult-x": exportQuantumultX,
    "apple-dns-declaration": exportAppleDnsDeclaration,
    "apple-mobileconfig-legacy": exportAppleMobileConfigLegacy
  };
  return map[id] ? map[id]() : null;
}
