import { compileSurge } from "../../surge-adapter/src/index.js";
import { compileAppleMobileConfig, compileAppleDeclarativeDns } from "../../apple-adapter/src/index.js";

const defaultDnsProfiles = [
  {id:"privacy-dns",name:"Privacy DNS",provider:"Cloudflare",protocol:"DoH",servers:["1.1.1.1","1.0.0.1"],endpoint:"https://cloudflare-dns.com/dns-query",role:"resolver",enabled:true,order:1},
  {id:"security-dns",name:"Security DNS",provider:"Quad9",protocol:"DoH",servers:["9.9.9.9","149.112.112.112"],endpoint:"https://dns.quad9.net/dns-query",role:"resolver",enabled:true,order:2},
  {id:"backup-dns",name:"Backup DNS",provider:"Google Public DNS",protocol:"DoH",servers:["8.8.8.8","8.8.4.4"],endpoint:"https://dns.google/dns-query",role:"resolver",enabled:true,order:3}
];

const defaultPolicy = {
  name:"Configuration Standard",
  dns:true,
  dnsProfiles:defaultDnsProfiles,
  dnsServers:defaultDnsProfiles[0].servers,
  dnsProtocol:"HTTPS",
  dnsServerUrl:defaultDnsProfiles[0].endpoint,
  dnsServerName:"",
  dnsDomains:[],
  rules:[{match:"*.*",action:"DIRECT"}],
  finalPolicy:"DIRECT",
  bypassSystem:true,
  webEntry:{name:"Configuration Platform",url:"https://prasong-me.github.io/-Configuration-/",enabled:true},
  blocklists:[
    {id:"oisd-small",provider:"OISD Small",source:"https://small.oisd.nl/domainswild2",format:"domains",enabled:true},
    {id:"hagezi-pro",provider:"HaGeZi Pro",source:"https://raw.githubusercontent.com/hagezi/dns-blocklists/main/adblock/pro.txt",format:"adblock",enabled:true}
  ]
};

function getDnsProfiles(policy={}) {
  if(Array.isArray(policy.dnsProfiles) && policy.dnsProfiles.length) return policy.dnsProfiles.filter(p=>p && p.enabled!==false);
  if(Array.isArray(policy.dnsServers) && policy.dnsServers.length) {
    return [{id:"dns-default",name:"DNS",provider:"Custom",protocol:policy.dnsProtocol||"DoH",servers:policy.dnsServers,endpoint:policy.dnsServerUrl||"",role:"resolver",enabled:true,order:1}];
  }
  return defaultDnsProfiles;
}

function getDnsServers(policy={}) {
  return getDnsProfiles(policy).flatMap(profile=>Array.isArray(profile.servers)?profile.servers:[]);
}

function applePolicyFor(policyInput={}) {
  const policy=policyInput?.policy??policyInput;
  const profiles=getDnsProfiles(policy).map((profile)=>({
    id:profile.id,
    name:profile.name,
    servers:Array.isArray(profile.servers)?profile.servers:[],
    protocol:String(profile.protocol||policy.dnsProtocol||"HTTPS").toUpperCase()==="DOH"?"HTTPS":String(profile.protocol||policy.dnsProtocol||"HTTPS").toUpperCase()==="DOT"?"TLS":String(profile.protocol||policy.dnsProtocol||"HTTPS").toUpperCase(),
    serverUrl:profile.endpoint||"",
    serverName:profile.serverName||"",
    domains:Array.isArray(profile.domains)?profile.domains:[]
  })).filter(profile=>profile.servers.length);
  return {...policy,dnsPayloads:profiles};
}

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
  "apple-mobileconfig": [
    {id:"dns",title:"DNS",config:"com.apple.dnsSettings.managed",test:"ติดตั้ง MobileConfig แล้วตรวจ DNS ที่ระบบใช้งาน"},
    {id:"webclip",title:"Web App",config:"com.apple.webClip.managed",test:"ติดตั้ง profile แล้วตรวจ Web App บน Home Screen"},
    {id:"vpn",title:"VPN",config:"VPN payload ตามชนิดที่เลือก",test:"ตรวจสถานะ VPN และทดสอบการเชื่อมต่อจริง"}
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
    status: "verified",
    description: "Verified Surge 5.x profile export based on completed real-device testing; credentials/endpoints are not embedded.",
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
    status: "partial-tested",
    description: "Standard WireGuard INI-style configuration; real-device evidence exists only for the recorded VPN observation, so verified export remains blocked.",
    functions: functionGuides["wireguard"] || []
  },
  {
    id: "shadowrocket",
    label: "Shadowrocket",
    extension: ".conf",
    mime: "text/plain",
    status: "partial-tested",
    description: "Shadowrocket profile format; real-device evidence exists only for the recorded DNS observation, so verified export remains blocked; DNS and routing sections are separated.",
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
    id: "apple-mobileconfig",
    label: "Apple iOS MobileConfig",
    extension: ".mobileconfig",
    mime: "application/x-apple-aspen-config",
    status: "generated",
    description: "Apple Configuration Profile สำหรับติดตั้งโดยตรงบน iOS; payload ที่ต้องพึ่ง Extension จะแสดงคำเตือนตามค่าที่ผู้ใช้เลือก.",
    functions: functionGuides["apple-mobileconfig"] || []
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

export function getExportArtifact(targetId,policyInput={}) {
  const policy=policyInput?.policy??policyInput;
  if(targetId==="apple-mobileconfig") return compileAppleMobileConfig(applePolicyFor(policyInput)).content;
  if(targetId==="apple-dns-declaration") return JSON.stringify(compileAppleDeclarativeDns(policyInput),null,2);
  if(targetId==="surge") return exportSurge(policyInput);
  if(targetId==="wireguard") return "[Interface]\nDNS = "+(policy.dnsServers||[]).join(", ")+"\n\n# Configuration Platform Web App\n# "+(policy.webAppUrl||"")+"\n";
  if(targetId==="mihomo"||targetId==="stash") return "# Configuration Platform Web App: "+(policy.webAppUrl||"")+"\n"+JSON.stringify({dns:{nameserver:getDnsServers(policy),profiles:getDnsProfiles(policy)},rules:policy.rules||[]},null,2);
  if(targetId==="shadowrocket"){
  const rules=(policy.rules||[]).map(r=>[r.match||r.domain||r.host,r.action||policy.routingAction||"DIRECT"].filter(Boolean).join(", ")).join("\\n");
  return "[General]\\ndns-server = "+getDnsServers(policy).join(", ")+"\\n\\n[Rule]\\n"+rules+"\\n\\n";
}
  if(targetId==="loon") return "[General]\n# Configuration Platform Web App: "+(policy.webAppUrl||"")+"\n";
  if(targetId==="quantumult-x"){
  const rules=(policy.rules||[]).map(r=>[r.match||r.domain||r.host,r.action||policy.routingAction||"direct"].filter(Boolean).join(", ")).join("\\n");
  return "[dns]\\nserver = "+getDnsServers(policy).join(", ")+"\\n\\n[filter_local]\\n"+rules+"\\n";
}
  return "";
}

export function getExportWarnings(targetId,policyInput={}) {
  if(targetId==="apple-mobileconfig") return compileAppleMobileConfig(applePolicyFor(policyInput)).warnings;
  return [];
}

export function exportSurge(policyInput = {}) {
  const input = policyInput?.policy ? policyInput : {policy:defaultPolicy};
  return compileSurge(input).content;
}

