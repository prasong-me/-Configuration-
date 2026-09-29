import { ProviderFlowState, ProviderFlowTransport, validateProviderFlowIoContract } from "./provider-flow-io-contract.js";
function fail(code,message){const error=new Error(message);error.code=code;throw error;}
export function createProviderFlowIoEngine({contract,handlers={}}={}) {
  const validation=validateProviderFlowIoContract(contract);
  if(!validation.valid) return Object.freeze({valid:false,errors:validation.errors,accept(){return {accepted:false,state:ProviderFlowState.FAILED,errors:validation.errors};}});
  const active=new Map();
  const get=id=>{const flow=active.get(id);if(!flow) fail("PROVIDER_FLOW_NOT_FOUND","Provider flow is not retained.");return flow;};
  function accept({id,transport}={}) {
    if(typeof id!=="string"||!id.trim()) fail("PROVIDER_FLOW_ID_REQUIRED","Provider flow id is required.");
    if(!Object.values(ProviderFlowTransport).includes(transport)||!contract.transports.includes(transport)) return {accepted:false,ownership:"REJECTED",state:ProviderFlowState.FAILED,reason:"UNSUPPORTED_TRANSPORT"};
    if(active.has(id)) fail("PROVIDER_FLOW_DUPLICATE","Provider flow id is already retained.");
    active.set(id,{id,transport,state:ProviderFlowState.RECEIVED,trace:["RECEIVED"]});
    return {accepted:true,ownership:"RETAINED",state:ProviderFlowState.RECEIVED};
  }
  async function open(id,endpoint){const flow=get(id);if(flow.state!=="RECEIVED") fail("PROVIDER_FLOW_OPEN_INVALID_STATE","Flow can only be opened from RECEIVED.");flow.state="OPENING";flow.trace.push("OPENING");try{if(typeof handlers.open==="function")await handlers.open(flow,endpoint);flow.state="OPEN";flow.trace.push("OPEN");return {state:"OPEN"};}catch(error){flow.state="FAILED";flow.trace.push("FAILED");active.delete(id);return {state:"FAILED",error};}}
  async function read(id,input){const flow=get(id);if(flow.state!=="OPEN") fail("PROVIDER_FLOW_READ_BEFORE_OPEN","Flow must be OPEN before reading.");if(typeof handlers.read!=="function") fail("PROVIDER_FLOW_READ_HANDLER_REQUIRED","Flow read handler is required.");return handlers.read(flow,input);}
  async function write(id,output){const flow=get(id);if(flow.state!=="OPEN") fail("PROVIDER_FLOW_WRITE_BEFORE_OPEN","Flow must be OPEN before writing.");if(typeof handlers.write!=="function") fail("PROVIDER_FLOW_WRITE_HANDLER_REQUIRED","Flow write handler is required.");return handlers.write(flow,output);}
  function close(id){const flow=get(id);if(flow.state==="CLOSED"||flow.state==="FAILED")return {state:flow.state};flow.state="CLOSING";flow.trace.push("CLOSING");if(typeof handlers.close==="function")handlers.close(flow);flow.state="CLOSED";flow.trace.push("CLOSED");active.delete(id);return {state:"CLOSED",trace:[...flow.trace]};}
  return Object.freeze({valid:true,errors:Object.freeze([]),accept,open,read,write,close,get activeCount(){return active.size;}});
}
