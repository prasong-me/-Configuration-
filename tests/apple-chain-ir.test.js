import test from "node:test";
import assert from "node:assert/strict";
import {
  AppleClassification,
  AppleTopology,
  analyzeAppleChainTopology,
  classifyAppleDnsChain,
  createAppleChainIR,
  isAppleChainAdmissionAllowed,
} from "../packages/apple-adapter/src/apple-chain-ir.js";

test("Apple Chain IR represents a single native resolver configuration", () => {
  const result = classifyAppleDnsChain({
    dnsPipeline: [{id:"resolver-a", order:1, protocol:"DOH", endpoint:"https://dns.example/query"}],
  });
  assert.equal(result.classification, AppleClassification.REPRESENTABLE);
  assert.equal(result.topology.topology, AppleTopology.SINGLE);
  assert.equal(isAppleChainAdmissionAllowed(createAppleChainIR({dnsPipeline:[{id:"resolver-a"}]})), true);
});

test("Apple Chain IR never treats multiple resolver stages as ordered ServerAddresses", () => {
  const result = classifyAppleDnsChain({
    dnsPipeline: [
      {id:"a", order:1, dependsOn:[]},
      {id:"b", order:2, dependsOn:["a"]},
      {id:"c", order:3, dependsOn:["b"]},
    ],
  });
  assert.equal(result.topology.topology, AppleTopology.LINEAR);
  assert.equal(result.classification, AppleClassification.UNKNOWN);
  assert.equal(result.preservation.preserved, false);
  assert.equal(result.preservation.dimensions.ordering, false);
  assert.equal(result.diagnostics[0].code, "APPLE_DNS_CHAIN_SEMANTICS_NOT_ESTABLISHED");
  assert.equal(isAppleChainAdmissionAllowed(createAppleChainIR({
    dnsPipeline:[
      {id:"a",order:1},
      {id:"b",order:2,dependsOn:["a"]},
    ],
  })), false);
});

test("Apple Chain IR keeps target engine separate from composition strategy", () => {
  const ir = createAppleChainIR(
    {dnsPipeline:[{id:"a"}]},
    {engine:"APPLE_NATIVE_DNS", composition:"DIRECT"},
  );
  assert.equal(ir.target.engine, "APPLE_NATIVE_DNS");
  assert.equal(ir.target.composition, "DIRECT");
  assert.equal(ir.classification, AppleClassification.REPRESENTABLE);
});

test("Apple Chain topology recognizes conditional pipelines", () => {
  const topology = analyzeAppleChainTopology({
    dnsPipeline:[
      {id:"a",order:1,onMatch:"FORWARD"},
      {id:"b",order:2},
    ],
  });
  assert.equal(topology.topology, AppleTopology.CONDITIONAL);
});
