import test from "node:test";
import assert from "node:assert/strict";
import { BRIDGE_PROTOCOL, CONTRACT_VERSION, createEnvelope, validateEnvelope } from "../packages/contracts/src/index.js";

test("language-neutral contract creates a versioned envelope", () => {
  const envelope = createEnvelope({
    requestId: "req-1",
    action: "exchange",
    payload: { target: "apple" },
  });

  assert.equal(envelope.protocol, BRIDGE_PROTOCOL);
  assert.equal(envelope.contractVersion, CONTRACT_VERSION);
  assert.equal(validateEnvelope(envelope).valid, true);
});

test("language-neutral contract rejects incomplete envelopes", () => {
  const result = validateEnvelope({ protocol: BRIDGE_PROTOCOL, contractVersion: CONTRACT_VERSION });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("REQUEST_ID_REQUIRED"));
  assert.ok(result.errors.includes("ACTION_REQUIRED"));
  assert.ok(result.errors.includes("PAYLOAD_REQUIRED"));
});
