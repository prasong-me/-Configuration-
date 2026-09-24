import test from "node:test";
import assert from "node:assert/strict";
import { normalizePolicy, compatibilityReport, compile } from "../packages/core/src/index.js";
import { listTargetManifests } from "../packages/targets/src/index.js";

test("normalizePolicy creates canonical shape",()=>{assert.deepEqual(normalizePolicy({vpn:true,blocking:{trackers:true}}),{version:"0.1",policy:{vpn:true,dns:false,routing:false,blocking:{malware:false,trackers:true}}});});
test("unknown targets cannot export",()=>{const r=compatibilityReport({vpn:true},"does-not-exist");assert.equal(r.exportable,false);assert.ok(r.diagnostics.some(x=>x.code==="TARGET_UNKNOWN"));});
test("verified Surge VPN capability does not create an unknown-capability block",()=>{const r=compatibilityReport({vpn:true},"surge");assert.equal(r.exportable,true);assert.equal(r.capabilities.vpn.state,"SUPPORTED");});
test("unknown capabilities remain blocking",()=>{const r=compatibilityReport({vpn:true},"mihomo");assert.equal(r.exportable,false);assert.equal(r.capabilities.vpn.state,"UNKNOWN");assert.ok(r.diagnostics.some(x=>x.code==="CAPABILITY_UNKNOWN"));});
test("verified reference capability can report exportability",()=>{const r=compatibilityReport({vpn:true},"example");assert.equal(r.exportable,true);assert.equal(r.capabilities.vpn.state,"SUPPORTED");});
test("compile refuses missing adapter",()=>{const r=compile({vpn:true},"example",null);assert.equal(r.ok,false);assert.equal(r.report.exportable,false);assert.ok(r.report.diagnostics.some(x=>x.code==="ADAPTER_UNAVAILABLE"));});
test("target registry exposes evidence records",()=>{const surge=listTargetManifests().find(x=>x.id==="surge");assert.equal(surge.status,"verified");assert.equal(surge.evidence[0].level,"OFFICIAL");});
