export const CapabilityState = Object.freeze({ SUPPORTED:"SUPPORTED", LIMITED:"LIMITED", TRANSFORMABLE:"TRANSFORMABLE", LOSSY:"LOSSY", UNSUPPORTED:"UNSUPPORTED", UNKNOWN:"UNKNOWN" });
export const CapabilityDecision = Object.freeze({ ALLOW:"ALLOW", ALLOW_WITH_WARNING:"ALLOW_WITH_WARNING", BLOCK:"BLOCK" });
const VALID_STATES = new Set(Object.values(CapabilityState));
export const CapabilityId = Object.freeze({ VPN:"vpn", DNS:"dns", ROUTING:"routing", BLOCKING_MALWARE:"blocking.malware", BLOCKING_TRACKERS:"blocking.trackers", ROUTING_RULES:"routing.rules", DNS_PROFILES:"dns.profiles", DNS_RESOLUTION:"dns.resolution", DNS_PIPELINE:"dns.pipeline", PROXY_SERVER:"proxy.server", BLOCKLISTS:"blocking.blocklists", SYSTEM_BYPASS:"routing.bypassSystem", WEB_ENTRY:"web.entry", RUNTIME_COMMANDS:"runtime.commands", ROUTING_FINAL:"routing.final", PROVIDER_METADATA:"policy.providers" });
export const CapabilityDefinitions = Object.freeze([
  Object.freeze({id:CapabilityId.VPN,source:"vpn",kind:"feature"}),
  Object.freeze({id:CapabilityId.DNS,source:"dns",kind:"feature"}),
  Object.freeze({id:CapabilityId.ROUTING,source:"routing",kind:"feature"}),
  Object.freeze({id:CapabilityId.BLOCKING_MALWARE,source:"blocking.malware",kind:"feature"}),
  Object.freeze({id:CapabilityId.BLOCKING_TRACKERS,source:"blocking.trackers",kind:"feature"}),
  Object.freeze({id:CapabilityId.ROUTING_RULES,source:"rules",kind:"semantic"}),
  Object.freeze({id:CapabilityId.DNS_PROFILES,source:"dnsProfiles",kind:"semantic"}),
  Object.freeze({id:CapabilityId.DNS_RESOLUTION,source:"dnsResolution",kind:"semantic"}),
  Object.freeze({id:CapabilityId.DNS_PIPELINE,source:"dnsPipeline",kind:"semantic"}),
  Object.freeze({id:CapabilityId.PROXY_SERVER,source:"proxyServer",kind:"semantic"}),
  Object.freeze({id:CapabilityId.BLOCKLISTS,source:"blocklists",kind:"semantic"}),
  Object.freeze({id:CapabilityId.SYSTEM_BYPASS,source:"bypassSystem",kind:"semantic"}),
  Object.freeze({id:CapabilityId.WEB_ENTRY,source:"webEntry",kind:"semantic"}),
  Object.freeze({id:CapabilityId.RUNTIME_COMMANDS,source:"commands",kind:"semantic"}),
  Object.freeze({id:CapabilityId.ROUTING_FINAL,source:"finalPolicy",kind:"semantic"}),
  Object.freeze({id:CapabilityId.PROVIDER_METADATA,source:"providers",kind:"metadata"})
]);
export const defaultCapabilityRegistry=createCapabilityRegistry(CapabilityDefinitions.map(definition=>({ ...definition, states:Object.values(CapabilityState) })));
export function getCapabilityDefinition(id){ const definition=CapabilityDefinitions.find(item=>item.id===id); return definition ? Object.freeze({...definition}) : null; }
export function evaluateCapability(capability,requested=true){
  if(!requested) return {requested:false,state:"NOT_REQUESTED",decision:CapabilityDecision.ALLOW};
  const state=VALID_STATES.has(capability)?capability:CapabilityState.UNKNOWN;
  const decision=state===CapabilityState.SUPPORTED||state===CapabilityState.TRANSFORMABLE ? CapabilityDecision.ALLOW : state===CapabilityState.LIMITED||state===CapabilityState.LOSSY ? CapabilityDecision.ALLOW_WITH_WARNING : CapabilityDecision.BLOCK;
  return {requested:true,state,decision};
}
export function createCapabilityRegistry(entries=[]){
  const registry=new Map();
  for(const entry of entries) registerCapability(registry,entry);
  return Object.freeze({ get:(id)=>registry.has(id)?structuredClone(registry.get(id)):null, has:(id)=>registry.has(id), list:()=>[...registry.values()].map(x=>structuredClone(x)), size:()=>registry.size });
}
export function registerCapability(registry,entry){
  if(!(registry instanceof Map)) throw new TypeError("Capability registry storage must be a Map.");
  if(!entry?.id||typeof entry.id!=="string") throw new TypeError("Capability requires a string id.");
  if(!Array.isArray(entry.states)||entry.states.length===0) throw new TypeError("Capability requires at least one state.");
  for(const state of entry.states) if(!VALID_STATES.has(state)) throw new TypeError("Unknown capability state: "+state);
  if(registry.has(entry.id)) throw new Error("Duplicate capability: "+entry.id);
  registry.set(entry.id,structuredClone(entry)); return entry.id;
}
export function negotiateCapabilities(requested={},available={}){
  const result={};
  for(const [id,value] of Object.entries(requested)){ const requestedFlag=value===true||Boolean(value?.requested); const state=available[id] ?? CapabilityState.UNKNOWN; result[id]=evaluateCapability(state,requestedFlag); }
  return result;
}
export function capabilityDiagnostics(capabilities,{target}={}){
  const diagnostics=[];
  for(const [feature,result] of Object.entries(capabilities)){
    if(!result.requested) continue;
    if(result.state===CapabilityState.UNKNOWN) diagnostics.push({level:"CRITICAL",code:"CAPABILITY_UNKNOWN",message:"Capability for "+feature+" is not verified"+(target?" for target "+target:"")+" .",details:{feature,target}});
    else if(result.state===CapabilityState.UNSUPPORTED) diagnostics.push({level:"HIGH",code:"FEATURE_UNSUPPORTED",message:feature+" is not supported"+(target?" by target "+target:"")+" .",details:{feature,target}});
    else if(result.state===CapabilityState.LIMITED) diagnostics.push({level:"WARNING",code:"CAPABILITY_LIMITED",message:feature+" is supported with documented limitations.",details:{feature,target}});
    else if(result.state===CapabilityState.LOSSY) diagnostics.push({level:"WARNING",code:"CAPABILITY_LOSSY",message:feature+" requires a lossy transformation.",details:{feature,target}});
    else if(result.state===CapabilityState.TRANSFORMABLE) diagnostics.push({level:"INFO",code:"CAPABILITY_TRANSFORMED",message:feature+" can be transformed for this target.",details:{feature,target}});
  }
  return diagnostics;
}