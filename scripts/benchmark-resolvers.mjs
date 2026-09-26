#!/usr/bin/env node
import { Resolver } from "node:dns/promises";
import { performance } from "node:perf_hooks";

export function percentile(values, p) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sorted=[...values].sort((a,b)=>a-b);
  const rank=(p/100)*(sorted.length-1);
  const lower=Math.floor(rank);
  const upper=Math.ceil(rank);
  if(lower===upper) return sorted[lower];
  return sorted[lower]+(sorted[upper]-sorted[lower])*(rank-lower);
}

export function summarize(samples) {
  const values=samples.filter(Number.isFinite);
  if(!values.length) return {samples:0,median:null,p95:null,p99:null,min:null,max:null};
  return {
    samples:values.length,
    median:percentile(values,50),
    p95:percentile(values,95),
    p99:percentile(values,99),
    min:Math.min(...values),
    max:Math.max(...values),
  };
}

function args() {
  const out={query:"example.com",iterations:10,timeout:5000,servers:[
    "1.1.1.1","1.0.0.1","9.9.9.9","149.112.112.112","8.8.8.8","8.8.4.4"
  ]};
  for(let i=2;i<process.argv.length;i++){
    const a=process.argv[i];
    if(a==="--query") out.query=process.argv[++i];
    else if(a==="--iterations") out.iterations=Math.max(1,Number(process.argv[++i]));
    else if(a==="--timeout") out.timeout=Math.max(100,Number(process.argv[++i]));
    else if(a==="--servers") out.servers=process.argv[++i].split(",").map(x=>x.trim()).filter(Boolean);
    else if(a==="--json") out.json=true;
  }
  return out;
}

async function measure(server,query,timeout) {
  const resolver=new Resolver();
  resolver.setServers([server]);
  const started=performance.now();
  try {
    await Promise.race([
      resolver.resolve4(query),
      new Promise((_,reject)=>setTimeout(()=>reject(new Error("timeout")),timeout))
    ]);
    return {ok:true,ms:performance.now()-started};
  } catch(error) {
    return {ok:false,ms:performance.now()-started,error:error instanceof Error?error.message:String(error)};
  }
}

const options=args();
const results=[];
for(const server of options.servers){
  const samples=[];
  const errors=[];
  for(let i=0;i<options.iterations;i++){
    const result=await measure(server,options.query,options.timeout);
    if(result.ok) samples.push(result.ms);
    else errors.push(result.error);
  }
  results.push({server,query:options.query,...summarize(samples),errors});
}
const report={generatedAt:new Date().toISOString(),query:options.query,iterations:options.iterations,timeoutMs:options.timeout,results};
if(options.json) console.log(JSON.stringify(report,null,2));
else {
  console.log(`Resolver benchmark: ${options.query} | iterations=${options.iterations} | timeout=${options.timeout}ms`);
  for(const item of results){
    const fmt=x=>x==null?"n/a":x.toFixed(2)+" ms";
    console.log(`${item.server.padEnd(16)} samples=${String(item.samples).padStart(3)} median=${fmt(item.median).padStart(10)} p95=${fmt(item.p95).padStart(10)} p99=${fmt(item.p99).padStart(10)} errors=${item.errors.length}`);
  }
}
