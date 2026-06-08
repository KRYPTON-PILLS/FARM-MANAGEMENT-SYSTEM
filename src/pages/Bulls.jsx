import { useContext, useState } from "react";
import { FarmContext } from "../context/FarmContext";
import { Link, useNavigate } from "react-router-dom";

export default function Bulls() {

  const navigate = useNavigate();

  const { animals = [], setAnimals } =
    useContext(FarmContext);

  /* ================= ONLY BULLS ================= */

  const bulls = animals.filter(
    (a) =>
      a.category === "cattle" &&
      a.type?.toLowerCase() === "bull"
  );

  /* ================= STATES ================= */

  const [name, setName] = useState("");

  const [age, setAge] = useState("");

  const [image, setImage] = useState("");

  /* ================= ADD BULL ================= */

  const addBull = () => {

    if (!name || !age || !image) return;

    const newBull = {
      id: Date.now(),

      category: "cattle",

      type: "bull",

      name,

      age,

      image,

      images: [image],

      datePurchased: "",

      purchasePrice: "",

      breed: "",

      color: "",

      status: "Healthy",

      weight: "",

      growthRecords: [],

      feedRecords: [],

      medicalLog: [],
    };

    setAnimals((prev) => [
      ...prev,
      newBull,
    ]);

    setName("");

    setAge("");

    setImage("");
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-green-50 relative p-6">

      {/* ================= BACK BUTTON ================= */}

      <button
        onClick={() => navigate(-1)}
        className="
        absolute
        -top-4
        -left-[15px]
        z-50
        bg-white
        shadow-md
        w-11
        h-11
        rounded-full
        flex
        items-center
        justify-center
        hover:scale-110
        transition
        "
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

      {/* ================= PAGE TITLE ================= */}

      <h2 className="text-3xl font-bold text-green-900 mb-6 ml-14">
        Bulls Management
      </h2>

      {/* ================= FORM ================= */}

      <div className="bg-white border rounded-2xl p-5 flex flex-wrap gap-3 shadow-sm mb-8">

        {/* NAME */}
        <input
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          placeholder="Bull Name"
          className="border p-3 rounded-lg flex-1 min-w-[200px]"
        />

        {/* AGE */}
        <input
          value={age}
          onChange={(e) =>
            setAge(e.target.value)
          }
          type="number"
          placeholder="Age"
          className="border p-3 rounded-lg w-32"
        />

        {/* IMAGE */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {

            const file =
              e.target.files?.[0];

            if (!file) return;

            const reader =
              new FileReader();

            reader.onloadend = () =>
              setImage(reader.result);

            reader.readAsDataURL(file);
          }}
          className="border p-3 rounded-lg flex-1 min-w-[220px]"
        />

        {/* BUTTON */}
        <button
          onClick={addBull}
          className="bg-green-600 text-white px-5 py-3 rounded-xl hover:bg-green-700"
        >
          Add Bull
        </button>
      </div>

      {/* ================= BULLS GRID ================= */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

      {bulls.map((b) => (

        <div
          key={b.id}
          className="
            relative
            h-80
            rounded-3xl
            overflow-hidden
            shadow-xl
            group
          "
        >

          {/* FULL IMAGE */}
          <img
            src={
              b.image ||
              "/images/placeholder.jpg"
            }
            alt={b.name}
            className="
              w-full
              h-full
              object-cover
              group-hover:scale-105
              transition
              duration-500
            "
          />

          {/* DARK OVERLAY */}
          <div className="
            absolute
            inset-0
            bg-gradient-to-t
            from-black/40
            via-transparent
            to-transparent
          " />

          {/* AGE */}
          <div className="
            absolute
            top-3
            left-3
            bg-black/60
            text-white
            px-3
            py-1
            text-xs
            rounded-full
            backdrop-blur-sm
          ">
            {b.age} yrs
          </div>

          {/* STATUS */}
          {b.status && (
            <div className="
              absolute
              top-3
              right-3
              bg-green-600
              text-white
              px-3
              py-1
              text-xs
              rounded-full
            ">
              {b.status}
            </div>
          )}

          {/* NAME BUTTON */}
          <Link
            to={`/animals/cattle/bulls/${b.id}`}
          >
            <button
              className="
                absolute
                bottom-4
                right-4
                bg-green-600
                text-white
                px-5
                py-2
                rounded-xl
                hover:bg-green-700
                transition
                shadow-lg
                backdrop-blur-md
              "
            >
              {b.name}
            </button>
          </Link>

        </div>
      ))}
    </div>
      

        {/* EMPTY */}
        {bulls.length === 0 && (
          <div className="text-gray-500 text-lg">
            No bulls available yet.
          </div>
        )}
    </div>

      

  );
}