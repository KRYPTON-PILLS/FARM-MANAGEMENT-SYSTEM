import { useContext, useState } from "react";
import { FarmContext } from "../context/FarmContext";
import { Link, useNavigate } from "react-router-dom";

const READINESS = { Weaning:"bg-gray-400", Growing:"bg-amber-500", "Near Breeding":"bg-violet-500", "Ready to Breed":"bg-green-600" };

export default function Doelings() {
  const navigate = useNavigate();
  const { animals = [], setAnimals } = useContext(FarmContext);
  const doelings = animals.filter((a) => a.category === "goats" && a.type?.toLowerCase() === "doeling");

  const [name,setName]=useState(""); const [age,setAge]=useState(""); const [image,setImage]=useState("");

  const add = () => {
    if (!name||!age||!image) return;
    setAnimals((p) => [...p, { id:Date.now(), category:"goats", type:"doeling", name, age, image,
      dam:"", sire:"", breed:"", color:"", status:"Healthy", readinessStatus:"Growing",
      weight:"", targetWeight:"", weaningDate:"",
      growthRecords:[], feedRecords:[], medicalLog:[], drenchingRecords:[], heatRecords:[] }]);
    setName(""); setAge(""); setImage("");
  };

  return (
    <div className="bg-green-50 relative p-6">
      <button onClick={() => navigate(-1)} className="absolute -top-4 -left-[15px] z-50 bg-white shadow-md w-11 h-11 rounded-full flex items-center justify-center hover:scale-110 transition">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-700"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
      </button>
      <h2 className="text-3xl font-bold text-green-900 mb-6 ml-14">Doeling</h2>
      <div className="bg-white border rounded-2xl p-5 flex flex-wrap gap-3 shadow-sm mb-8">
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Name" className="border p-3 rounded-lg flex-1 min-w-[180px]" />
        <input value={age} onChange={(e)=>setAge(e.target.value)} type="number" placeholder="Age (months)" className="border p-3 rounded-lg w-36" />
        <input type="file" accept="image/*" onChange={(e)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onloadend=()=>setImage(r.result); r.readAsDataURL(f); }} className="border p-3 rounded-lg flex-1 min-w-[200px]" />
        <button onClick={add} className="bg-violet-600 text-white px-5 py-3 rounded-xl hover:bg-violet-700 transition">Add Doeling</button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {doelings.map((d) => (
          <div key={d.id} className="relative h-80 rounded-3xl overflow-hidden shadow-xl group">
            <img src={d.image} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" onError={(ev)=>{ ev.target.src=`https://placehold.co/400x320/ede9fe/4c1d95?text=${d.name}`; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 text-xs rounded-full backdrop-blur-sm">{d.age} mo</div>
            <div className={`absolute top-3 right-3 ${READINESS[d.readinessStatus]||"bg-gray-500"} text-white px-3 py-1 text-xs rounded-full`}>{d.readinessStatus||"Growing"}</div>
            {d.heatRecords?.length > 0 && <div className="absolute bottom-14 left-3 bg-violet-600/80 text-white text-xs px-2 py-0.5 rounded-full">🌡 Heat: {d.heatRecords.at(-1).date}</div>}
            <Link to={`/animals/goats/doelings/${d.id}`}><button className="absolute bottom-4 right-4 bg-violet-600 text-white px-5 py-2 rounded-xl hover:bg-violet-700 transition shadow-lg">{d.name}</button></Link>
          </div>
        ))}
      </div>
      {doelings.length===0 && <p className="text-gray-500 text-lg mt-4">No doelings added yet.</p>}
    </div>
  );
}