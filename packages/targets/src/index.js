import { CapabilityState } from "../../capabilities/src/index.js";
import { getTargetTestEvidence } from "./test-evidence.js";

const UNKNOWN_CAPABILITIES=Object.freeze({
  vpn:CapabilityState.UNKNOWN,
  dns:CapabilityState.UNKNOWN,
  routing:CapabilityState.UNKNOWN,
  "blocking.malware":CapabilityState.UNKNOWN,
  "blocking.trackers":CapabilityState.UNKNOWN
});

const manifests=new Map([
  ["example",{id:"example",version:"0.1",status:"reference-only",evidence:[],capabilities:{
    vpn:CapabilityState.SUPPORTED,dns:CapabilityState.SUPPORTED,routing:CapabilityState.SUPPORTED,
    "blocking.malware":CapabilityState.SUPPORTED,"blocking.trackers":CapabilityState.SUPPORTED
  }}],
  ["surge",{id:"surge",version:"5.x",status:"verified",evidence:[
    {level:"OFFICIAL",url:"https://manual.nssurge.com/profile/format.html"},
    {level:"REAL_DEVICE",scope:"Surge 5.x",tests:15,status:"passed"},
    {level:"REAL_DEVICE",scope:"profile-generation",status:"passed"}
  ],capabilities:{
    vpn:CapabilityState.SUPPORTED,dns:CapabilityState.SUPPORTED,routing:CapabilityState.SUPPORTED,
    "blocking.malware":CapabilityState.SUPPORTED,"blocking.trackers":CapabilityState.SUPPORTED
  },limitations:["Proxy credentials/endpoints are intentionally not generated or embedded."]}],
  ["mihomo",{id:"mihomo",version:"current-reference",status:"template-export",evidence:[
    {level:"OFFICIAL",url:"https://wiki.metacubex.one/en/config/"}
  ],capabilities:{...UNKNOWN_CAPABILITIES},limitations:["YAML export template is available; target runtime behavior still requires verification."]}],
  ["wireguard",{id:"wireguard",version:"standard-config",status:"partial-tested",evidence:[
    {level:"OFFICIAL",url:"https://www.wireguard.com/"},
    {level:"REAL_DEVICE",tests:1,status:"partial"}
  ],capabilities:{...UNKNOWN_CAPABILITIES},limitations:["Standard syntax template is available; target-app import behavior still requires separate verification."]}],
  ["shadowrocket",{id:"shadowrocket",version:"current-reference",status:"partial-tested",evidence:[
    {level:"REFERENCE",url:"https://github.com/LOWERTOP/Shadowrocket/wiki"},
    {level:"REAL_DEVICE",tests:1,status:"partial"}
  ],capabilities:{...UNKNOWN_CAPABILITIES},limitations:["Profile template is available; exact runtime behavior must be tested in the installed app version."]}],
  ["loon",{id:"loon",version:"current-reference",status:"template-export",evidence:[
    {level:"REFERENCE",url:"https://github.com/Loon0x00/LoonManual"}
  ],capabilities:{...UNKNOWN_CAPABILITIES},limitations:["Section-based template is available; exact runtime behavior must be tested in the installed app version."]}],
  ["stash",{id:"stash",version:"current-reference",status:"template-export",evidence:[
    {level:"OFFICIAL",url:"https://stash.wiki/en/configuration/example-config"}
  ],capabilities:{...UNKNOWN_CAPABILITIES},limitations:["YAML template is available; exact runtime behavior must be tested in the installed app version."]}],
  ["quantumult-x",{id:"quantumult-x",version:"current-reference",status:"template-export",evidence:[
    {level:"REFERENCE",url:"https://github.com/crossutility/Quantumult-X"}
  ],capabilities:{...UNKNOWN_CAPABILITIES},limitations:["Configuration template is available; exact runtime behavior must be tested in the installed app version."]}],
  ["apple-mobileconfig",{id:"apple-mobileconfig",version:"current-profile",status:"generated",evidence:[],capabilities:{vpn:CapabilityState.UNKNOWN,dns:CapabilityState.SUPPORTED,routing:CapabilityState.UNKNOWN,"blocking.malware":CapabilityState.UNKNOWN,"blocking.trackers":CapabilityState.UNKNOWN},limitations:["Extension-backed capabilities may require a provider app or Network Extension on the device."]}],
  ["apple-dns-declaration",{id:"apple-dns-declaration",version:"current-declarative",status:"reference-export",evidence:[
    {level:"OFFICIAL",url:"https://developer.apple.com/documentation/devicemanagement/networkdnssettings"}
  ],capabilities:{
    vpn:CapabilityState.UNKNOWN,dns:CapabilityState.SUPPORTED,routing:CapabilityState.UNKNOWN,
    "blocking.malware":CapabilityState.UNKNOWN,"blocking.trackers":CapabilityState.UNKNOWN
  },limitations:["This is the current declarative DNS configuration model, not a general-purpose proxy/VPN profile."]}],
  ["apple-mobileconfig-legacy",{id:"apple-mobileconfig-legacy",version:"legacy",status:"legacy-export",evidence:[
    {level:"OFFICIAL",url:"https://developer.apple.com/documentation/devicemanagement/dnssettings"}
  ],capabilities:{
    vpn:CapabilityState.UNKNOWN,dns:CapabilityState.SUPPORTED,routing:CapabilityState.UNKNOWN,
    "blocking.malware":CapabilityState.UNKNOWN,"blocking.trackers":CapabilityState.UNKNOWN
  },limitations:["Legacy DNSSettings payload; Apple documents the declarative network DNS configuration as the replacement on newer OS versions."]}]
]);

export function getTargetTestRecord(targetId){
  return getTargetTestEvidence(targetId);
}

export function getTargetManifest(targetId){
  const manifest=manifests.get(targetId);
  return manifest ? structuredClone(manifest) : null;
}

export function listTargetManifests(){
  return [...manifests.values()].map(x=>structuredClone(x));
}

export function registerTargetManifest(manifest){
  if(!manifest?.id||!manifest?.capabilities) throw new TypeError("Target manifest requires id and capabilities.");
  manifests.set(manifest.id,structuredClone(manifest));
}
