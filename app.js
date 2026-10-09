
(function(){
"use strict";
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const specs={
 wheelbase:{label:"Wheelbase",min:48,max:90,step:.5,unit:'"'},
 track:{label:"Track width",min:38,max:64,step:.5,unit:'"'},
 wheel:{label:"Wheel diameter",min:28,max:52,step:.5,unit:'"'},
 engine:{label:"Engine position",min:10,max:90,step:1,unit:"%"},
 seat:{label:"Seat position",min:10,max:90,step:1,unit:"%"}
};
const initial={wheelbase:62,track:46,wheel:38,engine:34,seat:67,frame:"standard"};
const fresh=()=>({design:{...initial},revisions:[],records:[],undo:[],redo:[],prototype:null,date:"1885-01-01",activeResearch:null,research:{steering:{knowledge:0,attempts:0},frame:{knowledge:0,attempts:0},ignition:{knowledge:0,attempts:0}},discovered:["steering","frame","ignition"]});
let state=fresh();
try{const newer=localStorage.getItem("uct021"),older=localStorage.getItem("uct020");if(newer){state=Object.assign(fresh(),JSON.parse(newer));}else if(older){state=Object.assign(fresh(),JSON.parse(older));if(!state.date){const y=state.year||1885,w=state.week||1,d=new Date(Date.UTC(y,0,1+(w-1)*7));state.date=d.toISOString().slice(0,10);}delete state.year;delete state.week;}}catch(e){state=fresh();}
const clone=o=>JSON.parse(JSON.stringify(o));
const persist=()=>localStorage.setItem("uct021",JSON.stringify(state));
function pushUndo(){state.undo.push(clone(state.design));if(state.undo.length>50)state.undo.shift();state.redo=[];}
function calc(d=state.design){return{
 mass:Math.round(260+d.wheel*3.2+d.wheelbase*1.5+({light:20,standard:55,heavy:110}[d.frame]||55)),
 cost:(118+d.wheel*.65+d.wheelbase*.42+({light:8,standard:19,heavy:38}[d.frame]||19)).toFixed(2),
 rear:Math.round(50+(d.engine-50)*.22+(d.seat-50)*.15)
};}
function controlHTML(k,s){return `<div class="control"><label>${s.label}<output id="${k}Out"></output></label><input id="${k}Range" type="range" min="${s.min}" max="${s.max}" step="${s.step}"><input id="${k}Num" type="number" min="${s.min}" max="${s.max}" step="${s.step}"></div>`;}
$("#controls").innerHTML=Object.entries(specs).map(([k,s])=>controlHTML(k,s)).join("");
function setValue(k,val,remember){
 const sp=specs[k]; let n=Number(val); if(!Number.isFinite(n))return;
 n=Math.max(sp.min,Math.min(sp.max,n));
 if(n===state.design[k])return;
 if(remember)pushUndo(); state.design[k]=n;state.prototype=null;render();
}
Object.keys(specs).forEach(k=>{
 const r=$("#"+k+"Range"),n=$("#"+k+"Num");
 let before=null;
 r.addEventListener("pointerdown",()=>before=clone(state.design));
 r.addEventListener("input",()=>{state.design[k]=Number(r.value);n.value=r.value;state.prototype=null;render(false);});
 r.addEventListener("change",()=>{if(before&&before[k]!==state.design[k]){state.undo.push(before);state.redo=[];}before=null;render();});
 n.addEventListener("change",()=>setValue(k,n.value,true));
 n.addEventListener("keydown",e=>{if(e.key==="Enter")n.blur();});
});
$("#frame").addEventListener("change",e=>{if(e.target.value!==state.design.frame){pushUndo();state.design.frame=e.target.value;state.prototype=null;render();}});
function wheel(x,y,r){return `<circle cx="${x}" cy="${y}" r="${r}" class="wheel"/><circle cx="${x}" cy="${y}" r="${r*.22}" class="hub"/>`;}
function draw(){
 const d=state.design,left=220,right=left+d.wheelbase*6.2,ground=325,r=d.wheel*2.05;
 const ex=left+(right-left)*d.engine/100,sx=left+(right-left)*d.seat/100;
 $("#car").innerHTML=`<line x1="${left}" y1="270" x2="${right}" y2="270" class="frameLine"/>
 <rect x="${ex-38}" y="205" width="76" height="58" rx="5" class="engine"/>
 <path d="M ${sx-42} 263 L ${sx-34} 205 L ${sx+24} 205 L ${sx+38} 263 Z" class="seat"/>
 ${wheel(left,ground,r)}${wheel(right,ground,r)}
 <circle cx="${left}" cy="270" r="11" class="handle" data-kind="left"/>
 <circle cx="${right}" cy="270" r="11" class="handle" data-kind="right"/>
 <circle cx="${right}" cy="${ground-r}" r="10" class="handle resize" data-kind="size"/>`;
 $$(".handle").forEach(h=>h.addEventListener("pointerdown",e=>startDrag(e,h,left,right,ground)));
}
function startDrag(e,h,left,right,ground){
 e.preventDefault(); const before=clone(state.design); h.setPointerCapture(e.pointerId);
 const move=ev=>{
  const p=$("#vehicle").createSVGPoint();p.x=ev.clientX;p.y=ev.clientY;
  const q=p.matrixTransform($("#vehicle").getScreenCTM().inverse());
  if(h.dataset.kind==="right")state.design.wheelbase=Math.max(48,Math.min(90,Math.round(((q.x-left)/6.2)*2)/2));
  if(h.dataset.kind==="left")state.design.wheelbase=Math.max(48,Math.min(90,Math.round(((right-q.x)/6.2)*2)/2));
  if(h.dataset.kind==="size")state.design.wheel=Math.max(28,Math.min(52,Math.round(((ground-q.y)/2.05)*2)/2));
  state.prototype=null;render(false);
 };
 const up=()=>{h.removeEventListener("pointermove",move);h.removeEventListener("pointerup",up);if(JSON.stringify(before)!==JSON.stringify(state.design)){state.undo.push(before);state.redo=[];}render();};
 h.addEventListener("pointermove",move);h.addEventListener("pointerup",up);
}
function researchDraftingNotes(){const out=[],s=state.research.steering?.knowledge||0,g=state.research.geometry?.knowledge||0,f=state.research.frame?.knowledge||0,m=state.research.materials?.knowledge||0;if(s+g>=220)out.push(["","Company steering research now supports more confident interpretation of directional behavior."]);if(g>=220)out.push(["","Steering Geometry research has made axle spacing and loading relationships a recognized drafting concern."]);if(f+m>=300)out.push(["","Structural research has improved the company's ability to judge frame loading during drafting."]);return out;}
function notes(){
 const d=state.design,c=calc(),a=[];
 if(!state.revisions.length)a.push(["","No road test exists. Create and commit your first experimental design."]);
 else{
  if(c.rear>58)a.push(["warning","Engineer hypothesis: the rear appears heavily loaded. Steering behavior is uncertain."]);
  else if(c.rear<42)a.push(["warning","Engineer hypothesis: forward loading may be excessive."]);
  else a.push(["","Static inspection suggests reasonably distributed loading. Road behavior remains unknown."]);
  if(d.wheelbase<56)a.push(["warning","The short axle spacing may make the machine difficult to control. This has not been proven."]);
  if(d.frame==="light")a.push(["warning","The light frame shows concerning flex during workshop loading."]);
 }
 if(state.prototype?.notes)a.push(...state.prototype.notes);a.push(...researchDraftingNotes());
 return a;
}
function render(doSave=true){
 $("#currentDate").textContent=prettyDate();$("#headerDate").textContent=prettyDate();
 const d=state.design,c=calc(),next=state.revisions.length+1;
 Object.entries(specs).forEach(([k,s])=>{$("#"+k+"Range").value=d[k];$("#"+k+"Num").value=d[k];$("#"+k+"Out").textContent=(s.step<1?Number(d[k]).toFixed(1):d[k])+s.unit;});
 $("#frame").value=d.frame;$("#mass").textContent=c.mass+" lb";$("#cost").textContent="$"+c.cost;
 $("#balance").textContent=state.prototype?c.rear+"% rear (estimated)":"Not measured";
 $("#knowledge").textContent=state.prototype?"Road-tested":"Workshop estimates only";
 $("#revTitle").textContent="Design Revision "+String(next).padStart(3,"0");$("#commit").textContent="Commit Revision "+String(next).padStart(3,"0");
 $("#prototype").disabled=state.revisions.length<2;$("#compare").disabled=state.revisions.length<1;$("#undo").disabled=!state.undo.length;$("#redo").disabled=!state.redo.length;
 $("#tutorial").innerHTML=state.revisions.length===0?"<b>Tutorial — Revision 001: Create.</b> Alter the architecture using drag controls, sliders, or exact measurements."
 :state.revisions.length===1?"<b>Tutorial — Revision 002: Revise.</b> Revision 001 is permanent. Respond to the engineering observations however you choose, then commit Revision 002."
 :"<b>The rails are off.</b> You control the project from here.";
 $("#notes").innerHTML=notes().map(x=>`<div class="note ${x[0]}">${x[1]}</div>`).join("");
 $("#draftKnowledge").textContent=`Company understanding — Steering: ${qualitative("steering")}; Frame construction: ${qualitative("frame")}. Research changes what your engineers can recognize and, as fields mature, what drafting capabilities can be introduced.`;draw();renderTests();renderLog();renderResearch();if(doSave)persist();
}
$("#undo").addEventListener("click",()=>{if(!state.undo.length)return;state.redo.push(clone(state.design));state.design=state.undo.pop();state.prototype=null;render();});
$("#redo").addEventListener("click",()=>{if(!state.redo.length)return;state.undo.push(clone(state.design));state.design=state.redo.pop();state.prototype=null;render();});
$("#commit").addEventListener("click",()=>{const n=state.revisions.length+1,rec={num:n,design:clone(state.design),time:stamp()};state.revisions.push(rec);state.records.unshift({type:"REVISION",text:`Revision ${String(n).padStart(3,"0")} committed.`,time:rec.time});state.undo=[];state.redo=[];state.prototype=null;render();});
$("#prototype").addEventListener("click",()=>{state.prototype={notes:[]};state.records.unshift({type:"PROTOTYPE",text:`Prototype constructed from Revision ${state.revisions.length}.`,time:stamp()});render();});
function availableTests(){const y=simYear();return [
{name:"Workshop Yard Trial",days:1,min:1885,desc:"Very low speed • under 1 mile • level ground"},
{name:"Local Road Trial",days:1,min:1885,desc:"Low speed • 1–3 miles • ordinary road"},
{name:"Extended Road Run",days:2,min:1886,desc:"Moderate speed • 5–10 miles • mixed road"},
{name:"Hill Trial",days:2,min:1886,desc:"Low/moderate speed • repeated grades"},
{name:"Rough-Surface Trial",days:2,min:1887,desc:"Uneven road • frame, wheel and fastener stress"},
{name:"Endurance Run",days:4,min:1888,desc:"Long continuous operation • heat, wear and reliability"}
].map(t=>({...t,available:y>=t.min}));}
function runRoadTest(i){if(!state.prototype)return;const t=availableTests()[i];if(!t||!t.available)return;addDays(t.days);const c=calc(),s=state.research.steering?.knowledge||0,g=state.research.geometry?.knowledge||0,f=state.research.frame?.knowledge||0,m=state.research.materials?.knowledge||0,obs=[];if((t.name.includes("Road")||t.name.includes("Endurance"))&&c.rear>58)obs.push(s+g>350?"Engineers associate increasing steering uncertainty with rearward loading and steering geometry.":"Steering becomes increasingly uncertain as speed rises; the cause is not yet clear.");if(t.name.includes("Rough")&&state.design.frame==="light")obs.push(f+m>450?"Measured frame movement suggests the present light structure is insufficient for repeated uneven-road loading.":"Visible frame movement and loosening occur over repeated impacts.");if(t.name.includes("Hill"))obs.push("The powertrain labors under sustained grade; further investigation may be warranted.");if(t.name.includes("Endurance"))obs.push("Extended running reveals heat and wear behavior that shorter trials could not expose.");if(!obs.length)obs.push("No immediate critical failure was observed. This trial does not establish performance outside the conditions tested.");state.prototype.notes=[...state.prototype.notes,[obs.some(x=>/uncertain|insufficient|loosening|labors/i.test(x))?"warning":"",obs.join(" ")]];state.records.unshift({type:"TEST",text:`${t.name} completed — ${t.desc}. ${obs.join(" ")}`,time:stamp()});render();}
function renderTests(){const p=$("#testPanel");if(!state.prototype){p.innerHTML="";return;}p.className="testPanel";p.innerHTML=`<hr><h3>Road Testing</h3><p>Choose the conditions under which this prototype will be tested. More demanding tests become practical as the automotive field develops.</p><div class="testGrid">${availableTests().map((t,i)=>`<div class="testCard ${t.available?"":"locked"}"><b>${t.name}</b><small>${t.desc}</small><button data-test="${i}" ${t.available?"":"disabled"}>${t.available?"Run Test":`Not yet practical (${t.min})`}</button></div>`).join("")}</div>`;$$('[data-test]').forEach(b=>b.addEventListener('click',()=>runRoadTest(Number(b.dataset.test))));}
$("#compare").addEventListener("click",()=>{const a=state.revisions[state.revisions.length-1];const rows=Object.entries(specs).map(([k,s])=>`<tr><td>${s.label}</td><td>${a.design[k]}${s.unit}</td><td>${state.design[k]}${s.unit}</td></tr>`).join("")+`<tr><td>Frame</td><td>${a.design.frame}</td><td>${state.design.frame}</td></tr>`;$("#comparison").innerHTML=`<table class="compareTable"><tr><th>Parameter</th><th>Revision ${a.num}</th><th>Working</th></tr>${rows}</table>`;$("#compareDialog").showModal();});
$("#closeCompare").addEventListener("click",()=>$("#compareDialog").close());
const fields={steering:{title:"Steering & Control",desc:"Investigate steering linkages, axle behavior, and directional control.",baseWeeks:5},frame:{title:"Frame Construction",desc:"Study bracing, load paths, rigidity, and practical construction.",baseWeeks:6},ignition:{title:"Ignition & Combustion Control",desc:"Investigate more dependable methods of initiating and controlling combustion.",baseWeeks:7},geometry:{title:"Steering Geometry",desc:"A newly recognized field concerning linkage geometry, axle placement, and directional behavior.",baseWeeks:8},materials:{title:"Structural Materials",desc:"Investigate how available materials behave under repeated vehicle loads.",baseWeeks:9}};
function simDate(){return new Date(state.date+"T00:00:00Z")}
function simYear(){return simDate().getUTCFullYear()}
function prettyDate(){return simDate().toLocaleDateString("en-US",{timeZone:"UTC",month:"long",day:"numeric",year:"numeric"})}
function addDays(n){const d=simDate();d.setUTCDate(d.getUTCDate()+n);state.date=d.toISOString().slice(0,10)}
function stamp(){return prettyDate()}
function frontier(){return Math.max(1000,(simYear()-1884)*1000)}
function qualitative(k){const r=(state.research[k]?.knowledge||0)/frontier();if(r<.08)return"Barely Explored";if(r<.22)return"Early Investigation";if(r<.42)return"Developing Understanding";if(r<.65)return"Established Understanding";if(r<.85)return"Advanced Understanding";if(r<.97)return"Near the Contemporary Frontier";return"Contemporary Mastery"}
function discoverFields(){const s=state.research.steering?.knowledge||0,f=state.research.frame?.knowledge||0;if(s>=220&&!state.discovered.includes("geometry")){state.discovered.push("geometry");state.research.geometry={knowledge:0,attempts:0};state.records.unshift({type:"DISCOVERY",text:"A new field of inquiry has emerged: Steering Geometry.",time:stamp()})}if(f>=260&&s>=120&&!state.discovered.includes("materials")){state.discovered.push("materials");state.research.materials={knowledge:0,attempts:0};state.records.unshift({type:"DISCOVERY",text:"Combined frame and control work has revealed a new field of inquiry: Structural Materials.",time:stamp()})}}
function startResearch(k){if(state.activeResearch)return;const f=fields[k],eff=1+Math.floor(Math.random()*20),weeks=Math.max(2,Math.round(f.baseWeeks*(1.35-(eff/20)*.55))),outcome=1+Math.floor(Math.random()*20);state.activeResearch={key:k,total:weeks*7,left:weeks*7,outcome};state.records.unshift({type:"RESEARCH",text:`${f.title} investigation authorized. Engineers estimate roughly ${Math.max(2,weeks-2)}–${weeks+2} weeks.`,time:stamp()});render()}
function processDays(n){for(let i=0;i<n;i++){addDays(1);if(state.activeResearch){state.activeResearch.left--;if(state.activeResearch.left<=0){completeResearch();break;}}}render()}
function advanceDay(){processDays(1)}
function advanceWeek(){processDays(7)}
function advanceNext(){if(state.activeResearch)processDays(state.activeResearch.left)}
function completeResearch(){const a=state.activeResearch,k=a.key,r=a.outcome,rec=state.research[k];let gain,label;if(r===1){gain=8+Math.floor(Math.random()*8);label="Serious Setback"}else if(r<=5){gain=18+Math.floor(Math.random()*18);label="Limited Finding"}else if(r<=9){gain=35+Math.floor(Math.random()*25);label="Useful Observation"}else if(r<=13){gain=60+Math.floor(Math.random()*35);label="Productive Result"}else if(r<=17){gain=95+Math.floor(Math.random()*45);label="Strong Finding"}else if(r<=19){gain=145+Math.floor(Math.random()*55);label="Breakthrough"}else{gain=220+Math.floor(Math.random()*80);label="Major Breakthrough"}const ratio=rec.knowledge/frontier();gain=Math.max(3,Math.round(gain*(ratio>.95?.12:ratio>.85?.3:ratio>.7?.55:1)));rec.knowledge+=gain;rec.attempts++;state.records.unshift({type:"RESEARCH",text:`${fields[k].title} concluded — ${label}. ${researchNarrative(k,label)}`,time:stamp()});state.activeResearch=null;discoverFields()}
function researchNarrative(k,label){const level=qualitative(k);if(label==="Serious Setback")return"The experiment failed to produce a usable solution, but the failure conditions have been documented for future work.";if(level==="Near the Contemporary Frontier"||level==="Contemporary Mastery")return"The work largely confirms principles already understood. Engineers believe major further progress may depend on new methods, related discoveries, or the passage of technological time.";if(label.includes("Breakthrough"))return"The team has identified relationships that substantially change its understanding of the field and suggest new lines of investigation.";return"The investigation has added useful observations to the company's growing body of knowledge."}
function renderResearch(){const a=state.activeResearch;$("#activeResearch").innerHTML=a?`<div class="researchStatus"><b>Research in progress: ${fields[a.key].title}</b><p>Engineers are working. Completion remains uncertain.</p><div class="progressTrack"><div class="progressFill" style="width:${((a.total-a.left)/a.total)*100}%"></div></div><small>${a.left>7?"Work continues.":a.left>2?"The investigation appears to be nearing completion.":"The investigation appears close to conclusion."}</small></div>`:`<div class="researchStatus"><b>No active investigation.</b> Select a known field to begin research.</div>`;$("#researchCards").innerHTML=state.discovered.map(k=>{const f=fields[k],q=qualitative(k),attempts=state.research[k]?.attempts||0;return`<div class="card"><h3>${f.title}</h3><div class="level">${q}</div><p>${f.desc}</p><small>${attempts?`Recorded investigations: ${attempts}`:"No completed investigation yet."}</small><button data-research="${k}" ${a?"disabled":""}>Authorize Investigation</button></div>`}).join("");$$("[data-research]").forEach(b=>b.addEventListener("click",()=>startResearch(b.dataset.research)))}
function renderLog(){$("#logItems").innerHTML=state.records.length?state.records.map(r=>`<div class="logItem"><b>${r.type}</b> — ${r.text}<br><small>${r.time}</small></div>`).join(""):"<p>No permanent records yet.</p>";}
$("#advanceDay").addEventListener("click",advanceDay);$("#advanceWeek").addEventListener("click",advanceWeek);$("#advanceNext").addEventListener("click",advanceNext);
$$(".tab").forEach(b=>b.addEventListener("click",()=>{$$(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");$$(".page").forEach(x=>x.classList.remove("active"));$("#"+b.dataset.page).classList.add("active");}));
render();
})();
