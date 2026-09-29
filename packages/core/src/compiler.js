import { normalizePolicy } from "./policy-normalizer.js";

export const CompilerContract = Object.freeze({
  version:"1.0",
  stages:Object.freeze(["NORMALIZE","MAP","IR"]),
  deterministic:true,
  mutation:"none",
  unknownCapability:"BLOCK"
});

export const CompileResultContract = Object.freeze({
  version:"1.0",
  required:Object.freeze(["targetId","outputFormat","representation"]),
  representationOwnProperty:true
});

export function createCompileResult(targetId,outputFormat,representation){
  if(typeof targetId!=="string"||!targetId.trim()) throw new TypeError("Compile result requires targetId.");
  if(typeof outputFormat!=="string"||!outputFormat.trim()) throw new TypeError("Compile result requires outputFormat.");
  return {targetId,outputFormat,representation};
}

export function inspectCompileResult(result,targetId,expectedFormat){
  if(!result||typeof result!=="object") return {
    code:"INVALID_COMPILE_RESULT",
    message:"Target adapter returned a non-object compile result."
  };
  if(result.targetId!==targetId) return {
    code:"TARGET_ID_MISMATCH",
    message:"Target adapter compile result targetId does not match requested target.",
    details:{target:targetId,actual:result.targetId}
  };
  if(result.outputFormat!==expectedFormat) return {
    code:"TARGET_OUTPUT_FORMAT_MISMATCH",
    message:"Target adapter compile result output format does not match target output format.",
    details:{target:targetId,expected:expectedFormat,actual:result.outputFormat}
  };
  if(!Object.hasOwn(result,"representation")) return {
    code:"INVALID_COMPILE_RESULT",
    message:"Target adapter compile result is missing its representation property."
  };
  return null;
}

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

  const semanticFields=[
    ["proxyServer","proxy.server","PROXY_ENDPOINT"],
    ["blocklists","blocking.blocklists","BLOCKLIST_SOURCES"],
    ["dnsResolution","dns.resolution","DNS_RESOLUTION_POLICY"],
    ["dnsPipeline","dns.pipeline","DNS_PIPELINE"],
    ["finalPolicy","routing.final","FINAL_POLICY"],
    ["bypassSystem","routing.bypassSystem","SYSTEM_BYPASS"],
    ["commands","runtime.commands","RUNTIME_COMMANDS"],
    ["webEntry","web.entry","WEB_ENTRY"],
    ["providers","policy.providers","PROVIDER_METADATA"]
  ];

  for(const [source,feature,semantic] of semanticFields){
    if(policy[source]===undefined) continue;
    mappings.push({
      feature,
      source,
      target:targetId,
      semantic,
      value:stable(policy[source])
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
  return createCompileResult(targetId,"target-ir",ir);
}
