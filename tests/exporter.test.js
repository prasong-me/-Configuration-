import test from "node:test";
import assert from "node:assert/strict";
import { createConfigurationExporter } from "../packages/core/src/exporter.js";
import { createSerializerRegistry, listSupportedSerializerFormats } from "../packages/core/src/serializer-registry.js";

function makeTarget(adapter,outputFormat="json"){
  return {resolve(){return {targetId:"demo",manifest:{outputFormat},adapter};}};
}
function makeResult(status="SUCCESS"){
  return {status,policy:{name:"demo"},resultMetadata:{status,timestamp:"t0"}};
}

test("FAILED processing is BLOCKED before target/serializer calls",()=>{
  let targetCalls=0,adapterCalls=0,serializerCalls=0;
  const targets={resolve(){targetCalls++;return {targetId:"demo",manifest:{outputFormat:"json"},adapter:{compile(){adapterCalls++;}}};}};
  const serializers={resolve(){serializerCalls++;return ()=>"x";}};
  const r=createConfigurationExporter({targets,serializers}).export(makeResult("FAILED"),"demo");
  assert.equal(r.status,"BLOCKED");
  assert.equal(targetCalls,0); assert.equal(adapterCalls,0); assert.equal(serializerCalls,0);
});

test("PARTIAL exports and preserves resultMetadata identity",()=>{
  const metadata={status:"PARTIAL",timestamp:"t0"};
  const adapter={compile(){return {targetId:"demo",outputFormat:"json",representation:{ok:true}};}};
  const r=createConfigurationExporter({targets:makeTarget(adapter),serializers:createSerializerRegistry([{format:"json",serialize:v=>JSON.stringify(v)}])}).export({status:"PARTIAL",policy:{},resultMetadata:metadata},"demo");
  assert.equal(r.status,"EXPORTED"); assert.strictEqual(r.resultMetadata,metadata);
});

test("SUCCESS resolves and compiles registered target",()=>{
  let called=false;
  const adapter={compile(){called=true;return {targetId:"demo",outputFormat:"json",representation:{ok:true}};}};
  const r=createConfigurationExporter({targets:makeTarget(adapter),serializers:createSerializerRegistry([{format:"json",serialize:v=>JSON.stringify(v)}])}).export(makeResult(),"demo");
  assert.equal(r.status,"EXPORTED"); assert.equal(called,true);
});

test("missing target is blocked",()=>{
  const r=createConfigurationExporter({targets:{resolve:()=>null}}).export(makeResult(),"missing");
  assert.equal(r.status,"BLOCKED"); assert.equal(r.diagnostics[0].code,"TARGET_NOT_REGISTERED");
});

test("adapter targetId mismatch is blocked",()=>{
  const adapter={compile:()=>({targetId:"other",outputFormat:"json",representation:{}})};
  const r=createConfigurationExporter({targets:makeTarget(adapter),serializers:createSerializerRegistry([{format:"json",serialize:v=>v}])}).export(makeResult(),"demo");
  assert.equal(r.diagnostics[0].code,"TARGET_ID_MISMATCH");
});

test("registered adapter is actually used",()=>{
  let used=false;
  const adapter={compile:()=>{used=true;return {targetId:"demo",outputFormat:"json",representation:{}};}};
  createConfigurationExporter({targets:makeTarget(adapter),serializers:createSerializerRegistry([{format:"json",serialize:v=>v}])}).export(makeResult(),"demo");
  assert.equal(used,true);
});

test("target output format mismatch is blocked",()=>{
  const adapter={compile:()=>({targetId:"demo",outputFormat:"text",representation:"x"})};
  const r=createConfigurationExporter({targets:makeTarget(adapter,"json"),serializers:createSerializerRegistry([{format:"text",serialize:v=>v}])}).export(makeResult(),"demo");
  assert.equal(r.diagnostics[0].code,"TARGET_OUTPUT_FORMAT_MISMATCH");
});

test("missing serializer is blocked",()=>{
  const adapter={compile:()=>({targetId:"demo",outputFormat:"json",representation:{}})};
  const r=createConfigurationExporter({targets:makeTarget(adapter),serializers:createSerializerRegistry()}).export(makeResult(),"demo");
  assert.equal(r.diagnostics[0].code,"SERIALIZER_NOT_REGISTERED");
});

test("serializer is selected only for matching format",()=>{
  let selected=null;
  const serializers=createSerializerRegistry([{format:"json",serialize:v=>{selected="json";return v;}}]);
  const adapter={compile:()=>({targetId:"demo",outputFormat:"json",representation:{}})};
  createConfigurationExporter({targets:makeTarget(adapter),serializers}).export(makeResult(),"demo");
  assert.equal(selected,"json");
});

test("serializer throw is blocked",()=>{
  const serializers=createSerializerRegistry([{format:"json",serialize:()=>{throw new Error("boom");}}]);
  const adapter={compile:()=>({targetId:"demo",outputFormat:"json",representation:{}})};
  const r=createConfigurationExporter({targets:makeTarget(adapter),serializers}).export(makeResult(),"demo");
  assert.equal(r.diagnostics[0].code,"SERIALIZE_FAILED");
});

test("adapter throw is blocked",()=>{
  const adapter={compile:()=>{throw new Error("boom");}};
  const r=createConfigurationExporter({targets:makeTarget(adapter),serializers:createSerializerRegistry([{format:"json",serialize:v=>v}])}).export(makeResult(),"demo");
  assert.equal(r.diagnostics[0].code,"COMPILE_FAILED");
});

test("malformed compile result is blocked",()=>{
  const adapter={compile:()=>({targetId:"demo",outputFormat:"json"})};
  const r=createConfigurationExporter({targets:makeTarget(adapter),serializers:createSerializerRegistry([{format:"json",serialize:v=>v}])}).export(makeResult(),"demo");
  assert.equal(r.diagnostics[0].code,"INVALID_COMPILE_RESULT");
});

test("own representation undefined passes structural validation",()=>{
  let serialized=false;
  const serializers=createSerializerRegistry([{format:"json",serialize:v=>{serialized=true;assert.equal(v,undefined);return "serialized";}}]);
  const adapter={compile:()=>({targetId:"demo",outputFormat:"json",representation:undefined})};
  const r=createConfigurationExporter({targets:makeTarget(adapter),serializers}).export(makeResult(),"demo");
  assert.equal(r.status,"EXPORTED"); assert.equal(serialized,true);
});

test("missing representation is rejected",()=>{
  const adapter={compile:()=>({targetId:"demo",outputFormat:"json"})};
  const r=createConfigurationExporter({targets:makeTarget(adapter),serializers:createSerializerRegistry([{format:"json",serialize:v=>v}])}).export(makeResult(),"demo");
  assert.equal(r.diagnostics[0].code,"INVALID_COMPILE_RESULT");
});

test("serializer registry enforces allowed formats and duplicates",()=>{
  const registry=createSerializerRegistry();
  assert.deepEqual(listSupportedSerializerFormats(),["plist","json","yaml","ini","text"]);
  assert.throws(()=>registry.register("xml",()=>""),/Unsupported output format/);
  registry.register("json",()=> "");
  assert.throws(()=>registry.register("json",()=>""),/already registered/);
});

test("processing diagnostics are not copied or mutated",()=>{
  const processingDiagnostics=[{code:"CAPABILITY_UNKNOWN"}];
  const processing={status:"SUCCESS",policy:{},diagnostics:processingDiagnostics,resultMetadata:{status:"SUCCESS"}};
  const r=createConfigurationExporter({targets:makeTarget({compile:()=>({targetId:"demo",outputFormat:"json",representation:{}})}),serializers:createSerializerRegistry([{format:"json",serialize:v=>v}])}).export(processing,"demo");
  assert.deepEqual(processing.diagnostics,processingDiagnostics);
  assert.deepEqual(r.diagnostics,[]);
});
