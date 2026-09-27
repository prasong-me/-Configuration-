import test from "node:test";
import assert from "node:assert/strict";
import { configurationWizardSteps } from "../apps/web/src/wizard.js";

test("defines the Configuration six-step flow in order", () => {
  assert.deepEqual(
    configurationWizardSteps.map((step) => step.id),
    ["intent", "source", "dns", "target", "compatibility", "review"],
  );
});

test("steps expose stable titles and skip capability", () => {
  assert.equal(configurationWizardSteps.length, 6);
  assert.ok(configurationWizardSteps.every((step) => typeof step.title === "string"));
  assert.ok(configurationWizardSteps.every((step) => typeof step.skippable === "boolean"));
});
