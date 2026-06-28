import { useParams, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { FarmContext } from "../context/FarmContext";
import SellAnimalModal from "../components/SellAnimalModal";
import { uploadAnimalPhoto } from "../utils/imageUpload";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

/* ─── Modal shell ─── */
function Modal({ title, onClose, wide = false, children }) {
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

const Field = ({ label, children }) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{label}</label>
    {children}
  </div>
);

/* ─── Health 1-5 ─── */
const HEALTH_LABELS = {
  1: { label: "Critical",  color: "bg-red-600" },
  2: { label: "Poor",      color: "bg-orange-500" },
  3: { label: "Fair",      color: "bg-yellow-400" },
  4: { label: "Good",      color: "bg-lime-500" },
  5: { label: "Excellent", color: "bg-green-600" },
};

function HealthPicker({ value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {[1,2,3,4,5].map((n) => {
        const h = HEALTH_LABELS[n];
        const active = value === n;
        return (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border-2 transition
              ${active ? `${h.color} text-white border-transparent shadow-md` : "bg-gray-50 border-gray-200 hover:border-gray-400"}`}>
            <span className="text-lg font-bold">{n}</span>
            <span className="text-[9px] font-semibold uppercase leading-tight">{h.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function HealthBadge({ score }) {
  if (!score) return <span className="text-gray-300 text-xs">—</span>;
  const h = HEALTH_LABELS[score];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${h.color} text-white`}>
      {score}/5 {h.label}
    </span>
  );
}

/* ─── Chart metrics ─── */
const METRICS = [
  { key: "weight",   label: "Weight (kg)",   color: "#16a34a" },
  { key: "milkYield",label: "Milk (L/day)",  color: "#2563eb" },
  { key: "price",    label: "Est. Price",    color: "#d97706" },
  { key: "health",   label: "Health Score",  color: "#db2777" },
];

const PREGNANCY_STATUSES = ["Open", "Pregnant", "Lactating", "Dry"];
const PREGNANCY_COLORS = {
  Open:      "bg-gray-500",
  Pregnant:  "bg-pink-500",
  Lactating: "bg-blue-500",
  Dry:       "bg-amber-500",
};

/* ─── Days remaining helper ─── */
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  return diff;
}

export default function CowsProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { animals = [], setAnimals } = useContext(FarmContext);

  const cow = animals.find(
    (a) => a.id?.toString() === id && a.category === "cattle" && a.type?.toLowerCase() === "cow"
  );

  const updateCow = (updated) =>
    setAnimals((prev) => prev.map((a) => (a.id?.toString() === id ? updated : a)));

  /* ── edit ── */
  const [isEditing, setIsEditing]   = useState(false);
  const [editedCow, setEditedCow]   = useState(null);

  /* ── modals ── */
  const [modal, setModal] = useState(null);
  const [showSellModal, setShowSellModal] = useState(false);
  // values: "growth"|"viewGrowth"|"feed"|"viewFeed"|"medical"|"viewMedical"
  //         "repro"|"viewRepro"|"lactation"|"viewLactation"|"calf"|"viewCalves"

  /* ── new record forms ── */
  const [newGrowth,    setNewGrowth]    = useState({ date:"", weight:"", milkYield:"", price:"", health:0, notes:"" });
  const [newFeed,      setNewFeed]      = useState({ date:"", feedType:"", amount:"", minerals:"", lactationDiet:"", notes:"" });
  const [newMedical,   setNewMedical]   = useState({ date:"", type:"", medicine:"", vetName:"", cost:"", notes:"" });
  const [newRepro,     setNewRepro]     = useState({ dateConceived:"", sire:"", expectedBirth:"", actualBirth:"", notes:"" });
  const [newLactation, setNewLactation] = useState({ startDate:"", endDate:"", totalLitres:"", avgPerDay:"", notes:"" });
  const [newCalf,      setNewCalf]      = useState({ birthDate:"", gender:"", name:"", weight:"", sire:"", notes:"" });

  /* ── active chart metrics ── */
  const [activeMetrics, setActiveMetrics] = useState(["weight", "milkYield"]);
  const toggleMetric = (key) =>
    setActiveMetrics((prev) =>
      prev.includes(key) ? (prev.length > 1 ? prev.filter((k) => k !== key) : prev) : [...prev, key]
    );

  if (!cow) return <p className="p-6 text-red-600">Cow not found.</p>;

  const growthRecords     = cow.growthRecords      || [];
  const feedRecords       = cow.feedRecords        || [];
  const medicalLog        = cow.medicalLog         || [];
  const reproRecords      = cow.reproductiveRecords|| [];
  const lactationHistory  = cow.lactationHistory   || [];
  const calfHistory       = cow.calfHistory        || [];

  /* ── bulls list for sire picker ── */
  const bulls = animals.filter((a) => a.category === "cattle" && a.type?.toLowerCase() === "bull");

  /* ── edit helpers ── */
  const startEditing  = () => { setIsEditing(true); setEditedCow({ ...cow }); };
  const cancelEditing = () => { setIsEditing(false); setEditedCow(null); };
  const saveChanges   = () => { updateCow(editedCow); setIsEditing(false); setEditedCow(null); };
  const updateField   = (f, v) => setEditedCow((p) => ({ ...p, [f]: v }));
  const current       = isEditing ? editedCow : cow;

  /* ── image upload ── */
  const [photoUploading,  setPhotoUploading] = useState(false);
  
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhotoUploading(true);
      const url = await uploadAnimalPhoto(file, "cattle");
      updateCow({ ...cow, image: url });
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
  

  /* ── add/delete growth ── */
  const addGrowth = () => {
    if (!newGrowth.date) return;
    const updated = [...growthRecords, { ...newGrowth, id: Date.now() }];
    updateCow({ ...cow, growthRecords: updated });
    setNewGrowth({ date:"", weight:"", milkYield:"", price:"", health:0, notes:"" });
    setModal("viewGrowth");
  };
  const deleteGrowth = (rid) => updateCow({ ...cow, growthRecords: growthRecords.filter((r) => r.id !== rid) });

  /* ── add/delete feed ── */
  const addFeed = () => {
    if (!newFeed.date || !newFeed.feedType) return;
    const updated = [...feedRecords, { ...newFeed, id: Date.now() }];
    updateCow({ ...cow, feedRecords: updated });
    setNewFeed({ date:"", feedType:"", amount:"", minerals:"", lactationDiet:"", notes:"" });
    setModal("viewFeed");
  };
  const deleteFeed = (rid) => updateCow({ ...cow, feedRecords: feedRecords.filter((r) => r.id !== rid) });

  /* ── add/delete medical ── */
  const addMedical = () => {
    if (!newMedical.date || !newMedical.type) return;
    const updated = [...medicalLog, { ...newMedical, id: Date.now() }];
    updateCow({ ...cow, medicalLog: updated });
    setNewMedical({ date:"", type:"", medicine:"", vetName:"", cost:"", notes:"" });
    setModal("viewMedical");
  };
  const deleteMedical = (rid) => updateCow({ ...cow, medicalLog: medicalLog.filter((r) => r.id !== rid) });

  /* ── add/delete repro ── */
  const addRepro = () => {
    if (!newRepro.dateConceived) return;
    const updated = [...reproRecords, { ...newRepro, id: Date.now() }];
    updateCow({ ...cow, reproductiveRecords: updated });
    setNewRepro({ dateConceived:"", sire:"", expectedBirth:"", actualBirth:"", notes:"" });
    setModal("viewRepro");
  };
  const deleteRepro = (rid) => updateCow({ ...cow, reproductiveRecords: reproRecords.filter((r) => r.id !== rid) });

  /* ── add/delete lactation ── */
  const addLactation = () => {
    if (!newLactation.startDate) return;
    const updated = [...lactationHistory, { ...newLactation, id: Date.now() }];
    updateCow({ ...cow, lactationHistory: updated });
    setNewLactation({ startDate:"", endDate:"", totalLitres:"", avgPerDay:"", notes:"" });
    setModal("viewLactation");
  };
  const deleteLactation = (rid) => updateCow({ ...cow, lactationHistory: lactationHistory.filter((r) => r.id !== rid) });

  /* ── add/delete calf ── */
  const addCalf = () => {
    if (!newCalf.birthDate) return;
    const updated = [...calfHistory, { ...newCalf, id: Date.now() }];
    updateCow({ ...cow, calfHistory: updated });
    setNewCalf({ birthDate:"", gender:"", name:"", weight:"", sire:"", notes:"" });
    setModal("viewCalves");
  };
  const deleteCalf = (rid) => updateCow({ ...cow, calfHistory: calfHistory.filter((r) => r.id !== rid) });

  /* ── chart data ── */
  const chartData = [...growthRecords]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((r) => ({
      date:      r.date,
      weight:    r.weight    ? parseFloat(r.weight)    : null,
      milkYield: r.milkYield ? parseFloat(r.milkYield) : null,
      price:     r.price     ? parseFloat(r.price)     : null,
      health:    r.health    ? parseFloat(r.health)    : null,
    }));

  /* ── latest repro for banner ── */
  const latestRepro   = reproRecords.at(-1);
  const daysToCalving = latestRepro?.expectedBirth ? daysUntil(latestRepro.expectedBirth) : null;

  /* ── status badge ── */
  const statusColor = {
    Healthy: "bg-green-100 text-green-800",
    Sick: "bg-red-100 text-red-700",
    "Under Treatment": "bg-amber-100 text-amber-700",
    Sold: "bg-gray-100 text-gray-600",
  }[cow.status] || "bg-gray-100 text-gray-600";

  const pColor = PREGNANCY_COLORS[cow.pregnancyStatus] || "bg-gray-500";

  /* ════════ UI ════════ */
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
        <h2 className="text-xl sm:text-2xl font-bold text-green-900">Cow Profile</h2>
        <div className="ml-auto flex items-center gap-2">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor}`}>{cow.status || "Unknown"}</span>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full text-white ${pColor}`}>{cow.pregnancyStatus || "Open"}</span>
        </div>
      </div>

      {/* CALVING COUNTDOWN BANNER */}
      {daysToCalving !== null && !latestRepro?.actualBirth && (
        <div className={`px-6 py-2 text-sm font-semibold text-white text-center
          ${daysToCalving <= 7 ? "bg-red-500" : daysToCalving <= 30 ? "bg-amber-500" : "bg-pink-500"}`}>
          {daysToCalving > 0
            ? `🐄 Expected calving in ${daysToCalving} day${daysToCalving !== 1 ? "s" : ""} (${latestRepro.expectedBirth})`
            : daysToCalving === 0
            ? "🐄 Calving expected TODAY!"
            : `⚠️ Calving was ${Math.abs(daysToCalving)} day${Math.abs(daysToCalving) !== 1 ? "s" : ""} overdue — please update the record`}
        </div>
      )}

      {/* BODY */}
      <div className="flex flex-1 gap-6 p-4 sm:p-6 flex-col lg:flex-row">

        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-4 w-full lg:w-72 lg:shrink-0">

          {/* IMAGE */}
          <div className="relative h-56 sm:h-72 rounded-2xl overflow-hidden shadow-lg bg-gray-100 group">
            {cow.image
              ? <img src={cow.image} alt={cow.name} className="w-full h-full object-cover" />
              : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No image</div>}
            <label className="absolute inset-0 flex items-end justify-center pb-4 bg-black/0 group-hover:bg-black/30 transition cursor-pointer">
              <span className="opacity-0 group-hover:opacity-100 transition bg-white/90 text-pink-800 text-xs font-semibold px-3 py-1 rounded-full">
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
                {isEditing
                  ? <input value={editedCow[field] || ""} onChange={(e) => updateField(field, e.target.value)}
                      className="border rounded px-2 py-0.5 w-28 text-right text-sm" />
                  : <span className="text-green-900 font-semibold">
                      {cow[field] ? `${cow[field]}${suffix}` : <span className="text-gray-300">—</span>}
                    </span>}
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
                {isEditing
                  ? <input value={editedCow[field] || ""} onChange={(e) => updateField(field, e.target.value)}
                      className="border rounded px-2 py-0.5 w-28 text-right text-sm" />
                  : <span className="text-green-900 font-semibold">
                      {cow[field] ? `${prefix}${cow[field]}` : <span className="text-gray-300">—</span>}
                    </span>}
              </div>
            ))}
          </div>

          {/* REPRODUCTIVE SUMMARY */}
          <div className="bg-white rounded-2xl shadow p-4 text-sm">
            <p className="font-semibold text-gray-500 text-xs uppercase mb-2">Reproductive Summary</p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Total calvings</span>
                <span className="font-bold text-pink-700">{calfHistory.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Lactation periods</span>
                <span className="font-bold text-blue-700">{lactationHistory.length}</span>
              </div>
              {lactationHistory.length > 0 && lactationHistory.at(-1).avgPerDay && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Last avg yield</span>
                  <span className="font-bold text-blue-600">{lactationHistory.at(-1).avgPerDay} L/day</span>
                </div>
              )}
            </div>
          </div>

          {/* ── SELL BUTTON ── */}
          {cow.status !== "Sold" && (
            <button
              onClick={() => setShowSellModal(true)}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition shadow text-sm flex items-center justify-center gap-2"
            >
              💰 Sell this Cow
            </button>
          )}

          {cow.status === "Sold" && (
            <div className="bg-gray-100 rounded-xl px-4 py-3 text-center text-sm text-gray-500 font-semibold">
              ✅ This cow has been sold
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
                  ? <input value={editedCow.name || ""} onChange={(e) => updateField("name", e.target.value)}
                      className="text-xl sm:text-2xl font-bold border-b border-pink-400 outline-none w-full" />
                  : <h3 className="text-xl sm:text-2xl font-bold text-green-900">{cow.name}</h3>}
              </div>
              {!isEditing
                ? <button onClick={startEditing} className="bg-pink-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-pink-700 transition">Edit Profile</button>
                : <div className="flex gap-2">
                    <button onClick={saveChanges}   className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm">Save</button>
                    <button onClick={cancelEditing} className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm">Cancel</button>
                  </div>}
            </div>
            {isEditing && (
              <div className="mt-4 flex gap-4 flex-wrap">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Health Status</p>
                  <select 
                    value={editedCow.status || ""} 
                    onChange={(e) => updateField("status", e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm"
                  >

                    {["Healthy","Sick","Under Treatment","Sold"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                  {editedCow.status !== "Sold" && (
                    <p className="text-xs text-gray-400 mt-1">
                      Select "Sold" to record a sale - a form will appear to capture the <details className=""></details>
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Pregnancy Status</p>
                  <select value={editedCow.pregnancyStatus || ""} onChange={(e) => updateField("pregnancyStatus", e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm">
                    {PREGNANCY_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* ── 6 ACTION CARDS (2 rows of 3) ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">

            {/* GROWTH */}
            <ActionCard
              title="Growth Records" count={growthRecords.length}
              accent="blue"
              latest={growthRecords.length > 0 ? `${growthRecords.at(-1).weight || "—"} kg · ${growthRecords.at(-1).milkYield || "—"} L/day` : null}
              latestDate={growthRecords.at(-1)?.date}
              onAdd={() => setModal("growth")} onView={() => setModal("viewGrowth")}
              icon={<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />}
            />

            {/* FEED */}
            <ActionCard
              title="Feed Records" count={feedRecords.length}
              accent="amber"
              latest={feedRecords.length > 0 ? feedRecords.at(-1).feedType : null}
              latestDate={feedRecords.at(-1)?.date}
              onAdd={() => setModal("feed")} onView={() => setModal("viewFeed")}
              icon={<path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />}
            />

            {/* MEDICAL */}
            <ActionCard
              title="Medical Log" count={medicalLog.length}
              accent="red"
              latest={medicalLog.length > 0 ? medicalLog.at(-1).type : null}
              latestDate={medicalLog.at(-1)?.date}
              onAdd={() => setModal("medical")} onView={() => setModal("viewMedical")}
              icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />}
            />

            {/* REPRODUCTIVE */}
            <ActionCard
              title="Reproductive" count={reproRecords.length}
              accent="pink"
              latest={reproRecords.length > 0 ? (reproRecords.at(-1).actualBirth ? `Calved ${reproRecords.at(-1).actualBirth}` : `Due ${reproRecords.at(-1).expectedBirth || "TBD"}`) : null}
              latestDate={reproRecords.at(-1)?.dateConceived}
              onAdd={() => setModal("repro")} onView={() => setModal("viewRepro")}
              icon={<path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />}
            />

            {/* LACTATION */}
            <ActionCard
              title="Lactation History" count={lactationHistory.length}
              accent="sky"
              latest={lactationHistory.length > 0 ? `${lactationHistory.at(-1).avgPerDay || "—"} L/day avg` : null}
              latestDate={lactationHistory.at(-1)?.startDate}
              onAdd={() => setModal("lactation")} onView={() => setModal("viewLactation")}
              icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.575 1.399A1.5 1.5 0 0117 17.58v.82A2.25 2.25 0 0114.75 20.625H9.25A2.25 2.25 0 017 18.4v-.82a1.5 1.5 0 01-.225-1.181L5 14.5m14.8.5l-5.8-4.5M5 14.5l5.8-4.5" />}
            />

            {/* CALVES */}
            <ActionCard
              title="Calf History" count={calfHistory.length}
              accent="green"
              latest={calfHistory.length > 0 ? `${calfHistory.at(-1).name || "Unnamed"} (${calfHistory.at(-1).gender || "?"})` : null}
              latestDate={calfHistory.at(-1)?.birthDate}
              onAdd={() => setModal("calf")} onView={() => setModal("viewCalves")}
              icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />}
            />

          </div>

          {/* ── CHART ── */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-2xl shadow p-5">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <p className="text-sm font-semibold text-gray-600">Growth chart</p>
                <div className="flex gap-2 flex-wrap">
                  {/* ALL */}
                  {(() => {
                    const allActive = METRICS.every((m) => activeMetrics.includes(m.key));
                    return (
                      <button onClick={() => setActiveMetrics(allActive ? ["weight"] : METRICS.map((m) => m.key))}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition
                          ${allActive ? "bg-gray-800 text-white border-transparent" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                        All
                      </button>
                    );
                  })()}
                  {METRICS.map((m) => {
                    const active = activeMetrics.includes(m.key);
                    return (
                      <button key={m.key} onClick={() => toggleMetric(m.key)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition
                          ${active ? "text-white border-transparent" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}
                        style={active ? { backgroundColor: m.color } : {}}>
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f0fdf4" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  {METRICS.filter((m) => activeMetrics.includes(m.key)).map((m) => (
                    <Line key={m.key} type="monotone" dataKey={m.key} name={m.label}
                      stroke={m.color} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── GROWTH DATA TABLE ── */}
          {growthRecords.length > 0 && (
            <div className="bg-white rounded-2xl shadow p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Growth Entries</p>
                <span className="text-xs text-gray-400">{growthRecords.length} records · scroll to see all</span>
              </div>
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="overflow-y-auto" style={{ maxHeight: "220px" }}>
                    <table className="w-full text-sm min-w-[680px]">
                      <thead>
                        <tr className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                          {["Date","Weight (kg)","Milk (L/day)","Est. Price","Health","Notes",""].map((h) => (
                            <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {[...growthRecords].reverse().map((r, i) => (
                          <tr key={r.id} className={`hover:bg-pink-50/40 transition ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                            <td className="px-4 py-2.5 text-xs text-gray-700 font-medium whitespace-nowrap">{r.date}</td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              {r.weight ? <span className="font-bold text-green-700">{parseFloat(r.weight).toLocaleString()} kg</span> : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              {r.milkYield ? <span className="font-bold text-blue-600">{r.milkYield} L</span> : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              {r.price ? <span className="font-bold text-amber-700">KES {parseFloat(r.price).toLocaleString()}</span> : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-4 py-2.5"><HealthBadge score={r.health} /></td>
                            <td className="px-4 py-2.5 text-xs text-gray-500 italic max-w-[160px]">
                              <span className="block truncate" title={r.notes}>{r.notes || "—"}</span>
                            </td>
                            <td className="px-4 py-2.5">
                              <button onClick={() => deleteGrowth(r.id)} className="text-gray-300 hover:text-red-500 transition text-lg leading-none">&times;</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {growthRecords.length > 4 && (
                  <div className="h-5 bg-gradient-to-t from-gray-100 to-transparent pointer-events-none -mt-5 relative z-10" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ SELL ANIMAL MODAL ══ */}
      {showSellModal && (
        <SellAnimalModal
          animal={cow}
          species="Cattle"
          onConfirm={() => {      
            updateCow({ ...cow, status: "Sold" });
            setShowSellModal(false);
            if (isEditing) { setIsEditing(false); setEditedCow(null); }
          }}
          onCancel={() => {
            setShowSellModal(false);
            if (isEditing && editedCow) updateField("status", cow.status);
          }}
        />
      )}            

      {/* ══════════════ MODALS ══════════════ */}

      {/* ADD GROWTH */}
      {modal === "growth" && (
        <Modal title="Add Growth Record" onClose={() => setModal(null)}>
          <Field label="Date"><input type="date" value={newGrowth.date} onChange={(e) => setNewGrowth({...newGrowth, date:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Weight (kg)"><input type="number" placeholder="e.g. 280" value={newGrowth.weight} onChange={(e) => setNewGrowth({...newGrowth, weight:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Milk Yield (litres/day)"><input type="number" step="0.1" placeholder="e.g. 12.5" value={newGrowth.milkYield} onChange={(e) => setNewGrowth({...newGrowth, milkYield:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Estimated Price (KES)"><input type="number" placeholder="e.g. 85000" value={newGrowth.price} onChange={(e) => setNewGrowth({...newGrowth, price:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Health Condition"><HealthPicker value={newGrowth.health} onChange={(v) => setNewGrowth({...newGrowth, health:v})} /></Field>
          <Field label="Notes"><textarea value={newGrowth.notes} onChange={(e) => setNewGrowth({...newGrowth, notes:e.target.value})} className="border rounded-lg p-2 w-full h-20 resize-none" /></Field>
          <div className="flex gap-3 pt-2">
            <button onClick={addGrowth} className="flex-1 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 font-semibold">Save Record</button>
            <button onClick={() => setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl hover:bg-gray-200">Cancel</button>
          </div>
        </Modal>
      )}

      {/* VIEW GROWTH */}
      {modal === "viewGrowth" && (
        <Modal title={`Growth Records — ${growthRecords.length} entries`} onClose={() => setModal(null)}>
          <button onClick={() => setModal("growth")} className="mb-4 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700">+ Add new record</button>
          {growthRecords.length === 0 ? <p className="text-gray-400 text-center py-8">No records yet.</p> : (
            <div className="space-y-3">
              {[...growthRecords].reverse().map((r) => (
                <div key={r.id} className="bg-blue-50 rounded-xl p-3 flex justify-between items-start">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-blue-900 text-sm">{r.date}</p>
                    {r.weight    && <p className="text-xs text-gray-600">⚖️ {r.weight} kg</p>}
                    {r.milkYield && <p className="text-xs text-blue-700 font-medium">🥛 {r.milkYield} L/day</p>}
                    {r.price     && <p className="text-xs text-amber-700">💰 KES {parseFloat(r.price).toLocaleString()}</p>}
                    {r.health > 0 && <HealthBadge score={r.health} />}
                    {r.notes     && <p className="text-xs text-gray-500 italic">{r.notes}</p>}
                  </div>
                  <button onClick={() => deleteGrowth(r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* ADD FEED */}
      {modal === "feed" && (
        <Modal title="Add Feed Record" onClose={() => setModal(null)}>
          <Field label="Date"><input type="date" value={newFeed.date} onChange={(e) => setNewFeed({...newFeed, date:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Feed Type"><input placeholder="e.g. Silage, Hay, Dairy meal" value={newFeed.feedType} onChange={(e) => setNewFeed({...newFeed, feedType:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Amount (kg)"><input type="number" placeholder="e.g. 15" value={newFeed.amount} onChange={(e) => setNewFeed({...newFeed, amount:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Minerals / Supplements"><input placeholder="e.g. Calcium, Salt lick, Bypass protein" value={newFeed.minerals} onChange={(e) => setNewFeed({...newFeed, minerals:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Lactation Diet Notes"><textarea placeholder="Special feeding for lactating cow? Note here..." value={newFeed.lactationDiet} onChange={(e) => setNewFeed({...newFeed, lactationDiet:e.target.value})} className="border rounded-lg p-2 w-full h-16 resize-none" /></Field>
          <Field label="General Notes"><textarea value={newFeed.notes} onChange={(e) => setNewFeed({...newFeed, notes:e.target.value})} className="border rounded-lg p-2 w-full h-16 resize-none" /></Field>
          <div className="flex gap-3 pt-2">
            <button onClick={addFeed} className="flex-1 bg-amber-500 text-white py-2 rounded-xl hover:bg-amber-600 font-semibold">Save Record</button>
            <button onClick={() => setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl hover:bg-gray-200">Cancel</button>
          </div>
        </Modal>
      )}

      {/* VIEW FEED */}
      {modal === "viewFeed" && (
        <Modal title={`Feed Records — ${feedRecords.length} entries`} onClose={() => setModal(null)}>
          <button onClick={() => setModal("feed")} className="mb-4 bg-amber-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-amber-600">+ Add new record</button>
          {feedRecords.length === 0 ? <p className="text-gray-400 text-center py-8">No feed records yet.</p> : (
            <div className="space-y-3">
              {[...feedRecords].reverse().map((r) => (
                <div key={r.id} className="bg-amber-50 rounded-xl p-3 flex justify-between items-start">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-amber-900">{r.feedType}</p>
                    <p className="text-xs text-gray-500">{r.date}{r.amount ? ` · ${r.amount} kg` : ""}</p>
                    {r.minerals      && <p className="text-xs text-gray-600">Supplements: {r.minerals}</p>}
                    {r.lactationDiet && <p className="text-xs text-blue-600 italic">Lactation: {r.lactationDiet}</p>}
                    {r.notes         && <p className="text-xs text-gray-500 italic">{r.notes}</p>}
                  </div>
                  <button onClick={() => deleteFeed(r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* ADD MEDICAL */}
      {modal === "medical" && (
        <Modal title="Add Medical Record" onClose={() => setModal(null)}>
          <Field label="Date"><input type="date" value={newMedical.date} onChange={(e) => setNewMedical({...newMedical, date:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Type">
            <select value={newMedical.type} onChange={(e) => setNewMedical({...newMedical, type:e.target.value})} className="border rounded-lg p-2 w-full">
              <option value="">Select type...</option>
              {["Vaccination","Deworming","Treatment","Pregnancy Check","AI (Artificial Insemination)","Dystocia / Calving Assistance","Surgery","Checkup","Other"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Medicine / Vaccine"><input placeholder="e.g. Oxytocin, FMD vaccine" value={newMedical.medicine} onChange={(e) => setNewMedical({...newMedical, medicine:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Vet Name"><input placeholder="e.g. Dr. Wanjiku" value={newMedical.vetName} onChange={(e) => setNewMedical({...newMedical, vetName:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Cost (KES)"><input type="number" value={newMedical.cost} onChange={(e) => setNewMedical({...newMedical, cost:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Notes"><textarea value={newMedical.notes} onChange={(e) => setNewMedical({...newMedical, notes:e.target.value})} className="border rounded-lg p-2 w-full h-20 resize-none" /></Field>
          <div className="flex gap-3 pt-2">
            <button onClick={addMedical} className="flex-1 bg-red-600 text-white py-2 rounded-xl hover:bg-red-700 font-semibold">Save Record</button>
            <button onClick={() => setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl hover:bg-gray-200">Cancel</button>
          </div>
        </Modal>
      )}

      {/* VIEW MEDICAL */}
      {modal === "viewMedical" && (
        <Modal title={`Medical Log — ${medicalLog.length} entries`} onClose={() => setModal(null)}>
          <button onClick={() => setModal("medical")} className="mb-4 bg-red-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-red-700">+ Add new record</button>
          {medicalLog.length === 0 ? <p className="text-gray-400 text-center py-8">No medical records yet.</p> : (
            <div className="space-y-3">
              {[...medicalLog].reverse().map((r) => (
                <div key={r.id} className="bg-red-50 rounded-xl p-3 flex justify-between items-start">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-red-900">{r.type}</p>
                    <p className="text-xs text-gray-500">{r.date}{r.vetName ? ` · ${r.vetName}` : ""}</p>
                    {r.medicine && <p className="text-xs text-gray-600">Medicine: {r.medicine}</p>}
                    {r.cost     && <p className="text-xs text-gray-600">Cost: KES {r.cost}</p>}
                    {r.notes    && <p className="text-xs text-gray-500 italic">{r.notes}</p>}
                  </div>
                  <button onClick={() => deleteMedical(r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* ADD REPRODUCTIVE */}
      {modal === "repro" && (
        <Modal title="Add Reproductive Record" onClose={() => setModal(null)}>
          <Field label="Date Conceived"><input type="date" value={newRepro.dateConceived} onChange={(e) => setNewRepro({...newRepro, dateConceived:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Sire (Bull)">
            <select value={newRepro.sire} onChange={(e) => setNewRepro({...newRepro, sire:e.target.value})} className="border rounded-lg p-2 w-full">
              <option value="">Select sire or type manually...</option>
              {bulls.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
              <option value="AI">AI (Artificial Insemination)</option>
              <option value="Unknown">Unknown</option>
            </select>
          </Field>
          <Field label="Expected Birth Date"><input type="date" value={newRepro.expectedBirth} onChange={(e) => setNewRepro({...newRepro, expectedBirth:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Actual Birth Date (fill after calving)"><input type="date" value={newRepro.actualBirth} onChange={(e) => setNewRepro({...newRepro, actualBirth:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Notes"><textarea placeholder="Any complications, pregnancy checks..." value={newRepro.notes} onChange={(e) => setNewRepro({...newRepro, notes:e.target.value})} className="border rounded-lg p-2 w-full h-20 resize-none" /></Field>
          <div className="flex gap-3 pt-2">
            <button onClick={addRepro} className="flex-1 bg-pink-600 text-white py-2 rounded-xl hover:bg-pink-700 font-semibold">Save Record</button>
            <button onClick={() => setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl hover:bg-gray-200">Cancel</button>
          </div>
        </Modal>
      )}

      {/* VIEW REPRODUCTIVE */}
      {modal === "viewRepro" && (
        <Modal title={`Reproductive Records — ${reproRecords.length} entries`} onClose={() => setModal(null)}>
          <button onClick={() => setModal("repro")} className="mb-4 bg-pink-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-pink-700">+ Add new record</button>
          {reproRecords.length === 0 ? <p className="text-gray-400 text-center py-8">No reproductive records yet.</p> : (
            <div className="space-y-3">
              {[...reproRecords].reverse().map((r) => (
                <div key={r.id} className="bg-pink-50 rounded-xl p-3 flex justify-between items-start">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-pink-900">Conceived: {r.dateConceived}</p>
                    {r.sire          && <p className="text-xs text-gray-600">Sire: {r.sire}</p>}
                    {r.expectedBirth && <p className="text-xs text-gray-600">Expected birth: {r.expectedBirth}</p>}
                    {r.actualBirth   && <p className="text-xs text-green-700 font-medium">✅ Actual birth: {r.actualBirth}</p>}
                    {r.notes         && <p className="text-xs text-gray-500 italic">{r.notes}</p>}
                  </div>
                  <button onClick={() => deleteRepro(r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* ADD LACTATION */}
      {modal === "lactation" && (
        <Modal title="Add Lactation Period" onClose={() => setModal(null)}>
          <Field label="Start Date"><input type="date" value={newLactation.startDate} onChange={(e) => setNewLactation({...newLactation, startDate:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="End Date (dry-off)"><input type="date" value={newLactation.endDate} onChange={(e) => setNewLactation({...newLactation, endDate:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Total Litres Produced"><input type="number" placeholder="e.g. 2400" value={newLactation.totalLitres} onChange={(e) => setNewLactation({...newLactation, totalLitres:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Average Yield per Day (L)"><input type="number" step="0.1" placeholder="e.g. 14.5" value={newLactation.avgPerDay} onChange={(e) => setNewLactation({...newLactation, avgPerDay:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Notes"><textarea placeholder="Peak yield, dips, mastitis events..." value={newLactation.notes} onChange={(e) => setNewLactation({...newLactation, notes:e.target.value})} className="border rounded-lg p-2 w-full h-16 resize-none" /></Field>
          <div className="flex gap-3 pt-2">
            <button onClick={addLactation} className="flex-1 bg-sky-600 text-white py-2 rounded-xl hover:bg-sky-700 font-semibold">Save Period</button>
            <button onClick={() => setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl hover:bg-gray-200">Cancel</button>
          </div>
        </Modal>
      )}

      {/* VIEW LACTATION */}
      {modal === "viewLactation" && (
        <Modal title={`Lactation History — ${lactationHistory.length} periods`} onClose={() => setModal(null)}>
          <button onClick={() => setModal("lactation")} className="mb-4 bg-sky-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-sky-700">+ Add new period</button>
          {lactationHistory.length === 0 ? <p className="text-gray-400 text-center py-8">No lactation records yet.</p> : (
            <div className="space-y-3">
              {[...lactationHistory].reverse().map((r, i) => (
                <div key={r.id} className="bg-sky-50 rounded-xl p-3 flex justify-between items-start">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-sky-900">Period {lactationHistory.length - i}</p>
                    <p className="text-xs text-gray-600">{r.startDate} → {r.endDate || "ongoing"}</p>
                    {r.totalLitres && <p className="text-xs text-sky-700 font-medium">Total: {parseFloat(r.totalLitres).toLocaleString()} L</p>}
                    {r.avgPerDay   && <p className="text-xs text-sky-700">Avg: {r.avgPerDay} L/day</p>}
                    {r.notes       && <p className="text-xs text-gray-500 italic">{r.notes}</p>}
                  </div>
                  <button onClick={() => deleteLactation(r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* ADD CALF */}
      {modal === "calf" && (
        <Modal title="Record a Calf Birth" onClose={() => setModal(null)}>
          <Field label="Birth Date"><input type="date" value={newCalf.birthDate} onChange={(e) => setNewCalf({...newCalf, birthDate:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Gender">
            <div className="flex gap-3">
              {["Male","Female","Stillborn"].map((g) => (
                <button key={g} type="button" onClick={() => setNewCalf({...newCalf, gender:g})}
                  className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition
                    ${newCalf.gender === g ? "bg-green-600 text-white border-transparent" : "bg-gray-50 border-gray-200 hover:border-gray-400"}`}>
                  {g}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Calf Name (optional)"><input placeholder="e.g. Daisy Jr." value={newCalf.name} onChange={(e) => setNewCalf({...newCalf, name:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Birth Weight (kg)"><input type="number" placeholder="e.g. 32" value={newCalf.weight} onChange={(e) => setNewCalf({...newCalf, weight:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Sire">
            <select value={newCalf.sire} onChange={(e) => setNewCalf({...newCalf, sire:e.target.value})} className="border rounded-lg p-2 w-full">
              <option value="">Select sire...</option>
              {bulls.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
              <option value="AI">AI (Artificial Insemination)</option>
              <option value="Unknown">Unknown</option>
            </select>
          </Field>
          <Field label="Notes"><textarea placeholder="Any calving complications, observations..." value={newCalf.notes} onChange={(e) => setNewCalf({...newCalf, notes:e.target.value})} className="border rounded-lg p-2 w-full h-16 resize-none" /></Field>
          <div className="flex gap-3 pt-2">
            <button onClick={addCalf} className="flex-1 bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 font-semibold">Save Calf Record</button>
            <button onClick={() => setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl hover:bg-gray-200">Cancel</button>
          </div>
        </Modal>
      )}

      {/* VIEW CALVES */}
      {modal === "viewCalves" && (
        <Modal title={`Calf History — ${calfHistory.length} births`} onClose={() => setModal(null)}>
          <button onClick={() => setModal("calf")} className="mb-4 bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700">+ Record new calf</button>
          {calfHistory.length === 0 ? <p className="text-gray-400 text-center py-8">No calf records yet.</p> : (
            <div className="space-y-3">
              {[...calfHistory].reverse().map((r) => (
                <div key={r.id} className="bg-green-50 rounded-xl p-3 flex justify-between items-start">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-green-900">{r.name || "Unnamed calf"}</p>
                      {r.gender && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                          ${r.gender === "Male" ? "bg-blue-100 text-blue-700" : r.gender === "Female" ? "bg-pink-100 text-pink-700" : "bg-gray-100 text-gray-600"}`}>
                          {r.gender}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Born: {r.birthDate}{r.weight ? ` · ${r.weight} kg` : ""}</p>
                    {r.sire  && <p className="text-xs text-gray-600">Sire: {r.sire}</p>}
                    {r.notes && <p className="text-xs text-gray-500 italic">{r.notes}</p>}
                  </div>
                  <button onClick={() => deleteCalf(r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

/* ─── Reusable action card ─── */
const ACCENT = {
  blue:  { bg:"bg-blue-50",  icon:"#2563eb", count:"text-blue-800",  add:"bg-blue-600 hover:bg-blue-700",  view:"bg-blue-50 text-blue-700 hover:bg-blue-100" },
  amber: { bg:"bg-amber-50", icon:"#d97706", count:"text-amber-700", add:"bg-amber-500 hover:bg-amber-600",view:"bg-amber-50 text-amber-700 hover:bg-amber-100" },
  red:   { bg:"bg-red-50",   icon:"#dc2626", count:"text-red-700",   add:"bg-red-600 hover:bg-red-700",    view:"bg-red-50 text-red-700 hover:bg-red-100" },
  pink:  { bg:"bg-pink-50",  icon:"#db2777", count:"text-pink-700",  add:"bg-pink-600 hover:bg-pink-700",  view:"bg-pink-50 text-pink-700 hover:bg-pink-100" },
  sky:   { bg:"bg-sky-50",   icon:"#0284c7", count:"text-sky-700",   add:"bg-sky-600 hover:bg-sky-700",    view:"bg-sky-50 text-sky-700 hover:bg-sky-100" },
  green: { bg:"bg-green-50", icon:"#16a34a", count:"text-green-700", add:"bg-green-600 hover:bg-green-700",view:"bg-green-50 text-green-700 hover:bg-green-100" },
};

function ActionCard({ title, count, accent, latest, latestDate, onAdd, onView, icon }) {
  const a = ACCENT[accent];
  return (
    <div className="bg-white rounded-2xl shadow p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase font-semibold leading-tight">{title}</p>
          <p className={`text-2xl font-bold mt-0.5 ${a.count}`}>{count}</p>
        </div>
        <div className={`${a.bg} rounded-xl p-2`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={1.5} stroke={a.icon} className="w-6 h-6">
            {icon}
          </svg>
        </div>
      </div>
      {latest && (
        <p className="text-xs text-gray-500 truncate">
          {latestDate && <span className="text-gray-400">{latestDate} · </span>}{latest}
        </p>
      )}
      <div className="flex gap-2 mt-auto">
        <button onClick={onAdd}  className={`flex-1 ${a.add} text-white text-xs py-2 rounded-lg transition`}>+ Add</button>
        <button onClick={onView} className={`flex-1 ${a.view} text-xs py-2 rounded-lg transition`}>View all</button>
      </div>
    </div>
  );
}
