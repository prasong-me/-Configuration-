import test from "node:test";
import assert from "node:assert/strict";
import { decodeDnsWireMessage, encodeDnsWireMessage } from "../packages/apple-adapter/src/dns-wire-runtime.js";

const query = Uint8Array.from([
  0x12,0x34,0x01,0x00, 0x00,0x01,0x00,0x00, 0x00,0x00,0x00,0x00,
  0x07,0x65,0x78,0x61,0x6d,0x70,0x6c,0x65, 0x03,0x63,0x6f,0x6d,0x00,
  0x00,0x01,0x00,0x01
]);

const answer = Uint8Array.from([
  0x12,0x34,0x81,0x80, 0x00,0x01,0x00,0x01, 0x00,0x00,0x00,0x00,
  0x07,0x65,0x78,0x61,0x6d,0x70,0x6c,0x65, 0x03,0x63,0x6f,0x6d,0x00,
  0x00,0x01,0x00,0x01,
  0xc0,0x0c, 0x00,0x01,0x00,0x01,0x00,0x00,0x00,0x3c,0x00,0x04,
  0x01,0x02,0x03,0x04
]);

test("DNS wire decoder parses question and preserves transaction id", () => {
  const message = decodeDnsWireMessage(query);
  assert.equal(message.transactionId, 0x1234);
  assert.equal(message.questions[0].name, "example.com");
  assert.equal(message.questions[0].typeCode, 1);
  assert.equal(message.questions[0].class, 1);
});

test("DNS wire decoder resolves backward compression for records", () => {
  const message = decodeDnsWireMessage(answer);
  assert.equal(message.answers[0].name, "example.com");
  assert.equal(message.answers[0].type, "A");
  assert.deepEqual([...message.answers[0].rdata], [1,2,3,4]);
});

test("DNS wire decoder rejects truncation", () => {
  assert.throws(() => decodeDnsWireMessage(query.slice(0, -1)), error => error.code === "DNS_WIRE_TRUNCATED");
});

test("DNS wire decoder rejects forward compression pointers", () => {
  const bad = Uint8Array.from([0,0,1,0,0,1,0,0,0,0,0,0,0xc0,0x0e,0,1,0,1]);
  assert.throws(() => decodeDnsWireMessage(bad), error => error.code === "DNS_WIRE_COMPRESSION_INVALID");
});

test("DNS wire decoder enforces message size limit", () => {
  assert.throws(
    () => decodeDnsWireMessage(query, { limits: { maxMessageBytes: 12, maxNameLength: 255, maxRecords: 256 } }),
    error => error.code === "DNS_WIRE_LIMIT_EXCEEDED"
  );
});

test("DNS wire encoder remains fail-closed until wire-preservation exists", () => {
  assert.throws(
    () => encodeDnsWireMessage({ transactionId: 1, flags: 0, questions: [] }),
    error => error.code === "DNS_WIRE_ENCODE_UNIMPLEMENTED"
  );
});
