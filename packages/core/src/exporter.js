import { DiagnosticLevel, diagnostic } from "../../diagnostics/src/index.js";
import { defaultSerializerRegistry } from "./serializer-registry.js";
import { getTargetManifest } from "../../targets/src/index.js";
import { getTargetAdapter } from "../../targets/src/adapters.js";
import { compileSurge } from "../../surge-adapter/src/index.js";
import { getExportArtifact } from "../../targets/src/exporters.js";
import { inspectCompileResult, compileToTargetIR, admitTargetCapabilities } from "./compiler.js";

const OUTPUT_FORMATS=Object.freeze({"apple-mobileconfig":"plist","apple-dns-declaration":"json","apple-mobileconfig-legacy":"plist",surge:"text",mihomo:"yaml",wireguard:"text",shadowrocket:"text",loon:"text","quantumult-x":"text",stash:"yaml"});
function fail(code,message,details){ return diagnostic(DiagnosticLevel.CRITICAL,code,message,details); }
function defaultTargetResolver(targetId){
  const manifest=getTargetManifest(targetId);
  if(!manifest) return null;
  const registered=getTargetAdapter(targetId);
  if(registered) return {targetId,manifest,adapter:registered};
  if(targetId==="surge") return {targetId,manifest,adapter:{targetId,outputFormat:"text",compile(policy){ const legacy=compileSurge({policy}); return {targetId,outputFormat:"text",representation:legacy.content}; }}};
  const outputFormat=OUTPUT_FORMATS[targetId];
  if(outputFormat) return {targetId,manifest:{...manifest,outputFormat},adapter:{targetId,outputFormat,compile(policy){ const representation=getExportArtifact(targetId,{policy}); return {targetId,outputFormat,representation}; }}};
  return {targetId,manifest,adapter:null};
}
export function createConfigurationExporter({targets={resolve:defaultTargetResolver},serializers=defaultSerializerRegistry}={}){
  return { export(processingResult,targetId){
    const exportDiagnostics=[];
    if(!processingResult||processingResult.status==="FAILED"){ exportDiagnostics.push(fail("EXPORT_BLOCKED","Processing failed; export is blocked.",{target:targetId})); return {status:"BLOCKED",artifact:null,diagnostics:exportDiagnostics}; }
    const target=targets.resolve(targetId);
    if(!target||typeof target.adapter?.compile!=="function"){ exportDiagnostics.push(fail("TARGET_NOT_REGISTERED","Target is not registered with a usable adapter.",{target:targetId})); return {status:"BLOCKED",artifact:null,diagnostics:exportDiagnostics}; }
    let admission;
    try { admission=admitTargetCapabilities(processingResult.policy,target.manifest); }
    catch(error){ exportDiagnostics.push(fail("CAPABILITY_ADMISSION_FAILED",error?.message||"Capability admission failed.",{target:targetId})); return {status:"BLOCKED",artifact:null,diagnostics:exportDiagnostics}; }
    if(admission.decision==="BLOCK"){
      exportDiagnostics.push(...admission.diagnostics.map(item=>fail(item.code,item.message,item.details)));
      return {status:"BLOCKED",artifact:null,diagnostics:exportDiagnostics,admission};
    }
    exportDiagnostics.push(...admission.diagnostics.filter(item=>item.level==="WARNING").map(item=>diagnostic(DiagnosticLevel.WARNING,item.code,item.message,item.details)));
    let semantic;
    try { semantic=compileToTargetIR(processingResult.policy,targetId); }
    catch(error){ exportDiagnostics.push(fail("SEMANTIC_COMPILE_FAILED",error?.message||"Semantic compilation failed.",{target:targetId})); return {status:"BLOCKED",artifact:null,diagnostics:exportDiagnostics,admission}; }
    let compiled;
    try { compiled=target.adapter.compile(processingResult.policy,semantic); }
    catch(error){ exportDiagnostics.push(fail("COMPILE_FAILED",error?.message||"Target adapter compilation failed.",{target:targetId})); return {status:"BLOCKED",artifact:null,diagnostics:exportDiagnostics,admission,semantic}; }
    const expectedFormat=target.adapter.outputFormat??target.manifest?.outputFormat;
    if(!expectedFormat){ exportDiagnostics.push(fail("TARGET_OUTPUT_FORMAT_MISMATCH","Target adapter has no declared output format.",{target:targetId})); return {status:"BLOCKED",artifact:null,diagnostics:exportDiagnostics,admission,semantic}; }
    const structuralError=inspectCompileResult(compiled,targetId,expectedFormat);
    if(structuralError){ exportDiagnostics.push(structuralError); return {status:"BLOCKED",artifact:null,diagnostics:exportDiagnostics,admission,semantic}; }
    let serializer;
    try { serializer=serializers.resolve(compiled.outputFormat); }
    catch(error){ exportDiagnostics.push(fail("SERIALIZER_NOT_REGISTERED",error?.message||"Unsupported output format.",{format:compiled.outputFormat,target:targetId})); return {status:"BLOCKED",artifact:null,diagnostics:exportDiagnostics,admission,semantic}; }
    if(!serializer){ exportDiagnostics.push(fail("SERIALIZER_NOT_REGISTERED","No serializer is registered for the compile output format.",{format:compiled.outputFormat,target:targetId})); return {status:"BLOCKED",artifact:null,diagnostics:exportDiagnostics,admission,semantic}; }
    let artifact;
    try { artifact=serializer(compiled.representation); }
    catch(error){ exportDiagnostics.push(fail("SERIALIZE_FAILED",error?.message||"Serialization failed.",{format:compiled.outputFormat,target:targetId})); return {status:"BLOCKED",artifact:null,diagnostics:exportDiagnostics,admission,semantic}; }
    return {status:"EXPORTED",artifact,outputFormat:compiled.outputFormat,targetId,resultMetadata:processingResult.resultMetadata,admission,semantic,diagnostics:exportDiagnostics};
  }};
}
export const configurationExporter=createConfigurationExporter();