import test from "node:test";
import assert from "node:assert/strict";
import { buildSearchIndex, searchRecords, SearchContract } from "../packages/core/src/search.js";

const records=[
  {id:"cloudflare",name:"Privacy DNS",provider:"Cloudflare",protocol:"DoH",role:"resolver",servers:["1.1.1.1","1.0.0.1"]},
  {id:"quad9-secure",name:"Security DNS",provider:"Quad9",protocol:"DoH",role:"threat",servers:["9.9.9.9","149.112.112.112"]},
  {id:"google-public",name:"Backup DNS",provider:"Google Public DNS",protocol:"DoH",role:"resolver",servers:["8.8.8.8","8.8.4.4"]}
];

test("search contract is explicit",()=>{
  assert.equal(SearchContract.version,"1.0");
  assert.equal(SearchContract.semantics,"AND");
  assert.equal(SearchContract.unsupportedInference,"none");
});

test("search uses AND semantics",()=>assert.deepEqual(searchRecords(records,"DNS Quad9").map(x=>x.item.id),["quad9-secure"]));
test("search matches provider and server values",()=>{
  assert.equal(searchRecords(records,"1.1.1.1")[0].item.id,"cloudflare");
  assert.equal(searchRecords(records,"Google Public")[0].item.id,"google-public");
});
test("exact identity receives deterministic priority",()=>assert.equal(searchRecords(records,"cloudflare")[0].score,100));
test("empty query preserves source order",()=>assert.deepEqual(searchRecords(records,"").map(x=>x.item.id),records.map(x=>x.id)));
test("limit applies after ranking",()=>assert.equal(searchRecords(records,"DNS",{limit:2}).length,2));
test("unrelated query does not infer a match",()=>assert.deepEqual(searchRecords(records,"unsupported-capability"),[]));
test("index preserves stable source positions",()=>{
  const index=buildSearchIndex(records);
  assert.deepEqual(index.map(x=>x.id),records.map(x=>x.id));
  assert.deepEqual(index.map(x=>x.index),[0,1,2]);
});
