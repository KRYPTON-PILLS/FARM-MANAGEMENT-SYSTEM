import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FarmContext, formatAge } from "../context/FarmContext";


function ageLabel(birthDate) {
  if (!birthDate) return "—";
  const days = Math.floor((Date.now() - new Date(birthDate)) / 86400000);
  if (days < 0) return "—";
  if (days < 7)  return `${days}d`;
  if (days < 30) return `${Math.floor(days/7)}w`;
  return `${Math.floor(days/30)}mo`;
}

export default function Kids() {
  const navigate = useNavigate();
  const { animals = [], setAnimals } = useContext(FarmContext);
  const kids = animals.filter((a) => a.category === "goat" && a.type?.toLowerCase() === "kid");

  const [name, setName]           = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender]       = useState("Female");
  const [image, setImage]         = useState("");

  const addKid = () => {
    if (!name || !birthDate || !image) return;
    setAnimals((prev) => [...prev, {
      id: Date.now(), category: "goat", type: "kid",
      name, birthDate, gender, image,
      dam: "", sire: "", breed: "", color: "",
      status: "Healthy", weight: "", birthWeight: "",
      colostrumRecord: null,
      growthRecords: [], milkFeedRecords: [], medicalLog: [],
      weaningTargetDate: "", graduated: false,
    }]);
    setName(""); setBirthDate(""); setGender("Female"); setImage("");
  };

  return (
    <div className="bg-green-50 relative p-6">
      <button onClick={() => navigate(-1)}
        className="absolute -top-4 -left-[15px] z-50 bg-white shadow-md w-11 h-11 rounded-full flex items-center justify-center hover:scale-110 transition">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-700">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
      <h2 className="text-3xl font-bold text-green-900 mb-6 ml-14">Kids</h2>

      <div className="bg-white border rounded-2xl p-5 flex flex-wrap gap-3 shadow-sm mb-8">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kid Name" className="border p-3 rounded-lg flex-1 min-w-[180px]" />
        <div className="flex flex-col justify-center gap-1">
          <label className="text-xs text-gray-500 font-semibold uppercase">Birth Date</label>
          <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="border p-3 rounded-lg" />
        </div>
        <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3">
          {["Female","Male"].map((g) => (
            <button key={g} type="button" onClick={() => setGender(g)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${gender === g ? (g==="Female"?"bg-rose-500 text-white":"bg-sky-500 text-white") : "text-gray-400 hover:text-gray-600"}`}>
              {g}
            </button>
          ))}
        </div>
        <input type="file" accept="image/*" onChange={(e) => {
          const file = e.target.files?.[0]; if (!file) return;
          const reader = new FileReader();
          reader.onloadend = () => setImage(reader.result);
          reader.readAsDataURL(file);
        }} className="border p-3 rounded-lg flex-1 min-w-[200px]" />
        <button onClick={addKid} className="bg-amber-500 text-white px-5 py-3 rounded-xl hover:bg-amber-600 transition">Add Kid</button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {kids.map((k) => {
          const days = k.birthDate ? Math.floor((Date.now() - new Date(k.birthDate)) / 86400000) : null;
          const urgent = days !== null && days <= 3 && !k.colostrumRecord;
          return (
            <div key={k.id} className="relative h-80 rounded-3xl overflow-hidden shadow-xl group">
              <img src={k.image} alt={k.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                onError={(e) => { e.target.src = `https://placehold.co/400x320/fef9c3/92400e?text=${k.name}`; }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 text-xs rounded-full backdrop-blur-sm">{ageLabel(k.birthDate)}</div>
              <div className={`absolute top-3 right-3 ${k.gender==="Male"?"bg-sky-500":"bg-rose-500"} text-white px-3 py-1 text-xs rounded-full`}>{k.gender}</div>
              {urgent && <div className="absolute top-10 left-3 right-3 bg-red-600/90 text-white text-xs px-2 py-1 rounded-lg text-center font-semibold">⚠️ Colostrum not recorded!</div>}
              <Link to={`/animals/goats/kids/${k.id}`}>
                <button className="absolute bottom-4 right-4 bg-amber-500 text-white px-5 py-2 rounded-xl hover:bg-amber-600 transition shadow-lg">{k.name}</button>
              </Link>
            </div>
          );
        })}
      </div>
      {kids.length === 0 && <p className="text-gray-500 text-lg mt-4">No kids recorded yet.</p>}
    </div>
  );
}