import { useContext } from "react";
import { FarmContext } from "../context/FarmContext";
import { Link, useNavigate } from "react-router-dom";

export default function Goats() {
  const navigate = useNavigate();
  const { animals = [] } = useContext(FarmContext);

  const allGoats = animals.filter((a) => a.category === "goats" && a.type && a.name);

  const categories = [
    { key: "bucks",     name: "Bucks",     type: "buck",     color: "bg-orange-500",  image: "/images/Buck.jpg",     emoji: "🐐" },
    { key: "does",      name: "Does",      type: "doe",      color: "bg-pink-500",    image: "/images/Doe.jpg",      emoji: "🐐" },
    { key: "bucklings", name: "Bucklings", type: "buckling", color: "bg-sky-500",     image: "/images/Buckling.jpg", emoji: "🐐" },
    { key: "doelings",  name: "Doelings",  type: "doeling",  color: "bg-fuchsia-500", image: "/images/Doeling.jpg",  emoji: "🐐" },
    { key: "kids",      name: "Kids",      type: "kid",      color: "bg-lime-500",    image: "/images/Kid.jpg",      emoji: "🐐" },
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
        <h2 className="text-3xl font-bold text-green-900">Goats Management</h2>
        <p className="text-green-700 font-semibold mt-1">Total goats on farm: {allGoats.length}</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const count = allGoats.filter((a) => a.type?.toLowerCase() === category.type.toLowerCase()).length;
          return (
            <div key={category.key} className="relative h-72 rounded-2xl overflow-hidden shadow-xl group cursor-pointer">
              <img src={category.image} alt={category.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                onError={(e) => { e.target.style.display = "none"; }} />
              <div className="absolute inset-0 bg-gradient-to-br from-green-200 to-green-400 -z-10 flex items-center justify-center">
                <span className="text-7xl">{category.emoji}</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />
              <div className="absolute top-4 left-4 z-10">
                <h3 className="text-white text-xl font-bold drop-shadow">{category.name}</h3>
                <p className="text-white/90 text-sm font-semibold mt-0.5 drop-shadow">Total: {count}</p>
              </div>
              <div className="absolute bottom-4 right-4 z-10">
                <Link to={`/animals/goats/${category.key}`}
                  className={`${category.color} hover:opacity-90 text-white text-sm font-semibold px-5 py-2 rounded-xl shadow-lg transition`}>
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
