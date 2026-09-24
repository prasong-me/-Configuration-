import { analyzePolicy } from "../../threat/src/index.js";
import { redact } from "../../opsec/src/index.js";
import { CapabilityState } from "../../capabilities/src/index.js";
import { diagnostic, DiagnosticLevel, hasBlockingDiagnostics } from "../../diagnostics/src/index.js";
import { validatePolicy } from "../../validator/src/index.js";
import { getTargetManifest } from "../../targets/src/index.js";

export { CapabilityState, DiagnosticLevel, diagnostic, hasBlockingDiagnostics, redact };

export function normalizePolicy(input) {
  const source=input ?? {};
  const policy=source.policy && typeof source.policy==="object" ? source.policy : source;
  const normalized={
    vpn:Boolean(policy.vpn),
    dns:Boolean(policy.dns),
    routing:Boolean(policy.routing),
    blocking:{
      malware:Boolean(policy.blocking?.malware),
      trackers:Boolean(policy.blocking?.trackers)
    },
    ...(policy.providers ? {providers:policy.providers} : {})
  };
  if(typeof policy.name==="string"&&policy.name.trim()) normalized.name=policy.name.trim();
  if(Array.isArray(policy.dnsServers)){
    normalized.dnsServers=policy.dnsServers
      .filter(x=>typeof x==="string"&&x.trim())
      .map(x=>x.trim());
  }
  if(typeof policy.proxyServer==="string"&&policy.proxyServer.trim()){
    normalized.proxyServer=policy.proxyServer.trim();
  }
  if(Array.isArray(policy.rules)) normalized.rules=structuredClone(policy.rules);
  if(typeof policy.finalPolicy==="string"&&policy.finalPolicy.trim()){
    normalized.finalPolicy=policy.finalPolicy.trim();
  }
  if(typeof policy.bypassSystem==="boolean") normalized.bypassSystem=policy.bypassSystem;
  if(policy.commands && Array.isArray(policy.commands)) normalized.commands=structuredClone(policy.commands);
  return {version:source.version ?? "0.1",policy:normalized};
}

const FEATURE_PATHS={
  vpn:p=>p.vpn,
  dns:p=>p.dns,
  routing:p=>p.routing,
  "blocking.malware":p=>p.blocking?.malware,
  "blocking.trackers":p=>p.blocking?.trackers
};

export function compatibilityReport(policyInput,targetId){
  const policy=normalizePolicy(policyInput);
  const manifest=getTargetManifest(targetId);
  const diagnostics=[...validatePolicy(policy),...analyzePolicy(policy)];

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
      : "NOT_REQUESTED";
    capabilities[feature]={requested,state};

    if(requested&&state===CapabilityState.UNSUPPORTED){
      diagnostics.push(
        diagnostic(
          DiagnosticLevel.HIGH,
          "FEATURE_UNSUPPORTED",
          `${feature} is not supported by target ${targetId}.`,
          {target:targetId,feature}
        )
      );
    }

    if(requested&&state===CapabilityState.UNKNOWN){
      diagnostics.push(
        diagnostic(
          DiagnosticLevel.CRITICAL,
          "CAPABILITY_UNKNOWN",
          `Capability for ${feature} is not verified for target ${targetId}.`,
          {target:targetId,feature}
        )
      );
    }
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
  return {ok:true,report,artifact};
}
