const xmlEscape=value=>String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");

const uuid=()=>crypto.randomUUID();

function plistValue(value,indent="      "){
  if(typeof value==="boolean") return value?"<true/>":"<false/>";
  if(typeof value==="number") return Number.isInteger(value)?`<integer>${value}</integer>`:`<real>${value}</real>`;
  if(Array.isArray(value)) return `<array>\n${value.map(x=>indent+"  "+plistValue(x,indent+"  ")).join("\n")}\n${indent}</array>`;
  if(value&&typeof value==="object") return `<dict>\n${Object.entries(value).map(([k,v])=>indent+"  <key>"+xmlEscape(k)+"</key>"+plistValue(v,indent+"  ")).join("\n")}\n${indent}</dict>`;
  return "<string>"+xmlEscape(value??"")+"</string>";
}

function payload(type,identifier,displayName,body){
  return {
    PayloadDescription:displayName,
    PayloadDisplayName:displayName,
    PayloadIdentifier:identifier,
    PayloadOrganization:"Configuration Platform",
    PayloadType:type,
    PayloadUUID:uuid(),
    PayloadVersion:1,
    ...body
  };
}

export function compileAppleMobileConfig(input={}){
  const policy=input?.policy??input;
  const name=typeof policy.name==="string"&&policy.name.trim()?policy.name.trim():"Network Configuration";
  const payloads=[];
  const warnings=[];

  if(Array.isArray(policy.dnsServers)&&policy.dnsServers.length){
    const protocol=String(policy.dnsProtocol||"").toUpperCase();
    const dns={
      DNSProtocol:protocol,
      ServerAddresses:policy.dnsServers
    };
    if(protocol!=="HTTPS"&&protocol!=="TLS"){
      warnings.push({code:"APPLE_DNS_PROTOCOL_REQUIRED",message:"ต้องเลือก DNS-over-HTTPS (HTTPS) หรือ DNS-over-TLS (TLS) ก่อนสร้างโปรไฟล์ Apple"});
    }
    if(protocol==="HTTPS"){
      if(typeof policy.dnsServerUrl==="string"&&policy.dnsServerUrl.startsWith("https://")){
        dns.ServerURL=policy.dnsServerUrl;
      }else{
        warnings.push({code:"APPLE_DNS_SERVER_URL_REQUIRED",message:"DNS-over-HTTPS ต้องมี Server URL ที่ขึ้นต้นด้วย https://"});
      }
    }
    if(protocol==="TLS"){
      if(typeof policy.dnsServerName==="string"&&policy.dnsServerName.trim()){
        dns.ServerName=policy.dnsServerName.trim();
      }else{
        warnings.push({code:"APPLE_DNS_SERVER_NAME_REQUIRED",message:"DNS-over-TLS ต้องมีชื่อเซิร์ฟเวอร์ เช่น dns.quad9.net"});
      }
    }
    if(Array.isArray(policy.dnsDomains)&&policy.dnsDomains.length) dns.SupplementalMatchDomains=policy.dnsDomains;
    if(typeof policy.dnsAllowFailover==="boolean") dns.AllowFailover=policy.dnsAllowFailover;
    payloads.push(payload("com.apple.dnsSettings.managed","configuration-platform.dns."+uuid(),name+" DNS Settings",{DNSSettings:dns}));
  }

  if(policy.webAppUrl){
    payloads.push(payload("com.apple.webClip.managed","configuration-platform.webclip."+uuid(),name+" Web App",{
      URL:policy.webAppUrl,
      Label:name,
      FullScreen:true,
      IsRemovable:true
    }));
  }

  if(policy.vpn){
    const vpnProtocol=String(policy.vpnProtocol||"").toLowerCase();
    if(vpnProtocol==="ikev2"||vpnProtocol==="ipsec"||vpnProtocol==="l2tp"){
      warnings.push({code:"APPLE_VPN_CREDENTIALS_REQUIRED",message:"VPN payload ต้องมีข้อมูลเซิร์ฟเวอร์และการยืนยันตัวตนที่ครบถ้วนก่อนจึงจะสร้าง payload ที่พร้อมใช้งานได้"});
    }else if(vpnProtocol){
      warnings.push({code:"APPLE_VPN_EXTENSION_OR_APP_REQUIRED",message:"VPN ประเภทนี้อาจต้องใช้แอปหรือ Network Extension ของผู้ให้บริการบนอุปกรณ์"});
    }
  }

  return {
    content:`<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n${plistValue(payload("Configuration","configuration-platform.profile."+uuid(),name,{PayloadContent:payloads,PayloadRemovalDisallowed:false}))}\n</plist>\n`,
    warnings,
    payloadCount:payloads.length
  };
}

export function compileAppleDeclarativeDns(input={}){
  const policy=input?.policy??input;
  const name=typeof policy.name==="string"&&policy.name.trim()?policy.name.trim():"Network Configuration";
  const dns={
    DNSProtocol:String(policy.dnsProtocol||"HTTPS").toUpperCase(),
    ServerAddresses:Array.isArray(policy.dnsServers)?policy.dnsServers:[]
  };
  if(dns.DNSProtocol==="HTTPS"&&policy.dnsServerUrl) dns.ServerURL=policy.dnsServerUrl;
  if(dns.DNSProtocol==="TLS"&&policy.dnsServerName) dns.ServerName=policy.dnsServerName;
  if(Array.isArray(policy.dnsDomains)&&policy.dnsDomains.length) dns.SupplementalMatchDomains=policy.dnsDomains;
  if(typeof policy.dnsAllowFailover==="boolean") dns.AllowFailover=policy.dnsAllowFailover;
  return {
    Type:"com.apple.configuration.network.dns-settings",
    Identifier:uuid(),
    Payload:{VisibleName:name,DNSSettings:dns}
  };
}
