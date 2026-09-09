const state = {
  section: "overview",
  spoilers: localStorage.getItem("ie_spoilers") === "1",
  armors: [],
  search: ""
};

const rarity = {
  Starter:{tier:0,color:"#CCCCCC"}, Common:{tier:1,color:"#FFFFFF"}, Uncommon:{tier:2,color:"#78FF78"},
  Rare:{tier:3,color:"#6B99E3"}, Epic:{tier:4,color:"#FF78DD"}, Legendary:{tier:5,color:"#FFCA2B"}, Mythic:{tier:6,color:"#7B68EE"}
};

const navItems = [
  ["overview","▣","Overview",""],
  ["weapons","⚔","Weapons","—"],
  ["armor","♢","Armor","96"],
  ["items","⚗","Items","—"],
  ["skills","✦","Skills","—"],
  ["status","ϟ","Status Effects","—"],
  ["enemies","♙","Enemies","—"],
  ["characters","♧","Characters","—"]
];

const categories = {
  weapons:{icon:"⚔", title:"Weapons", desc:"Melee, ranged, and magical weapons from Tier 0 to Tier 6."},
  armor:{icon:"♢", title:"Armor", desc:"Helmets, chestplates, gloves, shoes, shields, and accessories."},
  items:{icon:"⚗", title:"Items", desc:"Healing items, materials, active items, and key items."},
  skills:{icon:"✦", title:"Skills", desc:"Hero skills, enemy skills, and boss abilities."},
  status:{icon:"ϟ", title:"Status Effects", desc:"Buffs, debuffs, passives, and status conditions."},
  enemies:{icon:"♙", title:"Enemies", desc:"Normal enemies, champions, elites, mini-bosses, and bosses."},
  characters:{icon:"♧", title:"Characters", desc:"Voy and his companions in the Abyss."}
};

async function loadData(){
  try{
    const res = await fetch("data/armors.json");
    state.armors = await res.json();
  }catch(e){ state.armors=[]; }
  render();
}

function esc(s=""){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function cleanText(s=""){
  return s.replace(/\\c\[\d+\]/g,"").replace(/\\[{}]/g,"").replace(/\s+/g," ").trim();
}
function rarityBadge(item){
  const r = rarity[item.rarity] || {color:"#999",tier:item.tier};
  return `<span class="badge" style="color:${r.color}"><span class="rarity-dot" style="background:${r.color};color:${r.color}"></span>${esc(item.rarity)} · Tier ${item.tier}</span>`;
}
function iconFor(type){ return categories[type]?.icon || "◈"; }

function renderNav(){
  document.querySelector("#mainNav").innerHTML = navItems.map(([id,icon,label,count]) =>
    `<button class="nav-item ${state.section===id?'active':''}" data-nav="${id}">
      <span class="nav-icon">${icon}</span><span>${label}</span>${count && count!=="—"?`<span class="nav-count">${count}</span>`:""}
    </button>`).join("");
  document.querySelectorAll("[data-nav]").forEach(b=>b.onclick=()=>{state.section=b.dataset.nav;state.search="";document.querySelector("#searchInput").value="";render();});
}

function render(){
  renderNav();
  document.querySelector("#spoilerToggle").classList.toggle("on",state.spoilers);
  document.querySelector("#spoilerToggle span").textContent = state.spoilers ? "SPOILERS ON" : "SPOILERS OFF";
  const page=document.querySelector("#page");
  if(state.search.trim()){ renderSearch(page); return; }
  if(state.section==="overview") renderOverview(page);
  else if(state.section==="armor") renderArmor(page);
  else if(state.section==="admin") renderAdmin(page);
  else renderCategory(page,state.section);
}

function renderOverview(page){
  page.innerHTML = `
    <div class="hero">
      <div class="hero-icon">▣</div>
      <h1>Infinite Echoes <span>in The Infinite Abyss</span></h1>
      <p>A comprehensive encyclopedia of weapons, armor, items, skills, enemies, and characters in the game. All stats and information are subject to change during development.</p>
    </div>
    <div class="section-label">Rarity System</div>
    <div class="rarity-row">${Object.entries(rarity).map(([name,r])=>`
      <div class="rarity-chip"><span class="rarity-dot" style="background:${r.color};color:${r.color}"></span><strong style="color:${r.color}">${name}</strong><span class="rarity-tier">Tier ${r.tier}</span></div>`).join("")}</div>
    <div class="category-grid">
      ${Object.entries(categories).map(([id,c])=>`
        <div class="category-card" data-category="${id}">
          <div class="category-icon">${c.icon}</div><div><h3>${c.title} ${id==="armor"?`<span class="nav-count">${state.armors.length}</span>`:""}</h3><p>${c.desc}</p></div><span class="chevron">›</span>
        </div>`).join("")}
    </div>
    <div style="margin-top:24px;text-align:center">
      <button class="btn" id="adminOpen">⚙ Open Editor Dashboard</button>
    </div>`;
  document.querySelectorAll("[data-category]").forEach(c=>c.onclick=()=>{state.section=c.dataset.category;render()});
  document.querySelector("#adminOpen").onclick=()=>{state.section="admin";render()};
}

function renderCategory(page,type){
  const c=categories[type];
  let extra = "";
  if(type==="enemies"){
    extra = `<div class="controls">
      ${["All","Normal Enemies","Champion Enemies","Elite Enemies","Elite Champions","Mini Bosses","Bosses","Abyss Enemy Catalog"].map(x=>`<button class="control">${x}</button>`).join("")}
    </div>`;
  }
  page.innerHTML = `<div class="page-header"><div><h1 class="page-title">${c.title}</h1><p class="page-subtitle">${c.desc}</p></div></div>${extra}
    <div class="empty">${iconFor(type)}<br><br>This section is ready for your game data.<br><br><small>Armor is currently populated from your RPG Maker database as a working example.</small></div>`;
}

function renderArmor(page){
  const list=state.armors;
  page.innerHTML=`
    <div class="page-header"><div><h1 class="page-title">Armor</h1><p class="page-subtitle">${list.length} entries currently imported · stats are subject to change.</p></div></div>
    <div class="controls">
      <select id="rarityFilter" class="control"><option value="">All Rarities</option>${Object.keys(rarity).map(r=>`<option>${r}</option>`).join("")}</select>
      <select id="slotFilter" class="control"><option value="">All Slots</option>${[...new Set(list.map(x=>x.slot))].sort().map(s=>`<option>${esc(s)}</option>`).join("")}</select>
      <button id="sortName" class="control">Sort: Name</button>
    </div>
    <div id="armorGrid" class="grid"></div>`;
  const draw=()=>{
    const rf=document.querySelector("#rarityFilter").value, sf=document.querySelector("#slotFilter").value;
    let items=list.filter(x=>(!rf||x.rarity===rf)&&(!sf||x.slot===sf));
    items.sort((a,b)=>a.name.localeCompare(b.name));
    document.querySelector("#armorGrid").innerHTML=items.length?items.map(card).join(""):`<div class="empty" style="grid-column:1/-1">No armor matches these filters.</div>`;
    document.querySelectorAll("[data-entry]").forEach(x=>x.onclick=()=>showArmor(Number(x.dataset.entry)));
  };
  document.querySelector("#rarityFilter").onchange=draw;
  document.querySelector("#slotFilter").onchange=draw;
  document.querySelector("#sortName").onclick=draw;
  draw();
}
function card(item){
  const hidden=item.spoiler&&!state.spoilers;
  return `<article class="entry-card" data-entry="${item.id}">
    <div class="entry-image">${hidden?`<div class="spoiler-cover" style="width:100%;height:100%"><div class="lock">🔒</div><small>SPOILER IMAGE</small></div>`:item.image?`<img src="${esc(item.image)}" alt="">`:`♢`}</div>
    <div class="entry-body"><div class="entry-name">${esc(item.name)}</div>${rarityBadge(item)}<div class="entry-desc">${esc(cleanText(item.description)).slice(0,115)}${cleanText(item.description).length>115?"…":""}</div></div>
  </article>`;
}

function showArmor(id){
  const item=state.armors.find(x=>x.id===id); if(!item)return;
  const hidden=item.spoiler&&!state.spoilers;
  const p=item.params||[0,0,0,0,0,0,0,0];
  const labels=["HP","MP","ATK","DEF","M.ATK","M.DEF","Speed","Luck"];
  document.querySelector("#modalRoot").innerHTML=`
    <div class="modal-backdrop" id="modalBackdrop"><div class="modal">
      <button class="back" id="closeModal">← Back to Armor</button>
      <div class="detail-top">
        <div class="detail-image">${hidden?`<div class="spoiler-cover" style="width:100%;height:100%"><div class="lock">🔒</div><strong>SPOILER IMAGE</strong><button class="reveal" id="revealOne">Reveal</button></div>`:item.image?`<img src="${esc(item.image)}" alt="${esc(item.name)}">`:`♢`}</div>
        <div>
          ${rarityBadge(item)}
          <h1>${esc(item.name)}</h1>
          <div class="page-subtitle">${esc(item.slot)} · Database ID ${item.id}</div>
          <p class="detail-description">${esc(cleanText(item.description)).replace(/\n/g,"<br>")||"No description yet."}</p>
        </div>
      </div>
      <div class="detail-section"><h2>Stats</h2><div class="stats">${labels.map((l,i)=>`<div class="stat"><label>${l}</label><strong>${p[i]>=0?"+":""}${p[i]}</strong></div>`).join("")}</div></div>
      <div class="detail-section"><h2>Effects & Notes</h2>${item.effects?.length?item.effects.map(e=>`<div class="effect">${esc(cleanText(e))}</div>`).join(""):`<div class="effect">No additional effects recorded.</div>`}</div>
      <div class="detail-section"><h2>Economy</h2><div class="stats"><div class="stat"><label>Buy Price</label><strong>${item.price||"—"}</strong></div><div class="stat"><label>Sell Price</label><strong>${item.sellPrice||"—"}</strong></div></div></div>
    </div></div>`;
  document.querySelector("#closeModal").onclick=()=>document.querySelector("#modalRoot").innerHTML="";
  document.querySelector("#modalBackdrop").onclick=e=>{if(e.target.id==="modalBackdrop")document.querySelector("#modalRoot").innerHTML=""};
  if(hidden) document.querySelector("#revealOne").onclick=()=>{item.spoiler=false;showArmor(id)};
}

function renderSearch(page){
  const q=state.search.toLowerCase();
  const results=state.armors.filter(x=>[x.name,x.description,x.rarity,x.slot,(x.effects||[]).join(" ")].join(" ").toLowerCase().includes(q));
  page.innerHTML=`<div class="page-header"><div><h1 class="page-title">Search Results</h1><p class="page-subtitle">${results.length} result${results.length===1?"":"s"} for “${esc(state.search)}”</p></div></div>
    <div class="search-results">${results.length?results.map(x=>`<div class="search-item" data-entry="${x.id}"><div class="search-type">Armor · ${esc(x.slot)}</div><strong>${esc(x.name)}</strong><div style="margin-top:5px">${rarityBadge(x)}</div></div>`).join(""):`<div class="empty">Nothing found in the current encyclopedia data.</div>`}</div>`;
  document.querySelectorAll("[data-entry]").forEach(x=>x.onclick=()=>showArmor(Number(x.dataset.entry)));
}

function renderAdmin(page){
  page.innerHTML=`
    <div class="page-header"><div><h1 class="page-title">Editor Dashboard</h1><p class="page-subtitle">A simple local editor for static GitHub Pages hosting.</p></div></div>
    <p class="admin-note"><strong>Important:</strong> GitHub Pages is static, so this editor cannot securely write to a server database. It edits your local browser copy and can export JSON for you to commit back to GitHub. That keeps the site completely free and avoids exposing an admin password in public code.</p>
    <div class="admin-toolbar">
      <button class="btn primary" id="newArmor">＋ New Armor</button>
      <button class="btn" id="exportData">Export Armor JSON</button>
      <label class="btn">Import Armor JSON <input id="importData" type="file" accept=".json" hidden></label>
      <button class="btn" id="resetData">Reset to GitHub data</button>
    </div>
    <div class="grid">${state.armors.map(x=>`<div class="entry-card" data-edit="${x.id}"><div class="entry-body"><div class="entry-name">${esc(x.name)}</div>${rarityBadge(x)}<div class="entry-desc">${esc(cleanText(x.description)).slice(0,100)}</div></div></div>`).join("")}</div>`;
  document.querySelectorAll("[data-edit]").forEach(x=>x.onclick=()=>editArmor(Number(x.dataset.edit)));
  document.querySelector("#newArmor").onclick=()=>editArmor(null);
  document.querySelector("#exportData").onclick=exportData;
  document.querySelector("#resetData").onclick=async()=>{localStorage.removeItem("ie_armors");await loadData()};
  document.querySelector("#importData").onchange=e=>importData(e.target.files[0]);
  const saved=localStorage.getItem("ie_armors");
  if(saved){try{state.armors=JSON.parse(saved)}catch(e){}}
}

function persist(){localStorage.setItem("ie_armors",JSON.stringify(state.armors));}
function editArmor(id){
  const item=id?state.armors.find(x=>x.id===id):{id:Math.max(0,...state.armors.map(x=>x.id))+1,name:"New Armor",description:"",rarity:"Common",tier:1,rarityColor:"#FFFFFF",slot:"Accessory",price:0,sellPrice:null,params:[0,0,0,0,0,0,0,0],effects:[],spoiler:false,image:""};
  document.querySelector("#modalRoot").innerHTML=`<div class="modal-backdrop"><div class="modal"><h2>${id?"Edit":"Create"} Armor</h2>
    <div class="form-grid">
      <div class="form-field"><label>Name</label><input id="fName" value="${esc(item.name)}"></div>
      <div class="form-field"><label>Slot</label><input id="fSlot" value="${esc(item.slot)}"></div>
      <div class="form-field"><label>Rarity</label><select id="fRarity">${Object.keys(rarity).map(r=>`<option ${r===item.rarity?"selected":""}>${r}</option>`).join("")}</select></div>
      <div class="form-field"><label>Tier</label><input id="fTier" type="number" value="${item.tier}"></div>
      <div class="form-field full"><label>Description</label><textarea id="fDesc">${esc(item.description)}</textarea></div>
      <div class="form-field full"><label>Image URL (optional)</label><input id="fImage" value="${esc(item.image||"")}" placeholder="https://..."></div>
      ${["HP","MP","ATK","DEF","M.ATK","M.DEF","Speed","Luck"].map((l,i)=>`<div class="form-field"><label>${l}</label><input id="p${i}" type="number" value="${item.params[i]||0}"></div>`).join("")}
      <div class="form-field"><label>Buy Price</label><input id="fPrice" type="number" value="${item.price||0}"></div>
      <div class="form-field"><label>Sell Price</label><input id="fSell" value="${esc(item.sellPrice||"")}"></div>
      <div class="form-field full"><label>Effects (one per line)</label><textarea id="fEffects">${esc((item.effects||[]).join("\n"))}</textarea></div>
      <div class="form-field full"><label><input id="fSpoiler" type="checkbox" ${item.spoiler?"checked":""}> Mark image/details as spoiler</label></div>
    </div>
    <div class="modal-actions"><button class="btn" id="cancelEdit">Cancel</button><button class="btn primary" id="saveEdit">Save Changes</button></div>
  </div></div>`;
  document.querySelector("#cancelEdit").onclick=()=>document.querySelector("#modalRoot").innerHTML="";
  document.querySelector("#saveEdit").onclick=()=>{
    const r=document.querySelector("#fRarity").value;
    const updated={...item,name:document.querySelector("#fName").value.trim(),slot:document.querySelector("#fSlot").value.trim(),rarity:r,tier:Number(document.querySelector("#fTier").value),rarityColor:rarity[r].color,description:document.querySelector("#fDesc").value,image:document.querySelector("#fImage").value,params:[0,1,2,3,4,5,6,7].map(i=>Number(document.querySelector("#p"+i).value)||0),price:Number(document.querySelector("#fPrice").value)||0,sellPrice:document.querySelector("#fSell").value.trim()||null,effects:document.querySelector("#fEffects").value.split("\n").map(x=>x.trim()).filter(Boolean),spoiler:document.querySelector("#fSpoiler").checked};
    const idx=state.armors.findIndex(x=>x.id===item.id); if(idx>=0)state.armors[idx]=updated;else state.armors.push(updated);
    persist();document.querySelector("#modalRoot").innerHTML="";render();
  };
}

function exportData(){
  const blob=new Blob([JSON.stringify(state.armors,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="armors.json";a.click();URL.revokeObjectURL(a.href);
}
function importData(file){
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{try{state.armors=JSON.parse(reader.result);persist();render()}catch(e){alert("That file is not valid JSON.")}};
  reader.readAsText(file);
}

document.querySelector("#searchInput").addEventListener("input",e=>{state.search=e.target.value;render()});
document.querySelector("#spoilerToggle").onclick=()=>{state.spoilers=!state.spoilers;localStorage.setItem("ie_spoilers",state.spoilers?"1":"0");render()};
loadData();
