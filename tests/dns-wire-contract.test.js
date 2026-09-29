import test from "node:test";
import assert from "node:assert/strict";
import {
  DnsWireSection,
  DnsWireRecordType,
  createDnsWireParserContract,
  validateDnsWireParserContract,
} from "../packages/apple-adapter/src/dns-wire-contract.js";

test("DNS wire contract separates raw bytes from semantic DNS message", () => {
  const contract = createDnsWireParserContract();
  assert.equal(contract.input, "RAW_DNS_DATA");
  assert.equal(contract.output, "DNS_MESSAGE");
  assert.equal(contract.implementation, "APPLICATION_RUNTIME");
  assert.deepEqual(contract.sections, Object.values(DnsWireSection));
});

test("DNS wire contract exposes bounded parsing limits", () => {
  const contract = createDnsWireParserContract({
    limits: { maxMessageBytes: 4096, maxNameLength: 255, maxRecords: 256 },
  });
  assert.deepEqual(contract.limits, {
    maxMessageBytes: 4096,
    maxNameLength: 255,
    maxRecords: 256,
  });
  assert.equal(validateDnsWireParserContract(contract).valid, true);
});

test("DNS wire contract rejects unsafe or absent bounds", () => {
  const contract = createDnsWireParserContract({
    limits: { maxMessageBytes: 0, maxNameLength: -1 },
  });
  const result = validateDnsWireParserContract(contract);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("DNS_WIRE_LIMIT_INVALID:maxMessageBytes"));
  assert.ok(result.errors.includes("DNS_WIRE_LIMIT_INVALID:maxNameLength"));
  assert.ok(result.errors.includes("DNS_WIRE_LIMIT_REQUIRED:maxRecords"));
});

test("DNS wire contract keeps record type semantics explicit", () => {
  const contract = createDnsWireParserContract({
    inspect: [DnsWireRecordType.A, DnsWireRecordType.AAAA, DnsWireRecordType.HTTPS],
    mutate: [DnsWireRecordType.A],
  });
  assert.deepEqual(contract.inspect, ["A", "AAAA", "HTTPS"]);
  assert.deepEqual(contract.mutate, ["A"]);
  assert.equal(validateDnsWireParserContract(contract).valid, true);
});
