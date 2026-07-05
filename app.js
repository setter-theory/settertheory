let s = {
  team:"自チーム", oppTeam:"相手", setNo:"1",
  nums:["1","2","3","4","5","7"], setterIndex:3,
  positions:["ライト後衛","レフト後衛","レフト前衛","センター前衛","ライト前衛","センター後衛"],
  players:{"1":"","2":"","3":"","4":"","5":"","7":""},
  rot:1, my:0, op:0, serve:"mine",
  mode:"スパイク", result:"成功", logs:[], hist:[]
};
let setupSelected = 0;
let numberPool = ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15"];
const actionTypes=["トス","レセプ","ディグ","スパイク","ブロック","サーブ"];
const defaultPositions=["ライト後衛","レフト後衛","レフト前衛","センター前衛","ライト前衛","センター後衛"];

function show(id){
  document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.getElementById("bottomBar").classList.toggle("hidden", id==="home" || id==="setup");
  render();
}
function goHome(){
  if(confirm("ホームへ戻りますか？\n試合中の記録は保存されています。")){
    show("home");
  }
}
function save(){ localStorage.setItem("setterTheoryV2", JSON.stringify(s)); }
function load(){
  const x=localStorage.getItem("setterTheoryV2");
  if(x){
    try{s=JSON.parse(x);}catch(e){}
  }
  if(!s.positions) s.positions=defaultPositions.slice();
  if(!s.hist) s.hist=[];
  if(!s.logs) s.logs=[];
  if(!s.nums) s.nums=["1","2","3","4","5","7"];
  if(!s.players) s.players={};
  s.nums.forEach(n=>{ if(s.players[n]===undefined) s.players[n]=""; });
}
function snap(){
  s.hist.push(JSON.stringify({...s,hist:[]}));
  if(s.hist.length>300)s.hist.shift();
}
function rotateClockwiseOnce(a){
  // 表示上の時計回り：
  // 左上(pos2) → 上中(pos6) → 右上(pos1) → 右下(pos5) → 下中(pos4) → 左下(pos3)
  // s.numsの並びは [pos1,pos2,pos3,pos4,pos5,pos6]
  return [a[5], a[2], a[3], a[4], a[0], a[1]];
}
function rotationNums(){
  let a=s.nums.slice();
  for(let i=1;i<s.rot;i++){ a=rotateClockwiseOnce(a); }
  return a;
}
function rotatedSetterNum(){ return s.nums[s.setterIndex]; }
function nextRot(){ s.rot=s.rot%6+1; }
function getPlayerName(num){ return (s.players && s.players[String(num)]) ? s.players[String(num)] : ""; }
function serverPos(){
  // サーブ権ありのときは現在の右後衛(pos1)を赤枠にする
  return s.serve==="mine" ? 1 : null;
}

function playLabel(){
  if(s.mode==="トス") return `トス→${s.result}`;
  if(s.mode==="レセプ") return `${s.result}`;
  if(s.result==="エース") return "サービスエース";
  if(s.result==="シャット") return "ブロックシャット";
  if(s.result==="ワンタッチ") return "ブロックワンタッチ";
  if(s.result==="被ブロック") return "被ブロック";
  if(s.result==="継続") return `${s.mode}継続`;
  return `${s.mode}${s.result}`;
}
function addPlayerName(){
  const no=document.getElementById("newPlayerNo").value.trim();
  const name=document.getElementById("newPlayerName").value.trim();
  if(!no){ alert("背番号を入力してください"); return; }
  if(!s.players) s.players={};
  s.players[no]=name;
  if(!numberPool.includes(no)) numberPool.push(no);
  document.getElementById("newPlayerNo").value="";
  document.getElementById("newPlayerName").value="";
  save(); renderSetup(); renderMatchNumberBank(); render();
}

function renderSetup(){
  const spots=document.querySelectorAll(".setupSpot");
  spots.forEach((b,i)=>{
    b.classList.toggle("active", i===setupSelected);
    b.classList.toggle("setter", i===s.setterIndex);
    const currentNum=s.nums[i] || "-";
    const num=b.querySelector(".num");
    if(num) num.innerHTML=`<span>${currentNum}</span><span class="setupName">${getPlayerName(currentNum)}</span>`;
    const name=b.querySelector(".name");
    if(name) name.textContent=s.positions[i] || "";
    const sel=b.querySelector(".nameSelect");
    if(sel){
      const pool=[...new Set([...numberPool,...s.nums,Object.keys(s.players||{})].flat().filter(Boolean))].sort((a,b)=>Number(a)-Number(b));
      sel.innerHTML=pool.map(n=>`<option value="${n}" ${String(currentNum)===String(n)?"selected":""}>${n}${getPlayerName(n)?" "+getPlayerName(n):""}</option>`).join("");
    }
  });
  const used=new Set(s.nums);
  const bank=document.getElementById("numberBank");
  if(bank){
    bank.innerHTML="";
    const pool=[...new Set([...numberPool,...s.nums].filter(Boolean))].sort((a,b)=>Number(a)-Number(b));
    pool.forEach(n=>{
      const btn=document.createElement("button");
      btn.className="numBtn";
      btn.textContent=n;
      if(used.has(n))btn.classList.add("used");
      if(s.nums[setupSelected]===n)btn.classList.add("active");
      btn.onclick=()=>{s.nums[setupSelected]=n; if(!s.players) s.players={}; if(s.players[n]===undefined) s.players[n]=""; save(); renderSetup(); renderMatchNumberBank();};
      bank.appendChild(btn);
    });
  }
}
function addNumber(){
  const n=prompt("追加する背番号は？");
  if(!n)return;
  numberPool.push(n);
  if(!s.players) s.players={};
  if(s.players[n]===undefined) s.players[n]="";
  s.nums[setupSelected]=n;
  save(); renderSetup(); renderMatchNumberBank();
}
function toggleSetter(){
  s.setterIndex=setupSelected;
  save(); renderSetup(); render();
}
function startMatch(){
  s.team=document.getElementById("team").value || "自チーム";
  s.oppTeam=document.getElementById("oppTeam").value || "相手";
  s.setNo=document.getElementById("setNo").value;
  s.serve=document.getElementById("startServe").value;
  s.rot=1; s.my=0; s.op=0; s.mode="スパイク"; s.result="成功"; s.logs=[]; s.hist=[];
  save(); show("match");
}
function pointByResult(result){
  const before=s.serve;

  // 得点になるプレーのみ
  if(
    (s.mode==="スパイク" && result==="成功") ||
    (s.mode==="サーブ" && result==="エース") ||
    (s.mode==="ブロック" && result==="シャット")
  ){
    s.my++;
    if(before==="opp"){nextRot(); s.serve="mine";}
    return "自";
  }

  // 失点になるプレーのみ
  if(
    (s.mode==="スパイク" && (result==="ミス"||result==="被ブロック")) ||
    (s.mode==="サーブ" && result==="ミス") ||
    (s.mode==="レセプ" && result==="レセプミス") ||
    (s.mode==="ブロック" && result==="ブロックミス")
  ){
    s.op++;
    s.serve="opp";
    return "相";
  }

  // ディグ・トス・通常レセプ成功・継続などは得点なし
  return "継続";
}
function add(pos){
  const nums=rotationNums();
  const num=nums[Number(pos)-1];
  addByNumber(num, pos);
}
function addByNumber(num, pos="-"){
  snap();
  const point=pointByResult(s.result);
  s.logs.push({
    no:s.logs.length+1,set:s.setNo,rot:"S"+s.rot,type:s.mode,
    num:String(num),pos:String(pos),result:s.result,point:point,
    score:s.my+"-"+s.op,time:new Date().toLocaleTimeString()
  });
  save(); render();
}
function pointOnly(team){
  snap();
  if(team==="my"){
    const before=s.serve; s.my++;
    if(before==="opp"){nextRot(); s.serve="mine";}
    s.logs.push({no:s.logs.length+1,set:s.setNo,rot:"S"+s.rot,type:"得点",num:"-",pos:"-",result:"自チーム得点",point:"自",score:s.my+"-"+s.op,time:new Date().toLocaleTimeString()});
  }else{
    s.op++; s.serve="opp";
    s.logs.push({no:s.logs.length+1,set:s.setNo,rot:"S"+s.rot,type:"得点",num:"-",pos:"-",result:"相手得点",point:"相",score:s.my+"-"+s.op,time:new Date().toLocaleTimeString()});
  }
  save(); render();
}
function manualRotate(){snap();nextRot();save();render();}
function toggleServe(){snap();s.serve=s.serve==="mine"?"opp":"mine";save();render();}
function undo(){
  const h=s.hist.pop();
  if(!h){ alert("取り消す記録がありません"); return; }
  const keep=s.hist;
  s=JSON.parse(h);
  s.hist=keep;
  save(); render();
}
function clearLogs(){
  if(!confirm("すべての記録を消しますか？")) return;
  snap();
  s.logs=[]; s.my=0; s.op=0; s.rot=1; s.serve="mine";
  save(); render();
}
function render(){
  if(document.getElementById("setup").classList.contains("active")) renderSetup();
  if(!document.getElementById("match").classList.contains("active") && !document.getElementById("report").classList.contains("active")) return;
  document.getElementById("rot").textContent=s.rot;
  document.getElementById("myScore").textContent=s.my;
  document.getElementById("opScore").textContent=s.op;
  document.getElementById("serveLabel").textContent=s.serve==="mine"?"自サーブ":"相手サーブ";
  document.getElementById("modeBadge").textContent=playLabel();
  const spl=document.getElementById("selectedPlayLabel"); if(spl) spl.textContent=playLabel();
  const nums=rotationNums();
  const setterNum=rotatedSetterNum();
  document.querySelectorAll(".player").forEach(b=>{
    const n=nums[Number(b.dataset.pos)-1];
    b.textContent=n;
    b.classList.toggle("setter", n===setterNum);
  });
  document.querySelectorAll(".fastBtn").forEach(b=>b.classList.toggle("active", b.dataset.type===s.mode && b.dataset.result===s.result));
  renderMatchNumberBank();
  quick();
}
function renderMatchNumberBank(){
  const bank=document.getElementById("matchNumberBank");
  if(!bank) return;
  bank.innerHTML="";
  const pool=[...new Set(s.nums.filter(Boolean))].sort((a,b)=>Number(a)-Number(b));
  pool.forEach(n=>{
    const btn=document.createElement("button");
    btn.className="matchNumBtn";
    btn.textContent=n;
    btn.onclick=()=>addByNumber(n);
    bank.appendChild(btn);
  });
}

function isSuccessResult(x){
  return ["成功","エース","シャット","Aパス","Bパス","Cパス","レフト","センター","ライト","バック","ワンタッチ"].includes(x.result);
}
function isMissResult(x){
  return ["ミス","レセプミス","ブロックミス","被ブロック"].includes(x.result);
}

function buildOverallTable(){
  let html="<table><tr><th>項目</th><th>本数</th><th>成功</th><th>ミス</th><th>成功率</th></tr>";
  actionTypes.forEach(t=>{
    const a=s.logs.filter(x=>x.type===t);
    const ok=a.filter(isSuccessResult).length;
    const miss=a.filter(isMissResult).length;
    const pct=a.length?Math.round(ok/a.length*100):0;
    html+=`<tr><td>${t}</td><td>${a.length}</td><td>${ok}</td><td>${miss}</td><td>${pct}%</td></tr>`;
  });
  html+="</table>";
  return html;
}

function buildOverallBars(){
  const total=s.logs.filter(x=>actionTypes.includes(x.type)).length || 0;
  let html="<div class='barChart'>";
  actionTypes.forEach(t=>{
    const count=s.logs.filter(x=>x.type===t).length;
    const pct=total?Math.round(count/total*100):0;
    html+=`<div class="barRow"><div class="barLabel">${t}</div><div class="barTrack"><div class="barFill" style="width:${pct}%"></div></div><div class="barNum">${count}本</div></div>`;
  });
  html+="</div>";
  return html;
}
function buildResultBars(){
  const labels=["成功","ミス","被ブロック","継続"];
  const total=s.logs.filter(x=>actionTypes.includes(x.type)).length || 0;
  let html="<div class='barChart'>";
  labels.forEach(t=>{
    const count=s.logs.filter(x=>x.result===t).length;
    const pct=total?Math.round(count/total*100):0;
    html+=`<div class="barRow"><div class="barLabel">${t}</div><div class="barTrack"><div class="barFill result" style="width:${pct}%"></div></div><div class="barNum">${count}本</div></div>`;
  });
  html+="</div>";
  return html;
}
function buildPersonalBars(){
  const nums=[...new Set(s.nums.concat(s.logs.map(x=>x.num)).filter(n=>n && n!=="-"))].sort((a,b)=>Number(a)-Number(b));
  const max=Math.max(1,...nums.map(n=>s.logs.filter(x=>String(x.num)===String(n)).length));
  let html="<div class='barChart'>";
  nums.forEach(n=>{
    const count=s.logs.filter(x=>String(x.num)===String(n)).length;
    const pct=Math.round(count/max*100);
    html+=`<div class="barRow"><div class="barLabel">${n}番</div><div class="barTrack"><div class="barFill person" style="width:${pct}%"></div></div><div class="barNum">${count}本</div></div>`;
  });
  html+="</div>";
  return html;
}

function pctClass(pct){
  if(pct>=60) return "good";
  if(pct>=40) return "mid";
  return "bad";
}
function buildReportHero(){
  const actionLogs=s.logs.filter(x=>actionTypes.includes(x.type));
  const total=actionLogs.length;
  const ok=actionLogs.filter(isSuccessResult).length;
  const miss=actionLogs.filter(isMissResult).length;
  const blocked=actionLogs.filter(x=>x.result==="被ブロック").length;
  const okPct=total?Math.round(ok/total*100):0;
  const missPct=total?Math.round(miss/total*100):0;
  const blockPct=total?Math.round(blocked/total*100):0;
  return `<div class="reportHero">
    <div class="metricCard"><div class="metricLabel">総入力</div><div class="metricValue">${total}</div><div class="metricSub">本</div></div>
    <div class="metricCard"><div class="metricLabel">成功率</div><div class="metricValue">${okPct}%</div><div class="metricSub">${ok}/${total}</div></div>
    <div class="metricCard"><div class="metricLabel">失点系</div><div class="metricValue">${missPct+blockPct}%</div><div class="metricSub">ミス＋被ブロック</div></div>
  </div>`;
}
function buildResultSummary(){
  const actionLogs=s.logs.filter(x=>actionTypes.includes(x.type));
  const total=actionLogs.length || 0;
  const groups=[
    ["成功系","success",x=>isSuccessResult(x)],
    ["失点系","miss",x=>isMissResult(x)],
    ["被ブロック","blocked",x=>x.result==="被ブロック"],
    ["継続","cont",x=>x.result==="継続"]
  ];
  return `<div class="resultSummary">${
    groups.map(([label,cls,fn])=>{
      const count=actionLogs.filter(fn).length;
      const pct=total?Math.round(count/total*100):0;
      return `<div class="resultBox ${cls}"><div class="label">${label}</div><div class="pct">${pct}%</div><div class="metricSub">${count}/${total}</div></div>`;
    }).join("")
  }</div>`;
}
function buildActionPercentBars(){
  const total=s.logs.filter(x=>actionTypes.includes(x.type)).length || 0;
  let html="<div class='bigBarChart'>";
  actionTypes.forEach(t=>{
    const count=s.logs.filter(x=>x.type===t).length;
    const pct=total?Math.round(count/total*100):0;
    html+=`<div class="bigBarRow"><div class="bigBarLabel">${t}</div><div class="bigBarTrack"><div class="bigBarFill" style="width:${pct}%"></div></div><div class="bigBarPct">${pct}%</div></div>`;
  });
  html+="</div>";
  return html;
}
function buildSuccessPercentTable(){
  let html="<table class='percentTable'><tr><th>項目</th><th>成功率</th><th>成功/本数</th><th>ミス</th><th>被ブロック</th></tr>";
  actionTypes.forEach(t=>{
    const a=s.logs.filter(x=>x.type===t);
    const total=a.length;
    const ok=a.filter(isSuccessResult).length;
    const miss=a.filter(x=>x.result==="ミス").length;
    const blocked=a.filter(x=>x.result==="被ブロック").length;
    const pct=total?Math.round(ok/total*100):0;
    html+=`<tr><td>${t}</td><td><span class="percentCell ${pctClass(pct)}">${pct}%</span></td><td>${ok}/${total}</td><td>${miss}</td><td>${blocked}</td></tr>`;
  });
  html+="</table>";
  return html;
}
function buildPersonalSuccessTable(){
  const nums=[...new Set(s.nums.concat(s.logs.map(x=>x.num)).filter(n=>n && n!=="-"))].sort((a,b)=>Number(a)-Number(b));
  let html="<table class='percentTable'><tr><th>選手</th><th>成功率</th><th>成功/本数</th><th>ミス</th><th>被ブロック</th></tr>";
  nums.forEach(n=>{
    const a=s.logs.filter(x=>String(x.num)===String(n) && actionTypes.includes(x.type));
    const total=a.length;
    const ok=a.filter(isSuccessResult).length;
    const miss=a.filter(x=>x.result==="ミス").length;
    const blocked=a.filter(x=>x.result==="被ブロック").length;
    const pct=total?Math.round(ok/total*100):0;
    const name=getPlayerName(n);
    html+=`<tr><td>${n}${name?`<br><small>${name}</small>`:""}</td><td><span class="percentCell ${pctClass(pct)}">${pct}%</span></td><td>${ok}/${total}</td><td>${miss}</td><td>${blocked}</td></tr>`;
  });
  html+="</table>";
  return html;
}


function buildIndividualTable(){
  const nums=[...new Set(s.nums.concat(s.logs.map(x=>x.num)).filter(n=>n && n!=="-"))].sort((a,b)=>Number(a)-Number(b));
  let html="<table><tr><th>番</th>"+actionTypes.map(t=>`<th>${t}</th>`).join("")+"<th>合計</th></tr>";
  nums.forEach(n=>{
    const logs=s.logs.filter(x=>String(x.num)===String(n));
    html+=`<tr><td>${n}</td>`;
    actionTypes.forEach(t=>{html+=`<td>${logs.filter(x=>x.type===t).length}</td>`;});
    html+=`<td>${logs.length}</td></tr>`;
  });
  html+="</table>";
  return html;
}
function quick(){
  const target=document.getElementById("quick");
  if(!target)return;
  target.innerHTML=`
    ${buildReportHero()}
    ${buildResultSummary()}
    <div class="quickWrap">
      <div><div class="quickTitle">項目別の割合</div>${buildActionPercentBars()}</div>
      <div><div class="quickTitle">項目別の成功率</div><div class="quickScroll">${buildSuccessPercentTable()}</div></div>
      <div><div class="quickTitle">個人別の成功率</div><div class="quickScroll">${buildPersonalSuccessTable()}</div></div>
      <div><div class="quickTitle">選手別の入力数</div>${buildPersonalBars()}</div>
    </div>`;
}
function showReport(){report();show("report");}
function report(){
  document.getElementById("reportAll").innerHTML=
    buildReportHero()+
    buildResultSummary()+
    "<h3 style='margin-top:14px'>項目別の割合</h3>"+buildActionPercentBars()+
    "<h3 style='margin-top:14px'>項目別の成功率</h3>"+buildSuccessPercentTable()+
    "<h3 style='margin-top:14px'>個人別の成功率</h3>"+buildPersonalSuccessTable()+
    "<h3 style='margin-top:14px'>選手別の入力数</h3>"+buildPersonalBars();
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
  const rows=[["No","Set","Rotation","Type","Number","Name","Position","Result","Point","Score","Time"]];
  s.logs.forEach(x=>rows.push([x.no,x.set,x.rot,x.type,x.num,getPlayerName(x.num),x.pos,x.result,x.point,x.score,x.time]));
  const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="setter_theory_log.csv"; a.click();
}
document.addEventListener("DOMContentLoaded",()=>{
  load();
  document.querySelectorAll(".setupSpot").forEach(b=>{
    b.addEventListener("click",(e)=>{ if(e.target.classList.contains("posSelect")) return; setupSelected=Number(b.dataset.spot);renderSetup();});
    b.addEventListener("keydown",(e)=>{ if(e.key==="Enter"||e.key===" "){setupSelected=Number(b.dataset.spot);renderSetup();}});
  });
  document.querySelectorAll(".nameSelect").forEach(sel=>sel.addEventListener("change",(e)=>{
    const i=Number(e.target.dataset.nameSelect);
    const no=e.target.value;
    s.nums[i]=no;
    if(!s.players) s.players={};
    if(s.players[no]===undefined) s.players[no]="";
    setupSelected=i;
    save(); renderSetup(); renderMatchNumberBank(); render();
  }));
  document.querySelectorAll(".player").forEach(b=>b.addEventListener("click",()=>add(b.dataset.pos)));
  document.querySelectorAll(".fastBtn").forEach(b=>b.addEventListener("click",()=>{
    s.mode=b.dataset.type;
    s.result=b.dataset.result;
    save();
    render();
  }));
  if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js").catch(()=>{});}
  renderSetup();
  render();
});
