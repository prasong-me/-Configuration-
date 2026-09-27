import test from "node:test";
import assert from "node:assert/strict";
import { exchangeWithPythonBridge } from "../bridges/python/client.js";

test("JavaScript runtime can exchange a neutral envelope through Python", () => {
  const response = exchangeWithPythonBridge({
    protocol: "configuration-bridge/0.1",
    contract_version: "0.1",
    request_id: "runtime-1",
    action: "exchange",
    payload: { language: "javascript", target: "apple" },
  });

  assert.equal(response.status, "ACCEPTED");
  assert.equal(response.request_id, "runtime-1");
  assert.deepEqual(response.payload, { language: "javascript", target: "apple" });
});