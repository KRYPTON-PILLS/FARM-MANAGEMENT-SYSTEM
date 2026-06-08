import { useParams, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { FarmContext } from "../context/FarmContext";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-purple-900">{title}</h3>
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

const HEALTH_LABELS = {
  1: { label:"Critical",  color:"bg-red-600" },
  2: { label:"Poor",      color:"bg-orange-500" },
  3: { label:"Fair",      color:"bg-yellow-400" },
  4: { label:"Good",      color:"bg-lime-500" },
  5: { label:"Excellent", color:"bg-green-600" },
};

function HealthPicker({ value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {[1,2,3,4,5].map((n) => {
        const h = HEALTH_LABELS[n];
        return (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border-2 transition
              ${value === n ? `${h.color} text-white border-transparent shadow-md` : "bg-gray-50 border-gray-200 hover:border-gray-400"}`}>
            <span className="text-lg font-bold">{n}</span>
            <span className="text-[9px] font-semibold uppercase">{h.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function HealthBadge({ score }) {
  if (!score) return <span className="text-gray-300 text-xs">—</span>;
  const h = HEALTH_LABELS[score];
  return <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${h.color} text-white`}>{score}/5 {h.label}</span>;
}

const METRICS = [
  { key:"weight", label:"Weight (kg)", color:"#7c3aed" },
  { key:"price",  label:"Est. Price",  color:"#d97706" },
  { key:"health", label:"Health",      color:"#16a34a" },
];

const READINESS_STATUSES = ["Weaning","Growing","Near Breeding Age","Ready to Breed"];
const READINESS_COLORS = {
  Weaning:            "bg-gray-400",
  Growing:            "bg-amber-500",
  "Near Breeding Age":"bg-purple-500",
  "Ready to Breed":   "bg-green-600",
};

function ReadinessBar({ current, target }) {
  if (!current || !target) return null;
  const pct = Math.min(100, Math.round((parseFloat(current) / parseFloat(target)) * 100));
  const color = pct < 50 ? "bg-amber-400" : pct < 80 ? "bg-purple-500" : "bg-green-500";
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Weight to first breeding</span>
        <span className="font-bold">{pct}%</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width:`${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{current} kg current</span>
        <span>{target} kg target</span>
      </div>
    </div>
  );
}

export default function HeiferProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { animals = [], setAnimals } = useContext(FarmContext);

  const heifer = animals.find(
    (a) => a.id?.toString() === id && a.category === "cattle" && a.type?.toLowerCase() === "heifer"
  );
  const updateHeifer = (updated) =>
    setAnimals((prev) => prev.map((a) => (a.id?.toString() === id ? updated : a)));

  const [isEditing, setIsEditing] = useState(false);
  const [edited,    setEdited]    = useState(null);
  const [modal,     setModal]     = useState(null);

  const [newGrowth,  setNewGrowth]  = useState({ date:"", weight:"", price:"", health:0, notes:"" });
  const [newFeed,    setNewFeed]    = useState({ date:"", feedType:"", amount:"", minerals:"", transitionDiet:"", notes:"" });
  const [newMedical, setNewMedical] = useState({ date:"", type:"", medicine:"", vetName:"", cost:"", notes:"" });
  const [newHeat,    setNewHeat]    = useState({ date:"", duration:"", intensity:"", notes:"" });

  const [activeMetrics, setActiveMetrics] = useState(["weight"]);
  const toggleMetric = (key) =>
    setActiveMetrics((prev) =>
      prev.includes(key) ? (prev.length > 1 ? prev.filter((k) => k !== key) : prev) : [...prev, key]
    );

  if (!heifer) return <p className="p-6 text-red-600">Heifer not found.</p>;

  const growthRecords = heifer.growthRecords || [];
  const feedRecords   = heifer.feedRecords   || [];
  const medicalLog    = heifer.medicalLog    || [];
  const heatRecords   = heifer.heatRecords   || [];

  const bulls = animals.filter((a) => a.category === "cattle" && a.type?.toLowerCase() === "bull");
  const cows  = animals.filter((a) => a.category === "cattle" && a.type?.toLowerCase() === "cow");

  const startEditing  = () => { setIsEditing(true); setEdited({ ...heifer }); };
  const cancelEditing = () => { setIsEditing(false); setEdited(null); };
  const saveChanges   = () => { updateHeifer(edited); setIsEditing(false); setEdited(null); };
  const updateField   = (f, v) => setEdited((p) => ({ ...p, [f]: v }));

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => updateHeifer({ ...heifer, image: reader.result });
    reader.readAsDataURL(file);
  };

  const addGrowth = () => {
    if (!newGrowth.date) return;
    const updated = [...growthRecords, { ...newGrowth, id: Date.now() }];
    updateHeifer({ ...heifer, growthRecords: updated });
    setNewGrowth({ date:"", weight:"", price:"", health:0, notes:"" });
    setModal("viewGrowth");
  };
  const deleteGrowth = (rid) => updateHeifer({ ...heifer, growthRecords: growthRecords.filter((r) => r.id !== rid) });

  const addFeed = () => {
    if (!newFeed.date || !newFeed.feedType) return;
    const updated = [...feedRecords, { ...newFeed, id: Date.now() }];
    updateHeifer({ ...heifer, feedRecords: updated });
    setNewFeed({ date:"", feedType:"", amount:"", minerals:"", transitionDiet:"", notes:"" });
    setModal("viewFeed");
  };
  const deleteFeed = (rid) => updateHeifer({ ...heifer, feedRecords: feedRecords.filter((r) => r.id !== rid) });

  const addMedical = () => {
    if (!newMedical.date || !newMedical.type) return;
    const updated = [...medicalLog, { ...newMedical, id: Date.now() }];
    updateHeifer({ ...heifer, medicalLog: updated });
    setNewMedical({ date:"", type:"", medicine:"", vetName:"", cost:"", notes:"" });
    setModal("viewMedical");
  };
  const deleteMedical = (rid) => updateHeifer({ ...heifer, medicalLog: medicalLog.filter((r) => r.id !== rid) });

  const addHeat = () => {
    if (!newHeat.date) return;
    const updated = [...heatRecords, { ...newHeat, id: Date.now() }];
    updateHeifer({ ...heifer, heatRecords: updated });
    setNewHeat({ date:"", duration:"", intensity:"", notes:"" });
    setModal("viewHeat");
  };
  const deleteHeat = (rid) => updateHeifer({ ...heifer, heatRecords: heatRecords.filter((r) => r.id !== rid) });

  const chartData = [...growthRecords]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((r) => ({
      date:   r.date,
      weight: r.weight ? parseFloat(r.weight) : null,
      price:  r.price  ? parseFloat(r.price)  : null,
      health: r.health ? parseFloat(r.health) : null,
    }));

  /* avg heat cycle */
  const avgCycle = heatRecords.length >= 2
    ? (() => {
        const dates = heatRecords.map((r) => new Date(r.date)).sort((a,b) => a - b);
        const diffs = dates.slice(1).map((d, i) => Math.round((d - dates[i]) / 86400000));
        return Math.round(diffs.reduce((s, d) => s + d, 0) / diffs.length);
      })()
    : null;

  const rColor = READINESS_COLORS[heifer.readinessStatus] || "bg-gray-400";
  const statusColor = { Healthy:"bg-green-100 text-green-800", Sick:"bg-red-100 text-red-700", "Under Treatment":"bg-amber-100 text-amber-700" }[heifer.status] || "bg-gray-100 text-gray-600";

  return (
    <div className="bg-green-50 flex flex-col">

      {/* TOP BAR */}
      <div className="flex items-center gap-4 px-6 py-4 bg-white shadow-sm">
        <button onClick={() => navigate(-1)} className="bg-white shadow w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-purple-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-purple-900">Heifer Profile</h2>
        <div className="ml-auto flex items-center gap-2">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor}`}>{heifer.status}</span>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full text-white ${rColor}`}>{heifer.readinessStatus || "Growing"}</span>
        </div>
      </div>

      {/* READY TO BREED BANNER */}
      {heifer.readinessStatus === "Ready to Breed" && (
        <div className="px-6 py-2 text-sm font-semibold text-white text-center bg-green-600">
          ✅ This heifer is ready for first breeding — consider moving her to the Cows section after first conception.
        </div>
      )}

      {/* BODY */}
      <div className="flex flex-1 gap-6 p-6 flex-wrap lg:flex-nowrap">

        {/* LEFT */}
        <div className="flex flex-col gap-4 w-72 shrink-0">

          {/* IMAGE */}
          <div className="relative h-72 rounded-2xl overflow-hidden shadow-lg bg-gray-100 group">
            {heifer.image
              ? <img src={heifer.image} alt={heifer.name} className="w-full h-full object-cover" />
              : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No image</div>}
            <label className="absolute inset-0 flex items-end justify-center pb-4 bg-black/0 group-hover:bg-black/30 transition cursor-pointer">
              <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full transition">Change photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>

          {/* QUICK STATS */}
          <div className="bg-white rounded-2xl shadow p-4 space-y-2 text-sm">
            {[
              { label:"Breed",  field:"breed" },
              { label:"Color",  field:"color" },
              { label:"Weight", field:"weight", suffix:" kg" },
              { label:"Age",    field:"age",    suffix:" mo" },
            ].map(({ label, field, suffix="" }) => (
              <div key={field} className="flex justify-between items-center border-b last:border-0 pb-1 last:pb-0">
                <span className="text-gray-500 font-medium">{label}</span>
                {isEditing
                  ? <input value={edited[field] || ""} onChange={(e) => updateField(field, e.target.value)} className="border rounded px-2 py-0.5 w-28 text-right text-sm" />
                  : <span className="text-purple-900 font-semibold">{heifer[field] ? `${heifer[field]}${suffix}` : <span className="text-gray-300">—</span>}</span>}
              </div>
            ))}
          </div>

          {/* LINEAGE */}
          <div className="bg-white rounded-2xl shadow p-4 text-sm">
            <p className="font-semibold text-gray-500 text-xs uppercase mb-2">Lineage</p>
            {["dam","sire"].map((field) => (
              <div key={field} className="flex justify-between items-center border-b last:border-0 pb-1 last:pb-0">
                <span className="text-gray-500 capitalize">{field}</span>
                {isEditing
                  ? (
                    <select value={edited[field] || ""} onChange={(e) => updateField(field, e.target.value)} className="border rounded px-2 py-0.5 w-36 text-sm">
                      <option value="">Unknown</option>
                      {(field === "dam" ? cows : bulls).map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
                    </select>
                  )
                  : <span className="text-purple-900 font-semibold">{heifer[field] || <span className="text-gray-300">—</span>}</span>}
              </div>
            ))}
            {isEditing && (
              <div className="flex justify-between items-center pt-1">
                <span className="text-gray-500">Weaning Date</span>
                <input type="date" value={edited.weaningDate || ""} onChange={(e) => updateField("weaningDate", e.target.value)} className="border rounded px-2 py-0.5 text-sm" />
              </div>
            )}
            {!isEditing && heifer.weaningDate && (
              <div className="flex justify-between items-center pt-1">
                <span className="text-gray-500">Weaned</span>
                <span className="text-purple-900 font-semibold">{heifer.weaningDate}</span>
              </div>
            )}
          </div>

          {/* BREEDING READINESS */}
          <div className="bg-white rounded-2xl shadow p-4 text-sm">
            <p className="font-semibold text-gray-500 text-xs uppercase mb-3">Breeding Readiness</p>
            {isEditing
              ? (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">Target weight (kg)</span>
                  <input type="number" value={edited.targetWeight || ""} onChange={(e) => updateField("targetWeight", e.target.value)} className="border rounded px-2 py-0.5 w-24 text-sm" />
                </div>
              )
              : <ReadinessBar current={heifer.weight} target={heifer.targetWeight} />}
            {!isEditing && !heifer.targetWeight && <p className="text-gray-300 text-xs">Set a target weight in Edit Profile</p>}
          </div>

          {/* HEAT CYCLE SUMMARY */}
          <div className="bg-white rounded-2xl shadow p-4 text-sm">
            <p className="font-semibold text-gray-500 text-xs uppercase mb-2">Heat Cycle Summary</p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Heats observed</span>
                <span className="font-bold text-purple-700">{heatRecords.length}</span>
              </div>
              {avgCycle && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Avg cycle</span>
                  <span className="font-bold text-purple-700">{avgCycle} days</span>
                </div>
              )}
              {heatRecords.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Last observed</span>
                  <span className="font-bold text-purple-700">{heatRecords.at(-1).date}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex-1 flex flex-col gap-4">

          {/* NAME + EDIT */}
          <div className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Name</p>
                {isEditing
                  ? <input value={edited.name || ""} onChange={(e) => updateField("name", e.target.value)} className="text-2xl font-bold border-b border-purple-400 outline-none w-full" />
                  : <h3 className="text-2xl font-bold text-purple-900">{heifer.name}</h3>}
              </div>
              {!isEditing
                ? <button onClick={startEditing} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-purple-700 transition">Edit Profile</button>
                : <div className="flex gap-2">
                    <button onClick={saveChanges}   className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm">Save</button>
                    <button onClick={cancelEditing} className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm">Cancel</button>
                  </div>}
            </div>
            {isEditing && (
              <div className="mt-4 flex gap-4 flex-wrap">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Health Status</p>
                  <select value={edited.status || ""} onChange={(e) => updateField("status", e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                    {["Healthy","Sick","Under Treatment"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Readiness Status</p>
                  <select value={edited.readinessStatus || ""} onChange={(e) => updateField("readinessStatus", e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                    {READINESS_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 4 ACTION CARDS — 2x2 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { key:"growth",  title:"Growth Records", count:growthRecords.length, accent:"purple",
                latest: growthRecords.length > 0 ? `${growthRecords.at(-1).weight||"—"} kg` : null,
                latestDate: growthRecords.at(-1)?.date, onAdd:()=>setModal("growth"), onView:()=>setModal("viewGrowth"),
                iconPath:"M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" },
              { key:"feed", title:"Feed Records", count:feedRecords.length, accent:"amber",
                latest: feedRecords.length > 0 ? feedRecords.at(-1).feedType : null,
                latestDate: feedRecords.at(-1)?.date, onAdd:()=>setModal("feed"), onView:()=>setModal("viewFeed"),
                iconPath:"M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" },
              { key:"medical", title:"Medical Log", count:medicalLog.length, accent:"red",
                latest: medicalLog.length > 0 ? medicalLog.at(-1).type : null,
                latestDate: medicalLog.at(-1)?.date, onAdd:()=>setModal("medical"), onView:()=>setModal("viewMedical"),
                iconPath:"M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" },
              { key:"heat", title:"Heat Records", count:heatRecords.length, accent:"pink",
                latest: heatRecords.length > 0 ? (avgCycle ? `~${avgCycle}d cycle` : heatRecords.at(-1).date) : null,
                latestDate: heatRecords.at(-1)?.date, onAdd:()=>setModal("heat"), onView:()=>setModal("viewHeat"),
                iconPath:"M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" },
            ].map((card) => {
              const ACCENT = {
                purple: { bg:"bg-purple-50", iconColor:"#7c3aed", count:"text-purple-800", add:"bg-purple-600 hover:bg-purple-700", view:"bg-purple-50 text-purple-700 hover:bg-purple-100" },
                amber:  { bg:"bg-amber-50",  iconColor:"#d97706", count:"text-amber-700",  add:"bg-amber-500 hover:bg-amber-600",  view:"bg-amber-50 text-amber-700 hover:bg-amber-100" },
                red:    { bg:"bg-red-50",    iconColor:"#dc2626", count:"text-red-700",    add:"bg-red-600 hover:bg-red-700",      view:"bg-red-50 text-red-700 hover:bg-red-100" },
                pink:   { bg:"bg-pink-50",   iconColor:"#db2777", count:"text-pink-700",   add:"bg-pink-600 hover:bg-pink-700",    view:"bg-pink-50 text-pink-700 hover:bg-pink-100" },
              };
              const a = ACCENT[card.accent];
              return (
                <div key={card.key} className="bg-white rounded-2xl shadow p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-semibold leading-tight">{card.title}</p>
                      <p className={`text-2xl font-bold mt-0.5 ${a.count}`}>{card.count}</p>
                    </div>
                    <div className={`${a.bg} rounded-xl p-2`}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={a.iconColor} className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d={card.iconPath} />
                      </svg>
                    </div>
                  </div>
                  {card.latest && <p className="text-xs text-gray-500 truncate">{card.latestDate && <span className="text-gray-400">{card.latestDate} · </span>}{card.latest}</p>}
                  <div className="flex gap-2 mt-auto">
                    <button onClick={card.onAdd}  className={`flex-1 ${a.add} text-white text-xs py-2 rounded-lg transition`}>+ Add</button>
                    <button onClick={card.onView} className={`flex-1 ${a.view} text-xs py-2 rounded-lg transition`}>View all</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CHART */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-2xl shadow p-5">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <p className="text-sm font-semibold text-gray-600">Growth chart</p>
                <div className="flex gap-2 flex-wrap">
                  {(() => {
                    const allActive = METRICS.every((m) => activeMetrics.includes(m.key));
                    return (
                      <button onClick={() => setActiveMetrics(allActive ? ["weight"] : METRICS.map((m) => m.key))}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition ${allActive ? "bg-gray-800 text-white border-transparent" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                        All
                      </button>
                    );
                  })()}
                  {METRICS.map((m) => {
                    const active = activeMetrics.includes(m.key);
                    return (
                      <button key={m.key} onClick={() => toggleMetric(m.key)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition ${active ? "text-white border-transparent" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}
                        style={active ? { backgroundColor: m.color } : {}}>
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#faf5ff" />
                  <XAxis dataKey="date" tick={{ fontSize:11 }} />
                  <YAxis tick={{ fontSize:11 }} />
                  <Tooltip contentStyle={{ borderRadius:"8px", fontSize:"12px" }} />
                  <Legend wrapperStyle={{ fontSize:"11px" }} />
                  {METRICS.filter((m) => activeMetrics.includes(m.key)).map((m) => (
                    <Line key={m.key} type="monotone" dataKey={m.key} name={m.label}
                      stroke={m.color} strokeWidth={2.5} dot={{ r:3 }} activeDot={{ r:5 }} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* DATA TABLE */}
          {growthRecords.length > 0 && (
            <div className="bg-white rounded-2xl shadow p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Growth Entries</p>
                <span className="text-xs text-gray-400">{growthRecords.length} records · scroll to see all</span>
              </div>
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="overflow-y-auto" style={{ maxHeight:"220px" }}>
                    <table className="w-full text-sm min-w-[560px]">
                      <thead>
                        <tr className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                          {["Date","Weight (kg)","Est. Price (KES)","Health","Notes",""].map((h) => (
                            <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {[...growthRecords].reverse().map((r, i) => (
                          <tr key={r.id} className={`hover:bg-purple-50/40 transition ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                            <td className="px-4 py-2.5 text-xs text-gray-700 font-medium whitespace-nowrap">{r.date}</td>
                            <td className="px-4 py-2.5 whitespace-nowrap">{r.weight ? <span className="font-bold text-purple-700">{parseFloat(r.weight).toLocaleString()} kg</span> : <span className="text-gray-300">—</span>}</td>
                            <td className="px-4 py-2.5 whitespace-nowrap">{r.price ? <span className="font-bold text-amber-700">KES {parseFloat(r.price).toLocaleString()}</span> : <span className="text-gray-300">—</span>}</td>
                            <td className="px-4 py-2.5"><HealthBadge score={r.health} /></td>
                            <td className="px-4 py-2.5 text-xs text-gray-500 italic max-w-[160px]"><span className="block truncate" title={r.notes}>{r.notes || "—"}</span></td>
                            <td className="px-4 py-2.5"><button onClick={() => deleteGrowth(r.id)} className="text-gray-300 hover:text-red-500 transition text-lg leading-none">&times;</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {growthRecords.length > 4 && <div className="h-5 bg-gradient-to-t from-gray-100 to-transparent pointer-events-none -mt-5 relative z-10" />}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ MODALS ══ */}

      {modal === "growth" && (
        <Modal title="Add Growth Record" onClose={() => setModal(null)}>
          <Field label="Date"><input type="date" value={newGrowth.date} onChange={(e) => setNewGrowth({...newGrowth, date:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Weight (kg)"><input type="number" placeholder="e.g. 220" value={newGrowth.weight} onChange={(e) => setNewGrowth({...newGrowth, weight:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Estimated Price (KES)"><input type="number" placeholder="e.g. 55000" value={newGrowth.price} onChange={(e) => setNewGrowth({...newGrowth, price:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Health Condition"><HealthPicker value={newGrowth.health} onChange={(v) => setNewGrowth({...newGrowth, health:v})} /></Field>
          <Field label="Notes"><textarea value={newGrowth.notes} onChange={(e) => setNewGrowth({...newGrowth, notes:e.target.value})} className="border rounded-lg p-2 w-full h-20 resize-none" /></Field>
          <div className="flex gap-3 pt-2">
            <button onClick={addGrowth} className="flex-1 bg-purple-600 text-white py-2 rounded-xl hover:bg-purple-700 font-semibold">Save Record</button>
            <button onClick={() => setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button>
          </div>
        </Modal>
      )}

      {modal === "viewGrowth" && (
        <Modal title={`Growth Records — ${growthRecords.length} entries`} onClose={() => setModal(null)}>
          <button onClick={() => setModal("growth")} className="mb-4 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-purple-700">+ Add new record</button>
          {growthRecords.length === 0 ? <p className="text-gray-400 text-center py-8">No records yet.</p> : (
            <div className="space-y-3">
              {[...growthRecords].reverse().map((r) => (
                <div key={r.id} className="bg-purple-50 rounded-xl p-3 flex justify-between items-start">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-purple-900 text-sm">{r.date}</p>
                    {r.weight && <p className="text-xs text-gray-600">⚖️ {r.weight} kg</p>}
                    {r.price  && <p className="text-xs text-amber-700">💰 KES {parseFloat(r.price).toLocaleString()}</p>}
                    {r.health > 0 && <HealthBadge score={r.health} />}
                    {r.notes  && <p className="text-xs text-gray-500 italic">{r.notes}</p>}
                  </div>
                  <button onClick={() => deleteGrowth(r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {modal === "feed" && (
        <Modal title="Add Feed Record" onClose={() => setModal(null)}>
          <Field label="Date"><input type="date" value={newFeed.date} onChange={(e) => setNewFeed({...newFeed, date:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Feed Type"><input placeholder="e.g. Hay, Heifer grower meal" value={newFeed.feedType} onChange={(e) => setNewFeed({...newFeed, feedType:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Amount (kg)"><input type="number" value={newFeed.amount} onChange={(e) => setNewFeed({...newFeed, amount:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Minerals / Supplements"><input placeholder="e.g. Phosphorus, Iodine" value={newFeed.minerals} onChange={(e) => setNewFeed({...newFeed, minerals:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Pre-Breeding Diet Notes"><textarea placeholder="Flushing or conditioning diet before first service..." value={newFeed.transitionDiet} onChange={(e) => setNewFeed({...newFeed, transitionDiet:e.target.value})} className="border rounded-lg p-2 w-full h-16 resize-none" /></Field>
          <div className="flex gap-3 pt-2">
            <button onClick={addFeed} className="flex-1 bg-amber-500 text-white py-2 rounded-xl hover:bg-amber-600 font-semibold">Save Record</button>
            <button onClick={() => setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button>
          </div>
        </Modal>
      )}

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
                    {r.transitionDiet && <p className="text-xs text-purple-600 italic">Pre-breeding: {r.transitionDiet}</p>}
                  </div>
                  <button onClick={() => deleteFeed(r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {modal === "medical" && (
        <Modal title="Add Medical Record" onClose={() => setModal(null)}>
          <Field label="Date"><input type="date" value={newMedical.date} onChange={(e) => setNewMedical({...newMedical, date:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Type">
            <select value={newMedical.type} onChange={(e) => setNewMedical({...newMedical, type:e.target.value})} className="border rounded-lg p-2 w-full">
              <option value="">Select type...</option>
              {["Vaccination","Deworming","Treatment","Reproductive Exam","Brucellosis Test","Checkup","Vitamin Injection","Other"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Medicine / Vaccine"><input value={newMedical.medicine} onChange={(e) => setNewMedical({...newMedical, medicine:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Vet Name"><input value={newMedical.vetName} onChange={(e) => setNewMedical({...newMedical, vetName:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Cost (KES)"><input type="number" value={newMedical.cost} onChange={(e) => setNewMedical({...newMedical, cost:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Notes"><textarea value={newMedical.notes} onChange={(e) => setNewMedical({...newMedical, notes:e.target.value})} className="border rounded-lg p-2 w-full h-20 resize-none" /></Field>
          <div className="flex gap-3 pt-2">
            <button onClick={addMedical} className="flex-1 bg-red-600 text-white py-2 rounded-xl hover:bg-red-700 font-semibold">Save Record</button>
            <button onClick={() => setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button>
          </div>
        </Modal>
      )}

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

      {modal === "heat" && (
        <Modal title="Record Heat Observation" onClose={() => setModal(null)}>
          <Field label="Date Observed"><input type="date" value={newHeat.date} onChange={(e) => setNewHeat({...newHeat, date:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Duration (hours)"><input type="number" placeholder="e.g. 18" value={newHeat.duration} onChange={(e) => setNewHeat({...newHeat, duration:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Intensity">
            <div className="flex gap-2">
              {["Weak","Moderate","Strong"].map((intensity) => (
                <button key={intensity} type="button" onClick={() => setNewHeat({...newHeat, intensity})}
                  className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition
                    ${newHeat.intensity === intensity ? "bg-purple-600 text-white border-transparent" : "bg-gray-50 border-gray-200 hover:border-gray-400"}`}>
                  {intensity}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Notes"><textarea placeholder="Mounting behaviour, discharge, restlessness..." value={newHeat.notes} onChange={(e) => setNewHeat({...newHeat, notes:e.target.value})} className="border rounded-lg p-2 w-full h-16 resize-none" /></Field>
          <div className="flex gap-3 pt-2">
            <button onClick={addHeat} className="flex-1 bg-pink-600 text-white py-2 rounded-xl hover:bg-pink-700 font-semibold">Save Record</button>
            <button onClick={() => setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button>
          </div>
        </Modal>
      )}

      {modal === "viewHeat" && (
        <Modal title={`Heat Records — ${heatRecords.length} entries`} onClose={() => setModal(null)}>
          <button onClick={() => setModal("heat")} className="mb-4 bg-pink-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-pink-700">+ Add new record</button>
          {avgCycle && (
            <div className="mb-4 bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-800">
              📊 Average heat cycle: <span className="font-bold">{avgCycle} days</span> based on {heatRecords.length} observations
            </div>
          )}
          {heatRecords.length === 0 ? <p className="text-gray-400 text-center py-8">No heat records yet.</p> : (
            <div className="space-y-3">
              {[...heatRecords].reverse().map((r) => (
                <div key={r.id} className="bg-pink-50 rounded-xl p-3 flex justify-between items-start">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-pink-900">{r.date}</p>
                    {r.duration  && <p className="text-xs text-gray-600">Duration: {r.duration} hrs</p>}
                    {r.intensity && <p className="text-xs text-gray-600">Intensity: <span className="font-medium">{r.intensity}</span></p>}
                    {r.notes     && <p className="text-xs text-gray-500 italic">{r.notes}</p>}
                  </div>
                  <button onClick={() => deleteHeat(r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
