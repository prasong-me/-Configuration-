import React,{useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import {compatibilityReport,redact} from "../../../packages/core/src/index.js";
import {compileSurge} from "../../../packages/surge-adapter/src/index.js";
import {
  exportFormats,
  getExportArtifact
} from "../../../packages/targets/src/exporters.js";
import "./style.css";

const targets=[
  {id:"example",label:"อ้างอิง / Core test"},
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

const exportBundle=()=>({
  schemaVersion:"0.3-test-bundle",
  generatedAt:new Date().toISOString(),
  policy:policyForExport,
  evidence:testEvidence,
  artifacts:Object.fromEntries(exportFormats.map(x=>[
    x.id,
    {file:`${x.id}${x.extension}`,status:x.status,content:getExportArtifact(x.id)}
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
  const [name,setName]=useState("My Privacy Profile");
  const [vpn,setVpn]=useState(false);
  const [dns,setDns]=useState(true);
  const [malware,setMalware]=useState(true);
  const [trackers,setTrackers]=useState(true);
  const [separateBlocking,setSeparateBlocking]=useState(true);
  const [target,setTarget]=useState("surge");

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

  return <main>
    <header>
      <h1>Network Configuration</h1>
      <p>จัดการ DNS, VPN, Routing และนโยบายบล็อกแยกจากกัน พร้อมส่งออกไฟล์ตามรูปแบบของแต่ละแอป</p>
    </header>

    <section className="grid">
      <div className="card">
        <h2>ตั้งค่าโปรไฟล์</h2>

        <label>ชื่อโปรไฟล์
          <input value={name} onChange={e=>setName(e.target.value)}/>
        </label>

        <label><input type="checkbox" checked={vpn} onChange={e=>setVpn(e.target.checked)}/> VPN / ตัวกลาง</label>
        <label><input type="checkbox" checked={dns} onChange={e=>setDns(e.target.checked)}/> DNS ปกติ</label>
        <label><input type="checkbox" checked={malware} onChange={e=>setMalware(e.target.checked)}/> บล็อก Malware</label>
        <label><input type="checkbox" checked={trackers} onChange={e=>setTrackers(e.target.checked)}/> บล็อก Tracker</label>
        <label><input type="checkbox" checked={separateBlocking} onChange={e=>setSeparateBlocking(e.target.checked)}/> แยกระบบบล็อกออกจาก DNS</label>

        <label>Target
          <select value={target} onChange={e=>setTarget(e.target.value)}>
            {targets.map(t=><option value={t.id} key={t.id}>{t.label}</option>)}
          </select>
        </label>

        <h3>ส่งออกไฟล์ทุกแอป</h3>
        <p className="muted">เลือกแอปเพื่อดูไฟล์ที่สร้างได้ แล้วดาวน์โหลดไปทดลองจริงทีละฟังก์ชัน</p>

        {exportFormats.map(format=>{
          const artifact=getExportArtifact(format.id);
          return <div className="export-item" key={format.id}>
            <div className="export-head">
              <strong>{format.label}</strong>
              <span className={`badge badge-${format.status}`}>{format.status}</span>
            </div>
            <small>{format.extension} — {format.description}</small>
            <button onClick={()=>{
              setTarget(format.id);
              download(`${format.id}-config${format.extension}`,artifact,format.mime);
            }}>
              Export {format.label}
            </button>
          </div>;
        })}

        <button onClick={()=>download("policy.json",JSON.stringify(policyForExport,null,2),"application/json")} disabled={!report.exportable}>
          Export Policy
        </button>
        <button onClick={()=>download("network-test-bundle.json",JSON.stringify(exportBundle(),null,2),"application/json")}>
          Export ข้อมูลการทดสอบทั้งหมด
        </button>
      </div>

      <div className="card">
        <h2>รูปแบบไฟล์ที่เลือก</h2>
        <div className="export-head">
          <strong>{selectedFormat.label}</strong>
          <span className={`badge badge-${selectedFormat.status}`}>{selectedFormat.status}</span>
        </div>
        <p>{selectedFormat.description}</p>
        <pre>{selectedArtifact}</pre>
        <button onClick={()=>download(`${selectedFormat.id}-config${selectedFormat.extension}`,selectedArtifact,selectedFormat.mime)}>
          Download {selectedFormat.label}
        </button>

        {target==="surge"&&<>
          <h3>Surge test pack</h3>
          <p>ทดสอบทีละความสามารถบนเครื่องจริง; ชุดนี้ไม่ฝัง Private Key, credential หรือ certificate</p>
          <pre>{surgeArtifact.content||surgeArtifact.error}</pre>
          {!surgeArtifact.error&&
            <button onClick={()=>download("surge-fixture.conf",surgeArtifact.content,"text/plain")}>
              Download fixture
            </button>
          }
        </>}

        <h3>ผลการรองรับ</h3>
        {Object.entries(report.capabilities).map(([f,x])=>
          <div className="row" key={f}>
            <span>{f}</span><strong>{x.requested?x.state:"NOT_REQUESTED"}</strong>
          </div>
        )}

        <h3>ข้อมูลจากการทดสอบ</h3>
        <pre>{JSON.stringify(testEvidence,null,2)}</pre>

        <h3>Diagnostics</h3>
        {report.diagnostics.length
          ? <ul>{report.diagnostics.map((d,i)=><li key={i}><strong>{d.level}</strong> {d.code}: {d.message}</li></ul>
          : <p>ไม่พบ Diagnostics</p>
        }

        <h3>Policy ที่สร้าง</h3>
        <pre>{JSON.stringify(policy,null,2)}</pre>
      </div>
    </section>
  </main>
}

createRoot(document.getElementById("root")).render(<App/>);