import React,{useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import "./style.css";

const targets={
  "iOS MobileConfig":{vpn:"SUPPORTED",dns:"SUPPORTED",routing:"LIMITED",blocking:"UNSUPPORTED"},
  "Surge":{vpn:"SUPPORTED",dns:"SUPPORTED",routing:"SUPPORTED",blocking:"SUPPORTED"},
  "Mihomo":{vpn:"SUPPORTED",dns:"SUPPORTED",routing:"SUPPORTED",blocking:"SUPPORTED"},
  "WireGuard":{vpn:"SUPPORTED",dns:"LIMITED",routing:"SUPPORTED",blocking:"UNSUPPORTED"}
};

function App(){
 const [name,setName]=useState("My Privacy Profile");
 const [vpn,setVpn]=useState(false);
 const [dns,setDns]=useState(true);
 const [malware,setMalware]=useState(true);
 const [tracker,setTracker]=useState(true);
 const [target,setTarget]=useState("Surge");
 const policy=useMemo(()=>({version:"0.1",policy:{name,vpn:{enabled:vpn},dns:{enabled:dns},routing:{ipv4:true,ipv6:true},blocking:{malware,tracker}}}),[name,vpn,dns,malware,tracker]);
 const caps=targets[target];
 const featureStatus=(f,enabled)=>enabled?caps[f]:"—";
 const download=()=>{const blob=new Blob([JSON.stringify(policy,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="policy.json";a.click();URL.revokeObjectURL(a.href)};
 return <main><header><h1>Configuration Platform</h1><p>Define once. Validate once. Transform anywhere.</p></header>
 <section className="grid"><div className="card"><h2>Policy Builder</h2><label>Profile name<input value={name} onChange={e=>setName(e.target.value)}/></label>
 <label><input type="checkbox" checked={vpn} onChange={e=>setVpn(e.target.checked)}/> VPN</label>
 <label><input type="checkbox" checked={dns} onChange={e=>setDns(e.target.checked)}/> DNS</label>
 <label><input type="checkbox" checked={malware} onChange={e=>setMalware(e.target.checked)}/> Malware blocking</label>
 <label><input type="checkbox" checked={tracker} onChange={e=>setTracker(e.target.checked)}/> Tracker blocking</label>
 <label>Target<select value={target} onChange={e=>setTarget(e.target.value)}>{Object.keys(targets).map(t=><option key={t}>{t}</option>)}</select></label>
 <button onClick={download}>Export canonical Policy</button></div>
 <div className="card"><h2>Capability Preview</h2>{["vpn","dns","routing","blocking"].map(f=><div className="row" key={f}><span>{f}</span><strong>{featureStatus(f,f==="vpn"?vpn:f==="dns"?dns:true)}</strong></div>)}
 <h3>Generated Policy</h3><pre>{JSON.stringify(policy,null,2)}</pre></div></section></main>
}
createRoot(document.getElementById("root")).render(<App/>);