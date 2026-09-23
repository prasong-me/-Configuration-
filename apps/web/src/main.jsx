import React,{useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import {compatibilityReport,redact} from "../../../packages/core/src/index.js";
import {compileSurge} from "../../../packages/surge-adapter/src/index.js";
import "./style.css";

const targets=[
  {id:"example",label:"Reference / Core test"},
  {id:"surge",label:"Surge 5 — evidence-only"},
  {id:"wireguard",label:"WireGuard — template/evidence-only"},
  {id:"shadowrocket",label:"Shadowrocket — tested DNS evidence-only"}
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

const wireGuardTemplate=`[Interface]
PrivateKey = <REPLACE_WITH_NEW_PRIVATE_KEY>
Address = 10.7.0.10/24
DNS = 1.1.1.1, 1.0.0.1

[Peer]
PublicKey = <PEER_PUBLIC_KEY>
AllowedIPs = 10.7.0.1/32
Endpoint = 127.0.0.1:51820
PersistentKeepalive = 25
`;

const shadowrocketEvidence=`[General]
dns-server = 1.1.1.1, 1.0.0.1

# Evidence-only test values from the current test cycle.
# Do not add "system" when the goal is to keep Effective DNS separate
# from the Wi-Fi/router DNS.
#
# Tested system DNS observed separately:
# 94.140.14.15, 94.140.14.16
`;

const exportBundle=()=>({
  schemaVersion:"0.2-test-bundle",
  generatedAt:new Date().toISOString(),
  policy:policyForExport,
  evidence:testEvidence,
  artifacts:{
    wireguardTemplate:wireGuardTemplate,
    shadowrocketEvidence:shadowrocketEvidence
  },
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
    version:"0.2",
    policy:{
      name,
      vpn,
      dns,
      routing:!!vpn,
      blocking:{
        malware,
        trackers,
        separateFromResolver:true
      },
      architecture:{
        normalDns:true,
        intermediary:true,
        appMaySeeRequestedDomain:true,
        hideResolverIdentityFromApp:"not-guaranteed"
      }
    }
  }),[name,vpn,dns,malware,trackers]);

  const policyForExport=redact(policy);
  const report=useMemo(()=>compatibilityReport(policy,target),[policy,target]);

  const surgeArtifact=useMemo(()=>{
    try{return compileSurge({policy:surgeExample});}
    catch(e){return {error:e.message};}
  },[]);

  return <main>
    <header>
      <h1>Configuration Platform</h1>
      <p>Evidence-first configuration builder for DNS, VPN, routing and separate blocking policies.</p>
    </header>

    <section className="grid">
      <div className="card">
        <h2>Policy Builder</h2>

        <label>Profile name
          <input value={name} onChange={e=>setName(e.target.value)}/>
        </label>

        <label><input type="checkbox" checked={vpn} onChange={e=>setVpn(e.target.checked)}/> VPN / intermediary</label>
        <label><input type="checkbox" checked={dns} onChange={e=>setDns(e.target.checked)}/> Normal DNS resolution</label>
        <label><input type="checkbox" checked={malware} onChange={e=>setMalware(e.target.checked)}/> Malware blocking policy</label>
        <label><input type="checkbox" checked={trackers} onChange={e=>setTrackers(e.target.checked)}/> Tracker blocking policy</label>
        <label><input type="checkbox" checked={separateBlocking} onChange={e=>setSeparateBlocking(e.target.checked)}/> Keep blocking as a separate policy</label>

        <label>Target
          <select value={target} onChange={e=>setTarget(e.target.value)}>
            {targets.map(t=><option value={t.id} key={t.id}>{t.label}</option>)}
          </select>
        </label>

        <h3>Export</h3>
        <button onClick={()=>download("policy.json",JSON.stringify(policyForExport,null,2),"application/json")} disabled={!report.exportable}>
          Export canonical Policy
        </button>
        <button onClick={()=>download("network-test-bundle.json",JSON.stringify(exportBundle(),null,2),"application/json")}>
          Export full test bundle
        </button>
        <button onClick={()=>download("wireguard-template.conf",wireGuardTemplate,"text/plain")}>
          Export WireGuard template
        </button>
        <button onClick={()=>download("shadowrocket-dns-evidence.conf",shadowrocketEvidence,"text/plain")}>
          Export Shadowrocket DNS evidence
        </button>
      </div>

      <div className="card">
        <h2>Compatibility Report</h2>
        {Object.entries(report.capabilities).map(([f,x])=>
          <div className="row" key={f}>
            <span>{f}</span><strong>{x.requested?x.state:"NOT_REQUESTED"}</strong>
          </div>
        )}

        <h3>Test Evidence</h3>
        <pre>{JSON.stringify(testEvidence,null,2)}</pre>

        <h3>Diagnostics</h3>
        {report.diagnostics.length
          ? <ul>{report.diagnostics.map((d,i)=><li key={i}><strong>{d.level}</strong> {d.code}: {d.message}</li>)}</ul>
          : <p>No diagnostics.</p>
        }

        {target==="surge"&&<>
          <h3>Surge isolated test pack</h3>
          <p>ทดสอบทีละความสามารถบนเครื่องจริง; ชุดนี้ไม่ฝัง private key, credential หรือ certificate</p>
          <pre>{surgeArtifact.content||surgeArtifact.error}</pre>
          {!surgeArtifact.error&&
            <button onClick={()=>download("surge-fixture.conf",surgeArtifact.content,"text/plain")}>
              Download fixture
            </button>
          }
        </>}

        {target==="wireguard"&&<>
          <h3>WireGuard template</h3>
          <pre>{wireGuardTemplate}</pre>
          <p>Template intentionally omits private keys and does not claim that EM Proxy capabilities are configurable.</p>
        </>}

        {target==="shadowrocket"&&<>
          <h3>Shadowrocket evidence-only profile</h3>
          <pre>{shadowrocketEvidence}</pre>
          <p>Tested behavior: Effective DNS was observed as 1.1.1.1 and 1.0.0.1 while system DNS was separately reported as 94.140.14.15 and 94.140.14.16.</p>
        </>}

        <h3>Canonical Policy</h3>
        <pre>{JSON.stringify(policy,null,2)}</pre>
      </div>
    </section>
  </main>
}
createRoot(document.getElementById("root")).render(<App/>);