import { useContext, useState } from "react";
import { FarmContext } from "../context/FarmContext";
import { Link, useNavigate } from "react-router-dom";

function ageLabel(birthDate) {
  if (!birthDate) return "—";
  const days = Math.floor((new Date() - new Date(birthDate)) / 86400000);
  if (days < 0)  return "—";
  if (days < 7)  return `${days}d old`;
  if (days < 60) return `${Math.floor(days / 7)}w old`;
  return `${Math.floor(days / 30)}mo old`;
}

export default function Calves() {
  const navigate = useNavigate();
  const { animals = [], setAnimals } = useContext(FarmContext);

  const calves = animals.filter(
    (a) => a.category === "cattle" && a.type?.toLowerCase() === "calf"
  );

  const [name,      setName]      = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender,    setGender]    = useState("Female");
  const [image,     setImage]     = useState("");

  const addCalf = () => {
    if (!name || !birthDate || !image) return;
    setAnimals((prev) => [...prev, {
      id:            Date.now(),
      category:      "cattle",
      type:          "calf",
      name, birthDate, gender, image,
      dam: "", sire: "",
      birthWeight:   "",
      status:        "Healthy",
      colostrumRecord: null,
      growthRecords:   [],
      milkFeedRecords: [],
      medicalLog:      [],
      weaningTargetDate: "",
      graduated:       false,
    }]);
    setName(""); setBirthDate(""); setGender("Female"); setImage("");
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

      <h2 className="text-3xl font-bold text-green-900 mb-6 ml-14">Calves Management</h2>

      {/* ADD FORM */}
      <div className="bg-white border rounded-2xl p-5 flex flex-wrap gap-3 shadow-sm mb-8">
        <input value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Calf Name"
          className="border p-3 rounded-lg flex-1 min-w-[180px]" />

        <div className="flex flex-col justify-center gap-1">
          <label className="text-xs text-gray-500 font-semibold uppercase">Birth Date</label>
          <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
            className="border p-3 rounded-lg" />
        </div>

        {/* gender toggle */}
        <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3">
          {["Female","Male"].map((g) => (
            <button key={g} type="button" onClick={() => setGender(g)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition
                ${gender === g
                  ? g === "Female" ? "bg-pink-500 text-white" : "bg-blue-500 text-white"
                  : "text-gray-400 hover:text-gray-600"}`}>
              {g}
            </button>
          ))}
        </div>

        <input type="file" accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0]; if (!file) return;
            const reader = new FileReader();
            reader.onloadend = () => setImage(reader.result);
            reader.readAsDataURL(file);
          }}
          className="border p-3 rounded-lg flex-1 min-w-[200px]" />

        <button onClick={addCalf}
          className="bg-orange-500 text-white px-5 py-3 rounded-xl hover:bg-orange-600 transition">
          Add Calf
        </button>
      </div>

      {/* GRID */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {calves.map((c) => {
          const days = c.birthDate ? Math.floor((new Date() - new Date(c.birthDate)) / 86400000) : null;
          const urgent = days !== null && days <= 3 && !c.colostrumRecord;

          return (
            <div key={c.id} className="relative h-80 rounded-3xl overflow-hidden shadow-xl group">
              <img src={c.image || "/images/placeholder.jpg"} alt={c.name}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                onError={(e) => { e.target.src = `https://placehold.co/400x320/fff7ed/9a3412?text=${c.name}`; }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

              {/* age — top left */}
              <div className="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 text-xs rounded-full backdrop-blur-sm">
                {ageLabel(c.birthDate)}
              </div>

              {/* gender — top right */}
              <div className={`absolute top-3 right-3 text-white px-3 py-1 text-xs rounded-full
                ${c.gender === "Male" ? "bg-blue-500" : "bg-pink-500"}`}>
                {c.gender || "Unknown"}
              </div>

              {/* colostrum warning */}
              {urgent && (
                <div className="absolute top-10 left-3 right-3 bg-red-600/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg text-center font-semibold">
                  ⚠️ Colostrum not recorded!
                </div>
              )}

              {/* graduated badge */}
              {c.graduated && (
                <div className="absolute bottom-14 left-3 bg-green-600/80 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                  ✅ Graduated
                </div>
              )}

              <Link to={`/animals/cattle/calves/${c.id}`}>
                <button className="absolute bottom-4 right-4 bg-orange-500 text-white px-5 py-2 rounded-xl hover:bg-orange-600 transition shadow-lg backdrop-blur-md">
                  {c.name}
                </button>
              </Link>
            </div>
          );
        })}
      </div>

      {calves.length === 0 && (
        <p className="text-gray-500 text-lg mt-4">No calves recorded yet.</p>
      )}
    </div>
  );
}
