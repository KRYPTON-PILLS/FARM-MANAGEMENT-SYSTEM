import { useContext, useState } from "react";
import { FarmContext } from "../context/FarmContext";
import { Link, useNavigate } from "react-router-dom";
import { uploadAnimalPhoto } from "../utils/imageUpload";

const MATURITY_COLORS = {
  Weaning:       "bg-gray-400",
  Growing:       "bg-amber-500",
  "Near Maturity": "bg-blue-500",
  "Ready":       "bg-green-600",
};

export default function BullCalves() {
  const navigate = useNavigate();
  const { animals = [], setAnimals } = useContext(FarmContext);

  const bullCalves = animals.filter(
    (a) => a.category === "cattle" && a.type?.toLowerCase() === "bull-calf"
  );

  const [name,  setName]  = useState("");
  const [age,   setAge]   = useState("");
  const [image, setImage] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);


  const addBullCalf = () => {
    if (!name || !age || !image) return;
    setAnimals((prev) => [...prev, {
      id: Date.now(),
      category: "cattle",
      type: "bull-calf",
      name, age, image,
      dam: "", sire: "",
      breed: "", color: "",
      status: "Healthy",
      maturityStatus: "Growing",
      weight: "", targetWeight: "",
      weaningDate: "",
      castrated: false,
      growthRecords: [],
      feedRecords: [],
      medicalLog: [],
      castrationRecord: null,
    }]);
    setName(""); setAge(""); setImage("");
  };


  /* ── Image upload ── */
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImageUploading(true);
      setUploadProgress(0);
      const url = await uploadAnimalPhoto(file, "cattle",
        (pct) => setUploadProgress(pct)
      );
      setImage(url);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Image upload failed. You can still add the bull without a photo.");
    } finally {
      setImageUploading(false);
    }
  };


  return (
    <div className="bg-green-50 relative p-6">

      {/* BACK BUTTON */}
      <button onClick={() => navigate(-1)}
        className="absolute -top-4 -left-[15px] z-50 bg-white shadow-md w-11 h-11 rounded-full flex items-center justify-center hover:scale-110 transition">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-700">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      {/* TITLE */}
      <h2 className="text-3xl font-bold text-green-900 mb-6 ml-14">Bull Calves Management</h2>

      {/* ADD FORM */}
      <div className="bg-white border rounded-2xl p-5 flex flex-wrap gap-3 shadow-sm mb-8">

        {/* NAME */}
        <input 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Bull Calf Name"
          className="border p-3 rounded-lg flex-1 min-w-[200px]" 
        />

        {/* AGE */}
        <input 
          value={age} 
          onChange={(e) => setAge(e.target.value)} 
          type="number" 
          placeholder="Age (months)"
          className="border p-3 rounded-lg w-36" 
        />

        {/* IMAGE UPLOAD */}
        <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={imageUploading}
            className="border p-3 rounded-lg w-full"
          />
          
          {/* Status text */}
          {imageUploading && (
            <p className="text-xs text-green-600 font-semibold">
              Uploading photo… {uploadProgress}%
            </p>
          )}
          {!imageUploading && image && (
            <p className="text-xs text-green-600 font-semibold">✅ Photo ready</p>
          )}
        </div>

        {/* ADD BUTTON — only requires name + age */}
        <button
          onClick={addBullCalf}
          disabled={!name || !age}
          className="bg-green-600 text-white px-5 py-3 rounded-xl hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          Add BullCalves
        </button>
      </div>

      {/* GRID */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {bullCalves.map((c) => (
          <div key={c.id} 
            className="relative h-80 rounded-3xl overflow-hidden shadow-xl group">

            {/* IMAGE or placeholder */}
            {c.image ? (
              <img
                src={c.image}
                alt={c.name}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                <span className="text-6xl">🐂</span>
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {/* age — top left */}
            <div className="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 text-xs rounded-full backdrop-blur-sm">
              {c.age} mo
            </div>

            {/* maturity badge — top right */}
            <div className={`absolute top-3 right-3 ${MATURITY_COLORS[c.maturityStatus] || "bg-gray-500"} text-white px-3 py-1 text-xs rounded-full`}>
              {c.maturityStatus || "Growing"}
            </div>

            {/* castrated tag */}
            {c.castrated && (
              <div className="absolute bottom-14 left-3 bg-gray-700/80 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                Castrated
              </div>
            )}

            {/* weight progress if target set */}
            {c.targetWeight && c.weight && (
              <div className="absolute bottom-14 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                {Math.min(100, Math.round((parseFloat(c.weight) / parseFloat(c.targetWeight)) * 100))}% of target
              </div>
            )}

            <Link to={`/animals/cattle/bull-calves/${c.id}`}>
              <button className="absolute bottom-4 right-4 bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition shadow-lg backdrop-blur-md">
                {c.name}
              </button>
            </Link>
          </div>
        ))}
      </div>

      {bullCalves.length === 0 && (
        <p className="text-gray-500 text-lg mt-4">No bull calves added yet.</p>
      )}
    </div>
  );
}
