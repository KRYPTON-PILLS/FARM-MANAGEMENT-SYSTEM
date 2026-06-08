import { useParams, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { FarmContext } from "../context/FarmContext";
import { Modal, Field, BCSPicker, BCSBadge, ActionCard, GrowthTable } from "../components/SheepHelpers";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const MATURITY = ["Weaning","Growing","Near Maturity","Ready"];
const M_COLORS = { Weaning:"bg-gray-400", Growing:"bg-amber-500", "Near Maturity":"bg-sky-500", Ready:"bg-green-600" };

function MaturityBar({ current, target }) {
  if (!current||!target) return null;
  const pct=Math.min(100,Math.round((parseFloat(current)/parseFloat(target))*100));
  const col=pct<50?"bg-amber-400":pct<80?"bg-sky-500":"bg-green-500";
  return (<div><div className="flex justify-between text-xs text-gray-500 mb-1"><span>Progress to maturity</span><span className="font-bold">{pct}%</span></div><div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${col} rounded-full transition-all`} style={{width:`${pct}%`}}/></div><div className="flex justify-between text-xs text-gray-400 mt-1"><span>{current} kg current</span><span>{target} kg target</span></div></div>);
}

export default function RamLambProfile() {
  const { id }=useParams(); const navigate=useNavigate();
  const { animals=[], setAnimals }=useContext(FarmContext);
  const rml=animals.find((a)=>a.id?.toString()===id&&a.category==="sheep"&&a.type?.toLowerCase()==="ram-lamb");
  const upd=(u)=>setAnimals((p)=>p.map((a)=>a.id?.toString()===id?u:a));

  const [isEditing,setIsEditing]=useState(false); const [edited,setEdited]=useState(null);
  const [modal,setModal]=useState(null); const [gradModal,setGradModal]=useState(false);
  const [newGrowth,setNewGrowth]=useState({date:"",weight:"",bcs:0,price:"",notes:""});
  const [newFeed,setNewFeed]=useState({date:"",feedType:"",amount:"",minerals:"",notes:""});
  const [newMed,setNewMed]=useState({date:"",type:"",medicine:"",vetName:"",cost:"",notes:""});
  const [newDrench,setNewDrench]=useState({date:"",product:"",dose:"",famacha:0,weightAtDrenching:"",nextDate:"",notes:""});

  if (!rml) return <p className="p-6 text-red-600">Ram lamb not found.</p>;
  const gr=rml.growthRecords||[]; const fr=rml.feedRecords||[]; const ml=rml.medicalLog||[]; const dr=rml.drenchingRecords||[];
  const ewes=animals.filter((a)=>a.category==="sheep"&&a.type?.toLowerCase()==="ewe");
  const rams=animals.filter((a)=>a.category==="sheep"&&a.type?.toLowerCase()==="ram");

  const startEdit=()=>{setIsEditing(true);setEdited({...rml});}; const cancelEdit=()=>{setIsEditing(false);setEdited(null);};
  const saveEdit=()=>{upd(edited);setIsEditing(false);setEdited(null);}; const uf=(f,v)=>setEdited((p)=>({...p,[f]:v}));
  const imgUp=(e)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onloadend=()=>upd({...rml,image:r.result}); r.readAsDataURL(f); };

  const addGrowth=()=>{ if(!newGrowth.date) return; upd({...rml,growthRecords:[...gr,{...newGrowth,id:Date.now()}]}); setNewGrowth({date:"",weight:"",bcs:0,price:"",notes:""}); setModal("viewGrowth"); };
  const addFeed=()=>{ if(!newFeed.date||!newFeed.feedType) return; upd({...rml,feedRecords:[...fr,{...newFeed,id:Date.now()}]}); setNewFeed({date:"",feedType:"",amount:"",minerals:"",notes:""}); setModal("viewFeed"); };
  const addMed=()=>{ if(!newMed.date||!newMed.type) return; upd({...rml,medicalLog:[...ml,{...newMed,id:Date.now()}]}); setNewMed({date:"",type:"",medicine:"",vetName:"",cost:"",notes:""}); setModal("viewMed"); };
  const addDrench=()=>{ if(!newDrench.date||!newDrench.product) return; upd({...rml,drenchingRecords:[...dr,{...newDrench,id:Date.now()}]}); setNewDrench({date:"",product:"",dose:"",famacha:0,weightAtDrenching:"",nextDate:"",notes:""}); setModal("viewDrench"); };
  const del=(field,rid)=>upd({...rml,[field]:rml[field].filter((r)=>r.id!==rid)});
  const graduate=()=>{ upd({...rml,type:"ram",graduated:true,age:rml.age?String((parseFloat(rml.age)/12).toFixed(1)):rml.age,growthRecords:gr,feedRecords:fr,medicalLog:ml,drenchingRecords:dr,woolRecords:[],breedingRecords:[]}); setGradModal(false); navigate("/animals/sheep/rams"); };

  const chartData=[...gr].sort((a,b)=>new Date(a.date)-new Date(b.date)).map((r)=>({date:r.date,weight:r.weight?parseFloat(r.weight):null}));
  const mColor=M_COLORS[rml.maturityStatus]||"bg-gray-400";
  const statusColor={Healthy:"bg-green-100 text-green-800",Sick:"bg-red-100 text-red-700","Under Treatment":"bg-amber-100 text-amber-700"}[rml.status]||"bg-gray-100 text-gray-600";
  const ageMonths=parseFloat(rml.age)||0;

  return (
    <div className="bg-sky-50 flex flex-col">
      <div className="flex items-center gap-4 px-6 py-4 bg-white shadow-sm">
        <button onClick={()=>navigate(-1)} className="bg-white shadow w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-sky-700"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg></button>
        <h2 className="text-2xl font-bold text-sky-900">Ram Lamb Profile</h2>
        <div className="ml-auto flex items-center gap-2">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor}`}>{rml.status}</span>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full text-white ${mColor}`}>{rml.maturityStatus||"Growing"}</span>
          {!rml.graduated&&ageMonths>=12&&<button onClick={()=>setGradModal(true)} className="text-xs font-semibold px-3 py-1 rounded-full bg-green-600 text-white hover:bg-green-700 transition">Graduate → Ram</button>}
        </div>
      </div>

      <div className="flex flex-1 gap-6 p-6 flex-wrap lg:flex-nowrap">
        {/* LEFT */}
        <div className="flex flex-col gap-4 w-72 shrink-0">
          <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg bg-gray-100 group">
            {rml.image?<img src={rml.image} alt={rml.name} className="w-full h-full object-cover"/>:<div className="flex items-center justify-center h-full text-gray-400 text-sm">No image</div>}
            <label className="absolute inset-0 flex items-end justify-center pb-4 bg-black/0 group-hover:bg-black/30 transition cursor-pointer"><span className="opacity-0 group-hover:opacity-100 bg-white/90 text-sky-800 text-xs font-semibold px-3 py-1 rounded-full transition">Change photo</span><input type="file" accept="image/*" className="hidden" onChange={imgUp}/></label>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-sm space-y-2">
            {[{l:"Breed",f:"breed"},{l:"Color",f:"color"},{l:"Weight",f:"weight",s:" kg"},{l:"Age",f:"age",s:" mo"}].map(({l,f,s=""})=>(<div key={f} className="flex justify-between items-center border-b last:border-0 pb-1 last:pb-0"><span className="text-gray-500">{l}</span>{isEditing?<input value={edited[f]||""} onChange={(e)=>uf(f,e.target.value)} className="border rounded px-2 py-0.5 w-28 text-right text-sm"/>:<span className="text-sky-900 font-semibold">{rml[f]?`${rml[f]}${s}`:<span className="text-gray-300">—</span>}</span>}</div>))}
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-sm">
            <p className="font-semibold text-gray-500 text-xs uppercase mb-2">Lineage</p>
            {["dam","sire"].map((field)=>(<div key={field} className="flex justify-between items-center border-b last:border-0 pb-1 last:pb-0"><span className="text-gray-500 capitalize">{field}</span>{isEditing?<select value={edited[field]||""} onChange={(e)=>uf(field,e.target.value)} className="border rounded px-2 py-0.5 w-36 text-sm"><option value="">Unknown</option>{(field==="dam"?ewes:rams).map((a)=><option key={a.id} value={a.name}>{a.name}</option>)}</select>:<span className="text-sky-900 font-semibold">{rml[field]||<span className="text-gray-300">—</span>}</span>}</div>))}
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-sm">
            <p className="font-semibold text-gray-500 text-xs uppercase mb-2">Maturity Progress</p>
            {isEditing?<div className="flex justify-between items-center"><span className="text-gray-500 text-xs">Target weight (kg)</span><input type="number" value={edited.targetWeight||""} onChange={(e)=>uf("targetWeight",e.target.value)} className="border rounded px-2 py-0.5 w-24 text-sm"/></div>:<MaturityBar current={rml.weight} target={rml.targetWeight}/>}
            {!isEditing&&!rml.targetWeight&&<p className="text-gray-300 text-xs">Set target weight in Edit Profile</p>}
          </div>
          {dr.length>0&&dr.at(-1).nextDate&&<div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-sm"><p className="font-semibold text-orange-700 text-xs uppercase mb-1">Next Drench Due</p><p className="font-bold text-orange-900">{dr.at(-1).nextDate}</p></div>}
        </div>

        {/* RIGHT */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1"><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Name</p>{isEditing?<input value={edited.name||""} onChange={(e)=>uf("name",e.target.value)} className="text-2xl font-bold border-b border-sky-400 outline-none w-full"/>:<h3 className="text-2xl font-bold text-sky-900">{rml.name}</h3>}</div>
              {!isEditing?<button onClick={startEdit} className="bg-sky-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-sky-700 transition">Edit Profile</button>:<div className="flex gap-2"><button onClick={saveEdit} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm">Save</button><button onClick={cancelEdit} className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm">Cancel</button></div>}
            </div>
            {isEditing&&<div className="mt-4 flex gap-4 flex-wrap">
              <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Status</p><select value={edited.status||""} onChange={(e)=>uf("status",e.target.value)} className="border rounded-lg px-3 py-2 text-sm">{["Healthy","Sick","Under Treatment"].map((s)=><option key={s}>{s}</option>)}</select></div>
              <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Maturity</p><select value={edited.maturityStatus||""} onChange={(e)=>uf("maturityStatus",e.target.value)} className="border rounded-lg px-3 py-2 text-sm">{MATURITY.map((s)=><option key={s}>{s}</option>)}</select></div>
            </div>}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionCard title="Growth" count={gr.length} accent="sky" latest={gr.length>0?`${gr.at(-1).weight||"—"} kg`:null} latestDate={gr.at(-1)?.date} onAdd={()=>setModal("growth")} onView={()=>setModal("viewGrowth")} iconPath="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/>
            <ActionCard title="Drenching" count={dr.length} accent="amber" latest={dr.length>0?dr.at(-1).product:null} latestDate={dr.at(-1)?.date} onAdd={()=>setModal("drench")} onView={()=>setModal("viewDrench")} iconPath="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8.293 10.5h7.414M15 12.75a3 3 0 11-6 0 3 3 0 016 0z"/>
            <ActionCard title="Feed" count={fr.length} accent="green" latest={fr.length>0?fr.at(-1).feedType:null} latestDate={fr.at(-1)?.date} onAdd={()=>setModal("feed")} onView={()=>setModal("viewFeed")} iconPath="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>
            <ActionCard title="Medical" count={ml.length} accent="red" latest={ml.length>0?ml.at(-1).type:null} latestDate={ml.at(-1)?.date} onAdd={()=>setModal("med")} onView={()=>setModal("viewMed")} iconPath="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/>
          </div>

          {chartData.length>0&&<div className="bg-white rounded-2xl shadow p-5"><p className="text-sm font-semibold text-gray-600 mb-3">Weight growth (kg)</p><ResponsiveContainer width="100%" height={180}><LineChart data={chartData}><CartesianGrid strokeDasharray="4 4" stroke="#f0f9ff"/><XAxis dataKey="date" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip contentStyle={{borderRadius:"8px",fontSize:"12px"}}/><Line type="monotone" dataKey="weight" stroke="#0284c7" strokeWidth={2.5} dot={{r:4}} activeDot={{r:6}} connectNulls/></LineChart></ResponsiveContainer></div>}
          <GrowthTable records={gr} onDelete={(rid)=>del("growthRecords",rid)} accentHover="hover:bg-sky-50/40"/>
        </div>
      </div>

      {modal==="growth"&&<Modal title="Add Growth Record" onClose={()=>setModal(null)}><Field label="Date"><input type="date" value={newGrowth.date} onChange={(e)=>setNewGrowth({...newGrowth,date:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Weight (kg)"><input type="number" step="0.1" value={newGrowth.weight} onChange={(e)=>setNewGrowth({...newGrowth,weight:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="BCS"><BCSPicker value={newGrowth.bcs} onChange={(v)=>setNewGrowth({...newGrowth,bcs:v})}/></Field><Field label="Est. Price (KES)"><input type="number" value={newGrowth.price} onChange={(e)=>setNewGrowth({...newGrowth,price:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><div className="flex gap-3 pt-2"><button onClick={addGrowth} className="flex-1 bg-sky-600 text-white py-2 rounded-xl hover:bg-sky-700 font-semibold">Save</button><button onClick={()=>setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div></Modal>}
      {modal==="viewGrowth"&&<Modal title={`Growth — ${gr.length}`} onClose={()=>setModal(null)}><button onClick={()=>setModal("growth")} className="mb-4 bg-sky-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-sky-700">+ Add</button>{gr.length===0?<p className="text-gray-400 text-center py-8">No records.</p>:<div className="space-y-3">{[...gr].reverse().map((r)=><div key={r.id} className="bg-sky-50 rounded-xl p-3 flex justify-between"><div><p className="font-semibold text-sky-900 text-sm">{r.date}</p>{r.weight&&<p className="text-xs text-gray-600">⚖️ {r.weight} kg</p>}{r.bcs>0&&<BCSBadge score={r.bcs}/>}</div><button onClick={()=>del("growthRecords",r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button></div>)}</div>}</Modal>}
      {modal==="drench"&&<Modal title="Add Drenching Record" onClose={()=>setModal(null)}><Field label="Date"><input type="date" value={newDrench.date} onChange={(e)=>setNewDrench({...newDrench,date:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Product"><input value={newDrench.product} onChange={(e)=>setNewDrench({...newDrench,product:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Dose (mL)"><input type="number" value={newDrench.dose} onChange={(e)=>setNewDrench({...newDrench,dose:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Weight at Drenching"><input type="number" value={newDrench.weightAtDrenching} onChange={(e)=>setNewDrench({...newDrench,weightAtDrenching:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="FAMACHA Score"><FAMACHAPicker value={newDrench.famacha} onChange={(v)=>setNewDrench({...newDrench,famacha:v})}/></Field><Field label="Next Drench"><input type="date" value={newDrench.nextDate} onChange={(e)=>setNewDrench({...newDrench,nextDate:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><div className="flex gap-3 pt-2"><button onClick={addDrench} className="flex-1 bg-amber-500 text-white py-2 rounded-xl hover:bg-amber-600 font-semibold">Save</button><button onClick={()=>setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div></Modal>}
      {modal==="viewDrench"&&<Modal title={`Drenching — ${dr.length}`} onClose={()=>setModal(null)}><button onClick={()=>setModal("drench")} className="mb-4 bg-amber-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-amber-600">+ Add</button>{dr.length===0?<p className="text-gray-400 text-center py-8">No records.</p>:<div className="space-y-3">{[...dr].reverse().map((r)=><div key={r.id} className="bg-amber-50 rounded-xl p-3 flex justify-between"><div><p className="font-semibold text-amber-900">{r.product}</p><p className="text-xs text-gray-500">{r.date}{r.dose?` · ${r.dose} mL`:""}</p>{r.famacha>0&&<FAMACHABadge score={r.famacha}/>}{r.nextDate&&<p className="text-xs text-orange-600">Next: {r.nextDate}</p>}</div><button onClick={()=>del("drenchingRecords",r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button></div>)}</div>}</Modal>}
      {modal==="feed"&&<Modal title="Add Feed Record" onClose={()=>setModal(null)}><Field label="Date"><input type="date" value={newFeed.date} onChange={(e)=>setNewFeed({...newFeed,date:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Feed Type"><input value={newFeed.feedType} onChange={(e)=>setNewFeed({...newFeed,feedType:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Amount (kg)"><input type="number" value={newFeed.amount} onChange={(e)=>setNewFeed({...newFeed,amount:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><div className="flex gap-3 pt-2"><button onClick={addFeed} className="flex-1 bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 font-semibold">Save</button><button onClick={()=>setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div></Modal>}
      {modal==="viewFeed"&&<Modal title={`Feed — ${fr.length}`} onClose={()=>setModal(null)}><button onClick={()=>setModal("feed")} className="mb-4 bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700">+ Add</button>{fr.length===0?<p className="text-gray-400 text-center py-8">No records.</p>:<div className="space-y-3">{[...fr].reverse().map((r)=><div key={r.id} className="bg-green-50 rounded-xl p-3 flex justify-between"><div><p className="font-semibold text-green-900">{r.feedType}</p><p className="text-xs text-gray-500">{r.date}</p></div><button onClick={()=>del("feedRecords",r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button></div>)}</div>}</Modal>}
      {modal==="med"&&<Modal title="Add Medical Record" onClose={()=>setModal(null)}><Field label="Date"><input type="date" value={newMed.date} onChange={(e)=>setNewMed({...newMed,date:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Type"><select value={newMed.type} onChange={(e)=>setNewMed({...newMed,type:e.target.value})} className="border rounded-lg p-2 w-full"><option value="">Select...</option>{["Vaccination","Foot Rot Treatment","Checkup","Treatment","Other"].map((t)=><option key={t}>{t}</option>)}</select></Field><Field label="Medicine"><input value={newMed.medicine} onChange={(e)=>setNewMed({...newMed,medicine:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Cost (KES)"><input type="number" value={newMed.cost} onChange={(e)=>setNewMed({...newMed,cost:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><div className="flex gap-3 pt-2"><button onClick={addMed} className="flex-1 bg-red-600 text-white py-2 rounded-xl hover:bg-red-700 font-semibold">Save</button><button onClick={()=>setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div></Modal>}
      {modal==="viewMed"&&<Modal title={`Medical — ${ml.length}`} onClose={()=>setModal(null)}><button onClick={()=>setModal("med")} className="mb-4 bg-red-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-red-700">+ Add</button>{ml.length===0?<p className="text-gray-400 text-center py-8">No records.</p>:<div className="space-y-3">{[...ml].reverse().map((r)=><div key={r.id} className="bg-red-50 rounded-xl p-3 flex justify-between"><div><p className="font-semibold text-red-900">{r.type}</p><p className="text-xs text-gray-500">{r.date}</p></div><button onClick={()=>del("medicalLog",r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button></div>)}</div>}</Modal>}
      {gradModal&&<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"><h3 className="text-lg font-bold text-green-900 mb-2">Graduate {rml.name} to Ram?</h3><p className="text-sm text-gray-600 mb-4">All records will be carried across to the Rams section.</p><div className="flex gap-3"><button onClick={graduate} className="flex-1 bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 font-semibold">Confirm</button><button onClick={()=>setGradModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div></div></div>}
    </div>
  );
}