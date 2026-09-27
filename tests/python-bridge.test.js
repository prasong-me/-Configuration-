import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const bridge = new URL("../bridges/python/bridge.py", import.meta.url);

function runBridge(input) {
  const result = spawnSync("python3", [bridge.pathname], {
    input: JSON.stringify(input) + "\n",
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout.trim());
}

test("Python bridge accepts a language-neutral envelope", () => {
  const result = runBridge({
    protocol: "configuration-bridge/0.1",
    contract_version: "0.1",
    request_id: "req-1",
    action: "exchange",
    payload: { language: "typescript", target: "apple" },
  });

  assert.equal(result.status, "ACCEPTED");
  assert.equal(result.request_id, "req-1");
  assert.deepEqual(result.payload, { language: "typescript", target: "apple" });
});

test("Python bridge rejects an unsupported protocol", () => {
  const result = runBridge({
    protocol: "wrong/0.1",
    request_id: "req-2",
    action: "exchange",
    payload: {},
  });

  assert.equal(result.status, "ERROR");
  assert.match(result.error, /Unsupported bridge protocol/);
});
