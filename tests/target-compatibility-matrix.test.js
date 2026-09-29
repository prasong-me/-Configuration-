import test from "node:test";
import assert from "node:assert/strict";
import { compatibilityReport, listTargetManifests } from "../packages/core/src/index.js";
import { CapabilityDefinitions, CapabilityState } from "../packages/capabilities/src/index.js";

test("every target exposes every capability with an explicit state",()=>{
  for(const manifest of listTargetManifests()){
    for(const definition of CapabilityDefinitions){
      assert.ok(Object.hasOwn(manifest.capabilities,definition.id),manifest.id+" missing "+definition.id);
      assert.ok(Object.values(CapabilityState).includes(manifest.capabilities[definition.id]),manifest.id+" invalid "+definition.id);
    }
  }
});

test("requested UNKNOWN and UNSUPPORTED capabilities remain fail-closed",()=>{
  for(const manifest of listTargetManifests()){
    for(const definition of CapabilityDefinitions){
      const state=manifest.capabilities[definition.id];
      if(state!==CapabilityState.UNKNOWN && state!==CapabilityState.UNSUPPORTED) continue;
      const policy={version:"0.6",policy:{}};
      if(definition.id==="vpn"||definition.id==="dns"||definition.id==="routing") policy.policy[definition.source]=true;
      else if(definition.id==="blocking.malware"||definition.id==="blocking.trackers") policy.policy.blocking={malware:definition.id==="blocking.malware",trackers:definition.id==="blocking.trackers"};
      else if(definition.id==="dns.pipeline") policy.policy[definition.source]=[{action:"PASS"}];
      else if(definition.id==="policy.providers") policy.policy.providers=[{id:"provider-1"}];
      else if(definition.id==="routing.bypassSystem") policy.policy[definition.source]=true;
      else if(definition.id==="web.entry") policy.policy[definition.source]={url:"https://example.invalid"};
      else if(definition.id==="proxy.server") policy.policy[definition.source]="proxy.example:8080";
      else if(definition.id==="dns.resolution") policy.policy[definition.source]={mode:"sequential",requiredProfiles:1};
      else if(definition.id==="routing.final") policy.policy[definition.source]="REJECT";
      else if(definition.id==="routing.rules") policy.policy[definition.source]=[{match:"example.com",action:"REJECT"}];
      else if(definition.id==="dns.profiles") policy.policy[definition.source]=[{id:"dns-1",servers:["1.1.1.1"]}];
      else if(definition.id==="blocking.blocklists") policy.policy[definition.source]=[{source:"https://example.invalid/list.txt"}];
      else if(definition.id==="runtime.commands") policy.policy[definition.source]=[{id:"requested"}];
      else policy.policy[definition.source]=[{id:"requested"}];
      const report=compatibilityReport(policy,manifest.id);
      assert.equal(report.exportable,false,manifest.id+" should block "+definition.id+" ("+state+")");
    }
  }
});
