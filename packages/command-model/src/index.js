const VERSION="1.0";

export const CommandKind=Object.freeze({
  DNS:"dns",
  PROXY:"proxy",
  PROXY_GROUP:"proxy-group",
  RULE:"rule",
  ROUTE:"route",
  BLOCK:"block"
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
  return parts.length===4&&parts.every(part=>/^(0|[1-9]\\d*)$/.test(part)&&Number(part)<=255);
}

function isIPv6(address){
  if(address.includes(".")) return false;
  if(address.includes(":::")) return false;
  const parts=address.split("::");
  if(parts.length>2) return false;
  const left=parts[0]?parts[0].split(":"):[];
  const right=parts.length===2&&parts[1]?parts[1].split(":"):[];
  const valid=group=>/^[0-9a-fA-F]{1,4}$/.test(group);
  if(!left.every(valid)||!right.every(valid)) return false;
  return parts.length===2 ? left.length+right.length<8 : left.length===8;
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

export function ipAddress(input={}){
  return Object.freeze({
    type:"ip",
    ...normalizeAddress(input,"ip")
  });
}

export function ipNetwork(input={}){
  return Object.freeze({
    type:"ip-network",
    ...normalizeIpNetwork(input,"ip-network")
  });
}

export function endpoint(input={}){
  const base=normalizeAddress(input,"endpoint");
  const port=assertInteger(input.port,"endpoint.port",1,65535);
  const protocol=cleanString(input.protocol,"endpoint.protocol").toLowerCase();
  return Object.freeze({
    type:"endpoint",
    ...base,
    port,
    protocol
  });
}

export function dnsCommand(input={}){
  const servers=Array.isArray(input.servers)
    ? input.servers.map((x,i)=>cleanString(x,"dns.servers["+i+"]"))
    : [];
  return Object.freeze({
    kind:CommandKind.DNS,
    servers,
    mode:cleanString(input.mode||"plain","dns.mode")
  });
}

export function proxyCommand(input={}){
  const port=input.port==null?null:assertInteger(input.port,"proxy.port",1,65535);
  return Object.freeze({
    kind:CommandKind.PROXY,
    protocol:cleanString(input.protocol||"http","proxy.protocol").toLowerCase(),
    server:cleanString(input.server,"proxy.server"),
    port,
    username:typeof input.username==="string"&&input.username.trim()?input.username.trim():null,
    password:typeof input.password==="string"&&input.password.trim()?input.password:null,
    options:input.options&&typeof input.options==="object"?structuredClone(input.options):{}
  });
}

export function ipCommand(input={}){
  return Object.freeze({
    kind:CommandKind.RULE,
    matcher:"ip",
    values:(Array.isArray(input.values)?input.values:[]).map((x,i)=>{
      const value=x?.prefix==null?ipAddress(x):ipNetwork(x);
      return {...value};
    }),
    policy:cleanString(input.policy||"DIRECT","ip.policy")
  });
}

export function domainCommand(input={}){
  return Object.freeze({
    kind:CommandKind.RULE,
    matcher:cleanString(input.matcher||"domain","domain.matcher"),
    values:(Array.isArray(input.values)?input.values:[]).map((x,i)=>cleanString(x,"domain.values["+i+"]")),
    policy:cleanString(input.policy||"DIRECT","domain.policy")
  });
}

export function configurationDocument(commands=[]){
  if(!Array.isArray(commands)) throw new TypeError("commands must be an array.");
  return Object.freeze({version:VERSION,commands:structuredClone(commands)});
}
