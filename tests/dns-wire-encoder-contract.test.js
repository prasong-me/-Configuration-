import test from "node:test";
import assert from "node:assert/strict";
import {
  DnsWireEncoderCompression,
  DnsWireEncoderRdataMode,
  createDnsWireEncoderContract,
  validateDnsWireEncoderContract,
} from "../packages/apple-adapter/src/dns-wire-encoder-contract.js";

test("DNS wire encoder contract is message-to-raw and derives section counts", () => {
  const contract = createDnsWireEncoderContract();
  assert.equal(contract.input, "DNS_MESSAGE");
  assert.equal(contract.output, "RAW_DNS_DATA");
  assert.equal(contract.header.counts, "DERIVED");
  assert.equal(contract.compression, DnsWireEncoderCompression.NONE);
  assert.equal(contract.determinism, true);
  assert.equal(contract.failClosed, true);
});

test("DNS wire encoder contract declares explicit RDATA encoding modes", () => {
  const contract = createDnsWireEncoderContract();
  assert.equal(contract.rdataModes.A, DnsWireEncoderRdataMode.A);
  assert.equal(contract.rdataModes.CNAME, DnsWireEncoderRdataMode.CNAME);
  assert.equal(contract.rdataModes.MX, DnsWireEncoderRdataMode.MX);
  assert.equal(contract.rdataModes.SVCB, DnsWireEncoderRdataMode.SVCB);
  assert.equal(validateDnsWireEncoderContract(contract).valid, true);
});

test("DNS wire encoder contract rejects semantic invention or non-deterministic compression", () => {
  const contract = createDnsWireEncoderContract({ compression: "AUTO", determinism: false, semanticInvention: true });
  const result = validateDnsWireEncoderContract(contract);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("DNS_WIRE_ENCODER_COMPRESSION_UNSUPPORTED"));
  assert.ok(result.errors.includes("DNS_WIRE_ENCODER_DETERMINISM_REQUIRED"));
  assert.ok(result.errors.includes("DNS_WIRE_ENCODER_SEMANTIC_INVENTION_FORBIDDEN"));
});
