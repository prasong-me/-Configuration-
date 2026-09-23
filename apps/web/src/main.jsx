import React,{useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import {createConfigurationState,setConfigurationValue,generateTargetConfiguration,deliverGeneratedFile} from "../../../packages/target-runtime/src/index.js";
import {targetDefinitions} from "../../../packages/targets/src/script-targets.js";
import "./style.css";

function App(){
  const [targetId,setTargetId]=useState(targetDefinitions[0].id);
  const target=useMemo(()=>targetDefinitions.find(x=>x.id===targetId),[targetId]);
  const [state,setState]=useState(()=>createConfigurationState(targetDefinitions[0].id));
  const [message,setMessage]=useState("");

  function chooseTarget(id){setTargetId(id);setState(createConfigurationState(id));setMessage("");}
  function update(path,value){setState(prev=>setConfigurationValue(prev,path,value));}
  function value(path,def=""){return String(path.split(".").filter(Boolean).reduce((v,k)=>v?.[k],state.values)??def);}
  function generate(){try{return generateTargetConfiguration(target,state);}catch(e){setMessage(e.message);return "";}}
  async function share(){
    const content=generate(); if(!content)return;
    try{
      const result=await deliverGeneratedFile({content,filename:target.filename,mime:target.mime,target});
      setMessage(result.method==="share-file"?"เปิดเมนูส่งต่อของ iOS แล้ว":"เบราว์เซอร์นี้ยังส่งไฟล์ตรงไปยังแอปไม่ได้");
    }catch(e){if(e?.name!=="AbortError")setMessage(e.message||"ยกเลิกการส่งต่อ");}
  }

  return <main>
    <header><h1>Configuration Generator</h1><p>สร้าง Configuration ตาม Target Script ของแต่ละแอป แล้วส่งต่อด้วยระบบของ iOS</p></header>
    <section className="grid">
      <div className="card">
        <h2>เลือกแอปพลิเคชัน</h2>
        <div className="function-list">{targetDefinitions.map(item=><button key={item.id} className={item.id===targetId?"function-button active":"function-button"} onClick={()=>chooseTarget(item.id)}>{item.name}</button>)}</div>
        <div className="guide-panel">
          <div className="export-head"><strong>{target.name}</strong><a href={target.website} target="_blank" rel="noreferrer">Official Website ↗</a></div>
          <p>Configuration format: <code>{target.format}</code></p>
          <a href={target.appStore} target="_blank" rel="noreferrer">ติดตั้ง {target.name} จาก App Store ↗</a>
        </div>
        <h2>ตั้งค่า</h2>
        {target.fields.map(field=>{
          const current=value(field.id,field.default===true?"true":field.default??"");
          if(field.type==="checkbox")return <label key={field.id}><input type="checkbox" checked={current==="true"} onChange={e=>update(field.id,e.target.checked)}/> {field.label}</label>;
          if(field.type==="select")return <label key={field.id}>{field.label}<select value={current} onChange={e=>update(field.id,e.target.value)}>{field.options.map(x=><option key={x}>{x}</option>)}</select></label>;
          return <label key={field.id}>{field.label}{field.required&&" *"}<input type={field.type} value={current} placeholder={field.placeholder||""} onChange={e=>update(field.id,e.target.value)}/></label>;
        })}
        <button className="primary-action" onClick={share}>สร้างและส่งต่อให้ {target.name}</button>
        {message&&<p className="muted">{message}</p>}
      </div>
      <div className="card">
        <h2>Preview</h2><p>ข้อมูลนี้สร้างโดย Script ของ Target ที่เลือก ไม่ใช่รูปแบบกลางของเว็บ</p><pre>{generate()}</pre>
        <h3>สถานะการส่งต่อ</h3>
        <div className="row"><span>Target</span><strong>{target.name}</strong></div>
        <div className="row"><span>Format</span><strong>{target.format}</strong></div>
        <div className="row"><span>Delivery</span><strong>iOS Share</strong></div>
        <div className="row"><span>ไฟล์ถาวรบนเว็บ</span><strong>ไม่มี</strong></div>
      </div>
    </section>
  </main>;
}
createRoot(document.getElementById("root")).render(<App/>);
