
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const initial={wheelbase:62,track:46,wheel:38,engine:34,seat:67,frame:"standard"};
let state=JSON.parse(localStorage.getItem("uct-v01-state")||"null")||{
  design:{...initial}, revisions:[], log:[], history:[], redo:[], tutorialStep:1,
  research:{ignition:false,frame:false,steering:false}, prototype:null
};
function snap(){state.history.push(JSON.stringify(state.design)); if(state.history.length>40)state.history.shift(); state.redo=[]}
function save(){localStorage.setItem("uct-v01-state",JSON.stringify(state))}
function calc(d=state.design){
 const mass=Math.round(260+d.wheel*3.2+d.wheelbase*1.5+({light:20,standard:55,heavy:110}[d.frame]));
 const cost=(118+d.wheel*.65+d.wheelbase*.42+({light:8,standard:19,heavy:38}[d.frame])).toFixed(2);
 const rearBias=Math.round(50+(d.engine-50)*.22+(d.seat-50)*.15);
 return {mass,cost,rearBias};
}
function knownObservations(){
 const d=state.design,c=calc(), notes=[];
 if(state.tutorialStep===1){
   notes.push(["note","No road test exists. Alter the experimental architecture, then commit the first design."]);
 } else {
   if(c.rearBias>58) notes.push(["warning","Engineer hypothesis: the rear of the carriage appears heavily loaded. Steering behavior is uncertain."]);
   else if(c.rearBias<42) notes.push(["warning","Engineer hypothesis: forward loading may be excessive."]);
   else notes.push(["note","Static inspection suggests reasonably distributed loading, but road behavior remains unknown."]);
   if(d.wheelbase<56) notes.push(["warning","The short axle spacing may make the machine difficult to control. This has not been proven."]);
   if(d.frame==="light") notes.push(["warning","The light frame shows concerning flex during workshop loading."]);
   if(state.prototype?.tested) notes.push(...state.prototype.notes);
 }
 return notes;
}
function render(){
 const d=state.design,c=calc();
 ["wheelbase","track","wheel","engine","seat"].forEach(k=>{
   $("#"+k).value=d[k]; $("#"+k+"Num").value=d[k];
 });
 $("#frame").value=d.frame;
 $("#wheelbaseOut").textContent=d.wheelbase.toFixed(1)+'"';
 $("#trackOut").textContent=d.track.toFixed(1)+'"';
 $("#wheelOut").textContent=d.wheel.toFixed(1)+'"';
 $("#engineOut").textContent=d.engine+"%";
 $("#seatOut").textContent=d.seat+"%";
 $("#mass").textContent=c.mass+" lb";
 $("#cost").textContent="$"+c.cost;
 $("#balance").textContent=state.prototype?.tested ? (c.rearBias+"% rear (estimated)") : "Not measured";
 $("#knowledge").textContent=state.prototype?.tested?"Road-tested":"Workshop estimates only";
 $("#revisionTitle").textContent="Design Revision "+String(state.revisions.length+1).padStart(3,"0");
 $("#commit").textContent="Commit Revision "+String(state.revisions.length+1).padStart(3,"0");
 $("#compareBtn").disabled=state.revisions.length<1;
 $("#prototype").disabled=state.revisions.length<2;
 $("#tutorialNotice").innerHTML=state.revisions.length===0
   ?"<b>Tutorial — Revision 001: Create.</b> Change the machine's geometry using both the drawing and precise measurements. Commit the design when it represents your first attempt."
   :state.revisions.length===1
   ?"<b>Tutorial — Revision 002: Revise.</b> Engineering has inspected your first design. Decide how you want to respond. Your original revision remains permanently archived."
   :"<b>The rails are off.</b> You now control the project. Construct a prototype, test it, revise it, or continue experimenting.";
 $("#observations").innerHTML=knownObservations().map(n=>`<div class="note ${n[0]}">${n[1]}</div>`).join("");
 draw();
 renderLog(); renderResearch(); save();
}
function draw(){
 const d=state.design;
 const left=220,right=left+d.wheelbase*6.2, ground=325, r=d.wheel*2.05;
 const engX=left+(right-left)*(d.engine/100), seatX=left+(right-left)*(d.seat/100);
 $("#car").innerHTML=`
 <line x1="${left}" y1="270" x2="${right}" y2="270" class="frameLine"/>
 <rect x="${engX-38}" y="205" width="76" height="58" rx="5" class="engine"/>
 <path d="M ${seatX-42} 263 L ${seatX-34} 205 L ${seatX+24} 205 L ${seatX+38} 263 Z" class="seat"/>
 ${wheel(left,ground,r,"left")}${wheel(right,ground,r,"right")}
 <circle cx="${left}" cy="270" r="10" class="handle" data-drag="left"/>
 <circle cx="${right}" cy="270" r="10" class="handle" data-drag="right"/>
 <circle cx="${right}" cy="${ground-r}" r="9" class="handle resize" data-drag="size"/>
 `;
 bindDrag(left,right,ground);
}
function wheel(x,y,r,id){return `<circle cx="${x}" cy="${y}" r="${r}" class="wheel"/><circle cx="${x}" cy="${y}" r="${r*.22}" class="hub"/>`}
function bindDrag(left,right,ground){
 $$(".handle").forEach(h=>h.onpointerdown=e=>{
   e.preventDefault(); snap(); h.setPointerCapture(e.pointerId);
   h.onpointermove=ev=>{
     const pt=$("#carSvg").createSVGPoint(); pt.x=ev.clientX;pt.y=ev.clientY;
     const p=pt.matrixTransform($("#carSvg").getScreenCTM().inverse());
     if(h.dataset.drag==="right") state.design.wheelbase=Math.max(48,Math.min(90,Math.round(((p.x-left)/6.2)*2)/2));
     if(h.dataset.drag==="left") state.design.wheelbase=Math.max(48,Math.min(90,Math.round(((right-p.x)/6.2)*2)/2));
     if(h.dataset.drag==="size") state.design.wheel=Math.max(28,Math.min(52,Math.round(((ground-p.y)/2.05)*2)/2));
     render();
   };
   h.onpointerup=()=>{h.onpointermove=null;};
 });
}
["wheelbase","track","wheel","engine","seat"].forEach(k=>{
 $("#"+k).oninput=e=>{if(e.type==="input"&&!e.target.dataset.started){snap();e.target.dataset.started=1}state.design[k]=+e.target.value;$("#"+k+"Num").value=state.design[k];render()}
 $("#"+k).onchange=e=>{e.target.dataset.started="";};
 $("#"+k+"Num").onchange=e=>{snap();state.design[k]=+e.target.value;render()};
});
$("#frame").onchange=e=>{snap();state.design.frame=e.target.value;render()};
$("#undo").onclick=()=>{if(!state.history.length)return;state.redo.push(JSON.stringify(state.design));state.design=JSON.parse(state.history.pop());render()};
$("#redo").onclick=()=>{if(!state.redo.length)return;state.history.push(JSON.stringify(state.design));state.design=JSON.parse(state.redo.pop());render()};
$("#commit").onclick=()=>{
 const num=state.revisions.length+1;
 state.revisions.push({num,design:JSON.parse(JSON.stringify(state.design)),calc:calc(),time:new Date().toLocaleString()});
 state.log.unshift({type:"revision",text:`Design Revision ${String(num).padStart(3,"0")} committed. Wheelbase ${state.design.wheelbase}", time:new Date().toLocaleString()});
 state.tutorialStep++;
 state.prototype=null; render();
};
$("#prototype").onclick=()=>{
 const c=calc(),d=state.design,notes=[];
 if(c.rearBias>60) notes.push(["warning","Road trial observation: steering becomes increasingly uncertain with speed. Cause not conclusively established."]);
 if(d.frame==="light") notes.push(["warning","Road trial observation: frame flex is visible over rough ground."]);
 if(d.wheelbase<55) notes.push(["warning","Road trial observation: directional stability is poor on uneven road."]);
 if(!notes.length) notes.push(["note","The prototype completed its first short road trial without an obvious major failure. Further testing is required."]);
 state.prototype={tested:true,notes};
 state.log.unshift({type:"test",text:`Prototype built from Revision ${state.revisions.length}. First short road trial completed.`,time:new Date().toLocaleString()});
 render();
};
$("#compareBtn").onclick=()=>{
 const a=state.revisions[state.revisions.length-1],b={design:state.design,calc:calc()};
 const rows=[["Wheelbase","wheelbase",'"'],["Track","track",'"'],["Wheel diameter","wheel",'"'],["Engine position","engine","%"],["Seat position","seat","%"],["Frame","frame",""]];
 $("#compareContent").innerHTML=`<p>Committed Revision ${a.num} versus current working revision.</p><table class="compareTable"><tr><th>Parameter</th><th>Rev ${a.num}</th><th>Working</th></tr>`+
 rows.map(r=>`<tr><td>${r[0]}</td><td>${a.design[r[1]]}${r[2]}</td><td>${b.design[r[1]]}${r[2]}</td></tr>`).join("")+`</table>`;
 $("#compareDialog").showModal();
};
function renderLog(){
 $("#log").innerHTML=state.log.length?state.log.map(x=>`<div class="logItem"><b>${x.type.toUpperCase()}</b> — ${x.text}<br><small>${x.time}</small></div>`).join(""):"<p>No permanent records yet.</p>";
}
const research=[
 ["ignition","Improved Ignition Experiments","Investigate more dependable ignition. Success is not guaranteed."],
 ["frame","Frame Bracing Methods","Experiment with stronger bracing without excessive mass."],
 ["steering","Steering Geometry Study","Develop company knowledge about steering linkages and axle behavior."]
];
function renderResearch(){
 $("#researchCards").innerHTML=research.map(r=>`<div class="researchCard"><h3>${r[1]}</h3><p>${r[2]}</p><button data-r="${r[0]}" ${state.research[r[0]]?"disabled":""}>${state.research[r[0]]?"Knowledge recorded":"Conduct experiment"}</button></div>`).join("");
 $$("[data-r]").forEach(b=>b.onclick=()=>{
   const key=b.dataset.r, success=Math.random()>.35;
   state.research[key]=true;
   state.log.unshift({type:"research",text:success?`${research.find(x=>x[0]===key)[1]} produced a useful capability.`:`${research.find(x=>x[0]===key)[1]} failed to produce a usable design, but the experiment added to company knowledge.`,time:new Date().toLocaleString()});
   render();
 });
}
$$("nav button").forEach(b=>b.onclick=()=>{$$("nav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");$$(".page").forEach(x=>x.classList.remove("active"));$("#"+b.dataset.page).classList.add("active")});
render();

if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{});}
