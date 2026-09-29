import { DiagnosticLevel, diagnostic } from "../../diagnostics/src/index.js";
import { defaultSerializerRegistry } from "./serializer-registry.js";
import { getTargetManifest } from "../../targets/src/index.js";
import { getTargetAdapter } from "../../targets/src/adapters.js";

const targetRegistry={
  resolve(targetId){
    const manifest=getTargetManifest(targetId);
    if(!manifest) return null;
    return {targetId,manifest,adapter:getTargetAdapter(targetId)};
  }
};

function fail(code,message,details){
  return diagnostic(DiagnosticLevel.CRITICAL,code,message,details);
}

function validateCompileResult(result,targetId,expectedFormat){
  if(!result||typeof result!=="object"){
    return fail("INVALID_COMPILE_RESULT","Target adapter returned a non-object compile result.",{target:targetId});
  }
  if(result.targetId!==targetId){
    return fail("TARGET_ID_MISMATCH","Target adapter compile result targetId does not match requested target.",{target:targetId,actual:result.targetId});
  }
  if(result.outputFormat!==expectedFormat){
    return fail("TARGET_OUTPUT_FORMAT_MISMATCH","Target adapter compile result output format does not match target output format.",{target:targetId,expected:expectedFormat,actual:result.outputFormat});
  }
  if(!Object.hasOwn(result,"representation")){
    return fail("INVALID_COMPILE_RESULT","Target adapter compile result is missing its representation property.",{target:targetId});
  }
  return null;
}

export function createConfigurationExporter({targets=targetRegistry,serializers=defaultSerializerRegistry}={}){
  return {
    export(processingResult,targetId){
      const exportDiagnostics=[];
      if(!processingResult||processingResult.status==="FAILED"){
        exportDiagnostics.push(fail("EXPORT_BLOCKED","Processing failed; export is blocked.",{target:targetId}));
        return {status:"BLOCKED",artifact:null,diagnostics:exportDiagnostics};
      }
      const target=targets.resolve(targetId);
      if(!target||typeof target.adapter?.compile!=="function"){
        exportDiagnostics.push(fail("TARGET_NOT_REGISTERED","Target is not registered with a usable adapter.",{target:targetId}));
        return {status:"BLOCKED",artifact:null,diagnostics:exportDiagnostics};
      }
      let compiled;
      try{ compiled=target.adapter.compile(processingResult.policy); }
      catch(error){
        exportDiagnostics.push(fail("COMPILE_FAILED",error?.message||"Target adapter compilation failed.",{target:targetId}));
        return {status:"BLOCKED",artifact:null,diagnostics:exportDiagnostics};
      }
      const expectedFormat=target.manifest?.outputFormat;
      const structuralError=validateCompileResult(compiled,targetId,expectedFormat);
      if(structuralError){
        exportDiagnostics.push(structuralError);
        return {status:"BLOCKED",artifact:null,diagnostics:exportDiagnostics};
      }
      const serializer=serializers.resolve(compiled.outputFormat);
      if(!serializer){
        exportDiagnostics.push(fail("SERIALIZER_NOT_REGISTERED","No serializer is registered for the compile output format.",{format:compiled.outputFormat,target:targetId}));
        return {status:"BLOCKED",artifact:null,diagnostics:exportDiagnostics};
      }
      let artifact;
      try{ artifact=serializer(compiled.representation); }
      catch(error){
        exportDiagnostics.push(fail("SERIALIZE_FAILED",error?.message||"Serialization failed.",{format:compiled.outputFormat,target:targetId}));
        return {status:"BLOCKED",artifact:null,diagnostics:exportDiagnostics};
      }
      return {
        status:"EXPORTED",
        artifact,
        outputFormat:compiled.outputFormat,
        targetId,
        resultMetadata:processingResult.resultMetadata,
        diagnostics:exportDiagnostics
      };
    }
  };
}

export const configurationExporter=createConfigurationExporter();
