import { useContext, useState } from "react";
import { FarmContext } from "../context/FarmContext";
import { Link, useNavigate } from "react-router-dom";
import { uploadAnimalPhoto } from "../utils/imageUpload";

const MATURITY = { Weaning:"bg-gray-400", Growing:"bg-amber-500", "Near Maturity":"bg-sky-500", Ready:"bg-green-600" };

export default function RamLambs() {
  const navigate = useNavigate();
  const { animals = [], setAnimals } = useContext(FarmContext);


  const ramLambs = animals.filter(
    (a) => a.category === "sheep" && a.type?.toLowerCase() === "ram-lamb"
  );


  const [name,setName]=useState(""); 
  const [age,setAge]=useState(""); 
  const [image,setImage]=useState("");
  const [imageUploading, setImageUploading]= useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const add = () => {
    if (!name||!age||!image) return;

    setAnimals((p) => [...p, { id:Date.now(), category:"sheep", type:"ram-lamb", name, age, image,
      dam:"", sire:"", breed:"", color:"", status:"Healthy", maturityStatus:"Growing",
      weight:"", targetWeight:"", weaningDate:"",
      growthRecords:[], feedRecords:[], medicalLog:[], drenchingRecords:[] }]);
    setName(""); setAge(""); setImage("");
  };

  /* =--- Image upload ---- */
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImageUploading(true);
      setUploadProgress(0);
      const url = await uploadAnimalPhoto(file, "sheep",
        (pct) => setUploadProgress(pct)
      );
      setImage(url);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Image upload failed. You can still add the ram without a photo.");
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <div className="bg-green-50 relative p-6">

      {/* BACK BUTTON */}
      <button onClick={() => navigate(-1)} className="absolute -top-4 -left-[15px] z-50 bg-white shadow-md w-11 h-11 rounded-full flex items-center justify-center hover:scale-110 transition">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
          strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-700">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      {/* TITLE */}
      <h2 className="text-3xl font-bold text-green-900 mb-6 ml-14">Ram Lambs</h2>

      {/* FORM */}
      <div className="bg-white border rounded-2xl p-5 flex flex-wrap gap-3 shadow-sm mb-8">

        {/* NAME */}
        <input 
          value={name} 
          onChange={(e)=>setName(e.target.value)} 
          placeholder="Name" 
          className="border p-3 rounded-lg flex-1 min-w-[180px]" 
        />

        {/* AGE */}
        <input 
          value={age} 
          onChange={(e)=>setAge(e.target.value)} 
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
            <p className="text-xs text-green-600 font-semibold">
              ✅ Photo ready
            </p>
          )}
        </div>

        {/* ADD BUTTON  */}
        <button 
          onClick={add} 
          disabled={!name || !age}
          className="bg-emerald-700 text-white px-5 py-3 rounded-xl hover:bg-emerald-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          Add RamLamb
        </button>
      </div>


      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {ramLambs.map((r) => (
          <div key={r.id} 
            className="relative h-80 rounded-3xl overflow-hidden shadow-xl group">

            {/* IMAGE or placeholder */}
            {r.image ? (
              <img
                src={r.image}
                alt={r.name}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                <span className="text-6xl">🐏</span>
              </div>
            )}

            {/* OVERLAY */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            
            {/*  AGE */}
            <div className="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 text-xs rounded-full backdrop-blur-sm">
              {r.age} mo
            </div>

            {/* STATUS */}
            <div className={`absolute top-3 right-3 ${MATURITY[r.maturityStatus]||"bg-gray-500"} text-white px-3 py-1 text-xs rounded-full`}>{r.maturityStatus||"Growing"}</div>
            {r.targetWeight && r.weight && <div className="absolute bottom-14 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">{Math.min(100,Math.round((parseFloat(r.weight)/parseFloat(r.targetWeight))*100))}% of target</div>}
            <Link to={`/animals/sheep/ram-lambs/${r.id}`}><button className="absolute bottom-4 right-4 bg-sky-600 text-white px-5 py-2 rounded-xl hover:bg-sky-700 transition shadow-lg">{r.name}</button></Link>
          </div>
        ))}
      </div>
      {ramLambs.length===0 && <p className="text-gray-500 text-lg mt-4">No ram lambs added yet.</p>}
    </div>
  );
}