const DB=['weapons','armors','items','skills','states','enemies','actors','troops'];
const rarity={0:['Starter','#CCCCCC'],1:['Common','#FFFFFF'],2:['Uncommon','#78FF78'],3:['Rare','#6B99E3'],4:['Epic','#FF78DD'],5:['Legendary','#FFCA2B'],6:['Mythic','#7B68EE']};
const rarityOrder=[0,1,2,3,4,5,6];
const itemCategories={
  currency:['Currency / Materials',2,21],
  healing:['Healing',23,122],
  active:['Active Items',124,223],
  key:['Key Items',225,324],
  utility:['Utility Items',326,355]
};
let db={},system={},config={},usedIds=[];
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function noteTag(note,key){const safe=key.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&');const m=String(note||'').match(new RegExp('<'+safe+'\\s*:\\s*([^>]+)>','i'));return m?m[1].trim():''}
function allTags(note,key){const safe=key.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&');const r=new RegExp('<'+safe+'\\s*:\\s*([^>]+)>','gi'),a=[];let m;while((m=r.exec(String(note||''))))a.push(m[1].trim());return a}
function parseRarity(note){const m=String(note||'').match(/<Rarity:\s*(\d+)>/i);const plugin=m?Number(m[1]):null;return plugin!=null&&plugin>=1&&plugin<=7?plugin-1:null}
function cleanText(s){return String(s??'').replace(/\\c\[\d+\]/g,'').replace(/\\i\[\d+\]/g,'').replace(/\\[.!|{}]/g,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}
function icon(idx){if(idx==null||idx<0)return '';const x=idx%16,y=Math.floor(idx/16);return `<span class="icon" style="background-position:-${x*32}px -${y*32}px"></span>`}
function rarityTag(r){if(r==null)return '<span class="tag">Unassigned</span>';const x=rarity[r];return `<span class="tag" style="color:${x[1]};border-color:${x[1]}55;background:${x[1]}14">${esc(x[0])} · Tier ${r}</span>`}
function enemyCategory(e){return noteTag(e.note,'EnemyCategory').trim().toLowerCase()||'uncategorized'}
function enemyLabel(c){const labels={'normal':'Normal','champion':'Champion','elite':'Elite','elite champion':'Elite Champion','mini boss':'Mini Boss','boss':'Boss','abyss normal':'Abyss · Normal','abyss champion':'Abyss · Champion','abyss elite':'Abyss · Elite','abyss elite champion':'Abyss · Elite Champion','abyss mini boss':'Abyss · Mini Boss','abyss boss':'Abyss · Boss','uncategorized':'Uncategorized'};return labels[c]||c.replace(/\b\w/g,m=>m.toUpperCase())}
function enemyTag(c){return `<span class="tag">${esc(enemyLabel(c))}</span>`}
function levelRange(e){const a=noteTag(e.note,'Minimum Level'),b=noteTag(e.note,'Maximum Level');return a&&b?`${esc(a)}-${esc(b)}`:a?esc(a):'—'}
function dataById(type,id){const n=Number(id);return (db[type]||[]).find(x=>x&&Number(x.id)===n)}
function isHeader(x){return !x||!x.name||/^\s*[=\-_*]{4,}\s*$/.test(x.name)||/^[-=]+/.test(x.name)&&x.name.length>12}
function validEntries(type){return (db[type]||[]).filter(x=>x&&x.name&&!isHeader(x))}
function usedEnemies(){return usedIds.map(id=>dataById('enemies',id)).filter(e=>e&&e.name&&!isHeader(e))}
function nav(active){document.querySelectorAll('.side-links a,.topnav a').forEach(a=>a.classList.toggle('active',a.dataset.page===active))}
function spoilerEnabled(){return localStorage.getItem('ie-spoilers')==='on'}
function textZoom(){return Number(localStorage.getItem('ie-text-zoom')||'1.08')}
function applyPrefs(){document.body.classList.toggle('spoilers-on',spoilerEnabled());document.body.style.setProperty('--page-zoom',String(textZoom()))}
function accessDock(){return `<div class="access-dock" aria-label="Accessibility controls"><span class="access-label">View</span><button class="access-btn ${spoilerEnabled()?'spoiler-on':''}" id="spoilerToggle" data-tooltip="Toggle spoiler visibility" aria-label="Toggle spoiler visibility">${spoilerEnabled()?'SPOILERS ON':'SPOILERS OFF'}</button><span class="access-label">Text</span><button class="access-btn ${textZoom()===0.96?'active':''}" data-zoom="0.96" data-tooltip="Smaller text" aria-label="Smaller text">A−</button><button class="access-btn ${textZoom()===1.08?'active':''}" data-zoom="1.08" data-tooltip="Comfortable text" aria-label="Comfortable text">A</button><button class="access-btn ${textZoom()===1.22?'active':''}" data-zoom="1.22" data-tooltip="Larger text" aria-label="Larger text">A+</button></div>`}
function socialLinks(){const map={'Discord':'Discord02.png','YouTube':'YouTube02.png','X / Twitter':'Twitter02.png','GitHub':'GitHub02.png'};return Object.entries(config.socials||{}).filter(([,u])=>u).map(([n,u])=>`<a class="social-btn" href="${esc(u)}" target="_blank" rel="noopener noreferrer" data-tooltip="${esc(n)}" aria-label="${esc(n)}">${map[n]?`<img src="assets/${map[n]}" alt="${esc(n)}">`:`<span class="social-icon-text">${n==='itch.io'?'i':'•'}</span>`}</a>`).join('')}
function sidebar(){return `<aside class="sidebar"><p class="eyebrow">Navigate</p><div class="side-links"><a data-page="home" href="#home">Overview</a><a data-page="enemies" href="#enemies">Enemies</a><a data-page="weapons" href="#weapons">Weapons</a><a data-page="armors" href="#armors">Armor</a><a data-page="items" href="#items">Items</a><a data-page="skills" href="#skills">Skills</a><a data-page="states" href="#states">Status Effects</a><a data-page="actors" href="#actors">Characters</a><div class="side-divider" aria-hidden="true"></div><a data-page="action-commands" href="#action-commands">Action Commands</a><a data-page="glossary" href="#glossary">Glossary</a><a data-page="version-history" href="#version-history">Version History</a></div><p class="eyebrow">Rarity Scale</p><div class="rarity-list">${rarityOrder.map(r=>`<div class="rarity-row"><i class="rarity-dot" style="background:${rarity[r][1]};color:${rarity[r][1]}"></i>${rarity[r][0]}<span class="rarity-tier">T${r}</span></div>`).join('')}</div><p class="sidebar-note">Rarity applies to equipment only. Tier colors show how each piece of equipment ranks.</p></aside>`}
function globalSearch(){return `<form class="global-search" id="globalSearch"><span>⌕</span><input id="globalSearchInput" aria-label="Search encyclopedia" placeholder="Search encyclopedia..." autocomplete="off"></form>`}
function shell(active,content){return `<header class="topbar"><a class="brand" href="#home"><span class="brand-mark"><img src="assets/game-icon.png" alt="" onerror="this.style.display='none';this.parentElement.classList.add('fallback')"></span><span><div class="brand-title">INFINITE ECHOES</div><div class="brand-sub">IN THE INFINITE ABYSS</div></span></a><nav class="topnav"><a data-page="home" href="#home">Overview</a><a data-page="enemies" href="#enemies">Enemies</a><a data-page="weapons" href="#weapons">Weapons</a><a data-page="armors" href="#armors">Armor</a><a data-page="items" href="#items">Items</a><a data-page="skills" href="#skills">Skills</a><a data-page="states" href="#states">Status</a><a data-page="actors" href="#actors">Characters</a><a data-page="action-commands" href="#action-commands">Action Commands</a></nav>${globalSearch()}<div class="top-actions">VERSION ${esc(config.version||'0.0.0')}</div></header><div class="layout">${sidebar()}<main class="main"><div class="content">${content}</div></main></div><footer class="footer"><div><strong>${esc(config.gameTitle)}</strong><div>${esc(config.dataStatus||'Development database')}</div></div><div class="footer-right"><span>Last updated ${esc(config.lastUpdated||'—')}</span><span class="footer-community-label">Community</span><span class="socials">${socialLinks()||'<span class="social-empty">Add links in the private editor</span>'}</span></div></footer>${accessDock()}`}
function home(){const counts={weapons:equipmentEntries('weapons').length,armors:equipmentEntries('armors').length,items:itemEntries().length,skills:allPublicSkills().length,states:validEntries('states').length,actors:playableActors().length,enemies:usedEnemies().length};const cards=[['Weapons','weapons',`${counts.weapons} weapons across the game's tier system.`],['Armor & Accessories','armors',`${counts.armors} pieces of armor and accessories to discover.`],['Items','items',`${counts.items} items ranging from useful supplies to rare finds.`],['Skills','skills',`${counts.skills} skills used by the party and their partners.`],['Status Effects','states',`${counts.states} effects that can influence characters in battle.`],['Characters','actors',`${counts.actors} playable members of the party.`],['Enemies','enemies',`${counts.enemies} enemies documented in the Abyss.`]];return shell('home',`<section class="home-hero fade"><div class="page-kicker">${esc(config.subtitle)}</div><h1>${esc(config.gameTitle)}</h1><p>A living reference for the things you can discover in the Abyss. Browse enemies, equipment, items, skills, characters, and more as you explore the depths.</p><div class="hero-meta"><span class="pill">VERSION ${esc(config.version)}</span><span class="pill">UPDATED ${esc(config.lastUpdated)}</span><span class="pill">TEXT SIZE ${Math.round(textZoom()*100)}%</span></div></section><div class="category-grid fade">${cards.map(c=>`<a class="category" href="#${c[1]}"><h3>${c[0]}</h3><p>${c[2]}</p></a>`).join('')}</div><section class="recent"><div class="section-title">Recently Cataloged</div><div class="grid">${usedEnemies().slice(-6).reverse().map(e=>card('enemies',e)).join('')||'<div class="empty">No enemy entries yet.</div>'}</div></section><section class="recent"><div class="section-title">Version History</div><div class="history">${(config.versionHistory||[]).map(v=>`<div class="history-row"><span><b>${esc(v.version)}</b> · ${esc(v.changes)}</span><span class="version">${esc(v.date)}</span></div>`).join('')}</div></section>`)}
function isPassiveArmor(x){const n=String(x?.note||'');return /<Passive (?:Condition|State)>/i.test(n)||/\[Passive(?::| )/i.test(n)}
function equipmentEntries(type){return validEntries(type).filter(x=>parseRarity(x.note)!=null)}
function itemCategory(id){for(const [key,meta] of Object.entries(itemCategories))if(id>=meta[1]&&id<=meta[2])return key;return null}
function itemEntries(){return validEntries('items').filter(x=>itemCategory(x.id))}
function skillCategory(id){if(id>=216&&id<=316)return 'hero';if(id>=318&&id<=333)return 'dog';if(id>=335&&id<=340)return 'willy';return null}
function allPublicSkills(){return validEntries('skills').filter(s=>skillCategory(s.id)&&!/(\bTEST\b|\(Old\.|GPT_|^OLD\b)/i.test(s.name)&&s.id!==333&&s.id!==334)}
function playableSkills(cat){return allPublicSkills().filter(s=>!cat||skillCategory(s.id)===cat)}
function playableActors(){return (db.actors||[]).filter(a=>a&&['Roy','Dog','Willy'].includes(a.name))}
function actorImage(a){const m={Roy:'Face_5 (Roy).png',Dog:'Face_6 (Dog).png',Willy:'Face_7 (Willy).png'};return m[a.name]?`assets/characters/${encodeURIComponent(m[a.name])}`:''}
function sortControls(type){let options=type==='enemies'?['name-az','name-za','hp-high','hp-low']:type==='weapons'||type==='armors'?['tier-low','tier-high','name-az','name-za','price-low','price-high']:type==='skills'?['name-az','name-za','cooldown-low','cooldown-high','id-low','id-high']:['name-az','name-za','id-low','id-high'];const labels={'name-az':'Name A–Z','name-za':'Name Z–A','tier-low':'Tier Low → High','tier-high':'Tier High → Low','price-low':'Price Low → High','price-high':'Price High → Low','hp-high':'HP High → Low','hp-low':'HP Low → High','cooldown-low':'Cooldown Low → High','cooldown-high':'Cooldown High → Low','id-low':'ID Low → High','id-high':'ID High → Low'};return `<div class="sort-wrap">SORT <select class="sort-select" id="sort">${options.map(o=>`<option value="${o}">${labels[o]}</option>`).join('')}</select></div>`}
function listPage(type,title,desc,filters){return shell(type,`<div class="page-head fade"><div><div class="page-kicker">Field Codex</div><h1 class="page-title">${title}</h1><p class="page-desc">${desc}</p></div><input class="search" id="search" placeholder="Search ${title.toLowerCase()}..." /></div>${filters?`<div class="filters" id="filters">${filters.map((f,i)=>`<button class="filter ${i===0?'active':''} ${f[2]?'filter-disabled':''}" data-filter="${esc(f[0])}" ${f[2]?'disabled data-tooltip=\"No recorded entries yet.\"':''}>${esc(f[1])}</button>`).join('')}</div>`:''}<div class="list-tools"><span class="count" id="count"></span>${sortControls(type)}</div><div class="grid fade" id="cards"></div>`)}
function skillCardMeta(x){const hit=hitTypeLabel(x.hitType);const element=elementLabel(x.damage?.elementId);const cd=noteValue(x.note,'Cooldown');const costs=[];if(Number(x.hpCost||0))costs.push(`<span class="cost-hp">${esc(x.hpCost)} HP</span>`);if(Number(x.mpCost||0))costs.push(`<span class="cost-mp">${esc(x.mpCost)} MP</span>`);if(Number(x.tpCost||0))costs.push(`<span class="cost-ep">${esc(x.tpCost)} EP</span>`);const hitClass=String(hit).toLowerCase()==='physical'?'meta-physical':String(hit).toLowerCase()==='magical'?'meta-magical':'';const rows=[`<span class="skill-meta-item ${hitClass}"><b>TYPE</b>${esc(hit)}</span>`,`<span class="skill-meta-item"><b>ELEMENT</b>${esc(element)}</span>`];if(cd!=='')rows.push(`<span class="skill-meta-item meta-cooldown"><b>COOLDOWN</b>${esc(cd)} turn${Number(cd)===1?'':'s'}</span>`);if(costs.length)rows.push(`<span class="skill-meta-item meta-cost"><b>COST</b>${costs.join(' / ')}</span>`);return `<div class="skill-meta">${rows.join('')}</div>`}
function card(type,x){
if(type==='enemies'){const c=enemyCategory(x),p=x.params||[];return `<a class="card card-link ${isSpoiler(x,'enemies')?'spoiler-hidden':''}"${spoilerAttrs(x,'enemies')} data-id="${x.id}" href="#enemies/${encodeURIComponent(x.id)}"><div class="topline">${enemyTag(c)}<span class="zone">${esc(noteTag(x.note,'Tattle Category')||'UNASSIGNED ZONE')}</span></div><div class="enemy-card-copy"><h3>${esc(x.name)}</h3><p>${esc(cleanText(noteTag(x.note,'Info')).slice(0,125)||'Study entry available.')}</p><div class="statline"><span>HP <b>${p[0]??0}</b></span><span>ATK <b>${p[2]??0}</b></span><span>DEF <b>${p[3]??0}</b></span><span class="lv">LV ${levelRange(x)}</span></div></div><img class="enemy-art" src="assets/enemies_src/${encodeURIComponent(x.battlerName||'')}.png" onerror="this.style.display='none'" alt=""></a>`}
if(type==='actors'){return `<a class="card card-link" data-id="${x.id}" href="#actors/${encodeURIComponent(x.id)}"><div class="topline"><span class="tag">Playable Character</span><span class="zone">#${x.id}</span></div><div class="item-title"><img class="actor-art" src="${actorImage(x)}" alt=""><h3>${esc(x.name)}</h3></div><p>${esc(x.name==='Roy'?'Abyss Explorer':x.name==='Dog'?'Doggy':'Willowisp')}</p></a>`}
const r=(type==='weapons'||type==='armors')?parseRarity(x.note):null;const badge=type==='items'?`<span class="tag">${esc(itemCategories[itemCategory(x.id)]?.[0]||'Item')}</span>`:type==='skills'?`<span class="tag">${esc(skillCategory(x.id)==='hero'?'Hero Skill':skillCategory(x.id)==='dog'?'Dog Skill':'Willy Skill')}</span>`:type==='states'?'<span class="tag">Status</span>':'<span class="tag">Database</span>';let art=type==='weapons'?weaponArt(x):type==='enemies'?enemyImage(x):'';let preview=(type==='weapons'||type==='armors')?`<div class="mini-stats">${paramSummary(x)}</div><div class="mini-effect">${esc(traitSummary(x))}</div>`:type==='items'?`<div class="mini-effect">${esc(itemEffectSummary(x))}</div>`:type==='skills'?`<p>${esc(cleanText(x.description)||'No player-facing description recorded.')}</p>${skillCardMeta(x)}`:`<p>${esc(cleanText(x.description)||'No player-facing description recorded.')}</p>`;const footerMeta=type==='skills'?'':`<div class="statline"><span>PRICE <b>${x.price??0}</b></span></div>`;return `<a class="card card-link ${isSpoiler(x,type)?'spoiler-hidden':''}"${spoilerAttrs(x,type)} data-id="${x.id}" href="#${type}/${encodeURIComponent(x.id)}"><div class="topline">${type==='weapons'||type==='armors'?rarityTag(r):badge}<span class="zone">#${x.id}</span></div><div class="item-title">${icon(x.iconIndex)}<h3>${esc(x.name)}</h3></div>${art?`<img class="weapon-art" src="${art}" alt="">`:''}${preview}${footerMeta}</a>`}

const weaponMap={'Twig':'Stick 1.png','Stick':'Stick 1.png','Old Frying Pan':'Frying Pan.png','Old Wooden Club':'Club.png','Worn-Out Wooden Bat':'Worn-out Bat.png',"Beginner's Bow":'Normal Bow.png','Squeaky Hammer':'Worn out Hammer.png','Magical Cane':'Wand of Energizing Nectar.png','Toy Golf Club':'Golf Club.png','Wooden Bat':'Wooden Bat.png','Short Leaf Sword':'Short Leaf Sword.png','Leafwhipper':'Leafwhipper.png','Wooden Bow':'Normal Bow.png','Worn-Out Hammer':'Worn out Hammer.png','Jello Bello B':'Jello Bello B.png','Wooden Sword':'Wooden Sword.png','Palce Holder (Bow)':'Normal Bow.png','Sharp Dagger':'Dagger.png','Jello Bello R':'Jello Bello R.png','Stony Bow':'Stony Bow.png','The Electronic Hammer':'The Electronic Hammer.png','Wand of Energizing Nectar':'Wand of Energizing Nectar.png','The Hammer of Destruction':'The Hammer of Destruction.png','Sword':'Wooden Sword.png','Axe':'Club.png','Pistol Gun':'Golden Bow.png','Bow':'Normal Bow.png','Worn-Out Dagger':'Dagger.png','Magical Cane TEST':'Wand of Energizing Nectar.png','Sharp Dagger TEST':'Dagger.png','Wand of Energizing Nectar TEST':'Wand of Energizing Nectar.png','Normal Dog Fangs':'Dagger.png',"Willy's Light Fist":'Club.png'};
function weaponArt(x){const f=weaponMap[x.name];return f?`assets/weapons_src/${encodeURIComponent(f)}`:''}
function sorter(type,s,a,b){if(s.startsWith('tier'))return ((parseRarity(a.note)??99)-(parseRarity(b.note)??99))*(s==='tier-high'?-1:1);if(s.startsWith('price'))return ((a.price??0)-(b.price??0))*(s==='price-high'?-1:1);if(s==='hp-high')return (b.params?.[0]??0)-(a.params?.[0]??0);if(s==='hp-low')return (a.params?.[0]??0)-(b.params?.[0]??0);if(s==='cooldown-low'||s==='cooldown-high'){const ca=Number(noteValue(a.note,'Cooldown')||0),cb=Number(noteValue(b.note,'Cooldown')||0);return (ca-cb)*(s==='cooldown-high'?-1:1);}if(s==='id-low'||s==='id-high')return (a.id-b.id)*(s==='id-low'?1:-1);return a.name.localeCompare(b.name)*(s==='name-az'?1:-1)}
function isSpoiler(x,type){
  if(type==='enemies'){const c=enemyCategory(x);return c==='boss'||c==='mini boss'}
  if(type==='weapons'||type==='armors'){const r=parseRarity(x.note);return r===5||r===6}
  return false
}
function spoilerAttrs(x,type){return isSpoiler(x,type)?' data-spoiler="SPOILER\nThis entry contains spoiler information.\nClick to view."':''}
function renderList(type){const q=($('#search')?.value||'').toLowerCase();let arr=type==='enemies'?usedEnemies():type==='actors'?playableActors():type==='weapons'||type==='armors'?equipmentEntries(type):type==='items'?itemEntries():type==='skills'?allPublicSkills():validEntries(type);const active=$('.filter.active')?.dataset.filter;if(type==='enemies'&&active&&active!=='all')arr=arr.filter(e=>enemyCategory(e)===active);if(type==='weapons'||type==='armors'){if(active&&active!=='all'){if(type==='armors'&&active==='passive')arr=arr.filter(isPassiveArmor);else arr=arr.filter(x=>parseRarity(x.note)===Number(active))}}if(type==='items'&&active&&active!=='all')arr=arr.filter(x=>itemCategory(x.id)===active);if(type==='skills'&&active&&active!=='all')arr=arr.filter(x=>skillCategory(x.id)===active);arr=arr.filter(x=>`${x.name} ${cleanText(x.description)} ${cleanText(noteTag(x.note,'Info'))}`.toLowerCase().includes(q));const s=$('#sort')?.value||'name-az';arr.sort((a,b)=>sorter(type,s,a,b));$('#count').textContent=`${arr.length} entr${arr.length===1?'y':'ies'}`;$('#cards').innerHTML=arr.map(x=>card(type,x)).join('')||'<div class="empty">No matching entries.</div>'}
function paramSummary(x){const names=['HP','MP','ATK','DEF','M.ATK','M.DEF','AGI','LUK'];const p=x.params||[];return names.map((n,i)=>{const v=Number(p[i]||0);if(!v)return '';return `<span class="mini-stat ${v>0?'positive':'negative'}">${n} ${v>0?'+':''}${v}</span>`}).join('')}
function paramSummaryText(x){const names=['HP','MP','ATK','DEF','M.ATK','M.DEF','AGI','LUK'];const p=x.params||[];return names.map((n,i)=>{const v=Number(p[i]||0);if(!v)return '';return `${n} ${v>0?'+':''}${v}`}).filter(Boolean).join(' · ')}
function valueClass(v){return v>0?'positive':v<0?'negative':'muted'}
function paramRows(x){const names=['HP','MP','ATK','DEF','M.ATK','M.DEF','AGI','LUK'];const p=x.params||[];return `<div class="param-grid">${names.map((n,i)=>{const v=Number(p[i]||0);return `<div class="param-box ${valueClass(v)}"><span>${n}</span><strong>${v>0?'+':''}${v}</strong></div>`}).join('')}</div>`}
function stateName(id){return dataById('states',id)?.name||`State #${id}`}
function skillName(id){return dataById('skills',id)?.name||`Skill #${id}`}
function systemName(kind,id){const arr=system?.[kind]||[];return arr[Number(id)]||`${kind==='elements'?'Element':kind==='weaponTypes'?'Weapon Type':kind==='armorTypes'?'Armor Type':'Skill Type'} #${id}`}
function percent(v){return `${Math.round(Number(v)*100)}%`}
function rateDelta(v){const n=Number(v);const pct=Math.round(n*100);const delta=pct-100;if(delta===0)return '100%';return `${delta>0?'+':''}${delta}% (${pct}% of normal)`}
function paramName(id){return ['HP','MP','ATK','DEF','M.ATK','M.DEF','AGI','LUK'][Number(id)]||`Parameter ${id}`}
function xparamName(id){return ['Hit Rate','Evasion','Critical Rate','Critical Evasion','Magic Evasion','Magic Reflection','Counter Attack','HP Regen','MP Regen','EP Regen'][Number(id)]||`X-Parameter ${id}`}
function sparamName(id){return ['Target Rate','Guard Effect','Recovery Effect','Pharmacology','MP Cost','EP Charge','Physical Damage','Magical Damage','Floor Damage','Experience'][Number(id)]||`S-Parameter ${id}`}
function traitSummary(x){const out=[];for(const t of (x.traits||[])){const c=Number(t.code),d=Number(t.dataId),v=Number(t.value||0);if(Math.abs(v)<0.000001)continue;if(c===11)out.push(`${systemName('elements',d)} Rate: ${rateDelta(v)}`);else if(c===12)out.push(`${paramName(d)} Debuff Rate: ${rateDelta(v)}`);else if(c===13)out.push(`${stateName(d)} Rate: ${rateDelta(v)}`);else if(c===14)out.push(`Resists: ${stateName(d)}`);else if(c===21)out.push(`${paramName(d)} Parameter: ${rateDelta(v)}`);else if(c===22)out.push(`${xparamName(d)}: ${rateDelta(v)}`);else if(c===23)out.push(`${sparamName(d)}: ${rateDelta(v)}`);else if(c===31)out.push(`Attack Element: ${systemName('elements',d)}`);else if(c===32)out.push(`Attack State: ${stateName(d)} ${Math.round(v*100)}%`);else if(c===33)out.push(`Attack Speed: ${v>0?'+':''}${v}`);else if(c===34)out.push(`Attack Repeats: ${v>0?'+':''}${v}`);else if(c===41)out.push(`Adds Skill Type: ${systemName('skillTypes',d)}`);else if(c===42)out.push(`Seals Skill Type: ${systemName('skillTypes',d)}`);else if(c===43)out.push(`Adds Skill: ${skillName(d)}`);else if(c===44)out.push(`Seals Skill: ${skillName(d)}`)}return out.length?out.join(' · '):'No effects'}
function noteValue(note,label){const safe=label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const text=String(note||'');const angle=text.match(new RegExp('(?:^|\\n)\\s*<'+safe+'\\s*:\\s*([^>\\n]+)>','i'));if(angle)return cleanText(angle[1]);const bracket=text.match(new RegExp('(?:^|\\n)\\s*\\['+safe+'\\s*:\\s*([^\\]\\n]+)\\]','i'));return bracket?cleanText(bracket[1]):''}
function noteBlock(note,label){const safe=label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const text=String(note||'');const angle=text.match(new RegExp('<'+safe+'>([\\s\\S]*?)</'+safe+'>','i'));if(angle)return cleanText(angle[1]);const bracket=text.match(new RegExp('\\['+safe+'\\s*:\\s*([^\\]]+)\\]','i'));return bracket?cleanText(bracket[1]):''}
function equipmentNoteRows(x){const rows=[];const passive=noteValue(x.note,'Passive Condition');if(passive)rows.push(detailDataRow('Passive Condition',passive));const ps=noteValue(x.note,'Passive State');if(ps)rows.push(detailDataRow('Passive State',stateName(ps)));const req=noteBlock(x.note,'Equip Requirement');if(req){const cleanReq=cleanText(req);const isUnique=/unique\s*only/i.test(cleanReq);const tip=isUnique?'You can only equip one piece of equipment with this restriction at a time.':'This equipment has a special equipping restriction.';const label=isUnique?'Unique Only':'Equipment Requirement';rows.push(`<div class="data-row"><span class="data-label">Equipment Requirement</span><span class="data-value">${tipSpan(label,tip,'tooltip-term')}</span></div>`)}return rows}
function itemEffectSummary(x){const out=[];for(const e of (x.effects||[])){const c=Number(e.code),d=Number(e.dataId),v1=Number(e.value1||0),v2=Number(e.value2||0);if(c===11&&v1)out.push(`Restores ${Math.round(v1*100)}% HP${v2?` + ${v2} HP`:''}`);else if(c===12&&v1)out.push(`Restores ${Math.round(v1*100)}% MP${v2?` + ${v2} MP`:''}`);else if(c===13&&v1)out.push(`Restores ${Math.round(v1*100)}% EP${v2?` + ${v2} EP`:''}`);else if(c===21&&v1)out.push(`Adds State: ${stateName(d)} ${Math.round(v1*100)}%`);else if(c===22&&v1)out.push(`Removes State: ${stateName(d)} ${Math.round(v1*100)}%`);else if(c===31)out.push(`Buffs ${paramName(d)} for ${Math.round(v2/60)} turns`);else if(c===32)out.push(`Debuffs ${paramName(d)} for ${Math.round(v2/60)} turns`);else if(c===33)out.push(`Removes ${paramName(d)} Buff`);else if(c===34)out.push(`Removes ${paramName(d)} Debuff`);else if(c===41)out.push('Special Effect');else if(c===42)out.push(`Raises ${paramName(d)}`);else if(c===43)out.push(`Learn Skill: ${skillName(d)}`);else if(c===44)out.push('Common Event');}return out.length?out.join(' · '):'No effects'}
function itemTypeLabel(id){return ({1:'Regular Item',2:'Key Item',3:'Hidden Item A',4:'Hidden Item B'})[Number(id)]||'Unknown'}
function scopeLabel(id){return ({0:'None',1:'One Enemy',2:'All Enemies',3:'One Random Enemy',4:'Two Random Enemies',5:'Three Random Enemies',6:'One Ally',7:'All Allies',8:'One Ally (Dead)',9:'All Allies (Dead)',10:'The User',11:'All Battlers'})[Number(id)]||`Scope #${id}`}
function occasionLabel(id){return ({0:'Always',1:'Battle Screen',2:'Menu Screen',3:'Never'})[Number(id)]||`Occasion #${id}`}
function hitTypeLabel(id){return ({0:'Certain Hit',1:'Physical',2:'Magical'})[Number(id)]||`Hit Type #${id}`}
function damageTypeLabel(id){return ({0:'None',1:'HP Damage',2:'MP Damage',3:'HP Recovery',4:'MP Recovery',5:'HP Drain',6:'MP Drain'})[Number(id)]||`Damage Type #${id}`}
function elementLabel(id){const n=Number(id);if(n===-1)return 'Normal Attack Element';if(n===0)return 'None';return systemName('elements',n)}
function boolLabel(v){return v?'Yes':'No'}
function timedAttackType(x){const m=String(x.note||'').match(/<Timed Attack:\s*([^>]+)>/i);return m?cleanText(m[1]).replace(/\b\w/g,c=>c.toUpperCase()):''}
function actionCommandInstruction(x){const raw=String(x.description||'');const matches=[...raw.matchAll(/\\c\[4\]([\s\S]*?)(?:\\c\[0\]|$)/gi)].map(m=>cleanText(m[1])).filter(Boolean);if(matches.length)return matches.join(' ');const plain=cleanText(raw);const m=plain.match(/((?:Wait as long as possible|Mash as fast as you can|Press the|Time the)[^.\n]*!?)/i);return m?m[1].trim():''}
function actionCommandInfo(x){const type=timedAttackType(x);if(!type)return null;return {type,instruction:actionCommandInstruction(x)};}
function skillDescriptionParts(x){const raw=String(x.description||'');const info=actionCommandInfo(x);if(!info?.instruction)return {description:cleanText(raw),action:info};let cleaned=raw;for(const m of raw.matchAll(/\\c\[4\]([\s\S]*?)(?:\\c\[0\]|$)/gi))cleaned=cleaned.replace(m[0],'');cleaned=cleanText(cleaned).replace(/\s{2,}/g,' ').replace(/\s+\n/g,'\n').trim();return {description:cleaned,action:info};}
const detailTips={
  'Scope':'Determines who the skill or item can target.',
  'Occasion':'Determines when the skill or item can be used. Battle Screen means it can be used during battle; Menu Screen means it can be used from the menu.',
  'Invocation Speed':"Changes the action\'s speed relative to the user\'s Agility. Positive values make the action happen sooner; negative values make it happen later. For example, +1 acts like 1 extra Agility for that action.",
  'Success':'The base chance for the action to successfully affect its target.',
  'Repeats':'How many times the action is performed when used.',
  'Hit Type':'Determines how the action checks whether it hits: Certain Hit ignores normal hit/evasion checks, Physical uses physical accuracy/evasion, and Magical uses magical hit rules.',
  'Damage Type':'Determines whether the action deals damage, restores HP/MP, or drains HP/MP.',
  'Element':'The elemental type associated with the action. None means no element; Normal Attack Element uses the user\'s normal attack element.',
  'Variance':'The amount of random variation applied to the calculated damage or recovery amount.',
  'Critical Hit':'Whether the action can produce a critical hit.',
  'Attack Element':"The element used by this enemy's normal attacks. It does not describe every skill the enemy can use.",
  'Weaknesses': 'These elements deal extra damage to the enemy. A listed percentage shows how much more damage the enemy takes than normal.',
  'Resistances':'These elements deal reduced damage to the enemy. A listed percentage shows how much less damage the enemy takes than normal.',
  'Status Immunities':'Statuses this enemy is completely immune to.',
  'Status Rates':'Shows how likely each status is to affect this enemy. Resistant means the enemy is harder to affect by that status; Susceptible means the enemy is easier to affect. For example, 5% Resistant means the chance of being affected is reduced by 5%, while 10% Susceptible means the chance is increased by 10%.',
  'Accuracy / Evasion':'Hit Rate is the chance this enemy\'s attack will hit. Evasion is the chance this enemy has to avoid an incoming attack. For example, 93% Hit Rate means a 93% chance to hit, while +3% Evasion means a 3% chance to evade.',
  'MP Cost':'The amount of MP consumed when the action is used.',
  'EP Cost':'The amount of EP consumed when the action is used.',
  'EP Gain':'The amount of EP gained when the action is used.',
  'Cooldown':'How many turns must pass before the action can be used again.',
  'Warm-up':'How many turns the action takes before it can be used.',
  'Skill Type':'The skill category this action belongs to.',
  'Item Type':'The item category assigned to this item.',
  'Consumable':'Whether one copy of the item is consumed when it is used.',
  'Weapon Type':'The weapon category assigned to this weapon.',
  'Armor Type':'The armor category assigned to this equipment.',
  'Required Weapon':'The weapon type required to use this skill.',
  'Required Weapon 2':'A second weapon type that can satisfy this skill\'s weapon requirement.'
};
const valueTips={
  'Battle Screen':'Can be used during battle.',
  'Menu Screen':'Can be used from the menu outside of battle.',
  'Always':'Can be used regardless of whether the party is in battle or the menu.',
  'Never':'Cannot normally be used by the player.',
  'Normal Attack Element':'Uses the user\'s normal attack element.'
};
function tipSpan(text,tip,cls=''){return tip?`<span class="${cls}" data-tooltip="${esc(tip)}" tabindex="0"><span class="tooltip-label">${esc(text)}</span><span class="tooltip-popup">${esc(tip)}</span></span>`:esc(text)}
function detailDataRow(label,value){const lt=detailTips[label]||'';const vt=valueTips[String(value)]||'';return `<div class="data-row"><span class="data-label">${tipSpan(label,lt,'tooltip-term')}</span><span class="data-value">${tipSpan(value,vt)}</span></div>`}
function detailGroup(title,rows){return `<div class="detail-group"><div class="detail-group-title">${esc(title)}</div><div class="data-list">${rows.join('')}</div></div>`}
function equipmentDetailGroups(type,x,r){const typeName=type==='weapons'?systemName('weaponTypes',x.wtypeId):systemName('armorTypes',x.atypeId);const rows=[detailDataRow(type==='weapons'?'Weapon Type':'Armor Type',typeName),detailDataRow('Price',String(x.price??0)),detailDataRow('Tier',r!=null?`${rarity[r][0]} · Tier ${r}`:'Unassigned')];const special=equipmentNoteRows(x);return `<section class="panel"><div class="panel-title">Equipment Details</div><div class="detail-groups">${detailGroup('Basics',rows)}${special.length?detailGroup('Special Conditions',special):''}</div></section>`}
function itemDetailGroups(x){return `<section class="panel"><div class="panel-title">Item Details</div><div class="detail-groups">${detailGroup('Basics',[detailDataRow('Item Type',itemTypeLabel(x.itypeId)),detailDataRow('Consumable',boolLabel(x.consumable)),detailDataRow('Price',String(x.price??0))])}${detailGroup('Use & Target',[detailDataRow('Scope',scopeLabel(x.scope)),detailDataRow('Occasion',occasionLabel(x.occasion)),detailDataRow('Invocation Speed',String(x.speed??0)),detailDataRow('Success',`${x.successRate??100}%`),detailDataRow('Repeats',String(x.repeats??1))])}${detailGroup('Damage',[detailDataRow('Damage Type',damageTypeLabel(x.damage?.type)),detailDataRow('Element',elementLabel(x.damage?.elementId)),detailDataRow('Variance',`${x.damage?.variance??0}%`),detailDataRow('Critical Hit',boolLabel(x.damage?.critical))])}</div></section>`}
function skillDetailGroups(x){const req=[];if(x.requiredWtypeId1)req.push(detailDataRow('Required Weapon',systemName('weaponTypes',x.requiredWtypeId1)));if(x.requiredWtypeId2)req.push(detailDataRow('Required Weapon 2',systemName('weaponTypes',x.requiredWtypeId2)));const cooldown=noteValue(x.note,'Cooldown');const warmup=noteValue(x.note,'Warmup');const timing=[];if(cooldown!=='')timing.push(detailDataRow('Cooldown',`${cooldown} turn${Number(cooldown)===1?'':'s'}`));if(warmup!=='')timing.push(detailDataRow('Warm-up',`${warmup} turn${Number(warmup)===1?'':'s'}`));const action=actionCommandInfo(x);const actionRows=action?[detailDataRow('Action Command Type',action.type),action.instruction?detailDataRow('Instructions',action.instruction):'']:[];let timingAction=[];if(timing.length)timingAction.push(`<div class="timing-block">${timing.join('')}</div>`);if(actionRows.length){if(timing.length)timingAction.push('<div class="timing-divider"><span>Action Command</span></div>');else timingAction.push('<div class="timing-divider"><span>Action Command</span></div>');timingAction.push(`<div class="action-block">${actionRows.join('')}</div>`)}return `<section class="panel"><div class="panel-title">Skill Details <span class="panel-hint">ⓘ Hover terms for details</span></div><div class="detail-groups">${detailGroup('Cost & Type',[detailDataRow('Skill Type',systemName('skillTypes',x.stypeId)),detailDataRow('MP Cost',String(x.mpCost??0)),detailDataRow('EP Cost',String(x.tpCost??0)),detailDataRow('EP Gain',String(x.tpGain??0))])}${detailGroup('Use & Target',[detailDataRow('Scope',scopeLabel(x.scope)),detailDataRow('Occasion',occasionLabel(x.occasion)),detailDataRow('Invocation Speed',String(x.speed??0)),detailDataRow('Success',`${x.successRate??100}%`),detailDataRow('Repeats',String(x.repeats??1))])}${timingAction.length?detailGroup('Timing & Action',timingAction):''}${detailGroup('Damage',[detailDataRow('Hit Type',hitTypeLabel(x.hitType)),detailDataRow('Damage Type',damageTypeLabel(x.damage?.type)),detailDataRow('Element',elementLabel(x.damage?.elementId)),detailDataRow('Variance',`${x.damage?.variance??0}%`),detailDataRow('Critical Hit',boolLabel(x.damage?.critical))])}${req.length?detailGroup('Requirements',req):''}</div></section>`}

function effectSummaryHtml(x){
  const out=[];
  for(const t of (x.traits||[])){
    const c=Number(t.code),d=Number(t.dataId),v=Number(t.value||0);
    if(Math.abs(v)<0.000001)continue;
    if(c===11)out.push(`${systemName('elements',d)} Rate: ${rateDelta(v)}`);
    else if(c===12)out.push(`${paramName(d)} Debuff Rate: ${rateDelta(v)}`);
    else if(c===13)out.push(`${stateName(d)} Rate: ${rateDelta(v)}`);
    else if(c===14)out.push(`Resists: ${stateName(d)}`);
    else if(c===21)out.push(`${paramName(d)} Parameter: ${rateDelta(v)}`);
    else if(c===22)out.push(`${xparamName(d)}: ${rateDelta(v)}`);
    else if(c===23)out.push(`${sparamName(d)}: ${rateDelta(v)}`);
    else if(c===31)out.push(`Attack Element: ${systemName('elements',d)}`);
    else if(c===32)out.push(`Attack State: ${stateName(d)} ${Math.round(v*100)}%`);
    else if(c===33)out.push(`Attack Speed: ${v>0?'+':''}${v}`);
    else if(c===34)out.push(`Attack Repeats: ${v>0?'+':''}${v}`);
    else if(c===41)out.push(`Adds Skill Type: ${systemName('skillTypes',d)}`);
    else if(c===42)out.push(`Seals Skill Type: ${systemName('skillTypes',d)}`);
    else if(c===43||c===44){
      const name=skillName(d);
      const skill=dataById('skills',d);
      const verb=c===43?'Adds Skill':'Seals Skill';
      const tip=skill?cleanText(skill.description)||`Open ${name} for its full details.`:`Open ${name} for its full details.`;
      out.push(`${verb}: <a class="linked-effect" href="#skills/${encodeURIComponent(d)}" data-tooltip="${esc(tip)}" tabindex="0">${esc(name)}</a>`);
    }
  }
  return out.length?out.join(' · '):'No effects';
}
function equipmentEffects(x){return `<section class="panel"><div class="panel-title">Effects</div><p class="detail-description detail-effects">${effectSummaryHtml(x)}</p></section>`}
function enemyImage(e){
  const map={'Slime':'Slime.png','Bat':'Bat.png','Rat':'Rat.png','Dusty Shroom':'Dusty Shroom.png','Brittle_Skeleton':'Brittle_Skeleton.png','Rock Slime':'Rock Slime.png','Willowisp (Cave)':'Willowisp (Cave).png','Rugged_Golem':'Rugged_Golem.png','SlimeDark':'SlimeDark.png'};
  const f=map[e?.battlerName]||map[e?.name];
  return f?`assets/enemies_src/${encodeURIComponent(f).replace(/%20/g,' ')}`:'';
}
function enemyStudy(e){const raw=noteTag(e.note,'Info');return cleanText(raw)||''}
function enemySkillEntries(e){return (e.actions||[]).map(a=>dataById('skills',a.skillId)).filter(s=>s&&s.name)}
function enemyDropEntries(e){return (e.dropItems||[]).map(d=>{let type=d.kind===1?'items':d.kind===2?'weapons':d.kind===3?'armors':null;if(!type)return null;const item=dataById(type,d.dataId);if(!item||!item.name)return null;const chance=d.denominator>0?Math.round((1/d.denominator)*100):100;return {type,item,chance}}).filter(Boolean)}
function enemyExtraDrops(e){
  const raw=String(e.note||''); const blocks=[...raw.matchAll(/<Enemy Drops>([\s\S]*?)<\/Enemy Drops>/gi)];
  const rows=[];
  for(const m of blocks){for(const line of m[1].split(/\r?\n/)){const hit=cleanText(line).match(/^(.+?)\s*:\s*(\d+)%$/);if(hit)rows.push({name:hit[1].trim(),chance:Number(hit[2])})}}
  return rows;
}
function enemyConditionalDrops(e){
  const raw=String(e.note||''); const rows=[]; const re=/<Conditional\s+([^>]+)>[\s\S]*?Variable\s+(\d+)\s*(>=|>|<=|<|=)\s*(\d+)\s*:\s*\+?(\d+)%[\s\S]*?<\/Conditional\s+[^>]+>/gi;
  for(const m of raw.matchAll(re)){
    let condition=`Variable ${m[2]} ${m[3]} ${m[4]}`;
    if(String(m[2])==='60'){
      const threshold=Number(m[4]);
      if(m[3]==='>=' && threshold===5) condition='Ascension Level is 4 or greater';
      else if(m[3]==='>' && threshold===4) condition='Ascension Level is greater than 4';
      else condition=`Ascension Level ${m[3]} ${Math.max(0,threshold-1)}`;
    }
    rows.push({name:cleanText(m[1]),condition,bonus:m[5]});
  }
  return rows;
}

function enemyGrowth(e){
  const labels=[['maxhp','HP'],['maxmp','MP'],['atk','ATK'],['def','DEF'],['mat','M.ATK'],['mdf','M.DEF'],['agi','AGI'],['exp','EXP'],['gold','Gold']];
  const out=[]; const raw=String(e.note||'');
  for(const [key,label] of labels){const re=new RegExp('<'+key+'\\s+Flat:\\s*([+-]?[\\d.]+)\\s+per\\s+level>','i');const m=raw.match(re);if(m)out.push([label,m[1]+' / level'])}
  return out;
}
function enemyTraits(e){
  const traits=e.traits||[], attack=[], weak=[], resist=[], statusRes=[], statusRates=[], xparams=[];
  const ratePct=v=>Math.round(v*100);
  for(const t of traits){const c=Number(t.code),d=Number(t.dataId),v=Number(t.value);
    if(c===31) attack.push(systemName('elements',d));
    else if(c===11 && v>1.001) weak.push(`${systemName('elements',d)} +${ratePct(v)-100}% Weak`);
    else if(c===11 && v<0.999) resist.push(`${systemName('elements',d)} ${100-ratePct(v)}% Resistant`);
    else if(c===13 && Math.abs(v-1)>0.0001){const pct=ratePct(v);statusRates.push(`${stateName(d)} ${pct<100?100-pct+'% Resistant':pct>100?(pct-100)+'% Susceptible':'Normal'}`)}
    else if(c===14) statusRes.push(stateName(d));
    else if(c===22 && Math.abs(v)>0.0001){
      const label=xparamName(d),pct=ratePct(v);
      if(label==='Hit Rate') xparams.push(`${label} ${pct}%`);
      else if(label==='Evasion') xparams.push(`${label} ${pct>=0?'+':''}${pct}%`);
      else xparams.push(`${label} ${pct>=0?'+':''}${pct}%`);
    }
  }
  const rows=[];
  if(attack.length)rows.push(['Attack Element',attack.join(', ')]);
  if(weak.length)rows.push(['Weaknesses',weak.join(', ')]);
  if(resist.length)rows.push(['Resistances',resist.join(', ')]);
  if(statusRes.length)rows.push(['Status Immunities',statusRes.join(', ')]);
  if(statusRates.length)rows.push(['Status Rates',statusRates.join(', ')]);
  if(xparams.length)rows.push(['Accuracy / Evasion',xparams.join(', ')]);
  return rows;
}

function detailNav(type,x){
  const lists={
    enemies:usedEnemies(),
    weapons:equipmentEntries('weapons'),
    armors:equipmentEntries('armors'),
    items:itemEntries(),
    skills:allPublicSkills(),
    states:validEntries('states'),
    actors:playableActors()
  };
  const arr=lists[type]||[];
  const idx=arr.findIndex(v=>Number(v.id)===Number(x.id));
  return {prev:idx>0?arr[idx-1]:null,next:idx>=0&&idx<arr.length-1?arr[idx+1]:null};
}
function sideNavHtml(type,x){
  const {prev,next}=detailNav(type,x), title=typeTitle(type);
  return `<a class="detail-side-nav detail-prev ${prev?'':'disabled'}" href="${prev?`#${type}/${prev.id}`:`#${type}`}" aria-label="Previous ${esc(title)}"><span>←</span><small>PREVIOUS</small><strong>${prev?esc(prev.name):'—'}</strong></a><a class="detail-side-nav detail-next ${next?'':'disabled'}" href="${next?`#${type}/${next.id}`:`#${type}`}" aria-label="Next ${esc(title)}"><small>NEXT</small><strong>${next?esc(next.name):'—'}</strong><span>→</span></a>`;
}
function dropTooltipHtml(d){
  const item=d.item;
  const desc=cleanText(item.description)||'No description recorded.';
  let html=`<div class="drop-tooltip-desc">${esc(desc)}</div>`;
  if(d.type==='weapons'||d.type==='armors'){
    const vals=paramSummary(item);
    if(vals)html+=`<div class="drop-tooltip-stats">${vals}</div>`;
  }else{
    const effect=itemEffectSummary(item);
    if(effect&&effect!=='No effects')html+=`<div class="drop-tooltip-effect">${esc(effect)}</div>`;
  }
  html+=`<div class="drop-tooltip-more">Click to view full details.</div>`;
  return html;
}
function dropLink(d){
  const item=d.item, tip=dropTooltipHtml(d);
  const r=(d.type==='weapons'||d.type==='armors')?parseRarity(item.note):null;
  const tier=r!=null?rarityTag(r):'';
  return `<a class="drop-item-link" href="#${d.type}/${encodeURIComponent(item.id)}" tabindex="0"><span class="drop-icon">${icon(item.iconIndex)}</span><span class="drop-item-name"><span class="drop-name-text" data-drop-tooltip="1">${esc(item.name)}<span class="tooltip-popup">${tip}</span></span>${tier}</span><span class="drop-kind-spacer"></span></a>`;
}
function enemyDetail(e){
  const cat=enemyCategory(e), p=e.params||[], img=enemyImage(e), skills=enemySkillEntries(e), drops=enemyDropEntries(e), extraDrops=enemyExtraDrops(e), conditionalDrops=enemyConditionalDrops(e), growth=enemyGrowth(e), traits=enemyTraits(e);
  const {prev,next}=detailNav('enemies',e);
  const statNames=['HP','MP','ATK','DEF','M.ATK','M.DEF','AGI','LUK'], statCaps=[100,30,10,10,10,10,10,10];
  const stats=statNames.map((name,i)=>{const value=Number(p[i]||0);const width=Math.min(100,Math.max(0,(value/statCaps[i])*100));const tip=detailTips[name]||'';return `<div class="stat-row" tabindex="0" data-stat="${esc(name)}"><span class="stat-name">${tip?tipSpan(name,tip,'tooltip-term'):name}</span><div class="bar-track"><div class="bar-fill" data-width="${width.toFixed(1)}%"></div></div><span class="stat-value">${value}</span></div>`}).join('');
  const traitHtml=traits.length?`<div class="data-list">${traits.map(([l,v])=>`<div class="data-row"><span class="data-label">${tipSpan(l,detailTips[l]||'','tooltip-term')}</span><span class="data-value">${esc(v)}</span></div>`).join('')}</div>`:'<p class="detail-description">No notable traits recorded.</p>';
  const skillHtml=skills.length?skills.map(s=>`<a class="skill-card linked-card" href="#skills/${encodeURIComponent(s.id)}"><h4>${esc(s.name)}</h4><p>${esc(cleanText(s.description)||'View this skill for more details.')}</p></a>`).join(''):'<p class="detail-description">No known skills recorded.</p>';
  const dropHtml=drops.length?drops.map(d=>`<div class="drop-row"><span>${d.chance}%</span>${dropLink(d)}<span class="drop-kind">${d.type==='items'?'Item':d.type==='weapons'?'Weapon':'Armor'}</span></div>`).join(''):'<p class="detail-description">No drops recorded.</p>';
  const extraHtml=extraDrops.length?`<div class="subpanel-title">Additional Drops</div>${extraDrops.map(d=>`<div class="extra-drop"><span>${esc(d.name)}</span><b>${d.chance}%</b></div>`).join('')}`:'';
  const conditionalHtml=conditionalDrops.length?`<div class="subpanel-title">Conditional Drops</div>${conditionalDrops.map(d=>`<div class="conditional-drop"><b>${esc(d.name)}</b><span>+${esc(d.bonus)}% when ${esc(d.condition)}</span></div>`).join('')}`:'';
  const growthHtml=growth.length?`<div class="data-list growth-list">${growth.map(([l,v])=>`<div class="data-row"><span class="data-label">${esc(l)}</span><span class="data-value">${esc(v)}</span></div>`).join('')}</div>`:'<p class="detail-description">No growth rates recorded.</p>';
  const study=enemyStudy(e);
  const stickyImg=img?`<img src="${img}" alt="">`:icon(e.iconIndex);
  return `<div class="enemy-detail-shell">${sideNavHtml('enemies',e)}<div class="detail-page fade"><a class="back" href="#enemies">← Back to Enemy Bestiary</a><div class="detail-top enemy-detail-top"><div class="detail-art enemy-detail-art">${img?`<img src="${img}" alt="${esc(e.name)}">`:icon(e.iconIndex)}</div><div><div>${enemyTag(cat)}</div><h1>${esc(e.name)}</h1></div></div><div class="detail-layout"><section class="panel"><div class="panel-title">Stats <span class="panel-hint">Fixed scale · visual reference</span></div>${stats}<div class="fact-grid"><div class="fact"><strong>${Number(e.exp??0)}</strong><small>EXP</small></div><div class="fact"><strong>${Number(e.gold??0)}</strong><small>Gold</small></div><div class="fact"><strong>${esc(levelRange(e))}</strong><small>Level Range</small></div></div></section><section class="panel"><div class="panel-title">Traits</div>${traitHtml}</section><section class="panel"><div class="panel-title">Drops</div>${dropHtml}${extraHtml}${conditionalHtml}</section><section class="panel"><div class="panel-title">Growth Rates</div>${growthHtml}</section><section class="panel enemy-expandable study-panel" data-expand="study"><div class="panel-title"><span class="study-title-label">Study Description</span> ${tipSpan('',"When you use the Study ability on this enemy, this is the description recorded in its Study Log.",'tooltip-term panel-info')}</div>${study?`<div class="expandable-scroll"><p class="detail-description">${esc(study)}</p></div>`:'<div class="expandable-scroll"><p class="detail-description">No study description recorded.</p></div>'}</section><section class="panel enemy-expandable skills-panel" data-expand="skills"><div class="panel-title">Skills <span class="panel-count">${skills.length}</span> ${tipSpan('',"Click to open an expanded view of this enemy's recorded skills.",'tooltip-term panel-info')}</div><div class="skill-list">${skillHtml}</div></section></div></div><div class="enemy-sticky-id" aria-hidden="true"><div class="enemy-sticky-art">${stickyImg}</div><strong>${esc(e.name)}</strong></div><div class="detail-expand-modal" id="detailExpandModal" aria-hidden="true"><div class="detail-expand-backdrop"></div><div class="detail-expand-dialog" role="dialog" aria-modal="true"><button class="detail-expand-close" type="button" aria-label="Close expanded view">×</button><div class="detail-expand-title"></div><div class="detail-expand-body"></div></div></div></div>`;
}

function genericDetail(type,x){if(type==='actors')return actorDetail(x);const r=(type==='weapons'||type==='armors')?parseRarity(x.note):null;let body='';let displayDescription=cleanText(x.description)||'No player-facing description recorded.';if(type==='weapons'||type==='armors'){body=`<section class="panel"><div class="panel-title">Parameters</div>${paramRows(x)}</section>${equipmentDetailGroups(type,x,r)}${equipmentEffects(x)}`}else if(type==='items'){body=`${itemDetailGroups(x)}<section class="panel"><div class="panel-title">Effects</div><p class="detail-description">${esc(itemEffectSummary(x))}</p></section>`}else if(type==='skills'){const sp=skillDescriptionParts(x);displayDescription=sp.description||'No player-facing description recorded.';body=`${skillDetailGroups(x)}<section class="panel"><div class="panel-title">Effects</div><p class="detail-description">${esc(itemEffectSummary(x))}</p></section>`}else{body=`<section class="panel"><div class="panel-title">Entry Details</div><p class="detail-description">Player-facing details for this entry.</p></section>`}return `<div class="detail-shell">${sideNavHtml(type,x)}<div class="detail-page fade"><a class="back" href="#${type}">← Back to ${typeTitle(type)}</a><div class="detail-top"><div class="detail-art">${detailArt(type,x)}</div><div><div>${(type==='weapons'||type==='armors')?rarityTag(r):`<span class="tag">${type==='items'?itemCategories[itemCategory(x.id)]?.[0]||'Item':type==='skills'?'Player Skill':typeTitle(type)}</span>`}</div><h1>${esc(x.name)}</h1><p class="detail-description item-detail-description">${esc(displayDescription)}</p></div></div><div class="detail-layout">${body}</div></div></div>`}
function actorDetail(a){const c=dataById('classes',a.classId);const skills=playableSkills(a.name==='Roy'?'hero':a.name==='Dog'?'dog':'willy');return `<div class="detail-shell">${sideNavHtml('actors',a)}<div class="detail-page fade"><a class="back" href="#actors">← Back to Characters</a><div class="detail-top"><div class="detail-art"><img class="actor-art" src="${actorImage(a)}" alt="${esc(a.name)}"></div><div><span class="tag">${a.name==='Roy'?'Protagonist':'Partner'}</span><h1>${esc(a.name)}</h1><p class="detail-description">${esc(c?.name||'Current playable party member.')}</p></div></div><div class="detail-layout"><section class="panel"><div class="panel-title">Class</div><div class="data-list"><div class="data-row"><span class="data-label">Class</span><span class="data-value">${esc(c?.name||'—')}</span></div></div></section><section class="panel"><div class="panel-title">Skills <span class="panel-count">${skills.length}</span></div><div class="skill-list">${skills.map(s=>`<div class="skill-card"><h4>${esc(s.name)}</h4><p>${esc(cleanText(s.description)||'No player-facing description recorded.')}</p></div>`).join('')||'<p class="detail-description">No player-facing skills recorded.</p>'}</div></section></div></div></div>`}

function detailArt(type,x){if(type==='weapons'){const f=weaponArt(x);return f?`<img src="${f}" alt="">`:icon(x.iconIndex)}if(type==='actors')return `<img class="actor-art" src="${actorImage(x)}" alt="">`;return icon(x.iconIndex)}
function typeTitle(t){return ({weapons:'Weapons',armors:'Armor & Accessories',items:'Items',skills:'Skills',states:'Status Effects',actors:'Characters',enemies:'Enemy Bestiary'})[t]||t}
function itemFilters(){return [['all','All'],...Object.entries(itemCategories).map(([k,v])=>[k,v[0]])]}
function skillFilters(){return [['all','All'],['hero','Hero Skills'],['dog','Dog Skills'],['willy','Willy Skills']]}
function page(type){if(type==='home')return home();if(type==='version-history')return versionHistoryPage();if(type==='glossary')return glossaryPage();if(type==='action-commands')return actionCommandsPage();if(type.startsWith('search/'))return searchPage(decodeURIComponent(type.slice(7)));if(type.includes('/')){const [t,id]=type.split('/');const x=dataById(t,id);if(!x||!x.name)return shell(t,'<div class="empty">Entry not found.</div>');if(t==='enemies')return shell(t,enemyDetail(x));return shell(t,genericDetail(t,x))}const meta={enemies:['Enemy Bestiary','Discover the creatures, champions, elites, and bosses that inhabit the Abyss.'],weapons:['Weapons',`${equipmentEntries('weapons').length} weapons, organized by their in-game tier.`],armors:['Armor & Accessories',`${equipmentEntries('armors').length} pieces of armor and accessories, including special passive equipment.`],items:['Items',`${itemEntries().length} items to use, collect, and discover throughout your journey.`],skills:['Skills',`${allPublicSkills().length} skills used by the party and their partners.`],states:['Status Effects','Browse the buffs, debuffs, conditions, and other effects that can influence characters.'],actors:['Characters','Meet the playable party members and learn more about their roles and abilities.']};const m=meta[type];if(!m)return home();let filters=null;if(type==='enemies'){const enemyFilterDefs=[['normal','Normal'],['champion','Champion'],['elite','Elite'],['elite champion','Elite Champion'],['mini boss','Mini Boss'],['boss','Boss'],['abyss normal','Abyss · Normal'],['abyss champion','Abyss · Champion'],['abyss elite','Abyss · Elite'],['abyss elite champion','Abyss · Elite Champion'],['abyss mini boss','Abyss · Mini Boss'],['abyss boss','Abyss · Boss'],['uncategorized','Uncategorized']];filters=[['all','All'],...enemyFilterDefs.map(([k,l])=>[k,l,usedEnemies().filter(e=>enemyCategory(e)===k).length===0])];}if(type==='weapons')filters=[['all','All'],...rarityOrder.map(r=>[String(r),`T${r} · ${rarity[r][0]}`])];if(type==='armors')filters=[['all','All'],['passive','Passives'],...rarityOrder.map(r=>[String(r),`T${r} · ${rarity[r][0]}`])];if(type==='items')filters=itemFilters();if(type==='skills')filters=skillFilters();return listPage(type,m[0],m[1],filters)}
function versionHistoryPage(){const history=config.versionHistory||[];return shell('version-history',`<div class="page-head fade"><div><div class="page-kicker">Project Changelog</div><h1 class="page-title">Version History</h1><p class="page-desc">A record of encyclopedia revisions. The database and presentation are still being refined, so entries and values may change between revisions.</p></div><span class="pill">CURRENT ${esc(config.version||'—')}</span></div><section class="history-page panel fade"><div class="panel-title">Revisions</div><div class="history">${history.map((v,i)=>`<article class="history-entry ${i===0?'current':''}"><div class="history-entry-head"><div><b>${esc(v.version)}</b>${i===0?'<span class="tag history-current">Current</span>':''}</div><span class="version">${esc(v.date)}</span></div><p>${esc(v.changes)}</p></article>`).join('')||'<div class="empty">No version history recorded.</div>'}</div></section>`)}

function actionCommandsPage(){const types=[['Circle','A timing challenge built around a shrinking target or circle. Individual skills provide their specific instructions.'],['Wheel','A timing challenge built around a rotating wheel. Individual skills provide their specific instructions.'],['Arrows','A timing challenge where the required arrow inputs are shown on screen.'],['Clock','A timing challenge centered on timing an input against a moving clock-style indicator.'],['Mash','A timing challenge where rapid button presses are used to increase the result.']];return shell('action-commands',`<div class="page-head fade"><div><div class="page-kicker">Combat Reference</div><h1 class="page-title">Action Commands</h1><p class="page-desc">Timing-based actions that let players improve a skill's result through input during battle. Individual skills explain their specific instructions.</p></div></div><div class="glossary-grid fade">${types.map(([n,d])=>`<section class="panel glossary-group"><div class="panel-title">${esc(n)}</div><p>${esc(d)}</p></section>`).join('')}</div>`)}
function glossaryPage(){const groups=[['Core Terms',[['Skill Type','The category a skill belongs to.'],['Item Type','The category an item belongs to.'],['Scope','Determines which target or targets an action can affect.'],['Occasion','Determines when an action can be used. Battle Screen means it can be used during battle, while Menu Screen means it can be used from the menu.'],['Invocation Speed','Changes an action\'s speed relative to the user\'s Agility. Positive values make it happen sooner; negative values make it happen later. A +1 action effectively has 1 more Agility for that action.'],['Success','The base chance for the action to successfully affect its target.'],['Repeats','How many times the action is performed when used.']]],['Damage & Accuracy',[['Hit Type','Determines how an action checks whether it hits. Certain Hit ignores normal accuracy and evasion checks, Physical uses physical accuracy and evasion, and Magical uses magical hit rules.'],['Damage Type','Describes whether an action deals damage, restores HP or MP, or drains HP or MP.'],['Element','The elemental type associated with the action. Normal Attack Element uses the user\'s normal attack element.'],['Variance','The amount of random variation applied to the calculated damage or recovery amount.'],['Critical Hit','Whether the action can produce a critical hit.']]],['Costs & Timing',[['MP Cost','The amount of MP consumed when the action is used.'],['EP Cost','The amount of EP consumed when the action is used.'],['EP Gain','The amount of EP gained when the action is used.'],['Cooldown','How many turns must pass before the action can be used again.'],['Warm-up','How many turns the action takes before it can be used.']]],['Health Conditions',[['Danger','HP is at 25% or lower.'],['Critical HP','HP is at 10% or lower.']]],['Equipment',[['Weapon Type','The weapon category assigned to a weapon.'],['Armor Type','The armor category assigned to armor or an accessory.'],['Unique Only','Only one piece of equipment with this restriction can be equipped at a time.']]]];return shell('glossary',`<div class="page-head fade"><div><div class="page-kicker">Reference Guide</div><h1 class="page-title">Glossary</h1><p class="page-desc">A quick reference for the terminology used throughout the encyclopedia.</p></div></div><div class="glossary-grid fade">${groups.map(([title,rows])=>`<section class="panel glossary-group"><div class="panel-title">${esc(title)}</div><div class="glossary-list">${rows.map(([term,desc])=>`<article class="glossary-entry"><h3>${esc(term)}</h3><p>${esc(desc)}</p></article>`).join('')}</div></section>`).join('')}</div>`)}
function searchPage(q){const groups=[['Enemies','enemies',usedEnemies()],['Weapons','weapons',equipmentEntries('weapons')],['Armor','armors',equipmentEntries('armors')],['Items','items',itemEntries()],['Skills','skills',allPublicSkills()],['Status Effects','states',validEntries('states')],['Characters','actors',playableActors()]];const needle=q.trim().toLowerCase();let html='';for(const [title,type,arr] of groups){const hits=arr.filter(x=>`${x.name} ${cleanText(x.description)} ${cleanText(noteTag(x.note,'Info'))}`.toLowerCase().includes(needle));if(hits.length)html+=`<section class="recent"><div class="section-title">${title}</div><div class="grid">${hits.slice(0,9).map(x=>card(type,x)).join('')}</div></section>`}return shell('',`<div class="page-head fade"><div><div class="page-kicker">Global Search</div><h1 class="page-title">Search Results</h1><p class="page-desc">Results for “${esc(q)}” across the public encyclopedia catalog.</p></div></div>${html||'<div class="empty">No matching entries.</div>'}`)}
async function load(){
  try{
    const results=await Promise.all(DB.map(async f=>[f,await fetch(`data/${f}.json`).then(r=>{if(!r.ok)throw new Error(`Missing data/${f}.json`);return r.json()})]));
    for(const [f,value] of results)db[f]=value;
    system=await fetch('data/system.json').then(r=>{if(!r.ok)throw new Error('Missing data/system.json');return r.json()});
    config=await fetch('data/site-config.json').then(r=>{if(!r.ok)throw new Error('Missing data/site-config.json');return r.json()});
    usedIds=(await fetch('data/enemy-used-ids.json').then(r=>{if(!r.ok)throw new Error('Missing data/enemy-used-ids.json');return r.json()})).usedEnemyIds||[];
    applyPrefs();route();
  }catch(err){
    console.error('Encyclopedia failed to load:',err);
    document.body.innerHTML=`<main class="load-error"><div class="load-error-card"><div class="page-kicker">Encyclopedia Error</div><h1>Unable to load the encyclopedia</h1><p>The site files are present, but the database could not be loaded. This usually means a required file was not copied into the <code>data</code> folder, or the site is being opened in a way that blocks local data requests.</p><pre>${esc(err?.message||err)}</pre><p>Make sure the entire <code>public</code> folder is uploaded to GitHub Pages, including <code>public/data</code>.</p></div></main>`;
  }
}
function bindGlobal(){const form=$('#globalSearch');if(form)form.onsubmit=e=>{e.preventDefault();const q=$('#globalSearchInput').value.trim();if(q)location.hash='#search/'+encodeURIComponent(q)}}
function bindAccess(){const s=$('#spoilerToggle');if(s)s.onclick=()=>{localStorage.setItem('ie-spoilers',spoilerEnabled()?'off':'on');route()};document.querySelectorAll('[data-zoom]').forEach(b=>b.onclick=()=>{localStorage.setItem('ie-text-zoom',b.dataset.zoom);route()});const dock=document.querySelector('.access-dock'),footer=document.querySelector('.footer');if(dock){const setBottom=()=>{if(!footer){dock.style.bottom='14px';return}const r=footer.getBoundingClientRect();const inView=r.top<window.innerHeight;const bottom=inView?Math.max(14,window.innerHeight-r.top+10):14;dock.style.bottom=`${bottom}px`};setBottom();window.addEventListener('scroll',setBottom,{passive:true});window.addEventListener('resize',setBottom);}}
function bindCardRoutes(){document.querySelectorAll('.card-link').forEach(c=>c.addEventListener('click',e=>{const href=c.getAttribute('href');if(!href||!href.startsWith('#'))return;e.preventDefault();const target=href.slice(1);if(location.hash.slice(1)===target)route();else location.hash=target;}))}
function route(){document.body.classList.remove('modal-open');const raw=(location.hash||'#home').slice(1)||'home';document.body.innerHTML=page(raw);applyPrefs();window.scrollTo({top:0,left:0,behavior:'auto'});nav(raw.split('/')[0]);bindGlobal();bindAccess();bindCardRoutes();if(!raw.includes('/')&&raw!=='home'){const base=raw;renderList(base);bindCardRoutes();$('#search')?.addEventListener('input',()=>{renderList(base);bindCardRoutes()});$('#sort')?.addEventListener('change',()=>{renderList(base);bindCardRoutes()});document.querySelectorAll('.filter').forEach(b=>b.onclick=()=>{if(b.disabled)return;document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderList(base);bindCardRoutes()})}if(raw.includes('/')&&raw.split('/')[0]==='enemies'){setTimeout(animateBars,70);setTimeout(bindEnemySticky,0);setTimeout(bindEnemyExpand,0)}}
function bindEnemySticky(){
  const top=document.querySelector('.enemy-detail-top'), sticky=document.querySelector('.enemy-sticky-id'), footer=document.querySelector('.footer');
  if(!top||!sticky||!('IntersectionObserver' in window))return;
  let topVisible=true;
  const setBottom=()=>{
    if(!footer){sticky.style.bottom='24px';return;}
    const r=footer.getBoundingClientRect();
    const footerInView=r.top<window.innerHeight;
    const bottom=footerInView?Math.max(24,window.innerHeight-r.top+12):24;
    sticky.style.bottom=`${bottom}px`;
  };
  const update=()=>{sticky.classList.toggle('visible',!topVisible);setBottom()};
  const observer=new IntersectionObserver(entries=>{topVisible=entries[0].isIntersecting;update()},{threshold:0});
  observer.observe(top);
  window.addEventListener('scroll',setBottom,{passive:true});
  window.addEventListener('resize',setBottom);
  setBottom();
}

function bindEnemyExpand(){
  const modal=$('#detailExpandModal');
  if(!modal)return;
  const title=modal.querySelector('.detail-expand-title'),body=modal.querySelector('.detail-expand-body');
  const close=()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true');body.innerHTML='';document.body.classList.remove('modal-open')};
  modal.querySelector('.detail-expand-backdrop')?.addEventListener('click',close);
  modal.querySelector('.detail-expand-close')?.addEventListener('click',close);
  document.querySelectorAll('.enemy-expandable').forEach(panel=>panel.addEventListener('click',e=>{
    if(e.target.closest('a,button,input,select'))return;
    const heading=panel.querySelector('.panel-title');
    const clone=panel.cloneNode(true);
    clone.querySelector('.panel-title')?.remove();
    clone.querySelectorAll('[data-tooltip]').forEach(x=>x.removeAttribute('data-tooltip'));
    title.innerHTML=`<span>Study Description</span><small>Study log entry shown when the Study ability is used.</small>`;
    if(panel.dataset.expand==='skills') title.innerHTML=`<span>Skills</span><small>Skills currently recorded for this enemy.</small>`;
    body.innerHTML=clone.innerHTML;
    modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');
  }));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))close()},{once:true});
}
function animateBars(){document.querySelectorAll('.bar-fill').forEach((b,i)=>requestAnimationFrame(()=>setTimeout(()=>b.style.width=b.dataset.width,i*45)))}
window.addEventListener('hashchange',route);load();
