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

  // 自チーム得点になるもの
  if(
    (s.mode==="スパイク" && result==="成功") ||
    (s.mode==="サーブ" && result==="エース") ||
    (s.mode==="ブロック" && result==="シャット")
  ){
    s.my++;
    if(before==="opp"){ nextRot(); s.serve="mine"; }
    return "自";
  }

  // 相手得点になるもの
  if(
    (s.mode==="スパイク" && (result==="ミス" || result==="被ブロック")) ||
    (s.mode==="サーブ" && result==="ミス") ||
    (s.mode==="レセプ" && result==="ミス") ||
    (s.mode==="レセプ" && result==="レセプミス") ||
    (s.mode==="ディグ" && result==="ミス") ||
    (s.mode==="ブロック" && result==="ミス") ||
    (s.mode==="ブロック" && result==="ブロックミス")
  ){
    s.op++;
    s.serve="opp";
    return "相";
  }

  // レセプA/B/C、ディグ成功、トス先、ワンタッチ、継続などは得点なし
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
  return (
    (x.type==="スパイク" && (x.result==="ミス" || x.result==="被ブロック")) ||
    (x.type==="サーブ" && x.result==="ミス") ||
    (x.type==="レセプ" && (x.result==="ミス" || x.result==="レセプミス")) ||
    (x.type==="ディグ" && x.result==="ミス") ||
    (x.type==="ブロック" && (x.result==="ミス" || x.result==="ブロックミス"))
  );
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

function safePct(part,total){ return total ? Math.round(part/total*100) : 0; }
function cssClassByPct(pct){ if(pct>=70)return ""; if(pct>=50)return "mid"; return "bad"; }
function donutStyle(items){
  const total=items.reduce((a,x)=>a+x.count,0) || 1;
  let deg=0;
  const parts=items.map(x=>{
    const start=deg;
    deg += x.count/total*360;
    return `${x.color} ${start}deg ${deg}deg`;
  });
  return `conic-gradient(${parts.join(",")})`;
}
function legendHtml(items,total){
  return `<div class="legend">`+items.map(x=>{
    const pct=safePct(x.count,total);
    return `<div class="legendRow"><span class="dot" style="background:${x.color}"></span><span>${x.label}</span><span>${pct}% (${x.count})</span></div>`;
  }).join("")+`</div>`;
}
function metricCard(label,value,sub,color,icon,pct){
  return `<div class="statCard">
    <div class="statTop"><span class="statIcon">${icon}</span><span>${label}</span></div>
    <div class="statValue ${color}">${value}</div>
    <div class="statSub">${sub}</div>
    <div class="miniTrack"><div class="miniFill" style="width:${Math.max(0,Math.min(100,pct||0))}%;background:var(--${color==='blue'?'blue':color==='red'?'red':color==='green'?'green':color==='orange'?'orange':'purple'})"></div></div>
  </div>`;
}

let reportRankType = localStorage.getItem("vollyzeReportRankType") || "スパイク";
let reportSortType = localStorage.getItem("vollyzeReportSortType") || "rate";

function safePct(part,total){ return total ? Math.round(part/total*100) : 0; }
function cssClassByPct(pct){ if(pct>=70)return ""; if(pct>=50)return "mid"; return "bad"; }
function donutStyle(items){
  const total=items.reduce((a,x)=>a+x.count,0) || 1;
  let deg=0;
  const parts=items.map(x=>{const st=deg; deg += x.count/total*360; return `${x.color} ${st}deg ${deg}deg`;});
  return `conic-gradient(${parts.join(",")})`;
}
function legendHtml(items,total){
  return `<div class="legend">`+items.map(x=>{
    const pct=safePct(x.count,total);
    return `<div class="legendRow"><span class="dot" style="background:${x.color}"></span><span>${x.label}</span><span>${pct}% (${x.count})</span></div>`;
  }).join("")+`</div>`;
}
function metricCard(label,value,sub,color,icon,pct){
  const c=color==='blue'?'#2563eb':color==='red'?'#dc2626':color==='green'?'#16a34a':color==='orange'?'#f97316':'#7c3aed';
  return `<div class="statCard">
    <div class="statTop"><span class="statIcon">${icon}</span><span>${label}</span></div>
    <div class="statValue ${color}">${value}</div>
    <div class="miniTrack">
      <div class="miniFill" style="width:${Math.max(0,Math.min(100,pct||0))}%;background:${c}"></div>
      <div class="barValue">${value}</div>
    </div>
    <div class="statSub">${sub}</div>
  </div>`;
}
function rankConfig(type){
  const map={
    "スパイク":{title:"スパイク決定率ランキング", success:"決定数", total:"打数", rate:"決定率", note:"決定率 ＝ スパイク成功 ÷ スパイク打数", ok:x=>x.type==="スパイク"&&x.result==="成功", all:x=>x.type==="スパイク"},
    "サーブ":{title:"サーブ成功率ランキング", success:"成功数", total:"総数", rate:"成功率", note:"成功率 ＝ サーブ成功＋サービスエース ÷ サーブ総数", ok:x=>x.type==="サーブ"&&(x.result==="成功"||x.result==="エース"), all:x=>x.type==="サーブ"},
    "レセプ":{title:"レセプション成功率ランキング", success:"成功数", total:"総数", rate:"成功率", note:"成功率 ＝ Aパス＋Bパス＋Cパス ÷ レセプ総数", ok:x=>x.type==="レセプ"&&(x.result==="Aパス"||x.result==="Bパス"||x.result==="Cパス"), all:x=>x.type==="レセプ"},
    "トス":{title:"トス成功率ランキング", success:"成功数", total:"総数", rate:"成功率", note:"成功率 ＝ レフト/センター/ライト/バックへ上げたトス ÷ トス総数", ok:x=>x.type==="トス", all:x=>x.type==="トス"},
    "ディグ":{title:"ディグ成功率ランキング", success:"成功数", total:"総数", rate:"成功率", note:"成功率 ＝ ディグ成功 ÷ ディグ総数", ok:x=>x.type==="ディグ"&&x.result==="成功", all:x=>x.type==="ディグ"},
    "ブロック":{title:"ブロック成功率ランキング", success:"成功数", total:"総数", rate:"成功率", note:"成功率 ＝ シャット＋ワンタッチ ÷ ブロック総数", ok:x=>x.type==="ブロック"&&(x.result==="シャット"||x.result==="ワンタッチ"), all:x=>x.type==="ブロック"}
  };
  return map[type] || map["スパイク"];
}
function buildPersonalRanking(){
  const cfg=rankConfig(reportRankType);
  const nums=[...new Set(s.nums.concat(s.logs.map(x=>x.num)).filter(n=>n && n!=="-"))].sort((a,b)=>Number(a)-Number(b));
  let rows=nums.map(n=>{
    const all=s.logs.filter(x=>String(x.num)===String(n) && cfg.all(x));
    const ok=all.filter(cfg.ok).length;
    const pct=safePct(ok,all.length);
    return {n,name:getPlayerName(n)||`${n}番`, ok,total:all.length,pct};
  });
  rows.sort((a,b)=>{
    if(reportSortType==="success") return b.ok-a.ok || b.pct-a.pct;
    if(reportSortType==="tries") return b.total-a.total || b.pct-a.pct;
    return b.pct-a.pct || b.ok-a.ok || b.total-a.total;
  });
  const list=rows.map((r,i)=>`
    <div class="bigBarRow">
      <div class="bigBarRank">${i+1}</div>
      <div class="bigBarName">${r.n} ${r.name}</div>
      <div class="bigBarNum">${r.ok}</div>
      <div class="bigBarNum">${r.total}</div>
      <div class="bigBarTrack"><div class="bigBarFill" style="width:${r.pct}%"></div></div>
      <div class="bigBarBadge ${cssClassByPct(r.pct)}">${r.pct}%</div>
    </div>`).join("");
  return `<div class="rankControls">
    <div><label>表示項目</label><br><select id="rankTypeSelect" onchange="reportRankType=this.value;localStorage.setItem('vollyzeReportRankType',this.value);report();">
      ${["スパイク","サーブ","レセプ","トス","ディグ","ブロック"].map(t=>`<option value="${t}" ${reportRankType===t?"selected":""}>${rankConfig(t).title}</option>`).join("")}
    </select></div>
    <div><label>並び替え</label><br><select id="rankSortSelect" onchange="reportSortType=this.value;localStorage.setItem('vollyzeReportSortType',this.value);report();">
      <option value="rate" ${reportSortType==="rate"?"selected":""}>成功率順</option>
      <option value="success" ${reportSortType==="success"?"selected":""}>成功数順</option>
      <option value="tries" ${reportSortType==="tries"?"selected":""}>試行数順</option>
    </select></div>
  </div>
  <h3>個人成績 <small>（${cfg.title}）</small></h3>
  <div class="bigBarRow" style="font-size:12px;color:var(--muted);font-weight:1000">
    <div>順位</div><div>選手</div><div>${cfg.success}</div><div>${cfg.total}</div><div></div><div>${cfg.rate}</div>
  </div>
  <div class="bigBars">${list}</div>
  <div class="rankNote">※ ${cfg.note}</div>`;
}
function report(){
  const actionLogs=s.logs.filter(x=>actionTypes.includes(x.type));
  const total=actionLogs.length;
  const success=actionLogs.filter(isSuccessResult).length;
  const loss=s.logs.filter(x=>x.point==="相").length;
  const myPts=s.logs.filter(x=>x.point==="自").length;
  const opPts=s.logs.filter(x=>x.point==="相").length;
  const serveLogs=s.logs.filter(x=>x.type==="サーブ");
  const serveOk=serveLogs.filter(x=>x.result==="成功"||x.result==="エース").length;
  const spikeLogs=s.logs.filter(x=>x.type==="スパイク");
  const spikeKill=spikeLogs.filter(x=>x.result==="成功").length;

  const successPct=safePct(success,total), lossPct=safePct(loss,total), servePct=safePct(serveOk,serveLogs.length), spikePct=safePct(spikeKill,spikeLogs.length);
  const summary=`<div class="summaryCards">
    ${metricCard("成功率",successPct+"%",`成功 ${success} / 総数 ${total}`,"blue","🎯",successPct)}
    ${metricCard("失点率",lossPct+"%",`失点 ${loss} / 総数 ${total}`,"red","🛡",lossPct)}
    ${metricCard("サーブ成功率",servePct+"%",`成功 ${serveOk} / 総数 ${serveLogs.length}`,"green","🏐",servePct)}
    ${metricCard("スパイク決定率",spikePct+"%",`決定 ${spikeKill} / 打数 ${spikeLogs.length}`,"orange","🏃",spikePct)}
    ${metricCard("総プレー数",total,`総数 ${total}プレー`,"purple","〽",100)}
  </div>`;

  const playColors={"サーブ":"#ef4444","レセプ":"#2563eb","スパイク":"#22c55e","トス":"#f59e0b","ディグ":"#7c3aed","ブロック":"#334155"};
  const playItems=actionTypes.map(t=>({label:t,count:s.logs.filter(x=>x.type===t).length,color:playColors[t]})).filter(x=>x.count>0);
  const playDonut=`<div class="donutWrap"><div class="donut" style="background:${donutStyle(playItems)}"><div class="donutCenter"><div class="label">総数</div><div class="num">${total}</div></div></div>${legendHtml(playItems,total)}</div>`;

  const resultGroups=[
    {label:"成功系",count:actionLogs.filter(isSuccessResult).length,color:"#22c55e"},
    {label:"継続",count:actionLogs.filter(x=>x.result==="継続").length,color:"#2563eb"},
    {label:"ミス",count:actionLogs.filter(x=>x.result==="ミス"||x.result==="レセプミス"||x.result==="ブロックミス").length,color:"#ef4444"},
    {label:"被ブロック",count:actionLogs.filter(x=>x.result==="被ブロック").length,color:"#f59e0b"},
  ].filter(x=>x.count>0);
  const resultDonut=`<div class="donutWrap"><div class="donut" style="background:${donutStyle(resultGroups)}"><div class="donutCenter"><div class="label">総数</div><div class="num">${total}</div></div></div>${legendHtml(resultGroups,total)}</div>`;

  const pointItems=[{label:"自チーム得点",count:myPts,color:"#22c55e"},{label:"相手チーム得点",count:opPts,color:"#ef4444"}].filter(x=>x.count>0);
  const pointDonut=`<div class="donutWrap"><div class="donut" style="background:${donutStyle(pointItems)}"><div class="donutCenter"><div class="label">合計</div><div class="num">${myPts+opPts}</div></div></div>${legendHtml(pointItems,myPts+opPts)}</div>`;

  const rotationRows=[1,2,3,4,5,6].map(r=>{
    const a=s.logs.filter(x=>x.rot==="S"+r);
    const ok=a.filter(isSuccessResult).length;
    const pct=safePct(ok,a.length);
    return `<div class="rotationRow ${s.rot===r?"currentRotation":""}"><div class="rotationLabel">S${r}</div><div class="rotationPct">${pct}% (${ok}/${a.length})</div><div class="rotationTrack"><div class="rotationFill ${cssClassByPct(pct)}" style="width:${pct}%"></div></div></div>`;
  }).join("");

  const tossLogs=s.logs.filter(x=>x.type==="トス");
  const tossLabels=["レフト","センター","ライト","バック"];
  const tossColors={"レフト":"#ef4444","センター":"#2563eb","ライト":"#22c55e","バック":"#f59e0b"};
  const tossItems=tossLabels.map(t=>({label:t,count:tossLogs.filter(x=>x.result===t).length,color:tossColors[t]})).filter(x=>x.count>0);
  const tossDonut=`<div class="tossPanel"><div class="donut" style="background:${donutStyle(tossItems)}"><div class="donutCenter"><div class="label">総数</div><div class="num">${tossLogs.length}</div></div></div>${legendHtml(tossItems,tossLogs.length)}</div>`;

  const iconFor=x=>{if(isMissResult(x)) return ["×","tMiss"]; if(x.result==="被ブロック") return ["△","tBlock"]; if(x.result==="継続") return ["−","tCont"]; return ["○","tSuccess"];};
  const recent=s.logs.slice(-20).map(x=>{const [ic,cls]=iconFor(x);return `<div class="timelineItem"><div class="timelineNo">${x.no}</div><div class="timelineIcon ${cls}">${ic}</div><div class="timelineText">${x.type}</div></div>`;}).join("");

  const dashboard=`<div class="reportGrid">
    ${summary}
    <div class="panelGrid">
      <div class="reportPanel"><h3>プレー割合 <small>（何をどれだけやったか）</small></h3>${playDonut}</div>
      <div class="reportPanel"><h3>結果割合 <small>（プレーの結果）</small></h3>${resultDonut}</div>
      <div class="reportPanel"><h3>得点・失点</h3>${pointDonut}</div>
    </div>
    <div class="wideGrid">
      <div class="reportPanel">${buildPersonalRanking()}</div>
      <div class="reportPanel"><h3>ローテーション別 成功率</h3>${rotationRows}</div>
    </div>
    <div class="bottomGrid">
      <div class="reportPanel"><h3>トス配分 <small>（どこに集めているか）</small></h3>${tossDonut}</div>
      <div class="reportPanel"><h3>直近ログ <small>（最新20プレー）</small></h3><div class="timeline">${recent}</div><div class="logLegend"><span>🟢 成功系</span><span>🔵 継続</span><span>🔴 ミス</span><span>🟠 被ブロック</span></div></div>
    </div>
  </div>`;
  const dash=document.getElementById("reportDashboard"); if(dash) dash.innerHTML=dashboard;
  const sub=document.getElementById("reportSub"); if(sub) sub.textContent=`${new Date().toLocaleDateString()}　vs ${s.oppTeam || "相手"}`;
}

function downloadCSV(){
  const rows=[["No","Set","Rotation","Type","Number","Name","Position","Result","Point","Score","Time"]];
  s.logs.forEach(x=>rows.push([x.no,x.set,x.rot,x.type,x.num,getPlayerName(x.num),x.pos,x.result,x.point,x.score,x.time]));
  const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="setter_theory_log.csv"; a.click();
}


// v19: Vollyze CSV自動解析（実データ形式に対応）
function normalizeKey(v){
  return String(v||'').toLowerCase().replace(/[\s_\-・./()（）]/g,'');
}
function findHeader(headers, keywords){
  const ns=headers.map(h=>[h, normalizeKey(h)]);
  for(const kw of keywords){
    const nkw=normalizeKey(kw);
    const hit=ns.find(([h,n])=>n===nkw || n.includes(nkw));
    if(hit) return hit[0];
  }
  return null;
}
function getCell(row, keys){
  for(const k of keys){
    if(k && row[k]!==undefined && String(row[k]).trim()!=='') return String(row[k]).trim();
  }
  return '';
}
function classifyTossTarget(value){
  const v=String(value||'').trim();
  const n=normalizeKey(v);
  if(!v) return '未分類';
  if(/レフト|left|outside|oh|ls/.test(n)) return 'レフト';
  if(/センター|ミドル|middle|mb|quick|クイック/.test(n)) return 'センター';
  if(/ライト|right|opposite|rs/.test(n)) return 'ライト';
  if(/バック|back|pipe|bick|パイプ/.test(n)) return 'バック';
  if(/^1$|^１$|pos1|p1/.test(n)) return 'ライト';
  if(/^2$|^２$|^4$|^４$|pos2|p2|pos4|p4/.test(n)) return 'レフト';
  if(/^3$|^３$|pos3|p3/.test(n)) return 'センター';
  if(/^6$|^６$|pos6|p6/.test(n)) return 'バック';
  return v;
}
function addCount(obj,key){ obj[key]=(obj[key]||0)+1; }
function pctText(count,total){ return total ? Math.round(count/total*100) : 0; }
function analysisItemsFromCounts(counts,total){
  const order=['レフト','センター','ライト','バック','未分類'];
  return Object.entries(counts)
    .sort((a,b)=>{
      const ia=order.indexOf(a[0])>=0?order.indexOf(a[0]):99;
      const ib=order.indexOf(b[0])>=0?order.indexOf(b[0]):99;
      return ia===ib ? b[1]-a[1] : ia-ib;
    })
    .map(([label,count])=>({label,count,pct:pctText(count,total)}));
}
function analyzeImportedCsv(parsed){
  const headers=parsed?.headers||[];
  const rows=parsed?.data||[];
  const actionCol=findHeader(headers,['Type','種類','Action','Skill','Play','プレー','項目','動作']);
  const resultCol=findHeader(headers,['Result','結果','Outcome','評価','Eval','Grade']);
  const setCol=findHeader(headers,['Set','セット']);
  const rotCol=findHeader(headers,['Rotation','ローテーション','Rot','ローテ']);
  const numberCol=findHeader(headers,['Number','背番号','No','Player','選手']);
  const scoreCol=findHeader(headers,['Score','スコア']);

  // Vollyze/Setter Theory実データ：Type=トス、Result=レフト/センター/ライト
  const tossRows=rows.filter(r=>{
    const a=getCell(r,[actionCol]);
    return normalizeKey(a)==='トス' || /^set$|^toss$/.test(normalizeKey(a));
  });
  const base=tossRows.length ? tossRows : rows.filter(r=>/トス/.test(headers.map(h=>String(r[h]||'')).join(' ')));
  const targetCounts={};
  const bySet={};
  const byRot={};
  const bySetter={};

  base.forEach(r=>{
    const targetRaw=getCell(r,[resultCol]);
    const label=classifyTossTarget(targetRaw);
    addCount(targetCounts,label);

    const setName=getCell(r,[setCol]) || '未設定';
    bySet[setName]=bySet[setName] || {};
    addCount(bySet[setName],label);

    const rotName=getCell(r,[rotCol]) || '未設定';
    byRot[rotName]=byRot[rotName] || {};
    addCount(byRot[rotName],label);

    const setterNo=getCell(r,[numberCol]) || '-';
    bySetter[setterNo]=bySetter[setterNo] || 0;
    bySetter[setterNo]++;
  });

  const total=base.length;
  const items=analysisItemsFromCounts(targetCounts,total);
  const max=Math.max(0,...Object.values(targetCounts));
  const sideDepend=pctText(max,total);
  const validTargets=Object.keys(targetCounts).filter(k=>k!=='未分類');
  const diversity=validTargets.length;
  const centerPct=pctText(targetCounts['センター']||0,total);
  const leftRightBalance=100 - Math.abs((targetCounts['レフト']||0) - (targetCounts['ライト']||0)) / Math.max(1,total) * 100;
  const setterIq=Math.max(40, Math.min(99, Math.round(50 + diversity*8 + centerPct*0.35 + leftRightBalance*0.18 - Math.max(0,sideDepend-50)*0.35)));

  return {headers, rows, actionCol, resultCol, setCol, rotCol, numberCol, scoreCol, tossRows:base, total, items, setterIq, sideDepend, diversity, bySet, byRot, bySetter, usedFallback:!tossRows.length};
}
function compactBreakdownTable(title, data){
  const keys=Object.keys(data).sort((a,b)=>String(a).localeCompare(String(b),'ja',{numeric:true}));
  if(!keys.length) return `<div class="csvSubPanel"><b>${title}</b><div class="csvSmall">データなし</div></div>`;
  const rows=keys.map(k=>{
    const counts=data[k];
    const total=Object.values(counts).reduce((a,b)=>a+b,0);
    const items=analysisItemsFromCounts(counts,total).filter(x=>x.count>0);
    return `<tr><td>${escapeHtml(k)}</td><td>${items.map(x=>`${escapeHtml(x.label)} ${x.pct}%`).join(' / ')}</td><td>${total}本</td></tr>`;
  }).join('');
  return `<div class="csvSubPanel"><b>${title}</b><table class="csvMiniTable"><tbody>${rows}</tbody></table></div>`;
}
function renderCsvAnalysis(parsed){
  const box=document.getElementById('csvAnalysisBox');
  if(!box) return;
  if(!parsed || !(parsed.data||[]).length){ box.style.display='none'; box.innerHTML=''; return; }
  const a=analyzeImportedCsv(parsed);
  box.style.display='block';
  const bars=a.items.map(x=>`<div class="csvAnaRow"><div class="csvAnaLabel">${escapeHtml(x.label)}</div><div class="csvAnaTrack"><div class="csvAnaFill" style="width:${x.pct}%"></div></div><div class="csvAnaPct">${x.pct}%</div><div class="csvAnaCount">${x.count}本</div></div>`).join('') || '<div class="csvSmall">集計できるデータがありません。</div>';
  const main=a.items[0];
  const center=a.items.find(x=>x.label==='センター');
  let comment='CSVを読み込みました。Type=トスの行から、Resultに入っているトス先を集計しています。';
  if(main && a.total){
    comment=`一番多い配球は「${escapeHtml(main.label)}」で${main.pct}%です。${main.pct>=55?'偏りが強めなので、序盤からセンターや逆サイドを見せると相手ブロックを動かしやすくなります。':'極端な偏りは少なく、配球の幅を作れています。'}${center && center.pct<18?' センター使用率が低めなので、Aパス時だけでも速攻を見せたいです。':''}`;
  }
  box.innerHTML=`
    <div class="csvAnalysisHead">
      <div><div class="csvAnalysisTitle">📊 CSV自動解析 v19</div><div class="csvSmall">${a.usedFallback?'※ Type=トスを完全特定できなかったため、トスを含む行で仮集計しています。':'Type=トス / Result=トス先 として解析しました。'}</div></div>
      <div class="csvIq"><span>Setter IQ</span><b>${a.setterIq}</b></div>
    </div>
    <div class="csvMetaGrid">
      <div><b>${a.total}</b><span>トス本数</span></div>
      <div><b>${a.diversity}</b><span>配球先</span></div>
      <div><b>${a.sideDepend}%</b><span>最大依存率</span></div>
    </div>
    <div class="csvAnaBars">${bars}</div>
    <div class="csvSubGrid">
      ${compactBreakdownTable('セット別 配球割合', a.bySet)}
      ${compactBreakdownTable('ローテ別 配球割合', a.byRot)}
    </div>
    <div class="csvCoachComment"><b>AIコメント</b><br>${comment}</div>
    <div class="csvSmall">検出列：Type=${escapeHtml(a.actionCol||'未検出')} / Result=${escapeHtml(a.resultCol||'未検出')} / Set=${escapeHtml(a.setCol||'未検出')} / Rotation=${escapeHtml(a.rotCol||'未検出')}</div>
  `;
}

document.addEventListener("DOMContentLoaded",()=>{
  setupCsvImport();
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


// v17 CSV読み込み
let importedCsv = null;

function parseCSVText(text){
  const rows = [];
  let row = [];
  let cell = "";
  let quote = false;

  for(let i=0; i<text.length; i++){
    const ch = text[i];
    const next = text[i+1];

    if(ch === '"' && quote && next === '"'){
      cell += '"';
      i++;
      continue;
    }
    if(ch === '"'){
      quote = !quote;
      continue;
    }
    if(ch === "," && !quote){
      row.push(cell);
      cell = "";
      continue;
    }
    if((ch === "\n" || ch === "\r") && !quote){
      if(ch === "\r" && next === "\n") i++;
      row.push(cell);
      if(row.some(v => String(v).trim() !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += ch;
  }
  row.push(cell);
  if(row.some(v => String(v).trim() !== "")) rows.push(row);

  if(!rows.length) return {headers:[], data:[]};
  const headers = rows[0].map((h,i)=>String(h || `列${i+1}`).trim());
  const data = rows.slice(1).map(r=>{
    const obj = {};
    headers.forEach((h,i)=>obj[h] = (r[i] ?? "").trim());
    return obj;
  });
  return {headers, data};
}

function renderCsvPreview(parsed, fileName){
  const status = document.getElementById("csvImportStatus");
  const box = document.getElementById("csvPreviewBox");
  if(!status || !box) return;

  const rows = parsed.data || [];
  const headers = parsed.headers || [];

  status.innerHTML = `✅ 読み込み完了：${fileName}<div class="csvSmall">列数 ${headers.length} / データ行 ${rows.length}</div>`;

  if(!headers.length){
    box.style.display = "block";
    box.innerHTML = "<div style='padding:12px;font-weight:1000'>CSVの列を読み取れませんでした。</div>";
    return;
  }

  const previewRows = rows.slice(0, 10);
  box.style.display = "block";
  box.innerHTML = `
    <table>
      <thead><tr>${headers.map(h=>`<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
      <tbody>
        ${previewRows.map(r=>`<tr>${headers.map(h=>`<td>${escapeHtml(r[h] || "")}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
    <div class="csvSmall" style="padding:10px 12px">先頭10行を表示中。次の版で、このデータから自動分析します。</div>
  `;
}

function escapeHtml(v){
  return String(v)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function setupCsvImport(){
  const input = document.getElementById("csvFileInput");
  const clear = document.getElementById("clearCsvBtn");
  const status = document.getElementById("csvImportStatus");
  const box = document.getElementById("csvPreviewBox");

  if(input){
    input.addEventListener("change", async (e)=>{
      const file = e.target.files && e.target.files[0];
      if(!file) return;
      const text = await file.text();
      const parsed = parseCSVText(text);
      importedCsv = {fileName:file.name, ...parsed};
      localStorage.setItem("vollyzeImportedCsv", JSON.stringify(importedCsv));
      renderCsvPreview(importedCsv, file.name);
      renderCsvAnalysis(importedCsv);
    });
  }

  if(clear){
    clear.addEventListener("click", ()=>{
      importedCsv = null;
      localStorage.removeItem("vollyzeImportedCsv");
      if(input) input.value = "";
      if(status) status.textContent = "未読み込み";
      if(box){ box.style.display = "none"; box.innerHTML = ""; }
      renderCsvAnalysis(null);
    });
  }

  const saved = localStorage.getItem("vollyzeImportedCsv");
  if(saved){
    try{
      importedCsv = JSON.parse(saved);
      renderCsvPreview(importedCsv, importedCsv.fileName || "保存済みCSV");
      renderCsvAnalysis(importedCsv);
    }catch(e){}
  }
}

