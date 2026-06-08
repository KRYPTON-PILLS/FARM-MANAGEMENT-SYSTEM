import { useParams, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { FarmContext } from "../context/FarmContext";
import { Modal, Field, BCSPicker, BCSBadge, FAMACHAPicker, FAMACHABadge, ActionCard, GrowthTable } from "../components/SheepHelpers";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";

const WOOL_GRADES = ["Fine (18–22 micron)","Medium Fine (23–26 micron)","Medium (27–30 micron)","Strong (31–35 micron)","Very Strong (36+ micron)"];

export default function RamsProfile() {
  const { id } = useParams(); const navigate = useNavigate();
  const { animals=[], setAnimals } = useContext(FarmContext);
  const ram = animals.find((a)=>a.id?.toString()===id&&a.category==="sheep"&&a.type?.toLowerCase()==="ram");
  const upd = (u)=>setAnimals((p)=>p.map((a)=>a.id?.toString()===id?u:a));

  const [isEditing,setIsEditing]=useState(false); const [edited,setEdited]=useState(null);
  const [modal,setModal]=useState(null);
  const [newGrowth,setNewGrowth]=useState({date:"",weight:"",bcs:0,price:"",notes:""});
  const [newFeed,setNewFeed]=useState({date:"",feedType:"",amount:"",minerals:"",notes:""});
  const [newMed,setNewMed]=useState({date:"",type:"",medicine:"",vetName:"",cost:"",notes:""});
  const [newDrench,setNewDrench]=useState({date:"",product:"",dose:"",famacha:0,weightAtDrenching:"",nextDate:"",notes:""});
  const [newWool,setNewWool]=useState({date:"",fleeceWeight:"",stapleLengthCm:"",grade:"",pricePerKg:"",notes:""});
  const [newBreeding,setNewBreeding]=useState({season:"",ewesServed:"",startDate:"",endDate:"",conceptionRate:"",notes:""});

  if (!ram) return <p className="p-6 text-red-600">Ram not found.</p>;

  const gr=ram.growthRecords||[]; const fr=ram.feedRecords||[]; const ml=ram.medicalLog||[];
  const dr=ram.drenchingRecords||[]; const wr=ram.woolRecords||[]; const br=ram.breedingRecords||[];

  const startEdit=()=>{setIsEditing(true);setEdited({...ram});}; const cancelEdit=()=>{setIsEditing(false);setEdited(null);};
  const saveEdit=()=>{upd(edited);setIsEditing(false);setEdited(null);}; const uf=(f,v)=>setEdited((p)=>({...p,[f]:v}));
  const imgUp=(e)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onloadend=()=>upd({...ram,image:r.result}); r.readAsDataURL(f); };

  const addGrowth=()=>{ if(!newGrowth.date) return; upd({...ram,growthRecords:[...gr,{...newGrowth,id:Date.now()}]}); setNewGrowth({date:"",weight:"",bcs:0,price:"",notes:""}); setModal("viewGrowth"); };
  const addFeed=()=>{ if(!newFeed.date||!newFeed.feedType) return; upd({...ram,feedRecords:[...fr,{...newFeed,id:Date.now()}]}); setNewFeed({date:"",feedType:"",amount:"",minerals:"",notes:""}); setModal("viewFeed"); };
  const addMed=()=>{ if(!newMed.date||!newMed.type) return; upd({...ram,medicalLog:[...ml,{...newMed,id:Date.now()}]}); setNewMed({date:"",type:"",medicine:"",vetName:"",cost:"",notes:""}); setModal("viewMed"); };
  const addDrench=()=>{ if(!newDrench.date||!newDrench.product) return; upd({...ram,drenchingRecords:[...dr,{...newDrench,id:Date.now()}]}); setNewDrench({date:"",product:"",dose:"",famacha:0,weightAtDrenching:"",nextDate:"",notes:""}); setModal("viewDrench"); };
  const addWool=()=>{ if(!newWool.date) return; const tv=newWool.fleeceWeight&&newWool.pricePerKg?(parseFloat(newWool.fleeceWeight)*parseFloat(newWool.pricePerKg)).toFixed(0):""; upd({...ram,woolRecords:[...wr,{...newWool,id:Date.now(),totalValue:tv}]}); setNewWool({date:"",fleeceWeight:"",stapleLengthCm:"",grade:"",pricePerKg:"",notes:""}); setModal("viewWool"); };
  const addBreeding=()=>{ if(!newBreeding.season) return; upd({...ram,breedingRecords:[...br,{...newBreeding,id:Date.now()}]}); setNewBreeding({season:"",ewesServed:"",startDate:"",endDate:"",conceptionRate:"",notes:""}); setModal("viewBreeding"); };
  const del=(field,rid)=>upd({...ram,[field]:ram[field].filter((r)=>r.id!==rid)});

  const chartData=[...gr].sort((a,b)=>new Date(a.date)-new Date(b.date)).map((r)=>({date:r.date,weight:r.weight?parseFloat(r.weight):null,bcs:r.bcs?parseFloat(r.bcs):null}));
  const woolChartData=[...wr].sort((a,b)=>new Date(a.date)-new Date(b.date)).map((r)=>({date:r.date,kg:r.fleeceWeight?parseFloat(r.fleeceWeight):null}));
  const totalWoolKg=wr.reduce((s,r)=>s+(parseFloat(r.fleeceWeight)||0),0).toFixed(1);
  const totalWoolValue=wr.reduce((s,r)=>s+(parseFloat(r.totalValue)||0),0);
  const totalEwesServed=br.reduce((s,r)=>s+(parseInt(r.ewesServed)||0),0);

  const statusColor={Healthy:"bg-green-100 text-green-800",Sick:"bg-red-100 text-red-700","Under Treatment":"bg-amber-100 text-amber-700"}[ram.status]||"bg-gray-100 text-gray-600";
  const [activeMetrics,setActiveMetrics]=useState(["weight"]);
  const METRICS=[{key:"weight",label:"Weight",color:"#065f46"},{key:"bcs",label:"BCS",color:"#16a34a"}];
  const toggleM=(k)=>setActiveMetrics((p)=>p.includes(k)?p.length>1?p.filter((x)=>x!==k):p:[...p,k]);

  return (
    <div className="bg-emerald-50 flex flex-col">
      <div className="flex items-center gap-4 px-6 py-4 bg-white shadow-sm">
        <button onClick={()=>navigate(-1)} className="bg-white shadow w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-700"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
        </button>
        <h2 className="text-2xl font-bold text-emerald-900">Ram Profile</h2>
        <div className="ml-auto flex items-center gap-2">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor}`}>{ram.status}</span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-700 text-white">{ram.age} yrs</span>
        </div>
      </div>

      <div className="flex flex-1 gap-6 p-6 flex-wrap lg:flex-nowrap">
        {/* LEFT */}
        <div className="flex flex-col gap-4 w-72 shrink-0">
          <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg bg-gray-100 group">
            {ram.image?<img src={ram.image} alt={ram.name} className="w-full h-full object-cover"/>:<div className="flex items-center justify-center h-full text-gray-400 text-sm">No image</div>}
            <label className="absolute inset-0 flex items-end justify-center pb-4 bg-black/0 group-hover:bg-black/30 transition cursor-pointer"><span className="opacity-0 group-hover:opacity-100 bg-white/90 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full transition">Change photo</span><input type="file" accept="image/*" className="hidden" onChange={imgUp}/></label>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-sm space-y-2">
            {[{l:"Breed",f:"breed"},{l:"Color",f:"color"},{l:"Weight",f:"weight",s:" kg"},{l:"Age",f:"age",s:" yrs"}].map(({l,f,s=""})=>(
              <div key={f} className="flex justify-between items-center border-b last:border-0 pb-1 last:pb-0">
                <span className="text-gray-500">{l}</span>
                {isEditing?<input value={edited[f]||""} onChange={(e)=>uf(f,e.target.value)} className="border rounded px-2 py-0.5 w-28 text-right text-sm"/>:<span className="text-emerald-900 font-semibold">{ram[f]?`${ram[f]}${s}`:<span className="text-gray-300">—</span>}</span>}
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-sm">
            <p className="font-semibold text-gray-500 text-xs uppercase mb-2">Wool Summary 🧶</p>
            <div className="space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Shearings</span><span className="font-bold text-teal-700">{wr.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total fleece</span><span className="font-bold text-teal-700">{totalWoolKg} kg</span></div>
              {totalWoolValue>0&&<div className="flex justify-between"><span className="text-gray-500">Total value</span><span className="font-bold text-amber-700">KES {totalWoolValue.toLocaleString()}</span></div>}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-sm">
            <p className="font-semibold text-gray-500 text-xs uppercase mb-2">Breeding Summary</p>
            <div className="space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Seasons served</span><span className="font-bold text-emerald-700">{br.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total ewes served</span><span className="font-bold text-emerald-700">{totalEwesServed}</span></div>
              {dr.length>0&&dr.at(-1).nextDate&&<div className="flex justify-between"><span className="text-gray-500">Next drench</span><span className="font-bold text-orange-600">{dr.at(-1).nextDate}</span></div>}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Name</p>
                {isEditing?<input value={edited.name||""} onChange={(e)=>uf("name",e.target.value)} className="text-2xl font-bold border-b border-emerald-400 outline-none w-full"/>:<h3 className="text-2xl font-bold text-emerald-900">{ram.name}</h3>}
              </div>
              {!isEditing?<button onClick={startEdit} className="bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm hover:bg-emerald-800 transition">Edit Profile</button>:<div className="flex gap-2"><button onClick={saveEdit} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm">Save</button><button onClick={cancelEdit} className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm">Cancel</button></div>}
            </div>
            {isEditing&&<div className="mt-4"><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Health Status</p><select value={edited.status||""} onChange={(e)=>uf("status",e.target.value)} className="border rounded-lg px-3 py-2 text-sm">{["Healthy","Sick","Under Treatment"].map((s)=><option key={s}>{s}</option>)}</select></div>}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <ActionCard title="Growth" count={gr.length} accent="green" latest={gr.length>0?`${gr.at(-1).weight||"—"} kg`:null} latestDate={gr.at(-1)?.date} onAdd={()=>setModal("growth")} onView={()=>setModal("viewGrowth")} iconPath="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/>
            <ActionCard title="Wool / Shearing" count={wr.length} accent="teal" latest={wr.length>0?`${wr.at(-1).fleeceWeight||"—"} kg`:null} latestDate={wr.at(-1)?.date} onAdd={()=>setModal("wool")} onView={()=>setModal("viewWool")} iconPath="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"/>
            <ActionCard title="Breeding Seasons" count={br.length} accent="violet" latest={br.length>0?`${br.at(-1).ewesServed||"—"} ewes`:null} latestDate={br.at(-1)?.startDate} onAdd={()=>setModal("breeding")} onView={()=>setModal("viewBreeding")} iconPath="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
            <ActionCard title="Drenching" count={dr.length} accent="amber" latest={dr.length>0?dr.at(-1).product:null} latestDate={dr.at(-1)?.date} onAdd={()=>setModal("drench")} onView={()=>setModal("viewDrench")} iconPath="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8.293 10.5h7.414M15 12.75a3 3 0 11-6 0 3 3 0 016 0z"/>
            <ActionCard title="Feed" count={fr.length} accent="sky" latest={fr.length>0?fr.at(-1).feedType:null} latestDate={fr.at(-1)?.date} onAdd={()=>setModal("feed")} onView={()=>setModal("viewFeed")} iconPath="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>
            <ActionCard title="Medical" count={ml.length} accent="red" latest={ml.length>0?ml.at(-1).type:null} latestDate={ml.at(-1)?.date} onAdd={()=>setModal("med")} onView={()=>setModal("viewMed")} iconPath="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/>
          </div>

          {chartData.length>0&&<div className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
              <p className="text-sm font-semibold text-gray-600">Growth chart</p>
              <div className="flex gap-2">{METRICS.map((m)=>{ const a=activeMetrics.includes(m.key); return <button key={m.key} onClick={()=>toggleM(m.key)} className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition ${a?"text-white border-transparent":"bg-white text-gray-500 border-gray-200"}`} style={a?{backgroundColor:m.color}:{}}>{m.label}</button>; })}</div>
            </div>
            <ResponsiveContainer width="100%" height={180}><LineChart data={chartData}><CartesianGrid strokeDasharray="4 4" stroke="#ecfdf5"/><XAxis dataKey="date" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip contentStyle={{borderRadius:"8px",fontSize:"12px"}}/>{METRICS.filter((m)=>activeMetrics.includes(m.key)).map((m)=><Line key={m.key} type="monotone" dataKey={m.key} name={m.label} stroke={m.color} strokeWidth={2.5} dot={{r:3}} activeDot={{r:5}} connectNulls/>)}</LineChart></ResponsiveContainer>
          </div>}
          {woolChartData.length>1&&<div className="bg-white rounded-2xl shadow p-5"><p className="text-sm font-semibold text-gray-600 mb-3">Fleece weight per shearing (kg)</p><ResponsiveContainer width="100%" height={150}><BarChart data={woolChartData} barSize={32}><CartesianGrid strokeDasharray="4 4" stroke="#f0fdfa"/><XAxis dataKey="date" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip contentStyle={{borderRadius:"8px",fontSize:"12px"}}/><Bar dataKey="kg" fill="#0d9488" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>}
          <GrowthTable records={gr} onDelete={(rid)=>del("growthRecords",rid)} accentHover="hover:bg-emerald-50/40"/>
        </div>
      </div>

      {/* MODALS */}
      {modal==="growth"&&<Modal title="Add Growth Record" onClose={()=>setModal(null)}><Field label="Date"><input type="date" value={newGrowth.date} onChange={(e)=>setNewGrowth({...newGrowth,date:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Weight (kg)"><input type="number" step="0.1" value={newGrowth.weight} onChange={(e)=>setNewGrowth({...newGrowth,weight:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="BCS"><BCSPicker value={newGrowth.bcs} onChange={(v)=>setNewGrowth({...newGrowth,bcs:v})}/></Field><Field label="Est. Price (KES)"><input type="number" value={newGrowth.price} onChange={(e)=>setNewGrowth({...newGrowth,price:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Notes"><textarea value={newGrowth.notes} onChange={(e)=>setNewGrowth({...newGrowth,notes:e.target.value})} className="border rounded-lg p-2 w-full h-16 resize-none"/></Field><div className="flex gap-3 pt-2"><button onClick={addGrowth} className="flex-1 bg-emerald-700 text-white py-2 rounded-xl hover:bg-emerald-800 font-semibold">Save</button><button onClick={()=>setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div></Modal>}
      {modal==="viewGrowth"&&<Modal title={`Growth — ${gr.length}`} onClose={()=>setModal(null)}><button onClick={()=>setModal("growth")} className="mb-4 bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm hover:bg-emerald-800">+ Add</button>{gr.length===0?<p className="text-gray-400 text-center py-8">No records.</p>:<div className="space-y-3">{[...gr].reverse().map((r)=><div key={r.id} className="bg-emerald-50 rounded-xl p-3 flex justify-between"><div><p className="font-semibold text-emerald-900 text-sm">{r.date}</p>{r.weight&&<p className="text-xs text-gray-600">⚖️ {r.weight} kg</p>}{r.bcs>0&&<BCSBadge score={r.bcs}/>}{r.price&&<p className="text-xs text-amber-700">💰 KES {parseFloat(r.price).toLocaleString()}</p>}</div><button onClick={()=>del("growthRecords",r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button></div>)}</div>}</Modal>}

      {modal==="wool"&&<Modal title="Add Wool / Shearing Record" onClose={()=>setModal(null)}><Field label="Date"><input type="date" value={newWool.date} onChange={(e)=>setNewWool({...newWool,date:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Fleece Weight (kg)"><input type="number" step="0.1" placeholder="e.g. 4.0" value={newWool.fleeceWeight} onChange={(e)=>setNewWool({...newWool,fleeceWeight:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Staple Length (cm)"><input type="number" step="0.5" value={newWool.stapleLengthCm} onChange={(e)=>setNewWool({...newWool,stapleLengthCm:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Quality Grade"><select value={newWool.grade} onChange={(e)=>setNewWool({...newWool,grade:e.target.value})} className="border rounded-lg p-2 w-full"><option value="">Select...</option>{WOOL_GRADES.map((g)=><option key={g}>{g}</option>)}</select></Field><Field label="Price per kg (KES)"><input type="number" value={newWool.pricePerKg} onChange={(e)=>setNewWool({...newWool,pricePerKg:e.target.value})} className="border rounded-lg p-2 w-full"/></Field>{newWool.fleeceWeight&&newWool.pricePerKg&&<div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs text-teal-800 mb-2">💰 Est. value: KES {(parseFloat(newWool.fleeceWeight)*parseFloat(newWool.pricePerKg)).toLocaleString()}</div>}<div className="flex gap-3 pt-2"><button onClick={addWool} className="flex-1 bg-teal-600 text-white py-2 rounded-xl hover:bg-teal-700 font-semibold">Save</button><button onClick={()=>setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div></Modal>}
      {modal==="viewWool"&&<Modal title={`Wool — ${wr.length} shearings`} onClose={()=>setModal(null)}><button onClick={()=>setModal("wool")} className="mb-4 bg-teal-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-teal-700">+ Add</button>{wr.length===0?<p className="text-gray-400 text-center py-8">No shearing records.</p>:<div className="space-y-3">{[...wr].reverse().map((r)=><div key={r.id} className="bg-teal-50 rounded-xl p-3 flex justify-between"><div><p className="font-semibold text-teal-900">{r.date}</p>{r.fleeceWeight&&<p className="text-xs text-gray-600">🧶 {r.fleeceWeight} kg</p>}{r.grade&&<p className="text-xs text-gray-600">Grade: {r.grade}</p>}{r.totalValue&&<p className="text-xs text-amber-700 font-semibold">KES {parseFloat(r.totalValue).toLocaleString()}</p>}</div><button onClick={()=>del("woolRecords",r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button></div>)}</div>}</Modal>}

      {modal==="breeding"&&<Modal title="Record Breeding Season" onClose={()=>setModal(null)}>
        <Field label="Season / Year"><input placeholder="e.g. 2024 Autumn" value={newBreeding.season} onChange={(e)=>setNewBreeding({...newBreeding,season:e.target.value})} className="border rounded-lg p-2 w-full"/></Field>
        <Field label="Start Date (introduced to flock)"><input type="date" value={newBreeding.startDate} onChange={(e)=>setNewBreeding({...newBreeding,startDate:e.target.value})} className="border rounded-lg p-2 w-full"/></Field>
        <Field label="End Date (removed from flock)"><input type="date" value={newBreeding.endDate} onChange={(e)=>setNewBreeding({...newBreeding,endDate:e.target.value})} className="border rounded-lg p-2 w-full"/></Field>
        <Field label="Number of Ewes Served"><input type="number" placeholder="e.g. 30" value={newBreeding.ewesServed} onChange={(e)=>setNewBreeding({...newBreeding,ewesServed:e.target.value})} className="border rounded-lg p-2 w-full"/></Field>
        <Field label="Conception Rate (%)"><input type="number" placeholder="e.g. 92" value={newBreeding.conceptionRate} onChange={(e)=>setNewBreeding({...newBreeding,conceptionRate:e.target.value})} className="border rounded-lg p-2 w-full"/></Field>
        <Field label="Notes"><textarea value={newBreeding.notes} onChange={(e)=>setNewBreeding({...newBreeding,notes:e.target.value})} className="border rounded-lg p-2 w-full h-14 resize-none"/></Field>
        <div className="flex gap-3 pt-2"><button onClick={addBreeding} className="flex-1 bg-violet-600 text-white py-2 rounded-xl hover:bg-violet-700 font-semibold">Save</button><button onClick={()=>setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div>
      </Modal>}
      {modal==="viewBreeding"&&<Modal title={`Breeding Seasons — ${br.length}`} onClose={()=>setModal(null)}><button onClick={()=>setModal("breeding")} className="mb-4 bg-violet-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-violet-700">+ Add</button>{br.length===0?<p className="text-gray-400 text-center py-8">No seasons recorded.</p>:<div className="space-y-3">{[...br].reverse().map((r)=><div key={r.id} className="bg-violet-50 rounded-xl p-3 flex justify-between"><div><p className="font-semibold text-violet-900">{r.season}</p>{(r.startDate||r.endDate)&&<p className="text-xs text-gray-500">{r.startDate} → {r.endDate||"ongoing"}</p>}{r.ewesServed&&<p className="text-xs text-gray-600">Ewes served: {r.ewesServed}</p>}{r.conceptionRate&&<p className="text-xs text-green-700 font-semibold">Conception: {r.conceptionRate}%</p>}</div><button onClick={()=>del("breedingRecords",r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button></div>)}</div>}</Modal>}

      {modal==="drench"&&<Modal title="Add Drenching Record" onClose={()=>setModal(null)}><Field label="Date"><input type="date" value={newDrench.date} onChange={(e)=>setNewDrench({...newDrench,date:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Product"><input placeholder="e.g. Ivermectin, Closantel" value={newDrench.product} onChange={(e)=>setNewDrench({...newDrench,product:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Dose (mL)"><input type="number" step="0.5" value={newDrench.dose} onChange={(e)=>setNewDrench({...newDrench,dose:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Weight at Drenching (kg)"><input type="number" step="0.1" value={newDrench.weightAtDrenching} onChange={(e)=>setNewDrench({...newDrench,weightAtDrenching:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="FAMACHA Score"><FAMACHAPicker value={newDrench.famacha} onChange={(v)=>setNewDrench({...newDrench,famacha:v})}/></Field><Field label="Next Scheduled Drench"><input type="date" value={newDrench.nextDate} onChange={(e)=>setNewDrench({...newDrench,nextDate:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><div className="flex gap-3 pt-2"><button onClick={addDrench} className="flex-1 bg-amber-500 text-white py-2 rounded-xl hover:bg-amber-600 font-semibold">Save</button><button onClick={()=>setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div></Modal>}
      {modal==="viewDrench"&&<Modal title={`Drenching — ${dr.length}`} onClose={()=>setModal(null)}><button onClick={()=>setModal("drench")} className="mb-4 bg-amber-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-amber-600">+ Add</button>{dr.length===0?<p className="text-gray-400 text-center py-8">No records.</p>:<div className="space-y-3">{[...dr].reverse().map((r)=><div key={r.id} className="bg-amber-50 rounded-xl p-3 flex justify-between"><div><p className="font-semibold text-amber-900">{r.product}</p><p className="text-xs text-gray-500">{r.date}{r.dose?` · ${r.dose} mL`:""}</p>{r.famacha>0&&<FAMACHABadge score={r.famacha}/>}{r.nextDate&&<p className="text-xs text-orange-600 mt-0.5">Next: {r.nextDate}</p>}</div><button onClick={()=>del("drenchingRecords",r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button></div>)}</div>}</Modal>}

      {modal==="feed"&&<Modal title="Add Feed Record" onClose={()=>setModal(null)}><Field label="Date"><input type="date" value={newFeed.date} onChange={(e)=>setNewFeed({...newFeed,date:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Feed Type"><input placeholder="e.g. Pasture, Hay, Grain, Concentrates" value={newFeed.feedType} onChange={(e)=>setNewFeed({...newFeed,feedType:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Amount (kg)"><input type="number" value={newFeed.amount} onChange={(e)=>setNewFeed({...newFeed,amount:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Minerals / Supplements"><input placeholder="e.g. Selenium, Zinc" value={newFeed.minerals} onChange={(e)=>setNewFeed({...newFeed,minerals:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><div className="flex gap-3 pt-2"><button onClick={addFeed} className="flex-1 bg-sky-600 text-white py-2 rounded-xl hover:bg-sky-700 font-semibold">Save</button><button onClick={()=>setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div></Modal>}
      {modal==="viewFeed"&&<Modal title={`Feed — ${fr.length}`} onClose={()=>setModal(null)}><button onClick={()=>setModal("feed")} className="mb-4 bg-sky-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-sky-700">+ Add</button>{fr.length===0?<p className="text-gray-400 text-center py-8">No feed records.</p>:<div className="space-y-3">{[...fr].reverse().map((r)=><div key={r.id} className="bg-sky-50 rounded-xl p-3 flex justify-between"><div><p className="font-semibold text-sky-900">{r.feedType}</p><p className="text-xs text-gray-500">{r.date}{r.amount?` · ${r.amount} kg`:""}</p></div><button onClick={()=>del("feedRecords",r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button></div>)}</div>}</Modal>}

      {modal==="med"&&<Modal title="Add Medical Record" onClose={()=>setModal(null)}><Field label="Date"><input type="date" value={newMed.date} onChange={(e)=>setNewMed({...newMed,date:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Type"><select value={newMed.type} onChange={(e)=>setNewMed({...newMed,type:e.target.value})} className="border rounded-lg p-2 w-full"><option value="">Select...</option>{["Vaccination","Foot Rot Treatment","Lice/Scab Treatment","Injury Treatment","Checkup","Other"].map((t)=><option key={t}>{t}</option>)}</select></Field><Field label="Medicine"><input value={newMed.medicine} onChange={(e)=>setNewMed({...newMed,medicine:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Vet Name"><input value={newMed.vetName} onChange={(e)=>setNewMed({...newMed,vetName:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><Field label="Cost (KES)"><input type="number" value={newMed.cost} onChange={(e)=>setNewMed({...newMed,cost:e.target.value})} className="border rounded-lg p-2 w-full"/></Field><div className="flex gap-3 pt-2"><button onClick={addMed} className="flex-1 bg-red-600 text-white py-2 rounded-xl hover:bg-red-700 font-semibold">Save</button><button onClick={()=>setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div></Modal>}
      {modal==="viewMed"&&<Modal title={`Medical — ${ml.length}`} onClose={()=>setModal(null)}><button onClick={()=>setModal("med")} className="mb-4 bg-red-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-red-700">+ Add</button>{ml.length===0?<p className="text-gray-400 text-center py-8">No records.</p>:<div className="space-y-3">{[...ml].reverse().map((r)=><div key={r.id} className="bg-red-50 rounded-xl p-3 flex justify-between"><div><p className="font-semibold text-red-900">{r.type}</p><p className="text-xs text-gray-500">{r.date}{r.vetName?` · ${r.vetName}`:""}</p>{r.medicine&&<p className="text-xs text-gray-600">{r.medicine}</p>}</div><button onClick={()=>del("medicalLog",r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button></div>)}</div>}</Modal>}
    </div>
  );
}
