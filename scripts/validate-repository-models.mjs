import { listTargetManifests } from "../packages/targets/src/index.js";
import { CapabilityDefinitions, CapabilityState } from "../packages/capabilities/src/index.js";

const validStates=new Set(Object.values(CapabilityState));
const capabilityIds=new Set(CapabilityDefinitions.map(x=>x.id));
const errors=[];

for(const manifest of listTargetManifests()){
  if(!manifest.id || !manifest.version) errors.push("TARGET_ID_VERSION_REQUIRED:"+manifest.id);
  for(const id of capabilityIds){
    if(!(id in (manifest.capabilities||{}))) errors.push("CAPABILITY_MISSING:"+manifest.id+":"+id);
    else if(!validStates.has(manifest.capabilities[id])) errors.push("CAPABILITY_STATE_INVALID:"+manifest.id+":"+id);
  }
  for(const [id,state] of Object.entries(manifest.capabilities||{})){
    if(!capabilityIds.has(id)) errors.push("CAPABILITY_UNKNOWN_KEY:"+manifest.id+":"+id);
    if(!validStates.has(state)) errors.push("CAPABILITY_STATE_INVALID:"+manifest.id+":"+id);
  }
  for(const evidence of manifest.evidence||[]){
    if(!evidence || typeof evidence!=="object" || typeof evidence.level!=="string") errors.push("EVIDENCE_SHAPE_INVALID:"+manifest.id);
    if(["OFFICIAL","PRIMARY","REFERENCE"].includes(evidence.level) && typeof evidence.url!=="string") errors.push("EVIDENCE_URL_REQUIRED:"+manifest.id);
    if(evidence.level==="REAL_DEVICE" && !(Number.isInteger(evidence.tests)||typeof evidence.scope==="string"||typeof evidence.status==="string")) errors.push("REAL_DEVICE_EVIDENCE_SCOPE_REQUIRED:"+manifest.id);
  }
}

if(errors.length){
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("Repository model validation passed:",listTargetManifests().length,"targets;",CapabilityDefinitions.length,"capabilities.");
