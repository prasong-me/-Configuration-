import { compileAppleMobileConfig, compileAppleDeclarativeDns } from "../../apple-adapter/src/index.js";
import { getExportArtifact } from "./exporters.js";

const OUTPUT_FORMATS=Object.freeze({
  "apple-mobileconfig":"plist",
  "apple-dns-declaration":"json",
  "apple-mobileconfig-legacy":"plist",
  surge:"text",
  mihomo:"yaml",
  wireguard:"text",
  shadowrocket:"text",
  loon:"text",
  "quantumult-x":"text",
  stash:"yaml"
});

function artifactAdapter(targetId,outputFormat){
  return Object.freeze({
    targetId,
    outputFormat,
    compile(policy){
      const representation=getExportArtifact(targetId,{policy});
      return {targetId,outputFormat,representation};
    }
  });
}

const adapters = new Map([
  ["apple-mobileconfig", Object.freeze({
    targetId:"apple-mobileconfig",
    outputFormat:"plist",
    compile(policy){
      const result=compileAppleMobileConfig({policy});
      return {
        targetId:"apple-mobileconfig",
        outputFormat:"plist",
        representation:result.content,
        resultMetadata:{warnings:result.warnings,payloadCount:result.payloadCount,signed:result.signed}
      };
    }
  })],
  ["apple-dns-declaration", Object.freeze({
    targetId:"apple-dns-declaration",
    outputFormat:"json",
    compile(policy){
      const representation=JSON.stringify(compileAppleDeclarativeDns({policy}),null,2);
      return {targetId:"apple-dns-declaration",outputFormat:"json",representation};
    }
  })],
  ...Object.entries(OUTPUT_FORMATS)
    .filter(([targetId])=>targetId!=="apple-mobileconfig"&&targetId!=="apple-dns-declaration")
    .map(([targetId,outputFormat])=>[targetId,artifactAdapter(targetId,outputFormat)])
]);

export function getTargetAdapter(targetId) {
  return adapters.get(targetId) ?? null;
}

export function listTargetAdapters() {
  return [...adapters.values()].map(adapter => ({
    targetId: adapter.targetId,
    outputFormat: adapter.outputFormat
  }));
}
