import { compileAppleMobileConfig, compileAppleDeclarativeDns, compileAppleDnsProxyProviderRuntime } from "../../apple-adapter/src/index.js";

const adapters = new Map([
  ["apple-mobileconfig", Object.freeze({
    targetId: "apple-mobileconfig",
    compile: compileAppleMobileConfig,
  })],
  ["apple-dns-declaration", Object.freeze({
    targetId: "apple-dns-declaration",
    compile: compileAppleDeclarativeDns,
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
