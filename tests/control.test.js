import test from "node:test";
import assert from "node:assert/strict";
import {
  ControlState,
  createControlRequest,
  analyzeControlRequest,
  applyClarification,
  buildExecutionPlan,
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

test("clarification answers are merged and analyzed again", () => {
  const first = analyzeControlRequest(
    createControlRequest("ทำ DNS แบบนี้ให้หน่อย")
  );

  const result = applyClarification(first, {
    target: "apple",
    format: "mobileconfig",
    operation: "export",
  });

  assert.equal(result.state, ControlState.RESOLVED);
  assert.equal(result.analysis.target, "apple");
  assert.equal(result.analysis.format, "mobileconfig");
  assert.equal(result.analysis.operation, "export");
  assert.deepEqual(result.analysis.missing, []);
});

test("partial clarification keeps the request blocked", () => {
  const first = analyzeControlRequest(
    createControlRequest("ทำ DNS แบบนี้ให้หน่อย")
  );

  const result = applyClarification(first, { target: "apple" });

  assert.equal(result.state, ControlState.NEEDS_CLARIFICATION);
  assert.ok(result.analysis.missing.includes("operation"));
  assert.ok(result.analysis.missing.includes("format"));
});

test("resolved request creates a target-neutral execution plan", () => {
  const result = analyzeControlRequest(
    createControlRequest({
      target: "apple",
      format: "mobileconfig",
      operation: "export",
    })
  );

  const plan = buildExecutionPlan(result);
  assert.deepEqual(plan.stages, ["VALIDATE_INPUT", "PREPARE_TARGET_OUTPUT", "VALIDATE_OUTPUT"]);
  assert.equal(plan.target, "apple");
  assert.equal(plan.operation, "export");
  assert.equal(plan.format, "mobileconfig");
  assert.equal(plan.executionAllowed, false);
});

test("unresolved request cannot create an execution plan", () => {
  const result = analyzeControlRequest(
    createControlRequest("ทำ DNS แบบนี้ให้หน่อย")
  );

  assert.throws(() => buildExecutionPlan(result), /RESOLVED/);
});

test("analysis stage does not route to an adapter", () => {
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
