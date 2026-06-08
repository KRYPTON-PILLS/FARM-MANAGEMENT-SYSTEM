import { useContext } from "react";
import { FarmContext } from "../context/FarmContext";
import { Link, useNavigate } from "react-router-dom";

export default function Goats() {
  const navigate = useNavigate();
  const { animals = [], setAnimals } = useContext(FarmContext);

  const allGoats = animals.filter((a) => a.category === "goat");

  const categories = [

    {
      key: "bucks",
      name: "Bucks",
      type: "buck",
      desc: "Adult males",
      image: "/images/buck.jpg",
      color: "bg-emerald-700",
    },

    {
      key: "does",
      name: "Does",
      type: "doe",
      desc: "Adult females",
      image: "/images/doe.jpg",
      color: "bg-rose-500",
    },

    {
      key: "bucklings",
      name: "Bucklings",
      type: "buckling",
      desc: "6–12 months male",
      image: "/images/buckling.jpg",
      color: "bg-sky-500",
    },

    {
      key: "doelings",
      name: "Doelings",
      type: "doeling",
      desc: "6–12 months female",
      image: "/images/doeling.jpg",
      color: "bg-pink-500",
    },

    {
      key: "kids",
      name: "Kids",
      type: "kid",
      desc: "0–6 months",
      image: "/images/kid.jpg",
      color: "bg-amber-500",
    },
    
    
    
    
  ];

  const handleCoverUpload = (e, key) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setAnimals((prev) => {
        const existing = prev.find((a) => a.__coverKey === key);

        if (existing) {
          return prev.map((a) =>
            a.__coverKey === key
              ? { ...a, coverImage: reader.result }
              : a
          );
        }

        return [
          ...prev,
          {
            __coverKey: key,
            coverImage: reader.result,
          },
        ];
      });
    };

    reader.readAsDataURL(file);
  };

  const getCover = (cat) => {
    return (
      animals.find((a) => a.__coverKey === cat.key)?.coverImage ||
      cat.image
    );
  };

  return (
    <div className="bg-green-50 min-h-screen relative p-6">
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
      <div className="mb-8 ml-14">
        <h2 className="text-3xl font-bold text-green-900">
          Goat Management
        </h2>

        <p className="text-green-700 font-semibold mt-1">
          Total goats on farm: {allGoats.length}
        </p>
      </div>

      {/* Categories */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const goatList = allGoats.filter(
            (a) => a.type?.toLowerCase() === cat.type
          );

          const count = goatList.length;

          return (
            <div
              key={cat.key}
              className="relative h-72 rounded-2xl overflow-hidden shadow-xl group"
            >
              {/* Background Image */}
              <img
                src={getCover(cat)}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                onError={(e) => {
                  e.target.src = `https://placehold.co/600x288/f0fdf4/166534?text=${cat.name}`;
                }}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />

              {/* Content */}
              <div className="absolute top-4 left-4 z-10">
                <h3 className="text-white text-xl font-bold drop-shadow">
                  {cat.name}
                </h3>

                <p className="text-white/80 text-xs mt-1">
                  {cat.desc}
                </p>

                <p className="text-white font-semibold mt-2">
                  Total: {count}
                </p>
              </div>

              {/* Upload Cover */}
              <label className="absolute top-3 right-3 z-10 bg-black/40 backdrop-blur-sm text-white w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/60 transition">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                  />
                </svg>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleCoverUpload(e, cat.key)}
                />
              </label>

              {/* View Button */}
              <div className="absolute bottom-4 left-4 z-10">
                <Link
                  to={`/animals/goats/${cat.key}`}
                  className={`${cat.color} hover:opacity-90 text-white text-sm font-semibold px-5 py-2 rounded-xl shadow-lg transition`}
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