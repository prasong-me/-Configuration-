#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

function arg(name,required=true){
  const i=process.argv.indexOf(name);
  const value=i>=0?process.argv[i+1]:undefined;
  if(required&&!value) throw new Error(`Missing argument: ${name}`);
  return value;
}

function run(args){
  const result=spawnSync("openssl",args,{encoding:"utf8"});
  if(result.error) throw result.error;
  if(result.status!==0) throw new Error((result.stderr||result.stdout||"OpenSSL failed").trim());
  return result.stdout;
}

const input=arg("--input");
const output=arg("--output");
const cert=arg("--cert");
const key=arg("--key");
const chain=arg("--chain",false);
const passwordEnv=arg("--password-env",false);

for(const file of [input,cert,key]) if(!existsSync(file)) throw new Error(`File not found: ${file}`);
if(!readFileSync(input).length) throw new Error("Input MobileConfig is empty.");

const pass=passwordEnv?process.env[passwordEnv]:undefined;
const args=["cms","-sign","-binary","-in",input,"-signer",cert,"-inkey",key,"-outform","DER","-out",output,"-nodetach","-nosmimecap","-md","sha256"];
if(chain){
  if(!existsSync(chain)) throw new Error(`File not found: ${chain}`);
  args.push("-certfile",chain);
}
if(pass) args.push("-passin",`pass:${pass}`);
run(args);

const verified=output+".verified";
run(["cms","-verify","-inform","DER","-in",output,"-noverify","-out",verified]);
console.log(JSON.stringify({signed:true,output,verified,format:"CMS/DER",digest:"sha256"}));
