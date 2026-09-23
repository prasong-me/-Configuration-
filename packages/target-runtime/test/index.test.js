import test from "node:test";
import assert from "node:assert/strict";
import {createConfigurationState,setConfigurationValue,getConfigurationValue,generateTargetConfiguration} from "../src/index.js";
import {getTargetDefinition} from "../../targets/src/script-targets.js";
test("shared state persists nested target values",()=>{let state=createConfigurationState("clash-mi");state=setConfigurationValue(state,"dns.primary","1.1.1.1");state=setConfigurationValue(state,"proxy.server","example.com");assert.equal(getConfigurationValue(state,"dns.primary"),"1.1.1.1");assert.equal(getConfigurationValue(state,"proxy.server"),"example.com");});
test("target script generates target-native output",()=>{let state=createConfigurationState("clash-mi");state=setConfigurationValue(state,"dns.primary","1.1.1.1");const output=generateTargetConfiguration(getTargetDefinition("clash-mi"),state);assert.match(output,/dns:/);assert.match(output,/1\\.1\\.1\\.1/);});
