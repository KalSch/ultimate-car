
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
try{const newer=localStorage.getItem("uct022"),older=localStorage.getItem("uct021")||localStorage.getItem("uct020");if(newer){state=Object.assign(fresh(),JSON.parse(newer));}else if(older){state=Object.assign(fresh(),JSON.parse(older));if(!state.date){const y=state.year||1885,w=state.week||1,d=new Date(Date.UTC(y,0,1+(w-1)*7));state.date=d.toISOString().slice(0,10);}delete state.year;delete state.week;}}catch(e){state=fresh();}
state.testHistory=state.testHistory||[];
state.revisions=(state.revisions||[]).map(r=>({...r,notebook:r.notebook||[]}));

const clone=o=>JSON.parse(JSON.stringify(o));
const persist=()=>localStorage.setItem("uct022",JSON.stringify(state));
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
function currentNotebookRevision(){return state.revisions.length?state.revisions[state.revisions.length-1]:null}
function notes(){
 const rev=currentNotebookRevision(),a=[];
 if(!rev){
  a.push(["","No committed revision exists yet. Commit Revision 001 to establish the first engineering record."]);
  return a;
 }
 if(!(rev.notebook||[]).length){
  a.push(["",`Revision ${String(rev.num).padStart(3,"0")} has no road-test observations yet. Construct a prototype and choose a test.`]);
 }
 return [...(rev.notebook||[])];
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
 const nbRev=currentNotebookRevision();
 $("#notebookTitle").textContent=nbRev?`Engineering Notebook — Revision ${String(nbRev.num).padStart(3,"0")}`:"Engineering Notebook";
 $("#notebookContext").textContent=nbRev?(state.revisions.length===next-1?`Test evidence for the last committed design. Use it while developing Revision ${String(next).padStart(3,"0")}. Once the next revision is committed, this notebook is frozen.`:""):"Observations are attached to individual committed revisions.";
 $("#notes").innerHTML=notes().map(x=>{
   if(x.test)return `<div class="note testNote ${x.severity||""}"><div class="testHead"><span class="testTag">${x.test}</span><span class="testDate">${x.date}</span></div><div>${x.observation}</div>${x.comparison?`<div class="comparison">${x.comparison}</div>`:""}${x.assessment?`<div class="assessment"><b>Engineer’s assessment:</b> ${x.assessment}</div>`:""}</div>`;
   return `<div class="note ${x[0]||""}">${x[1]||""}</div>`;
 }).join("");
 $("#draftKnowledge").textContent=`Company understanding — Steering: ${qualitative("steering")}; Frame construction: ${qualitative("frame")}. Research changes what your engineers can recognize and, as fields mature, what drafting capabilities can be introduced.`;draw();renderTests();renderLog();renderResearch();if(doSave)persist();
}
$("#undo").addEventListener("click",()=>{if(!state.undo.length)return;state.redo.push(clone(state.design));state.design=state.undo.pop();state.prototype=null;render();});
$("#redo").addEventListener("click",()=>{if(!state.redo.length)return;state.undo.push(clone(state.design));state.design=state.redo.pop();state.prototype=null;render();});
$("#commit").addEventListener("click",()=>{const n=state.revisions.length+1,rec={num:n,design:clone(state.design),time:stamp(),notebook:[]};state.revisions.push(rec);state.records.unshift({type:"REVISION",text:`Revision ${String(n).padStart(3,"0")} committed.`,time:rec.time});state.undo=[];state.redo=[];state.prototype=null;render();});
$("#prototype").addEventListener("click",()=>{state.prototype={revision:state.revisions.length};state.records.unshift({type:"PROTOTYPE",text:`Prototype constructed from Revision ${state.revisions.length}.`,time:stamp()});render();});
function availableTests(){const y=simYear();return [
{name:"Workshop Yard Trial",days:1,min:1885,desc:"Very low speed • under 1 mile • level ground"},
{name:"Local Road Trial",days:1,min:1885,desc:"Low speed • 1–3 miles • ordinary road"},
{name:"Extended Road Run",days:2,min:1886,desc:"Moderate speed • 5–10 miles • mixed road"},
{name:"Hill Trial",days:2,min:1886,desc:"Low/moderate speed • repeated grades"},
{name:"Rough-Surface Trial",days:2,min:1887,desc:"Uneven road • frame, wheel and fastener stress"},
{name:"Endurance Run",days:4,min:1888,desc:"Long continuous operation • heat, wear and reliability"}
].map(t=>({...t,available:y>=t.min}));}
function hiddenBehavior(d){
 const c=calc(d);
 return {
  highSpeedStability:(d.wheelbase*.62+d.track*.72)-Math.abs(c.rear-50)*1.7-d.wheel*.12,
  lowSpeedEase:105-d.wheelbase*.38-d.track*.32-Math.abs(c.rear-52)*.55,
  roughDurability:({light:34,standard:58,heavy:82}[d.frame]||58)-d.wheel*.12,
  hillAbility:88-(c.mass/18)-Math.abs(d.engine-42)*.18,
  endurance:({light:48,standard:63,heavy:71}[d.frame]||63)-(c.mass/55)+Math.min(12,d.wheel*.16)
 };
}
function comparisonPhrase(test,current,prior){
 if(!prior)return "";
 const map=test.includes("Hill")?"hillAbility":test.includes("Rough")?"roughDurability":test.includes("Endurance")?"endurance":test.includes("Yard")?"lowSpeedEase":"highSpeedStability";
 const diff=current[map]-prior.behavior[map];
 if(diff>5)return "Compared with the previous revision tested under similar conditions, behavior is noticeably improved.";
 if(diff<-5)return "Compared with the previous revision tested under similar conditions, behavior is noticeably worse.";
 if(Math.abs(diff)>2)return diff>0?"A modest improvement is apparent compared with the previous comparable trial.":"A modest deterioration is apparent compared with the previous comparable trial.";
 return "No clear change from the previous comparable trial could be established.";
}
function runRoadTest(i){
 if(!state.prototype)return;
 const t=availableTests()[i];if(!t||!t.available)return;
 const rev=state.revisions.find(r=>r.num===state.prototype.revision);if(!rev)return;
 addDays(t.days);
 const b=hiddenBehavior(rev.design),s=state.research.steering?.knowledge||0,g=state.research.geometry?.knowledge||0,f=state.research.frame?.knowledge||0,m=state.research.materials?.knowledge||0;
 let observation="",assessment="",severity="";
 if(t.name.includes("Yard")){
   observation=b.lowSpeedEase<55?"Steering requires considerable effort during tight, low-speed turns.":"The machine can be directed through tight low-speed turns without exceptional effort.";
   assessment=s+g>350?"Steering effort appears related to the present axle spacing, track, and steering arrangement.":"The cause of the steering effort is uncertain; linkage friction, loading, or geometry may contribute.";
 }else if(t.name.includes("Hill")){
   observation=b.hillAbility<30?"Road speed falls sharply on sustained grades and the mechanism labors heavily.":"The machine completes the grade, though sustained climbing places a noticeable load on the mechanism.";
   assessment="Changes that improve climbing may affect mass, durability, traction, or behavior elsewhere; further trials are advised.";
 }else if(t.name.includes("Rough")){
   observation=b.roughDurability<45?"Repeated impacts produce visible frame movement and loosening at several fasteners.":"The structure tolerates the uneven surface with limited visible movement, though repeated impacts remain severe.";
   assessment=f+m>450?"Frame rigidity and load paths are now credible areas for investigation. Added structure may also increase mass.":"The source of movement is not yet certain; frame construction, fasteners, wheel loads, and road shock may all contribute.";
 }else if(t.name.includes("Endurance")){
   observation=b.endurance<45?"Extended running produces increasing heat, vibration, and signs of wear not apparent in shorter trials.":"Extended running exposes wear and heat, but no immediate terminal failure occurs.";
   assessment="Long-duration reliability cannot be inferred from short trials. Changes that increase strength or cooling may carry weight and complexity penalties.";
 }else{
   observation=b.highSpeedStability<55?"Directional instability becomes increasingly noticeable as road speed rises.":"The carriage holds its course reasonably well within the speeds attempted, though road irregularities still disturb it.";
   assessment=s+g>350?"Engineers suspect an interaction among steering geometry, axle spacing, track, and load distribution. No single corrective change is established.":"The cause cannot yet be isolated. Steering arrangement, loading, frame movement, or road shock may be involved.";
 }
 if(/considerable|sharply|visible frame|instability|increasing heat/i.test(observation))severity="warning";
 const prior=[...(state.testHistory||[])].reverse().find(x=>x.test===t.name&&x.revision!==rev.num);
 const comparison=comparisonPhrase(t.name,b,prior);
 const entry={test:t.name,date:stamp(),observation,assessment,comparison,severity};
 rev.notebook=rev.notebook||[];rev.notebook.push(entry);
 state.testHistory.push({revision:rev.num,test:t.name,date:stamp(),behavior:b});
 state.records.unshift({type:"TEST",text:`Revision ${String(rev.num).padStart(3,"0")} — ${t.name} completed. ${observation}`,time:stamp()});
 render();
}
function renderTests(){const p=$("#testPanel");if(!state.prototype){p.innerHTML="";return;}p.className="testPanel";p.innerHTML=`<hr><h3>Road Testing — Revision ${String(state.prototype.revision).padStart(3,"0")}</h3><p>Every result is written to this revision’s Engineering Notebook. Choose the conditions under which this prototype will be tested. More demanding tests become practical as the automotive field develops.</p><div class="testGrid">${availableTests().map((t,i)=>`<div class="testCard ${t.available?"":"locked"}"><b>${t.name}</b><small>${t.desc}</small><button data-test="${i}" ${t.available?"":"disabled"}>${t.available?"Run Test":`Not yet practical (${t.min})`}</button></div>`).join("")}</div>`;$$('[data-test]').forEach(b=>b.addEventListener('click',()=>runRoadTest(Number(b.dataset.test))));}
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
