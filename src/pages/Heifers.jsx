import { useContext, useState } from "react";
import { FarmContext } from "../context/FarmContext";
import { Link, useNavigate } from "react-router-dom";

const READINESS_COLORS = {
  Weaning:            "bg-gray-400",
  Growing:            "bg-amber-500",
  "Near Breeding Age":"bg-purple-500",
  "Ready to Breed":   "bg-green-600",
};

export default function Heifers() {
  const navigate = useNavigate();
  const { animals = [], setAnimals } = useContext(FarmContext);

  const heifers = animals.filter(
    (a) => a.category === "cattle" && a.type?.toLowerCase() === "heifer"
  );

  const [name,  setName]  = useState("");
  const [age,   setAge]   = useState("");
  const [image, setImage] = useState("");

  const addHeifer = () => {
    if (!name || !age || !image) return;
    setAnimals((prev) => [...prev, {
      id: Date.now(),
      category: "cattle",
      type: "heifer",
      name, age, image,
      dam: "", sire: "",
      breed: "", color: "",
      status: "Healthy",
      readinessStatus: "Growing",
      weight: "", targetWeight: "",
      weaningDate: "",
      growthRecords: [],
      feedRecords: [],
      medicalLog: [],
      heatRecords: [],
    }]);
    setName(""); setAge(""); setImage("");
  };

  return (
    <div className="bg-green-50 relative p-6">

      {/* BACK */}
      <button onClick={() => navigate(-1)}
        className="absolute -top-4 -left-[15px] z-50 bg-white shadow-md w-11 h-11 rounded-full flex items-center justify-center hover:scale-110 transition">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-700">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      <h2 className="text-3xl font-bold text-green-900 mb-6 ml-14">Heifers Management</h2>

      {/* ADD FORM */}
      <div className="bg-white border rounded-2xl p-5 flex flex-wrap gap-3 shadow-sm mb-8">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Heifer Name"
          className="border p-3 rounded-lg flex-1 min-w-[200px]" />
        <input value={age} onChange={(e) => setAge(e.target.value)} type="number" placeholder="Age (months)"
          className="border p-3 rounded-lg w-36" />
        <input type="file" accept="image/*" onChange={(e) => {
          const file = e.target.files?.[0]; if (!file) return;
          const reader = new FileReader();
          reader.onloadend = () => setImage(reader.result);
          reader.readAsDataURL(file);
        }} className="border p-3 rounded-lg flex-1 min-w-[220px]" />
        <button onClick={addHeifer}
          className="bg-purple-600 text-white px-5 py-3 rounded-xl hover:bg-purple-700 transition">
          Add Heifer
        </button>
      </div>

      {/* GRID */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {heifers.map((h) => (
          <div key={h.id} className="relative h-80 rounded-3xl overflow-hidden shadow-xl group">
            <img src={h.image || "/images/placeholder.jpg"} alt={h.name}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              onError={(e) => { e.target.src = `https://placehold.co/400x320/f3e8ff/581c87?text=${h.name}`; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {/* age top left */}
            <div className="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 text-xs rounded-full backdrop-blur-sm">
              {h.age} mo
            </div>

            {/* readiness top right */}
            <div className={`absolute top-3 right-3 ${READINESS_COLORS[h.readinessStatus] || "bg-gray-500"} text-white px-3 py-1 text-xs rounded-full`}>
              {h.readinessStatus || "Growing"}
            </div>

            {/* latest heat observed */}
            {h.heatRecords?.length > 0 && (
              <div className="absolute bottom-14 left-3 bg-purple-600/80 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                🌡 Heat: {h.heatRecords.at(-1).date}
              </div>
            )}

            {/* weight progress */}
            {h.targetWeight && h.weight && (
              <div className="absolute bottom-14 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                {Math.min(100, Math.round((parseFloat(h.weight) / parseFloat(h.targetWeight)) * 100))}% of target
              </div>
            )}

            <Link to={`/animals/cattle/heifers/${h.id}`}>
              <button className="absolute bottom-4 right-4 bg-purple-600 text-white px-5 py-2 rounded-xl hover:bg-purple-700 transition shadow-lg backdrop-blur-md">
                {h.name}
              </button>
            </Link>
          </div>
        ))}
      </div>

      {heifers.length === 0 && (
        <p className="text-gray-500 text-lg mt-4">No heifers added yet.</p>
      )}
    </div>
  );
}
