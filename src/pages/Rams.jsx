import { useContext, useState } from "react";
import { FarmContext } from "../context/FarmContext";
import { Link, useNavigate } from "react-router-dom";

export default function Rams() {
  const navigate = useNavigate();
  const { animals = [], setAnimals } = useContext(FarmContext);
  const rams = animals.filter((a) => a.category === "sheep" && a.type?.toLowerCase() === "ram");
  const [name,setName]=useState(""); const [age,setAge]=useState(""); const [image,setImage]=useState("");

  const add = () => {
    if (!name||!age||!image) return;
    setAnimals((p) => [...p, { id:Date.now(), category:"sheep", type:"ram", name, age, image,
      breed:"", color:"", status:"Healthy", weight:"", datePurchased:"", purchasePrice:"",
      growthRecords:[], feedRecords:[], medicalLog:[], drenchingRecords:[],
      woolRecords:[], breedingRecords:[] }]);
    setName(""); setAge(""); setImage("");
  };

  return (
    <div className="bg-green-50 relative p-6">
      <button onClick={() => navigate(-1)} className="absolute -top-4 -left-[15px] z-50 bg-white shadow-md w-11 h-11 rounded-full flex items-center justify-center hover:scale-110 transition">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-700"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
      </button>
      <h2 className="text-3xl font-bold text-green-900 mb-6 ml-14">Rams</h2>
      <div className="bg-white border rounded-2xl p-5 flex flex-wrap gap-3 shadow-sm mb-8">
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Ram Name" className="border p-3 rounded-lg flex-1 min-w-[180px]" />
        <input value={age} onChange={(e)=>setAge(e.target.value)} type="number" placeholder="Age (yrs)" className="border p-3 rounded-lg w-32" />
        <input type="file" accept="image/*" onChange={(e)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onloadend=()=>setImage(r.result); r.readAsDataURL(f); }} className="border p-3 rounded-lg flex-1 min-w-[200px]" />
        <button onClick={add} className="bg-emerald-700 text-white px-5 py-3 rounded-xl hover:bg-emerald-800 transition">Add Ram</button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {rams.map((r) => (
          <div key={r.id} className="relative h-80 rounded-3xl overflow-hidden shadow-xl group">
            <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" onError={(ev)=>{ ev.target.src=`https://placehold.co/400x320/d1fae5/064e3b?text=${r.name}`; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 text-xs rounded-full backdrop-blur-sm">{r.age} yrs</div>
            <div className="absolute top-3 right-3 bg-emerald-700 text-white px-3 py-1 text-xs rounded-full">{r.status||"Healthy"}</div>
            {r.woolRecords?.length > 0 && <div className="absolute bottom-14 left-3 bg-teal-600/80 text-white text-xs px-2 py-0.5 rounded-full">🧶 {r.woolRecords.at(-1).fleeceWeight} kg</div>}
            {r.breedingRecords?.length > 0 && <div className="absolute bottom-14 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">{r.breedingRecords.length} seasons</div>}
            <Link to={`/animals/sheep/rams/${r.id}`}><button className="absolute bottom-4 right-4 bg-emerald-700 text-white px-5 py-2 rounded-xl hover:bg-emerald-800 transition shadow-lg">{r.name}</button></Link>
          </div>
        ))}
      </div>
      {rams.length===0 && <p className="text-gray-500 text-lg mt-4">No rams added yet.</p>}
    </div>
  );
}