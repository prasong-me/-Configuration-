const dnsServers = ["1.1.1.1", "1.0.0.1"];

const functionGuides = {
  surge: [
    {id:"dns",title:"DNS",config:"[General] → dns-server",test:"ตั้ง DNS ที่ต้องการ แล้วตรวจ Effective DNS / log"},
    {id:"system-dns",title:"System DNS",config:"[General] → bypass-system",test:"เปิด/ปิด bypass-system แล้วเปรียบเทียบผลกับ DNS ของ Wi‑Fi"},
    {id:"tun",title:"TUN / VPN",config:"การทำงานของ Surge Tunnel",test:"เปิด Tunnel แล้วตรวจ VPN interface และการเดินทางของ traffic"},
    {id:"routing",title:"Routing",config:"[Rule] → DOMAIN / IP-CIDR / FINAL",test:"ทดสอบ domain ที่กำหนดและตรวจ policy ที่ถูกเลือก"},
    {id:"remote-dns",title:"Remote DNS",config:"[Rule] → force-remote-dns",test:"ทดสอบ domain ที่ต้องการให้ resolve ผ่านเส้นทาง remote"},
    {id:"blocking",title:"Blocking",config:"[Rule] → REJECT / policy ที่กำหนด",test:"ทดสอบเฉพาะโดเมนที่ตั้งใจบล็อก"}
  ],
  mihomo: [
    {id:"dns",title:"DNS",config:"dns.nameserver / nameserver-policy",test:"ตรวจ resolver และผล A/AAAA"},
    {id:"system-dns",title:"System DNS",config:"dns.respect-rules / system-related DNS options ตามเวอร์ชัน",test:"เทียบผลเมื่อรับ/ไม่รับ DNS จากระบบ"},
    {id:"tun",title:"TUN",config:"tun:",test:"เปิด TUN แล้วตรวจ interface / route"},
    {id:"routing",title:"Routing",config:"rules: + proxy-groups:",test:"ทดสอบ domain/IP แต่ละ rule"},
    {id:"blocking",title:"Blocking",config:"rules: REJECT",test:"ทดสอบเฉพาะ rule ที่บล็อก"}
  ],
  wireguard: [
    {id:"interface",title:"Interface",config:"[Interface] Address / DNS",test:"นำเข้าแล้วตรวจ tunnel address และ DNS"},
    {id:"peer",title:"Peer",config:"[Peer] PublicKey / Endpoint / AllowedIPs",test:"ตรวจ handshake และ peer"},
    {id:"routing",title:"Routing",config:"AllowedIPs",test:"เริ่มจาก route เฉพาะ peer แล้วค่อยทดสอบ route เพิ่ม"},
    {id:"keepalive",title:"Keepalive",config:"PersistentKeepalive",test:"ทดสอบการคง session บนเครือข่ายจริง"}
  ],
  shadowrocket: [
    {id:"dns",title:"DNS",config:"[General] → dns-server",test:"ตรวจ Effective DNS และ log"},
    {id:"system-dns",title:"System DNS",config:"[General] → bypass-system",test:"เปรียบเทียบเมื่อ bypass system DNS"},
    {id:"tun",title:"TUN / VPN",config:"Shadowrocket Tunnel",test:"เปิด VPN แล้วตรวจ VPN IP/interface"},
    {id:"routing",title:"Routing",config:"[Rule] → DOMAIN / IP-CIDR / FINAL",test:"ทดสอบ rule ทีละรายการ"},
    {id:"remote-dns",title:"Remote DNS",config:"[Rule] → force-remote-dns",test:"ทดสอบ domain ที่กำหนดให้ resolve remote"},
    {id:"blocking",title:"Blocking",config:"[Rule] → REJECT",test:"ทดสอบเฉพาะโดเมนที่กำหนด"}
  ],
  loon: [
    {id:"dns",title:"DNS",config:"[General] DNS-related settings ตามเวอร์ชัน",test:"ตรวจ resolver และ log"},
    {id:"tun",title:"VPN / TUN",config:"Loon Tunnel",test:"เปิด VPN แล้วตรวจ interface"},
    {id:"routing",title:"Routing",config:"[Rule]",test:"ทดสอบ rule ทีละรายการ"},
    {id:"blocking",title:"Blocking",config:"[Rule] reject",test:"ทดสอบเฉพาะโดเมนที่กำหนด"}
  ],
  stash: [
    {id:"dns",title:"DNS",config:"dns.default-nameserver / nameserver / nameserver-policy",test:"ตรวจ resolver และ policy"},
    {id:"fake-ip",title:"Fake IP",config:"dns.fake-ip-filter",test:"ทดสอบ domain ที่ต้องยกเว้น fake-ip"},
    {id:"routing",title:"Routing",config:"rules / proxy-groups",test:"ทดสอบ rule และ policy"},
    {id:"blocking",title:"Blocking",config:"rules: REJECT",test:"ทดสอบเฉพาะโดเมนที่กำหนด"}
  ],
  "quantumult-x": [
    {id:"dns",title:"DNS",config:"[dns] → server / doh-server / doq-server",test:"ตรวจ resolver และ log"},
    {id:"system-dns",title:"System DNS",config:"[dns] → no-system",test:"เปิด no-system แล้วเทียบกับ system DNS"},
    {id:"ipv6",title:"IPv6",config:"[dns] → no-ipv6",test:"ทดสอบ A/AAAA แยกกัน"},
    {id:"routing",title:"Routing",config:"[filter_local] / [filter_remote] / [policy]",test:"ทดสอบ filter → policy ทีละ rule"},
    {id:"blocking",title:"Blocking",config:"filter → reject",test:"ทดสอบเฉพาะโดเมนที่กำหนด"}
  ],
  "apple-dns-declaration": [
    {id:"dns",title:"DNS Settings",config:"com.apple.configuration.network.dns-settings",test:"ติดตั้ง declaration แล้วตรวจ DNS ที่ระบบใช้"},
    {id:"protocol",title:"DNS Protocol",config:"DNSProtocol / ServerURL",test:"ทดสอบ DoH/โปรโตคอลที่กำหนด"},
    {id:"failover",title:"Failover",config:"AllowFailover",test:"ทดสอบเมื่อ resolver หลักใช้งานไม่ได้"}
  ],
  "apple-mobileconfig-legacy": [
    {id:"dns",title:"Legacy DNS Settings",config:"com.apple.dnsSettings.managed",test:"ติดตั้ง profile แล้วตรวจ DNS"},
    {id:"protocol",title:"DNS Protocol",config:"DNSProtocol / ServerURL",test:"ทดสอบโปรโตคอลที่กำหนด"}
  ]
};

export const exportFormats = [
  {
    id: "surge",
    label: "Surge",
    extension: ".conf",
    mime: "text/plain",
    status: "template",
    description: "INI-like profile with [General], [Proxy], [Proxy Group], [Rule] and related sections.",
    functions: functionGuides["surge"] || []
  },
  {
    id: "mihomo",
    label: "Mihomo / Clash-compatible",
    extension: ".yaml",
    mime: "text/yaml",
    status: "template",
    description: "YAML configuration using dns, proxies, proxy-groups and rules.",
    functions: functionGuides["mihomo"] || []
  },
  {
    id: "wireguard",
    label: "WireGuard",
    extension: ".conf",
    mime: "text/plain",
    status: "template",
    description: "Standard WireGuard INI-style configuration.",
    functions: functionGuides["wireguard"] || []
  },
  {
    id: "shadowrocket",
    label: "Shadowrocket",
    extension: ".conf",
    mime: "text/plain",
    status: "template",
    description: "Shadowrocket profile format; DNS and routing sections are separated.",
    functions: functionGuides["shadowrocket"] || []
  },
  {
    id: "loon",
    label: "Loon",
    extension: ".conf",
    mime: "text/plain",
    status: "template",
    description: "Loon section-based configuration with [General], [Proxy], [Proxy Group] and [Rule].",
    functions: functionGuides["loon"] || []
  },
  {
    id: "stash",
    label: "Stash",
    extension: ".yaml",
    mime: "text/yaml",
    status: "template",
    description: "YAML configuration with dns and rules sections.",
    functions: functionGuides["stash"] || []
  },
  {
    id: "quantumult-x",
    label: "Quantumult X",
    extension: ".conf",
    mime: "text/plain",
    status: "template",
    description: "Quantumult X section-based configuration.",
    functions: functionGuides["quantumult-x"] || []
  },
  {
    id: "apple-dns-declaration",
    label: "Apple Network DNS Settings",
    extension: ".json",
    mime: "application/json",
    status: "reference",
    description: "Current declarative configuration format for com.apple.configuration.network.dns-settings.",
    functions: functionGuides["apple-dns-declaration"] || []
  },
  {
    id: "apple-mobileconfig-legacy",
    label: "Apple DNSSettings (legacy)",
    extension: ".mobileconfig",
    mime: "application/xml",
    status: "legacy",
    description: "Legacy managed DNS payload; retained only for compatibility testing.",
    functions: functionGuides["apple-mobileconfig-legacy"] || []
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
