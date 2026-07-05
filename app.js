let s = {
  team:"自チーム", oppTeam:"相手", setNo:"1",
  nums:["1","2","3","4","5","7"], setterIndex:3,
  positions:["ライト後衛","レフト後衛","レフト前衛","センター前衛","ライト前衛","センター後衛"],
  rot:1, my:0, op:0, serve:"mine",
  mode:"トス", result:"成功", logs:[], hist:[]
};
let setupSelected = 0;
let numberPool = ["1","2","3","4","5","6","7","8","9","10","11","12"];

function show(id){
  document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.getElementById("bottomBar").classList.toggle("hidden", id==="home" || id==="setup");
  render();
}
function save(){ localStorage.setItem("setterTheoryV2", JSON.stringify(s)); }
function load(){ const x=localStorage.getItem("setterTheoryV2"); if(x) s=JSON.parse(x); if(!s.positions) s.positions=["ライト後衛","レフト後衛","レフト前衛","センター前衛","ライト前衛","センター後衛"]; }
function snap(){ s.hist.push(JSON.stringify(s)); if(s.hist.length>300)s.hist.shift(); }
function rotationNums(){
  let a=s.nums.slice();
  for(let i=1;i<s.rot;i++){ a=[a[5],a[0],a[1],a[2],a[3],a[4]]; }
  return a;
}
function rotatedSetterNum(){
  return s.nums[s.setterIndex];
}
function nextRot(){ s.rot=s.rot%6+1; }

function renderSetup(){
  const spots=document.querySelectorAll(".setupSpot");
  spots.forEach((b,i)=>{
    b.classList.toggle("active", i===setupSelected);
    b.classList.toggle("setter", i===s.setterIndex);
    b.querySelector(".num").textContent=s.nums[i] || "-";
    const name=b.querySelector(".name");
    const sel=b.querySelector(".posSelect");
    if(name) name.textContent=s.positions[i] || "";
    if(sel) sel.value=s.positions[i] || sel.value;
  });
  const used=new Set(s.nums);
  const bank=document.getElementById("numberBank");
  bank.innerHTML="";
  const pool=[...new Set([...numberPool,...s.nums].filter(Boolean))].sort((a,b)=>Number(a)-Number(b));
  pool.forEach(n=>{
    const btn=document.createElement("button");
    btn.className="numBtn";
    btn.textContent=n;
    if(used.has(n))btn.classList.add("used");
    if(s.nums[setupSelected]===n)btn.classList.add("active");
    btn.onclick=()=>{s.nums[setupSelected]=n; save(); renderSetup();};
    bank.appendChild(btn);
  });
}
function addNumber(){
  const n=prompt("追加する背番号は？");
  if(!n)return;
  numberPool.push(n);
  s.nums[setupSelected]=n;
  save(); renderSetup();
}
function toggleSetter(){
  s.setterIndex=setupSelected;
  save(); renderSetup();
}
function startMatch(){
  s.team=document.getElementById("team").value || "自チーム";
  s.oppTeam=document.getElementById("oppTeam").value || "相手";
  s.setNo=document.getElementById("setNo").value;
  s.serve=document.getElementById("startServe").value;
  s.rot=1; s.my=0; s.op=0; s.mode="トス"; s.result="成功"; s.logs=[]; s.hist=[];
  save(); show("match");
}
function pointByResult(result){
  const before=s.serve;
  if(result==="成功"){s.my++; if(before==="opp"){nextRot(); s.serve="mine";} return "自";}
  if(result==="ミス" || result==="被ブロック"){s.op++; s.serve="opp"; return "相";}
  return "継続";
}
function add(pos){
  snap();
  const nums=rotationNums();
  const num=nums[Number(pos)-1];
  const point=pointByResult(s.result);
  s.logs.push({no:s.logs.length+1,set:s.setNo,rot:"P"+s.rot,type:s.mode,num:num,pos:pos,result:s.result,point:point,score:s.my+"-"+s.op,time:new Date().toLocaleTimeString()});
  save(); render();
}
function pointOnly(team){
  snap();
  if(team==="my"){
    const before=s.serve; s.my++;
    if(before==="opp"){nextRot(); s.serve="mine";}
    s.logs.push({no:s.logs.length+1,set:s.setNo,rot:"P"+s.rot,type:"得点",num:"-",pos:"-",result:"自チーム得点",point:"自",score:s.my+"-"+s.op,time:new Date().toLocaleTimeString()});
  }else{
    s.op++; s.serve="opp";
    s.logs.push({no:s.logs.length+1,set:s.setNo,rot:"P"+s.rot,type:"得点",num:"-",pos:"-",result:"相手得点",point:"相",score:s.my+"-"+s.op,time:new Date().toLocaleTimeString()});
  }
  save(); render();
}
function manualRotate(){snap();nextRot();save();render();}
function toggleServe(){snap();s.serve=s.serve==="mine"?"opp":"mine";save();render();}
function undo(){const h=s.hist.pop();if(!h)return;s=JSON.parse(h);save();render();}
function goHome(){ if(confirm("ホームへ戻りますか？")){ show("home"); } }
function render(){
  if(document.getElementById("setup").classList.contains("active")) renderSetup();
  if(!document.getElementById("match").classList.contains("active") && !document.getElementById("report").classList.contains("active")) return;
  document.getElementById("rot").textContent=s.rot;
  document.getElementById("myScore").textContent=s.my;
  document.getElementById("opScore").textContent=s.op;
  document.getElementById("serveLabel").textContent=s.serve==="mine"?"自サーブ":"相手サーブ";
  document.getElementById("modeBadge").textContent=s.mode+" / "+s.result;
  const nums=rotationNums();
  const setterNum=rotatedSetterNum();
  document.querySelectorAll(".player").forEach(b=>{
    const n=nums[Number(b.dataset.pos)-1];
    b.textContent=n;
    b.classList.toggle("setter", n===setterNum);
  });
  document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("active", b.dataset.mode===s.mode));
  document.querySelectorAll(".results button").forEach(b=>b.classList.toggle("active", b.dataset.result===s.result));
  quick();
}
function quick(){
  const target=document.getElementById("quick");
  if(!target)return;
  const types=["トス","レセプ","ディグ","スパイク","ブロック","サーブ"];
  let html="<table><tr><th>項目</th><th>本数</th><th>成功率</th></tr>";
  types.forEach(t=>{
    const a=s.logs.filter(x=>x.type===t);
    const ok=a.filter(x=>x.result==="成功").length;
    const pct=a.length?Math.round(ok/a.length*100):0;
    html+=`<tr><td>${t}</td><td>${a.length}</td><td>${pct}%</td></tr>`;
  });
  html+="</table>";
  target.innerHTML=html;
}
function showReport(){report();show("report");}
function report(){
  const types=["トス","レセプ","ディグ","スパイク","ブロック","サーブ"];
  let html="<table><tr><th>項目</th><th>本数</th><th>成功</th><th>ミス</th><th>成功率</th></tr>";
  types.forEach(t=>{
    const a=s.logs.filter(x=>x.type===t);
    const ok=a.filter(x=>x.result==="成功").length;
    const miss=a.filter(x=>x.result==="ミス"||x.result==="被ブロック").length;
    const pct=a.length?Math.round(ok/a.length*100):0;
    html+=`<tr><td>${t}</td><td>${a.length}</td><td>${ok}</td><td>${miss}</td><td>${pct}%</td></tr>`;
  });
  html+="</table>";
  document.getElementById("reportAll").innerHTML=html;
  const toss=s.logs.filter(x=>x.type==="トス");
  let thtml="<table><tr><th>ゾーン</th><th>本数</th><th>配分</th></tr>";
  [["レフト",[4,5]],["センター",[3,6]],["ライト",[1,2]]].forEach(row=>{
    const a=toss.filter(x=>row[1].includes(Number(x.pos)));
    const pct=toss.length?Math.round(a.length/toss.length*100):0;
    thtml+=`<tr><td>${row[0]}</td><td>${a.length}</td><td>${pct}%</td></tr>`;
  });
  thtml+="</table>";
  document.getElementById("reportToss").innerHTML=thtml;
  const body=document.getElementById("logRows"); body.innerHTML="";
  s.logs.slice(-30).reverse().forEach(x=>{body.innerHTML+=`<tr><td>${x.no}</td><td>${x.rot}</td><td>${x.type}</td><td>${x.num}</td><td>${x.result}</td><td>${x.score}</td></tr>`;});
}
function downloadCSV(){
  const rows=[["No","Set","Rotation","Type","Number","Position","Result","Point","Score","Time"]];
  s.logs.forEach(x=>rows.push([x.no,x.set,x.rot,x.type,x.num,x.pos,x.result,x.point,x.score,x.time]));
  const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="setter_theory_log.csv"; a.click();
}
document.addEventListener("DOMContentLoaded",()=>{
  load();
  document.querySelectorAll(".setupSpot").forEach(b=>{
    b.addEventListener("click",(e)=>{ if(e.target.classList.contains("posSelect")) return; setupSelected=Number(b.dataset.spot);renderSetup();});
    b.addEventListener("keydown",(e)=>{ if(e.key==="Enter" || e.key===" "){setupSelected=Number(b.dataset.spot);renderSetup();}});
  });
  document.querySelectorAll(".posSelect").forEach(sel=>sel.addEventListener("change",(e)=>{
    const i=Number(e.target.dataset.posSelect);
    s.positions[i]=e.target.value;
    setupSelected=i;
    save();
    renderSetup();
  }));
  document.querySelectorAll(".player").forEach(b=>b.addEventListener("click",()=>add(b.dataset.pos)));
  document.querySelectorAll(".tabs button").forEach(b=>b.addEventListener("click",()=>{s.mode=b.dataset.mode;save();render();}));
  document.querySelectorAll(".results button").forEach(b=>b.addEventListener("click",()=>{s.result=b.dataset.result;save();render();}));
  if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js").catch(()=>{});}
  renderSetup();
  render();
});
