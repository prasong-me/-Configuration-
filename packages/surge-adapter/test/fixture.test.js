import test from "node:test";
import assert from "node:assert/strict";
import { compileSurge } from "../src/index.js";

test("compileSurge emits a minimal documented profile",()=>{
 const a=compileSurge({policy:{dnsServers:["1.1.1.1"],rules:[{type:"DOMAIN-SUFFIX",value:"example.com",policy:"DIRECT"}],finalPolicy:"DIRECT"}});
 assert.equal(a.filename,"profile.conf");
 assert.match(a.content,/^\\[General\\]/);
 assert.match(a.content,/dns-server = 1\\.1\\.1\\.1/);
 assert.match(a.content,/DOMAIN-SUFFIX,example\\.com,DIRECT/);
 assert.match(a.content,/FINAL,DIRECT/);
});

test("unsupported syntax is rejected instead of guessed",()=>{assert.throws(()=>compileSurge({policy:{rules:[{type:"UNKNOWN",value:"x",policy:"DIRECT"}]}}));});
