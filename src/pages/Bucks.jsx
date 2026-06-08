import { useContext, useState } from "react";
import { FarmContext } from "../context/FarmContext";
import { Link, useNavigate } from "react-router-dom";

export default function Bucks() {
  const navigate = useNavigate();
  const { animals = [], setAnimals } = useContext(FarmContext);

  const bucks = animals.filter(
    (a) => a.category === "goats" && a.type?.toLowerCase() === "buck"
  );

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [image, setImage] = useState("");

  const add = () => {
    if (!name || !age || !image) return;

    setAnimals((prev) => [
      ...prev,
      {
        id: Date.now(),
        category: "goats",
        type: "buck",
        name,
        age,
        image,

        breed: "",
        color: "",
        status: "Healthy",
        weight: "",

        datePurchased: "",
        purchasePrice: "",

        growthRecords: [],
        feedRecords: [],
        medicalLog: [],
        vaccinationRecords: [],
        dewormingRecords: [],

        breedingRecords: [],
      },
    ]);

    setName("");
    setAge("");
    setImage("");
  };

  return (
    <div className="bg-green-50 relative p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute -top-4 -left-[15px] z-50 bg-white shadow-md w-11 h-11 rounded-full flex items-center justify-center hover:scale-110 transition"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5 text-green-700"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
      </button>

      {/* Header */}
      <h2 className="text-3xl font-bold text-green-900 mb-6 ml-14">
        Bucks
      </h2>

      {/* Add Buck Form */}
      <div className="bg-white border rounded-2xl p-5 flex flex-wrap gap-3 shadow-sm mb-8">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Buck Name"
          className="border p-3 rounded-lg flex-1 min-w-[180px]"
        />

        <input
          value={age}
          onChange={(e) => setAge(e.target.value)}
          type="number"
          placeholder="Age (yrs)"
          className="border p-3 rounded-lg w-32"
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onloadend = () => setImage(reader.result);
            reader.readAsDataURL(file);
          }}
          className="border p-3 rounded-lg flex-1 min-w-[200px]"
        />

        <button
          onClick={add}
          className="bg-emerald-700 text-white px-5 py-3 rounded-xl hover:bg-emerald-800 transition"
        >
          Add Buck
        </button>
      </div>

      {/* Buck Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {bucks.map((buck) => (
          <div
            key={buck.id}
            className="relative h-80 rounded-3xl overflow-hidden shadow-xl group"
          >
            <img
              src={buck.image}
              alt={buck.name}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              onError={(e) => {
                e.target.src = `https://placehold.co/400x320/d1fae5/064e3b?text=${buck.name}`;
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            <div className="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 text-xs rounded-full backdrop-blur-sm">
              {buck.age} yrs
            </div>

            <div className="absolute top-3 right-3 bg-emerald-700 text-white px-3 py-1 text-xs rounded-full">
              {buck.status || "Healthy"}
            </div>

            {buck.weight && (
              <div className="absolute bottom-14 left-3 bg-amber-600/80 text-white text-xs px-2 py-0.5 rounded-full">
                ⚖️ {buck.weight} kg
              </div>
            )}

            {buck.breedingRecords?.length > 0 && (
              <div className="absolute bottom-14 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                {buck.breedingRecords.length} matings
              </div>
            )}

            <Link to={`/animals/goats/bucks/${buck.id}`}>
              <button className="absolute bottom-4 right-4 bg-emerald-700 text-white px-5 py-2 rounded-xl hover:bg-emerald-800 transition shadow-lg">
                {buck.name}
              </button>
            </Link>
          </div>
        ))}
      </div>

      {bucks.length === 0 && (
        <p className="text-gray-500 text-lg mt-4">
          No bucks added yet.
        </p>
      )}
    </div>
  );
}