import test from "node:test";
import assert from "node:assert/strict";
import {
  ipAddress,
  ipNetwork,
  endpoint,
  ipCommand,
  configurationDocument
} from "../packages/command-model/src/index.js";

test("IPv4 address is stored as structured semantic data",()=>{
  assert.deepEqual(ipAddress({address:"192.168.1.10",family:"ipv4"}),{
    type:"ip",
    address:"192.168.1.10",
    family:"ipv4"
  });
});

test("IPv6 address is stored as structured semantic data",()=>{
  assert.deepEqual(ipAddress({address:"2001:db8::1",family:"ipv6"}),{
    type:"ip",
    address:"2001:db8::1",
    family:"ipv6"
  });
});

test("IP network keeps prefix separate from address",()=>{
  assert.deepEqual(ipNetwork({address:"192.168.1.0",family:"ipv4",prefix:24}),{
    type:"ip-network",
    address:"192.168.1.0",
    family:"ipv4",
    prefix:24
  });
});

test("IPv4 rejects an IPv6-sized prefix",()=>{
  assert.throws(()=>ipNetwork({address:"192.168.1.0",family:"ipv4",prefix:64}),/prefix/);
});

test("endpoint keeps port and protocol separate",()=>{
  assert.deepEqual(endpoint({
    address:"2001:db8::1",
    family:"ipv6",
    port:443,
    protocol:"TCP"
  }),{
    type:"endpoint",
    address:"2001:db8::1",
    family:"ipv6",
    port:443,
    protocol:"tcp"
  });
});

test("IP command accepts semantic objects, not target-formatted strings",()=>{
  const command=ipCommand({
    values:[
      {address:"192.168.1.0",family:"ipv4",prefix:24},
      {address:"2001:db8::",family:"ipv6",prefix:64}
    ],
    policy:"DIRECT"
  });
  assert.equal(command.values[0].prefix,24);
  assert.equal(command.values[1].prefix,64);
  assert.equal(configurationDocument([command]).commands.length,1);
});
