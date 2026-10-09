
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
const fresh=()=>({design:{...initial},revisions:[],records:[],undo:[],redo:[],prototype:null,research:{ignition:false,frame:false,steering:false}});
let state=fresh();
try{const s=localStorage.getItem("uct012"); if(s) state=Object.assign(fresh(),JSON.parse(s));}catch(e){state=fresh();}
const clone=o=>JSON.parse(JSON.stringify(o));
const persist=()=>localStorage.setItem("uct012",JSON.stringify(state));
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
 if(state.prototype?.notes)a.push(...state.prototype.notes);
 return a;
}
function render(doSave=true){
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
 draw();renderLog();renderResearch();if(doSave)persist();
}
$("#undo").addEventListener("click",()=>{if(!state.undo.length)return;state.redo.push(clone(state.design));state.design=state.undo.pop();state.prototype=null;render();});
$("#redo").addEventListener("click",()=>{if(!state.redo.length)return;state.undo.push(clone(state.design));state.design=state.redo.pop();state.prototype=null;render();});
$("#commit").addEventListener("click",()=>{const n=state.revisions.length+1,rec={num:n,design:clone(state.design),time:new Date().toLocaleString()};state.revisions.push(rec);state.records.unshift({type:"REVISION",text:`Revision ${String(n).padStart(3,"0")} committed.`,time:rec.time});state.undo=[];state.redo=[];state.prototype=null;render();});
$("#prototype").addEventListener("click",()=>{const c=calc(),a=[];if(c.rear>60)a.push(["warning","Road trial: steering becomes increasingly uncertain with speed. Cause is not conclusively established."]);if(state.design.frame==="light")a.push(["warning","Road trial: visible frame flex over rough ground."]);if(state.design.wheelbase<55)a.push(["warning","Road trial: poor directional stability on uneven road."]);if(!a.length)a.push(["","Prototype completed the first short road trial without an obvious major failure. Further testing is required."]);state.prototype={notes:a};state.records.unshift({type:"TEST",text:`Prototype from Revision ${state.revisions.length} completed its first road trial.`,time:new Date().toLocaleString()});render();});
$("#compare").addEventListener("click",()=>{const a=state.revisions[state.revisions.length-1];const rows=Object.entries(specs).map(([k,s])=>`<tr><td>${s.label}</td><td>${a.design[k]}${s.unit}</td><td>${state.design[k]}${s.unit}</td></tr>`).join("")+`<tr><td>Frame</td><td>${a.design.frame}</td><td>${state.design.frame}</td></tr>`;$("#comparison").innerHTML=`<table class="compareTable"><tr><th>Parameter</th><th>Revision ${a.num}</th><th>Working</th></tr>${rows}</table>`;$("#compareDialog").showModal();});
$("#closeCompare").addEventListener("click",()=>$("#compareDialog").close());
const research=[["ignition","Improved Ignition Experiments"],["frame","Frame Bracing Methods"],["steering","Steering Geometry Study"]];
function renderResearch(){$("#researchCards").innerHTML=research.map(([k,t])=>`<div class="card"><h3>${t}</h3><p>Conduct a period-appropriate experiment. Success is not guaranteed.</p><button data-research="${k}" ${state.research[k]?"disabled":""}>${state.research[k]?"Experiment recorded":"Conduct experiment"}</button></div>`).join("");$$("[data-research]").forEach(b=>b.addEventListener("click",()=>{const k=b.dataset.research,t=research.find(x=>x[0]===k)[1],ok=Math.random()>.35;state.research[k]=true;state.records.unshift({type:"RESEARCH",text:ok?`${t}: useful capability demonstrated.`:`${t}: no usable design, but company knowledge increased.`,time:new Date().toLocaleString()});render();}));}
function renderLog(){$("#logItems").innerHTML=state.records.length?state.records.map(r=>`<div class="logItem"><b>${r.type}</b> — ${r.text}<br><small>${r.time}</small></div>`).join(""):"<p>No permanent records yet.</p>";}
$$(".tab").forEach(b=>b.addEventListener("click",()=>{$$(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");$$(".page").forEach(x=>x.classList.remove("active"));$("#"+b.dataset.page).classList.add("active");}));
render();
})();
