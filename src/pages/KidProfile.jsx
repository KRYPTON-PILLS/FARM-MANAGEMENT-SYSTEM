import { useParams, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { FarmContext } from "../context/FarmContext";
import { Modal, Field, BCSPicker, BCSBadge, ActionCard, GrowthTable } from "../components/SheepHelpers";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function ageStr(bd) {
  if (!bd) return "—";
  const d=Math.floor((Date.now()-new Date(bd))/86400000);
  if(d<0) return "Not yet born"; if(d===0) return "Born today";
  if(d<7) return `${d} day${d!==1?"s":""}`; if(d<30) return `${Math.floor(d/7)} week${Math.floor(d/7)!==1?"s":""}`;
  return `${Math.floor(d/30)} month${Math.floor(d/30)!==1?"s":""}`;
}
function daysOld(bd) { return bd?Math.floor((Date.now()-new Date(bd))/86400000):null; }
function WeaningBar({birthDate,targetDate}) {
  if(!birthDate||!targetDate) return null;
  const pct=Math.min(100,Math.max(0,Math.round(((new Date()-new Date(birthDate))/(new Date(targetDate)-new Date(birthDate)))*100)));
  const rem=Math.ceil((new Date(targetDate)-new Date())/86400000);
  const col=pct<50?"bg-amber-400":pct<85?"bg-lime-400":"bg-green-500";
  return(<div><div className="flex justify-between text-xs text-gray-500 mb-1"><span>Progress to weaning</span><span className="font-bold">{pct}%</span></div><div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${col} rounded-full transition-all`} style={{width:`${pct}%`}}/></div><p className="text-xs text-gray-400 mt-1">{rem>0?`${rem} days left`:rem===0?"Weaning day!":`${Math.abs(rem)} days overdue`}</p></div>);
}

export default function KidProfile() {
  const {id}=useParams(); const navigate=useNavigate();
  const {animals=[],setAnimals}=useContext(FarmContext);
  const kid=animals.find((a)=>a.id?.toString()===id&&a.category==="goat"&&a.type?.toLowerCase()==="kid");
  const upd=(u)=>setAnimals((p)=>p.map((a)=>a.id?.toString()===id?u:a));
  const [isEditing,setIsEditing]=useState(false); const [edited,setEdited]=useState(null);
  const [modal,setModal]=useState(null); const [gradModal,setGradModal]=useState(false);
  const [newCol,setNewCol]=useState({timeAfterBirth:"",amount:"",source:"Dam",notes:""});
  const [newGrowth,setNewGrowth]=useState({date:"",weight:"",bcs:0,notes:""});
  const [newMilk,setNewMilk]=useState({date:"",time:"",amount:"",feedType:"Doe Milk",notes:""});
  const [newMed,setNewMed]=useState({date:"",type:"",medicine:"",vetName:"",cost:"",notes:""});

  if(!kid) return <p className="p-6 text-red-600">Kid not found.</p>;
  const gr=kid.growthRecords||[]; const mf=kid.milkFeedRecords||[]; const ml=kid.medicalLog||[];
  const dv=daysOld(kid.birthDate);
  const does=animals.filter((a)=>a.category==="goat"&&a.type?.toLowerCase()==="doe");
  const bucks=animals.filter((a)=>a.category==="goat"&&a.type?.toLowerCase()==="buck");

  const startEdit=()=>{setIsEditing(true);setEdited({...kid});}; const cancelEdit=()=>{setIsEditing(false);setEdited(null);};
  const saveEdit=()=>{upd(edited);setIsEditing(false);setEdited(null);}; const uf=(f,v)=>setEdited((p)=>({...p,[f]:v}));
  const imgUp=(e)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onloadend=()=>upd({...kid,image:r.result});r.readAsDataURL(f);};
  const saveCol=()=>{if(!newCol.timeAfterBirth)return;upd({...kid,colostrumRecord:{...newCol,savedAt:new Date().toISOString()}});setModal(null);};
  const addGrowth=()=>{if(!newGrowth.date)return;upd({...kid,growthRecords:[...gr,{...newGrowth,id:Date.now()}]});setNewGrowth({date:"",weight:"",bcs:0,notes:""});setModal("viewGrowth");};
  const addMilk=()=>{if(!newMilk.date)return;upd({...kid,milkFeedRecords:[...mf,{...newMilk,id:Date.now()}]});setNewMilk({date:"",time:"",amount:"",feedType:"Doe Milk",notes:""});setModal("viewMilk");};
  const addMed=()=>{if(!newMed.date||!newMed.type)return;upd({...kid,medicalLog:[...ml,{...newMed,id:Date.now()}]});setNewMed({date:"",type:"",medicine:"",vetName:"",cost:"",notes:""});setModal("viewMed");};
  const del=(f,rid)=>upd({...kid,[f]:(kid[f]||[]).filter((r)=>r.id!==rid)});
  const graduate=()=>{const to=kid.gender==="Male"?"buckling":"doeling";upd({...kid,type:to,graduated:true});setGradModal(false);navigate(`/animals/goats/${to==="buckling"?"bucklings":"doelings"}`);};

  const chartData=[...gr].sort((a,b)=>new Date(a.date)-new Date(b.date)).map((r)=>({date:r.date,weight:r.weight?parseFloat(r.weight):null}));
  const today=new Date().toISOString().split("T")[0];
  const todayMilk=mf.filter((r)=>r.date===today).reduce((s,r)=>s+(parseFloat(r.amount)||0),0);
  const statusColor={Healthy:"bg-green-100 text-green-800",Sick:"bg-red-100 text-red-700","Under Treatment":"bg-amber-100 text-amber-700"}[kid.status]||"bg-gray-100 text-gray-600";

  return (
    <div className="bg-amber-50 flex flex-col">
      <div className="flex items-center gap-4 px-6 py-4 bg-white shadow-sm">
        <button onClick={()=>navigate(-1)} className="bg-white shadow w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-amber-700"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg></button>
        <h2 className="text-2xl font-bold text-amber-900">Kid Profile</h2>
        <span className="text-sm text-gray-500 font-medium">{ageStr(kid.birthDate)}</span>
        <div className="ml-auto flex items-center gap-2">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor}`}>{kid.status}</span>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full text-white ${kid.gender==="Male"?"bg-sky-500":"bg-rose-500"}`}>{kid.gender||"Unknown"}</span>
          {!kid.graduated&&dv>=90&&<button onClick={()=>setGradModal(true)} className="text-xs font-semibold px-3 py-1 rounded-full bg-green-600 text-white hover:bg-green-700 transition">Graduate →</button>}
        </div>
      </div>
      {dv!==null&&dv<=2&&!kid.colostrumRecord&&<div className="bg-red-600 text-white text-center text-sm font-semibold py-2">🚨 Colostrum must be given within 24 hours of birth!</div>}
      <div className="flex flex-1 gap-6 p-6 flex-wrap lg:flex-nowrap">
        {/* LEFT */}
        <div className="flex flex-col gap-4 w-72 shrink-0">
          <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg bg-gray-100 group">
            {kid.image?<img src={kid.image} alt={kid.name} className="w-full h-full object-cover"/>:<div className="flex items-center justify-center h-full text-gray-400 text-sm">No image</div>}
            <label className="absolute inset-0 flex items-end justify-center pb-4 bg-black/0 group-hover:bg-black/30 transition cursor-pointer"><span className="opacity-0 group-hover:opacity-100 bg-white/90 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full transition">Change photo</span><input type="file" accept="image/*" className="hidden" onChange={imgUp}/></label>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-sm space-y-2">
            <p className="font-semibold text-gray-500 text-xs uppercase mb-1">Birth Info</p>
            {[{l:"Birth date",f:"birthDate",t:"date"},{l:"Birth weight",f:"birthWeight",s:" kg"},{l:"Breed",f:"breed"},{l:"Color",f:"color"}].map(({l,f,s="",t="text"})=>(
              <div key={f} className="flex justify-between items-center border-b last:border-0 pb-1 last:pb-0">
                <span className="text-gray-500">{l}</span>
                {isEditing?<input type={t} value={edited[f]||""} onChange={(e)=>uf(f,e.target.value)} className="border rounded px-2 py-0.5 w-32 text-right text-sm"/>:<span className="text-amber-900 font-semibold">{kid[f]?`${kid[f]}${s}`:<span className="text-gray-300">—</span>}</span>}
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-sm">
            <p className="font-semibold text-gray-500 text-xs uppercase mb-2">Lineage</p>
            {["dam","sire"].map((field)=>(
              <div key={field} className="flex justify-between items-center border-b last:border-0 pb-1 last:pb-0">
                <span className="text-gray-500 capitalize">{field}</span>
                {isEditing?<select value={edited[field]||""} onChange={(e)=>uf(field,e.target.value)} className="border rounded px-2 py-0.5 w-36 text-sm"><option value="">Unknown</option>{(field==="dam"?does:bucks).map((a)=><option key={a.id} value={a.name}>{a.name}</option>)}</select>:<span className="text-amber-900 font-semibold">{kid[field]||<span className="text-gray-300">—</span>}</span>}
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-sm">
            <p className="font-semibold text-gray-500 text-xs uppercase mb-2">Colostrum</p>
            {kid.colostrumRecord?(
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs"><p className="font-bold text-green-800 mb-1">✅ Recorded</p><p className="text-gray-600">Time: {kid.colostrumRecord.timeAfterBirth} hrs · Amount: {kid.colostrumRecord.amount} mL</p><p className="text-gray-600">Source: {kid.colostrumRecord.source}</p></div>
            ):(
              <div className={`border rounded-xl p-3 text-xs ${dv!==null&&dv<=3?"bg-red-50 border-red-300":"bg-amber-50 border-amber-200"}`}>
                <p className={`font-semibold mb-2 ${dv!==null&&dv<=3?"text-red-700":"text-amber-700"}`}>{dv!==null&&dv<=3?"⚠️ Critical — not yet recorded":"Not recorded"}</p>
                <button onClick={()=>setModal("colostrum")} className={`w-full py-1.5 rounded-lg font-semibold text-white text-xs ${dv!==null&&dv<=3?"bg-red-600 hover:bg-red-700":"bg-amber-500 hover:bg-amber-600"}`}>Record now</button>
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-sm">
            <p className="font-semibold text-gray-500 text-xs uppercase mb-2">Weaning Plan</p>
            {isEditing?<div className="flex justify-between items-center"><span className="text-gray-500 text-xs">Target date</span><input type="date" value={edited.weaningTargetDate||""} onChange={(e)=>uf("weaningTargetDate",e.target.value)} className="border rounded px-2 py-0.5 text-sm"/></div>:<WeaningBar birthDate={kid.birthDate} targetDate={kid.weaningTargetDate}/>}
            {!isEditing&&!kid.weaningTargetDate&&<p className="text-gray-300 text-xs">Set a weaning date in Edit Profile</p>}
          </div>
        </div>
        {/* RIGHT */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1"><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Name</p>{isEditing?<input value={edited.name||""} onChange={(e)=>uf("name",e.target.value)} className="text-2xl font-bold border-b border-amber-400 outline-none w-full"/>:<h3 className="text-2xl font-bold text-amber-900">{kid.name}</h3>}</div>
              {!isEditing?<button onClick={startEdit} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-amber-600 transition">Edit Profile</button>:<div className="flex gap-2"><button onClick={saveEdit} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm">Save</button><button onClick={cancelEdit} className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm">Cancel</button></div>}
            </div>
            {isEditing&&<div className="mt-4 flex gap-4 flex-wrap">
              <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Status</p><select value={edited.status||""} onChange={(e)=>uf("status",e.target.value)} className="border rounded-lg px-3 py-2 text-sm">{["Healthy","Sick","Under Treatment"].map((s)=><option key={s}>{s}</option>)}</select></div>
              <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Gender</p><select value={edited.gender||""} onChange={(e)=>uf("gender",e.target.value)} className="border rounded-lg px-3 py-2 text-sm">{["Female","Male"].map((g)=><option key={g}>{g}</option>)}</select></div>
            </div>}
          </div>
          {mf.length>0&&<div className="bg-amber-100 rounded-2xl p-4 flex items-center justify-between"><div><p className="text-xs font-semibold text-amber-700 uppercase">Today's milk intake</p><p className="text-2xl font-bold text-amber-900">{todayMilk>0?`${todayMilk} mL`:"Not fed yet today"}</p></div><div className="text-4xl">🍼</div></div>}
          <div className="grid grid-cols-3 gap-4">
            <ActionCard title="Growth Records" count={gr.length} accent="amber" latest={gr.length>0?`${gr.at(-1).weight||"—"} kg`:null} latestDate={gr.at(-1)?.date} onAdd={()=>setModal("growth")} onView={()=>setModal("viewGrowth")} iconPath="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/>
            <ActionCard title="Milk Feedings" count={mf.length} accent="green" latest={mf.length>0?`${mf.at(-1).amount||"—"} mL`:null} latestDate={mf.at(-1)?.date} onAdd={()=>setModal("milk")} onView={()=>setModal("viewMilk")} iconPath="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.575 1.399A1.5 1.5 0 0117 17.58v.82A2.25 2.25 0 0114.75 20.625H9.25A2.25 2.25 0 017 18.4v-.82a1.5 1.5 0 01-.225-1.181L5 14.5m14.8.5l-5.8-4.5M5 14.5l5.8-4.5"/>
            <ActionCard title="Medical Log" count={ml.length} accent="red" latest={ml.length>0?ml.at(-1).type:null} latestDate={ml.at(-1)?.date} onAdd={()=>setModal("med")} onView={()=>setModal("viewMed")} iconPath="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/>
          </div>
          {chartData.length>0&&<div className="bg-white rounded-2xl shadow p-5"><p className="text-sm font-semibold text-gray-600 mb-3">Weight gain (kg)</p><ResponsiveContainer width="100%" height={180}><LineChart data={chartData}><CartesianGrid strokeDasharray="4 4" stroke="#fef9c3"/><XAxis dataKey="date" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip contentStyle={{borderRadius:"8px",fontSize:"12px"}}/><Line type="monotone" dataKey="weight" stroke="#d97706" strokeWidth={2.5} dot={{r:4}} activeDot={{r:6}} connectNulls/></LineChart></ResponsiveContainer></div>}
          <GrowthTable records={gr} onDelete={(rid)=>del("growthRecords",rid)} accentHover="hover:bg-amber-50/40"/>
        </div>
      </div>
      {/* MODALS */}
      {modal==="colostrum"&&<Modal title="Record Colostrum Feeding" onClose={()=>setModal(null)}><div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800">🍼 Colostrum is critical in the first 6 hours — provides passive immunity to the kid.</div><Field label="Hours after birth"><input type="number" step="0.5" placeholder="e.g. 1.5" value={newCol.timeAfterBirth} onChange={(e)=>setNewCol({...newCol,timeAfterBirth:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Amount (mL)"><input type="number" placeholder="e.g. 150" value={newCol.amount} onChange={(e)=>setNewCol({...newCol,amount:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Source"><div className="flex gap-2 flex-wrap">{["Dam","Donor Doe","Frozen","Artificial"].map((s)=><button key={s} type="button" onClick={()=>setNewCol({...newCol,source:s})} className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition ${newCol.source===s?"bg-amber-500 text-white border-transparent":"bg-gray-50 border-gray-200 hover:border-gray-400"}`}>{s}</button>)}</div></Field><Field label="Notes"><textarea value={newCol.notes} onChange={(e)=>setNewCol({...newCol,notes:e.target.value})} className="border rounded-lg p-2 w-full h-14 resize-none"/></Field><div className="flex gap-3 pt-2"><button onClick={saveCol} className="flex-1 bg-amber-500 text-white py-2 rounded-xl hover:bg-amber-600 font-semibold">Save</button><button onClick={()=>setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div></Modal>}
      {modal==="growth"&&<Modal title="Add Growth Record" onClose={()=>setModal(null)}><Field label="Date"><input type="date" value={newGrowth.date} onChange={(e)=>setNewGrowth({...newGrowth,date:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Weight (kg)"><input type="number" step="0.1" placeholder="e.g. 5.5" value={newGrowth.weight} onChange={(e)=>setNewGrowth({...newGrowth,weight:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="BCS"><BCSPicker value={newGrowth.bcs} onChange={(v)=>setNewGrowth({...newGrowth,bcs:v})}/></Field><Field label="Notes"><textarea value={newGrowth.notes} onChange={(e)=>setNewGrowth({...newGrowth,notes:e.target.value})} className="border rounded-lg p-2 w-full h-14 resize-none"/></Field><div className="flex gap-3 pt-2"><button onClick={addGrowth} className="flex-1 bg-amber-500 text-white py-2 rounded-xl hover:bg-amber-600 font-semibold">Save</button><button onClick={()=>setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div></Modal>}
      {modal==="viewGrowth"&&<Modal title={`Growth — ${gr.length} records`} onClose={()=>setModal(null)}><button onClick={()=>setModal("growth")} className="mb-4 bg-amber-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-amber-600">+ Add</button>{gr.length===0?<p className="text-gray-400 text-center py-8">No records yet.</p>:<div className="space-y-3">{[...gr].reverse().map((r)=><div key={r.id} className="bg-amber-50 rounded-xl p-3 flex justify-between"><div><p className="font-semibold text-amber-900 text-sm">{r.date}</p>{r.weight&&<p className="text-xs text-gray-600">⚖️ {r.weight} kg</p>}{r.bcs>0&&<BCSBadge score={r.bcs}/>}{r.notes&&<p className="text-xs text-gray-500 italic">{r.notes}</p>}</div><button onClick={()=>del("growthRecords",r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button></div>)}</div>}</Modal>}
      {modal==="milk"&&<Modal title="Record Milk Feeding" onClose={()=>setModal(null)}><Field label="Date"><input type="date" value={newMilk.date} onChange={(e)=>setNewMilk({...newMilk,date:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Time"><input type="time" value={newMilk.time} onChange={(e)=>setNewMilk({...newMilk,time:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Amount (mL)"><input type="number" placeholder="e.g. 150" value={newMilk.amount} onChange={(e)=>setNewMilk({...newMilk,amount:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Feed Type"><div className="flex flex-wrap gap-2">{["Doe Milk","Milk Replacer","Starter Pellets","Mixed"].map((t)=><button key={t} type="button" onClick={()=>setNewMilk({...newMilk,feedType:t})} className={`px-3 py-2 rounded-xl border text-xs font-semibold transition ${newMilk.feedType===t?"bg-green-600 text-white border-transparent":"bg-gray-50 border-gray-200 hover:border-gray-400"}`}>{t}</button>)}</div></Field><div className="flex gap-3 pt-2"><button onClick={addMilk} className="flex-1 bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 font-semibold">Save</button><button onClick={()=>setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div></Modal>}
      {modal==="viewMilk"&&<Modal title={`Milk Feedings — ${mf.length}`} onClose={()=>setModal(null)}><button onClick={()=>setModal("milk")} className="mb-4 bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700">+ Record</button>{mf.length===0?<p className="text-gray-400 text-center py-8">No feedings yet.</p>:<div className="space-y-3">{[...mf].reverse().map((r)=><div key={r.id} className="bg-green-50 rounded-xl p-3 flex justify-between"><div><p className="font-semibold text-green-900">{r.date}{r.time?` at ${r.time}`:""}</p><p className="text-xs text-gray-600">{r.feedType}{r.amount?` · ${r.amount} mL`:""}</p></div><button onClick={()=>del("milkFeedRecords",r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button></div>)}</div>}</Modal>}
      {modal==="med"&&<Modal title="Add Medical Record" onClose={()=>setModal(null)}><Field label="Date"><input type="date" value={newMed.date} onChange={(e)=>setNewMed({...newMed,date:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Type"><select value={newMed.type} onChange={(e)=>setNewMed({...newMed,type:e.target.value})} className="border rounded-lg p-2 w-full"><option value="">Select...</option>{["Vaccination","Drenching","Navel Dressing","Vitamin Injection","Checkup","Treatment","Other"].map((t)=><option key={t}>{t}</option>)}</select></Field><Field label="Medicine/Product"><input value={newMed.medicine} onChange={(e)=>setNewMed({...newMed,medicine:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Vet Name"><input value={newMed.vetName} onChange={(e)=>setNewMed({...newMed,vetName:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Cost (KES)"><input type="number" value={newMed.cost} onChange={(e)=>setNewMed({...newMed,cost:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Notes"><textarea value={newMed.notes} onChange={(e)=>setNewMed({...newMed,notes:e.target.value})} className="border rounded-lg p-2 w-full h-14 resize-none"/></Field><div className="flex gap-3 pt-2"><button onClick={addMed} className="flex-1 bg-red-600 text-white py-2 rounded-xl hover:bg-red-700 font-semibold">Save</button><button onClick={()=>setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div></Modal>}
      {modal==="viewMed"&&<Modal title={`Medical — ${ml.length}`} onClose={()=>setModal(null)}><button onClick={()=>setModal("med")} className="mb-4 bg-red-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-red-700">+ Add</button>{ml.length===0?<p className="text-gray-400 text-center py-8">No records.</p>:<div className="space-y-3">{[...ml].reverse().map((r)=><div key={r.id} className="bg-red-50 rounded-xl p-3 flex justify-between"><div><p className="font-semibold text-red-900">{r.type}</p><p className="text-xs text-gray-500">{r.date}{r.vetName?` · ${r.vetName}`:""}</p>{r.medicine&&<p className="text-xs text-gray-600">{r.medicine}</p>}</div><button onClick={()=>del("medicalLog",r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button></div>)}</div>}</Modal>}
      {gradModal&&<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"><h3 className="text-lg font-bold text-green-900 mb-2">Graduate {kid.name}?</h3><p className="text-sm text-gray-600 mb-3">Move to <strong>{kid.gender==="Male"?"Bucklings":"Doelings"}</strong>. All records kept.</p><div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800 mb-4">{kid.gender==="Male"?"♂ Male → Bucklings (3–12 months)":"♀ Female → Doelings (3–12 months)"}</div><div className="flex gap-3"><button onClick={graduate} className="flex-1 bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 font-semibold">Confirm</button><button onClick={()=>setGradModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div></div></div>}
    </div>
  );
}