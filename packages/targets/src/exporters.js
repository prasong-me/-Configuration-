import { compileSurge } from "../../surge-adapter/src/index.js";
import { compileAppleMobileConfig, compileAppleDeclarativeDns, compileAppleDnsProxyProviderRuntime } from "../../apple-adapter/src/index.js";

const defaultDnsProfiles=[
  {id:"privacy-dns",name:"Privacy DNS",provider:"Cloudflare",protocol:"DoH",ipv4Servers:["1.1.1.1","1.0.0.1"],ipv6Servers:["2606:4700:4700::1111","2606:4700:4700::1001"],servers:["1.1.1.1","1.0.0.1","2606:4700:4700::1111","2606:4700:4700::1001"],endpoint:"https://cloudflare-dns.com/dns-query",role:"resolver",enabled:true,order:1},
  {id:"security-dns",name:"NextDNS",provider:"NextDNS",protocol:"DoH",addressMode:"hostname",servers:["dns.nextdns.io"],ipv4Servers:[],ipv6Servers:[],endpoint:"https://dns.nextdns.io",serverName:"dns.nextdns.io",role:"resolver",enabled:true,order:2},
  {id:"backup-dns",name:"AdGuard DNS",provider:"AdGuard",protocol:"DoH",addressMode:"hostname",servers:["dns.adguard-dns.com"],ipv4Servers:[],ipv6Servers:[],endpoint:"https://dns.adguard-dns.com/dns-query",serverName:"dns.adguard-dns.com",role:"resolver",enabled:true,order:3}
];
const defaultPolicy={name:"Configuration Standard",dns:true,dnsProfiles:defaultDnsProfiles,dnsResolution:{mode:"sequential",requiredProfiles:3},dnsServers:defaultDnsProfiles[0].servers,dnsProtocol:"HTTPS",dnsServerUrl:defaultDnsProfiles[0].endpoint,dnsServerName:"",dnsDomains:[],rules:[{match:"*.*",action:"DIRECT"}],finalPolicy:"DIRECT",bypassSystem:true,webEntry:{name:"Configuration Platform",url:"https://prasong-me.github.io/-Configuration-/",enabled:true},blocklists:[{id:"oisd-small",provider:"OISD Small",source:"https://small.oisd.nl/domainswild2",format:"domains",enabled:true},{id:"hagezi-pro",provider:"HaGeZi Pro",source:"https://raw.githubusercontent.com/hagezi/dns-blocklists/main/adblock/pro.txt",format:"adblock",enabled:true}]};

const functionGuides={
  surge:[{id:"dns",title:"DNS",config:"[General] → dns-server",test:"ตรวจ Effective DNS / log"},{id:"system-dns",title:"System DNS",config:"[General] → bypass-system",test:"เทียบผลกับ DNS ของ Wi-Fi"},{id:"tun",title:"TUN / VPN",config:"Surge Tunnel",test:"ตรวจ VPN interface และ traffic"},{id:"routing",title:"Routing",config:"[Rule] → DOMAIN / IP-CIDR / FINAL",test:"ทดสอบ domain ที่กำหนด"},{id:"remote-dns",title:"Remote DNS",config:"[Rule] → force-remote-dns",test:"ทดสอบ remote resolve"},{id:"blocking",title:"Blocking",config:"[Rule] → REJECT",test:"ทดสอบโดเมนที่บล็อก"}],
  mihomo:[{id:"dns",title:"DNS",config:"dns.nameserver / nameserver-policy",test:"ตรวจ resolver"},{id:"system-dns",title:"System DNS",config:"dns.respect-rules / system DNS options",test:"เทียบผลกับ system DNS"},{id:"tun",title:"TUN",config:"tun:",test:"ตรวจ interface / route"},{id:"routing",title:"Routing",config:"rules + proxy-groups",test:"ทดสอบ domain/IP"},{id:"blocking",title:"Blocking",config:"rules: REJECT",test:"ทดสอบโดเมนที่บล็อก"}],
  wireguard:[{id:"interface",title:"Interface",config:"[Interface] Address / DNS",test:"ตรวจ tunnel address และ DNS"},{id:"peer",title:"Peer",config:"[Peer] PublicKey / Endpoint / AllowedIPs",test:"ตรวจ handshake"},{id:"routing",title:"Routing",config:"AllowedIPs",test:"ทดสอบ route"},{id:"keepalive",title:"Keepalive",config:"PersistentKeepalive",test:"ทดสอบ session"}],
  shadowrocket:[{id:"dns",title:"DNS",config:"[General] → dns-server",test:"ตรวจ Effective DNS"},{id:"system-dns",title:"System DNS",config:"[General] → bypass-system",test:"เทียบ system DNS"},{id:"tun",title:"TUN / VPN",config:"Shadowrocket Tunnel",test:"ตรวจ VPN"},{id:"routing",title:"Routing",config:"[Rule]",test:"ทดสอบ rule"},{id:"remote-dns",title:"Remote DNS",config:"[Rule] → force-remote-dns",test:"ทดสอบ remote resolve"},{id:"blocking",title:"Blocking",config:"[Rule] → REJECT",test:"ทดสอบโดเมน"}],
  loon:[{id:"dns",title:"DNS",config:"[General] DNS settings",test:"ตรวจ resolver"},{id:"tun",title:"VPN / TUN",config:"Loon Tunnel",test:"ตรวจ interface"},{id:"routing",title:"Routing",config:"[Rule]",test:"ทดสอบ rule"},{id:"blocking",title:"Blocking",config:"[Rule] reject",test:"ทดสอบโดเมน"}],
  stash:[{id:"dns",title:"DNS",config:"dns.default-nameserver / nameserver / nameserver-policy",test:"ตรวจ resolver"},{id:"fake-ip",title:"Fake IP",config:"dns.fake-ip-filter",test:"ทดสอบ domain"},{id:"routing",title:"Routing",config:"rules / proxy-groups",test:"ทดสอบ rule"},{id:"blocking",title:"Blocking",config:"rules: REJECT",test:"ทดสอบโดเมน"}],
  "quantumult-x":[{id:"dns",title:"DNS",config:"[dns] → server / doh-server / doq-server",test:"ตรวจ resolver"},{id:"system-dns",title:"System DNS",config:"[dns] → no-system",test:"เทียบ system DNS"},{id:"ipv6",title:"IPv6",config:"[dns] → no-ipv6",test:"ทดสอบ A/AAAA"},{id:"routing",title:"Routing",config:"[filter_local] / [filter_remote] / [policy]",test:"ทดสอบ filter → policy"},{id:"blocking",title:"Blocking",config:"filter → reject",test:"ทดสอบโดเมน"}],
  "apple-mobileconfig":[{id:"dns",title:"DNS",config:"com.apple.dnsSettings.managed",test:"ตรวจ DNS payload"},{id:"webclip",title:"Web App",config:"com.apple.webClip.managed",test:"ตรวจ Web Clip"},{id:"wifi",title:"Wi-Fi",config:"com.apple.wifi.managed",test:"ตรวจ Wi-Fi payload"},{id:"vpn",title:"VPN",config:"com.apple.vpn.managed",test:"ตรวจ VPN payload"},{id:"global-proxy",title:"Global HTTP Proxy",config:"com.apple.proxy.http.global",test:"ตรวจ payload และ supervision requirement"}],
  "apple-dns-declaration":[{id:"dns",title:"DNS Settings",config:"com.apple.configuration.network.dns-settings",test:"ตรวจ declaration"},{id:"protocol",title:"DNS Protocol",config:"DNSProtocol / ServerURL",test:"ทดสอบ DoH/DoT"},{id:"failover",title:"Failover",config:"AllowFailover",test:"ทดสอบ resolver failover"}],
  "apple-mobileconfig-legacy":[{id:"dns",title:"Legacy DNS Settings",config:"com.apple.dnsSettings.managed",test:"ตรวจ legacy DNS payload"},{id:"protocol",title:"DNS Protocol",config:"DNSProtocol / ServerURL",test:"ทดสอบโปรโตคอล"}],
  "apple-dns-proxy-provider-runtime":[{id:"runtime-ir",title:"Provider Runtime IR",config:"Provider Runtime IR",test:"ตรวจ admission และ generated Swift"},{id:"swift",title:"Swift Provider Runtime",config:"Network Extension provider source",test:"ตรวจ generated source"}]
};

export const exportFormats=[
  {id:"surge",label:"Surge",extension:".conf",mime:"text/plain",status:"verified",description:"Verified Surge 5.x profile export; credentials/endpoints are not embedded.",functions:functionGuides.surge},
  {id:"mihomo",label:"Mihomo / Clash-compatible",extension:".yaml",mime:"text/yaml",status:"template",description:"YAML configuration template.",functions:functionGuides.mihomo},
  {id:"wireguard",label:"WireGuard",extension:".conf",mime:"text/plain",status:"partial-tested",description:"Standard WireGuard configuration template.",functions:functionGuides.wireguard},
  {id:"shadowrocket",label:"Shadowrocket",extension:".conf",mime:"text/plain",status:"partial-tested",description:"Shadowrocket profile template.",functions:functionGuides.shadowrocket},
  {id:"loon",label:"Loon",extension:".conf",mime:"text/plain",status:"template",description:"Loon section-based configuration.",functions:functionGuides.loon},
  {id:"stash",label:"Stash",extension:".yaml",mime:"text/yaml",status:"template",description:"Stash YAML configuration.",functions:functionGuides.stash},
  {id:"quantumult-x",label:"Quantumult X",extension:".conf",mime:"text/plain",status:"template",description:"Quantumult X configuration.",functions:functionGuides["quantumult-x"]},
  {id:"apple-mobileconfig",label:"Apple iOS MobileConfig",extension:".mobileconfig",mime:"application/x-apple-aspen-config",status:"generated",description:"Apple Configuration Profile.",functions:functionGuides["apple-mobileconfig"]},
  {id:"apple-dns-declaration",label:"Apple Network DNS Settings",extension:".json",mime:"application/json",status:"reference",description:"Declarative DNS configuration.",functions:functionGuides["apple-dns-declaration"]},
  {id:"apple-mobileconfig-legacy",label:"Apple DNSSettings (legacy)",extension:".mobileconfig",mime:"application/xml",status:"legacy",description:"Legacy managed DNS payload.",functions:functionGuides["apple-mobileconfig-legacy"]},
  {id:"apple-dns-proxy-provider-runtime",label:"Apple DNS Proxy Provider Runtime",extension:".swift",mime:"text/plain",status:"generated-source",description:"Swift Network Extension provider runtime source generated from admitted Provider Runtime IR.",functions:functionGuides["apple-dns-proxy-provider-runtime"]}
];

function getDnsProfiles(policy={}){if(Array.isArray(policy.dnsProfiles)&&policy.dnsProfiles.length)return policy.dnsProfiles.filter(p=>p&&p.enabled!==false);if(Array.isArray(policy.dnsServers)&&policy.dnsServers.length)return[{id:"dns-default",name:"DNS",provider:"Custom",protocol:policy.dnsProtocol||"DoH",servers:policy.dnsServers,endpoint:policy.dnsServerUrl||"",role:"resolver",enabled:true,order:1}];return defaultDnsProfiles;}
function getDnsServers(policy={}){return getDnsProfiles(policy).flatMap(profile=>Array.isArray(profile.servers)?profile.servers:[]);}
function normalizeSurgeRules(policy={}){return(Array.isArray(policy.rules)?policy.rules:[]).map(rule=>{if(rule&&typeof rule.type==="string"&&typeof rule.value==="string"&&typeof rule.policy==="string")return rule;const match=typeof rule?.match==="string"?rule.match.trim():"";const action=typeof rule?.action==="string"?rule.action.trim():"";if(!match||!action)throw new TypeError("Surge rule requires match/action or type/value/policy.");if(match==="*"||match==="*.*")return null;if(match.startsWith("*."))return{type:"DOMAIN-SUFFIX",value:match.slice(2),policy:action};if(/^[A-Za-z0-9.-]+$/.test(match))return{type:"DOMAIN",value:match,policy:action};throw new TypeError("Unsupported generic rule for Surge: "+match);}).filter(Boolean);}

export function getExportArtifact(targetId,policyInput={}){
  const policy=policyInput?.policy??policyInput;
  if(targetId==="apple-mobileconfig")return compileAppleMobileConfig(policyInput).content;
  if(targetId==="apple-mobileconfig-legacy"){
    const legacyPolicy={...policy,applePayloads:{...(policy.applePayloads||{}),webclip:false,wifi:false,vpn:false,globalProxy:false,dns:true}};
    return compileAppleMobileConfig({policy:legacyPolicy}).content;
  }
  if(targetId==="apple-dns-declaration")return JSON.stringify(compileAppleDeclarativeDns(policyInput),null,2);
  if(targetId==="apple-dns-proxy-provider-runtime")return compileAppleDnsProxyProviderRuntime(policyInput).representation;
  if(targetId==="surge")return exportSurge(policyInput);
  if(targetId==="wireguard")return "[Interface]\nDNS = "+(policy.dnsServers||[]).join(", ")+"\n\n# Configuration Platform Web App\n# "+(policy.webAppUrl||policy.webEntry?.url||"")+"\n";
  if(targetId==="mihomo"||targetId==="stash")return "# Configuration Platform Web App: "+(policy.webAppUrl||policy.webEntry?.url||"")+"\n"+JSON.stringify({dns:{nameserver:getDnsServers(policy),profiles:getDnsProfiles(policy)},rules:policy.rules||[]},null,2);
  if(targetId==="shadowrocket"){const rules=(policy.rules||[]).map(r=>[r.match||r.domain||r.host,r.action||policy.routingAction||"DIRECT"].filter(Boolean).join(", ")).join("\n");return "[General]\ndns-server = "+getDnsServers(policy).join(", ")+"\n\n[Rule]\n"+rules+"\n\n";}
  if(targetId==="loon")return "[General]\n# Configuration Platform Web App: "+(policy.webAppUrl||policy.webEntry?.url||"")+"\n";
  if(targetId==="quantumult-x"){const rules=(policy.rules||[]).map(r=>[r.match||r.domain||r.host,r.action||policy.routingAction||"direct"].filter(Boolean).join(", ")).join("\n");return "[dns]\nserver = "+getDnsServers(policy).join(", ")+"\n\n[filter_local]\n"+rules+"\n";}
  return "";
}

export function getExportWarnings(targetId,policyInput={}){if(targetId==="apple-mobileconfig"||targetId==="apple-mobileconfig-legacy")return compileAppleMobileConfig(policyInput).warnings;return[];}
export function exportSurge(policyInput={}){const source=policyInput?.policy?policyInput.policy:policyInput;const policy={...defaultPolicy,...source,rules:normalizeSurgeRules(source)};return compileSurge({policy}).content;}
