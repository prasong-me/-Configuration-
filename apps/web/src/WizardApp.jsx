import React,{useMemo,useState} from "react";
import {compatibilityReport} from "../../../packages/core/src/index.js";
import {exportFormats,getExportArtifact,getExportWarnings} from "../../../packages/targets/src/exporters.js";
import {recommendedDnsServices} from "../../../packages/catalog/src/recommended-dns.js";
import {configurationWizard} from "./wizard.js";
import {configurationWizardSteps} from "./wizard-steps.js";

const primaryTargets=["apple-mobileconfig","surge","shadowrocket","quantumult-x","wireguard","loon","stash","mihomo"];

const translations={
  th:{
    title:"Configuration Platform",
    subtitle:"สร้าง configuration ผ่านขั้นตอนที่ชัดเจน แล้วตรวจ compatibility ก่อนส่งออก",
    profileName:"ชื่อโปรไฟล์",
    next:"ถัดไป",back:"ย้อนกลับ",skip:"ข้ามขั้นตอน",skipped:"ข้ามแล้ว",reset:"เริ่มใหม่",
    intent:"Intent",source:"Source",dns:"DNS / Policy",target:"Target",compatibility:"Compatibility",review:"Review / Export",
    ready:"พร้อมส่งออก",notReady:"ต้องแก้ข้อมูลก่อนส่งออก",warning:"ข้อควรทราบ",
    apple:"ติดตั้งบน iPhone / iPad",appleDesc:"สร้าง .mobileconfig สำหรับติดตั้งผ่าน iOS Settings",
    downloadProfile:"ดาวน์โหลดโปรไฟล์ iOS",share:"ส่งไฟล์ไปยังแอป",download:"ดาวน์โหลดไฟล์",
    knowledge:"คู่มือ"
  },
  en:{
    title:"Configuration Platform",
    subtitle:"Build a configuration through explicit steps, then verify compatibility before export.",
    profileName:"Profile name",
    next:"Next",back:"Back",skip:"Skip step",skipped:"Skipped",reset:"Start over",
    intent:"Intent",source:"Source",dns:"DNS / Policy",target:"Target",compatibility:"Compatibility",review:"Review / Export",
    ready:"Ready to export",notReady:"Fix the configuration before exporting",warning:"Important",
    apple:"Install on iPhone / iPad",appleDesc:"Create a .mobileconfig for installation through iOS Settings.",
    downloadProfile:"Download iOS profile",share:"Send to app",download:"Download file",
    knowledge:"Guide"
  }
};

function makeBlob(name,text,mime){return new File([text],name,{type:mime});}
function downloadFile(name,text,mime){
  const blob=new Blob([text],{type:mime});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
}
async function shareFile(file){
  if(!navigator.share||!navigator.canShare||!navigator.canShare({files:[file]}))return false;
  try{await navigator.share({files:[file],title:file.name});return true}
  catch(error){return error?.name==="AbortError"}
}

export function WizardApp(){
  const [language,setLanguage]=useState("th");
  const tr=translations[language];
  const [name,setName]=useState("Configuration Standard");
  const [vpn,setVpn]=useState(false);
  const [dns,setDns]=useState(true);
  const [malware,setMalware]=useState(false);
  const [trackers,setTrackers]=useState(false);
  const [dnsProfiles,setDnsProfiles]=useState([
    {id:"privacy-dns",name:"Privacy DNS",preset:"cloudflare-standard",provider:"Cloudflare 1.1.1.1",protocol:"HTTPS",servers:["1.1.1.1","1.0.0.1"],endpoint:"https://cloudflare-dns.com/dns-query",role:"privacy",enabled:true,order:1},
    {id:"security-dns",name:"Security DNS",preset:"quad9-secure",provider:"Quad9 Secure",protocol:"HTTPS",servers:["9.9.9.9","149.112.112.112"],endpoint:"https://dns.quad9.net/dns-query",role:"security",enabled:true,order:2},
    {id:"backup-dns",name:"Backup DNS",preset:"google-public-dns",provider:"Google Public DNS",protocol:"HTTPS",servers:["8.8.8.8","8.8.4.4"],endpoint:"https://dns.google/dns-query",role:"resolver",enabled:true,order:3}
  ]);
  const [proxyServer,setProxyServer]=useState("");
  const [dnsServerUrl,setDnsServerUrl]=useState("https://cloudflare-dns.com/dns-query");
  const [dnsServerName,setDnsServerName]=useState("");
  const [target,setTarget]=useState("apple-mobileconfig");
  const [message,setMessage]=useState("");
  const [applePayloads,setApplePayloads]=useState({dns:true,webclip:true,wifi:false,vpn:false,globalProxy:false});
  const [wifiSSID,setWifiSSID]=useState("");
  const [wifiPassword,setWifiPassword]=useState("");
  const [wifiHidden,setWifiHidden]=useState(false);
  const [vpnRemoteAddress,setVpnRemoteAddress]=useState("");
  const [vpnRemoteIdentifier,setVpnRemoteIdentifier]=useState("");
  const [vpnLocalIdentifier,setVpnLocalIdentifier]=useState("");
  const [vpnSharedSecret,setVpnSharedSecret]=useState("");
  const [blockedDomains,setBlockedDomains]=useState("");
  const [blockPreset,setBlockPreset]=useState("custom");
  const [routingAction,setRoutingAction]=useState("DIRECT");
  const [proxyType,setProxyType]=useState("HTTP");
  const [skippedSteps,setSkippedSteps]=useState(()=>new Set());

  const policy=useMemo(()=>({
    version:"0.5",
    policy:{
      name,vpn,dns,routing:vpn,
      blocking:{malware,trackers,separateFromResolver:true},
      dnsProfiles:dns?dnsProfiles:[],
      dnsServers:dns&&dnsProfiles[0]?dnsProfiles[0].servers:[],
      proxyServer:proxyServer.trim(),
      dnsProtocol:dnsProfiles[0]?.protocol||"HTTPS",
      dnsServerUrl:dnsProfiles[0]?.endpoint||dnsServerUrl,
      dnsServerName,
      webAppUrl:window.location.href.split("#")[0],
      dnsDomains:[],
      rules:[{match:"*.*",action:routingAction}],
      finalPolicy:"DIRECT",bypassSystem:true,
      webEntry:{name:"Configuration Platform",url:window.location.href.split("#")[0],enabled:true},
      applePayloads,wifiSSID,wifiPassword,wifiHidden,
      vpnRemoteAddress,vpnRemoteIdentifier,vpnLocalIdentifier,vpnSharedSecret,
      blockedDomains:blockedDomains.split(/[\s,]+/).map(x=>x.trim()).filter(Boolean),
      routingAction,proxyType
    }
  }),[name,vpn,dns,dnsProfiles,proxyServer,dnsServerUrl,dnsServerName,routingAction,applePayloads,wifiSSID,wifiPassword,wifiHidden,vpnRemoteAddress,vpnRemoteIdentifier,vpnLocalIdentifier,vpnSharedSecret,blockedDomains,proxyType]);

  const selectedFormat=exportFormats.find(x=>x.id===target)||exportFormats[0];
  const artifact=getExportArtifact(selectedFormat.id,policy);
  const warnings=getExportWarnings(selectedFormat.id,policy);
  const report=useMemo(()=>compatibilityReport(policy,target),[policy,target]);
  const blocking=report.diagnostics.filter(x=>(x.level==="CRITICAL"||x.level==="HIGH")&&x.code!=="CAPABILITY_UNKNOWN");
  const capabilityWarnings=report.diagnostics.filter(x=>x.code==="CAPABILITY_UNKNOWN");
  const exportReady=Boolean(artifact)&&blocking.length===0;
  const isApple=target==="apple-mobileconfig";
  const primaryFormats=primaryTargets.map(id=>exportFormats.find(x=>x.id===id)).filter(Boolean);
  const stepper=configurationWizard.useStepper({linear:true});

  const selectTarget=id=>{setTarget(id);setMessage("")};
  const doDownload=()=>{downloadFile(`${selectedFormat.id}-config${selectedFormat.extension}`,artifact,selectedFormat.mime);setMessage(language==="th"?"ดาวน์โหลดไฟล์แล้ว":"File downloaded")};
  const doShare=async()=>{
    const file=makeBlob(`${selectedFormat.id}-config${selectedFormat.extension}`,artifact,selectedFormat.mime);
    if(await shareFile(file)){setMessage(language==="th"?"เปิดเมนูแชร์แล้ว":"Share sheet opened");return}
    doDownload();
    setMessage(language==="th"?"อุปกรณ์นี้ไม่รองรับการส่งไฟล์เข้าแอปโดยตรง จึงดาวน์โหลดไฟล์แทน":"Direct app sharing is unavailable; the file was downloaded instead.");
  };
  const next=async()=>{
    if(stepper.canNext){await stepper.next()}
  };
  const skip=async()=>{
    if(!stepper.current.skippable||!stepper.canNext)return;
    setSkippedSteps(previous=>new Set(previous).add(stepper.id));
    await stepper.next();
  };
  const reset=async()=>{
    await stepper.reset();
    setSkippedSteps(new Set());
    setMessage("");
  };

  const stepTitle=step=>tr[step.id]||step.title;

  return <main>
    <header className="hero">
      <div className="language-menu"><label>ภาษา<select value={language} onChange={e=>setLanguage(e.target.value)}><option value="th">ไทย</option><option value="en">English</option></select></label></div>
      <div className="hero-badge">Configuration Compiler · Wizard</div>
      <h1>{tr.title}</h1><p>{tr.subtitle}</p>
      <div className="wizard-meta"><span>Step {stepper.index+1} / {stepper.count}</span><a href="./knowledge.html">{tr.knowledge}</a></div>
    </header>

    <section className="wizard-shell" aria-label="Configuration wizard">
      <ol className="wizard-progress">
        {configurationWizardSteps.map((step,index)=>{
          const state=index===stepper.index?"active":index<stepper.index?"previous":"upcoming";
          return <li key={step.id} className={`wizard-step ${state}`}>
            <button type="button" onClick={()=>index<=stepper.index&&stepper.goTo(step.id)} disabled={index>stepper.index} aria-current={state==="active"?"step":undefined}>
              <span className="wizard-index">{index+1}</span><span><strong>{stepTitle(step)}</strong><small>{step.description}</small></span>
            </button>
            {index<configurationWizardSteps.length-1&&<span className="wizard-connector" aria-hidden="true"/>}
          </li>
        })}
      </ol>

      <section className="card wizard-panel">
        <div className="section-title">
          <div><span className="step">{stepper.index+1}</span><div><h2>{stepTitle(stepper.current)}</h2><p>{stepper.current.description}</p></div></div>
        </div>

        {stepper.is("intent")&&<div className="wizard-content">
          <p>เริ่มจากความตั้งใจของ configuration ก่อน แล้วค่อยเลือก source, DNS/policy และ target โดยไม่ผูก Core เข้ากับแอปใดแอปหนึ่ง</p>
          <label>{tr.profileName}<input value={name} onChange={e=>setName(e.target.value)} placeholder="เช่น My DNS Profile"/></label>
          <div className="info-grid"><div><strong>Core-first</strong><span>เก็บความหมายของ configuration ไว้ใน canonical policy</span></div><div><strong>Target isolation</strong><span>exporter เป็นผู้แปลงตาม capability ของแต่ละ target</span></div><div><strong>Evidence-aware</strong><span>ไม่อ้างว่าใช้งานจริงเพียงเพราะสร้างไฟล์ได้</span></div></div>
        </div>}

        {stepper.is("source")&&<div className="wizard-content">
          <p>กำหนด building blocks ที่ configuration อาจใช้ได้ ขั้นนี้ไม่สร้าง payload ใด ๆ จนกว่าจะเลือก target และ capability ที่รองรับ</p>
          <div className="advanced-grid">
            <label>Proxy type<select value={proxyType} onChange={e=>setProxyType(e.target.value)}><option>HTTP</option><option>HTTPS</option><option>SOCKS5</option></select></label>
            <label>Routing action<select value={routingAction} onChange={e=>setRoutingAction(e.target.value)}><option value="DIRECT">DIRECT</option><option value="PROXY">PROXY</option><option value="REJECT">REJECT / BLOCK</option><option value="DNS">DNS</option></select></label>
          </div>
          <label>Proxy Server<input value={proxyServer} onChange={e=>setProxyServer(e.target.value)} placeholder="proxy.example.com:8080"/></label>
          <label>Blocked domains<textarea value={blockedDomains} onChange={e=>setBlockedDomains(e.target.value)} rows="4" placeholder="example.com\nads.example.com\ntracker.example.com"/></label>
          <label>Blocklist preset<select value={blockPreset} onChange={e=>{setBlockPreset(e.target.value);if(e.target.value!=="custom")setBlockedDomains("")}}><option value="custom">Custom domains</option><option value="oisd-small">OISD Small</option><option value="hagezi-pro">HaGeZi Pro</option><option value="hagezi-tif">HaGeZi Threat Intelligence</option></select></label>
          <small>Preset เป็นเพียงการเลือกแหล่งรายการ ระบบจะไม่สร้างโดเมนปลอมแทนข้อมูลจากแหล่งภายนอก</small>
          <label className="check"><input type="checkbox" checked={vpn} onChange={e=>setVpn(e.target.checked)}/>เปิดใช้ VPN / Routing</label>
          <label className="check"><input type="checkbox" checked={malware} onChange={e=>setMalware(e.target.checked)}/>บล็อก Malware</label>
          <label className="check"><input type="checkbox" checked={trackers} onChange={e=>setTrackers(e.target.checked)}/>บล็อก Tracker</label>
        </div>}

        {stepper.is("dns")&&<div className="wizard-content">
          <label className="check"><input type="checkbox" checked={dns} onChange={e=>setDns(e.target.checked)}/>เปิดใช้ DNS configuration</label>
          {dnsProfiles.map((profile,index)=><div className="dns-profile-card" key={profile.id}>
            <div className="advanced-grid">
              <label>ชื่อชุด DNS<input value={profile.name} onChange={e=>setDnsProfiles(list=>list.map((p,i)=>i===index?{...p,name:e.target.value}:p))}/></label>
              <label>บริการ DNS<select value={profile.preset} onChange={e=>{const preset=recommendedDnsServices.find(x=>x.id===e.target.value);setDnsProfiles(list=>list.map((p,i)=>i===index?{...p,preset:e.target.value,provider:preset?.provider||"Custom",servers:preset?[...preset.ipv4,...preset.ipv6]:p.servers,protocol:preset?.doh?"HTTPS":preset?.dot?"TLS":p.protocol,endpoint:preset?.doh||p.endpoint}:p))}}>{recommendedDnsServices.map(x=><option key={x.id} value={x.id}>{x.provider} · {x.description}</option>)}</select></label>
              <label>Protocol<select value={profile.protocol} onChange={e=>setDnsProfiles(list=>list.map((p,i)=>i===index?{...p,protocol:e.target.value}:p))}><option value="HTTPS">DNS-over-HTTPS</option><option value="TLS">DNS-over-TLS</option><option value="PLAIN">Plain DNS</option></select></label>
              <label>บทบาท<select value={profile.role} onChange={e=>setDnsProfiles(list=>list.map((p,i)=>i===index?{...p,role:e.target.value}:p))}><option value="resolver">Resolver</option><option value="security">Security / Threat</option><option value="privacy">Privacy</option><option value="custom">Custom</option></select></label>
            </div>
            <label>DNS Servers<textarea value={profile.servers.join("\n")} rows="2" onChange={e=>setDnsProfiles(list=>list.map((p,i)=>i===index?{...p,servers:e.target.value.split(/[,\s]+/).map(x=>x.trim()).filter(Boolean)}:p))}/></label>
            <label>Endpoint<input value={profile.endpoint} onChange={e=>setDnsProfiles(list=>list.map((p,i)=>i===index?{...p,endpoint:e.target.value}:p))} placeholder="https://dns.example/dns-query"/></label>
            <label className="check"><input type="checkbox" checked={profile.enabled} onChange={e=>setDnsProfiles(list=>list.map((p,i)=>i===index?{...p,enabled:e.target.checked}:p))}/>เปิดใช้ชุดนี้</label>
          </div>)}
          <div className="advanced-grid">
            <label>Encrypted DNS URL<input value={dnsServerUrl} onChange={e=>setDnsServerUrl(e.target.value)} placeholder="https://dns.example.com/dns-query"/></label>
            <label>DNS-over-TLS Server Name<input value={dnsServerName} onChange={e=>setDnsServerName(e.target.value)} placeholder="dns.quad9.net"/></label>
          </div>
        </div>}

        {stepper.is("target")&&<div className="wizard-content">
          <p>Target เป็น adapter boundary ของระบบ เลือกเฉพาะรูปแบบที่ต้องการส่งออก</p>
          <div className="target-grid">{primaryFormats.map(format=><button key={format.id} type="button" className={target===format.id?"target-card selected":"target-card"} onClick={()=>selectTarget(format.id)}><strong>{format.label}</strong><span>{format.extension}</span><small>{format.description}</small></button>)}</div>
          <details open><summary>Apple Payloads</summary>
            <div className="advanced-grid">
              {Object.entries({dns:"Encrypted DNS payload",webclip:"Web Clip / Web App payload",wifi:"Wi-Fi payload",vpn:"IKEv2 VPN payload",globalProxy:"Global HTTP Proxy payload"}).map(([key,label])=><label className="check" key={key}><input type="checkbox" checked={applePayloads[key]} onChange={e=>setApplePayloads(x=>({...x,[key]:e.target.checked}))}/>{label}</label>)}
            </div>
            {applePayloads.wifi&&<div className="advanced-grid"><label>Wi-Fi SSID<input value={wifiSSID} onChange={e=>setWifiSSID(e.target.value)}/></label><label>Wi-Fi Password<input type="password" value={wifiPassword} onChange={e=>setWifiPassword(e.target.value)}/></label><label className="check"><input type="checkbox" checked={wifiHidden} onChange={e=>setWifiHidden(e.target.checked)}/>Hidden Network</label></div>}
            {applePayloads.vpn&&<div className="advanced-grid"><label>VPN Remote Address<input value={vpnRemoteAddress} onChange={e=>setVpnRemoteAddress(e.target.value)}/></label><label>VPN Remote Identifier<input value={vpnRemoteIdentifier} onChange={e=>setVpnRemoteIdentifier(e.target.value)}/></label><label>VPN Local Identifier<input value={vpnLocalIdentifier} onChange={e=>setVpnLocalIdentifier(e.target.value)}/></label><label>VPN Shared Secret<input type="password" value={vpnSharedSecret} onChange={e=>setVpnSharedSecret(e.target.value)}/></label></div>}
          </details>
        </div>}

        {stepper.is("compatibility")&&<div className="wizard-content">
          <div className={exportReady?"status ready":"status not-ready"}><strong>{exportReady?tr.ready:tr.notReady}</strong>{blocking.length>0&&<ul>{blocking.map((x,i)=><li key={i}>{x.message}</li>)}</ul>}</div>
          <div className="compatibility-list">{Object.entries(report.capabilities).map(([key,value])=><div className="row" key={key}><span>{key}</span><strong>{value.requested?value.state:"ไม่เลือก"}</strong></div>)}</div>
          {(warnings.length>0||capabilityWarnings.length>0)&&<div className="warning"><strong>{tr.warning}</strong><ul>{warnings.map((w,i)=><li key={i}>{w.message}</li>)}{capabilityWarnings.map((w,i)=><li key={"cap-"+i}>{w.message}</li>)}</ul></div>}
        </div>}

        {stepper.is("review")&&<div className="wizard-content">
          <div className={exportReady?"status ready":"status not-ready"}><strong>{exportReady?tr.ready:tr.notReady}</strong>{blocking.length>0&&<ul>{blocking.map((x,i)=><li key={i}>{x.message}</li>)}</ul>}</div>
          <div className="row"><span>Profile</span><strong>{name}</strong></div>
          <div className="row"><span>Target</span><strong>{selectedFormat.label}</strong></div>
          <div className="row"><span>Format</span><strong>{selectedFormat.extension}</strong></div>
          <div className="row"><span>DNS profiles</span><strong>{dns?dnsProfiles.filter(x=>x.enabled).length:0}</strong></div>
          {isApple?<div className="install-box"><h3>{tr.apple}</h3><p>{tr.appleDesc}</p><button className="primary-action" type="button" disabled={!exportReady} onClick={()=>{downloadFile("configuration-profile.mobileconfig",artifact,"application/x-apple-aspen-config");setMessage(language==="th"?"ดาวน์โหลดโปรไฟล์แล้ว ไปที่ Settings > Profile Downloaded > Install":"Profile downloaded; open Settings > Profile Downloaded > Install")}}>{tr.downloadProfile}</button><ol><li>{tr.downloadProfile}</li><li>Settings &gt; Profile Downloaded &gt; Install</li></ol></div>:<div className="install-box"><h3>{selectedFormat.label}</h3><p>ใช้ Share Sheet ของอุปกรณ์หรือดาวน์โหลดไฟล์เพื่อนำเข้าในแอปปลายทาง</p><button className="primary-action" type="button" disabled={!exportReady} onClick={doShare}>{tr.share}</button><button className="secondary-action" type="button" disabled={!exportReady} onClick={doDownload}>{tr.download}</button></div>}
          {message&&<div className="message" role="status">{message}</div>}
          <details className="technical-details"><summary>รายละเอียดทางเทคนิค</summary><pre>{artifact}</pre></details>
        </div>}

        <footer className="wizard-actions">
          <button className="secondary-action wizard-button" type="button" disabled={!stepper.canPrev||stepper.isPending} onClick={()=>stepper.prev()}>{tr.back}</button>
          <button className="secondary-action wizard-button" type="button" onClick={reset}>{tr.reset}</button>
          {stepper.current.skippable&&stepper.canNext&&<button className="secondary-action wizard-button" type="button" disabled={stepper.isPending} onClick={skip}>{skippedSteps.has(stepper.id)?tr.skipped:tr.skip}</button>}
          {!stepper.isLast&&<button className="primary-action wizard-button" type="button" disabled={!stepper.canNext||stepper.isPending} onClick={next}>{tr.next}</button>}
        </footer>
      </section>
    </section>
  </main>;
}
