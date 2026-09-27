import { compileAppleMobileConfig, compileAppleDeclarativeDns } from "../../apple-adapter/src/index.js";

const adapters = new Map([
  ["apple-mobileconfig", Object.freeze({
    targetId: "apple-mobileconfig",
    compile: compileAppleMobileConfig,
  })],
  ["apple-dns-declaration", Object.freeze({
    targetId: "apple-dns-declaration",
    compile: compileAppleDeclarativeDns,
  })],
]);

export function getTargetAdapter(targetId) {
  return adapters.get(targetId) ?? null;
}

export function listTargetAdapters() {
  return [...adapters.values()].map(adapter => ({ targetId: adapter.targetId }));
}
