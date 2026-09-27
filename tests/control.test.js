import test from "node:test";
import assert from "node:assert/strict";
import {
  ControlState,
  createControlRequest,
  analyzeControlRequest,
} from "../packages/control/src/index.js";

test("ambiguous DNS request stops at clarification", () => {
  const result = analyzeControlRequest(
    createControlRequest("ทำ DNS แบบนี้ให้หน่อย")
  );

  assert.equal(result.state, ControlState.NEEDS_CLARIFICATION);
  assert.ok(result.analysis.missing.includes("target"));
  assert.ok(result.analysis.missing.includes("operation"));
});

test("explicit Apple mobileconfig export resolves", () => {
  const result = analyzeControlRequest(
    createControlRequest({
      target: "apple",
      format: "mobileconfig",
      operation: "export",
    })
  );

  assert.equal(result.state, ControlState.RESOLVED);
  assert.equal(result.analysis.target, "apple");
  assert.equal(result.analysis.format, "mobileconfig");
  assert.equal(result.analysis.operation, "export");
  assert.deepEqual(result.analysis.missing, []);
});

test("analysis stage does not create an execution plan", () => {
  const result = analyzeControlRequest(
    createControlRequest({
      target: "apple",
      format: "mobileconfig",
      operation: "export",
    })
  );

  assert.equal("executionPlan" in result, false);
  assert.equal("route" in result, false);
});
