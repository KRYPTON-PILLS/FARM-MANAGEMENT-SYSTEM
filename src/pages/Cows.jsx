import { useContext, useState } from "react";
import { FarmContext } from "../context/FarmContext";
import { Link, useNavigate } from "react-router-dom";
import { uploadAnimalPhoto } from "../utils/imageUpload.js";

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

  const [name,           setName]           = useState("");
  const [age,            setAge]            = useState("");
  const [image,          setImage]          = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /* ── Add cow — image optional ── */
  const addCow = () => {
    if (!name || !age) return;
    const newCow = {
      id:                  Date.now(),
      category:            "cattle",
      type:                "cow",
      name,
      age,
      image,               // Firebase Storage URL (or "" if no photo yet)
      datePurchased:       "",
      purchasePrice:       "",
      breed:               "",
      color:               "",
      status:              "Healthy",
      pregnancyStatus:     "Open",
      weight:              "",
      growthRecords:       [],
      feedRecords:         [],
      medicalLog:          [],
      reproductiveRecords: [],
      lactationHistory:    [],
      calfHistory:         [],
    };
    setAnimals((prev) => [...prev, newCow]);
    setName(""); setAge(""); setImage(""); setUploadProgress(0);
  };

  /* ── Upload to Firebase Storage ── */
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImageUploading(true);
      setUploadProgress(0);
      const url = await uploadAnimalPhoto(file, "cattle",
        (pct) => setUploadProgress(pct)
      );
      setImage(url); // ← permanent Storage URL, works in <img src> just like base64
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Image upload failed. You can still add the cow without a photo.");
    } finally {
      setImageUploading(false);
    }
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
          placeholder="Cow Name *"
          className="border p-3 rounded-lg flex-1 min-w-[200px]" />

        <input value={age} onChange={(e) => setAge(e.target.value)}
          type="number" placeholder="Age (yrs) *"
          className="border p-3 rounded-lg w-32" />

        {/* File input + progress */}
        <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={imageUploading}
            className="border p-3 rounded-lg w-full"
          />
          {imageUploading && (
            <>
              <p className="text-xs text-pink-600 font-semibold">
                Uploading photo… {uploadProgress}%
              </p>
            </>
          )}
          {!imageUploading && image && (
            <p className="text-xs text-green-600 font-semibold">✅ Photo ready</p>
          )}
        </div>

        <button
          onClick={addCow}
          disabled={!name || !age}
          className="bg-pink-600 text-white px-5 py-3 rounded-xl hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition">
          Add Cow
        </button>
      </div>

      {/* GRID — exactly the same cards as before */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cows.map((c) => (
          <div key={c.id} className="relative h-80 rounded-3xl overflow-hidden shadow-xl group">

            {/* IMAGE — shows Storage URL or placeholder emoji if no photo */}
            {c.image ? (
              <img
                src={c.image}
                alt={c.name}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center">
                <span className="text-6xl">🐄</span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {/* age — top left */}
            <div className="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 text-xs rounded-full backdrop-blur-sm">
              {c.age} yrs
            </div>

            {/* pregnancy status — top right */}
            <div className={`absolute top-3 right-3 ${PREGNANCY_COLORS[c.pregnancyStatus] || "bg-gray-500"} text-white px-3 py-1 text-xs rounded-full`}>
              {c.pregnancyStatus || "Open"}
            </div>

            {/* milk yield — bottom left */}
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
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">🐄</p>
          <p className="text-lg font-semibold">No cows added yet.</p>
          <p className="text-sm mt-1">Fill in the name and age above to add your first cow.</p>
        </div>
      )}
    </div>
  );
}
