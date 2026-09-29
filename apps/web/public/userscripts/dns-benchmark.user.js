// ==UserScript==
// @name         Configuration DNS Browser Benchmark
// @namespace    https://configuration-web.vercel.app/
// @version      0.1.0
// @description  Browser-side driver for the Configuration DNS benchmark.
// @match        *://*/*
// @run-at       document-start
// ==/UserScript==

(function(){
  "use strict";

  const p=new URLSearchParams(location.search);
  if(p.get("__configuration_bench")!=="target") return;

  const returnBase=p.get("return");
  const session=p.get("session");
  const round=Number(p.get("round"));
  const index=Number(p.get("index"));
  const timeout=Math.max(1000,Number(p.get("timeout"))||8000);
  const started=performance.timeOrigin+performance.now();
  let sent=false;

  function finish(status,error){
    if(sent)return;
    sent=true;

    const ended=performance.timeOrigin+performance.now();
    const result={
      session,
      round,
      index,
      domain:location.hostname,
      status,
      error:error||null,
      startedAt:new Date(started).toISOString(),
      finishedAt:new Date(ended).toISOString(),
      loadMs:Math.round(ended-started),
      navigation:{
        dnsStart:null,
        dnsEnd:null,
        connectStart:null,
        connectEnd:null,
        responseStart:null,
        responseEnd:null
      },
      userAgent:navigator.userAgent
    };

    try{
      const nav=performance.getEntriesByType("navigation")[0];
      if(nav){
        result.navigation={
          dnsStart:nav.domainLookupStart??null,
          dnsEnd:nav.domainLookupEnd??null,
          connectStart:nav.connectStart??null,
          connectEnd:nav.connectEnd??null,
          responseStart:nav.responseStart??null,
          responseEnd:nav.responseEnd??null
        };
      }
    }catch{}

    const base=returnBase||location.origin;
    const target=new URL(base);
    target.searchParams.set("__configuration_bench","controller");
    target.searchParams.set("result",encodeURIComponent(JSON.stringify(result)));
    location.replace(target.toString());
  }

  const timer=setTimeout(()=>finish("timeout","browser-timeout"),timeout);

  function ready(){
    clearTimeout(timer);
    const nav=performance.getEntriesByType("navigation")[0];
    const state=nav && nav.loadEventEnd>0 ? "ok" : "loaded";
    finish(state);
  }

  if(document.readyState==="complete"||document.readyState==="interactive"){
    setTimeout(ready,0);
  }else{
    addEventListener("load",ready,{once:true});
    addEventListener("error",()=>{clearTimeout(timer);finish("error","window-error")},{once:true});
  }
})();