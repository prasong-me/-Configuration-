import { CapabilityState } from "../../capabilities/src/index.js";
const manifests=new Map([["example",{id:"example",version:"0.1",status:"reference-only",capabilities:{vpn:CapabilityState.SUPPORTED,dns:CapabilityState.SUPPORTED,routing:CapabilityState.SUPPORTED,"blocking.malware":CapabilityState.SUPPORTED,"blocking.trackers":CapabilityState.SUPPORTED}}]]);
export function getTargetManifest(targetId){return manifests.get(targetId) ?? null;}
export function listTargetManifests(){return [...manifests.values()].map(x=>structuredClone(x));}
export function registerTargetManifest(manifest){if(!manifest?.id||!manifest?.capabilities) throw new TypeError("Target manifest requires id and capabilities."); manifests.set(manifest.id,structuredClone(manifest));}
