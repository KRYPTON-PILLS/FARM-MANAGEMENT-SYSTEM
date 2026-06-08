import { useParams, useNavigate } from "react-router-dom";
import { useContext, useState, useMemo } from "react";
import { FarmContext } from "../context/FarmContext";
import { STATUS_CONFIG, STATUSES } from "./Crops";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell,
} from "recharts";

/* ── helpers ── */
const Field = ({ label, children }) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{label}</label>
    {children}
  </div>
);

function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-lg"} max-h-[92vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-green-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const SEVERITY_COLORS = {
  Low:      "bg-yellow-100 text-yellow-800",
  Moderate: "bg-orange-100 text-orange-700",
  High:     "bg-red-100 text-red-700",
  Critical: "bg-red-600 text-white",
};

const HEALTH_COLORS = {
  Excellent: "bg-green-100 text-green-800",
  Good:      "bg-lime-100 text-lime-800",
  Fair:      "bg-yellow-100 text-yellow-700",
  Poor:      "bg-orange-100 text-orange-700",
  Critical:  "bg-red-100 text-red-700",
};

const GROWTH_STAGES = ["Seedling","Vegetative","Tillering","Flowering","Fruiting","Maturing","Ready to Harvest"];
const ACTIVITY_TYPES = ["Planting","Weeding","Fertilizer Application","Spraying","Irrigation","Pruning","Harvesting","Soil Testing","Other"];
const EXPENSE_CATEGORIES = ["Seeds","Fertilizer","Pesticides","Labour","Transport","Machinery","Irrigation","Other"];
const YIELD_UNITS = ["KG","Tonnes","Bags","Crates","Litres","Bundles"];

const PIE_COLORS = ["#16a34a","#2563eb","#d97706","#dc2626","#7c3aed","#0d9488","#db2777","#64748b"];

function daysUntil(d) { return d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null; }

const TABS = ["Overview","Growth Reports","Activities","Diseases","Expenses","Harvest","Timeline","Analytics"];

/* ──────────────────────────────────────────────
   TIMELINE builder — auto from all record arrays
   ────────────────────────────────────────────── */
function buildTimeline(crop) {
  const events = [];
  const push = (date, icon, label, detail, color) => date && events.push({ date, icon, label, detail, color });

  push(crop.createdAt?.split("T")[0], "🌱", "Crop Created", crop.name, "text-green-700");
  push(crop.plantingDate, "🌾", "Planted", crop.fieldName ? `in ${crop.fieldName}` : "", "text-blue-700");

  (crop.growthReports || []).forEach((r) =>
    push(r.date, "📸", "Growth Report", `Height: ${r.heightCm || "—"} cm · Stage: ${r.stage || "—"} · ${r.healthStatus || ""}`, "text-teal-700"));

  (crop.activities || []).forEach((r) =>
    push(r.date, r.type === "Harvesting" ? "🚜" : r.type === "Fertilizer Application" ? "🧪" : r.type === "Spraying" ? "💊" : r.type === "Irrigation" ? "💧" : "⚙️",
      r.type, r.description || "", "text-gray-700"));

  (crop.diseases || []).forEach((r) =>
    push(r.date, "🐛", `${r.name} Detected`, `Severity: ${r.severity}`, "text-red-700"));

  (crop.expenses || []).forEach((r) =>
    push(r.date, "💸", r.category, `KES ${parseFloat(r.amount || 0).toLocaleString()}`, "text-amber-700"));

  (crop.harvestRecords || []).forEach((r) =>
    push(r.date, "🚜", "Harvested", `${r.yield} ${r.unit} · Revenue: KES ${(r.revenue || 0).toLocaleString()}`, "text-lime-700"));

  return events.filter((e) => e.date).sort((a, b) => new Date(a.date) - new Date(b.date));
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */
export default function CropProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { crops = [], setCrops } = useContext(FarmContext);

  const crop = crops.find((c) => c.id?.toString() === id);
  const updateCrop = (u) => setCrops((prev) => prev.map((c) => c.id?.toString() === id ? u : c));

  const [activeTab,   setActiveTab]   = useState("Overview");
  const [modal,       setModal]       = useState(null);

  /* form states */
  const [newGrowth,   setNewGrowth]   = useState({ date:"", photo:"", heightCm:"", stage:"Seedling", healthStatus:"Good", notes:"" });
  const [newActivity, setNewActivity] = useState({ date:"", type:"Weeding", description:"", cost:"" });
  const [newDisease,  setNewDisease]  = useState({ date:"", name:"", severity:"Moderate", treatment:"", cost:"", image:"" });
  const [newExpense,  setNewExpense]  = useState({ date:"", category:"Fertilizer", description:"", amount:"" });
  const [newHarvest,  setNewHarvest]  = useState({ date:"", yield:"", unit:"KG", sellingPrice:"", buyer:"", notes:"" });
  const [editOverview, setEditOverview] = useState(null);

  if (!crop) return <p className="p-6 text-red-600">Crop not found.</p>;

  const growthReports  = crop.growthReports  || [];
  const activities     = crop.activities     || [];
  const diseases       = crop.diseases       || [];
  const expenses       = crop.expenses       || [];
  const harvestRecords = crop.harvestRecords || [];

  /* ── add helpers ── */
  const addGrowth = () => {
    if (!newGrowth.date) return;
    updateCrop({ ...crop, growthReports: [...growthReports, { ...newGrowth, id: Date.now() }] });
    setNewGrowth({ date:"", photo:"", heightCm:"", stage:"Seedling", healthStatus:"Good", notes:"" });
    setModal(null);
  };
  const addActivity = () => {
    if (!newActivity.date) return;
    updateCrop({ ...crop, activities: [...activities, { ...newActivity, id: Date.now() }] });
    setNewActivity({ date:"", type:"Weeding", description:"", cost:"" });
    setModal(null);
  };
  const addDisease = () => {
    if (!newDisease.date || !newDisease.name) return;
    updateCrop({ ...crop, diseases: [...diseases, { ...newDisease, id: Date.now() }] });
    setNewDisease({ date:"", name:"", severity:"Moderate", treatment:"", cost:"", image:"" });
    setModal(null);
  };
  const addExpense = () => {
    if (!newExpense.date || !newExpense.amount) return;
    updateCrop({ ...crop, expenses: [...expenses, { ...newExpense, id: Date.now() }] });
    setNewExpense({ date:"", category:"Fertilizer", description:"", amount:"" });
    setModal(null);
  };
  const addHarvest = () => {
    if (!newHarvest.date || !newHarvest.yield) return;
    const revenue = (parseFloat(newHarvest.yield) * parseFloat(newHarvest.sellingPrice || 0)).toFixed(0);
    updateCrop({ ...crop, harvestRecords: [...harvestRecords, { ...newHarvest, id: Date.now(), revenue }] });
    setNewHarvest({ date:"", yield:"", unit:"KG", sellingPrice:"", buyer:"", notes:"" });
    setModal(null);
  };
  const del = (field, rid) =>
    updateCrop({ ...crop, [field]: (crop[field] || []).filter((r) => r.id !== rid) });

  const saveOverview = () => { updateCrop({ ...crop, ...editOverview }); setEditOverview(null); };

  /* ── computed analytics ── */
  const totalExpenses  = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const totalRevenue   = harvestRecords.reduce((s, h) => s + (parseFloat(h.revenue) || 0), 0);
  const netProfit      = totalRevenue - totalExpenses;
  const totalYield     = harvestRecords.reduce((s, h) => s + (parseFloat(h.yield) || 0), 0);
  const costPerUnit    = totalYield > 0 ? (totalExpenses / totalYield).toFixed(2) : null;
  const pricePerUnit   = totalYield > 0 && totalRevenue > 0 ? (totalRevenue / totalYield).toFixed(2) : null;

  const expenseByCategory = EXPENSE_CATEGORIES.map((cat) => ({
    name: cat,
    amount: expenses.filter((e) => e.category === cat).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0),
  })).filter((e) => e.amount > 0);

  const diseaseCounts = diseases.reduce((acc, d) => {
    acc[d.name] = (acc[d.name] || 0) + 1;
    return acc;
  }, {});
  const diseaseChartData = Object.entries(diseaseCounts).map(([name, count]) => ({ name, count }));

  const heightChartData = [...growthReports]
    .filter((r) => r.heightCm)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((r) => ({ date: r.date, height: parseFloat(r.heightCm) }));

  const timeline = useMemo(() => buildTimeline(crop), [crop]);

  const cfg   = STATUS_CONFIG[crop.status] || {};
  const dtu   = daysUntil(crop.expectedHarvestDate);
  const nearHarvest = dtu !== null && dtu >= 0 && dtu <= 14 && crop.status !== "Harvested";

  /* ════════════════ RENDER ════════════════ */
  return (
    <div className="bg-green-50 flex flex-col min-h-full">

      {/* TOP BAR */}
      <div className="flex items-center gap-4 px-6 py-4 bg-white shadow-sm sticky top-0 z-30">
        <button onClick={() => navigate(-1)}
          className="bg-white shadow w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-green-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-bold text-green-900">{crop.name}</h2>
          {crop.variety && <p className="text-xs text-gray-400">{crop.variety}</p>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {crop.fieldName && <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">📍 {crop.fieldName}</span>}
          <span className={`text-xs font-semibold px-3 py-1 rounded-full text-white ${cfg.color || "bg-gray-400"}`}>{crop.status}</span>
          {nearHarvest && <span className="text-xs font-semibold px-3 py-1 rounded-full bg-lime-500 text-white">{dtu === 0 ? "Harvest today!" : `${dtu}d to harvest`}</span>}
        </div>
      </div>

      {/* TAB BAR */}
      <div className="bg-white border-b px-6 overflow-x-auto sticky top-[69px] z-20">
        <div className="flex gap-1 min-w-max">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition ${
                activeTab === tab
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="flex-1 p-6">

        {/* ══════════ OVERVIEW ══════════ */}
        {activeTab === "Overview" && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* image */}
            <div className="lg:col-span-1">
              <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg bg-gray-100 group mb-4">
                {crop.image
                  ? <img src={crop.image} alt={crop.name} className="w-full h-full object-cover" />
                  : <div className="flex items-center justify-center h-full text-6xl">🌾</div>}
                <label className="absolute inset-0 flex items-end justify-center pb-4 bg-black/0 group-hover:bg-black/30 transition cursor-pointer">
                  <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-green-800 text-xs font-semibold px-3 py-1 rounded-full transition">Change photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    const r = new FileReader(); r.onloadend = () => updateCrop({ ...crop, image: r.result }); r.readAsDataURL(f);
                  }} />
                </label>
              </div>
              {/* quick stats */}
              <div className="bg-white rounded-2xl shadow p-4 space-y-2 text-sm">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Quick Stats</p>
                {[
                  { l:"Total Expenses", v: totalExpenses > 0 ? `KES ${totalExpenses.toLocaleString()}` : "—" },
                  { l:"Total Revenue",  v: totalRevenue  > 0 ? `KES ${totalRevenue.toLocaleString()}`  : "—" },
                  { l:"Net Profit",     v: totalRevenue > 0  ? `KES ${netProfit.toLocaleString()}`     : "—" },
                  { l:"Total Yield",    v: totalYield   > 0  ? `${totalYield.toLocaleString()} ${harvestRecords[0]?.unit || ""}` : "—" },
                  { l:"Disease Events", v: diseases.length },
                  { l:"Activities",     v: activities.length },
                ].map(({ l, v }) => (
                  <div key={l} className="flex justify-between border-b last:border-0 pb-1 last:pb-0">
                    <span className="text-gray-500">{l}</span>
                    <span className="font-semibold text-green-900">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* details */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl shadow p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-green-900 text-lg">{crop.name}</h3>
                  {!editOverview
                    ? <button onClick={() => setEditOverview({ ...crop })} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700 transition">Edit Details</button>
                    : <div className="flex gap-2">
                        <button onClick={saveOverview} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm">Save</button>
                        <button onClick={() => setEditOverview(null)} className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm">Cancel</button>
                      </div>}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* status */}
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Status</p>
                    {editOverview
                      ? <select value={editOverview.status} onChange={(e) => setEditOverview({ ...editOverview, status: e.target.value })} className="border rounded-lg p-2 w-full text-sm">
                          {STATUSES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      : <span className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full text-white ${cfg.color}`}>{crop.status}</span>}
                  </div>

                  {[
                    { l:"Field / Location", f:"fieldName",          placeholder:"e.g. North Field" },
                    { l:"Area",             f:"area",               placeholder:"e.g. 2",      type:"number" },
                    { l:"Area Unit",        f:"areaUnit",           select: ["Acres","Hectares","Square Metres"] },
                    { l:"Variety",          f:"variety",            placeholder:"e.g. DK8031" },
                    { l:"Planting Date",    f:"plantingDate",       type:"date" },
                    { l:"Expected Harvest", f:"expectedHarvestDate",type:"date" },
                  ].map(({ l, f, placeholder, type="text", select }) => (
                    <div key={f}>
                      <p className="text-xs text-gray-400 uppercase font-semibold mb-1">{l}</p>
                      {editOverview
                        ? select
                          ? <select value={editOverview[f] || ""} onChange={(e) => setEditOverview({ ...editOverview, [f]: e.target.value })} className="border rounded-lg p-2 w-full text-sm">
                              {select.map((o) => <option key={o}>{o}</option>)}
                            </select>
                          : <input type={type} placeholder={placeholder} value={editOverview[f] || ""}
                              onChange={(e) => setEditOverview({ ...editOverview, [f]: e.target.value })}
                              className="border rounded-lg p-2 w-full text-sm" />
                        : <p className="text-green-900 font-semibold text-sm">{crop[f] || <span className="text-gray-300">—</span>}</p>}
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Notes</p>
                  {editOverview
                    ? <textarea value={editOverview.notes || ""} onChange={(e) => setEditOverview({ ...editOverview, notes: e.target.value })} className="border rounded-lg p-2 w-full text-sm h-20 resize-none" />
                    : <p className="text-sm text-gray-600">{crop.notes || <span className="text-gray-300">No notes</span>}</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ GROWTH REPORTS ══════════ */}
        {activeTab === "Growth Reports" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-green-900 text-lg">Growth Reports <span className="text-gray-400 font-normal text-base">({growthReports.length})</span></h3>
              <button onClick={() => setModal("addGrowth")} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700 transition">+ Add Report</button>
            </div>

            {/* height chart */}
            {heightChartData.length > 1 && (
              <div className="bg-white rounded-2xl shadow p-5">
                <p className="text-sm font-semibold text-gray-600 mb-3">Crop height over time (cm)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={heightChartData}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#f0fdf4" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                    <Line type="monotone" dataKey="height" name="Height (cm)" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* reports grid */}
            {growthReports.length === 0
              ? <div className="text-center py-16 text-gray-400"><p className="text-4xl mb-3">📸</p><p>No growth reports yet.</p></div>
              : <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...growthReports].reverse().map((r, i) => (
                    <div key={r.id} className="bg-white rounded-2xl shadow overflow-hidden">
                      {r.photo
                        ? <img src={r.photo} alt={`Report ${i+1}`} className="w-full h-40 object-cover" />
                        : <div className="w-full h-40 bg-green-50 flex items-center justify-center text-4xl">🌱</div>}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-bold text-green-900">{r.date}</p>
                          <button onClick={() => del("growthReports", r.id)} className="text-gray-300 hover:text-red-500 text-lg">&times;</button>
                        </div>
                        {r.heightCm && <p className="text-xs text-gray-600">📏 Height: <strong>{r.heightCm} cm</strong></p>}
                        {r.stage     && <p className="text-xs text-gray-600">🌿 Stage: <strong>{r.stage}</strong></p>}
                        {r.healthStatus && (
                          <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${HEALTH_COLORS[r.healthStatus] || "bg-gray-100 text-gray-700"}`}>
                            {r.healthStatus}
                          </span>
                        )}
                        {r.notes && <p className="text-xs text-gray-500 mt-1 italic">{r.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>}
          </div>
        )}

        {/* ══════════ ACTIVITIES ══════════ */}
        {activeTab === "Activities" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-green-900 text-lg">Activity Records <span className="text-gray-400 font-normal text-base">({activities.length})</span></h3>
              <button onClick={() => setModal("addActivity")} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700 transition">+ Add Activity</button>
            </div>
            {activities.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-4 text-sm font-semibold text-gray-600">
                Total activity costs: <span className="text-green-700 font-bold">KES {activities.reduce((s, a) => s + (parseFloat(a.cost) || 0), 0).toLocaleString()}</span>
              </div>
            )}
            {activities.length === 0
              ? <div className="text-center py-16 text-gray-400"><p className="text-4xl mb-3">⚙️</p><p>No activities recorded yet.</p></div>
              : <div className="space-y-3">
                  {[...activities].reverse().map((a) => (
                    <div key={a.id} className="bg-white rounded-2xl shadow p-4 flex items-start justify-between">
                      <div className="flex gap-3 items-start">
                        <span className="text-2xl">{a.type==="Fertilizer Application"?"🧪":a.type==="Spraying"?"💊":a.type==="Irrigation"?"💧":a.type==="Harvesting"?"🚜":a.type==="Weeding"?"🌿":a.type==="Planting"?"🌱":"⚙️"}</span>
                        <div>
                          <p className="font-bold text-green-900">{a.type}</p>
                          <p className="text-xs text-gray-500">{a.date}</p>
                          {a.description && <p className="text-sm text-gray-600 mt-0.5">{a.description}</p>}
                          {a.cost && <p className="text-xs text-amber-700 font-semibold mt-0.5">KES {parseFloat(a.cost).toLocaleString()}</p>}
                        </div>
                      </div>
                      <button onClick={() => del("activities", a.id)} className="text-gray-300 hover:text-red-500 text-lg">&times;</button>
                    </div>
                  ))}
                </div>}
          </div>
        )}

        {/* ══════════ DISEASES ══════════ */}
        {activeTab === "Diseases" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-green-900 text-lg">Disease Records <span className="text-gray-400 font-normal text-base">({diseases.length})</span></h3>
              <button onClick={() => setModal("addDisease")} className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-red-700 transition">+ Add Disease</button>
            </div>
            {diseases.length === 0
              ? <div className="text-center py-16 text-gray-400"><p className="text-4xl mb-3">🐛</p><p>No disease records yet.</p></div>
              : <div className="grid md:grid-cols-2 gap-4">
                  {[...diseases].reverse().map((d) => (
                    <div key={d.id} className="bg-white rounded-2xl shadow overflow-hidden">
                      {d.image && <img src={d.image} alt={d.name} className="w-full h-40 object-cover" />}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-red-900">{d.name}</p>
                          <button onClick={() => del("diseases", d.id)} className="text-gray-300 hover:text-red-500 text-lg">&times;</button>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{d.date}</p>
                        <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full ${SEVERITY_COLORS[d.severity] || "bg-gray-100"}`}>
                          {d.severity}
                        </span>
                        {d.treatment && <p className="text-xs text-gray-600 mt-1">Treatment: {d.treatment}</p>}
                        {d.cost      && <p className="text-xs text-amber-700 mt-0.5 font-semibold">KES {parseFloat(d.cost).toLocaleString()}</p>}
                      </div>
                    </div>
                  ))}
                </div>}
          </div>
        )}

        {/* ══════════ EXPENSES ══════════ */}
        {activeTab === "Expenses" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-green-900 text-lg">Expenses <span className="text-gray-400 font-normal text-base">({expenses.length})</span></h3>
              <button onClick={() => setModal("addExpense")} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-amber-600 transition">+ Add Expense</button>
            </div>
            {totalExpenses > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl shadow p-4">
                  <p className="text-xs text-gray-400 uppercase font-semibold">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-700 mt-1">KES {totalExpenses.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-2xl shadow p-4">
                  <p className="text-xs text-gray-400 uppercase font-semibold">Expense Categories</p>
                  <p className="text-2xl font-bold text-amber-700 mt-1">{expenseByCategory.length}</p>
                </div>
              </div>
            )}
            {expenseByCategory.length > 1 && (
              <div className="bg-white rounded-2xl shadow p-5">
                <p className="text-sm font-semibold text-gray-600 mb-3">Expense breakdown</p>
                <div className="flex flex-wrap gap-6 items-center">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie data={expenseByCategory} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                        {expenseByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => `KES ${v.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {expenseByCategory.map((e, i) => (
                      <div key={e.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-sm text-gray-600">{e.name}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-800">KES {e.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {expenses.length === 0
              ? <div className="text-center py-16 text-gray-400"><p className="text-4xl mb-3">💸</p><p>No expenses recorded yet.</p></div>
              : <div className="space-y-3">
                  {[...expenses].reverse().map((e) => (
                    <div key={e.id} className="bg-white rounded-2xl shadow p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-amber-900">{e.category}</p>
                        <p className="text-xs text-gray-500">{e.date}{e.description ? ` · ${e.description}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-amber-700">KES {parseFloat(e.amount).toLocaleString()}</span>
                        <button onClick={() => del("expenses", e.id)} className="text-gray-300 hover:text-red-500 text-lg">&times;</button>
                      </div>
                    </div>
                  ))}
                </div>}
          </div>
        )}

        {/* ══════════ HARVEST ══════════ */}
        {activeTab === "Harvest" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-green-900 text-lg">Harvest Records <span className="text-gray-400 font-normal text-base">({harvestRecords.length})</span></h3>
              <button onClick={() => setModal("addHarvest")} className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-teal-700 transition">+ Record Harvest</button>
            </div>
            {totalRevenue > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { l:"Total Yield",    v:`${totalYield.toLocaleString()} ${harvestRecords[0]?.unit || ""}`, c:"text-teal-700" },
                  { l:"Total Revenue",  v:`KES ${totalRevenue.toLocaleString()}`,  c:"text-green-700" },
                  { l:"Total Expenses", v:`KES ${totalExpenses.toLocaleString()}`, c:"text-red-600"   },
                  { l:"Net Profit",     v:`KES ${netProfit.toLocaleString()}`,     c: netProfit >= 0 ? "text-green-700" : "text-red-600" },
                ].map(({ l, v, c }) => (
                  <div key={l} className="bg-white rounded-2xl shadow p-4">
                    <p className="text-xs text-gray-400 uppercase font-semibold">{l}</p>
                    <p className={`text-xl font-bold mt-1 ${c}`}>{v}</p>
                  </div>
                ))}
              </div>
            )}
            {costPerUnit && pricePerUnit && (
              <div className="bg-white rounded-2xl shadow p-5 grid md:grid-cols-3 gap-4 text-center">
                <div><p className="text-xs text-gray-400 uppercase font-semibold mb-1">Cost per unit</p><p className="text-xl font-bold text-red-600">KES {costPerUnit}</p></div>
                <div><p className="text-xs text-gray-400 uppercase font-semibold mb-1">Revenue per unit</p><p className="text-xl font-bold text-green-700">KES {pricePerUnit}</p></div>
                <div><p className="text-xs text-gray-400 uppercase font-semibold mb-1">Profit per unit</p><p className={`text-xl font-bold ${(pricePerUnit - costPerUnit) >= 0 ? "text-green-700" : "text-red-600"}`}>KES {(pricePerUnit - costPerUnit).toFixed(2)}</p></div>
              </div>
            )}
            {harvestRecords.length === 0
              ? <div className="text-center py-16 text-gray-400"><p className="text-4xl mb-3">🚜</p><p>No harvest records yet.</p></div>
              : <div className="space-y-3">
                  {[...harvestRecords].reverse().map((h) => (
                    <div key={h.id} className="bg-white rounded-2xl shadow p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-teal-900 text-lg">{h.yield} {h.unit}</p>
                          <p className="text-xs text-gray-500">{h.date}{h.buyer ? ` · Buyer: ${h.buyer}` : ""}</p>
                          {h.sellingPrice && <p className="text-xs text-gray-600 mt-0.5">Selling price: KES {parseFloat(h.sellingPrice).toLocaleString()} / {h.unit}</p>}
                          {h.notes && <p className="text-xs text-gray-500 mt-1 italic">{h.notes}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          {h.revenue && <div className="text-right"><p className="text-xs text-gray-400">Revenue</p><p className="font-bold text-green-700 text-lg">KES {parseFloat(h.revenue).toLocaleString()}</p></div>}
                          <button onClick={() => del("harvestRecords", h.id)} className="text-gray-300 hover:text-red-500 text-lg">&times;</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>}
          </div>
        )}

        {/* ══════════ TIMELINE ══════════ */}
        {activeTab === "Timeline" && (
          <div className="space-y-4">
            <h3 className="font-bold text-green-900 text-lg">Crop Timeline</h3>
            <p className="text-xs text-gray-400">Auto-generated from all records. No manual entry needed.</p>
            {timeline.length === 0
              ? <div className="text-center py-16 text-gray-400"><p className="text-4xl mb-3">📅</p><p>No events recorded yet. Add activities, growth reports, or harvests to see the timeline.</p></div>
              : (
                <div className="relative">
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-green-100" />
                  <div className="space-y-4">
                    {timeline.map((e, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="w-16 shrink-0 flex flex-col items-center">
                          <div className="w-9 h-9 rounded-full bg-white shadow border-2 border-green-200 flex items-center justify-center text-lg z-10">
                            {e.icon}
                          </div>
                        </div>
                        <div className="bg-white rounded-xl shadow p-3 flex-1 mb-1">
                          <div className="flex items-center justify-between">
                            <p className={`font-bold text-sm ${e.color}`}>{e.label}</p>
                            <p className="text-xs text-gray-400">{e.date}</p>
                          </div>
                          {e.detail && <p className="text-xs text-gray-500 mt-0.5">{e.detail}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}

        {/* ══════════ ANALYTICS ══════════ */}
        {activeTab === "Analytics" && (
          <div className="space-y-6">
            <h3 className="font-bold text-green-900 text-lg">Analytics</h3>

            {/* profit analysis */}
            {totalRevenue > 0 || totalExpenses > 0 ? (
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { l:"Total Revenue",  v:`KES ${totalRevenue.toLocaleString()}`,  c:"text-green-700", bg:"bg-green-50 border-green-200" },
                  { l:"Total Expenses", v:`KES ${totalExpenses.toLocaleString()}`, c:"text-red-600",   bg:"bg-red-50 border-red-200"     },
                  { l:"Net Profit",     v:`KES ${netProfit.toLocaleString()}`,     c: netProfit >= 0 ? "text-green-700" : "text-red-600", bg: netProfit >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200" },
                ].map(({ l, v, c, bg }) => (
                  <div key={l} className={`rounded-2xl border p-5 ${bg}`}>
                    <p className="text-xs text-gray-500 uppercase font-semibold">{l}</p>
                    <p className={`text-2xl font-bold mt-1 ${c}`}>{v}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-400 text-sm">Add expenses and harvest records to see profit analysis.</p>}

            {/* cost/profit per unit */}
            {costPerUnit && (
              <div className="bg-white rounded-2xl shadow p-5">
                <p className="text-sm font-semibold text-gray-600 mb-3">Unit Economics</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><p className="text-xs text-gray-400 uppercase mb-1">Cost / unit</p><p className="text-xl font-bold text-red-600">KES {costPerUnit}</p></div>
                  <div><p className="text-xs text-gray-400 uppercase mb-1">Revenue / unit</p><p className="text-xl font-bold text-green-700">KES {pricePerUnit || "—"}</p></div>
                  <div><p className="text-xs text-gray-400 uppercase mb-1">Profit / unit</p><p className={`text-xl font-bold ${(parseFloat(pricePerUnit || 0) - parseFloat(costPerUnit)) >= 0 ? "text-green-700" : "text-red-600"}`}>KES {pricePerUnit ? (parseFloat(pricePerUnit) - parseFloat(costPerUnit)).toFixed(2) : "—"}</p></div>
                </div>
              </div>
            )}

            {/* expense breakdown */}
            {expenseByCategory.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-5">
                <p className="text-sm font-semibold text-gray-600 mb-3">Expense breakdown (KES)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={expenseByCategory} barSize={32}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#fef9c3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => `KES ${v.toLocaleString()}`} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                    <Bar dataKey="amount" fill="#d97706" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* height trend */}
            {heightChartData.length > 1 && (
              <div className="bg-white rounded-2xl shadow p-5">
                <p className="text-sm font-semibold text-gray-600 mb-3">Crop height trend (cm)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={heightChartData}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#f0fdf4" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                    <Line type="monotone" dataKey="height" name="Height (cm)" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* disease frequency */}
            {diseaseChartData.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-5">
                <p className="text-sm font-semibold text-gray-600 mb-3">Disease frequency</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={diseaseChartData} barSize={32}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#fef2f2" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                    <Bar dataKey="count" fill="#dc2626" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {totalRevenue === 0 && totalExpenses === 0 && heightChartData.length === 0 && diseaseChartData.length === 0 && (
              <div className="text-center py-16 text-gray-400"><p className="text-4xl mb-3">📊</p><p>Add records across the other tabs to see analytics here.</p></div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════ MODALS ══════════════ */}

      {modal === "addGrowth" && (
        <Modal title="Add Growth Report" onClose={() => setModal(null)}>
          <Field label="Date"><input type="date" value={newGrowth.date} onChange={(e) => setNewGrowth({...newGrowth, date:e.target.value})} className="border rounded-lg p-2 w-full"/></Field>
          <Field label="Photo (optional)">
            <input type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0]; if (!f) return;
              const r = new FileReader(); r.onloadend = () => setNewGrowth({...newGrowth, photo:r.result}); r.readAsDataURL(f);
            }} className="border rounded-lg p-2 w-full"/>
          </Field>
          <Field label="Crop Height (cm)"><input type="number" placeholder="e.g. 45" value={newGrowth.heightCm} onChange={(e) => setNewGrowth({...newGrowth, heightCm:e.target.value})} className="border rounded-lg p-2 w-full"/></Field>
          <Field label="Growth Stage"><select value={newGrowth.stage} onChange={(e) => setNewGrowth({...newGrowth, stage:e.target.value})} className="border rounded-lg p-2 w-full">{GROWTH_STAGES.map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Field label="Health Status">
            <div className="flex gap-2 flex-wrap">
              {["Excellent","Good","Fair","Poor","Critical"].map((h) => (
                <button key={h} type="button" onClick={() => setNewGrowth({...newGrowth, healthStatus:h})}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${newGrowth.healthStatus===h ? "bg-green-600 text-white border-transparent" : "bg-gray-50 border-gray-200 hover:border-gray-400"}`}>
                  {h}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Notes"><textarea value={newGrowth.notes} onChange={(e) => setNewGrowth({...newGrowth, notes:e.target.value})} className="border rounded-lg p-2 w-full h-16 resize-none"/></Field>
          <div className="flex gap-3 pt-2"><button onClick={addGrowth} className="flex-1 bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 font-semibold">Save Report</button><button onClick={() => setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div>
        </Modal>
      )}

      {modal === "addActivity" && (
        <Modal title="Add Activity" onClose={() => setModal(null)}>
          <Field label="Date"><input type="date" value={newActivity.date} onChange={(e) => setNewActivity({...newActivity, date:e.target.value})} className="border rounded-lg p-2 w-full"/></Field>
          <Field label="Activity Type"><select value={newActivity.type} onChange={(e) => setNewActivity({...newActivity, type:e.target.value})} className="border rounded-lg p-2 w-full">{ACTIVITY_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Description"><textarea placeholder="What was done?" value={newActivity.description} onChange={(e) => setNewActivity({...newActivity, description:e.target.value})} className="border rounded-lg p-2 w-full h-20 resize-none"/></Field>
          <Field label="Cost (KES)"><input type="number" placeholder="e.g. 4500" value={newActivity.cost} onChange={(e) => setNewActivity({...newActivity, cost:e.target.value})} className="border rounded-lg p-2 w-full"/></Field>
          <div className="flex gap-3 pt-2"><button onClick={addActivity} className="flex-1 bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 font-semibold">Save Activity</button><button onClick={() => setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div>
        </Modal>
      )}

      {modal === "addDisease" && (
        <Modal title="Add Disease Record" onClose={() => setModal(null)}>
          <Field label="Date"><input type="date" value={newDisease.date} onChange={(e) => setNewDisease({...newDisease, date:e.target.value})} className="border rounded-lg p-2 w-full"/></Field>
          <Field label="Disease / Pest Name"><input placeholder="e.g. Fall Armyworm, Leaf Rust, Blight" value={newDisease.name} onChange={(e) => setNewDisease({...newDisease, name:e.target.value})} className="border rounded-lg p-2 w-full"/></Field>
          <Field label="Severity">
            <div className="flex gap-2">
              {["Low","Moderate","High","Critical"].map((s) => (
                <button key={s} type="button" onClick={() => setNewDisease({...newDisease, severity:s})}
                  className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition ${newDisease.severity===s?(s==="Critical"?"bg-red-600 text-white":s==="High"?"bg-red-400 text-white":s==="Moderate"?"bg-orange-400 text-white":"bg-yellow-400 text-white"):"bg-gray-50 border-gray-200 hover:border-gray-400"}`}>
                  {s}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Treatment Applied"><input placeholder="e.g. Belt SC, Coragen" value={newDisease.treatment} onChange={(e) => setNewDisease({...newDisease, treatment:e.target.value})} className="border rounded-lg p-2 w-full"/></Field>
          <Field label="Treatment Cost (KES)"><input type="number" value={newDisease.cost} onChange={(e) => setNewDisease({...newDisease, cost:e.target.value})} className="border rounded-lg p-2 w-full"/></Field>
          <Field label="Photo (optional)">
            <input type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0]; if (!f) return;
              const r = new FileReader(); r.onloadend = () => setNewDisease({...newDisease, image:r.result}); r.readAsDataURL(f);
            }} className="border rounded-lg p-2 w-full"/>
          </Field>
          <div className="flex gap-3 pt-2"><button onClick={addDisease} className="flex-1 bg-red-600 text-white py-2 rounded-xl hover:bg-red-700 font-semibold">Save Record</button><button onClick={() => setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div>
        </Modal>
      )}

      {modal === "addExpense" && (
        <Modal title="Add Expense" onClose={() => setModal(null)}>
          <Field label="Date"><input type="date" value={newExpense.date} onChange={(e) => setNewExpense({...newExpense, date:e.target.value})} className="border rounded-lg p-2 w-full"/></Field>
          <Field label="Category"><select value={newExpense.category} onChange={(e) => setNewExpense({...newExpense, category:e.target.value})} className="border rounded-lg p-2 w-full">{EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Description"><input placeholder="e.g. CAN Fertilizer 2 bags" value={newExpense.description} onChange={(e) => setNewExpense({...newExpense, description:e.target.value})} className="border rounded-lg p-2 w-full"/></Field>
          <Field label="Amount (KES)"><input type="number" placeholder="e.g. 4500" value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount:e.target.value})} className="border rounded-lg p-2 w-full"/></Field>
          <div className="flex gap-3 pt-2"><button onClick={addExpense} className="flex-1 bg-amber-500 text-white py-2 rounded-xl hover:bg-amber-600 font-semibold">Save Expense</button><button onClick={() => setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div>
        </Modal>
      )}

      {modal === "addHarvest" && (
        <Modal title="Record Harvest" onClose={() => setModal(null)}>
          <Field label="Harvest Date"><input type="date" value={newHarvest.date} onChange={(e) => setNewHarvest({...newHarvest, date:e.target.value})} className="border rounded-lg p-2 w-full"/></Field>
          <div className="flex gap-3">
            <div className="flex-1"><Field label="Yield"><input type="number" placeholder="e.g. 3500" value={newHarvest.yield} onChange={(e) => setNewHarvest({...newHarvest, yield:e.target.value})} className="border rounded-lg p-2 w-full"/></Field></div>
            <div className="w-32"><Field label="Unit"><select value={newHarvest.unit} onChange={(e) => setNewHarvest({...newHarvest, unit:e.target.value})} className="border rounded-lg p-2 w-full">{YIELD_UNITS.map((u) => <option key={u}>{u}</option>)}</select></Field></div>
          </div>
          <Field label="Selling Price (KES per unit)"><input type="number" placeholder="e.g. 40" value={newHarvest.sellingPrice} onChange={(e) => setNewHarvest({...newHarvest, sellingPrice:e.target.value})} className="border rounded-lg p-2 w-full"/></Field>
          {newHarvest.yield && newHarvest.sellingPrice && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800 mb-3">
              💰 Estimated Revenue: <strong>KES {(parseFloat(newHarvest.yield) * parseFloat(newHarvest.sellingPrice)).toLocaleString()}</strong>
            </div>
          )}
          <Field label="Buyer"><input placeholder="e.g. Local market, Cooperative" value={newHarvest.buyer} onChange={(e) => setNewHarvest({...newHarvest, buyer:e.target.value})} className="border rounded-lg p-2 w-full"/></Field>
          <Field label="Notes"><textarea value={newHarvest.notes} onChange={(e) => setNewHarvest({...newHarvest, notes:e.target.value})} className="border rounded-lg p-2 w-full h-16 resize-none"/></Field>
          <div className="flex gap-3 pt-2"><button onClick={addHarvest} className="flex-1 bg-teal-600 text-white py-2 rounded-xl hover:bg-teal-700 font-semibold">Save Harvest</button><button onClick={() => setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button></div>
        </Modal>
      )}
    </div>
  );
}