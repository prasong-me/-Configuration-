import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("canonical DNS configuration keeps one ordered resolver set", async () => {
  const raw = await readFile("configs/dns/layered-dns.json", "utf8");
  const config = JSON.parse(raw);
  const resolvers = config.dns?.resolvers;

  assert.equal(config.dns?.mode, "ordered-resolvers");
  assert.equal(Array.isArray(resolvers), true);
  assert.equal(resolvers.length, 2);
  assert.deepEqual(
    resolvers.map((resolver) => resolver.order),
    [1, 2]
  );
  assert.equal(resolvers[0].provider, "Cloudflare");
  assert.equal(resolvers[0].endpoint, "https://cloudflare-dns.com/dns-query");
  assert.equal(resolvers[1].provider, "AdGuard");
  assert.equal(
    resolvers[1].endpoint,
    "https://d.adguard-dns.com/dns-query/win-731a2e5a-Device-1"
  );
});

test("Apple target metadata describes serialization, not internal resolver semantics", async () => {
  const raw = await readFile("configs/dns/layered-dns.json", "utf8");
  const config = JSON.parse(raw);
  const apple = config.targets?.["apple-mobileconfig"];

  assert.equal(apple.serialization, "Apple Property List XML");
  assert.equal(apple.payloadType, "com.apple.dnsSettings.managed");
  assert.equal(apple.exportPolicy, "target-capability-gated");
});
