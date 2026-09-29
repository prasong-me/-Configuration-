import { compileAppleMobileConfig, compileAppleDeclarativeDns } from "../../apple-adapter/src/index.js";
import { compileSurge } from "../../surge-adapter/src/index.js";
import { compileTargetExport } from "./exporters.js";

const appleMobile=input=>{const r=compileAppleMobileConfig(input);return {targetId:"apple-mobileconfig",outputFormat:"plist",representation:r.content,warnings:r.warnings};};
const appleDns=input=>({targetId:"apple-dns-declaration",outputFormat:"json",representation:compileAppleDeclarativeDns(input)});

const adapters = new Map([
  ["apple-mobileconfig",{targetId:"apple-mobileconfig",compile:appleMobile}],
  ["apple-dns-declaration",{targetId:"apple-dns-declaration",compile:appleDns}],
  ["surge",{targetId:"surge",compile:input=>{const r=compileSurge(input);return {targetId:"surge",outputFormat:"ini",representation:r.content};}}],
  ["mihomo",{targetId:"mihomo",compile:input=>compileTargetExport("mihomo",input)}],
  ["wireguard",{targetId:"wireguard",compile:input=>compileTargetExport("wireguard",input)}],
  ["shadowrocket",{targetId:"shadowrocket",compile:input=>compileTargetExport("shadowrocket",input)}],
  ["loon",{targetId:"loon",compile:input=>compileTargetExport("loon",input)}],
  ["stash",{targetId:"stash",compile:input=>compileTargetExport("stash",input)}],
  ["quantumult-x",{targetId:"quantumult-x",compile:input=>compileTargetExport("quantumult-x",input)}]
]);

export function getTargetAdapter(targetId){return adapters.get(targetId)??null;}
export function listTargetAdapters(){return [...adapters.values()].map(adapter=>({targetId:adapter.targetId}));}
