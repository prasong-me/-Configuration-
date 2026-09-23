const TARGET_ID="surge";

export const SURGE_SUPPORTED_FIELDS=Object.freeze([
  "dns.server","dns.encrypted","rules.domainSuffix","rules.domain","rules.final"
]);

function assertString(v,name){if(typeof v!=="string"||!v.trim())throw new TypeError(name+" must be a non-empty string.");}
function list(v){return Array.isArray(v)?v:[];}

export function compileSurge(policy){
  if(!policy||typeof policy!=="object")throw new TypeError("Policy is required.");
  const p=policy.policy??policy;
  const lines=["[General]"];
  const dns=list(p.dnsServers);
  if(dns.length) lines.push("dns-server = "+dns.join(", "));
  lines.push("","[Rule]");
  for(const rule of list(p.rules)){
    assertString(rule?.type,"rule.type"); assertString(rule?.value,"rule.value"); assertString(rule?.policy,"rule.policy");
    const allowed=["DOMAIN","DOMAIN-SUFFIX"];
    if(!allowed.includes(rule.type)) throw new TypeError("Unsupported Surge rule type: "+rule.type);
    lines.push([rule.type,rule.value,rule.policy].join(","));
  }
  const final=p.finalPolicy??"DIRECT";
  assertString(final,"finalPolicy");
  lines.push("FINAL,"+final,"");
  return {targetId:TARGET_ID,format:"surge-profile",filename:"profile.conf",content:lines.join("\n")};
}

export const surgeAdapter={targetId:TARGET_ID,compile:compileSurge};
