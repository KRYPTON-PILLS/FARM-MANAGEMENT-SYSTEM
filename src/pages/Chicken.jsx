import { useContext, useState, useEffect } from "react";
import { FarmContext } from "../context/FarmContext";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

/* ── Type config ── */
const TYPES = [
  { key:"rooster",  label:"Roosters",  color:"bg-emerald-700", light:"bg-emerald-50",  text:"text-emerald-900", border:"border-emerald-300", showEggs:false },
  { key:"hen",      label:"Hens",      color:"bg-rose-500",    light:"bg-rose-50",     text:"text-rose-900",    border:"border-rose-300",    showEggs:true  },
  { key:"cockerel", label:"Cockerels", color:"bg-sky-500",     light:"bg-sky-50",      text:"text-sky-900",     border:"border-sky-300",     showEggs:false },
  { key:"pullet",   label:"Pullets",   color:"bg-pink-500",    light:"bg-pink-50",     text:"text-pink-900",    border:"border-pink-300",    showEggs:true  },
  { key:"chick",    label:"Chicks",    color:"bg-amber-500",   light:"bg-amber-50",    text:"text-amber-900",   border:"border-amber-300",   showEggs:false },
];

const ADD_TYPES    = ["Initial Stock","Purchase","Hatch","Transfer In"];
const REMOVE_TYPES = ["Sold","Died","Culled","Transfer Out"];

/* ── Age label from a date ── */
function ageStr(d) {
  if (!d) return "—";
  const days = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (days < 0)   return "—";
  if (days < 7)   return `${days}d old`;
  if (days < 30)  return `${Math.floor(days/7)}w old`;
  if (days < 365) return `${Math.floor(days/30)}mo old`;
  return `${(days/365).toFixed(1)}y old`;
}

/* ── Running count from change log ── */
function calcCount(changes) {
  return (changes||[]).reduce((t,c) => {
    if (ADD_TYPES.includes(c.changeType))    return t + (parseInt(c.count)||0);
    if (REMOVE_TYPES.includes(c.changeType)) return t - (parseInt(c.count)||0);
    return t;
  }, 0);
}

/* ── Modal ── */
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const F = ({ label, children }) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{label}</label>
    {children}
  </div>
);

export default function Chicken() {
  const navigate = useNavigate();
  const { animals=[], setAnimals } = useContext(FarmContext);

  /* ── Ensure all 5 flock records exist ── */
  useEffect(() => {
    setAnimals((prev) => {
      let next = [...prev];
      TYPES.forEach(({ key }) => {
        const id = `chicken-${key}-flock`;
        if (!next.find((a) => a.id === id)) {
          next = [...next, {
            id, __flockRecord:true, category:"chicken", type:key,
            image:"", breed:"", notes:"", acquisitionDate:"",
            layerCount:0,
            flockChanges:[], eggRecords:[], feedRecords:[], medicalLog:[],
          }];
        }
      });
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Get flock record for a type ── */
  const flock = (key) => animals.find((a) => a.id === `chicken-${key}-flock`);
  const updFlock = (key, u) => setAnimals((p) => p.map((a) => a.id === `chicken-${key}-flock` ? u : a));

  /* ── Modal state ── */
  const [modal,      setModal]      = useState(null); // { type, mode }
  const [activeType, setActiveType] = useState(null);
  const [expanded,   setExpanded]   = useState(null);

  /* ── Edit state ── */
  const [editData, setEditData] = useState(null);

  /* ── Form state ── */
  const [newChange,  setNewChange]  = useState({ date:"", changeType:"Purchase", count:"", pricePerBird:"", buyer:"", source:"", notes:"" });
  const [newEgg,     setNewEgg]     = useState({ date:"", eggsCollected:"", eggsSold:"", pricePerEgg:"", notes:"" });
  const [newFeed,    setNewFeed]    = useState({ date:"", feedType:"", amountKg:"", costPerKg:"", notes:"" });
  const [newMedical, setNewMedical] = useState({ date:"", treatment:"", product:"", dose:"", birdsAffected:"", cost:"", vetName:"", notes:"" });
  const [eggChartMode, setEggChartMode] = useState("produce");
  const [eggTimeframe, setEggTimeframe] = useState("daily");

  const availableAddTypes = (type) => type === "chick"
    ? ADD_TYPES
    : ADD_TYPES.filter((t) => t !== "Hatch");

  const openModal = (type, mode) => { setActiveType(type); setModal(mode); };
  const closeModal = () => { setModal(null); setActiveType(null); };

  /* ── Add helpers ── */
  const addChange = () => {
    if (!newChange.date||!newChange.count||!activeType) return;
    const f = flock(activeType); if (!f) return;
    const totalValue = newChange.changeType==="Sold"
      ? (parseInt(newChange.count)*parseFloat(newChange.pricePerBird||0)).toFixed(0) : "";
    const updatedChanges = [...(f.flockChanges||[]),{...newChange,id:Date.now(),totalValue}];
    const newCount = calcCount(updatedChanges);
    updFlock(activeType, { ...f, flockChanges:updatedChanges, availableCount:newCount });
    setNewChange({ date:"", changeType:"Purchase", count:"", pricePerBird:"", buyer:"", source:"", notes:"" });
    closeModal();
  };

  const addEgg = () => {
    if (!newEgg.date||!newEgg.eggsCollected||!activeType) return;
    const f = flock(activeType); if (!f) return;
    updFlock(activeType, { ...f, eggRecords:[...(f.eggRecords||[]),{...newEgg,id:Date.now()}] });
    setNewEgg({ date:"", eggsCollected:"", eggsSold:"", pricePerEgg:"", notes:"" });
    closeModal();
  };

  const addFeed = () => {
    if (!newFeed.date||!newFeed.feedType||!activeType) return;
    const f = flock(activeType); if (!f) return;
    const totalCost = ((parseFloat(newFeed.amountKg)||0)*(parseFloat(newFeed.costPerKg)||0)).toFixed(0);
    updFlock(activeType, { ...f, feedRecords:[...(f.feedRecords||[]),{...newFeed,id:Date.now(),totalCost}] });
    setNewFeed({ date:"", feedType:"", amountKg:"", costPerKg:"", notes:"" });
    closeModal();
  };

  const addMedical = () => {
    if (!newMedical.date||!newMedical.treatment||!activeType) return;
    const f = flock(activeType); if (!f) return;
    updFlock(activeType, { ...f, medicalLog:[...(f.medicalLog||[]),{...newMedical,id:Date.now()}] });
    setNewMedical({ date:"", treatment:"", product:"", dose:"", birdsAffected:"", cost:"", vetName:"", notes:"" });
    closeModal();
  };

  const getEggChartData = (records = [], timeframe = "daily", mode = "produce") => {
    const groups = {};
    [...records].sort((a,b)=>new Date(a.date)-new Date(b.date)).forEach((record) => {
      const date = new Date(record.date);
      if (Number.isNaN(date)) return;
      let key = "";
      let label = "";

      if (timeframe === "daily") {
        key = date.toISOString().slice(0, 10);
        label = key;
      } else if (timeframe === "weekly") {
        const weekStart = new Date(date);
        const day = weekStart.getDay();
        weekStart.setDate(weekStart.getDate() - ((day + 6) % 7));
        key = weekStart.toISOString().slice(0, 10);
        label = `Week of ${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      } else if (timeframe === "monthly") {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        key = `${year}-${month}`;
        label = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      } else {
        key = `${date.getFullYear()}`;
        label = key;
      }

      const value = mode === "sales"
        ? ((parseInt(record.eggsSold) || 0) * (parseFloat(record.pricePerEgg) || 0))
        : (parseInt(record.eggsCollected) || 0);

      if (!groups[key]) groups[key] = { key, label, value: 0 };
      groups[key].value += value;
    });

    return Object.values(groups).sort((a, b) => a.key.localeCompare(b.key));
  };

  const delRecord = (typeKey, field, rid) => {
    const f = flock(typeKey); if (!f) return;
    updFlock(typeKey, { ...f, [field]:(f[field]||[]).filter((r)=>r.id!==rid) });
  };

  const saveEdit = () => {
    if (!editData||!activeType) return;
    updFlock(activeType, editData);
    setEditData(null); setActiveType(null);
  };

  const imgUp = (typeKey, e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { const f=flock(typeKey); if(f) updFlock(typeKey,{...f,image:reader.result}); };
    reader.readAsDataURL(file);
  };

  /* ── Grand totals ── */
  const grandTotal = TYPES.reduce((sum, { key }) => {
    const f = flock(key);
    const count = f && f.availableCount !== undefined && f.availableCount !== null ? f.availableCount : calcCount(f?.flockChanges);
    return sum + count;
  }, 0);
  const totalEggs  = TYPES.reduce((sum, { key }) => {
    const f = flock(key); if (!f) return sum;
    return sum + (f.eggRecords||[]).reduce((s,r)=>s+(parseInt(r.eggsCollected)||0),0);
  }, 0);

  return (
    <div className="bg-green-50 relative p-6">
      {/* BACK */}
      <button onClick={()=>navigate(-1)}
        className="absolute -top-4 -left-[15px] z-50 bg-white shadow-md w-11 h-11 rounded-full flex items-center justify-center hover:scale-110 transition">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-700">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
        </svg>
      </button>

      {/* HEADER */}
      <div className="mb-6 ml-14">
        <h2 className="text-3xl font-bold text-green-900">Chicken Management</h2>
        <p className="text-green-700 font-semibold mt-1">Total chickens on farm: {grandTotal.toLocaleString()}</p>
      </div>

      {/* GRAND TOTAL STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {TYPES.map(({ key, label, color, text, light }) => {
          const f = flock(key);
          const count = f && f.availableCount !== undefined && f.availableCount !== null ? f.availableCount : calcCount(f?.flockChanges);
          return (
            <button key={key} onClick={()=>setExpanded(expanded===key?null:key)}
              className={`rounded-xl p-4 text-left transition shadow-sm border-2 ${expanded===key?"border-green-500 shadow-md":count>0?`${light} border-transparent`:"bg-white border-gray-100"}`}>
              <p className="text-xs text-gray-400 uppercase font-semibold">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${count>0?text:"text-gray-300"}`}>{count}</p>
              {flock(key)?.acquisitionDate&&<p className="text-xs text-gray-400 mt-0.5">{ageStr(flock(key).acquisitionDate)}</p>}
            </button>
          );
        })}
        <div className="rounded-xl p-4 bg-amber-50 border border-amber-200 shadow-sm">
          <p className="text-xs text-gray-400 uppercase font-semibold">🥚 Total Eggs</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{totalEggs.toLocaleString()}</p>
        </div>
      </div>

      {/* TYPE SECTIONS */}
      <div className="space-y-6">
        {TYPES.map(({ key, label, color, light, text, border, showEggs }) => {
          const f = flock(key);
          if (!f) return null;

          const count        = f.availableCount !== undefined && f.availableCount !== null ? f.availableCount : calcCount(f.flockChanges);
          const totalSold    = (f.flockChanges||[]).filter(c=>c.changeType==="Sold").reduce((s,c)=>s+(parseInt(c.count)||0),0);
          const totalDied    = (f.flockChanges||[]).filter(c=>c.changeType==="Died").reduce((s,c)=>s+(parseInt(c.count)||0),0);
          const totalRevenue = (f.flockChanges||[]).filter(c=>c.changeType==="Sold").reduce((s,c)=>s+(parseFloat(c.totalValue)||0),0);
          const totalFeedCost= (f.feedRecords||[]).reduce((s,r)=>s+(parseFloat(r.totalCost)||0),0);
          const recentEggs   = (f.eggRecords||[]).slice(-7).reduce((s,r)=>s+(parseInt(r.eggsCollected)||0),0);
          const isExpanded   = expanded === key;

          const flockSizeChart = (() => {
            let run = 0;
            return [...(f.flockChanges||[])].sort((a,b)=>new Date(a.date)-new Date(b.date)).map(c=>{
              if(ADD_TYPES.includes(c.changeType))    run+=parseInt(c.count)||0;
              if(REMOVE_TYPES.includes(c.changeType)) run-=parseInt(c.count)||0;
              return { date:c.date, count:run };
            });
          })();

          const eggChart = getEggChartData(f.eggRecords, eggTimeframe, eggChartMode).slice(-12);
          const eggChartTitle = eggChartMode === "sales" ? "Egg Sales Income" : "Egg Production";
          const eggChartUnit = eggChartMode === "sales" ? "KES" : "Eggs";
          const eggChartFill = eggChartMode === "sales" ? "#10b981" : "#f59e0b";

          const isEditing = editData && activeType === key;

          return (
            <div key={key} className={`bg-white rounded-2xl shadow overflow-hidden border-l-4 ${border}`}>

              {/* TYPE HEADER ROW */}
              <div className="flex items-center gap-4 p-5">

                {/* IMAGE */}
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 group shrink-0">
                  {f.image
                    ? <img src={f.image} alt={label} className="w-full h-full object-cover"/>
                    : <div className="flex items-center justify-center h-full text-3xl">🐔</div>}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition cursor-pointer">
                    <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-semibold bg-black/50 px-2 py-1 rounded transition">📷</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e)=>imgUp(key,e)}/>
                  </label>
                </div>

                {/* MAIN INFO */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-xl font-bold text-gray-900">{label}</h3>
                    <span className={`text-white text-xs font-bold px-3 py-1 rounded-full ${color}`}>
                      {count} birds
                    </span>
                    {f.breed&&<span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{f.breed}</span>}
                    {f.acquisitionDate&&<span className="text-xs text-gray-400">🕐 {ageStr(f.acquisitionDate)}</span>}
                  </div>

                  {/* QUICK STATS ROW */}
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                    {totalSold>0&&<span className="text-amber-700 font-semibold">Sold: {totalSold}</span>}
                    {totalDied>0&&<span className="text-red-600 font-semibold">Died: {totalDied}</span>}
                    {totalRevenue>0&&<span className="text-green-700 font-semibold">Revenue: KES {totalRevenue.toLocaleString()}</span>}
                    {totalFeedCost>0&&<span className="text-orange-600">Feed: KES {totalFeedCost.toLocaleString()}</span>}
                    {showEggs&&recentEggs>0&&<span className="text-amber-600 font-semibold">🥚 Last 7d: {recentEggs} eggs</span>}
                    {showEggs&&f.layerCount>0&&<span className="text-rose-600">Layers: {f.layerCount}/{count}</span>}
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex flex-col gap-2 shrink-0">
                  <div className="flex gap-2">
                    <button onClick={()=>{ setActiveType(key); setEditData({...f}); }}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition font-semibold">
                      ✏️ Edit
                    </button>
                    <button onClick={()=>setExpanded(isExpanded?null:key)}
                      className={`text-xs px-3 py-1.5 rounded-lg transition font-semibold ${isExpanded?"bg-green-600 text-white":"bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                      {isExpanded?"▲ Hide":"▼ View"}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>{ setNewChange({date:"",changeType:"Purchase",count:"",pricePerBird:"",buyer:"",source:"",notes:""}); openModal(key,"addChange"); }}
                      className={`text-xs ${color} hover:opacity-90 text-white px-3 py-1.5 rounded-lg transition font-semibold`}>
                      + Add Birds
                    </button>
                    <button onClick={()=>{ setNewChange({date:"",changeType:"Sold",count:"",pricePerBird:"",buyer:"",source:"",notes:""}); openModal(key,"addChange"); }}
                      className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg transition font-semibold">
                      − Remove
                    </button>
                  </div>
                </div>
              </div>

              {/* EDIT FORM — inline */}
              {isEditing && editData && (
                <div className={`${light} border-t p-5`}>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                    <div><label className="text-xs text-gray-500 uppercase font-semibold block mb-1">Breed / Strain</label>
                      <input value={editData.breed||""} onChange={(e)=>setEditData({...editData,breed:e.target.value})} placeholder="e.g. Kienyeji, Broiler, KARI" className="border rounded-lg p-2 w-full text-sm"/></div>
                    <div><label className="text-xs text-gray-500 uppercase font-semibold block mb-1">Available Count</label>
                      <input type="number" value={editData.availableCount||""} onChange={(e)=>setEditData({...editData,availableCount:parseInt(e.target.value)||0})} placeholder="Current available birds" className="border rounded-lg p-2 w-full text-sm"/></div>
                    {showEggs&&<div><label className="text-xs text-gray-500 uppercase font-semibold block mb-1">Active Layers</label>
                      <input type="number" value={editData.layerCount||""} onChange={(e)=>setEditData({...editData,layerCount:e.target.value})} placeholder="e.g. 45" className="border rounded-lg p-2 w-full text-sm"/></div>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700 font-semibold">Save Changes</button>
                    <button onClick={()=>{setEditData(null);setActiveType(null);}} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm hover:bg-gray-300">Cancel</button>
                  </div>
                </div>
              )}

              {/* EXPANDED DETAILS */}
              {isExpanded && (
                <div className="border-t p-5 space-y-5">

                  {/* QUICK ACTION ROW */}
                  <div className="flex flex-wrap gap-2">
                    {showEggs&&<button onClick={()=>{ setNewEgg({date:"",eggsCollected:"",eggsSold:"",pricePerEgg:"",notes:""}); openModal(key,"addEgg"); }} className="bg-amber-500 text-white text-xs px-4 py-2 rounded-xl hover:bg-amber-600 transition font-semibold">+ Record Eggs 🥚</button>}
                    <button onClick={()=>{ setNewFeed({date:"",feedType:"",amountKg:"",costPerKg:"",notes:""}); openModal(key,"addFeed"); }} className="bg-green-600 text-white text-xs px-4 py-2 rounded-xl hover:bg-green-700 transition font-semibold">+ Feed Record 🌾</button>
                    <button onClick={()=>{ setNewMedical({date:"",treatment:"",product:"",dose:"",birdsAffected:"",cost:"",vetName:"",notes:""}); openModal(key,"addMedical"); }} className="bg-red-600 text-white text-xs px-4 py-2 rounded-xl hover:bg-red-700 transition font-semibold">+ Medical 💊</button>
                  </div>

                  {/* CHARTS ROW */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {flockSizeChart.length>1&&(
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Flock Size Over Time</p>
                        <ResponsiveContainer width="100%" height={150}>
                          <LineChart data={flockSizeChart}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4"/>
                            <XAxis dataKey="date" tick={{fontSize:9}}/>
                            <YAxis tick={{fontSize:10}}/>
                            <Tooltip contentStyle={{borderRadius:"8px",fontSize:"11px"}}/>
                            <Line type="monotone" dataKey="count" name="Birds" stroke="#16a34a" strokeWidth={2} dot={{r:3}} connectNulls/>
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {showEggs&&eggChart.length>1&&(
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase">{eggChartTitle} ({eggTimeframe})</p>
                          <div className="flex flex-wrap gap-2">
                            <select value={eggTimeframe} onChange={(e)=>setEggTimeframe(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white">
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                              <option value="yearly">Yearly</option>
                            </select>
                            <select value={eggChartMode} onChange={(e)=>setEggChartMode(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white">
                              <option value="produce">Total Produce</option>
                              <option value="sales">Sales</option>
                            </select>
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={150}>
                          <BarChart data={eggChart} barSize={16}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#fffbeb"/>
                            <XAxis dataKey="label" tick={{fontSize:9}}/>
                            <YAxis tick={{fontSize:10}}/>
                            <Tooltip formatter={(value)=>(eggChartMode==="sales"? [`KES ${value.toLocaleString()}`, eggChartUnit] : [value, eggChartUnit])} contentStyle={{borderRadius:"8px",fontSize:"11px"}}/>
                            <Bar dataKey="value" name={eggChartUnit} fill={eggChartFill} radius={[3,3,0,0]}/>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* FLOCK CHANGES TABLE */}
                  {(f.flockChanges||[]).length>0&&(
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Flock Change Log</p>
                      <div className="rounded-xl border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto"><div className="overflow-y-auto" style={{maxHeight:"180px"}}>
                          <table className="w-full text-xs min-w-[520px]">
                            <thead><tr className="bg-gray-50 sticky top-0 border-b border-gray-200">
                              {["Date","Type","Birds","Running Total","Revenue","Notes",""].map(h=><th key={h} className="text-left px-3 py-2 font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>)}
                            </tr></thead>
                            <tbody className="divide-y divide-gray-100">
                              {(()=>{
                                let run=0;
                                return [...(f.flockChanges||[])].sort((a,b)=>new Date(a.date)-new Date(b.date)).map((c,i)=>{
                                  const isAdd=ADD_TYPES.includes(c.changeType);
                                  if(isAdd) run+=parseInt(c.count)||0; else run-=parseInt(c.count)||0;
                                  return(
                                    <tr key={c.id} className={`${i%2===0?"bg-white":"bg-gray-50/40"} hover:bg-green-50/30`}>
                                      <td className="px-3 py-2 whitespace-nowrap text-gray-700">{c.date}</td>
                                      <td className="px-3 py-2 whitespace-nowrap"><span className={`font-semibold px-2 py-0.5 rounded-full ${isAdd?"bg-green-100 text-green-800":"bg-red-100 text-red-700"}`}>{c.changeType}</span></td>
                                      <td className="px-3 py-2 whitespace-nowrap"><span className={`font-bold ${isAdd?"text-green-700":"text-red-600"}`}>{isAdd?"+":"-"}{c.count}</span></td>
                                      <td className="px-3 py-2 whitespace-nowrap font-bold text-gray-800">{run}</td>
                                      <td className="px-3 py-2 whitespace-nowrap text-amber-700">{c.totalValue?`KES ${parseFloat(c.totalValue).toLocaleString()}`:"—"}</td>
                                      <td className="px-3 py-2 text-gray-400 max-w-[120px]"><span className="block truncate">{c.notes||c.buyer||c.source||"—"}</span></td>
                                      <td className="px-3 py-2"><button onClick={()=>delRecord(key,"flockChanges",c.id)} className="text-gray-300 hover:text-red-500 text-base">&times;</button></td>
                                    </tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div></div>
                      </div>
                    </div>
                  )}

                  {/* EGG RECORDS */}
                  {showEggs&&(f.eggRecords||[]).length>0&&(
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Recent Egg Collections</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {[...(f.eggRecords||[])].reverse().slice(0,5).map(r=>(
                          <div key={r.id} className="bg-amber-50 rounded-xl p-2.5 flex justify-between items-center text-xs">
                            <div><span className="font-semibold text-amber-900">{r.date}</span><span className="text-amber-700 ml-2">🥚 {r.eggsCollected} collected</span>{r.eggsSold&&<span className="text-green-600 ml-1">· Sold: {r.eggsSold}</span>}{r.eggsSold&&r.pricePerEgg&&<span className="text-amber-700 ml-1">· KES {(parseInt(r.eggsSold)*parseFloat(r.pricePerEgg)).toLocaleString()}</span>}</div>
                            <button onClick={()=>delRecord(key,"eggRecords",r.id)} className="text-gray-300 hover:text-red-500 text-base">&times;</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FEED RECORDS */}
                  {(f.feedRecords||[]).length>0&&(
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Recent Feed Records</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {[...(f.feedRecords||[])].reverse().slice(0,4).map(r=>(
                          <div key={r.id} className="bg-green-50 rounded-xl p-2.5 flex justify-between items-center text-xs">
                            <div><span className="font-semibold text-green-900">{r.feedType}</span><span className="text-gray-500 ml-2">{r.date} · {r.amountKg}kg</span>{r.totalCost&&<span className="text-amber-700 ml-1">KES {parseFloat(r.totalCost).toLocaleString()}</span>}</div>
                            <button onClick={()=>delRecord(key,"feedRecords",r.id)} className="text-gray-300 hover:text-red-500 text-base">&times;</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MEDICAL RECORDS */}
                  {(f.medicalLog||[]).length>0&&(
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Recent Medical Records</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {[...(f.medicalLog||[])].reverse().slice(0,4).map(r=>(
                          <div key={r.id} className="bg-red-50 rounded-xl p-2.5 flex justify-between items-center text-xs">
                            <div><span className="font-semibold text-red-900">{r.treatment}</span><span className="text-gray-500 ml-2">{r.date}</span>{r.product&&<span className="text-gray-500 ml-1">· {r.product}</span>}{r.birdsAffected&&<span className="text-gray-500 ml-1">· {r.birdsAffected} birds</span>}</div>
                            <button onClick={()=>delRecord(key,"medicalLog",r.id)} className="text-gray-300 hover:text-red-500 text-base">&times;</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* EMPTY STATE */}
                  {(f.flockChanges||[]).length===0&&(f.eggRecords||[]).length===0&&(f.feedRecords||[]).length===0&&(f.medicalLog||[]).length===0&&(
                    <div className="text-center py-6 text-gray-400">
                      <p className="text-3xl mb-2">🐔</p>
                      <p className="text-sm">No records yet. Start by adding birds or recording feed.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ══ MODALS ══ */}

      {/* ADD FLOCK CHANGE */}
      {modal==="addChange"&&activeType&&<Modal title={`${TYPES.find(t=>t.key===activeType)?.label} — Add / Remove Birds`} onClose={closeModal}>
        <F label="Date"><input type="date" value={newChange.date} onChange={(e)=>setNewChange({...newChange,date:e.target.value})} className="border rounded-lg p-2 w-full"/></F>
        <F label="Type of Change">
          <div className="grid grid-cols-2 gap-2 mb-1">
            <div><p className="text-xs text-green-700 font-semibold mb-1">➕ Add birds</p>
              {availableAddTypes(activeType).map(t=><button key={t} type="button" onClick={()=>setNewChange({...newChange,changeType:t})}
                className={`w-full text-left px-3 py-2 rounded-lg border text-sm mb-1 transition ${newChange.changeType===t?"bg-green-600 text-white border-transparent":"bg-gray-50 border-gray-200 hover:border-green-300"}`}>{t}</button>)}
            </div>
            <div><p className="text-xs text-red-600 font-semibold mb-1">➖ Remove birds</p>
              {REMOVE_TYPES.map(t=><button key={t} type="button" onClick={()=>setNewChange({...newChange,changeType:t})}
                className={`w-full text-left px-3 py-2 rounded-lg border text-sm mb-1 transition ${newChange.changeType===t?"bg-red-600 text-white border-transparent":"bg-gray-50 border-gray-200 hover:border-red-300"}`}>{t}</button>)}
            </div>
          </div>
        </F>
        <F label="Number of Birds"><input type="number" placeholder="e.g. 50" value={newChange.count} onChange={(e)=>setNewChange({...newChange,count:e.target.value})} className="border rounded-lg p-2 w-full"/></F>
        {newChange.changeType==="Purchase"&&<>
          <F label="Purchase Price per Bird (KES)"><input type="number" placeholder="e.g. 800" value={newChange.pricePerBird} onChange={(e)=>setNewChange({...newChange,pricePerBird:e.target.value})} className="border rounded-lg p-2 w-full"/></F>
          {newChange.count&&newChange.pricePerBird&&<div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800 mb-3">💰 Total purchase cost: <strong>KES {(parseInt(newChange.count)*parseFloat(newChange.pricePerBird)).toLocaleString()}</strong></div>}
        </>}
        {newChange.changeType==="Sold"&&<>
          <F label="Price per Bird (KES)"><input type="number" placeholder="e.g. 800" value={newChange.pricePerBird} onChange={(e)=>setNewChange({...newChange,pricePerBird:e.target.value})} className="border rounded-lg p-2 w-full"/></F>
          {newChange.count&&newChange.pricePerBird&&<div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800 mb-3">💰 Total: <strong>KES {(parseInt(newChange.count)*parseFloat(newChange.pricePerBird)).toLocaleString()}</strong></div>}
          <F label="Buyer"><input value={newChange.buyer} onChange={(e)=>setNewChange({...newChange,buyer:e.target.value})} className="border rounded-lg p-2 w-full"/></F>
        </>}
        {ADD_TYPES.includes(newChange.changeType)&&newChange.changeType!=="Initial Stock"&&
          <F label="Source / Supplier"><input value={newChange.source} onChange={(e)=>setNewChange({...newChange,source:e.target.value})} className="border rounded-lg p-2 w-full"/></F>}
        <F label="Notes"><textarea value={newChange.notes} onChange={(e)=>setNewChange({...newChange,notes:e.target.value})} className="border rounded-lg p-2 w-full h-14 resize-none"/></F>
        <div className="flex gap-3 pt-2"><button onClick={addChange} className={`flex-1 ${TYPES.find(t=>t.key===activeType)?.color||"bg-green-600"} text-white py-2 rounded-xl font-semibold`}>Save</button><button onClick={closeModal} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div>
      </Modal>}

      {/* ADD EGG */}
      {modal==="addEgg"&&<Modal title="Record Egg Collection" onClose={closeModal}>
        <F label="Date"><input type="date" value={newEgg.date} onChange={(e)=>setNewEgg({...newEgg,date:e.target.value})} className="border rounded-lg p-2 w-full"/></F>
        <F label="Eggs Collected"><input type="number" placeholder="e.g. 42" value={newEgg.eggsCollected} onChange={(e)=>setNewEgg({...newEgg,eggsCollected:e.target.value})} className="border rounded-lg p-2 w-full"/></F>
        <F label="Eggs Sold"><input type="number" placeholder="e.g. 35" value={newEgg.eggsSold} onChange={(e)=>setNewEgg({...newEgg,eggsSold:e.target.value})} className="border rounded-lg p-2 w-full"/></F>
        <F label="Price per Egg (KES)"><input type="number" placeholder="e.g. 50" value={newEgg.pricePerEgg} onChange={(e)=>setNewEgg({...newEgg,pricePerEgg:e.target.value})} className="border rounded-lg p-2 w-full"/></F>
        {newEgg.eggsSold&&newEgg.pricePerEgg&&<div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 mb-3">💰 Total earned: <strong>KES {(parseInt(newEgg.eggsSold)*parseFloat(newEgg.pricePerEgg)).toLocaleString()}</strong></div>}
        <F label="Notes"><textarea value={newEgg.notes} onChange={(e)=>setNewEgg({...newEgg,notes:e.target.value})} className="border rounded-lg p-2 w-full h-14 resize-none"/></F>
        <div className="flex gap-3 pt-2"><button onClick={addEgg} className="flex-1 bg-amber-500 text-white py-2 rounded-xl hover:bg-amber-600 font-semibold">Save</button><button onClick={closeModal} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div>
      </Modal>}

      {/* ADD FEED */}
      {modal==="addFeed"&&<Modal title="Add Feed Record" onClose={closeModal}>
        <F label="Date"><input type="date" value={newFeed.date} onChange={(e)=>setNewFeed({...newFeed,date:e.target.value})} className="border rounded-lg p-2 w-full"/></F>
        <F label="Feed Type"><input placeholder="e.g. Layers mash, Chick mash, Growers, Maize" value={newFeed.feedType} onChange={(e)=>setNewFeed({...newFeed,feedType:e.target.value})} className="border rounded-lg p-2 w-full"/></F>
        <F label="Quantity (kg)"><input type="number" value={newFeed.amountKg} onChange={(e)=>setNewFeed({...newFeed,amountKg:e.target.value})} className="border rounded-lg p-2 w-full"/></F>
        <F label="Cost per KG (KES)"><input type="number" value={newFeed.costPerKg} onChange={(e)=>setNewFeed({...newFeed,costPerKg:e.target.value})} className="border rounded-lg p-2 w-full"/></F>
        {newFeed.amountKg&&newFeed.costPerKg&&<div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800 mb-3">💰 Total: <strong>KES {(parseFloat(newFeed.amountKg)*parseFloat(newFeed.costPerKg)).toLocaleString()}</strong></div>}
        <div className="flex gap-3 pt-2"><button onClick={addFeed} className="flex-1 bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 font-semibold">Save</button><button onClick={closeModal} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div>
      </Modal>}

      {/* ADD MEDICAL */}
      {modal==="addMedical"&&<Modal title="Add Medical Record" onClose={closeModal}>
        <F label="Date"><input type="date" value={newMedical.date} onChange={(e)=>setNewMedical({...newMedical,date:e.target.value})} className="border rounded-lg p-2 w-full"/></F>
        <F label="Treatment"><select value={newMedical.treatment} onChange={(e)=>setNewMedical({...newMedical,treatment:e.target.value})} className="border rounded-lg p-2 w-full"><option value="">Select...</option>{["Vaccination","Newcastle Disease","Deworming","Vitamin Supplement","Antibiotic","Antifungal","Coccidiosis Treatment","Parasite Control","Checkup","Other"].map(t=><option key={t}>{t}</option>)}</select></F>
        <F label="Product / Medicine"><input placeholder="e.g. Lasota, Newcastle La Sota" value={newMedical.product} onChange={(e)=>setNewMedical({...newMedical,product:e.target.value})} className="border rounded-lg p-2 w-full"/></F>
        <F label="Dose / Method"><input placeholder="e.g. Via drinking water, 1ml/bird" value={newMedical.dose} onChange={(e)=>setNewMedical({...newMedical,dose:e.target.value})} className="border rounded-lg p-2 w-full"/></F>
        <F label="Birds Treated"><input type="number" placeholder="Leave blank for whole flock" value={newMedical.birdsAffected} onChange={(e)=>setNewMedical({...newMedical,birdsAffected:e.target.value})} className="border rounded-lg p-2 w-full"/></F>
        <F label="Vet Name"><input value={newMedical.vetName} onChange={(e)=>setNewMedical({...newMedical,vetName:e.target.value})} className="border rounded-lg p-2 w-full"/></F>
        <F label="Cost (KES)"><input type="number" value={newMedical.cost} onChange={(e)=>setNewMedical({...newMedical,cost:e.target.value})} className="border rounded-lg p-2 w-full"/></F>
        <F label="Notes"><textarea value={newMedical.notes} onChange={(e)=>setNewMedical({...newMedical,notes:e.target.value})} className="border rounded-lg p-2 w-full h-14 resize-none"/></F>
        <div className="flex gap-3 pt-2"><button onClick={addMedical} className="flex-1 bg-red-600 text-white py-2 rounded-xl hover:bg-red-700 font-semibold">Save</button><button onClick={closeModal} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div>
      </Modal>}
    </div>
  );
}