import { useContext, useRef } from "react";
import { FarmContext } from "../context/FarmContext";
import { Link, useNavigate } from "react-router-dom";

export default function Cattle() {
  const navigate = useNavigate();
  const { animals = [], setAnimals } = useContext(FarmContext);
  const fileRefs = useRef({});

  const allCattle = animals.filter((a) => a.category === "cattle" && a.type && a.name && a.image);

  const categories = [
    { 
      key: "bulls",       
      name: "Bulls",       
      type: "bull",      
      desc: "Adult males",
      color: "bg-emerald-700",
      image: "/images/bull.jpg" 
    },

    { 
      key: "cows",        
      name: "Cows",        
      type: "cow",      
      desc: "Adult females",
      color: "bg-rose-500",
      image: "/images/cow.jpg" 
    },

    { 
      key: "bull-calves", 
      name: "Bull Calves", 
      type: "bull-calf", 
      desc: "Young male bull",
      color: "bg-sky-500",
      image: "/images/bullcalf.jpg" 
    },

    { 
      key: "heifers",     
      name: "Heifers",     
      type: "heifer",    
      desc: "Young female cattle",
      color: "bg-violet-500",
      image: "/images/heifer.jpg" 
    },

    { 
      key: "calves",      
      name: "Calves",      
      type: "calf",      
      desc: "Young cattle of any gender",
      color: "bg-amber-500",
      image: "/images/calf.jpg" 
    },
  ];

  const totalCattle = allCattle.length;

  /* Upload a custom cover image per category — stored in context */
  const handleCoverUpload = (e, categoryKey) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAnimals((prev) => {
        /* Store cover images in a special __covers__ sentinel object */
        const existing = prev.find((a) => a.__coverKey === categoryKey);
        if (existing) {
          return prev.map((a) =>
            a.__coverKey === categoryKey ? { ...a, coverImage: reader.result } : a
          );
        }
        return [...prev, { __coverKey: categoryKey, coverImage: reader.result }];
      });
    };
    reader.readAsDataURL(file);
  };

  const getCoverImage = (category) => {
    const stored = animals.find((a) => a.__coverKey === category.key);
    return stored?.coverImage || category.image;
  };

  return (
    <div className="min-h-screen bg-green-50 relative p-6">

      {/* BACK BUTTON */}
      <button
        onClick={() => navigate(-1)}
        className="
          absolute -top-4 -left-[15px] z-50
          bg-white shadow-md w-11 h-11 rounded-full
          flex items-center justify-center
          hover:scale-110 transition
        "
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-700">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      {/* TITLE */}
      <div className="mb-6 ml-14">
        <h2 className="text-3xl font-bold text-green-900">Cattle Management</h2>
        <p className="text-green-700 font-semibold mt-1">
          Total cattle on farm: {totalCattle}
        </p>
      </div>

      {/* CARD GRID */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const count = allCattle.filter(
            (a) => a.type?.toLowerCase() === category.type.toLowerCase()
          ).length;

          const healthy = allCattle.filter(
            (a) =>
              a.type?.toLowerCase() === category.type.toLowerCase() &&
              a.status === "Healthy"
          ).length;

          const coverSrc = getCoverImage(category);

          return (
            <div
              key={category.key}
              className="relative h-72 rounded-2xl overflow-hidden shadow-xl group cursor-pointer"
            >
              {/* FULL-BLEED IMAGE */}
              <img
                src={coverSrc}
                alt={category.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                onError={(e) => {
                  e.target.src =
                    "https://placehold.co/600x288/d1fae5/166534?text=" + category.name;
                }}
              />

              {/* DARK GRADIENT — stronger at top & bottom for legibility */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />

              {/* ── TOP LEFT: category name + counts ── */}
              <div className="absolute top-4 left-4 z-10">
                <h3 className="text-white text-xl font-bold drop-shadow">
                  {category.name}
                </h3>
                <p className="text-white/90 text-sm font-semibold mt-0.5 drop-shadow">
                  Total: {count}
                </p>
              </div>

              {/* ── TOP RIGHT: upload cover image button ── */}
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
                  onChange={(e) => handleCoverUpload(e, category.key)}
                />
              </label>

              {/* ── BOTTOM RIGHT: view button ── */}
              <div className="absolute bottom-4 right-4 z-10">
                <Link
                  to={`/animals/cattle/${category.key}`}
                  className={`${category.color} hover:opacity-90 text-white text-sm font-semibold px-5 py-2 rounded-xl shadow-lg transition`}
                >
                  {category.name}
                </Link>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
