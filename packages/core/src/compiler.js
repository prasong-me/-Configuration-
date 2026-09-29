import { normalizePolicy } from "./policy-normalizer.js";

export const CompilerContract = Object.freeze({
  version:"1.0",
  stages:Object.freeze(["NORMALIZE","MAP","IR"]),
  deterministic:true,
  mutation:"none",
  unknownCapability:"BLOCK"
});

const FEATURE_ORDER=Object.freeze(["vpn","dns","routing","blocking.malware","blocking.trackers"]);

function stable(value){
  if(Array.isArray(value)) return value.map(stable);
  if(value&&typeof value==="object"){
    return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])]));
  }
  return value;
}

export function mapPolicySemantics(policyInput,targetId){
  const normalized=normalizePolicy(policyInput);
  const mappings=[];
  const policy=normalized.policy;

  for(const feature of FEATURE_ORDER){
    const requested=feature==="blocking.malware" ? Boolean(policy.blocking?.malware)
      : feature==="blocking.trackers" ? Boolean(policy.blocking?.trackers)
      : Boolean(policy[feature]);
    if(!requested) continue;
    mappings.push({
      feature,
      source:feature,
      target:targetId,
      semantic:"REQUESTED"
    });
  }

  if(Array.isArray(policy.rules)){
    mappings.push({
      feature:"routing.rules",
      source:"rules",
      target:targetId,
      semantic:"RULE_SET",
      value:stable(policy.rules)
    });
  }

  if(Array.isArray(policy.dnsProfiles)){
    mappings.push({
      feature:"dns.profiles",
      source:"dnsProfiles",
      target:targetId,
      semantic:"RESOLVER_PROFILES",
      value:stable(policy.dnsProfiles)
    });
  }

  return {
    contract:CompilerContract.version,
    targetId,
    policy:normalized,
    mappings
  };
}

export function compileToTargetIR(policyInput,targetId){
  const mapped=mapPolicySemantics(policyInput,targetId);
  const ir={
    version:"1.0",
    targetId,
    policyVersion:mapped.policy.version,
    features:mapped.mappings,
    policy:stable(mapped.policy.policy)
  };
  return {
    targetId,
    outputFormat:"target-ir",
    representation:ir
  };
}
