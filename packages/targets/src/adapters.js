import { compileAppleMobileConfig, compileAppleDeclarativeDns, compileAppleDnsProxyProviderRuntime } from "../../apple-adapter/src/index.js";

const adapters = new Map([
  ["apple-mobileconfig", Object.freeze({
    targetId: "apple-mobileconfig",
    outputFormat: "plist",
    compile: (policy) => {
      const result=compileAppleMobileConfig(policy);
      return {...result,targetId:"apple-mobileconfig",outputFormat:"plist",representation:result.content};
    },
  })],
  ["apple-dns-declaration", Object.freeze({
    targetId: "apple-dns-declaration",
    outputFormat: "json",
    compile: (policy) => {
      const result=compileAppleDeclarativeDns(policy);
      return {targetId:"apple-dns-declaration",outputFormat:"json",representation:result,...result};
    },
  })],
  ["apple-dns-proxy-provider-runtime", Object.freeze({
    targetId: "apple-dns-proxy-provider-runtime",
    outputFormat: "text",
    compile: compileAppleDnsProxyProviderRuntime,
  })],
]);

export function getTargetAdapter(targetId) {
  return adapters.get(targetId) ?? null;
}

export function listTargetAdapters() {
  return [...adapters.values()].map(adapter => ({ targetId: adapter.targetId }));
}
