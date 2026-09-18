const CATEGORIES = [
  {id:"roads", label:"Roads & Potholes", icon:""},
  {id:"water", label:"Water", icon:""},
  {id:"power", label:"Electricity", icon:""},
  {id:"garbage", label:"Garbage", icon:""},
  {id:"lights", label:"Streetlights", icon:""},
  {id:"drainage", label:"Drainage & Floods", icon:""},
  {id:"security", label:"Security", icon:""},
  {id:"other", label:"Other", icon:""}
];
const STATUSES = ["Submitted","Under Review","Assigned","In Progress","Resolved"];
const STATUS_CLASS = ["b-submitted","b-review","b-assigned","b-progress","b-resolved"];
const STORE_KEY = "mtaafix_reports_v1";

function esc(s){const d=document.createElement("div");d.textContent=s;return d.innerHTML;}
function catById(id){return CATEGORIES.find(c=>c.id===id)||CATEGORIES[7];}
function fmtDate(iso){const d=new Date(iso);return d.toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"numeric"});}

function seedReports(){
  const now = Date.now();
  return [
    {id:"MTF-2026-K2N7", cat:"roads", ward:"Kasarani", landmark:"Near Kasarani Stadium gate B", desc:"Huge pothole covering half the road on Kasarani–Mwiki road. Boda riders are swerving into oncoming traffic to avoid it.", name:"James Mwangi", phone:"0712***678", photo:null, status:4, created:new Date(now-12*86400000).toISOString()},
    {id:"MTF-2026-P9Q4", cat:"water", ward:"Kibera (Sarang'ombe)", landmark:"Behind Toi Market", desc:"Water pipe burst three days ago. Water is flowing into the road, and we have had no supply at home since yesterday.", name:"Achieng O.", phone:"07***", photo:null, status:3, created:new Date(now-5*86400000).toISOString()},
    {id:"MTF-2026-D4F8", cat:"lights", ward:"Westlands", landmark:"Parklands 5th Avenue", desc:"Streetlights along 5th Avenue have been off for two weeks. The stretch is now unsafe at night, especially for women walking from work.", name:"Fatuma Ali", phone:"07***", photo:null, status:2, created:new Date(now-3*86400000).toISOString()},
    {id:"MTF-2026-M6R2", cat:"garbage", ward:"Embakasi East", landmark:"Nyayo Estate Phase 2 gate", desc:"Garbage has not been collected for three weeks. The heap is now blocking part of the road and smells terrible.", name:"Peter Njoroge", phone:"07***", photo:null, status:1, created:new Date(now-2*86400000).toISOString()},
    {id:"MTF-2026-W8T5", cat:"drainage", ward:"Mvita, Mombasa", landmark:"Near Makadara Mosque", desc:"Blocked drainage on Abdel Nasser Road. Every light rain floods the shops along the road.", name:"Swaleh Omar", phone:"07***", photo:null, status:0, created:new Date(now-1*86400000).toISOString()}
  ];
}

function loadReports(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(raw){return JSON.parse(raw);}
  }catch(e){}
  const seeded = seedReports();
  saveReports(seeded);
  return seeded;
}
function saveReports(r){try{localStorage.setItem(STORE_KEY, JSON.stringify(r));}catch(e){}}

let reports = loadReports();
let selectedCat = null;
let lastId = null;

/* ---- Nav ---- */
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");
hamburger.addEventListener("click", ()=> navLinks.classList.toggle("open"));
navLinks.querySelectorAll("a").forEach(a=>a.addEventListener("click", ()=>navLinks.classList.remove("open")));

/* ---- Category pills ---- */
const catPills = document.getElementById("catPills");
CATEGORIES.forEach(c=>{
  const b = document.createElement("button");
  b.type = "button"; b.className = "cat-pill"; b.dataset.cat = c.id;
  b.textContent = c.label;
  b.addEventListener("click", ()=>{
    selectedCat = c.id;
    catPills.querySelectorAll(".cat-pill").forEach(p=>p.classList.remove("selected"));
    b.classList.add("selected");
  });
  catPills.appendChild(b);
});

/* ---- Photo preview ---- */
let photoData = null;
document.getElementById("photo").addEventListener("change", function(){
  const file = this.files[0];
  const preview = document.getElementById("photoPreview");
  if(!file){photoData=null;preview.style.display="none";return;}
  const reader = new FileReader();
  reader.onload = function(e){
    const img = new Image();
    img.onload = function(){
      const canvas = document.createElement("canvas");
      const maxW = 800;
      const scale = Math.min(1, maxW / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      photoData = canvas.toDataURL("image/jpeg", 0.7);
      document.getElementById("photoPreviewImg").src = photoData;
      preview.style.display = "block";
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

/* ---- Submit ---- */
document.getElementById("reportForm").addEventListener("submit", function(e){
  e.preventDefault();
  if(!selectedCat){toast("Please choose an issue category");return;}
  const id = "MTF-2026-" + Math.random().toString(36).substring(2,6).toUpperCase();
  const rep = {
    id: id,
    cat: selectedCat,
    ward: document.getElementById("ward").value.trim(),
    landmark: document.getElementById("landmark").value.trim(),
    desc: document.getElementById("desc").value.trim(),
    name: document.getElementById("name").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    photo: photoData,
    status: 0,
    created: new Date().toISOString()
  };
  reports.unshift(rep);
  saveReports(reports);
  lastId = id;
  document.getElementById("modalId").textContent = id;
  document.getElementById("successModal").classList.add("show");
  this.reset();
  photoData = null;
  document.getElementById("photoPreview").style.display = "none";
  selectedCat = null;
  catPills.querySelectorAll(".cat-pill").forEach(p=>p.classList.remove("selected"));
  renderDashboard();
  updateStats();
});

document.getElementById("copyIdBtn").addEventListener("click", function(){
  navigator.clipboard.writeText(lastId).then(()=>{this.textContent="Copied ✓";setTimeout(()=>{this.textContent="Copy ID";},1500);});
});
document.getElementById("closeModalBtn").addEventListener("click", ()=>{
  document.getElementById("successModal").classList.remove("show");
});

/* ---- Filters ---- */
let activeFilter = "all";
const filtersEl = document.getElementById("filters");
[{id:"all",label:"All Issues"}].concat(CATEGORIES).forEach(c=>{
  const b = document.createElement("button");
  b.className = "filter-chip" + (c.id==="all" ? " active" : "");
  b.textContent = c.label;
  b.addEventListener("click", ()=>{
    activeFilter = c.id;
    filtersEl.querySelectorAll(".filter-chip").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    renderDashboard();
  });
  filtersEl.appendChild(b);
});

/* ---- Dashboard ---- */
function renderDashboard(){
  const grid = document.getElementById("reportGrid");
  const list = activeFilter==="all" ? reports : reports.filter(r=>r.cat===activeFilter);
  if(!list.length){grid.innerHTML = '<div class="empty">No reports in this category yet. Be the first to report one! 👆</div>';return;}
  grid.innerHTML = list.map(r=>{
    const c = catById(r.cat);
    return '<div class="report-card">'+
      '<div class="top"><div class="cat">'+esc(c.label)+'</div>'+
      '<span class="badge '+STATUS_CLASS[r.status]+'">'+STATUSES[r.status]+'</span></div>'+
      '<div class="loc">'+esc(r.ward)+(r.landmark?' — '+esc(r.landmark):'')+'</div>'+
      '<div class="desc">'+esc(r.desc)+'</div>'+
      (r.photo ? '<img src="'+r.photo+'" alt="Issue photo">' : '')+
      '<div class="meta"><span>'+esc(r.name)+'</span><span>'+fmtDate(r.created)+' · '+esc(r.id)+'</span></div>'+
    '</div>';
  }).join("");
}

/* ---- Stats ---- */
function updateStats(){
  document.getElementById("statTotal").textContent = reports.length;
  document.getElementById("statResolved").textContent = reports.filter(r=>r.status===4).length;
  document.getElementById("statActive").textContent = reports.filter(r=>r.status>0 && r.status<4).length;
  document.getElementById("statCategories").textContent = new Set(reports.map(r=>r.cat)).size;
}

/* ---- Track ---- */
document.getElementById("trackForm").addEventListener("submit", function(e){
  e.preventDefault();
  const id = document.getElementById("trackInput").value.trim().toUpperCase();
  const r = reports.find(x=>x.id.toUpperCase()===id);
  const box = document.getElementById("trackResult");
  if(!r){
    box.innerHTML = '<div class="track-card" style="text-align:center;color:var(--slate-3)">No report found with that ID. Double-check and try again.</div>';
    return;
  }
  const c = catById(r.cat);
  let tl = '<div class="timeline">';
  STATUSES.forEach((s,i)=>{
    const cls = i < r.status ? "done" : (i === r.status ? "done current" : "");
    const note = i===0 ? "Received by Mtaafix" : (i===4 ? "Marked as fixed" : "");
    tl += '<div class="t-item '+cls+'"><div class="t-dot"></div><h4>'+s+'</h4><p>'+note+'</p></div>';
  });
  tl += '</div>';
  box.innerHTML = '<div class="track-card">'+
    '<div class="head"><div><h3>'+esc(c.label)+'</h3><div class="sub">'+esc(r.ward)+(r.landmark?' — '+esc(r.landmark):'')+' · '+fmtDate(r.created)+'</div></div>'+
    '<span class="badge '+STATUS_CLASS[r.status]+'">'+STATUSES[r.status]+'</span></div>'+
    '<p style="font-size:14.5px;color:var(--slate-2);margin-bottom:22px">'+esc(r.desc)+'</p>'+
    tl+
    '<div class="demo-controls">Prototype demo: <button type="button" id="advanceBtn">Advance status</button> <span>(simulates the organization updating this report)</span></div>'+
  '</div>';
  document.getElementById("advanceBtn").addEventListener("click", ()=>{
    if(r.status < 4){
      r.status++;
      saveReports(reports);
      renderDashboard(); updateStats();
      document.getElementById("trackInput").value = r.id;
      document.getElementById("trackForm").dispatchEvent(new Event("submit"));
      toast("Status updated: " + STATUSES[r.status]);
    } else {
      toast("This report is already resolved 🎉");
    }
  });
});

/* ---- Toast ---- */
let toastTimer;
function toast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove("show"), 2600);
}

renderDashboard();
updateStats();
