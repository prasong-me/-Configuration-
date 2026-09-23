import React,{useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import {compatibilityReport,redact} from "../../../packages/core/src/index.js";
import {compileSurge} from "../../../packages/surge-adapter/src/index.js";
import "./style.css";

const targets=[{id:"example",label:"Reference / Core test"},{id:"surge",label:"Surge 5 — evidence-only"}];
const surgeExample={dnsServers:["1.1.1.1"],rules:[{type:"DOMAIN-SUFFIX",value:"example.com",policy:"DIRECT"}],finalPolicy:"DIRECT"};
const surgeRealityTest=[
  "[General]",
  "loglevel = notify",
  "ipv6 = false",
  "dns-server = 1.1.1.1, 8.8.8.8",
  "include-local-networks = true",
  "show-error-page-for-reject = true",
  "",
  "[Proxy]",
  "PROXY = socks5, 127.0.0.1, 1080",
  "",
  "[Proxy Group]",
  "OmniLoop = select, PROXY, DIRECT",
  "",
  "[Rule]",
  "# TEST 1: open example.com — expected REJECT",
  "DOMAIN,example.com,REJECT",
  "# TEST 2: open example.org — expected DIRECT",
  "DOMAIN-SUFFIX,example.org,DIRECT",
  "# TEST 3: open a host containing iana — expected DIRECT",
  "DOMAIN-KEYWORD,iana,DIRECT",
  "# TEST 4: loopback destination — expected DIRECT without DNS lookup",
  "IP-CIDR,127.0.0.0/8,DIRECT,no-resolve",
  "",
  "# Default: all other traffic goes DIRECT",
  "FINAL,DIRECT",
  ""
].join("\\n");
function download(name,text,mime){const blob=new Blob([text],{type:mime});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),0)}
function App(){
 const [name,setName]=useState("My Privacy Profile"); const [vpn,setVpn]=useState(false); const [dns,setDns]=useState(true); const [malware,setMalware]=useState(true); const [trackers,setTrackers]=useState(true); const [target,setTarget]=useState("surge");
 const policy=useMemo(()=>({version:"0.1",policy:{name,vpn,dns,routing:false,blocking:{malware,trackers}}}),[name,vpn,dns,malware,trackers]);
 const report=useMemo(()=>compatibilityReport(policy,target),[policy,target]);
 const surgeArtifact=useMemo(()=>{try{return compileSurge({policy:surgeExample});}catch(e){return {error:e.message};}},[]);
 return <main><header><h1>Configuration Platform</h1><p>Evidence-first configuration builder. Unknown capabilities are blocked.</p></header>
 <section className="grid"><div className="card"><h2>Policy Builder</h2><label>Profile name<input value={name} onChange={e=>setName(e.target.value)}/></label>
 <label><input type="checkbox" checked={vpn} onChange={e=>setVpn(e.target.checked)}/> VPN</label><label><input type="checkbox" checked={dns} onChange={e=>setDns(e.target.checked)}/> DNS</label>
 <label><input type="checkbox" checked={malware} onChange={e=>setMalware(e.target.checked)}/> Malware blocking</label><label><input type="checkbox" checked={trackers} onChange={e=>setTrackers(e.target.checked)}/> Tracker blocking</label>
 <label>Target<select value={target} onChange={e=>setTarget(e.target.value)}>{targets.map(t=><option value={t.id} key={t.id}>{t.label}</option>)}</select></label>
 <button onClick={()=>download("policy.json",JSON.stringify(redact(policy),null,2),"application/json")} disabled={!report.exportable}>Export canonical Policy</button></div>
 <div className="card"><h2>Compatibility Report</h2>{Object.entries(report.capabilities).map(([f,x])=><div className="row" key={f}><span>{f}</span><strong>{x.requested?x.state:"NOT_REQUESTED"}</strong></div>)}
 <h3>Diagnostics</h3>{report.diagnostics.length?<ul>{report.diagnostics.map((d,i)=><li key={i}><strong>{d.level}</strong> {d.code}: {d.message}</li>)}</ul>:<p>No diagnostics.</p>}
 {target==="surge"&&<><h3>Surge test pack</h3><p>ใช้ไฟล์นี้สำหรับทดสอบการ parse, DNS, Proxy, Proxy Group และ Rule บน Surge จริง โดยไม่มี MITM certificate หรือ credential ส่วนตัว</p><pre>{surgeRealityTest}</pre><button onClick={()=>download("surge-reality-test-v2.conf",surgeRealityTest,"text/plain")}>Download test profile</button><h3>Verified fixture preview</h3><p>Minimal serializer fixture; separate from the reality test.</p><pre>{surgeArtifact.content}</pre><button onClick={()=>download("surge-fixture.conf",surgeArtifact.content,"text/plain")}>Download fixture</button></>}
 <h3>Canonical Policy</h3><pre>{JSON.stringify(policy,null,2)}</pre></div></section></main>}
createRoot(document.getElementById("root")).render(<App/>);