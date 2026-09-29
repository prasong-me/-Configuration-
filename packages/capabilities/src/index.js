export const CapabilityState = Object.freeze({
  SUPPORTED:"SUPPORTED", LIMITED:"LIMITED", TRANSFORMABLE:"TRANSFORMABLE", LOSSY:"LOSSY", UNSUPPORTED:"UNSUPPORTED", UNKNOWN:"UNKNOWN"
});
export function evaluateCapability(capability,requested=true){if(!requested)return {requested:false,state:"NOT_REQUESTED"};const state=Object.values(CapabilityState).includes(capability)?capability:CapabilityState.UNKNOWN;return {requested:true,state};}
