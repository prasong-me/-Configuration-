import test from "node:test";
import assert from "node:assert/strict";
import { configurationWizardSteps } from "../apps/web/src/wizard-steps.js";

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


test("skipping DNS removes DNS semantics and Apple DNS payloads", async () => {
  const { applyWizardSkipSemantics } = await import("../apps/web/src/wizard-steps.js");
  const policy = { policy: { dns: true, dnsProfiles: [{ id: "dns-1" }], dnsServers: ["1.1.1.1"], applePayloads: { dns: true, webclip: true } } };
  const result = applyWizardSkipSemantics(policy, new Set(["dns"]));
  assert.equal(result.policy.dns, false);
  assert.deepEqual(result.policy.dnsProfiles, []);
  assert.deepEqual(result.policy.dnsServers, []);
  assert.equal(result.policy.applePayloads.dns, false);
  assert.equal(result.policy.applePayloads.webclip, true);
});

test("skipping source removes source network semantics", async () => {
  const { applyWizardSkipSemantics } = await import("../apps/web/src/wizard-steps.js");
  const policy = { policy: { vpn: true, routing: true, proxyServer: "proxy.example:8080", blocking: { malware: true, trackers: true }, blockedDomains: ["ads.example"], applePayloads: { vpn: true, globalProxy: true, webclip: true } } };
  const result = applyWizardSkipSemantics(policy, new Set(["source"]));
  assert.equal(result.policy.vpn, false);
  assert.equal(result.policy.routing, false);
  assert.equal(result.policy.proxyServer, "");
  assert.equal(result.policy.blocking.malware, false);
  assert.equal(result.policy.blocking.trackers, false);
  assert.deepEqual(result.policy.blockedDomains, []);
  assert.equal(result.policy.applePayloads.vpn, false);
  assert.equal(result.policy.applePayloads.globalProxy, false);
  assert.equal(result.policy.applePayloads.webclip, true);
});
