import { useContext, useState } from "react";
import { FarmContext } from "../context/FarmContext";
import { Link, useNavigate } from "react-router-dom";

const PREGNANCY_COLORS = {
  Open:      "bg-gray-500",
  Pregnant:  "bg-pink-500",
  Lactating: "bg-blue-500",
  Dry:       "bg-amber-500",
};

export default function Cows() {
  const navigate = useNavigate();
  const { animals = [], setAnimals } = useContext(FarmContext);

  const cows = animals.filter(
    (a) => a.category === "cattle" && a.type?.toLowerCase() === "cow"
  );

  const [name,  setName]  = useState("");
  const [age,   setAge]   = useState("");
  const [image, setImage] = useState("");

  const addCow = () => {
    if (!name || !age || !image) return;
    const newCow = {
      id:             Date.now(),
      category:       "cattle",
      type:           "cow",
      name,
      age,
      image,
      datePurchased:  "",
      purchasePrice:  "",
      breed:          "",
      color:          "",
      status:         "Healthy",
      pregnancyStatus: "Open",
      weight:         "",
      growthRecords:  [],
      feedRecords:    [],
      medicalLog:     [],
      reproductiveRecords: [],
      lactationHistory:    [],
      calfHistory:         [],
    };
    setAnimals((prev) => [...prev, newCow]);
    setName(""); setAge(""); setImage("");
  };

  return (
    <div className="bg-green-50 relative p-6">

      {/* BACK */}
      <button onClick={() => navigate(-1)}
        className="absolute -top-4 -left-[15px] z-50 bg-white shadow-md w-11 h-11 rounded-full flex items-center justify-center hover:scale-110 transition">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-700">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      <h2 className="text-3xl font-bold text-green-900 mb-6 ml-14">Cows Management</h2>

      {/* ADD FORM */}
      <div className="bg-white border rounded-2xl p-5 flex flex-wrap gap-3 shadow-sm mb-8">
        <input value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Cow Name"
          className="border p-3 rounded-lg flex-1 min-w-[200px]" />
        <input value={age} onChange={(e) => setAge(e.target.value)}
          type="number" placeholder="Age (yrs)"
          className="border p-3 rounded-lg w-32" />
        <input type="file" accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onloadend = () => setImage(reader.result);
            reader.readAsDataURL(file);
          }}
          className="border p-3 rounded-lg flex-1 min-w-[220px]" />
        <button onClick={addCow}
          className="bg-pink-600 text-white px-5 py-3 rounded-xl hover:bg-pink-700 transition">
          Add Cow
        </button>
      </div>

      {/* GRID */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cows.map((c) => (
          <div key={c.id} className="relative h-80 rounded-3xl overflow-hidden shadow-xl group">

            <img src={c.image || "/images/placeholder.jpg"} alt={c.name}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />

            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {/* age — top left */}
            <div className="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 text-xs rounded-full backdrop-blur-sm">
              {c.age} yrs
            </div>

            {/* pregnancy status — top right */}
            <div className={`absolute top-3 right-3 ${PREGNANCY_COLORS[c.pregnancyStatus] || "bg-gray-500"} text-white px-3 py-1 text-xs rounded-full`}>
              {c.pregnancyStatus || "Open"}
            </div>

            {/* milk yield latest — bottom left */}
            {c.growthRecords?.length > 0 && c.growthRecords.at(-1).milkYield && (
              <div className="absolute bottom-14 left-3 bg-blue-600/80 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                🥛 {c.growthRecords.at(-1).milkYield} L/day
              </div>
            )}

            {/* profile button — bottom right */}
            <Link to={`/animals/cattle/cows/${c.id}`}>
              <button className="absolute bottom-4 right-4 bg-pink-600 text-white px-5 py-2 rounded-xl hover:bg-pink-700 transition shadow-lg backdrop-blur-md">
                {c.name}
              </button>
            </Link>

          </div>
        ))}
      </div>

      {cows.length === 0 && (
        <p className="text-gray-500 text-lg mt-4">No cows added yet.</p>
      )}
    </div>
  );
}
