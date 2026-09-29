import { getTargetAdapter } from "./adapters.js";
import { getSerializer, serializeRepresentation } from "./serializer-registry.js";

const allowedFormats=new Set(["plist","json","yaml","ini","text"]);

export function exportConfiguration(processingResult,{targetId}={}){
  const status=processingResult?.resultMetadata?.status ?? processingResult?.status;
  const diagnostics=Array.isArray(processingResult?.resultMetadata?.diagnostics)?processingResult.resultMetadata.diagnostics:[];
  if(status==="FAILED") return {ok:false,blocked:true,diagnostics:[{code:"PROCESSING_FAILED",message:"Processing failed; export was blocked."}],artifact:null};
  const adapter=getTargetAdapter(targetId);
  if(!adapter) return {ok:false,blocked:true,diagnostics:[{code:"TARGET_NOT_REGISTERED",message:`Target not registered: ${targetId}`}],artifact:null};
  let compiled;
  try{compiled=adapter.compile(processingResult?.policy??processingResult);}catch(error){
    return {ok:false,blocked:true,diagnostics:[{code:"COMPILE_FAILED",message:error instanceof Error?error.message:String(error)}],artifact:null};
  }
  if(!compiled||typeof compiled!=="object"||!Object.hasOwn(compiled,"representation")||typeof compiled.targetId!=="string"||typeof compiled.outputFormat!=="string"){
    return {ok:false,blocked:true,diagnostics:[{code:"INVALID_COMPILE_RESULT",message:"Target adapter returned an invalid CompileResult."}],artifact:null};
  }
  if(compiled.targetId!==targetId)return {ok:false,blocked:true,diagnostics:[{code:"TARGET_ID_MISMATCH",message:"Target adapter result does not match requested target."}],artifact:null};
  if(!allowedFormats.has(compiled.outputFormat))return {ok:false,blocked:true,diagnostics:[{code:"TARGET_OUTPUT_FORMAT_MISMATCH",message:`Unsupported output format: ${compiled.outputFormat}`}],artifact:null};
  if(!getSerializer(compiled.outputFormat))return {ok:false,blocked:true,diagnostics:[{code:"SERIALIZER_NOT_REGISTERED",message:`Serializer not registered: ${compiled.outputFormat}`}],artifact:null};
  let artifact;
  try{artifact=serializeRepresentation(compiled.outputFormat,compiled.representation);}catch(error){
    return {ok:false,blocked:true,diagnostics:[{code:"SERIALIZE_FAILED",message:error instanceof Error?error.message:String(error)}],artifact:null};
  }
  return {ok:true,blocked:false,targetId,outputFormat:compiled.outputFormat,artifact,resultMetadata:processingResult?.resultMetadata??null,diagnostics};
}
