import test from "node:test";
import assert from "node:assert/strict";
import { configurationExporter } from "../packages/core/src/index.js";
import { exportFormats } from "../packages/targets/src/exporters.js";

test("every registered target has a repository-side artifact path",()=>{
  const results=[];
  for(const manifest of exportFormats.map(format=>format.id).map(id=>({id}))) {
    const result=configurationExporter.export({status:"SUCCESS",policy:{version:"0.6",policy:{name:"artifact-matrix"}}},manifest.id);
    assert.equal(result.status,"EXPORTED",manifest.id+" must export a minimal policy");
    assert.ok(result.outputFormat,manifest.id+" must declare output format");
    assert.notEqual(result.artifact,null,manifest.id+" must produce an artifact");
    results.push(manifest.id);
  }
  assert.ok(results.length>=10);
});
