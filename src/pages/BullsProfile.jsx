import { useParams, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { FarmContext } from "../context/FarmContext";
import SellAnimalModal from "../components/SellAnimalModal";
import { uploadAnimalPhoto } from "../utils/imageUpload.js";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";


/* ─── Modal shell ─── */
function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-4xl" : "max-w-lg"} max-h-[92vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-green-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ─── Field wrapper ─── */
const Field = ({ label, children }) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{label}</label>
    {children}
  </div>
);

/* ─── Health scale 1-5 ─── */
const HEALTH_LABELS = {
  1: { label: "Critical",  color: "bg-red-600",    text: "text-red-700" },
  2: { label: "Poor",      color: "bg-orange-500",  text: "text-orange-600" },
  3: { label: "Fair",      color: "bg-yellow-400",  text: "text-yellow-600" },
  4: { label: "Good",      color: "bg-lime-500",    text: "text-lime-700" },
  5: { label: "Excellent", color: "bg-green-600",   text: "text-green-700" },
};

function HealthPicker({ value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {[1, 2, 3, 4, 5].map((n) => {
        const h = HEALTH_LABELS[n];
        const active = value === n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`
              flex flex-col items-center justify-center
              w-14 h-14 rounded-xl border-2 transition
              ${active ? `${h.color} text-white border-transparent shadow-md` : "bg-gray-50 border-gray-200 hover:border-gray-400"}
            `}
          >
            <span className="text-lg font-bold">{n}</span>
            <span className="text-[9px] font-semibold uppercase leading-tight">{h.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Health badge (display only) ─── */
function HealthBadge({ score }) {
  if (!score) return <span className="text-gray-300 text-xs">—</span>;
  const h = HEALTH_LABELS[score];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${h.color} text-white`}>
      {score}/5 {h.label}
    </span>
  );
}

/* ─── Chart metric toggle ─── */
const METRICS = [
  { key: "weight",   label: "Weight (kg)",    color: "#16a34a", yLabel: "kg" },
  { key: "price",    label: "Est. Price (KES)", color: "#d97706", yLabel: "KES" },
  { key: "health",   label: "Health Score",   color: "#2563eb", yLabel: "/5" },
];

export default function BullsProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { animals = [], setAnimals } = useContext(FarmContext);

  const bull = animals.find(
    (a) => a.id?.toString() === id && a.category === "cattle" && a.type?.toLowerCase() === "bull"
  );

  const updateBull = (updated) =>
    setAnimals((prev) => prev.map((a) => (a.id?.toString() === id ? updated : a)));

  /* ── edit state ── */
  const [isEditing, setIsEditing] = useState(false);
  const [editedBull, setEditedBull] = useState(null);


  /* ── modal ── */
  const [modal, setModal] = useState(null);
  const [showSellModal, setShowSellModal] = useState(false);

  /* ── chart active metrics (multi-select) ── */
  const [activeMetrics, setActiveMetrics] = useState(["weight"]);

  /* ── new record form ── */
  const [newGrowth, setNewGrowth] = useState({
    date: "", weight: "", price: "", health: 0, notes: "",
  });
  const [newFeed, setNewFeed] = useState({
    date: "", feedType: "", amount: "", minerals: "", notes: "",
  });
  const [newMedical, setNewMedical] = useState({
    date: "", type: "", medicine: "", vetName: "", cost: "", notes: "",
  });

  if (!bull) return <p className="p-6 text-red-600">Bull not found.</p>;

  const growthRecords = bull.growthRecords || [];
  const feedRecords   = bull.feedRecords   || [];
  const medicalLog    = bull.medicalLog    || [];

  /* ── edit helpers ── */
  const startEditing  = () => { setIsEditing(true); setEditedBull({ ...bull }); };
  const cancelEditing = () => { setIsEditing(false); setEditedBull(null); };
  const saveChanges   = () => { updateBull(editedBull); setIsEditing(false); setEditedBull(null); };
  const updateField   = (f, v) => setEditedBull((p) => ({ ...p, [f]: v }));

  /* ── image upload ── */
  const [photoUploading,  setPhotoUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhotoUploading(true);
      const url = await uploadAnimalPhoto(file, "cattle");
      updateBull({ ...bull, image: url });
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setPhotoUploading(false);
    }
  };


  /* ── Status change — intercept "Sold" to show sell modal ── */
  const handleStatusChange = (newStatus) => {
    if (newStatus === "Sold") {
      setShowSellModal(true);
    } else {
      updateField("status", newStatus);
    }
  };
  
    

  /* ── add / delete records ── */
  const addGrowth = () => {
    if (!newGrowth.date || !newGrowth.weight) return;
    const updated = [...growthRecords, { ...newGrowth, id: Date.now() }];
    updateBull({ ...bull, growthRecords: updated });
    setNewGrowth({ date: "", weight: "", price: "", health: 0, notes: "" });
    setModal("viewGrowth");
  };
  const deleteGrowth = (rid) =>
    updateBull({ ...bull, growthRecords: growthRecords.filter((r) => r.id !== rid) });

  /* --- add/delete feed --- */
  const addFeed = () => {
    if (!newFeed.date || !newFeed.feedType) return;
    const updated = [...feedRecords, { ...newFeed, id: Date.now() }];
    updateBull({ ...bull, feedRecords: updated });
    setNewFeed({ date: "", feedType: "", amount: "", minerals: "", notes: "" });
    setModal("viewFeed");
  };
  const deleteFeed = (rid) =>
    updateBull({ ...bull, feedRecords: feedRecords.filter((r) => r.id !== rid) });

  /* --- add/delete medical --- */
  const addMedical = () => {
    if (!newMedical.date || !newMedical.type) return;
    const updated = [...medicalLog, { ...newMedical, id: Date.now() }];
    updateBull({ ...bull, medicalLog: updated });
    setNewMedical({ date: "", type: "", medicine: "", vetName: "", cost: "", notes: "" });
    setModal("viewMedical");
  };
  const deleteMedical = (rid) =>
    updateBull({ ...bull, medicalLog: medicalLog.filter((r) => r.id !== rid) });

  /* ── chart: sorted & cleaned ── */
  const chartData = [...growthRecords]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((r) => ({
      date: r.date,
      weight: r.weight ? parseFloat(r.weight) : null,
      price:  r.price  ? parseFloat(r.price)  : null,
      health: r.health ? parseFloat(r.health) : null,
    }));

  /* ── metric toggle ── */
  const toggleMetric = (key) => {
    setActiveMetrics((prev) =>
      prev.includes(key)
        ? prev.length > 1 ? prev.filter((k) => k !== key) : prev   // keep at least 1
        : [...prev, key]
    );
  };

  /* ── summary stats ── */
  const weights = growthRecords.map((r) => parseFloat(r.weight)).filter(Boolean);
  const prices  = growthRecords.map((r) => parseFloat(r.price)).filter(Boolean);
  const avgHealth = growthRecords.length
    ? (growthRecords.reduce((s, r) => s + (r.health || 0), 0) / growthRecords.filter((r) => r.health).length || 0).toFixed(1)
    : null;

  /* ── status badge ── */
  const statusColor = {
    Healthy: "bg-green-100 text-green-800",
    Sick: "bg-red-100 text-red-700",
    "Under Treatment": "bg-amber-100 text-amber-700",
    Sold: "bg-gray-100 text-gray-600",
  }[bull.status] || "bg-gray-100 text-gray-600";

  /* ════════════════════════════ UI ════════════════════════════ */
  return (
    <div className="bg-green-50 flex flex-col">

      {/* TOP BAR */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-white shadow-sm flex-wrap">
        <button onClick={() => navigate(-1)}
          className="bg-white shadow w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-green-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="text-xl sm:text-2xl font-bold text-green-900">Bull Profile</h2>
        <span className={`ml-auto text-xs font-semibold px-3 py-1 rounded-full ${statusColor}`}>
          {bull.status || "Unknown"}
        </span>
      </div>

      {/* BODY */}
      <div className="flex flex-1 gap-6 p-4 sm:p-6 flex-col lg:flex-row">

        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-4 w-full lg:w-72 lg:shrink-0">

          {/* IMAGE */}
          <div className="relative h-56 sm:h-72 rounded-2xl overflow-hidden shadow-lg bg-gray-100 group">
            {bull.image
              ? <img src={bull.image} alt={bull.name} className="w-full h-full object-cover" />
              : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No image</div>
            }

            // Show uploading state on the image:
            {photoUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">Uploading…</span>
              </div>
            )}


            <label className="absolute inset-0 flex items-end justify-center pb-4 bg-black/0 group-hover:bg-black/30 transition cursor-pointer">
              <span className="opacity-0 group-hover:opacity-100 transition bg-white/90 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                Change photo
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>

          {/* QUICK STATS */}
          <div className="bg-white rounded-2xl shadow p-4 space-y-2 text-sm">
            {[
              { label: "Breed",  field: "breed" },
              { label: "Color",  field: "color" },
              { label: "Weight", field: "weight", suffix: " kg" },
              { label: "Age",    field: "age",    suffix: " yrs" },
            ].map(({ label, field, suffix = "" }) => (
              <div key={field} className="flex justify-between items-center border-b last:border-0 pb-1 last:pb-0">
                <span className="text-gray-500 font-medium">{label}</span>
                {isEditing ? (
                  <input value={editedBull[field] || ""}
                    onChange={(e) => updateField(field, e.target.value)}
                    className="border rounded px-2 py-0.5 w-28 text-right text-sm" />
                ) : (
                  <span className="text-green-900 font-semibold">
                    {bull[field] ? `${bull[field]}${suffix}` : <span className="text-gray-300">—</span>}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* PURCHASE INFO */}
          <div className="bg-white rounded-2xl shadow p-4 space-y-2 text-sm">
            <p className="font-semibold text-gray-500 text-xs uppercase mb-1">Purchase Info</p>
            {[
              { label: "Date",  field: "datePurchased" },
              { label: "Price", field: "purchasePrice", prefix: "KES " },
            ].map(({ label, field, prefix = "" }) => (
              <div key={field} className="flex justify-between items-center border-b last:border-0 pb-1 last:pb-0">
                <span className="text-gray-500">{label}</span>
                {isEditing ? (
                  <input value={editedBull[field] || ""}
                    onChange={(e) => updateField(field, e.target.value)}
                    className="border rounded px-2 py-0.5 w-28 text-right text-sm" />
                ) : (
                  <span className="text-green-900 font-semibold">
                    {bull[field] ? `${prefix}${bull[field]}` : <span className="text-gray-300">—</span>}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* ── SELL BUTTON ── */}
          {bull.status !== "Sold" && (
            <button
              onClick={() => setShowSellModal(true)}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition shadow text-sm flex items-center justify-center gap-2"
            >
              💰 Sell this Bull
            </button>
          )}

          {bull.status === "Sold" && (
            <div className="bg-gray-100 rounded-xl px-4 py-3 text-center text-sm text-gray-500 font-semibold">
              ✅ This bull has been sold
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex-1 flex flex-col gap-4">

          {/* NAME + EDIT */}
          <div className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Name</p>
                {isEditing
                  ? <input value={editedBull.name || ""} onChange={(e) => updateField("name", e.target.value)}
                      className="text-xl sm:text-2xl font-bold border-b border-green-400 outline-none w-full" />
                  : <h3 className="text-xl sm:text-2xl font-bold text-green-900">{bull.name}</h3>
                }
              </div>
              {!isEditing
                ? <button onClick={startEditing} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700 transition">Edit Profile</button>
                : <div className="flex gap-2">
                    <button onClick={saveChanges}   className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700">Save</button>
                    <button onClick={cancelEditing} className="bg-red-500  text-white px-4 py-2 rounded-xl text-sm hover:bg-red-600">Cancel</button>
                  </div>
              }
            </div>

            {isEditing && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Status</p>
                <select 
                  value={editedBull.status || ""} 
                  onChange={(e) => updateField(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm w-48"
                >

                  {["Healthy", "Sick", "Under Treatment", "Sold"].map((s) => <option key={s}>{s}</option>)}
                </select>
                {editedBull.status !== "Sold" && (
                  <p className="text-xs text-gray-400 mt-1">
                    Select "Sold" to record a sale - a form will appear to capture the <details className=""></details>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ACTION CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">

            {/* GROWTH */}
            <div className="bg-white rounded-2xl shadow p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Growth Records</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-800 mt-0.5">{growthRecords.length}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#2563eb" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                </div>
              </div>
              {growthRecords.length > 0 && (
                <div className="text-xs text-gray-500 space-y-0.5">
                  <p>Latest: <span className="font-semibold text-green-700">{growthRecords.at(-1).weight} kg</span></p>
                  {growthRecords.at(-1).price && <p>Est. price: <span className="font-semibold text-amber-700">KES {growthRecords.at(-1).price}</span></p>}
                  {growthRecords.at(-1).health > 0 && <HealthBadge score={growthRecords.at(-1).health} />}
                </div>
              )}
              <div className="flex gap-2 mt-auto">
                <button onClick={() => setModal("growth")} className="flex-1 bg-blue-600 text-white text-xs py-2 rounded-lg hover:bg-blue-700 transition">+ Add</button>
                <button onClick={() => setModal("viewGrowth")} className="flex-1 bg-blue-50 text-blue-700 text-xs py-2 rounded-lg hover:bg-blue-100 transition">View all</button>
              </div>
            </div>

            {/* FEED */}
            <div className="bg-white rounded-2xl shadow p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Feed Records</p>
                  <p className="text-xl sm:text-2xl font-bold text-amber-700 mt-0.5">{feedRecords.length}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#d97706" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                </div>
              </div>
              {feedRecords.length > 0 && (
                <p className="text-xs text-gray-500">Latest: <span className="font-semibold text-amber-700">{feedRecords.at(-1).feedType}</span> on {feedRecords.at(-1).date}</p>
              )}
              <div className="flex gap-2 mt-auto">
                <button onClick={() => setModal("feed")} className="flex-1 bg-amber-500 text-white text-xs py-2 rounded-lg hover:bg-amber-600 transition">+ Add</button>
                <button onClick={() => setModal("viewFeed")} className="flex-1 bg-amber-50 text-amber-700 text-xs py-2 rounded-lg hover:bg-amber-100 transition">View all</button>
              </div>
            </div>

            {/* MEDICAL */}
            <div className="bg-white rounded-2xl shadow p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Medical Log</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-700 mt-0.5">{medicalLog.length}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#dc2626" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                  </svg>
                </div>
              </div>
              {medicalLog.length > 0 && (
                <p className="text-xs text-gray-500">Latest: <span className="font-semibold text-red-700">{medicalLog.at(-1).type}</span> on {medicalLog.at(-1).date}</p>
              )}
              <div className="flex gap-2 mt-auto">
                <button onClick={() => setModal("medical")} className="flex-1 bg-red-600 text-white text-xs py-2 rounded-lg hover:bg-red-700 transition">+ Add</button>
                <button onClick={() => setModal("viewMedical")} className="flex-1 bg-red-50 text-red-700 text-xs py-2 rounded-lg hover:bg-red-100 transition">View all</button>
              </div>
            </div>
          </div>

          {/* ── GROWTH ANALYTICS ── */}
          {growthRecords.length > 0 && (
            <div className="bg-white rounded-2xl shadow p-5">

              {/* Header + summary chips */}
              <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-2">Growth Analytics</p>
                  <div className="flex flex-wrap gap-2">
                    {weights.length > 0 && (
                      <span className="text-xs bg-green-50 text-green-800 px-2 py-1 rounded-lg font-semibold">
                        Weight: {Math.min(...weights)}–{Math.max(...weights)} kg
                      </span>
                    )}
                    {prices.length > 0 && (
                      <span className="text-xs bg-amber-50 text-amber-800 px-2 py-1 rounded-lg font-semibold">
                        Est. Price: KES {Math.min(...prices).toLocaleString()}–{Math.max(...prices).toLocaleString()}
                      </span>
                    )}
                    {avgHealth && (
                      <span className="text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded-lg font-semibold">
                        Avg Health: {avgHealth}/5
                      </span>
                    )}
                  </div>
                </div>

                {/* Metric toggle buttons */}
                <div className="flex gap-2 flex-wrap">
                  {/* ALL toggle */}
                  {(() => {
                    const allActive = METRICS.every((m) => activeMetrics.includes(m.key));
                    return (
                      <button
                        onClick={() => setActiveMetrics(allActive ? ["weight"] : METRICS.map((m) => m.key))}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition ${
                          allActive
                            ? "bg-gray-800 text-white border-transparent shadow-sm"
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        All
                      </button>
                    );
                  })()}
                  {METRICS.map((m) => {
                    const active = activeMetrics.includes(m.key);
                    return (
                      <button key={m.key} onClick={() => toggleMetric(m.key)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition ${
                          active
                            ? "text-white border-transparent shadow-sm"
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                        }`}
                        style={active ? { backgroundColor: m.color, borderColor: m.color } : {}}>
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chart */}
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f0fdf4" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "10px", fontSize: "12px" }}
                    formatter={(val, name) => {
                      const m = METRICS.find((x) => x.key === name);
                      return [`${val}${m ? " " + m.yLabel : ""}`, m?.label || name];
                    }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                  {METRICS.filter((m) => activeMetrics.includes(m.key)).map((m) => (
                    <Line
                      key={m.key}
                      type="monotone"
                      dataKey={m.key}
                      name={m.key}
                      stroke={m.color}
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>

              {/* ── SCROLLABLE DATA TABLE ── */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">All Entries</p>
                  <span className="text-xs text-gray-400">{growthRecords.length} record{growthRecords.length !== 1 ? "s" : ""} · scroll to see all</span>
                </div>
                <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  {/* horizontal scroll wrapper */}
                  <div className="overflow-x-auto">
                    {/* vertical scroll wrapper — fixed height shows ~5 rows then scrolls */}
                    <div
                      className="overflow-y-auto"
                      style={{ maxHeight: "220px" }}
                    >
                      <table className="w-full text-sm min-w-[580px]">
                        <thead>
                          <tr className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                            {["Date", "Weight (kg)", "Est. Price (KES)", "Health", "Notes", ""].map((h) => (
                              <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap border-b border-gray-200">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {[...growthRecords].reverse().map((r, i) => (
                            <tr
                              key={r.id}
                              className={`transition hover:bg-green-50/50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}
                            >
                              <td className="px-4 py-2.5 whitespace-nowrap text-gray-700 font-medium text-xs">{r.date}</td>
                              <td className="px-4 py-2.5 whitespace-nowrap">
                                {r.weight
                                  ? <span className="font-bold text-green-700">{parseFloat(r.weight).toLocaleString()} kg</span>
                                  : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-4 py-2.5 whitespace-nowrap">
                                {r.price
                                  ? <span className="font-bold text-amber-700">KES {parseFloat(r.price).toLocaleString()}</span>
                                  : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-4 py-2.5">
                                {r.health > 0
                                  ? <HealthBadge score={r.health} />
                                  : <span className="text-gray-300 text-xs">—</span>}
                              </td>
                              <td className="px-4 py-2.5 text-gray-500 italic text-xs max-w-[180px]">
                                <span className="block truncate" title={r.notes || ""}>{r.notes || "—"}</span>
                              </td>
                              <td className="px-4 py-2.5">
                                <button
                                  onClick={() => deleteGrowth(r.id)}
                                  className="text-gray-300 hover:text-red-500 transition text-lg leading-none"
                                  title="Delete record"
                                >
                                  &times;
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* scroll hint gradient fade at bottom */}
                  {growthRecords.length > 4 && (
                    <div className="h-5 bg-gradient-to-t from-gray-100 to-transparent pointer-events-none -mt-5 relative z-10" />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ SELL ANIMAL MODAL ══ */}
      {showSellModal && (
        <SellAnimalModal
          animal={bull}
          species="Cattle"
          onConfirm={() => {      
            updateBull({ ...bull, status: "Sold" });
            setShowSellModal(false);
            if (isEditing) { setIsEditing(false); setEditedBull(null); }
          }}
          onCancel={() => {
            setShowSellModal(false);
            if (isEditing && editedBull) updateField("status", bull.status);
          }}
        />
      )}      

      {/* ══════════════════ MODALS ══════════════════ */}

      {/* ADD GROWTH */}
      {modal === "growth" && (
        <Modal title="Add Growth Record" onClose={() => setModal(null)}>
          <Field label="Date">
            <input type="date" value={newGrowth.date}
              onChange={(e) => setNewGrowth({ ...newGrowth, date: e.target.value })}
              className="border rounded-lg p-2 w-full" />
          </Field>
          <Field label="Weight (kg)">
            <input type="number" placeholder="e.g. 320" value={newGrowth.weight}
              onChange={(e) => setNewGrowth({ ...newGrowth, weight: e.target.value })}
              className="border rounded-lg p-2 w-full" />
          </Field>
          <Field label="Estimated Price (KES)">
            <input type="number" placeholder="e.g. 85000" value={newGrowth.price}
              onChange={(e) => setNewGrowth({ ...newGrowth, price: e.target.value })}
              className="border rounded-lg p-2 w-full" />
          </Field>
          <Field label="Health Condition (1 = Critical · 5 = Excellent)">
            <HealthPicker value={newGrowth.health} onChange={(v) => setNewGrowth({ ...newGrowth, health: v })} />
          </Field>
          <Field label="Notes (optional)">
            <textarea placeholder="Any observations..." value={newGrowth.notes}
              onChange={(e) => setNewGrowth({ ...newGrowth, notes: e.target.value })}
              className="border rounded-lg p-2 w-full h-20 resize-none" />
          </Field>
          <div className="flex gap-3 pt-2">
            <button onClick={addGrowth}
              className="flex-1 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition font-semibold">
              Save Record
            </button>
            <button onClick={() => setModal(null)}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl hover:bg-gray-200 transition">
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* VIEW GROWTH (cards list) */}
      {modal === "viewGrowth" && (
        <Modal title={`Growth Records — ${growthRecords.length} entries`} onClose={() => setModal(null)}>
          <button onClick={() => setModal("growth")}
            className="mb-4 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700 transition">
            + Add new record
          </button>
          {growthRecords.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No growth records yet.</p>
          ) : (
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {[...growthRecords].reverse().map((r) => (
                <div key={r.id} className="bg-blue-50 rounded-xl p-3 flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="font-semibold text-blue-900">{r.weight} kg</span>
                      {r.price && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">KES {parseFloat(r.price).toLocaleString()}</span>}
                      {r.health > 0 && <HealthBadge score={r.health} />}
                    </div>
                    <p className="text-xs text-gray-500">{r.date}</p>
                    {r.notes && <p className="text-xs text-gray-600 italic">{r.notes}</p>}
                  </div>
                  <button onClick={() => deleteGrowth(r.id)} className="text-red-400 hover:text-red-600 text-lg leading-none ml-3">&times;</button>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* ADD FEED */}
      {modal === "feed" && (
        <Modal title="Add Feed Record" onClose={() => setModal(null)}>
          <Field label="Date">
            <input type="date" value={newFeed.date}
              onChange={(e) => setNewFeed({ ...newFeed, date: e.target.value })}
              className="border rounded-lg p-2 w-full" />
          </Field>
          <Field label="Feed Type">
            <input placeholder="e.g. Hay, Silage, Concentrates" value={newFeed.feedType}
              onChange={(e) => setNewFeed({ ...newFeed, feedType: e.target.value })}
              className="border rounded-lg p-2 w-full" />
          </Field>
          <Field label="Amount (kg)">
            <input type="number" placeholder="e.g. 10" value={newFeed.amount}
              onChange={(e) => setNewFeed({ ...newFeed, amount: e.target.value })}
              className="border rounded-lg p-2 w-full" />
          </Field>
          <Field label="Minerals / Supplements">
            <input placeholder="e.g. Calcium, Salt lick" value={newFeed.minerals}
              onChange={(e) => setNewFeed({ ...newFeed, minerals: e.target.value })}
              className="border rounded-lg p-2 w-full" />
          </Field>
          <Field label="Notes (optional)">
            <textarea value={newFeed.notes}
              onChange={(e) => setNewFeed({ ...newFeed, notes: e.target.value })}
              className="border rounded-lg p-2 w-full h-16 resize-none" />
          </Field>
          <div className="flex gap-3 pt-2">
            <button onClick={addFeed} className="flex-1 bg-amber-500 text-white py-2 rounded-xl hover:bg-amber-600 transition font-semibold">Save Record</button>
            <button onClick={() => setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl hover:bg-gray-200 transition">Cancel</button>
          </div>
        </Modal>
      )}

      {/* VIEW FEED */}
      {modal === "viewFeed" && (
        <Modal title={`Feed Records — ${feedRecords.length} entries`} onClose={() => setModal(null)}>
          <button onClick={() => setModal("feed")} className="mb-4 bg-amber-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-amber-600 transition">+ Add new record</button>
          {feedRecords.length === 0
            ? <p className="text-gray-400 text-center py-8">No feed records yet.</p>
            : <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                {[...feedRecords].reverse().map((r) => (
                  <div key={r.id} className="bg-amber-50 rounded-xl p-3 flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-amber-900">{r.feedType}</p>
                      <p className="text-xs text-gray-500">{r.date}{r.amount ? ` · ${r.amount} kg` : ""}</p>
                      {r.minerals && <p className="text-xs text-gray-600 mt-0.5">Supplements: {r.minerals}</p>}
                      {r.notes && <p className="text-xs text-gray-500 mt-0.5 italic">{r.notes}</p>}
                    </div>
                    <button onClick={() => deleteFeed(r.id)} className="text-red-400 hover:text-red-600 text-lg leading-none ml-3">&times;</button>
                  </div>
                ))}
              </div>
          }
        </Modal>
      )}

      {/* ADD MEDICAL */}
      {modal === "medical" && (
        <Modal title="Add Medical Record" onClose={() => setModal(null)}>
          <Field label="Date">
            <input type="date" value={newMedical.date}
              onChange={(e) => setNewMedical({ ...newMedical, date: e.target.value })}
              className="border rounded-lg p-2 w-full" />
          </Field>
          <Field label="Type">
            <select value={newMedical.type} onChange={(e) => setNewMedical({ ...newMedical, type: e.target.value })}
              className="border rounded-lg p-2 w-full">
              <option value="">Select type...</option>
              {["Vaccination", "Deworming", "Treatment", "Surgery", "Checkup", "Other"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Medicine / Vaccine">
            <input placeholder="e.g. Ivermectin, FMD vaccine" value={newMedical.medicine}
              onChange={(e) => setNewMedical({ ...newMedical, medicine: e.target.value })}
              className="border rounded-lg p-2 w-full" />
          </Field>
          <Field label="Vet Name">
            <input placeholder="e.g. Dr. Kamau" value={newMedical.vetName}
              onChange={(e) => setNewMedical({ ...newMedical, vetName: e.target.value })}
              className="border rounded-lg p-2 w-full" />
          </Field>
          <Field label="Cost (KES)">
            <input type="number" placeholder="e.g. 1500" value={newMedical.cost}
              onChange={(e) => setNewMedical({ ...newMedical, cost: e.target.value })}
              className="border rounded-lg p-2 w-full" />
          </Field>
          <Field label="Notes">
            <textarea placeholder="Diagnosis, observations..." value={newMedical.notes}
              onChange={(e) => setNewMedical({ ...newMedical, notes: e.target.value })}
              className="border rounded-lg p-2 w-full h-20 resize-none" />
          </Field>
          <div className="flex gap-3 pt-2">
            <button onClick={addMedical} className="flex-1 bg-red-600 text-white py-2 rounded-xl hover:bg-red-700 transition font-semibold">Save Record</button>
            <button onClick={() => setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl hover:bg-gray-200 transition">Cancel</button>
          </div>
        </Modal>
      )}

      {/* VIEW MEDICAL */}
      {modal === "viewMedical" && (
        <Modal title={`Medical Log — ${medicalLog.length} entries`} onClose={() => setModal(null)}>
          <button onClick={() => setModal("medical")} className="mb-4 bg-red-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-red-700 transition">+ Add new record</button>
          {medicalLog.length === 0
            ? <p className="text-gray-400 text-center py-8">No medical records yet.</p>
            : <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                {[...medicalLog].reverse().map((r) => (
                  <div key={r.id} className="bg-red-50 rounded-xl p-3 flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-red-900">{r.type}</p>
                      <p className="text-xs text-gray-500">{r.date}{r.vetName ? ` · ${r.vetName}` : ""}</p>
                      {r.medicine && <p className="text-xs text-gray-600 mt-0.5">Medicine: {r.medicine}</p>}
                      {r.cost && <p className="text-xs text-gray-600 mt-0.5">Cost: KES {r.cost}</p>}
                      {r.notes && <p className="text-xs text-gray-500 mt-0.5 italic">{r.notes}</p>}
                    </div>
                    <button onClick={() => deleteMedical(r.id)} className="text-red-400 hover:text-red-600 text-lg leading-none ml-3">&times;</button>
                  </div>
                ))}
              </div>
          }
        </Modal>
      )}

    </div>
  );
}
