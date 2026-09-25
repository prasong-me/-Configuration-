const xmlEscape=value=>String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");

const uuid=()=>crypto.randomUUID();

const isNonEmptyString=value=>typeof value==="string"&&value.trim().length>0;

function plistValue(value,indent="      "){
  if(value&&typeof value==="object"&&value.__plistData===true){
    return "<data>"+value.base64+"</data>";
  }
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

function validHttpsUrl(value){
  try{
    const url=new URL(String(value));
    return url.protocol==="https:";
  }catch{
    return false;
  }
}

function webClipIcon(policy){
  const iconUrl=policy.webAppIconUrl;
  if(!isNonEmptyString(iconUrl)) return null;
  try{
    const url=new URL(iconUrl.trim());
    return url.protocol==="https:"?url.toString():null;
  }catch{
    return null;
  }
}

export function compileAppleMobileConfig(input={}){
  const policy=input?.policy??input;
  const name=isNonEmptyString(policy.name)?policy.name.trim():"Network Configuration";
  const payloads=[];
  const warnings=[];

  if(Array.isArray(policy.dnsServers)&&policy.dnsServers.length){
    const protocol=String(policy.dnsProtocol||"").toUpperCase();
    const dns={DNSProtocol:protocol,ServerAddresses:policy.dnsServers};
    let valid=true;

    if(protocol!=="HTTPS"&&protocol!=="TLS"){
      valid=false;
      warnings.push({code:"APPLE_DNS_PROTOCOL_REQUIRED",message:"Apple DNS Settings ต้องระบุ DNS-over-HTTPS (HTTPS) หรือ DNS-over-TLS (TLS)"});
    }
    if(protocol==="HTTPS"){
      if(validHttpsUrl(policy.dnsServerUrl)) dns.ServerURL=policy.dnsServerUrl;
      else { valid=false; warnings.push({code:"APPLE_DNS_SERVER_URL_REQUIRED",message:"DNS-over-HTTPS ต้องมี Server URL ที่ใช้ https://"}); }
    }
    if(protocol==="TLS"){
      if(isNonEmptyString(policy.dnsServerName)) dns.ServerName=policy.dnsServerName.trim();
      else { valid=false; warnings.push({code:"APPLE_DNS_SERVER_NAME_REQUIRED",message:"DNS-over-TLS ต้องมี ServerName เช่น dns.quad9.net"}); }
    }
    if(Array.isArray(policy.dnsDomains)&&policy.dnsDomains.length) dns.SupplementalMatchDomains=policy.dnsDomains;
    if(typeof policy.dnsAllowFailover==="boolean") dns.AllowFailover=policy.dnsAllowFailover;
    if(isNonEmptyString(policy.dnsPayloadCertificateUUID)) dns.PayloadCertificateUUID=policy.dnsPayloadCertificateUUID.trim();

    if(valid){
      payloads.push(payload("com.apple.dnsSettings.managed","com.configurationplatform.dns."+uuid(),name+" DNS Settings",{DNSSettings:dns}));
    }
  }

  if(isNonEmptyString(policy.webAppUrl)){
    const webClip={
      URL:policy.webAppUrl.trim(),
      Label:name,
      FullScreen:true,
      IsRemovable:true,
      Precomposed:true
    };
    const icon=webClipIcon(policy);
    if(icon) webClip.Icon=icon;
    else if(policy.webAppIconUrl||policy.webAppIconData) warnings.push({code:"APPLE_WEBCLIP_ICON_URL_INVALID",message:"Web Clip Icon ต้องเป็น URL แบบ HTTPS; ระบบจะสร้าง Web Clip โดยไม่ใส่ Icon หาก URL ไม่ถูกต้อง"});
    payloads.push(payload("com.apple.webClip.managed","com.configurationplatform.webclip."+uuid(),name+" Web App",webClip));
  }

  if(policy.vpn){
    const vpnProtocol=String(policy.vpnProtocol||"").toLowerCase();
    if(vpnProtocol==="ikev2"||vpnProtocol==="ipsec"||vpnProtocol==="l2tp"){
      warnings.push({code:"APPLE_VPN_CREDENTIALS_REQUIRED",message:"VPN payload ต้องมีข้อมูลเซิร์ฟเวอร์และการยืนยันตัวตนที่ครบถ้วนก่อนสร้าง payload"});
    }else if(vpnProtocol){
      warnings.push({code:"APPLE_VPN_EXTENSION_OR_APP_REQUIRED",message:"VPN ประเภทนี้อาจต้องใช้แอปหรือ Network Extension ของผู้ให้บริการ"});
    }
  }

  const profile=payload("Configuration","com.configurationplatform.profile."+uuid(),name,{
    PayloadContent:payloads,
    PayloadRemovalDisallowed:false
  });

  return {
    content:`<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple Inc.//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n${plistValue(profile)}\n</plist>\n`,
    warnings,
    payloadCount:payloads.length,
    signed:false
  };
}

export function compileAppleDeclarativeDns(input={}){
  const policy=input?.policy??input;
  const name=isNonEmptyString(policy.name)?policy.name.trim():"Network Configuration";
  const protocol=String(policy.dnsProtocol||"HTTPS").toUpperCase();
  const dns={DNSProtocol:protocol,ServerAddresses:Array.isArray(policy.dnsServers)?policy.dnsServers:[]};

  if(protocol==="HTTPS"&&policy.dnsServerUrl) dns.ServerURL=policy.dnsServerUrl;
  if(protocol==="TLS"&&policy.dnsServerName) dns.ServerName=policy.dnsServerName;
  if(Array.isArray(policy.dnsDomains)&&policy.dnsDomains.length) dns.SupplementalMatchDomains=policy.dnsDomains;
  if(typeof policy.dnsAllowFailover==="boolean") dns.AllowFailover=policy.dnsAllowFailover;

  return {
    Type:"com.apple.configuration.network.dns-settings",
    Identifier:uuid(),
    ServerToken:uuid(),
    Payload:{VisibleName:name,DNSSettings:dns}
  };
}
