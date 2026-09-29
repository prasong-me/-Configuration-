import { compileAppleMobileConfig, compileAppleDeclarativeDns } from "../../apple-adapter/src/index.js";
import { compileSurge } from "../../surge-adapter/src/index.js";
import { compileTargetExport } from "./exporters.js";

const adapters = new Map([
  ["apple-mobileconfig",{targetId:"apple-mobileconfig",compile:compileAppleMobileConfig}],
  ["apple-dns-declaration",{targetId:"apple-dns-declaration",compile:compileAppleDeclarativeDns}],
  ["surge",{targetId:"surge",compile:input=>({targetId:"surge",outputFormat:"ini",representation:compileSurge(input).content})}],
  ["mihomo",{targetId:"mihomo",compile:input=>compileTargetExport("mihomo",input)}],
  ["wireguard",{targetId:"wireguard",compile:input=>compileTargetExport("wireguard",input)}],
  ["shadowrocket",{targetId:"shadowrocket",compile:input=>compileTargetExport("shadowrocket",input)}],
  ["loon",{targetId:"loon",compile:input=>compileTargetExport("loon",input)}],
  ["stash",{targetId:"stash",compile:input=>compileTargetExport("stash",input)}],
  ["quantumult-x",{targetId:"quantumult-x",compile:input=>compileTargetExport("quantumult-x",input)}]
]);

export function getTargetAdapter(targetId){return adapters.get(targetId)??null;}
export function listTargetAdapters(){return [...adapters.values()].map(adapter=>({targetId:adapter.targetId}));}
