import test from "node:test";
import assert from "node:assert/strict";
import { getTargetCommandRegistry, hasTargetCommand } from "./command-registry.js";
import { ipCommand, configurationDocument } from "../../command-model/src/index.js";

test("target registry exposes target-specific serialization metadata",()=>{
  const surge=getTargetCommandRegistry("surge");
  const mihomo=getTargetCommandRegistry("mihomo");
  assert.equal(surge.commands.dns.listSeparator,", ");
  assert.equal(mihomo.commands.dns.listShape,"array");
});

test("common IP model keeps prefix structured",()=>{
  const command=ipCommand({values:[{address:"192.168.1.0",family:"ipv4",prefix:24}],policy:"DIRECT"});
  assert.equal(command.values[0].address,"192.168.1.0");
  assert.equal(command.values[0].prefix,24);
  assert.equal(configurationDocument([command]).commands.length,1);
});

test("unknown target command is not silently accepted",()=>{
  assert.equal(hasTargetCommand("surge","not-a-command"),false);
});
