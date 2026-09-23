import React,{useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import {compatibilityReport,redact} from "../../../packages/core/src/index.js";
import "./style.css";

const targets=[{id:"example",label:"Example reference target"}];
function App(){
 const [name,setName]=useState("My Privacy Profile");
 const [vpn,setVpn]=useState(false); const [dns,setDns]=useState(true); const [malware,setMalware]=useState(true); const [trackers,setTrackers]=useState(true); const [target,setTarget]=useState("example");
 const policy=useMemo(()=>({version:"0.1",policy:{name,vpn,dns,routing:false,blocking:{malware,trackers}}}),[name,vpn,dns,malware,trackers]);
 const report=useMemo(()=>compatibilityReport(policy,target),[policy,target]);
 const download=()=>{const blob=new Blob([JSON.stringify(redact(policy),null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="policy.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),0)};
 return <main><header><h1>Configuration Platform</h1><p>Define once. Validate once. Transform anywhere.</p></header>
 <section className="grid"><div className="card"><h2>Policy Builder</h2><label>Profile name<input value={name} onChange={e=>setName(e.target.value)}/></label>
 <label><input type="checkbox" checked={vpn} onChange={e=>setVpn(e.target.checked)}/> VPN</label><label><input type="checkbox" checked={dns} onChange={e=>setDns(e.target.checked)}/> DNS</label>
 <label><input type="checkbox" checked={malware} onChange={e=>setMalware(e.target.checked)}/> Malware blocking</label><label><input type="checkbox" checked={trackers} onChange={e=>setTrackers(e.target.checked)}/> Tracker blocking</label>
 <label>Target<select value={target} onChange={e=>setTarget(e.target.value)}>{targets.map(t=><option value={t.id} key={t.id}>{t.label}</option>)}</select></label>
 <button onClick={download} disabled={!report.exportable}>Export canonical Policy</button></div>
 <div className="card"><h2>Verified Capability Report</h2>{Object.entries(report.capabilities).map(([f,x])=><div className="row" key={f}><span>{f}</span><strong>{x.requested?x.state:"NOT_REQUESTED"}</strong></div>)}
 <h3>Diagnostics</h3>{report.diagnostics.length?<ul>{report.diagnostics.map((d,i)=><li key={i}><strong>{d.level}</strong> {d.code}: {d.message}</li>)}</ul>:<p>No diagnostics.</p>}
 <h3>Canonical Policy</h3><pre>{JSON.stringify(policy,null,2)}</pre></div></section></main>
}
createRoot(document.getElementById("root")).render(<App/>);