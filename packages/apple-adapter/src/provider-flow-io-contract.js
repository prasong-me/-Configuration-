export const ProviderFlowTransport = Object.freeze({ UDP: "UDP", TCP: "TCP" });
export const ProviderFlowState = Object.freeze({ RECEIVED:"RECEIVED", OPENING:"OPENING", OPEN:"OPEN", CLOSING:"CLOSING", CLOSED:"CLOSED", FAILED:"FAILED" });
export const ProviderFlowOwnership = Object.freeze({ RETAINED:"RETAINED", REJECTED:"REJECTED" });
export const ProviderFlowIoMode = Object.freeze({ UDP_DATAGRAMS:"UDP_DATAGRAMS", TCP_STREAM:"TCP_STREAM" });
const POSITIVE = value => Number.isInteger(value) && value > 0;
const NON_EMPTY = value => typeof value === "string" && value.trim().length > 0;
export function createProviderFlowIoContract(input = {}) {
  const source = input?.flowIo ?? input;
  const transports = Array.isArray(source.transports) ? [...new Set(source.transports.filter(value => Object.values(ProviderFlowTransport).includes(value)))] : ["UDP","TCP"];
  return Object.freeze({
    version:"1.0", targetEngine:"APPLE_DNS_PROXY_PROVIDER", input:"OS_INTERCEPTED_DNS_FLOW",
    transports:Object.freeze(transports),
    modes:Object.freeze({UDP:"UDP_DATAGRAMS",TCP:"TCP_STREAM"}),
    lifecycle:Object.freeze({initial:"RECEIVED",open:"OPENING",active:"OPEN",closing:"CLOSING",terminal:Object.freeze(["CLOSED","FAILED"])}),
    ownership:Object.freeze({returnTrueRequiresRetention:true,returnFalseMeansRejected:true}),
    operations:Object.freeze({open:"OPEN_FLOW",read:"READ_FLOW_DATA",write:"WRITE_FLOW_DATA",closeRead:"CLOSE_READ",closeWrite:"CLOSE_WRITE"}),
    safety:Object.freeze({deterministic:true,failClosed:true,rejectUnknownTransport:true,rejectReadBeforeOpen:true,rejectWriteBeforeOpen:true,terminalIsIrreversible:true,noDeprecatedUdpApi:true}),
    limits:Object.freeze({maxBufferedBytes:source.limits?.maxBufferedBytes ?? null,maxReadBytes:source.limits?.maxReadBytes ?? null}),
    evidence:Object.freeze({
      systemEntryPoint:"NEDNSProxyProvider.handleNewFlow",
      udpRead:"NEAppProxyUDPFlow.readDatagramsAndFlowEndpointsWithCompletionHandler",
      udpWrite:"NEAppProxyUDPFlow.writeDatagrams:sentByFlowEndpoints:completionHandler",
      tcpRead:"NEAppProxyTCPFlow.readData", tcpWrite:"NEAppProxyTCPFlow.write"
    })
  });
}
export function validateProviderFlowIoContract(contract) {
  const errors=[];
  if(contract?.version!=="1.0") errors.push("PROVIDER_FLOW_IO_VERSION_REQUIRED");
  if(contract?.targetEngine!=="APPLE_DNS_PROXY_PROVIDER") errors.push("PROVIDER_FLOW_IO_TARGET_REQUIRED");
  if(contract?.input!=="OS_INTERCEPTED_DNS_FLOW") errors.push("PROVIDER_FLOW_IO_INPUT_REQUIRED");
  const transports=contract?.transports;
  if(!Array.isArray(transports)||transports.length===0) errors.push("PROVIDER_FLOW_IO_TRANSPORT_REQUIRED");
  else { const supported=new Set(Object.values(ProviderFlowTransport)); for(const t of transports) if(!supported.has(t)) errors.push("PROVIDER_FLOW_IO_TRANSPORT_UNSUPPORTED:"+t); if(new Set(transports).size!==transports.length) errors.push("PROVIDER_FLOW_IO_TRANSPORT_DUPLICATE"); }
  if(contract?.ownership?.returnTrueRequiresRetention!==true) errors.push("PROVIDER_FLOW_IO_RETENTION_INVARIANT_REQUIRED");
  if(contract?.ownership?.returnFalseMeansRejected!==true) errors.push("PROVIDER_FLOW_IO_REJECTION_INVARIANT_REQUIRED");
  for(const key of ["deterministic","failClosed","rejectUnknownTransport","rejectReadBeforeOpen","rejectWriteBeforeOpen","terminalIsIrreversible","noDeprecatedUdpApi"]) if(contract?.safety?.[key]!==true) errors.push("PROVIDER_FLOW_IO_SAFETY_INVARIANT_REQUIRED:"+key);
  for(const key of ["maxBufferedBytes","maxReadBytes"]) { const value=contract?.limits?.[key]; if(value!==null&&!POSITIVE(value)) errors.push("PROVIDER_FLOW_IO_LIMIT_INVALID:"+key); }
  for(const key of ["systemEntryPoint","udpRead","udpWrite","tcpRead","tcpWrite"]) if(!NON_EMPTY(contract?.evidence?.[key])) errors.push("PROVIDER_FLOW_IO_EVIDENCE_REQUIRED:"+key);
  return Object.freeze({valid:errors.length===0,errors:Object.freeze([...new Set(errors)])});
}
export function isProviderFlowIoAdmissionAllowed(contract){ return validateProviderFlowIoContract(contract).valid; }
