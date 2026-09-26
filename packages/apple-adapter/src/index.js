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

export function getAppleSigningRequirement(targetId,options={}){
  if(targetId==="apple-dns-declaration") return {required:false,reason:"Declarative DNS is a declaration model; certificate identity is only needed when the selected DNS service explicitly require[...]
  if(targetId==="apple-mobileconfig-legacy") return {required:false,reason:"Legacy DNSSettings can be manually installed without profile signing; certificate identity is a separate DNS resolver au[...]
  if(targetId==="apple-mobileconfig"){
    const mode=String(options.installMode||"manual").toLowerCase();
    if(mode==="mdm"||mode==="enrollment"||options.requireSigning===true){
      return {required:true,reason:"The requested deployment path requires a signed profile or enrollment identity."};
    }
    return {required:false,reason:"Manual configuration profile generation does not require the adapter to create a signing identity."};
  }
  return {required:false,reason:"This target is not an Apple configuration profile signing target."};
}

export function compileAppleMobileConfig(input={}){
  const policy=input?.policy??input;
  const name=isNonEmptyString(policy.name)?policy.name.trim():"Network Configuration";
  const payloads=[];
  const warnings=[];
  const signing=getAppleSigningRequirement("apple-mobileconfig",policy);
  if(signing.required && !isNonEmptyString(policy.signingCertificate)) warnings.push({code:"APPLE_PROFILE_SIGNING_REQUIRED",message:signing.reason});

  const dnsEnabled=policy.applePayloads?.dns!==false;
  const dnsEntries=dnsEnabled?(Array.isArray(policy.dnsPayloads)&&policy.dnsPayloads.length?policy.dnsPayloads:(Array.isArray(policy.dnsServers)&&policy.dnsServers.length?[{servers:policy.dnsServe[...]
  for(const entry of dnsEntries){
    const servers=Array.isArray(entry.servers)?entry.servers.filter(isNonEmptyString):[]; if(!servers.length) continue;
    const protocol=String(entry.protocol||policy.dnsProtocol||"").toUpperCase(), dns={DNSProtocol:protocol,ServerAddresses:servers}; let valid=true;
    if(protocol!=="HTTPS"&&protocol!=="TLS"){valid=false;warnings.push({code:"APPLE_DNS_PROTOCOL_REQUIRED",message:"DNSProtocol ต้องเป็น HTTPS หรือ TLS"});}
    if(protocol==="HTTPS"){const u=entry.serverUrl||policy.dnsServerUrl;if(validHttpsUrl(u))dns.ServerURL=String(u).trim();else{valid=false;warnings.push({code:"APPLE_DNS_SERVER_URL_REQUIRED",mess[...]
    if(protocol==="TLS"){const n=entry.serverName||policy.dnsServerName;if(isNonEmptyString(n))dns.ServerName=String(n).trim();else{valid=false;warnings.push({code:"APPLE_DNS_SERVER_NAME_REQUIRED"[...]
    if(Array.isArray(entry.domains)&&entry.domains.length)dns.SupplementalMatchDomains=entry.domains.filter(isNonEmptyString);
    if(valid)payloads.push(payload("com.apple.dnsSettings.managed","com.configurationplatform.dns."+(isNonEmptyString(entry.id)?entry.id:uuid()),entry.name||name+" DNS Settings",{DNSSettings:dns})[...]
  }

  if((policy.applePayloads?.webclip!==false)&&isNonEmptyString(policy.webAppUrl)){
    const webClip={
      URL:policy.webAppUrl.trim(),
      Label:name,
      FullScreen:true,
      IsRemovable:true,
      Precomposed:true
    };
    const icon=webClipIcon(policy);
    if(icon) warnings.push({code:"APPLE_WEBCLIP_ICON_REQUIRES_DATA",message:"Apple Web Clip กำหนด Icon เป็น PNG data จึงไม่ใส่ URL เป็น Icon"});
    else if(policy.webAppIconUrl||policy.webAppIconData) warnings.push({code:"APPLE_WEBCLIP_ICON_URL_INVALID",message:"Web Clip Icon ต้องเป็น URL แบบ HTTPS; ระบบจ··[...]
    payloads.push(payload("com.apple.webClip.managed","com.configurationplatform.webclip."+uuid(),name+" Web App",webClip));
  }

  if(policy.applePayloads?.wifi){
    const ssid=isNonEmptyString(policy.wifiSSID)?policy.wifiSSID.trim():"";
    if(ssid){const wifi={SSID_STR:ssid,AutoJoin:policy.wifiAutoJoin!==false,EncryptionType:policy.wifiEncryptionType||"Any"};if(isNonEmptyString(policy.wifiPassword))wifi.Password=policy.wifiPass[...]
    else warnings.push({code:"APPLE_WIFI_SSID_REQUIRED",message:"Wi-Fi payload ต้องมี SSID"});
  }

  if(policy.applePayloads?.vpn){
    const remote=String(policy.vpnRemoteAddress||"").trim(),local=String(policy.vpnLocalIdentifier||"").trim(),remoteId=String(policy.vpnRemoteIdentifier||"").trim(),auth=String(policy.vpnAuthent[...]
    if(remote&&local&&remoteId){const ike={RemoteAddress:remote,RemoteIdentifier:remoteId,LocalIdentifier:local,AuthenticationMethod:auth};if(auth==="SharedSecret"&&isNonEmptyString(policy.vpnSha[...]
    else warnings.push({code:"APPLE_IKEV2_REQUIRED_FIELDS",message:"IKEv2 ต้องมี RemoteAddress, RemoteIdentifier และ LocalIdentifier"});
  }

  if(policy.applePayloads?.globalProxy){
    warnings.push({code:"APPLE_GLOBAL_PROXY_SUPERVISION",message:"Global HTTP Proxy เป็น payload ที่ Apple กำหนดให้ติดตั้งบนอุปกรณ์··[...]
    const m=String(policy.proxyServer||"").trim().match(/^([^:]+):(\d{1,5})$/);if(m&&Number(m[2])>=1&&Number(m[2])<=65535)payloads.push(payload("com.apple.proxy.http.global","com.configurationpla[...]
  }

  const profile=payload("Configuration","com.configurationplatform.profile."+uuid(),name,{
    PayloadContent:payloads,
    PayloadRemovalDisallowed:false
  });

  return {
    content:`<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple Inc.//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n${plistVal[...]
    warnings,
    payloadCount:payloads.length,
    signed:false
  };
}

export function mapAppleDnsSettings(profile={},mode="declarative"){
  const protocol=String(profile.protocol||"HTTPS").toUpperCase().replace("DOH","HTTPS").replace("DOT","TLS");
  const settings={
    DNSProtocol:protocol,
    ServerAddresses:Array.isArray(profile.servers)?profile.servers.filter(isNonEmptyString):[]
  };
  if(protocol==="HTTPS"&&isNonEmptyString(profile.endpoint)) settings.ServerURL=String(profile.endpoint).trim();
  if(protocol==="TLS"&&isNonEmptyString(profile.serverName)) settings.ServerName=String(profile.serverName).trim();
  if(Array.isArray(profile.domains)&&profile.domains.length) settings.SupplementalMatchDomains=profile.domains.filter(isNonEmptyString);
  if(typeof profile.allowFailover==="boolean") settings.AllowFailover=profile.allowFailover;
  if(mode==="legacy"&&isNonEmptyString(profile.certificateUUID)) settings.PayloadCertificateUUID=profile.certificateUUID;
  if(mode==="declarative"&&isNonEmptyString(profile.identityAssetReference)) settings.IdentityAssetReference=profile.identityAssetReference;
  return settings;
}

export function mapAppleLegacyDnsSettings(profile={}){
  return mapAppleDnsSettings(profile,"legacy");
}

export function compileAppleDeclarativeDns(input={}){
  const policy=input?.policy??input;
  const name=isNonEmptyString(policy.name)?policy.name.trim():"Network Configuration";
  const profile={protocol:policy.dnsProtocol,servers:policy.dnsServers,endpoint:policy.dnsServerUrl,serverName:policy.dnsServerName,domains:policy.dnsDomains,allowFailover:policy.dnsAllowFailover[...]
  const dns=mapAppleDnsSettings(profile,"declarative");

  return {
    Type:"com.apple.configuration.network.dns-settings",
    Identifier:uuid(),
    ServerToken:uuid(),
    Payload:{VisibleName:name,DNSSettings:dns}
  };
}
