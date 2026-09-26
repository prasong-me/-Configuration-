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

  const dnsEnabled=policy.applePayloads?.dns!==false;
  const dnsEntries=dnsEnabled?(Array.isArray(policy.dnsPayloads)&&policy.dnsPayloads.length?policy.dnsPayloads:(Array.isArray(policy.dnsServers)&&policy.dnsServers.length?[{servers:policy.dnsServers,protocol:policy.dnsProtocol,serverUrl:policy.dnsServerUrl,serverName:policy.dnsServerName,domains:policy.dnsDomains}]:[])):[];
  for(const entry of dnsEntries){
    const servers=Array.isArray(entry.servers)?entry.servers.filter(isNonEmptyString):[]; if(!servers.length) continue;
    const protocol=String(entry.protocol||policy.dnsProtocol||"").toUpperCase(), dns={DNSProtocol:protocol,ServerAddresses:servers}; let valid=true;
    if(protocol!=="HTTPS"&&protocol!=="TLS"){valid=false;warnings.push({code:"APPLE_DNS_PROTOCOL_REQUIRED",message:"DNSProtocol ต้องเป็น HTTPS หรือ TLS"});}
    if(protocol==="HTTPS"){const u=entry.serverUrl||policy.dnsServerUrl;if(validHttpsUrl(u))dns.ServerURL=String(u).trim();else{valid=false;warnings.push({code:"APPLE_DNS_SERVER_URL_REQUIRED",message:"DNS-over-HTTPS ต้องมี ServerURL แบบ https://"});}}
    if(protocol==="TLS"){const n=entry.serverName||policy.dnsServerName;if(isNonEmptyString(n))dns.ServerName=String(n).trim();else{valid=false;warnings.push({code:"APPLE_DNS_SERVER_NAME_REQUIRED",message:"DNS-over-TLS ต้องมี ServerName"});}}
    if(Array.isArray(entry.domains)&&entry.domains.length)dns.SupplementalMatchDomains=entry.domains.filter(isNonEmptyString);
    if(valid)payloads.push(payload("com.apple.dnsSettings.managed","com.configurationplatform.dns."+uuid(),entry.name||name+" DNS Settings",{DNSSettings:dns}));
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

  if(policy.applePayloads?.wifi){
    const ssid=isNonEmptyString(policy.wifiSSID)?policy.wifiSSID.trim():"";
    if(ssid){const wifi={SSID_STR:ssid,AutoJoin:policy.wifiAutoJoin!==false,EncryptionType:policy.wifiEncryptionType||"Any"};if(isNonEmptyString(policy.wifiPassword))wifi.Password=policy.wifiPassword;if(typeof policy.wifiHidden==="boolean")wifi.HIDDEN_NETWORK=policy.wifiHidden;payloads.push(payload("com.apple.wifi.managed","com.configurationplatform.wifi."+uuid(),policy.wifiName||name+" Wi-Fi",wifi));}
    else warnings.push({code:"APPLE_WIFI_SSID_REQUIRED",message:"Wi-Fi payload ต้องมี SSID"});
  }
  if(policy.applePayloads?.vpn){
    const remote=String(policy.vpnRemoteAddress||"").trim(),local=String(policy.vpnLocalIdentifier||"").trim(),remoteId=String(policy.vpnRemoteIdentifier||"").trim(),auth=String(policy.vpnAuthenticationMethod||"SharedSecret");
    if(remote&&local&&remoteId){const ike={RemoteAddress:remote,RemoteIdentifier:remoteId,LocalIdentifier:local,AuthenticationMethod:auth};if(auth==="SharedSecret"&&isNonEmptyString(policy.vpnSharedSecret))ike.SharedSecret=policy.vpnSharedSecret;if(isNonEmptyString(policy.vpnAuthName))ike.AuthName=policy.vpnAuthName;if(isNonEmptyString(policy.vpnAuthPassword))ike.AuthPassword=policy.vpnAuthPassword;payloads.push(payload("com.apple.vpn.managed","com.configurationplatform.vpn."+uuid(),policy.vpnName||name+" VPN",{VPNType:"IKEv2",UserDefinedName:policy.vpnName||name+" VPN",IKEv2:ike}));}
    else warnings.push({code:"APPLE_IKEV2_REQUIRED_FIELDS",message:"IKEv2 ต้องมี RemoteAddress, RemoteIdentifier และ LocalIdentifier"});
  }
  if(policy.applePayloads?.globalProxy){
    warnings.push({code:"APPLE_GLOBAL_PROXY_SUPERVISION",message:"Global HTTP Proxy เป็น payload ที่ Apple กำหนดให้ติดตั้งบนอุปกรณ์ที่มี supervision"});
    const m=String(policy.proxyServer||"").trim().match(/^([^:]+):(\d{1,5})$/);if(m&&Number(m[2])>=1&&Number(m[2])<=65535)payloads.push(payload("com.apple.proxy.http.global","com.configurationplatform.globalproxy."+uuid(),name+" Global HTTP Proxy",{ProxyType:"Manual",ProxyServer:m[1],ProxyServerPort:Number(m[2]),ProxyCaptiveLoginAllowed:false}));else warnings.push({code:"APPLE_GLOBAL_PROXY_FORMAT",message:"Global HTTP Proxy ใช้รูปแบบ host:port และ port 1-65535"});
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
