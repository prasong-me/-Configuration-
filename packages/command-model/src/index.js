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

function normalizeIp(value){
  const text=cleanString(value,"ip");
  const slash=text.indexOf("/");
  if(slash<0) return {address:text,prefix:null,source:text};
  const address=text.slice(0,slash).trim();
  const prefix=Number(text.slice(slash+1));
  if(!address||!Number.isInteger(prefix)||prefix<0||prefix>128) throw new TypeError("Invalid IP prefix: "+text);
  return {address,prefix,source:text};
}

export function dnsCommand(input={}){
  const servers=Array.isArray(input.servers)?input.servers.map((x,i)=>cleanString(x,"dns.servers["+i+"]")):[];
  return Object.freeze({kind:CommandKind.DNS,servers,mode:input.mode||"plain"});
}

export function proxyCommand(input={}){
  return Object.freeze({
    kind:CommandKind.PROXY,
    protocol:cleanString(input.protocol||"http","proxy.protocol"),
    server:cleanString(input.server,"proxy.server"),
    port:Number.isInteger(input.port)?input.port:null,
    username:typeof input.username==="string"&&input.username.trim()?input.username.trim():null,
    password:typeof input.password==="string"&&input.password.trim()?input.password:null,
    options:input.options&&typeof input.options==="object"?structuredClone(input.options):{}
  });
}

export function ipCommand(input={}){
  return Object.freeze({
    kind:CommandKind.RULE,
    matcher:"ip",
    values:(Array.isArray(input.values)?input.values:[]).map(normalizeIp),
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

export function serializeList(values,separator=","){
  if(!Array.isArray(values)) throw new TypeError("values must be an array.");
  return values.map(x=>typeof x==="string"?x:x.source??String(x)).join(separator);
}
