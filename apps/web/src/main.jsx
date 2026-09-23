import React,{useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import {compatibilityReport,redact} from "../../../packages/core/src/index.js";
import {compileSurge} from "../../../packages/surge-adapter/src/index.js";
import {
  exportFormats,
  getExportArtifact
} from "../../../packages/targets/src/exporters.js";
import "./style.css";


const translations={
  th:{
    language:"ภาษา",thai:"ไทย",english:"English",title:"Network Configuration",subtitle:"จัดการ DNS, VPN, Routing และนโยบายบล็อกแยกจากกัน พร้อมส่งออกไฟล์ตามรูปแบบของแต่ละแอป",profile:"ตั้งค่าโปรไฟล์",profileName:"ชื่อโปรไฟล์",vpn:"VPN / ตัวกลาง",dns:"DNS ปกติ",malware:"บล็อก Malware",trackers:"บล็อก Tracker",separate:"แยกระบบบล็อกออกจาก DNS",target:"Target",configGuide:"กำหนดค่าและแนวทางส่งคอนฟิก",guideIntro:"เลือกแอป → เลือกฟังก์ชัน → ดูจุดกำหนดค่า → ทำตามขั้นตอนทดสอบจริงทีละฟังก์ชัน",appTarget:"แอปเป้าหมาย",configPoint:"จุดกำหนดค่า",testMethod:"วิธีทดสอบ",exportTest:"ส่งออกชุดทดสอบฟังก์ชันนี้",preflight:"ตรวจสอบก่อนส่งออก",preflightOk:"ผ่านการตรวจสอบเชิงโครงสร้าง",preflightBlocked:"หยุดการส่งออกอัตโนมัติ",noBlocking:"ไม่มี diagnostic ระดับที่บล็อกการส่งออก",preflightNote:"ปุ่มส่งออก target จะเปิดก็ต่อเมื่อ target/function นั้นผ่านการตรวจ syntax + adapter + evidence จริงแล้ว",fullExport:"ส่งออกโปรไฟล์เต็ม",exportPolicy:"Export Policy",exportEvidence:"Export ข้อมูลการทดสอบทั้งหมด",format:"รูปแบบไฟล์ที่เลือก",download:"Download",surgePack:"Surge test pack",surgeNote:"ทดสอบทีละความสามารถบนเครื่องจริง; ชุดนี้ไม่ฝัง Private Key, credential หรือ certificate",downloadFixture:"Download fixture",support:"ผลการรองรับ",evidence:"ข้อมูลจากการทดสอบ",diagnostics:"Diagnostics",noDiagnostics:"ไม่พบ Diagnostics",generatedPolicy:"Policy ที่สร้าง",reference:"อ้างอิง / Core test"},
  en:{
    language:"Language",thai:"ไทย",english:"English",title:"Network Configuration",subtitle:"Manage DNS, VPN, Routing and separate blocking policies, with exports tailored to each app.",profile:"Profile settings",profileName:"Profile name",vpn:"VPN / Intermediary",dns:"Normal DNS",malware:"Block Malware",trackers:"Block Trackers",separate:"Separate blocking from DNS",target:"Target",configGuide:"Configuration and test guidance",guideIntro:"Select an app → select a function → review the configuration point → test one function at a time on the real app.",appTarget:"Target app",configPoint:"Configuration point",testMethod:"Test method",exportTest:"Export function test pack",preflight:"Pre-export check",preflightOk:"Structural checks passed",preflightBlocked:"Export automatically blocked",noBlocking:"No blocking-level diagnostics",preflightNote:"Target export is enabled only when the target/function has verified syntax, adapter support and real evidence.",fullExport:"Full profile export",exportPolicy:"Export Policy",exportEvidence:"Export all test evidence",format:"Selected file format",download:"Download",surgePack:"Surge test pack",surgeNote:"Test each capability on the real device; this pack contains no private key, credential or certificate.",downloadFixture:"Download fixture",support:"Support status",evidence:"Test evidence",diagnostics:"Diagnostics",noDiagnostics:"No diagnostics",generatedPolicy:"Generated Policy",reference:"Reference / Core test"}
};

const targets=[
  {id:"example",label:translations.th.reference},
  ...exportFormats.map(x=>({id:x.id,label:x.label}))
];

const surgeExample={dnsServers:["1.1.1.1","1.0.0.1"],rules:[],finalPolicy:"DIRECT"};

const testEvidence={
  dns:{
    tested:["1.1.1.1","1.0.0.1"],
    effectiveDns:"1.1.1.1, 1.0.0.1",
    systemDns:"94.140.14.15, 94.140.14.16",
    note:"The log showed DNS resolution attempts against the configured Cloudflare resolvers. This does not by itself prove that every DNS query used only these servers."
  },
  network:{
    wifiIp:"192.168.1.42",
    defaultGateway:"192.168.1.1",
    vpnIp:"10.2.0.2",
    dnsReportedBySystem:"10.2.0.1",
    externalIpv4:"130.195.242.30",
    note:"10.2.0.2 is the reported VPN interface address; 192.168.1.42 is the Wi-Fi address."
  },
  architecture:{
    normalDns:"DNS resolves domains normally; blocking is a separate policy.",
    intermediary:"App → TUN/VPN → intermediary/proxy → DNS/connection → external server.",
    domainVisibility:"The app may still know the domain it requested. The exported model does not claim to hide that domain.",
    routeVisibility:"The model treats the downstream route/proxy as an intermediary detail; actual concealment depends on the target runtime."
  },
  blockPolicy:{
    enabledSeparately:true,
    description:"Optional domain blocking is a separate policy and is not enabled as a permanent replacement for normal DNS.",
    modes:["Normal resolver","Family/filtering resolver","Explicit blocklist"]
  }
};

const buildExportBundle=(policyForExport)=>({
  schemaVersion:"0.3-test-bundle",
  generatedAt:new Date().toISOString(),
  policy:policyForExport,
  evidence:testEvidence,
  artifacts:Object.fromEntries(exportFormats.map(x=>[
    x.id,
    {file:x.id+x.extension,status:x.status,content:getExportArtifact(x.id)}
  ])),
  safety:{
    secretsExcluded:true,
    privateKeysExcluded:true,
    claim:"This bundle records tested behavior and configuration intent; it does not claim that a target runtime can hide its DNS provider from an application."
  }
});

function download(name,text,mime){
  const blob=new Blob([text],{type:mime});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=name;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),0);
}

function App(){
  const [language,setLanguage]=useState("th");
  const tr=translations[language];
  const [name,setName]=useState("My Privacy Profile");
  const [vpn,setVpn]=useState(false);
  const [dns,setDns]=useState(true);
  const [malware,setMalware]=useState(true);
  const [trackers,setTrackers]=useState(true);
  const [separateBlocking,setSeparateBlocking]=useState(true);
  const [target,setTarget]=useState("surge");
  const [selectedFunction,setSelectedFunction]=useState("dns");

  const policy=useMemo(()=>({
    version:"0.3",
    policy:{
      name,
      vpn,
      dns,
      routing:!!vpn,
      blocking:{
        malware,
        trackers,
        separateFromResolver:separateBlocking
      },
      architecture:{
        normalDns:true,
        intermediary:true,
        appMaySeeRequestedDomain:true,
        hideResolverIdentityFromApp:"not-guaranteed"
      }
    }
  }),[name,vpn,dns,malware,trackers,separateBlocking]);

  const policyForExport=redact(policy);
  const report=useMemo(()=>compatibilityReport(policy,target==="example"?"surge":target),[policy,target]);

  const surgeArtifact=useMemo(()=>{
    try{return compileSurge({policy:surgeExample});}
    catch(e){return {error:e.message};}
  },[]);

  const selectedFormat=exportFormats.find(x=>x.id===target)||exportFormats[0];
  const selectedArtifact=getExportArtifact(selectedFormat.id);
  const functions=selectedFormat.functions||[];
  const activeFunction=functions.find(x=>x.id===selectedFunction)||functions[0];
  const preflight=useMemo(()=>compatibilityReport(policy,target),[policy,target]);
  const exportAllowed=preflight.exportable && selectedFormat.status==="verified";
  const exportBlockReasons=preflight.diagnostics.filter(d=>d.level==="CRITICAL"||d.level==="HIGH");

  return <main>
    <header>
      <div className="language-menu"><label>{tr.language}<select value={language} onChange={e=>setLanguage(e.target.value)}><option value="th">{tr.thai}</option><option value="en">{tr.english}</option></select></label></div>
      <h1>{tr.title}</h1>
      <p>{tr.subtitle}</p>
    </header>

    <section className="grid">
      <div className="card">
        <h2>{tr.profile}</h2>

        <label>{tr.profileName}
          <input value={name} onChange={e=>setName(e.target.value)}/>
        </label>

        <label><input type="checkbox" checked={vpn} onChange={e=>setVpn(e.target.checked)}/> {tr.vpn}</label>
        <label><input type="checkbox" checked={dns} onChange={e=>setDns(e.target.checked)}/> {tr.dns}</label>
        <label><input type="checkbox" checked={malware} onChange={e=>setMalware(e.target.checked)}/> {tr.malware}</label>
        <label><input type="checkbox" checked={trackers} onChange={e=>setTrackers(e.target.checked)}/> {tr.trackers}</label>
        <label><input type="checkbox" checked={separateBlocking} onChange={e=>setSeparateBlocking(e.target.checked)}/> {tr.separate}</label>

        <label>{tr.target}
          <select value={target} onChange={e=>setTarget(e.target.value)}>
            {targets.map(t=><option value={t.id} key={t.id}>{t.label}</option>)}
          </select>
        </label>

        <h3>{tr.configGuide}</h3>
        <p className="muted">{tr.guideIntro}</p>

        <label>{tr.appTarget}
          <select value={target} onChange={e=>{
            setTarget(e.target.value);
            setSelectedFunction("dns");
          }}>
            {exportFormats.map(t=><option value={t.id} key={t.id}>{t.label}</option>)}
          </select>
        </label>

        <div className="function-list">
          {functions.map(fn=>
            <button
              className={activeFunction?.id===fn.id?"function-button active":"function-button"}
              key={fn.id}
              onClick={()=>setSelectedFunction(fn.id)}
            >
              {fn.title}
            </button>
          )}
        </div>

        {activeFunction&&<div className="guide-panel">
          <div className="export-head">
            <strong>{activeFunction.title}</strong>
            <span className="badge badge-template">TEST</span>
          </div>
          <div className="guide-row">
            <span>{tr.configPoint}</span>
            <code>{activeFunction.config}</code>
          </div>
          <div className="guide-row">
            <span>{tr.testMethod}</span>
            <p>{activeFunction.test}</p>
          </div>
          <button disabled={!exportAllowed} onClick={()=>{
            const guide={
              target:selectedFormat.label,
              function:activeFunction,
              artifact:getExportArtifact(selectedFormat.id),
              note:"ใช้เป็นชุดอ้างอิงสำหรับทดสอบฟังก์ชันนี้บนแอปจริง; ห้ามถือว่าเป็นผลยืนยันจนกว่าจะทดสอบจริง"
            };
            download(
              `${selectedFormat.id}-${activeFunction.id}-test.json`,
              JSON.stringify(guide,null,2),
              "application/json"
            );
          }}>
            ส่งออกชุดทดสอบฟังก์ชันนี้
          </button>
        </div>}

        <h3>{tr.preflight}</h3>
        <div className={`preflight ${exportAllowed?"preflight-ok":"preflight-blocked"}`}>
          <strong>{exportAllowed?tr.preflightOk:tr.preflightBlocked}</strong>
          {exportBlockReasons.length>0
            ? <ul>{exportBlockReasons.map((d,i)=><li key={i}>{d.code}: {d.message}</li>)}</ul>
            : <p>{tr.noBlocking}</p>}
          <small>{tr.preflightNote}</small>
        </div>

        <h3>{tr.fullExport}</h3>
        <div className="export-item">
          <div className="export-head">
            <strong>{selectedFormat.label}</strong>
            <span className={`badge badge-${selectedFormat.status}`}>{selectedFormat.status}</span>
          </div>
          <small>{selectedFormat.extension} — {selectedFormat.description}</small>
          <button onClick={()=>{
            const artifact=getExportArtifact(selectedFormat.id);
            download(`${selectedFormat.id}-config${selectedFormat.extension}`,artifact,selectedFormat.mime);
          }}>
            Export {selectedFormat.label}
          </button>
        </div>

        <button onClick={()=>download("policy.json",JSON.stringify(policyForExport,null,2),"application/json")} disabled={!exportAllowed}>
          Export Policy
        </button>
        <button disabled={!exportAllowed} onClick={()=>download("network-test-bundle.json",JSON.stringify(buildExportBundle(policyForExport),null,2),"application/json")}>
          Export ข้อมูลการทดสอบทั้งหมด
        </button>
      </div>

      <div className="card">
        <h2>{tr.format}</h2>
        <div className="export-head">
          <strong>{selectedFormat.label}</strong>
          <span className={`badge badge-${selectedFormat.status}`}>{selectedFormat.status}</span>
        </div>
        <p>{selectedFormat.description}</p>
        <pre>{selectedArtifact}</pre>
        <button disabled={!exportAllowed} onClick={()=>download(`${selectedFormat.id}-config${selectedFormat.extension}`,selectedArtifact,selectedFormat.mime)}>
          Download {selectedFormat.label}
        </button>

        {target==="surge"&&<>
          <h3>{tr.surgePack}</h3>
          <p>{tr.surgeNote}</p>
          <pre>{surgeArtifact.content||surgeArtifact.error}</pre>
          {!surgeArtifact.error&&
            <button disabled={!exportAllowed} onClick={()=>download("surge-fixture.conf",surgeArtifact.content,"text/plain")}>
              Download fixture
            </button>
          }
        </>}

        <h3>{tr.support}</h3>
        {Object.entries(report.capabilities).map(([f,x])=>
          <div className="row" key={f}>
            <span>{f}</span><strong>{x.requested?x.state:"NOT_REQUESTED"}</strong>
          </div>
        )}

        <h3>{tr.evidence}</h3>
        <pre>{JSON.stringify(testEvidence,null,2)}</pre>

        <h3>{tr.diagnostics}</h3>
        {report.diagnostics.length
          ? <ul>{report.diagnostics.map((d,i)=><li key={i}><strong>{d.level}</strong> {d.code}: {d.message}</li></ul>
          : <p>{tr.noDiagnostics}</p>
        }

        <h3>{tr.generatedPolicy}</h3>
        <pre>{JSON.stringify(policy,null,2)}</pre>
      </div>
    </section>
  </main>
}

createRoot(document.getElementById("root")).render(<App/>);