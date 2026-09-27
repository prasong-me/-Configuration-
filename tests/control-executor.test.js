import test from "node:test";
import assert from "node:assert/strict";
import { createControlRequest, analyzeControlRequest } from "../packages/control/src/index.js";
import { executeResolvedRequest } from "../packages/control/src/executor.js";

test("resolved Apple request executes through registry and adapter", () => {
  const request = analyzeControlRequest(createControlRequest({
    target: "apple", format: "mobileconfig", operation: "export",
  }));

  const result = executeResolvedRequest(request, {
    version: "0.1",
    policy: {
      name: "Control Test",
      dns: true,
      dnsProfiles: [{
        id: "cloudflare",
        name: "Cloudflare",
        protocol: "DoH",
        endpoint: "https://cloudflare-dns.com/dns-query",
        servers: ["1.1.1.1", "1.0.0.1"],
      }],
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.stage, "COMPLETED");
  assert.equal(result.targetId, "apple-mobileconfig");
  assert.match(result.artifact.content, /com\.apple\.dnsSettings\.managed/);
});

test("execution does not proceed when target format is unregistered", () => {
  const request = analyzeControlRequest(createControlRequest({
    target: "apple", format: "unknown", operation: "export",
  }));
  const result = executeResolvedRequest(request, { version: "0.1", policy: {} });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "ROUTING");
  assert.equal(result.error.code, "TARGET_FORMAT_UNREGISTERED");
});
