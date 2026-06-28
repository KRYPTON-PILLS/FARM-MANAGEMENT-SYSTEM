import { useContext } from "react";
import { FarmContext } from "../context/FarmContext";
import { Link } from "react-router-dom";

export default function Animals() {
  const { animals = [] } = useContext(FarmContext);

  const categories = [
    { key: "cattle",  name: "Cattle",  image: "/images/Cattle.jpg",  emoji: "🐄" },
    { key: "sheep",   name: "Sheep",   image: "/images/Sheep.jpg",   emoji: "🐑" },
    { key: "goats",   name: "Goats",   image: "/images/Goats.jpg",   emoji: "🐐" },
    { key: "poultry", name: "Poultry", image: "/images/Poultry.jpg", emoji: "🐔" },
    { key: "pigs",    name: "Pigs",    image: "/images/Pigs.jpg",    emoji: "🐷" },
  ];

  return (
    <div>
      <h2 className="text-3xl font-bold text-green-900 mb-6">Animals Dashboard</h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const list    = animals.filter((a) => a.category === cat.key && !a.__coverKey);
          const healthy = list.filter((a) => a.status === "Healthy").length;
          const sick    = list.filter((a) => a.status === "Sick").length;

          return (
            <div key={cat.key} className="relative h-72 rounded-2xl overflow-hidden shadow-xl group">

              {/* FIXED IMAGE */}
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />

              {/* Fallback if no image file */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-200 to-green-400 -z-10 flex items-center justify-center">
                <span className="text-7xl">{cat.emoji}</span>
              </div>

              {/* GRADIENT OVERLAY */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />

              {/* TOP LEFT: name + counts */}
              <div className="absolute top-4 left-4 z-10">
                <h3 className="text-white text-xl font-bold drop-shadow">{cat.name}</h3>
                <p className="text-white/90 text-sm font-semibold mt-0.5 drop-shadow">
                  Total: {list.length}
                </p>
                {sick > 0 && (
                  <p className="text-red-300 text-xs font-semibold mt-0.5">⚠ {sick} sick</p>
                )}
              </div>

              {/* BOTTOM RIGHT: navigate button */}
              <div className="absolute bottom-4 right-4 z-10">
                <Link
                  to={`/animals/${cat.key}`}
                  className="bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-5 py-2 rounded-xl shadow-lg backdrop-blur-sm transition"
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
