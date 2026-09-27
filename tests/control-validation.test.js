import test from "node:test";
import assert from "node:assert/strict";
import { createControlRequest, analyzeControlRequest } from "../packages/control/src/index.js";
import { validateExecutionInput } from "../packages/control/src/validation.js";

test("resolved control request can pass through policy validation", () => {
  const request = analyzeControlRequest(createControlRequest({
    target: "apple", format: "mobileconfig", operation: "export",
  }));
  const result = validateExecutionInput(request, { vpn: false, dns: false, routing: false });
  assert.equal(result.ok, true);
});

test("unresolved control request cannot enter validation", () => {
  const request = analyzeControlRequest(createControlRequest("ทำ DNS แบบนี้ให้หน่อย"));
  const result = validateExecutionInput(request, {});
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics[0].code, "CONTROL_NOT_RESOLVED");
});
