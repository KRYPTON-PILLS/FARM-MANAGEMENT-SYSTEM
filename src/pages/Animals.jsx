import { useContext } from "react";
import { FarmContext } from "../context/FarmContext";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { uploadCoverImage } from "../utils/imageUpload.js";
import { saveCoverImage, loadCoverImages } from "../db/farmDB.js";

export default function Animals() {
  const { animals = [], setAnimals } = useContext(FarmContext);

  const categories = [
    { key: "cattle",  name: "Cattle",  image: "/images/cattle.jpg" },
    { key: "sheep",   name: "Sheep",   image: "/images/sheep.jpg" },
    { key: "goats",   name: "Goats",   image: "/images/goats.jpg" },
    { key: "poultry", name: "Poultry", image: "/images/poultry.jpg" },
    { key: "pigs",    name: "Pigs",    image: "/images/pigs.jpg" },
  ];

  // Add state at the top of the component:
const [coverImages,     setCoverImages]     = useState({});
const [uploadProgress,  setUploadProgress]  = useState({});

// Load saved covers on mount:
useEffect(() => {
  loadCoverImages()
    .then(setCoverImages)
    .catch(console.error);
}, []);

// Replace handleImageUpload:
const handleImageUpload = async (e, categoryKey) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    setUploadProgress((p) => ({ ...p, [categoryKey]: 1 }));
    const url = await uploadCoverImage(file, categoryKey,
      (pct) => setUploadProgress((p) => ({ ...p, [categoryKey]: pct }))
    );
    await saveCoverImage(categoryKey, url);
    setCoverImages((p) => ({ ...p, [categoryKey]: url }));
  } catch (err) {
    console.error("Upload failed:", err);
  } finally {
    setTimeout(() => setUploadProgress((p) => ({ ...p, [categoryKey]: null })), 1200);
  }
};

  const getCoverImage = (cat) => coverImages[cat.key] || cat.image;


  return (
    <div>
      <h2 className="text-3xl font-bold text-green-900 mb-6">
        Animals Dashboard
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const list = animals.filter(
            (a) => a.category === cat.key && !a.__coverKey
          );

          /* Status counts */
          const healthy  = list.filter((a) => a.status === "Healthy").length;
          const sick     = list.filter((a) => a.status === "Sick").length;

          const coverSrc = getCoverImage(cat);

          return (
            <div
              key={cat.key}
              className="relative h-72 rounded-2xl overflow-hidden shadow-xl group"
            >
              {/* FULL-BLEED IMAGE */}
              <img
                src={coverSrc}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                onError={(e) => {
                  e.target.src =
                    "https://placehold.co/600x288/d1fae5/166534?text=" + cat.name;
                }}
              />

              {/* GRADIENT OVERLAY */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />

              {/* ── TOP LEFT: name + counts ── */}
              <div className="absolute top-4 left-4 z-10">
                <h3 className="text-white text-xl font-bold drop-shadow">
                  {cat.name}
                </h3>
                <p className="text-white/90 text-sm font-semibold mt-0.5 drop-shadow">
                  Total: {list.length}
                </p>
              </div>

              {/* ── TOP RIGHT: upload cover ── */}
              <label
                className="
                  absolute top-3 right-3 z-10
                  bg-black/40 backdrop-blur-sm
                  text-white w-8 h-8 rounded-full
                  flex items-center justify-center
                  cursor-pointer hover:bg-black/60 transition
                "
                title="Change cover image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                  strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, cat.key)}
                />
              </label>

              {/* ── BOTTOM RIGHT: open button ── */}
              <div className="absolute bottom-4 right-4 z-10">
                <Link
                  to={`/animals/${cat.key}`}
                  className="
                    bg-green-600 hover:bg-green-500
                    text-white text-sm font-semibold
                    px-5 py-2 rounded-xl shadow-lg
                    backdrop-blur-sm transition
                  "
                >
                  {cat.name}
                </Link>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
