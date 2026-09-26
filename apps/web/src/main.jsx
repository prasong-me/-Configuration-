import React,{useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import {compatibilityReport} from "../../../packages/core/src/index.js";
import {exportFormats,getExportArtifact,getExportWarnings} from "../../../packages/targets/src/exporters.js";
import "./style.css";
import {recommendedDnsServices} from "../../../packages/catalog/src/recommended-dns.js";

const primaryTargets=["apple-mobileconfig","surge","shadowrocket","quantumult-x","wireguard","loon","stash","mihomo"];
const translations={
  th:{title:"Configuration Platform",subtitle:"สร้างไฟล์ตั้งค่าเครือข่าย แล้วเลือกวิธีนำไปติดตั้งหรือเปิดด้วยแอปที่ต้องการ",step1:"1. ตั้งค่าพื้นฐาน",step2:"2. เลือกปลายทาง",step3:"3. ส่งออก",profileName:"ชื่อโปรไฟล์",dns:"DNS",dnsHint:"เลือกบริการที่แนะนำ หรือกรอก DNS เอง",dnsPreset:"บริการ DNS",chooseDns:"เลือกบริการฟรี",proxy:"Proxy Server",target:"ปลายทางที่ต้องการใช้",targetHint:"เลือกสิ่งที่คุณจะนำไฟล์ไปใช้งาน",export:"ส่งออก",apple:"ติดตั้งบน iPhone / iPad",appleDesc:"สร้าง .mobileconfig สำหรับติดตั้งผ่าน iOS Settings",downloadProfile:"ดาวน์โหลดโปรไฟล์ iOS",installSteps:"หลังดาวน์โหลด ให้เปิด Settings > Profile Downloaded > Install",appExport:"ส่งไฟล์เข้าแอป",appDesc:"ใช้ปุ่มแชร์ของเครื่องเพื่อส่งไฟล์เข้าแอปที่รองรับ",share:"ส่งไฟล์ไปยังแอป",download:"ดาวน์โหลดไฟล์",fallback:"ถ้าแอปไม่ปรากฏในเมนูแชร์ ให้ดาวน์โหลดไฟล์แล้วนำเข้าในแอปด้วยเมนู Import",warning:"ข้อควรทราบ",advanced:"ตั้งค่าเพิ่มเติม",vpn:"เปิดใช้ VPN / Routing",malware:"บล็อก Malware",trackers:"บล็อก Tracker",help:"วิธีใช้งาน",helpText:"ไม่ต้องรู้รูปแบบไฟล์เอง ระบบจะสร้างไฟล์ตามปลายทางที่เลือก",ready:"พร้อมส่งออก",notReady:"ต้องแก้ข้อมูลก่อนส่งออก",knowledge:"คู่มือ",language:"ภาษา",thai:"ไทย",english:"English"},
  en:{title:"Configuration Platform",subtitle:"Build a network configuration, then choose how to install or send it to your app.",step1:"1. Basic settings",step2:"2. Choose destination",step3:"3. Export",profileName:"Profile name",dns:"DNS",dnsHint:"Choose a recommended service or enter DNS manually.",dnsPreset:"DNS service",chooseDns:"Choose a free service",proxy:"Proxy Server",target:"Destination",targetHint:"Choose where you will use the generated file.",export:"Export",apple:"Install on iPhone / iPad",appleDesc:"Create a .mobileconfig for installation through iOS Settings.",downloadProfile:"Download iOS profile",installSteps:"After downloading: Settings > Profile Downloaded > Install",appExport:"Send file to app",appDesc:"Use the device share sheet to send the file to a compatible app.",share:"Send to app",download:"Download file",fallback:"If the app is not shown in Share, download the file and use Import inside the app.",warning:"Important",advanced:"More settings",vpn:"Enable VPN / Routing",malware:"Block Malware",trackers:"Block Trackers",help:"How it works",helpText:"You do not need to know the file format. The platform builds it for the selected destination.",ready:"Ready to export",notReady:"Fix the settings before exporting",knowledge:"Guide",language:"Language",thai:"ไทย",english:"English"}
};

function makeBlob(name,text,mime){return new File([text],name,{type:mime});}
function downloadFile(name,text,mime){const blob=new Blob([text],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
async function shareFile(file){if(!navigator.share||!navigator.canShare||!navigator.canShare({files:[file]}))return false;try{await navigator.share({files:[file],title:file.name});return true}catch(error){if(error?.name==="AbortError")return true;return false;}}

function App(){
  const [language,setLanguage]=useState("th"); const tr=translations[language];
  const [name,setName]=useState("My Privacy Profile"); const [vpn,setVpn]=useState(false); const [dns,setDns]=useState(true);
  const [malware,setMalware]=useState(false); const [trackers,setTrackers]=useState(false);
  const [dnsServers,setDnsServers]=useState("1.1.1.1\n1.0.0.1"); const [dnsProtocol,setDnsProtocol]=useState("HTTPS");
  const [proxyServer,setProxyServer]=useState(""); const [dnsServerUrl,setDnsServerUrl]=useState("https://cloudflare-dns.com/dns-query"); const [dnsServerName,setDnsServerName]=useState("");
  const [dnsPreset,setDnsPreset]=useState(""); const [target,setTarget]=useState("apple-mobileconfig"); const [message,setMessage]=useState("");
  const [applePayloads,setApplePayloads]=useState({dns:true,webclip:true,wifi:false,vpn:false,globalProxy:false});
  const [wifiSSID,setWifiSSID]=useState(""); const [wifiPassword,setWifiPassword]=useState(""); const [wifiHidden,setWifiHidden]=useState(false);
  const [vpnRemoteAddress,setVpnRemoteAddress]=useState(""); const [vpnRemoteIdentifier,setVpnRemoteIdentifier]=useState(""); const [vpnLocalIdentifier,setVpnLocalIdentifier]=useState(""); const [vpnSharedSecret,setVpnSharedSecret]=useState("");
  const [blockedDomains,setBlockedDomains]=useState(""); const [blockPreset,setBlockPreset]=useState("custom"); const [routingAction,setRoutingAction]=useState("DIRECT"); const [proxyType,setProxyType]=useState("HTTP");

  const policy=useMemo(()=>({version:"0.4",policy:{name,vpn,dns,routing:vpn,blocking:{malware,trackers,separateFromResolver:true},dnsServers:dns?dnsServers.split(/[,\s]+/).map(x=>x.trim()).filter(Boolean):[],proxyServer:proxyServer.trim(),dnsProtocol,dnsServerUrl:dnsServerUrl.trim(),dnsServerName:dnsServerName.trim(),webAppUrl:window.location.href.split("#")[0],dnsDomains:[],rules:[],finalPolicy:"DIRECT",bypassSystem:true,applePayloads,
wifiSSID,wifiPassword,wifiHidden,vpnRemoteAddress,vpnRemoteIdentifier,vpnLocalIdentifier,vpnSharedSecret,blockedDomains:blockedDomains.split(/[\\s,]+/).map(x=>x.trim()).filter(Boolean),routingAction,proxyType}}),[name,vpn,dns,dnsProtocol,malware,trackers,dnsServers,proxyServer,dnsServerUrl,dnsServerName,applePayloads,wifiSSID,wifiPassword,wifiHidden,vpnRemoteAddress,vpnRemoteIdentifier,vpnLocalIdentifier,vpnSharedSecret,blockedDomains,routingAction,proxyType]);

  const policyForExport=policy; const selectedFormat=exportFormats.find(x=>x.id===target)||exportFormats[0];
  const artifact=getExportArtifact(selectedFormat.id,policyForExport); const warnings=getExportWarnings(selectedFormat.id,policyForExport);
  const report=useMemo(()=>compatibilityReport(policy,target),[policy,target]);
  const blocking=report.diagnostics.filter(x=>(x.level==="CRITICAL"||x.level==="HIGH")&&x.code!=="CAPABILITY_UNKNOWN");
  const capabilityWarnings=report.diagnostics.filter(x=>x.code==="CAPABILITY_UNKNOWN"); const exportReady=Boolean(artifact)&&blocking.length===0; const isApple=target==="apple-mobileconfig";
  const selectTarget=id=>{setTarget(id);setMessage("")};
  const doDownload=()=>{downloadFile(`${selectedFormat.id}-config${selectedFormat.extension}`,artifact,selectedFormat.mime);setMessage("ดาวน์โหลดไฟล์แล้ว")};
  const doShare=async()=>{const file=makeBlob(`${selectedFormat.id}-config${selectedFormat.extension}`,artifact,selectedFormat.mime);const shared=await shareFile(file);if(shared){setMessage("เปิดเมนูแชร์แล้ว เลือกแอปปลายทางได้เลย");return}doDownload();setMessage("อุปกรณ์นี้ไม่รองรับการส่งไฟล์เข้าแอปโดยตรง จึงดาวน์โหลดไฟล์แทน")};
  const primaryFormats=primaryTargets.map(id=>exportFormats.find(x=>x.id===id)).filter(Boolean);

  return <main>
    <header className="hero"><div className="language-menu"><label>{tr.language}<select value={language} onChange={e=>setLanguage(e.target.value)}><option value="th">{tr.thai}</option><option value="en">{tr.english}</option></select></label></div><div className="hero-badge">Configuration Compiler</div><h1>{tr.title}</h1><p>{tr.subtitle}</p><div style={{display:"flex",gap:"12px",flexWrap:"wrap"}}><a href="./knowledge.html">{tr.knowledge}</a></div></header>
    <nav className="mobile-nav" aria-label="เมนูหลัก"><a href="#basic"><span>1</span>{tr.step1.replace(/^1\. /,"")}</a><a href="#destination"><span>2</span>{tr.step2.replace(/^2\. /,"")}</a><a href="#export"><span>3</span>{tr.step3.replace(/^3\. /,"")}</a></nav>
    <section className="card" id="basic"><div className="section-title"><div><span className="step">1</span><div><h2>{tr.step1.replace(/^1\. /,"")}</h2><p>{tr.helpText}</p></div></div></div>
      <label>{tr.profileName}<input value={name} onChange={e=>setName(e.target.value)} placeholder="เช่น My DNS Profile"/></label>
      <label>{tr.dns}<textarea value={dnsServers} onChange={e=>setDnsServers(e.target.value)} rows="2" placeholder="1.1.1.1&#10;1.0.0.1"/><small>{tr.dnsHint}</small></label>
      <label>DNS transport<select value={dnsProtocol} onChange={e=>setDnsProtocol(e.target.value)}><option value="HTTPS">DNS-over-HTTPS (HTTPS)</option><option value="TLS">DNS-over-TLS (TLS)</option></select></label>
      <label>{tr.dnsPreset}<select value={dnsPreset} onChange={e=>{const id=e.target.value;setDnsPreset(id);const preset=recommendedDnsServices.find(x=>x.id===id);if(!preset)return;setDnsServers([...preset.ipv4,...preset.ipv6].join("\n"));if(preset.doh){setDnsProtocol("HTTPS");setDnsServerUrl(preset.doh)}else if(preset.dot){setDnsProtocol("TLS");setDnsServerName(preset.dot);setDnsServerUrl("")}}}><option value="">{tr.chooseDns}</option>{recommendedDnsServices.map(x=><option key={x.id} value={x.id}>{x.provider} · {x.description}</option>)}</select></label>
      <details open><summary>Network building blocks</summary>
        <div className="advanced-grid">
          <label>Proxy type<select value={proxyType} onChange={e=>setProxyType(e.target.value)}><option>HTTP</option><option>HTTPS</option><option>SOCKS5</option></select></label>
          <label>Routing action<select value={routingAction} onChange={e=>setRoutingAction(e.target.value)}><option value="DIRECT">DIRECT</option><option value="PROXY">PROXY</option><option value="REJECT">REJECT / BLOCK</option><option value="DNS">DNS</option></select></label>
        </div>
        <label>Blocked domains<textarea value={blockedDomains} onChange={e=>setBlockedDomains(e.target.value)} rows="3" placeholder="example.com&#10;ads.example.com&#10;tracker.example.com"/></label>
        <label>Blocklist preset<select value={blockPreset} onChange={e=>{setBlockPreset(e.target.value);if(e.target.value!=="custom")setBlockedDomains("<!-- "+e.target.value+" -->")}}><option value="custom">Custom domains</option><option value="oisd-small">OISD Small</option><option value="hagezi-pro">HaGeZi Pro</option><option value="hagezi-tif">HaGeZi Threat Intelligence</option></select></label>
        <small>Preset เป็นตัวเลือกแหล่งรายการเท่านั้น ส่วนการ export ต้องมีตัวรายการโดเมนจริงก่อน จึงไม่สร้างข้อมูลปลอมแทนรายการจากเว็บภายนอก</small>
      </details>
      <details open><summary>Apple Payloads ในโปรไฟล์เดียว</summary>
        <div className="advanced-grid">
          <label className="check"><input type="checkbox" checked={applePayloads.dns} onChange={e=>setApplePayloads(x=>({...x,dns:e.target.checked}))}/>Encrypted DNS payload</label>
          <label className="check"><input type="checkbox" checked={applePayloads.webclip} onChange={e=>setApplePayloads(x=>({...x,webclip:e.target.checked}))}/>Web Clip / Web App payload</label>
          <label className="check"><input type="checkbox" checked={applePayloads.wifi} onChange={e=>setApplePayloads(x=>({...x,wifi:e.target.checked}))}/>Wi-Fi payload</label>
          <label className="check"><input type="checkbox" checked={applePayloads.vpn} onChange={e=>setApplePayloads(x=>({...x,vpn:e.target.checked}))}/>IKEv2 VPN payload</label>
          <label className="check"><input type="checkbox" checked={applePayloads.globalProxy} onChange={e=>setApplePayloads(x=>({...x,globalProxy:e.target.checked}))}/>Global HTTP Proxy payload</label>
        </div>
        {applePayloads.wifi&&<div className="advanced-grid">
          <label>Wi-Fi SSID<input value={wifiSSID} onChange={e=>setWifiSSID(e.target.value)} placeholder="MyWiFi"/></label>
          <label>Wi-Fi Password<input type="password" value={wifiPassword} onChange={e=>setWifiPassword(e.target.value)} placeholder="••••••••"/></label>
          <label className="check"><input type="checkbox" checked={wifiHidden} onChange={e=>setWifiHidden(e.target.checked)}/>Hidden Network</label>
        </div>}
        {applePayloads.vpn&&<div className="advanced-grid">
          <label>VPN Remote Address<input value={vpnRemoteAddress} onChange={e=>setVpnRemoteAddress(e.target.value)} placeholder="vpn.example.com"/></label>
          <label>VPN Remote Identifier<input value={vpnRemoteIdentifier} onChange={e=>setVpnRemoteIdentifier(e.target.value)} placeholder="vpn.example.com"/></label>
          <label>VPN Local Identifier<input value={vpnLocalIdentifier} onChange={e=>setVpnLocalIdentifier(e.target.value)} placeholder="user@example.com"/></label>
          <label>VPN Shared Secret<input type="password" value={vpnSharedSecret} onChange={e=>setVpnSharedSecret(e.target.value)} placeholder="Shared Secret"/></label>
        </div>}
      </details>
      <details><summary>{tr.advanced}</summary><div className="advanced-grid"><label>{tr.proxy}<input value={proxyServer} onChange={e=>setProxyServer(e.target.value)} placeholder="proxy.example.com:8080"/></label><label>Encrypted DNS URL<input value={dnsServerUrl} onChange={e=>setDnsServerUrl(e.target.value)} placeholder="https://dns.example.com/dns-query"/></label><label>DNS-over-TLS Server Name<input value={dnsServerName} onChange={e=>setDnsServerName(e.target.value)} placeholder="dns.quad9.net"/></label></div><label className="check"><input type="checkbox" checked={vpn} onChange={e=>setVpn(e.target.checked)}/>{tr.vpn}</label><label className="check"><input type="checkbox" checked={malware} onChange={e=>setMalware(e.target.checked)}/>{tr.malware}</label><label className="check"><input type="checkbox" checked={trackers} onChange={e=>setTrackers(e.target.checked)}/>{tr.trackers}</label></details>
    </section>
    <section className="card" id="destination"><div className="section-title"><div><span className="step">2</span><div><h2>{tr.step2.replace(/^2\. /,"")}</h2><p>{tr.targetHint}</p></div></div></div><div className="target-grid">{primaryFormats.map(format=><button key={format.id} type="button" className={target===format.id?"target-card selected":"target-card"} onClick={()=>selectTarget(format.id)}><strong>{format.label}</strong><span>{format.extension}</span><small>{format.description}</small></button>)}</div></section>
    <section className="card export-card" id="export"><div className="section-title"><div><span className="step">3</span><div><h2>{tr.step3.replace(/^3\. /,"")}</h2><p>{selectedFormat.label} · {selectedFormat.extension}</p></div></div></div>
      <div className={exportReady?"status ready":"status not-ready"}><strong>{exportReady?tr.ready:tr.notReady}</strong>{!exportReady&&<ul>{blocking.map((x,i)=><li key={i}>{x.message}</li>)}</ul>}</div>
      {isApple?<div className="install-box"><h3>{tr.apple}</h3><p>{tr.appleDesc}</p><button className="primary-action" type="button" disabled={!artifact} onClick={()=>{downloadFile("configuration-profile.mobileconfig",artifact,"application/x-apple-aspen-config");setMessage("ดาวน์โหลดโปรไฟล์แล้ว ไปที่ Settings > Profile Downloaded > Install")}}>{tr.downloadProfile}</button><ol><li>{tr.downloadProfile}</li><li>{tr.installSteps}</li></ol><small>iOS ไม่ติดตั้งโปรไฟล์แบบเงียบจากหน้าเว็บ ผู้ใช้ต้องยืนยันใน Settings ตามขั้นตอนของ Apple</small></div>:<div className="install-box"><h3>{tr.appExport}: {selectedFormat.label}</h3><p>{tr.appDesc}</p><button className="primary-action" type="button" disabled={!artifact} onClick={doShare}>{tr.share}</button><button className="secondary-action" type="button" disabled={!artifact} onClick={doDownload}>{tr.download}</button><p className="fallback">{tr.fallback}</p></div>}
      {(warnings.length>0||capabilityWarnings.length>0)&&<div className="warning"><strong>{tr.warning}</strong><ul>{warnings.map((w,i)=><li key={i}>{w.message}</li>)}{capabilityWarnings.map((w,i)=><li key={"cap-"+i}>{w.message}</li>)}</ul></div>}{message&&<div className="message" role="status">{message}</div>}
      <details className="technical-details"><summary>รายละเอียดทางเทคนิค</summary><pre>{artifact}</pre><h3>Capability</h3>{Object.entries(report.capabilities).map(([key,value])=><div className="row" key={key}><span>{key}</span><strong>{value.requested?value.state:"ไม่เลือก"}</strong></div>)}</details>
    </section>
  </main>;
}
createRoot(document.getElementById("root")).render(<App/>);
