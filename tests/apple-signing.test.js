import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

test("MobileConfig signer creates and verifies a real CMS/DER container",()=>{
  const dir=mkdtempSync(join(tmpdir(),"configuration-signing-"));
  try{
    const input=join(dir,"unsigned.mobileconfig");
    const cert=join(dir,"signer.pem");
    const key=join(dir,"signer-key.pem");
    const output=join(dir,"signed.mobileconfig");
    const verified=join(dir,"signed.mobileconfig.verified");
    writeFileSync(input,`<?xml version="1.0"?><plist><dict><key>PayloadType</key><string>Configuration</string></dict></plist>`);
    const generated=spawnSync("openssl",["req","-x509","-newkey","rsa:2048","-nodes","-keyout",key,"-out",cert,"-subj","/CN=Configuration Platform Test","-days","1"],{encoding:"utf8"});
    assert.equal(generated.status,0,generated.stderr);
    const signer=spawnSync("node",["scripts/sign-mobileconfig.mjs","--input",input,"--output",output,"--cert",cert,"--key",key],{encoding:"utf8"});
    assert.equal(signer.status,0,signer.stderr||signer.stdout);
    assert.ok(readFileSync(output).length>0);
    assert.ok(readFileSync(verified,"utf8").includes("PayloadType"));
    const verify=spawnSync("openssl",["cms","-verify","-inform","DER","-in",output,"-noverify","-out",join(dir,"verified-2")],{encoding:"utf8"});
    assert.equal(verify.status,0,verify.stderr);
  } finally {
    rmSync(dir,{recursive:true,force:true});
  }
});
