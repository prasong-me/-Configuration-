import {isIP} from "node:net";
import {createAppleDnsCommandLayers} from "./dns-command-model.js";
import {compileAppleDnsDeclaration} from "./dns-schema.js";
import { analyzeAppleChainTopology, classifyAppleDnsChain, createAppleChainIR, isAppleChainAdmissionAllowed, AppleClassification, AppleTopology } from "./apple-chain-ir.js";
import { generateProviderRuntimeSwift, validateGeneratedProviderRuntimeSwift } from "./provider-runtime-swift-generator.js";

const xmlEscape=value=>String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
const uuid=()=>crypto.randomUUID();
const isNonEmptyString=value=>typeof value==="string"&&value.trim().length>0;

function plistValue(value,indent="      "){
  if(value&&typeof value==="object"&&value.__plistData===true)return "<data>"+value.base64+"</data>";
  if(typeof value==="boolean")return value?"<true/>":"<false/>";
  if(typeof value==="number")return Number.isInteger(value)?`<integer>${value}</integer>`:`<real>${value}</real>`;
  if(Array.isArray(value))return `<array>\n${value.map(x=>indent+"  "+plistValue(x,indent+"  ")).join("\n")}\n${indent}</array>`;
  if(value&&typeof value==="object")return `<dict>\n${Object.entries(value).map(([k,v])=>indent+"  <key>"+xmlEscape(k)+"</key>"+plistValue(v,indent+"  ")).join("\n")}\n${indent}</dict>`;
  return "<string>"+xmlEscape(value??"")+"</string>";
}

function payload(type,identifier,displayName,body){
  return {PayloadDescription:displayName,PayloadDisplayName:displayName,PayloadIdentifier:identifier,PayloadOrganization:"Configuration Platform",PayloadType:type,PayloadUUID:uuid(),PayloadVersion:1,...body};
}

function validHttpsUrl(value){
  try{return new URL(String(value)).protocol==="https:";}catch{return false;}
}

function normalizeAppleDnsProtocol(value){
  const protocol=String(value||"").trim().toUpperCase();
  if(protocol==="DOH")return "HTTPS";
  if(protocol==="DOT")return "TLS";
  return protocol;
}

function normalizeAppleDnsPayloads(policy){
  if(Array.isArray(policy.dnsPayloads)&&policy.dnsPayloads.length)return policy.dnsPayloads;
  if(Array.isArray(policy.dnsProfiles)&&policy.dnsProfiles.length){
    return policy.dnsProfiles.filter(profile=>profile&&profile.enabled!==false).map((profile,index)=>({
      id:isNonEmptyString(profile.id)?profile.id.trim():`dns-profile-${index+1}`,
      name:isNonEmptyString(profile.name)?profile.name.trim():`DNS Profile ${index+1}`,
      servers:Array.isArray(profile.servers)?profile.servers.filter(isNonEmptyString).filter(value=>isIP(value.trim())>0):[],
      protocol:normalizeAppleDnsProtocol(profile.protocol||policy.dnsProtocol),
      serverUrl:profile.endpoint||policy.dnsServerUrl||"",
      serverName:profile.serverName||policy.dnsServerName||"",
      domains:Array.isArray(profile.domains)?profile.domains.filter(isNonEmptyString):[]
    })).filter(profile=>profile.servers.length||profile.serverUrl||profile.serverName);
  }
  if(Array.isArray(policy.dnsServers)&&policy.dnsServers.length){
    return [{id:"dns-default",name:`${isNonEmptyString(policy.name)?policy.name.trim():"Network Configuration"} DNS Settings`,servers:policy.dnsServers.filter(isNonEmptyString),protocol:normalizeAppleDnsProtocol(policy.dnsProtocol),serverUrl:policy.dnsServerUrl||"",serverName:policy.dnsServerName||"",domains:Array.isArray(policy.dnsDomains)?policy.dnsDomains.filter(isNonEmptyString):[]}];
  }
  return [];
}

function resolveAppleWebEntry(policy){
  const entry=policy.webEntry;
  if(entry&&typeof entry==="object"){
    return {
      enabled:entry.enabled!==false,
      name:isNonEmptyString(entry.name)?entry.name.trim():"",
      url:isNonEmptyString(entry.url)?entry.url.trim():"",
      iconData:isNonEmptyString(entry.iconData)?entry.iconData.trim():"",
      iconUrl:isNonEmptyString(entry.iconUrl)?entry.iconUrl.trim():""
    };
  }
  return {
    enabled:isNonEmptyString(policy.webAppUrl),
    name:"",
    url:isNonEmptyString(policy.webAppUrl)?policy.webAppUrl.trim():"",
    iconData:isNonEmptyString(policy.webAppIconData)?policy.webAppIconData.trim():"",
    iconUrl:isNonEmptyString(policy.webAppIconUrl)?policy.webAppIconUrl.trim():""
  };
}

function normalizeWebClipIconData(value){
  if(!isNonEmptyString(value))return null;
  const raw=value.trim();
  if(/^[A-Za-z0-9+/=\r\n]+$/.test(raw)&&raw.replace(/[\r\n]/g,"").length%4===0)return raw.replace(/[\r\n]/g,"");
  return null;
}

export function compileAppleMobileConfig(input={}){
  const policy=input?.policy??input;
  const name=isNonEmptyString(policy.name)?policy.name.trim():"Network Configuration";
  const payloads=[];
  const warnings=[];
  const dnsEnabled=policy.applePayloads?.dns!==false;
  const dnsEntries=dnsEnabled?normalizeAppleDnsPayloads(policy):[];

  for(const entry of dnsEntries){
    const servers=Array.isArray(entry.servers)?entry.servers.filter(isNonEmptyString):[];
    const serverUrl=entry.serverUrl||policy.dnsServerUrl||"";
    const serverName=entry.serverName||policy.dnsServerName||"";
    if(!servers.length&&!serverUrl&&!serverName)continue;
    const protocol=String(entry.protocol||policy.dnsProtocol||"").toUpperCase(),dns={DNSProtocol:protocol};
    if(servers.length)dns.ServerAddresses=servers;
    let valid=true;
    if(protocol!=="HTTPS"&&protocol!=="TLS"){valid=false;warnings.push({code:"APPLE_DNS_PROTOCOL_REQUIRED",message:"DNSProtocol ต้องเป็น HTTPS หรือ TLS"});}
    if(protocol==="HTTPS"){if(validHttpsUrl(serverUrl))dns.ServerURL=String(serverUrl).trim();else{valid=false;warnings.push({code:"APPLE_DNS_SERVER_URL_REQUIRED",message:"DNS-over-HTTPS ต้องมี ServerURL แบบ https://"});}}
    if(protocol==="TLS"){if(isNonEmptyString(serverName))dns.ServerName=String(serverName).trim();else{valid=false;warnings.push({code:"APPLE_DNS_SERVER_NAME_REQUIRED",message:"DNS-over-TLS ต้องมี ServerName"});}}
    if(Array.isArray(entry.domains)&&entry.domains.length)dns.SupplementalMatchDomains=entry.domains.filter(isNonEmptyString);
    if(valid)payloads.push(payload("com.apple.dnsSettings.managed",isNonEmptyString(entry.id)?"com.configurationplatform.dns."+entry.id:"com.configurationplatform.dns."+uuid(),entry.name||name+" DNS Settings",{DNSSettings:dns}));
  }

  const webEntry=resolveAppleWebEntry(policy);
  if((policy.applePayloads?.webclip!==false)&&webEntry.enabled&&isNonEmptyString(webEntry.url)){
    if(!validHttpsUrl(webEntry.url)){
      warnings.push({code:"APPLE_WEBCLIP_URL_REQUIRED",message:"Apple Web Clip URL ต้องเป็น HTTPS"});
    }else{
      const webClip={URL:webEntry.url,Label:webEntry.name||name,FullScreen:true,IsRemovable:true,Precomposed:true};
      const iconData=normalizeWebClipIconData(webEntry.iconData);
      if(iconData)webClip.Icon={__plistData:true,base64:iconData};
      else if(webEntry.iconData)warnings.push({code:"APPLE_WEBCLIP_ICON_DATA_INVALID",message:"Web Clip Icon data ไม่ใช่ base64 ที่รองรับ จึงไม่ใส่ Icon"});
      if(webEntry.iconUrl)warnings.push({code:"APPLE_WEBCLIP_ICON_URL_NOT_EMBEDDED",message:"Apple Web Clip Icon ต้องเป็น image data; จะไม่ใส่ URL เป็น Icon"});
      payloads.push(payload("com.apple.webClip.managed","com.configurationplatform.webclip."+uuid(),webEntry.name||name+" Web App",webClip));
    }
  }

  if(policy.vpn){
    const vpnProtocol=String(policy.vpnProtocol||"").toLowerCase();
    if(vpnProtocol==="ikev2"||vpnProtocol==="ipsec"||vpnProtocol==="l2tp")warnings.push({code:"APPLE_VPN_CREDENTIALS_REQUIRED",message:"VPN payload ต้องมีข้อมูลเซิร์ฟเวอร์และการยืนยันตัวตนที่ครบถ้วนก่อนสร้าง payload"});
    else if(vpnProtocol)warnings.push({code:"APPLE_VPN_EXTENSION_OR_APP_REQUIRED",message:"VPN ประเภทนี้อาจต้องใช้แอปหรือ Network Extension ของผู้ให้บริการ"});
  }

  if(policy.applePayloads?.wifi){
    const ssid=isNonEmptyString(policy.wifiSSID)?policy.wifiSSID.trim():"";
    if(ssid){
      const wifi={SSID_STR:ssid,AutoJoin:policy.wifiAutoJoin!==false,EncryptionType:policy.wifiEncryptionType||"Any"};
      if(isNonEmptyString(policy.wifiPassword))wifi.Password=policy.wifiPassword;
      if(typeof policy.wifiHidden==="boolean")wifi.HIDDEN_NETWORK=policy.wifiHidden;
      payloads.push(payload("com.apple.wifi.managed","com.configurationplatform.wifi."+uuid(),policy.wifiName||name+" Wi-Fi",wifi));
    }else warnings.push({code:"APPLE_WIFI_SSID_REQUIRED",message:"Wi-Fi payload ต้องมี SSID"});
  }

  if(policy.applePayloads?.vpn){
    const vpnProtocol=String(policy.vpnProtocol||"ikev2").toLowerCase();
    if(vpnProtocol==="l2tp"){
      const remote=String(policy.vpnRemoteAddress||"").trim(),user=String(policy.vpnAuthName||policy.vpnLocalIdentifier||"").trim(),password=String(policy.vpnAuthPassword||"").trim(),secret=String(policy.vpnSharedSecret||"").trim();
      if(remote&&user&&password&&secret)payloads.push(payload("com.apple.vpn.managed","com.configurationplatform.vpn."+uuid(),policy.vpnName||name+" VPN",{VPNType:"L2TP",UserDefinedName:policy.vpnName||name+" VPN",PPP:{AuthName:user,AuthPassword:password,CommRemoteAddress:remote},IPSec:{AuthenticationMethod:"SharedSecret",LocalIdentifierType:"KeyID",SharedSecret:secret},IPv4:{OverridePrimary:1}}));
      else warnings.push({code:"APPLE_L2TP_REQUIRED_FIELDS",message:"L2TP ต้องมี RemoteAddress, username, password และ SharedSecret"});
    }else{
      const remote=String(policy.vpnRemoteAddress||"").trim(),local=String(policy.vpnLocalIdentifier||"").trim(),remoteId=String(policy.vpnRemoteIdentifier||"").trim(),auth=String(policy.vpnAuthenticationMethod||"SharedSecret");
      if(remote&&local&&remoteId){
        const ike={RemoteAddress:remote,RemoteIdentifier:remoteId,LocalIdentifier:local,AuthenticationMethod:auth};
        if(auth==="SharedSecret"&&isNonEmptyString(policy.vpnSharedSecret))ike.SharedSecret=policy.vpnSharedSecret;
        if(isNonEmptyString(policy.vpnAuthName))ike.AuthName=policy.vpnAuthName;
        if(isNonEmptyString(policy.vpnAuthPassword))ike.AuthPassword=policy.vpnAuthPassword;
        payloads.push(payload("com.apple.vpn.managed","com.configurationplatform.vpn."+uuid(),policy.vpnName||name+" VPN",{VPNType:"IKEv2",UserDefinedName:policy.vpnName||name+" VPN",IKEv2:ike}));
      }else warnings.push({code:"APPLE_IKEV2_REQUIRED_FIELDS",message:"IKEv2 ต้องมี RemoteAddress, RemoteIdentifier และ LocalIdentifier"});
    }
  }

  if(policy.applePayloads?.globalProxy){
    warnings.push({code:"APPLE_GLOBAL_PROXY_SUPERVISION",message:"Global HTTP Proxy เป็น payload ที่ Apple กำหนดให้ติดตั้งบนอุปกรณ์ที่มี supervision"});
    const m=String(policy.proxyServer||"").trim().match(/^([^:]+):(\d{1,5})$/);
    if(m&&Number(m[2])>=1&&Number(m[2])<=65535)payloads.push(payload("com.apple.proxy.http.global","com.configurationplatform.globalproxy."+uuid(),name+" Global HTTP Proxy",{ProxyType:"Manual",ProxyServer:m[1],ProxyServerPort:Number(m[2]),ProxyCaptiveLoginAllowed:false}));
    else warnings.push({code:"APPLE_GLOBAL_PROXY_FORMAT",message:"Global HTTP Proxy ใช้รูปแบบ host:port และ port 1-65535"});
  }

  const profile=payload("Configuration","com.configurationplatform.profile."+uuid(),name,{PayloadContent:payloads,PayloadRemovalDisallowed:false});
  return {content:`<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple Inc.//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n${plistValue(profile)}\n</plist>\n`,warnings,payloadCount:payloads.length,signed:false};
}

export function compileAppleDnsProxyProviderRuntime(input={}){
  const policy=input?.policy??input;
  const runtimeIR=policy?.providerRuntimeIR;
  if(!runtimeIR){const error=new Error("Provider Runtime IR is required; native DNS pipeline is never flattened into provider runtime source.");error.code="PROVIDER_RUNTIME_IR_REQUIRED";throw error;}
  const result=generateProviderRuntimeSwift({runtimeIR});
  if(result.status!=="GENERATED"){const error=new Error("Provider Runtime generation was blocked by contract admission.");error.code="PROVIDER_RUNTIME_GENERATION_BLOCKED";error.details=result.admission;throw error;}
  const validation=validateGeneratedProviderRuntimeSwift(result);
  if(!validation.valid){const error=new Error("Generated Provider Runtime artifact failed structural validation.");error.code="PROVIDER_RUNTIME_GENERATED_ARTIFACT_INVALID";error.details=validation.errors;throw error;}
  return {targetId:"apple-dns-proxy-provider-runtime",outputFormat:"text",representation:result.artifact.files[0].content,diagnostics:[]};
}

export function compileAppleDeclarativeDns(input={}){
  const policy=input?.policy??input;
  const commands=createAppleDnsCommandLayers(policy);
  return compileAppleDnsDeclaration(commands,{visibleName:isNonEmptyString(policy.name)?policy.name.trim():"Network Configuration",identifier:policy.dnsDeclarationIdentifier,serverToken:policy.dnsServerToken});
}

export { analyzeAppleChainTopology, classifyAppleDnsChain, createAppleChainIR, isAppleChainAdmissionAllowed, AppleClassification, AppleTopology } from "./apple-chain-ir.js";
export { createProviderRuntimeContract, validateProviderRuntimeContract, isProviderRuntimeAdmissionAllowed } from "./provider-runtime-contract.js";
export { createDnsWireParserContract, validateDnsWireParserContract } from "./dns-wire-contract.js";
export { createDnsWireEncoderContract, validateDnsWireEncoderContract, DnsWireEncoderCompression, DnsWireEncoderRdataMode } from "./dns-wire-encoder-contract.js";
export { createDnsWireEdnsContract, validateDnsWireEdnsContract, DnsWireEdnsVersion, DnsWireEdnsOption } from "./dns-wire-edns-contract.js";
export { createProviderStageContract, validateProviderStageContract, resolveProviderStageExecutionOrder } from "./provider-stage-contract.js";
export { createProviderTransportContract, validateProviderTransportContract, ProviderTransportMode } from "./provider-transport-contract.js";
export { createProviderRuntimeIR, validateProviderRuntimeIR, isProviderRuntimeIRAdmissionAllowed, canonicalizeProviderRuntimeIR } from "./provider-runtime-ir.js";
export { createProviderRuntimeGeneratorContract, validateProviderRuntimeGeneratorContract, isProviderRuntimeGeneratorAdmissionAllowed, GeneratorLanguage, GeneratorRuntimeTarget, GeneratorUnit } from "./provider-runtime-generator-contract.js";
export { generateProviderRuntimeSwift, validateGeneratedProviderRuntimeSwift } from "./provider-runtime-swift-generator.js";
export { decodeDnsWireMessage, encodeDnsWireMessage } from "./dns-wire-runtime.js";
export { createProviderStageExecutionEngine, FAILURE_TYPES } from "./provider-stage-execution.js";
export { createProviderFlowIoContract, validateProviderFlowIoContract, isProviderFlowIoAdmissionAllowed, ProviderFlowTransport, ProviderFlowState, ProviderFlowOwnership, ProviderFlowIoMode } from "./provider-flow-io-contract.js";
export { createProviderFlowIoEngine } from "./provider-flow-io-runtime.js";
