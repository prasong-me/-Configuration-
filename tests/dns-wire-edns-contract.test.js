import test from "node:test";
import assert from "node:assert/strict";
import { createDnsWireEdnsContract, validateDnsWireEdnsContract } from "../packages/apple-adapter/src/dns-wire-edns-contract.js";

test("EDNS contract defines OPT as a root-owned pseudo-RR", () => {
  const contract = createDnsWireEdnsContract();
  assert.equal(contract.rrType, 41);
  assert.equal(contract.ownerName, "ROOT");
  assert.equal(contract.versionField, 0);
  assert.equal(validateDnsWireEdnsContract(contract).valid, true);
});

test("EDNS contract fails closed for unsupported version or implicit flags", () => {
  const contract = createDnsWireEdnsContract({ version: 1 });
  contract.versionField = 1;
  contract.doBit = "IMPLICIT";
  const result = validateDnsWireEdnsContract(contract);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("DNS_WIRE_EDNS_VERSION_UNSUPPORTED"));
  assert.ok(result.errors.includes("DNS_WIRE_EDNS_DO_BIT_REQUIRED"));
});
