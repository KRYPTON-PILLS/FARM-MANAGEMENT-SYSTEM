import { useContext } from "react";
import { FarmContext } from "../context/FarmContext";
import { Link, useNavigate } from "react-router-dom";

export default function Poultry() {
  const navigate = useNavigate();
  const { animals = [] } = useContext(FarmContext);

  const allPoultry = animals.filter((a) => a.category === "poultry" && a.type && a.name);

  const categories = [
    { key: "chicken", name: "Chicken", type: "chicken", color: "bg-yellow-500", image: "/images/Chicken.jpg", emoji: "🐔" },
    { key: "duck",    name: "Ducks",   type: "duck",    color: "bg-blue-500",   image: "/images/duck.jpg",    emoji: "🦆" },
    { key: "turkey",  name: "Turkeys", type: "turkey",  color: "bg-orange-600", image: "/images/turkey.jpg",  emoji: "🦃" },
    { key: "goose",   name: "Geese",   type: "goose",   color: "bg-teal-500",   image: "/images/goose.jpg",   emoji: "🪿" },
  ];

  return (
    <div className="min-h-screen bg-green-50 relative p-6">
      <button onClick={() => navigate(-1)}
        className="absolute -top-4 -left-[15px] z-50 bg-white shadow-md w-11 h-11 rounded-full flex items-center justify-center hover:scale-110 transition">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-700">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      <div className="mb-6 ml-14">
        <h2 className="text-3xl font-bold text-green-900">Poultry Management</h2>
        <p className="text-green-700 font-semibold mt-1">Total flocks: {allPoultry.length}</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const count = allPoultry.filter((a) => a.type?.toLowerCase() === category.type.toLowerCase()).length;
          return (
            <div key={category.key} className="relative h-72 rounded-2xl overflow-hidden shadow-xl group cursor-pointer">

              {/* Emoji fallback background */}
              <div className="absolute inset-0 z-0 bg-gradient-to-br from-yellow-100 to-yellow-300 flex items-center justify-center">
                <span className="text-7xl">{category.emoji}</span>
              </div>

              {/* Animal image */}
              <img
                src={category.image}
                alt={category.name}
                className="absolute inset-0 z-10 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />

              {/* Dark overlay */}
              <div className="absolute inset-0 z-20 bg-gradient-to-b from-black/50 via-transparent to-black/60" />

              {/* Title */}
              <div className="absolute top-4 left-4 z-30">
                <h3 className="text-white text-xl font-bold drop-shadow">
                  {category.name}
                </h3>
                <p className="text-white/90 text-sm font-semibold mt-0.5 drop-shadow">
                  Total: {count}
                </p>
              </div>

              {/* Button */}
              <div className="absolute bottom-4 right-4 z-30">
                <Link
                  to={`/animals/poultry/${category.key}`}
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
