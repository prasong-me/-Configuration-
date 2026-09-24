const VERSION="1.1";

export const CommandKind=Object.freeze({
  DNS:"dns",
  PROXY:"proxy",
  PROXY_GROUP:"proxy-group",
  RULE:"rule",
  ROUTE:"route",
  BLOCK:"block"
});

export const ActionKind=Object.freeze({
  DIRECT:"direct",
  PROXY:"proxy",
  BLOCK:"block",
  FINAL:"final"
});

function cleanString(value,path){
  if(typeof value!=="string"||!value.trim()) throw new TypeError(path+" must be a non-empty string.");
  return value.trim();
}

function assertInteger(value,path,min,max){
  if(!Number.isInteger(value)||value<min||value>max) throw new TypeError(path+" must be an integer from "+min+" to "+max+".");
  return value;
}

function isIPv4(address){
  const parts=address.split(".");
  return parts.length===4&&parts.every(part=>/^(0|[1-9]\d*)$/.test(part)&&Number(part)<=255);
}

function isIPv6(address){
  if(address.includes(":::")) return false;
  const parts=address.split("::");
  if(parts.length>2) return false;
  const valid=group=>/^[0-9a-fA-F]{1,4}$/.test(group);
  const expandEmbedded=group=>group.includes(".")&&isIPv4(group);
  const groups=part=>part?part.split(":"):[];
  const left=groups(parts[0]);
  const right=parts.length===2?groups(parts[1]):[];
  const count=(left.concat(right)).reduce((n,g)=>n+(expandEmbedded(g)?2:1),0);
  if(!left.every(g=>valid(g)||expandEmbedded(g))||!right.every(g=>valid(g)||expandEmbedded(g))) return false;
  return parts.length===2 ? count<8 : count===8;
}

function normalizeAddress(input,path){
  if(!input||typeof input!=="object") throw new TypeError(path+" must be an object.");
  const address=cleanString(input.address,path+".address");
  const family=cleanString(input.family,path+".family").toLowerCase();
  if(family==="ipv4"&&!isIPv4(address)) throw new TypeError(path+".address is not a valid IPv4 address.");
  if(family==="ipv6"&&!isIPv6(address)) throw new TypeError(path+".address is not a valid IPv6 address.");
  if(family!=="ipv4"&&family!=="ipv6") throw new TypeError(path+".family must be ipv4 or ipv6.");
  return {address,family};
}

function normalizeIpNetwork(input,path){
  const base=normalizeAddress(input,path);
  const max=base.family==="ipv4"?32:128;
  const prefix=assertInteger(input.prefix,path+".prefix",0,max);
  return {...base,prefix};
}

export function ipAddress(input={}) {
  return Object.freeze({type:"ip",...normalizeAddress(input,"ip")});
}

export function ipNetwork(input={}) {
  return Object.freeze({type:"ip-network",...normalizeIpNetwork(input,"ip-network")});
}

export function domainName(input={}) {
  const value=cleanString(input.value??input,"domain.value").toLowerCase();
  if(value.length>253||value.includes(" ")) throw new TypeError("domain.value must be a valid domain name.");
  return Object.freeze({type:"domain",value});
}

export function port(input={}) {
  const value=typeof input==="number"?input:input.value;
  return Object.freeze({type:"port",value:assertInteger(value,"port.value",1,65535)});
}

export function endpoint(input={}) {
  const base=normalizeAddress(input,"endpoint");
  const p=port({value:input.port});
  const protocol=cleanString(input.protocol,"endpoint.protocol").toLowerCase();
  return Object.freeze({type:"endpoint",...base,port:p.value,protocol});
}

export function dnsCommand(input={}) {
  const servers=Array.isArray(input.servers)?input.servers.map((x,i)=>{
    if(typeof x==="string") return cleanString(x,"dns.servers["+i+"]");
    return {...ipAddress(x)};
  }):[];
  return Object.freeze({kind:CommandKind.DNS,servers,mode:cleanString(input.mode||"plain","dns.mode")});
}

export function proxyCommand(input={}) {
  const p=input.port==null?null:port({value:input.port}).value;
  const credentialRef=typeof input.credentialRef==="string"&&input.credentialRef.trim()?input.credentialRef.trim():null;
  return Object.freeze({
    kind:CommandKind.PROXY,
    protocol:cleanString(input.protocol||"http","proxy.protocol").toLowerCase(),
    server:cleanString(input.server,"proxy.server"),
    port:p,
    credentialRef,
    options:input.options&&typeof input.options==="object"?structuredClone(input.options):{}
  });
}

function normalizeAction(value,path){
  const action=typeof value==="string"?value:value?.type;
  if(!Object.values(ActionKind).includes(action)) throw new TypeError(path+" must use a supported semantic action.");
  return {type:action};
}

export function ipCommand(input={}) {
  return Object.freeze({
    kind:CommandKind.RULE,
    matcher:{type:"ip"},
    values:(Array.isArray(input.values)?input.values:[]).map(x=>x?.prefix==null?ipAddress(x):ipNetwork(x)),
    action:normalizeAction(input.action??input.policy??ActionKind.DIRECT,"ip.action")
  });
}

export function domainCommand(input={}) {
  return Object.freeze({
    kind:CommandKind.RULE,
    matcher:{type:cleanString(input.matcher||"domain","domain.matcher")},
    values:(Array.isArray(input.values)?input.values:[]).map((x,i)=>domainName({value:x})),
    action:normalizeAction(input.action??input.policy??ActionKind.DIRECT,"domain.action")
  });
}

export function configurationDocument(commands=[]) {
  if(!Array.isArray(commands)) throw new TypeError("commands must be an array.");
  return Object.freeze({version:VERSION,commands:structuredClone(commands)});
}
