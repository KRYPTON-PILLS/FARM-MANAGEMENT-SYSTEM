import { useContext } from "react";
import { FarmContext } from "../context/FarmContext";
import { Link, useNavigate } from "react-router-dom";

export default function Poultry() {
  const { animals = [], setAnimals } = useContext(FarmContext);
  const navigate = useNavigate();

  const categories = [
    { key: "chicken",  name: "Chicken",  image: "/images/chicken.jpg" },
    { key: "duck",   name: "Duck",   image: "/images/duck.jpg" },
    { key: "goose",   name: "Goose",   image: "/images/goose.jpg" },
    { key: "turkey", name: "Turkey", image: "/images/turkey.jpg" },
    { key: "quail",    name: "Quail",    image: "/images/quail.jpg" },
  ];

  const poultryKeys = categories.map((c) => c.key);
  const allPoultry = animals.filter((a) => poultryKeys.includes(a.category));

  /* Upload a cover image per category */
  const handleImageUpload = (e, categoryKey) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAnimals((prev) => {
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

  const getCoverImage = (cat) => {
    const stored = animals.find((a) => a.__coverKey === cat.key);
    return stored?.coverImage || cat.image;
  };

  return (
    <div className="bg-green-50 relative p-6">
      <button onClick={() => navigate(-1)}
        className="absolute -top-4 -left-[15px] z-50 bg-white shadow-md w-11 h-11 rounded-full flex items-center justify-center hover:scale-110 transition">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-green-700">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
    
        <div className="mb-6 ml-14">
            <h2 className="text-3xl font-bold text-green-900">Poultry Management</h2>
            <p className="text-green-700 font-semibold mt-1">Total poultry on farm: {allPoultry.length}</p>
        </div>


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
                    to={`/animals/poultry/${cat.key}`}
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
