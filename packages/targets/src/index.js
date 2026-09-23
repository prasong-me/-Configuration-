import { CapabilityState } from "../../capabilities/src/index.js";

const UNKNOWN_CAPABILITIES={vpn:CapabilityState.UNKNOWN,dns:CapabilityState.UNKNOWN,routing:CapabilityState.UNKNOWN,"blocking.malware":CapabilityState.UNKNOWN,"blocking.trackers":CapabilityState.UNKNOWN};
const manifests=new Map([
  ["example",{id:"example",version:"0.1",status:"reference-only",evidence:[],capabilities:{vpn:CapabilityState.SUPPORTED,dns:CapabilityState.SUPPORTED,routing:CapabilityState.SUPPORTED,"blocking.malware":CapabilityState.SUPPORTED,"blocking.trackers":CapabilityState.SUPPORTED}}],
  ["surge",{id:"surge",version:"5.x",status:"evidence-only",evidence:[{level:"OFFICIAL",url:"https://manual.nssurge.com/profile/format.html"}],capabilities:{...UNKNOWN_CAPABILITIES},limitations:["No serializer is registered yet."]}],
  ["mihomo",{id:"mihomo",version:"current-reference",status:"evidence-only",evidence:[{level:"OFFICIAL",url:"https://wiki.metacubex.one/en/config/"}],capabilities:{...UNKNOWN_CAPABILITIES},limitations:["No serializer is registered yet."]}],
  ["wireguard",{id:"wireguard",version:"standard-config",status:"evidence-only",evidence:[{level:"OFFICIAL",url:"https://www.wireguard.com/"}],capabilities:{...UNKNOWN_CAPABILITIES},limitations:["Base syntax is documented; target-app import behavior still requires separate verification."]}]
]);
export function getTargetManifest(targetId){const manifest=manifests.get(targetId);return manifest ? structuredClone(manifest) : null;}
export function listTargetManifests(){return [...manifests.values()].map(x=>structuredClone(x));}
export function registerTargetManifest(manifest){if(!manifest?.id||!manifest?.capabilities)throw new TypeError("Target manifest requires id and capabilities.");manifests.set(manifest.id,structuredClone(manifest));}
