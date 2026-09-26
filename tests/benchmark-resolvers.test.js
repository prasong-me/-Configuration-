import test from "node:test";
import assert from "node:assert/strict";
import { percentile, summarize } from "../scripts/benchmark-resolvers.mjs";

test("resolver benchmark percentile calculation is deterministic",()=>{
  const values=[10,20,30,40,50];
  assert.equal(percentile(values,50),30);
  assert.equal(percentile(values,95),48);
  assert.equal(percentile(values,99),49.6);
});

test("resolver benchmark summary reports median P95 and P99",()=>{
  const report=summarize([10,20,30,40,50]);
  assert.equal(report.samples,5);
  assert.equal(report.median,30);
  assert.equal(report.p95,48);
  assert.equal(report.p99,49.6);
});
