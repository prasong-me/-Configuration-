import test from "node:test";
import assert from "node:assert/strict";
import {createAppleDnsCommandLayers} from "../packages/apple-adapter/src/dns-command-model.js";
import {compileAppleDnsDeclaration, compileAppleDnsSettings} from "../packages/apple-adapter/src/dns-schema.js";

test("Apple DNS commands are target-scoped and compile only into Apple schema", () => {
  const commands = createAppleDnsCommandLayers({dnsProtocol:"HTTPS",dnsServerUrl:"https://dns.example/dns-query",dnsServers:["1.1.1.1","2606:4700:4700::1111"],dnsDomains:["example.com"],dnsAllowFailover:false});
  assert.ok(commands.length > 0);
  assert.ok(commands.every(layer => Array.isArray(layer.commands)));
  assert.ok(commands.every(layer => layer.commands.every(command => command.target === "apple")));
  const settings = compileAppleDnsSettings(commands);
  assert.equal(settings.DNSProtocol, "HTTPS");
  assert.equal(settings.ServerURL, "https://dns.example/dns-query");
  assert.deepEqual(settings.ServerAddresses, ["1.1.1.1","2606:4700:4700::1111"]);
  assert.deepEqual(settings.SupplementalMatchDomains, ["example.com"]);
  assert.equal(settings.AllowFailover, false);
});

test("Apple DNS HTTPS rejects non-HTTPS ServerURL", () => {
  assert.throws(() => compileAppleDnsDeclaration([{target:"apple",command:"DNSProtocol",value:"HTTPS"},{target:"apple",command:"ServerURL",value:"http://dns.example/dns-query"}]), /https:\/\//);
});

test("Apple DNS declaration uses the Apple declaration type", () => {
  const declaration = compileAppleDnsDeclaration([{target:"apple",command:"DNSProtocol",value:"HTTPS"},{target:"apple",command:"ServerURL",value:"https://dns.example/dns-query"}], {identifier:"test.apple.dns",serverToken:"token-1"});
  assert.equal(declaration.Type, "com.apple.configuration.network.dns-settings");
  assert.equal(declaration.Identifier, "test.apple.dns");
  assert.equal(declaration.ServerToken, "token-1");
  assert.equal(declaration.Payload.DNSSettings.ServerURL, "https://dns.example/dns-query");
});
