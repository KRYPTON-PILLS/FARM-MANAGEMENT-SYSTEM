import { useParams, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { FarmContext } from "../context/FarmContext";
import { Modal, Field, BCSPicker, BCSBadge, FAMACHAPicker, FAMACHABadge, ActionCard, GrowthTable } from "../components/SheepHelpers";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const P_STATUSES = ["Open","Pregnant","Lactating","Dry"];
const P_COLORS   = { Open:"bg-gray-400", Pregnant:"bg-pink-500", Lactating:"bg-blue-500", Dry:"bg-amber-500" };

function daysUntil(d){return d?Math.ceil((new Date(d)-new Date())/86400000):null;}

export default function DoeProfile() {
  const {id}=useParams(); const navigate=useNavigate();
  const {animals=[],setAnimals}=useContext(FarmContext);
  const doe=animals.find((a)=>a.id?.toString()===id&&a.category==="goats"&&a.type?.toLowerCase()==="doe");
  const upd=(u)=>setAnimals((p)=>p.map((a)=>a.id?.toString()===id?u:a));

  const [isEditing,setIsEditing]=useState(false); const [edited,setEdited]=useState(null);
  const [modal,setModal]=useState(null);
  const [newGrowth,setNewGrowth]=useState({date:"",weight:"",bcs:0,price:"",notes:""});
  const [newMilk,setNewMilk]=useState({date:"",litres:"",timeOfDay:"Morning",notes:""});
  const [newFeed,setNewFeed]=useState({date:"",feedType:"",amount:"",minerals:"",lactationDiet:"",notes:""});
  const [newMed,setNewMed]=useState({date:"",type:"",medicine:"",vetName:"",cost:"",notes:""});
  const [newDrench,setNewDrench]=useState({date:"",product:"",dose:"",famacha:0,weightAtDrenching:"",nextDate:"",notes:""});
  const [newMating,setNewMating]=useState({dateMated:"",buck:"",expectedKidding:"",notes:""});
  const [newKidding,setNewKidding]=useState({date:"",numBorn:"1",type:"Single",survived:"All",buck:"",notes:""});

  if(!doe) return <p className="p-6 text-red-600">Doe not found.</p>;
  const gr=doe.growthRecords||[]; const mr=doe.milkRecords||[]; const fr=doe.feedRecords||[];
  const ml=doe.medicalLog||[]; const dr=doe.drenchingRecords||[];
  const matr=doe.matingRecords||[]; const kr=doe.kiddingRecords||[];

  const bucks=animals.filter((a)=>a.category==="goats"&&a.type?.toLowerCase()==="buck");
  const latestMating=matr.at(-1);
  const daysToKidding=latestMating?.expectedKidding&&!latestMating.kiddingComplete?daysUntil(latestMating.expectedKidding):null;

  const startEdit=()=>{setIsEditing(true);setEdited({...doe});}; const cancelEdit=()=>{setIsEditing(false);setEdited(null);};
  const saveEdit=()=>{upd(edited);setIsEditing(false);setEdited(null);}; const uf=(f,v)=>setEdited((p)=>({...p,[f]:v}));
  const imgUp=(e)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onloadend=()=>upd({...doe,image:r.result});r.readAsDataURL(f);};

  const addGrowth=()=>{if(!newGrowth.date)return;upd({...doe,growthRecords:[...gr,{...newGrowth,id:Date.now()}]});setNewGrowth({date:"",weight:"",bcs:0,price:"",notes:""});setModal("viewGrowth");};
  const addMilk=()=>{if(!newMilk.date||!newMilk.litres)return;upd({...doe,milkRecords:[...mr,{...newMilk,id:Date.now()}]});setNewMilk({date:"",litres:"",timeOfDay:"Morning",notes:""});setModal("viewMilk");};
  const addFeed=()=>{if(!newFeed.date||!newFeed.feedType)return;upd({...doe,feedRecords:[...fr,{...newFeed,id:Date.now()}]});setNewFeed({date:"",feedType:"",amount:"",minerals:"",lactationDiet:"",notes:""});setModal("viewFeed");};
  const addMed=()=>{if(!newMed.date||!newMed.type)return;upd({...doe,medicalLog:[...ml,{...newMed,id:Date.now()}]});setNewMed({date:"",type:"",medicine:"",vetName:"",cost:"",notes:""});setModal("viewMed");};
  const addDrench=()=>{if(!newDrench.date||!newDrench.product)return;upd({...doe,drenchingRecords:[...dr,{...newDrench,id:Date.now()}]});setNewDrench({date:"",product:"",dose:"",famacha:0,weightAtDrenching:"",nextDate:"",notes:""});setModal("viewDrench");};
  const addMating=()=>{if(!newMating.dateMated)return;upd({...doe,matingRecords:[...matr,{...newMating,id:Date.now()}],pregnancyStatus:"Pregnant"});setNewMating({dateMated:"",buck:"",expectedKidding:"",notes:""});setModal("viewMating");};
  const addKidding=()=>{if(!newKidding.date)return;upd({...doe,kiddingRecords:[...kr,{...newKidding,id:Date.now()}],pregnancyStatus:"Lactating"});setNewKidding({date:"",numBorn:"1",type:"Single",survived:"All",buck:"",notes:""});setModal("viewKidding");};
  const del=(f,rid)=>upd({...doe,[f]:(doe[f]||[]).filter((r)=>r.id!==rid)});

  /* chart data */
  const growthChartData=[...gr].sort((a,b)=>new Date(a.date)-new Date(b.date)).map((r)=>({date:r.date,weight:r.weight?parseFloat(r.weight):null,bcs:r.bcs?parseFloat(r.bcs):null}));
  const milkChartData=[...mr].sort((a,b)=>new Date(a.date)-new Date(b.date)).map((r)=>({date:r.date,litres:r.litres?parseFloat(r.litres):null}));
  const [activeMetrics,setActiveMetrics]=useState(["weight"]);
  const METRICS=[{key:"weight",label:"Weight (kg)",color:"#db2777"},{key:"bcs",label:"BCS",color:"#16a34a"}];
  const toggleM=(k)=>setActiveMetrics((p)=>p.includes(k)?p.length>1?p.filter((x)=>x!==k):p:[...p,k]);

  const totalKidsBorn=kr.reduce((s,r)=>s+(parseInt(r.numBorn)||0),0);
  const today=new Date().toISOString().split("T")[0];
  const todayMilk=mr.filter((r)=>r.date===today).reduce((s,r)=>s+(parseFloat(r.litres)||0),0);

  const statusColor={Healthy:"bg-green-100 text-green-800",Sick:"bg-red-100 text-red-700","Under Treatment":"bg-amber-100 text-amber-700"}[doe.status]||"bg-gray-100 text-gray-600";
  const pColor=P_COLORS[doe.pregnancyStatus]||"bg-gray-400";

  return (
    <div className="bg-pink-50 flex flex-col">
      {/* TOP BAR */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-white shadow-sm flex-wrap">
        <button onClick={()=>navigate(-1)} className="bg-white shadow w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-pink-700"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg></button>
        <h2 className="text-xl sm:text-2xl font-bold text-pink-900">Doe Profile</h2>
        <div className="ml-auto flex items-center gap-2">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor}`}>{doe.status}</span>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full text-white ${pColor}`}>{doe.pregnancyStatus||"Open"}</span>
        </div>
      </div>

      {/* KIDDING COUNTDOWN */}
      {daysToKidding!==null&&<div className={`px-6 py-2 text-sm font-semibold text-white text-center ${daysToKidding<=7?"bg-red-500":daysToKidding<=21?"bg-amber-500":"bg-pink-500"}`}>
        🐐 {daysToKidding>0?`Expected kidding in ${daysToKidding} day${daysToKidding!==1?"s":""} (${latestMating.expectedKidding})`:daysToKidding===0?"🐐 Kidding expected TODAY!":"⚠️ Kidding overdue — please update the record"}
      </div>}

      <div className="flex flex-1 gap-6 p-4 sm:p-6 flex-col lg:flex-row">
        {/* LEFT */}
        <div className="flex flex-col gap-4 w-full lg:w-72 lg:shrink-0">
          <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden shadow-lg bg-gray-100 group">
            {doe.image?<img src={doe.image} alt={doe.name} className="w-full h-full object-cover"/>:<div className="flex items-center justify-center h-full text-gray-400 text-sm">No image</div>}
            <label className="absolute inset-0 flex items-end justify-center pb-4 bg-black/0 group-hover:bg-black/30 transition cursor-pointer"><span className="opacity-0 group-hover:opacity-100 bg-white/90 text-pink-800 text-xs font-semibold px-3 py-1 rounded-full transition">Change photo</span><input type="file" accept="image/*" className="hidden" onChange={imgUp}/></label>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-sm space-y-2">
            {[{l:"Breed",f:"breed"},{l:"Color",f:"color"},{l:"Weight",f:"weight",s:" kg"},{l:"Age",f:"age",s:" yrs"}].map(({l,f,s=""})=>(
              <div key={f} className="flex justify-between items-center border-b last:border-0 pb-1 last:pb-0">
                <span className="text-gray-500">{l}</span>
                {isEditing?<input value={edited[f]||""} onChange={(e)=>uf(f,e.target.value)} className="border rounded px-2 py-0.5 w-28 text-right text-sm"/>:<span className="text-pink-900 font-semibold">{doe[f]?`${doe[f]}${s}`:<span className="text-gray-300">—</span>}</span>}
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-sm">
            <p className="font-semibold text-gray-500 text-xs uppercase mb-2">🥛 Milk Summary</p>
            <div className="space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Today's yield</span><span className="font-bold text-blue-600">{todayMilk>0?`${todayMilk} L`:"Not recorded"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total records</span><span className="font-bold text-blue-600">{mr.length}</span></div>
              {mr.length>0&&<div className="flex justify-between"><span className="text-gray-500">Latest yield</span><span className="font-bold text-blue-600">{mr.at(-1).litres} L</span></div>}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-sm">
            <p className="font-semibold text-gray-500 text-xs uppercase mb-2">Reproductive Summary</p>
            <div className="space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Total kiddings</span><span className="font-bold text-pink-700">{kr.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Kids born</span><span className="font-bold text-pink-700">{totalKidsBorn}</span></div>
              {dr.length>0&&dr.at(-1).nextDate&&<div className="flex justify-between"><span className="text-gray-500">Next drench</span><span className="font-bold text-orange-600">{dr.at(-1).nextDate}</span></div>}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1"><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Name</p>{isEditing?<input value={edited.name||""} onChange={(e)=>uf("name",e.target.value)} className="text-xl sm:text-2xl font-bold border-b border-pink-400 outline-none w-full"/>:<h3 className="text-xl sm:text-2xl font-bold text-pink-900">{doe.name}</h3>}</div>
              {!isEditing?<button onClick={startEdit} className="bg-pink-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-pink-700 transition">Edit Profile</button>:<div className="flex gap-2"><button onClick={saveEdit} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm">Save</button><button onClick={cancelEdit} className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm">Cancel</button></div>}
            </div>
            {isEditing&&<div className="mt-4 flex gap-4 flex-wrap">
              <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Health Status</p><select value={edited.status||""} onChange={(e)=>uf("status",e.target.value)} className="border rounded-lg px-3 py-2 text-sm">{["Healthy","Sick","Under Treatment"].map((s)=><option key={s}>{s}</option>)}</select></div>
              <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Pregnancy Status</p><select value={edited.pregnancyStatus||""} onChange={(e)=>uf("pregnancyStatus",e.target.value)} className="border rounded-lg px-3 py-2 text-sm">{P_STATUSES.map((s)=><option key={s}>{s}</option>)}</select></div>
            </div>}
          </div>

          {/* 7 ACTION CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <ActionCard title="Growth" count={gr.length} accent="rose" latest={gr.length>0?`${gr.at(-1).weight||"—"} kg`:null} latestDate={gr.at(-1)?.date} onAdd={()=>setModal("growth")} onView={()=>setModal("viewGrowth")} iconPath="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/>
            <ActionCard title="Milk Yield" count={mr.length} accent="blue" latest={mr.length>0?`${mr.at(-1).litres||"—"} L`:null} latestDate={mr.at(-1)?.date} onAdd={()=>setModal("milk")} onView={()=>setModal("viewMilk")} iconPath="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.575 1.399A1.5 1.5 0 0117 17.58v.82A2.25 2.25 0 0114.75 20.625H9.25A2.25 2.25 0 017 18.4v-.82a1.5 1.5 0 01-.225-1.181L5 14.5m14.8.5l-5.8-4.5M5 14.5l5.8-4.5"/>
            <ActionCard title="Mating" count={matr.length} accent="violet" latest={matr.length>0?`Buck: ${matr.at(-1).buck||"—"}`:null} latestDate={matr.at(-1)?.dateMated} onAdd={()=>setModal("mating")} onView={()=>setModal("viewMating")} iconPath="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
            <ActionCard title="Kidding" count={kr.length} accent="sky" latest={kr.length>0?`${kr.at(-1).numBorn} born (${kr.at(-1).type})`:null} latestDate={kr.at(-1)?.date} onAdd={()=>setModal("kidding")} onView={()=>setModal("viewKidding")} iconPath="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
            <ActionCard title="Drenching" count={dr.length} accent="amber" latest={dr.length>0?dr.at(-1).product:null} latestDate={dr.at(-1)?.date} onAdd={()=>setModal("drench")} onView={()=>setModal("viewDrench")} iconPath="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8.293 10.5h7.414M15 12.75a3 3 0 11-6 0 3 3 0 016 0z"/>
            <ActionCard title="Feed" count={fr.length} accent="green" latest={fr.length>0?fr.at(-1).feedType:null} latestDate={fr.at(-1)?.date} onAdd={()=>setModal("feed")} onView={()=>setModal("viewFeed")} iconPath="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>
            <ActionCard title="Medical" count={ml.length} accent="red" latest={ml.length>0?ml.at(-1).type:null} latestDate={ml.at(-1)?.date} onAdd={()=>setModal("med")} onView={()=>setModal("viewMed")} iconPath="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/>
          </div>

          {/* CHARTS */}
          {growthChartData.length>0&&<div className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
              <p className="text-sm font-semibold text-gray-600">Growth chart</p>
              <div className="flex gap-2">{METRICS.map((m)=>{const a=activeMetrics.includes(m.key);return<button key={m.key} onClick={()=>toggleM(m.key)} className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition ${a?"text-white border-transparent":"bg-white text-gray-500 border-gray-200"}`} style={a?{backgroundColor:m.color}:{}}>{m.label}</button>;})}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}><LineChart data={growthChartData}><CartesianGrid strokeDasharray="4 4" stroke="#fdf2f8"/><XAxis dataKey="date" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip contentStyle={{borderRadius:"8px",fontSize:"12px"}}/><Legend wrapperStyle={{fontSize:"11px"}}/>{METRICS.filter((m)=>activeMetrics.includes(m.key)).map((m)=><Line key={m.key} type="monotone" dataKey={m.key} name={m.label} stroke={m.color} strokeWidth={2.5} dot={{r:3}} activeDot={{r:5}} connectNulls/>)}</LineChart></ResponsiveContainer>
          </div>}

          {milkChartData.length>1&&<div className="bg-white rounded-2xl shadow p-5"><p className="text-sm font-semibold text-gray-600 mb-3">🥛 Milk yield trend (L/day)</p><ResponsiveContainer width="100%" height={160}><BarChart data={milkChartData} barSize={28}><CartesianGrid strokeDasharray="4 4" stroke="#eff6ff"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis tick={{fontSize:11}}/><Tooltip contentStyle={{borderRadius:"8px",fontSize:"12px"}}/><Bar dataKey="litres" fill="#2563eb" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>}

          <GrowthTable records={gr} onDelete={(rid)=>del("growthRecords",rid)} accentHover="hover:bg-pink-50/40"/>
        </div>
      </div>

      {/* ══ MODALS ══ */}
      {modal==="growth"&&<Modal title="Add Growth Record" onClose={()=>setModal(null)}><Field label="Date"><input type="date" value={newGrowth.date} onChange={(e)=>setNewGrowth({...newGrowth,date:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Weight (kg)"><input type="number" step="0.1" value={newGrowth.weight} onChange={(e)=>setNewGrowth({...newGrowth,weight:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="BCS"><BCSPicker value={newGrowth.bcs} onChange={(v)=>setNewGrowth({...newGrowth,bcs:v})}/></Field><Field label="Est. Price (KES)"><input type="number" value={newGrowth.price} onChange={(e)=>setNewGrowth({...newGrowth,price:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><div className="flex gap-3 pt-2"><button onClick={addGrowth} className="flex-1 bg-pink-600 text-white py-2 rounded-xl hover:bg-pink-700 font-semibold">Save</button><button onClick={()=>setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div></Modal>}
      {modal==="viewGrowth"&&<Modal title={`Growth — ${gr.length}`} onClose={()=>setModal(null)}><button onClick={()=>setModal("growth")} className="mb-4 bg-pink-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-pink-700">+ Add</button>{gr.length===0?<p className="text-gray-400 text-center py-8">No records.</p>:<div className="space-y-3">{[...gr].reverse().map((r)=><div key={r.id} className="bg-pink-50 rounded-xl p-3 flex justify-between"><div><p className="font-semibold text-pink-900 text-sm">{r.date}</p>{r.weight&&<p className="text-xs text-gray-600">⚖️ {r.weight} kg</p>}{r.bcs>0&&<BCSBadge score={r.bcs}/>}{r.price&&<p className="text-xs text-amber-700">💰 KES {parseFloat(r.price).toLocaleString()}</p>}</div><button onClick={()=>del("growthRecords",r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button></div>)}</div>}</Modal>}

      {modal==="milk"&&<Modal title="Record Milk Yield" onClose={()=>setModal(null)}>
        <Field label="Date"><input type="date" value={newMilk.date} onChange={(e)=>setNewMilk({...newMilk,date:e.target.value})} className="border rounded-lg p-2 w-full"/></Field>
        <Field label="Yield (litres)"><input type="number" step="0.1" placeholder="e.g. 2.5" value={newMilk.litres} onChange={(e)=>setNewMilk({...newMilk,litres:e.target.value})} className="border rounded-lg p-2 w-full"/></Field>
        <Field label="Time of Day"><div className="flex gap-2">{["Morning","Evening","Combined"].map((t)=><button key={t} type="button" onClick={()=>setNewMilk({...newMilk,timeOfDay:t})} className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition ${newMilk.timeOfDay===t?"bg-blue-600 text-white border-transparent":"bg-gray-50 border-gray-200 hover:border-gray-400"}`}>{t}</button>)}</div></Field>
        <Field label="Notes"><textarea value={newMilk.notes} onChange={(e)=>setNewMilk({...newMilk,notes:e.target.value})} className="border rounded-lg p-2 w-full h-14 resize-none"/></Field>
        <div className="flex gap-3 pt-2"><button onClick={addMilk} className="flex-1 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 font-semibold">Save</button><button onClick={()=>setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div>
      </Modal>}
      {modal==="viewMilk"&&<Modal title={`Milk Records — ${mr.length}`} onClose={()=>setModal(null)}><button onClick={()=>setModal("milk")} className="mb-4 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700">+ Record</button>{mr.length===0?<p className="text-gray-400 text-center py-8">No milk records.</p>:<div className="space-y-3">{[...mr].reverse().map((r)=><div key={r.id} className="bg-blue-50 rounded-xl p-3 flex justify-between"><div><p className="font-semibold text-blue-900">{r.date} · {r.timeOfDay}</p><p className="text-sm font-bold text-blue-600">🥛 {r.litres} L</p>{r.notes&&<p className="text-xs text-gray-500 italic">{r.notes}</p>}</div><button onClick={()=>del("milkRecords",r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button></div>)}</div>}</Modal>}

      {modal==="mating"&&<Modal title="Record Mating" onClose={()=>setModal(null)}>
        <Field label="Date Mated"><input type="date" value={newMating.dateMated} onChange={(e)=>setNewMating({...newMating,dateMated:e.target.value})} className="border rounded-lg p-2 w-full"/></Field>
        <Field label="Buck Used"><select value={newMating.buck} onChange={(e)=>setNewMating({...newMating,buck:e.target.value})} className="border rounded-lg p-2 w-full"><option value="">Select buck...</option>{bucks.map((b)=><option key={b.id} value={b.name}>{b.name}</option>)}<option value="Unknown">Unknown</option></select></Field>
        <Field label="Expected Kidding (150 days)"><input type="date" value={newMating.expectedKidding} onChange={(e)=>setNewMating({...newMating,expectedKidding:e.target.value})} className="border rounded-lg p-2 w-full"/></Field>
        {newMating.dateMated&&!newMating.expectedKidding&&<div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 mb-2">💡 Goat gestation is ~150 days. Suggested: {new Date(new Date(newMating.dateMated).getTime()+150*86400000).toISOString().split("T")[0]}</div>}
        <Field label="Notes"><textarea value={newMating.notes} onChange={(e)=>setNewMating({...newMating,notes:e.target.value})} className="border rounded-lg p-2 w-full h-14 resize-none"/></Field>
        <div className="flex gap-3 pt-2"><button onClick={addMating} className="flex-1 bg-violet-600 text-white py-2 rounded-xl hover:bg-violet-700 font-semibold">Save Record</button><button onClick={()=>setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div>
      </Modal>}
      {modal==="viewMating"&&<Modal title={`Mating Records — ${matr.length}`} onClose={()=>setModal(null)}><button onClick={()=>setModal("mating")} className="mb-4 bg-violet-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-violet-700">+ Add</button>{matr.length===0?<p className="text-gray-400 text-center py-8">No mating records.</p>:<div className="space-y-3">{[...matr].reverse().map((r)=><div key={r.id} className="bg-violet-50 rounded-xl p-3 flex justify-between"><div><p className="font-semibold text-violet-900">Mated: {r.dateMated}</p>{r.buck&&<p className="text-xs text-gray-600">Buck: {r.buck}</p>}{r.expectedKidding&&<p className="text-xs text-gray-600">Expected kidding: {r.expectedKidding}</p>}</div><button onClick={()=>del("matingRecords",r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button></div>)}</div>}</Modal>}

      {modal==="kidding"&&<Modal title="Record Kidding" onClose={()=>setModal(null)}>
        <Field label="Kidding Date"><input type="date" value={newKidding.date} onChange={(e)=>setNewKidding({...newKidding,date:e.target.value})} className="border rounded-lg p-2 w-full"/></Field>
        <Field label="Number of Kids Born"><div className="flex gap-2">{["1","2","3","4+"].map((n)=><button key={n} type="button" onClick={()=>setNewKidding({...newKidding,numBorn:n,type:n==="1"?"Single":n==="2"?"Twins":n==="3"?"Triplets":"Quadruplets+"})} className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition ${newKidding.numBorn===n?"bg-sky-600 text-white border-transparent":"bg-gray-50 border-gray-200 hover:border-gray-400"}`}>{n}</button>)}</div></Field>
        <Field label="Birth Type"><input value={newKidding.type} readOnly className="border rounded-lg p-2 w-full bg-gray-50 text-gray-600"/></Field>
        <Field label="Survival"><div className="flex gap-2">{["All","Some lost","All lost"].map((s)=><button key={s} type="button" onClick={()=>setNewKidding({...newKidding,survived:s})} className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition ${newKidding.survived===s?(s==="All"?"bg-green-600 text-white":s==="Some lost"?"bg-amber-500 text-white":"bg-red-600 text-white"):"bg-gray-50 border-gray-200 hover:border-gray-400"}`}>{s}</button>)}</div></Field>
        <Field label="Sire (Buck)"><select value={newKidding.buck} onChange={(e)=>setNewKidding({...newKidding,buck:e.target.value})} className="border rounded-lg p-2 w-full"><option value="">Unknown</option>{bucks.map((b)=><option key={b.id} value={b.name}>{b.name}</option>)}</select></Field>
        <Field label="Notes"><textarea value={newKidding.notes} onChange={(e)=>setNewKidding({...newKidding,notes:e.target.value})} className="border rounded-lg p-2 w-full h-14 resize-none"/></Field>
        <div className="flex gap-3 pt-2"><button onClick={addKidding} className="flex-1 bg-sky-600 text-white py-2 rounded-xl hover:bg-sky-700 font-semibold">Save Record</button><button onClick={()=>setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div>
      </Modal>}
      {modal==="viewKidding"&&<Modal title={`Kidding Records — ${kr.length}`} onClose={()=>setModal(null)}><button onClick={()=>setModal("kidding")} className="mb-4 bg-sky-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-sky-700">+ Add</button>{kr.length===0?<p className="text-gray-400 text-center py-8">No kidding records.</p>:<div className="space-y-3">{[...kr].reverse().map((r)=><div key={r.id} className="bg-sky-50 rounded-xl p-3 flex justify-between"><div><p className="font-semibold text-sky-900">{r.date}</p><p className="text-xs text-gray-600">{r.type} · {r.numBorn} born</p><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.survived==="All"?"bg-green-100 text-green-800":r.survived==="Some lost"?"bg-amber-100 text-amber-800":"bg-red-100 text-red-800"}`}>{r.survived}</span>{r.buck&&<p className="text-xs text-gray-600 mt-0.5">Sire: {r.buck}</p>}</div><button onClick={()=>del("kiddingRecords",r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button></div>)}</div>}</Modal>}

      {modal==="drench"&&<Modal title="Add Drenching Record" onClose={()=>setModal(null)}><Field label="Date"><input type="date" value={newDrench.date} onChange={(e)=>setNewDrench({...newDrench,date:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Product"><input value={newDrench.product} onChange={(e)=>setNewDrench({...newDrench,product:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Dose (mL)"><input type="number" step="0.5" value={newDrench.dose} onChange={(e)=>setNewDrench({...newDrench,dose:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Weight at Drenching"><input type="number" value={newDrench.weightAtDrenching} onChange={(e)=>setNewDrench({...newDrench,weightAtDrenching:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="FAMACHA Score"><FAMACHAPicker value={newDrench.famacha} onChange={(v)=>setNewDrench({...newDrench,famacha:v})}/></Field><Field label="Next Drench Date"><input type="date" value={newDrench.nextDate} onChange={(e)=>setNewDrench({...newDrench,nextDate:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><div className="flex gap-3 pt-2"><button onClick={addDrench} className="flex-1 bg-amber-500 text-white py-2 rounded-xl hover:bg-amber-600 font-semibold">Save</button><button onClick={()=>setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div></Modal>}
      {modal==="viewDrench"&&<Modal title={`Drenching — ${dr.length}`} onClose={()=>setModal(null)}><button onClick={()=>setModal("drench")} className="mb-4 bg-amber-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-amber-600">+ Add</button>{dr.length===0?<p className="text-gray-400 text-center py-8">No records.</p>:<div className="space-y-3">{[...dr].reverse().map((r)=><div key={r.id} className="bg-amber-50 rounded-xl p-3 flex justify-between"><div><p className="font-semibold text-amber-900">{r.product}</p><p className="text-xs text-gray-500">{r.date}{r.dose?` · ${r.dose} mL`:""}</p>{r.famacha>0&&<FAMACHABadge score={r.famacha}/>}{r.nextDate&&<p className="text-xs text-orange-600">Next: {r.nextDate}</p>}</div><button onClick={()=>del("drenchingRecords",r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button></div>)}</div>}</Modal>}
      {modal==="feed"&&<Modal title="Add Feed Record" onClose={()=>setModal(null)}><Field label="Date"><input type="date" value={newFeed.date} onChange={(e)=>setNewFeed({...newFeed,date:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Feed Type"><input placeholder="e.g. Browse, Hay, Dairy meal" value={newFeed.feedType} onChange={(e)=>setNewFeed({...newFeed,feedType:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Amount (kg)"><input type="number" value={newFeed.amount} onChange={(e)=>setNewFeed({...newFeed,amount:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Minerals/Supplements"><input value={newFeed.minerals} onChange={(e)=>setNewFeed({...newFeed,minerals:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Lactation Diet Notes"><textarea value={newFeed.lactationDiet} onChange={(e)=>setNewFeed({...newFeed,lactationDiet:e.target.value})} className="border rounded-lg p-2 w-full h-14 resize-none"/></Field><div className="flex gap-3 pt-2"><button onClick={addFeed} className="flex-1 bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 font-semibold">Save</button><button onClick={()=>setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div></Modal>}
      {modal==="viewFeed"&&<Modal title={`Feed — ${fr.length}`} onClose={()=>setModal(null)}><button onClick={()=>setModal("feed")} className="mb-4 bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700">+ Add</button>{fr.length===0?<p className="text-gray-400 text-center py-8">No records.</p>:<div className="space-y-3">{[...fr].reverse().map((r)=><div key={r.id} className="bg-green-50 rounded-xl p-3 flex justify-between"><div><p className="font-semibold text-green-900">{r.feedType}</p><p className="text-xs text-gray-500">{r.date}{r.amount?` · ${r.amount} kg`:""}</p>{r.lactationDiet&&<p className="text-xs text-blue-600 italic">Lactation: {r.lactationDiet}</p>}</div><button onClick={()=>del("feedRecords",r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button></div>)}</div>}</Modal>}
      {modal==="med"&&<Modal title="Add Medical Record" onClose={()=>setModal(null)}><Field label="Date"><input type="date" value={newMed.date} onChange={(e)=>setNewMed({...newMed,date:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Type"><select value={newMed.type} onChange={(e)=>setNewMed({...newMed,type:e.target.value})} className="border rounded-lg p-2 w-full"><option value="">Select...</option>{["Vaccination","Pregnancy Check","AI (Artificial Insemination)","Dystocia/Kidding Assistance","Mastitis Treatment","Hoof Trimming","Checkup","Treatment","Other"].map((t)=><option key={t}>{t}</option>)}</select></Field><Field label="Medicine"><input value={newMed.medicine} onChange={(e)=>setNewMed({...newMed,medicine:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Vet Name"><input value={newMed.vetName} onChange={(e)=>setNewMed({...newMed,vetName:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Cost (KES)"><input type="number" value={newMed.cost} onChange={(e)=>setNewMed({...newMed,cost:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><div className="flex gap-3 pt-2"><button onClick={addMed} className="flex-1 bg-red-600 text-white py-2 rounded-xl hover:bg-red-700 font-semibold">Save</button><button onClick={()=>setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div></Modal>}
      {modal==="viewMed"&&<Modal title={`Medical — ${ml.length}`} onClose={()=>setModal(null)}><button onClick={()=>setModal("med")} className="mb-4 bg-red-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-red-700">+ Add</button>{ml.length===0?<p className="text-gray-400 text-center py-8">No records.</p>:<div className="space-y-3">{[...ml].reverse().map((r)=><div key={r.id} className="bg-red-50 rounded-xl p-3 flex justify-between"><div><p className="font-semibold text-red-900">{r.type}</p><p className="text-xs text-gray-500">{r.date}{r.vetName?` · ${r.vetName}`:""}</p>{r.medicine&&<p className="text-xs text-gray-600">{r.medicine}</p>}</div><button onClick={()=>del("medicalLog",r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button></div>)}</div>}</Modal>}
    </div>
  );
}