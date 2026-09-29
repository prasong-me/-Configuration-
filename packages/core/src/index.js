import { analyzePolicy } from "../../threat/src/index.js";
import { redact } from "../../opsec/src/index.js";
import { CapabilityState, CapabilityId, evaluateCapability, capabilityDiagnostics } from "../../capabilities/src/index.js";
import { diagnostic, DiagnosticLevel, hasBlockingDiagnostics } from "../../diagnostics/src/index.js";
import { validatePolicy } from "../../validator/src/index.js";
import { getTargetManifest } from "../../targets/src/index.js";
import { normalizeDnsPipeline } from "./dns-pipeline.js";
import { DnsController, createDnsController } from "./dns-controller.js";

export { CapabilityState, CapabilityId, DiagnosticLevel, diagnostic, hasBlockingDiagnostics, redact, evaluateCapability, capabilityDiagnostics };
export { DnsStageResult, normalizeDnsPipeline, processDnsQuery } from "./dns-pipeline.js";
export { DnsController, createDnsController } from "./dns-controller.js";
export { buildSearchIndex, searchRecords, SearchContract } from "./search.js";
export { getTargetManifest, listTargetManifests } from "../../targets/src/index.js";
export { createSerializerRegistry, defaultSerializerRegistry, SerializerFormat, listSupportedSerializerFormats } from "./serializer-registry.js";
export { createConfigurationExporter, configurationExporter } from "./exporter.js";
export { CompilerContract, CompileResultContract, createCompileResult, inspectCompileResult, mapPolicySemantics, admitTargetCapabilities, compileToTargetIR, compileSemanticModel } from "./compiler.js";

export { normalizePolicy } from "./policy-normalizer.js";

const SEMANTIC_CAPABILITY_PATHS={
  [CapabilityId.ROUTING_RULES]:p=>p.rules,
  [CapabilityId.DNS_PROFILES]:p=>p.dnsProfiles,
  [CapabilityId.DNS_RESOLUTION]:p=>p.dnsResolution,
  [CapabilityId.DNS_PIPELINE]:p=>p.dnsPipeline,
  [CapabilityId.PROXY_SERVER]:p=>p.proxyServer,
  [CapabilityId.BLOCKLISTS]:p=>p.blocklists,
  [CapabilityId.SYSTEM_BYPASS]:p=>p.bypassSystem,
  [CapabilityId.WEB_ENTRY]:p=>p.webEntry,
  [CapabilityId.RUNTIME_COMMANDS]:p=>p.commands,
  [CapabilityId.ROUTING_FINAL]:p=>p.finalPolicy,
  [CapabilityId.PROVIDER_METADATA]:p=>p.providers
};

const FEATURE_PATHS={
  [CapabilityId.VPN]:p=>p.vpn,
  [CapabilityId.DNS]:p=>p.dns,
  [CapabilityId.ROUTING]:p=>p.routing,
  [CapabilityId.BLOCKING_MALWARE]:p=>p.blocking?.malware,
  [CapabilityId.BLOCKING_TRACKERS]:p=>p.blocking?.trackers
};

export function compatibilityReport(policyInput,targetId){
  const policy=normalizePolicy(policyInput);
  const manifest=getTargetManifest(targetId);
  const diagnostics=[...validatePolicy(policy),...analyzePolicy(policy)];

  if(policy.policy.dnsResolution?.mode==="sequential" && Array.isArray(policy.policy.dnsProfiles) && policy.policy.dnsProfiles.filter(x=>x.enabled!==false).length>1){
    diagnostics.push(
      diagnostic(
        DiagnosticLevel.WARNING,
        "DNS_SEQUENTIAL_RUNTIME_REQUIRED",
        "Sequential DNS mode requires a runtime DNS controller; target DNS profile lists alone do not create a resolver chain.",
        {target:targetId,requiredProfiles:policy.policy.dnsResolution.requiredProfiles}
      )
    );
  }

  if(!manifest){
    diagnostics.push(
      diagnostic(DiagnosticLevel.CRITICAL,"TARGET_UNKNOWN",`Unknown target: ${targetId}`,{target:targetId})
    );
    return {target:targetId,policy,capabilities:{},diagnostics,exportable:false};
  }

  const capabilities={};
  for(const [feature,read] of Object.entries(FEATURE_PATHS)){
    const requested=Boolean(read(policy.policy));
    const state=requested
      ? (manifest.capabilities[feature] ?? CapabilityState.UNKNOWN)
      : CapabilityState.UNKNOWN;
    capabilities[feature]=evaluateCapability(state,requested);
  }

  for(const [feature,read] of Object.entries(SEMANTIC_CAPABILITY_PATHS)){
    const value=read(policy.policy);\n    const requested=Array.isArray(value) ? value.length>0 : value!==undefined;
    const state=requested
      ? (manifest.capabilities[feature] ?? CapabilityState.UNKNOWN)
      : CapabilityState.UNKNOWN;
    capabilities[feature]=evaluateCapability(state,requested);
  }

  for(const item of capabilityDiagnostics(capabilities,{target:targetId})){
    diagnostics.push(
      diagnostic(
        item.level==="CRITICAL" ? DiagnosticLevel.CRITICAL :
          item.level==="HIGH" ? DiagnosticLevel.HIGH :
          item.level==="WARNING" ? DiagnosticLevel.WARNING :
          DiagnosticLevel.INFO,
        item.code,
        item.message,
        item.details
      )
    );
  }

  return {
    target:targetId,
    targetVersion:manifest.version,
    policy,
    capabilities,
    diagnostics,
    exportable:!hasBlockingDiagnostics(diagnostics)
  };
}

export function compile(policyInput,targetId,adapter){
  const report=compatibilityReport(policyInput,targetId);
  if(!report.exportable) return {ok:false,report,artifact:null};

  const semantic=compileSemanticModel(policyInput,targetId);

  if(!adapter||adapter.targetId!==targetId||typeof adapter.compile!=="function"){
    const diagnostics=[
      ...report.diagnostics,
      diagnostic(
        DiagnosticLevel.CRITICAL,
        "ADAPTER_UNAVAILABLE",
        `No adapter is registered for target ${targetId}.`,
        {target:targetId}
      )
    ];
    return {
      ok:false,
      report:{...report,diagnostics,exportable:false},
      artifact:null
    };
  }

  const artifact=adapter.compile(report.policy);
  return {ok:true,report,semantic,artifact};
}
