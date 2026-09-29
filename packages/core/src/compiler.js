import { normalizePolicy } from "./policy-normalizer.js";
import { CapabilityId, CapabilityState, evaluateCapability, capabilityDiagnostics } from "../../capabilities/src/index.js";

export const CompilerContract = Object.freeze({ version:"1.1", stages:Object.freeze(["NORMALIZE","MAP","ADMISSION","IR"]), deterministic:true, mutation:"none", unknownCapability:"BLOCK" });
export const CompileResultContract = Object.freeze({ version:"1.0", required:Object.freeze(["targetId","outputFormat","representation"]), representationOwnProperty:true });
export function createCompileResult(targetId,outputFormat,representation){
  if(typeof targetId!=="string"||!targetId.trim()) throw new TypeError("Compile result requires targetId.");
  if(typeof outputFormat!=="string"||!outputFormat.trim()) throw new TypeError("Compile result requires outputFormat.");
  return {targetId,outputFormat,representation};
}
export function inspectCompileResult(result,targetId,expectedFormat){
  if(!result||typeof result!=="object") return {code:"INVALID_COMPILE_RESULT",message:"Target adapter returned a non-object compile result."};
  if(result.targetId!==targetId) return {code:"TARGET_ID_MISMATCH",message:"Target adapter compile result targetId does not match requested target.",details:{target:targetId,actual:result.targetId}};
  if(result.outputFormat!==expectedFormat) return {code:"TARGET_OUTPUT_FORMAT_MISMATCH",message:"Target adapter compile result output format does not match target output format.",details:{target:targetId,expected:expectedFormat,actual:result.outputFormat}};
  if(!Object.hasOwn(result,"representation")) return {code:"INVALID_COMPILE_RESULT",message:"Target adapter compile result is missing its representation property."};
  return null;
}
const FEATURE_ORDER=Object.freeze([CapabilityId.VPN,CapabilityId.DNS,CapabilityId.ROUTING,CapabilityId.BLOCKING_MALWARE,CapabilityId.BLOCKING_TRACKERS]);
const SEMANTIC_FIELDS=Object.freeze([
  ["rules",CapabilityId.ROUTING_RULES,"RULE_SET"],
  ["dnsProfiles",CapabilityId.DNS_PROFILES,"RESOLVER_PROFILES"],
  ["dnsResolution",CapabilityId.DNS_RESOLUTION,"DNS_RESOLUTION_POLICY"],
  ["dnsPipeline",CapabilityId.DNS_PIPELINE,"DNS_PIPELINE"],
  ["proxyServer",CapabilityId.PROXY_SERVER,"PROXY_ENDPOINT"],
  ["blocklists",CapabilityId.BLOCKLISTS,"BLOCKLIST_SOURCES"],
  ["finalPolicy",CapabilityId.ROUTING_FINAL,"FINAL_POLICY"],
  ["bypassSystem",CapabilityId.SYSTEM_BYPASS,"SYSTEM_BYPASS"],
  ["commands",CapabilityId.RUNTIME_COMMANDS,"RUNTIME_COMMANDS"],
  ["webEntry",CapabilityId.WEB_ENTRY,"WEB_ENTRY"],
  ["providers",CapabilityId.PROVIDER_METADATA,"PROVIDER_METADATA"]
]);
function stable(value){
  if(Array.isArray(value)) return value.map(stable);
  if(value&&typeof value==="object") return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])]));
  return value;
}
export function mapPolicySemantics(policyInput,targetId){
  const normalized=normalizePolicy(policyInput);
  const mappings=[]; const policy=normalized.policy;
  for(const feature of FEATURE_ORDER){
    const requested=feature===CapabilityId.BLOCKING_MALWARE ? Boolean(policy.blocking?.malware) : feature===CapabilityId.BLOCKING_TRACKERS ? Boolean(policy.blocking?.trackers) : Boolean(policy[feature]);
    if(requested) mappings.push({feature,source:feature,target:targetId,semantic:"REQUESTED"});
  }
  for(const [source,feature,semantic] of SEMANTIC_FIELDS){
    const value=policy[source];
    const requested=Array.isArray(value) ? value.length>0 : value!==undefined;
    if(requested) mappings.push({feature,source,target:targetId,semantic,value:stable(value)});
  }
  return {contract:CompilerContract.version,targetId,policy:normalized,mappings};
}
export function admitTargetCapabilities(policyInput,targetManifest){
  if(!targetManifest?.id) throw new TypeError("Target manifest is required for capability admission.");
  const mapped=mapPolicySemantics(policyInput,targetManifest.id);
  const requested={};
  for(const mapping of mapped.mappings) requested[mapping.feature]=true;
  const evaluated={};
  for(const feature of Object.keys(requested)){
    const state=targetManifest.capabilities?.[feature] ?? CapabilityState.UNKNOWN;
    evaluated[feature]=evaluateCapability(state,true);
  }
  const diagnostics=capabilityDiagnostics(evaluated,{target:targetManifest.id});
  const values=Object.values(evaluated);
  const blocked=values.some(result=>result.decision==="BLOCK");
  return {targetId:targetManifest.id,decision:blocked?"BLOCK":values.some(result=>result.decision==="ALLOW_WITH_WARNING")?"ALLOW_WITH_WARNING":"ALLOW",capabilities:evaluated,diagnostics};
}
export function compileToTargetIR(policyInput,targetId){
  const mapped=mapPolicySemantics(policyInput,targetId);
  const ir={version:"1.0",targetId,policyVersion:mapped.policy.version,features:mapped.mappings,policy:stable(mapped.policy.policy)};
  return createCompileResult(targetId,"target-ir",ir);
}
export function compileSemanticModel(policyInput,targetId){
  const mapped=mapPolicySemantics(policyInput,targetId);
  return {contract:CompilerContract.version,targetId,policyVersion:mapped.policy.version,mappings:stable(mapped.mappings),policy:stable(mapped.policy.policy)};
}