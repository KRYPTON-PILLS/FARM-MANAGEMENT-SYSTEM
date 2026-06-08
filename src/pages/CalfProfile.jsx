import { useParams, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { FarmContext } from "../context/FarmContext";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

/* ─── helpers ─── */
function ageLabel(birthDate) {
  if (!birthDate) return "—";
  const days = Math.floor((new Date() - new Date(birthDate)) / 86400000);
  if (days < 0)  return "Not born yet";
  if (days === 0) return "Born today";
  if (days < 7)  return `${days} day${days !== 1 ? "s" : ""} old`;
  if (days < 60) return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? "s" : ""} old`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? "s" : ""} old`;
}

function daysOld(birthDate) {
  if (!birthDate) return null;
  return Math.floor((new Date() - new Date(birthDate)) / 86400000);
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-orange-900">{title}</h3>
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

/* ─── Colostrum status strip ─── */
function ColostrumStrip({ record, daysOldVal, onRecord }) {
  if (record) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs">
        <p className="font-bold text-green-800 mb-1">✅ Colostrum recorded</p>
        <p className="text-gray-600">Time: {record.timeAfterBirth} hrs after birth</p>
        <p className="text-gray-600">Amount: {record.amount} mL</p>
        {record.source && <p className="text-gray-600">Source: {record.source}</p>}
        {record.notes  && <p className="text-gray-500 italic">{record.notes}</p>}
      </div>
    );
  }
  const urgent = daysOldVal !== null && daysOldVal <= 3;
  return (
    <div className={`border rounded-xl p-3 text-xs ${urgent ? "bg-red-50 border-red-300" : "bg-amber-50 border-amber-200"}`}>
      {urgent
        ? <p className="font-bold text-red-700 mb-2">⚠️ Colostrum not yet recorded! Critical in first 24 hrs.</p>
        : <p className="font-semibold text-amber-700 mb-2">Colostrum not recorded</p>}
      <button onClick={onRecord}
        className={`w-full py-1.5 rounded-lg font-semibold text-white transition
          ${urgent ? "bg-red-600 hover:bg-red-700" : "bg-amber-500 hover:bg-amber-600"}`}>
        Record now
      </button>
    </div>
  );
}

/* ─── Weaning progress bar ─── */
function WeaningBar({ birthDate, targetDate }) {
  if (!birthDate || !targetDate) return null;
  const total = new Date(targetDate) - new Date(birthDate);
  const elapsed = new Date() - new Date(birthDate);
  const pct = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  const remaining = Math.ceil((new Date(targetDate) - new Date()) / 86400000);
  const color = pct < 50 ? "bg-orange-400" : pct < 85 ? "bg-amber-400" : "bg-green-500";
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Progress to weaning</span>
        <span className="font-bold">{pct}%</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width:`${pct}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {remaining > 0 ? `${remaining} days until weaning` : remaining === 0 ? "Weaning day!" : `${Math.abs(remaining)} days overdue`}
      </p>
    </div>
  );
}

export default function CalfProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { animals = [], setAnimals } = useContext(FarmContext);

  const calf = animals.find(
    (a) => a.id?.toString() === id && a.category === "cattle" && a.type?.toLowerCase() === "calf"
  );
  const updateCalf = (updated) =>
    setAnimals((prev) => prev.map((a) => (a.id?.toString() === id ? updated : a)));

  const [isEditing, setIsEditing] = useState(false);
  const [edited,    setEdited]    = useState(null);
  const [modal,     setModal]     = useState(null);
  const [graduateModal, setGraduateModal] = useState(false);

  const [newColostrum, setNewColostrum] = useState({ timeAfterBirth:"", amount:"", source:"Dam", notes:"" });
  const [newGrowth,    setNewGrowth]    = useState({ date:"", weight:"", health:0, notes:"" });
  const [newMilkFeed,  setNewMilkFeed]  = useState({ date:"", time:"", amount:"", feedType:"Whole Milk", notes:"" });
  const [newMedical,   setNewMedical]   = useState({ date:"", type:"", medicine:"", vetName:"", cost:"", notes:"" });

  if (!calf) return <p className="p-6 text-red-600">Calf not found.</p>;

  const growthRecords   = calf.growthRecords   || [];
  const milkFeedRecords = calf.milkFeedRecords || [];
  const medicalLog      = calf.medicalLog      || [];
  const daysOldVal      = daysOld(calf.birthDate);

  const bulls = animals.filter((a) => a.category === "cattle" && a.type?.toLowerCase() === "bull");
  const cows  = animals.filter((a) => a.category === "cattle" && a.type?.toLowerCase() === "cow");

  /* ── edit helpers ── */
  const startEditing  = () => { setIsEditing(true); setEdited({ ...calf }); };
  const cancelEditing = () => { setIsEditing(false); setEdited(null); };
  const saveChanges   = () => { updateCalf(edited); setIsEditing(false); setEdited(null); };
  const updateField   = (f, v) => setEdited((p) => ({ ...p, [f]: v }));

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => updateCalf({ ...calf, image: reader.result });
    reader.readAsDataURL(file);
  };

  /* ── records ── */
  const saveColostrum = () => {
    if (!newColostrum.timeAfterBirth) return;
    updateCalf({ ...calf, colostrumRecord: { ...newColostrum, savedAt: new Date().toISOString() } });
    setModal(null);
  };

  const addGrowth = () => {
    if (!newGrowth.date) return;
    const updated = [...growthRecords, { ...newGrowth, id: Date.now() }];
    updateCalf({ ...calf, growthRecords: updated });
    setNewGrowth({ date:"", weight:"", health:0, notes:"" });
    setModal("viewGrowth");
  };
  const deleteGrowth = (rid) => updateCalf({ ...calf, growthRecords: growthRecords.filter((r) => r.id !== rid) });

  const addMilkFeed = () => {
    if (!newMilkFeed.date) return;
    const updated = [...milkFeedRecords, { ...newMilkFeed, id: Date.now() }];
    updateCalf({ ...calf, milkFeedRecords: updated });
    setNewMilkFeed({ date:"", time:"", amount:"", feedType:"Whole Milk", notes:"" });
    setModal("viewMilkFeed");
  };
  const deleteMilkFeed = (rid) => updateCalf({ ...calf, milkFeedRecords: milkFeedRecords.filter((r) => r.id !== rid) });

  const addMedical = () => {
    if (!newMedical.date || !newMedical.type) return;
    const updated = [...medicalLog, { ...newMedical, id: Date.now() }];
    updateCalf({ ...calf, medicalLog: updated });
    setNewMedical({ date:"", type:"", medicine:"", vetName:"", cost:"", notes:"" });
    setModal("viewMedical");
  };
  const deleteMedical = (rid) => updateCalf({ ...calf, medicalLog: medicalLog.filter((r) => r.id !== rid) });

  /* ── graduate ── */
  const graduate = () => {
    const targetType = calf.gender === "Male" ? "bull-calf" : "heifer";
    updateCalf({
      ...calf,
      type: targetType,
      graduated: true,
      age: daysOldVal ? `${Math.floor(daysOldVal / 30)}` : "",
    });
    setGraduateModal(false);
    navigate(`/animals/cattle/${targetType === "bull-calf" ? "bull-calves" : "heifers"}`);
  };

  /* ── chart ── */
  const chartData = [...growthRecords]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((r) => ({ date: r.date, weight: r.weight ? parseFloat(r.weight) : null }));

  /* ── last 3 feeds for quick view ── */
  const recentFeeds = [...milkFeedRecords].reverse().slice(0, 3);

  /* ── total milk today ── */
  const today = new Date().toISOString().split("T")[0];
  const todayMilk = milkFeedRecords
    .filter((r) => r.date === today)
    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  const statusColor = { Healthy:"bg-green-100 text-green-800", Sick:"bg-red-100 text-red-700", "Under Treatment":"bg-amber-100 text-amber-700" }[calf.status] || "bg-gray-100 text-gray-600";
  const genderColor = calf.gender === "Male" ? "bg-blue-500" : "bg-pink-500";

  return (
    <div className="bg-orange-50 flex flex-col">

      {/* TOP BAR */}
      <div className="flex items-center gap-4 px-6 py-4 bg-white shadow-sm">
        <button onClick={() => navigate(-1)} className="bg-white shadow w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-orange-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-orange-900">Calf Profile</h2>
        <span className="text-sm text-gray-500 font-medium">{ageLabel(calf.birthDate)}</span>
        <div className="ml-auto flex items-center gap-2">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor}`}>{calf.status}</span>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full text-white ${genderColor}`}>{calf.gender || "Unknown"}</span>
          {!calf.graduated && daysOldVal >= 56 && (
            <button onClick={() => setGraduateModal(true)}
              className="text-xs font-semibold px-3 py-1 rounded-full bg-green-600 text-white hover:bg-green-700 transition">
              Graduate →
            </button>
          )}
          {calf.graduated && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-200 text-gray-600">Graduated</span>
          )}
        </div>
      </div>

      {/* COLOSTRUM ALERT BANNER — shown only if very young and not recorded */}
      {daysOldVal !== null && daysOldVal <= 2 && !calf.colostrumRecord && (
        <div className="bg-red-600 text-white text-center text-sm font-semibold py-2 px-4">
          🚨 Colostrum must be given within 24 hours of birth — please record it now!
        </div>
      )}

      {/* BODY */}
      <div className="flex flex-1 gap-6 p-6 flex-wrap lg:flex-nowrap">

        {/* LEFT */}
        <div className="flex flex-col gap-4 w-72 shrink-0">

          {/* IMAGE */}
          <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg bg-gray-100 group">
            {calf.image
              ? <img src={calf.image} alt={calf.name} className="w-full h-full object-cover" />
              : <div className="flex items-center justify-center h-full text-gray-400 text-sm">No image</div>}
            <label className="absolute inset-0 flex items-end justify-center pb-4 bg-black/0 group-hover:bg-black/30 transition cursor-pointer">
              <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-orange-800 text-xs font-semibold px-3 py-1 rounded-full transition">Change photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>

          {/* BIRTH INFO */}
          <div className="bg-white rounded-2xl shadow p-4 text-sm space-y-2">
            <p className="font-semibold text-gray-500 text-xs uppercase mb-1">Birth Info</p>
            {[
              { label:"Birth date",   field:"birthDate",   type:"date" },
              { label:"Birth weight", field:"birthWeight", suffix:" kg" },
              { label:"Breed",        field:"breed" },
              { label:"Color",        field:"color" },
            ].map(({ label, field, suffix="", type="text" }) => (
              <div key={field} className="flex justify-between items-center border-b last:border-0 pb-1 last:pb-0">
                <span className="text-gray-500">{label}</span>
                {isEditing
                  ? <input type={type} value={edited[field] || ""} onChange={(e) => updateField(field, e.target.value)} className="border rounded px-2 py-0.5 w-32 text-right text-sm" />
                  : <span className="text-orange-900 font-semibold">{calf[field] ? `${calf[field]}${suffix}` : <span className="text-gray-300">—</span>}</span>}
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
                  : <span className="text-orange-900 font-semibold">{calf[field] || <span className="text-gray-300">—</span>}</span>}
              </div>
            ))}
          </div>

          {/* COLOSTRUM */}
          <div className="bg-white rounded-2xl shadow p-4 text-sm">
            <p className="font-semibold text-gray-500 text-xs uppercase mb-2">Colostrum</p>
            <ColostrumStrip
              record={calf.colostrumRecord}
              daysOldVal={daysOldVal}
              onRecord={() => setModal("colostrum")}
            />
          </div>

          {/* WEANING PROGRESS */}
          <div className="bg-white rounded-2xl shadow p-4 text-sm">
            <p className="font-semibold text-gray-500 text-xs uppercase mb-2">Weaning Plan</p>
            {isEditing
              ? (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">Target date</span>
                  <input type="date" value={edited.weaningTargetDate || ""} onChange={(e) => updateField("weaningTargetDate", e.target.value)} className="border rounded px-2 py-0.5 text-sm" />
                </div>
              )
              : <WeaningBar birthDate={calf.birthDate} targetDate={calf.weaningTargetDate} />}
            {!isEditing && !calf.weaningTargetDate && <p className="text-gray-300 text-xs">Set a weaning date in Edit Profile</p>}
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
                  ? <input value={edited.name || ""} onChange={(e) => updateField("name", e.target.value)} className="text-2xl font-bold border-b border-orange-400 outline-none w-full" />
                  : <h3 className="text-2xl font-bold text-orange-900">{calf.name}</h3>}
              </div>
              {!isEditing
                ? <button onClick={startEditing} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-orange-600 transition">Edit Profile</button>
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
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Gender</p>
                  <select value={edited.gender || ""} onChange={(e) => updateField("gender", e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                    {["Female","Male"].map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* TODAY'S MILK SUMMARY */}
          {milkFeedRecords.length > 0 && (
            <div className="bg-orange-100 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-orange-700 uppercase">Today's milk intake</p>
                <p className="text-2xl font-bold text-orange-900">{todayMilk > 0 ? `${todayMilk} mL` : "Not fed yet today"}</p>
              </div>
              <div className="text-4xl">🍼</div>
            </div>
          )}

          {/* 3 ACTION CARDS */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { key:"growth",   title:"Growth Records", count:growthRecords.length,   accent:"orange",
                latest: growthRecords.length > 0 ? `${growthRecords.at(-1).weight||"—"} kg` : null,
                latestDate: growthRecords.at(-1)?.date, onAdd:()=>setModal("growth"), onView:()=>setModal("viewGrowth"),
                iconPath:"M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" },
              { key:"milkfeed", title:"Milk Feedings",  count:milkFeedRecords.length, accent:"amber",
                latest: milkFeedRecords.length > 0 ? `${milkFeedRecords.at(-1).amount||"—"} mL · ${milkFeedRecords.at(-1).feedType}` : null,
                latestDate: milkFeedRecords.at(-1)?.date, onAdd:()=>setModal("milkFeed"), onView:()=>setModal("viewMilkFeed"),
                iconPath:"M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.575 1.399A1.5 1.5 0 0117 17.58v.82A2.25 2.25 0 0114.75 20.625H9.25A2.25 2.25 0 017 18.4v-.82a1.5 1.5 0 01-.225-1.181L5 14.5m14.8.5l-5.8-4.5M5 14.5l5.8-4.5" },
              { key:"medical",  title:"Medical Log",    count:medicalLog.length,       accent:"red",
                latest: medicalLog.length > 0 ? medicalLog.at(-1).type : null,
                latestDate: medicalLog.at(-1)?.date, onAdd:()=>setModal("medical"), onView:()=>setModal("viewMedical"),
                iconPath:"M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" },
            ].map((card) => {
              const ACCENT = {
                orange: { bg:"bg-orange-50", iconColor:"#ea580c", count:"text-orange-700", add:"bg-orange-500 hover:bg-orange-600", view:"bg-orange-50 text-orange-700 hover:bg-orange-100" },
                amber:  { bg:"bg-amber-50",  iconColor:"#d97706", count:"text-amber-700",  add:"bg-amber-500 hover:bg-amber-600",  view:"bg-amber-50 text-amber-700 hover:bg-amber-100" },
                red:    { bg:"bg-red-50",    iconColor:"#dc2626", count:"text-red-700",    add:"bg-red-600 hover:bg-red-700",      view:"bg-red-50 text-red-700 hover:bg-red-100" },
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

          {/* WEIGHT CHART */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-2xl shadow p-5">
              <p className="text-sm font-semibold text-gray-600 mb-3">Weight gain (kg)</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#fff7ed" />
                  <XAxis dataKey="date" tick={{ fontSize:11 }} />
                  <YAxis tick={{ fontSize:11 }} />
                  <Tooltip contentStyle={{ borderRadius:"8px", fontSize:"12px" }} />
                  <Line type="monotone" dataKey="weight" name="Weight (kg)"
                    stroke="#ea580c" strokeWidth={2.5} dot={{ r:4 }} activeDot={{ r:6 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* GROWTH TABLE */}
          {growthRecords.length > 0 && (
            <div className="bg-white rounded-2xl shadow p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Growth Entries</p>
                <span className="text-xs text-gray-400">{growthRecords.length} records · scroll to see all</span>
              </div>
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="overflow-y-auto" style={{ maxHeight:"200px" }}>
                    <table className="w-full text-sm min-w-[480px]">
                      <thead>
                        <tr className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                          {["Date","Weight (kg)","Health","Notes",""].map((h) => (
                            <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {[...growthRecords].reverse().map((r, i) => (
                          <tr key={r.id} className={`hover:bg-orange-50/40 transition ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                            <td className="px-4 py-2.5 text-xs text-gray-700 font-medium whitespace-nowrap">{r.date}</td>
                            <td className="px-4 py-2.5 whitespace-nowrap">{r.weight ? <span className="font-bold text-orange-700">{parseFloat(r.weight).toLocaleString()} kg</span> : <span className="text-gray-300">—</span>}</td>
                            <td className="px-4 py-2.5"><HealthBadge score={r.health} /></td>
                            <td className="px-4 py-2.5 text-xs text-gray-500 italic max-w-[180px]"><span className="block truncate" title={r.notes}>{r.notes || "—"}</span></td>
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

      {/* COLOSTRUM */}
      {modal === "colostrum" && (
        <Modal title="Record Colostrum Feeding" onClose={() => setModal(null)}>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800">
            🍼 Colostrum is critical in the first 6 hours, and must be given within 24 hours of birth. It provides passive immunity to the calf.
          </div>
          <Field label="Hours after birth">
            <input type="number" step="0.5" placeholder="e.g. 2" value={newColostrum.timeAfterBirth}
              onChange={(e) => setNewColostrum({...newColostrum, timeAfterBirth:e.target.value})}
              className="border rounded-lg p-2 w-full" />
          </Field>
          <Field label="Amount (mL)">
            <input type="number" placeholder="e.g. 2000" value={newColostrum.amount}
              onChange={(e) => setNewColostrum({...newColostrum, amount:e.target.value})}
              className="border rounded-lg p-2 w-full" />
          </Field>
          <Field label="Source">
            <div className="flex gap-2">
              {["Dam","Donor Cow","Frozen / Stored","Artificial"].map((s) => (
                <button key={s} type="button" onClick={() => setNewColostrum({...newColostrum, source:s})}
                  className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition
                    ${newColostrum.source === s ? "bg-orange-500 text-white border-transparent" : "bg-gray-50 border-gray-200 hover:border-gray-400"}`}>
                  {s}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Notes">
            <textarea value={newColostrum.notes} onChange={(e) => setNewColostrum({...newColostrum, notes:e.target.value})}
              className="border rounded-lg p-2 w-full h-16 resize-none" />
          </Field>
          <div className="flex gap-3 pt-2">
            <button onClick={saveColostrum} className="flex-1 bg-orange-500 text-white py-2 rounded-xl hover:bg-orange-600 font-semibold">Save Record</button>
            <button onClick={() => setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button>
          </div>
        </Modal>
      )}

      {/* ADD GROWTH */}
      {modal === "growth" && (
        <Modal title="Add Growth Record" onClose={() => setModal(null)}>
          <Field label="Date"><input type="date" value={newGrowth.date} onChange={(e) => setNewGrowth({...newGrowth, date:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Weight (kg)"><input type="number" step="0.1" placeholder="e.g. 38.5" value={newGrowth.weight} onChange={(e) => setNewGrowth({...newGrowth, weight:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Health Condition"><HealthPicker value={newGrowth.health} onChange={(v) => setNewGrowth({...newGrowth, health:v})} /></Field>
          <Field label="Notes"><textarea value={newGrowth.notes} onChange={(e) => setNewGrowth({...newGrowth, notes:e.target.value})} className="border rounded-lg p-2 w-full h-16 resize-none" /></Field>
          <div className="flex gap-3 pt-2">
            <button onClick={addGrowth} className="flex-1 bg-orange-500 text-white py-2 rounded-xl hover:bg-orange-600 font-semibold">Save Record</button>
            <button onClick={() => setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button>
          </div>
        </Modal>
      )}

      {modal === "viewGrowth" && (
        <Modal title={`Growth Records — ${growthRecords.length} entries`} onClose={() => setModal(null)}>
          <button onClick={() => setModal("growth")} className="mb-4 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-orange-600">+ Add new record</button>
          {growthRecords.length === 0 ? <p className="text-gray-400 text-center py-8">No records yet.</p> : (
            <div className="space-y-3">
              {[...growthRecords].reverse().map((r) => (
                <div key={r.id} className="bg-orange-50 rounded-xl p-3 flex justify-between items-start">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-orange-900 text-sm">{r.date}</p>
                    {r.weight && <p className="text-xs text-gray-600">⚖️ {r.weight} kg</p>}
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

      {/* ADD MILK FEED */}
      {modal === "milkFeed" && (
        <Modal title="Record Milk Feeding" onClose={() => setModal(null)}>
          <Field label="Date"><input type="date" value={newMilkFeed.date} onChange={(e) => setNewMilkFeed({...newMilkFeed, date:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Time of feeding"><input type="time" value={newMilkFeed.time} onChange={(e) => setNewMilkFeed({...newMilkFeed, time:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Amount (mL)"><input type="number" placeholder="e.g. 2000" value={newMilkFeed.amount} onChange={(e) => setNewMilkFeed({...newMilkFeed, amount:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
          <Field label="Feed Type">
            <div className="flex flex-wrap gap-2">
              {["Whole Milk","Milk Replacer","Starter Feed","Mixed"].map((t) => (
                <button key={t} type="button" onClick={() => setNewMilkFeed({...newMilkFeed, feedType:t})}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold transition
                    ${newMilkFeed.feedType === t ? "bg-amber-500 text-white border-transparent" : "bg-gray-50 border-gray-200 hover:border-gray-400"}`}>
                  {t}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Notes"><textarea placeholder="Appetite, any refusal..." value={newMilkFeed.notes} onChange={(e) => setNewMilkFeed({...newMilkFeed, notes:e.target.value})} className="border rounded-lg p-2 w-full h-16 resize-none" /></Field>
          <div className="flex gap-3 pt-2">
            <button onClick={addMilkFeed} className="flex-1 bg-amber-500 text-white py-2 rounded-xl hover:bg-amber-600 font-semibold">Save Feeding</button>
            <button onClick={() => setModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button>
          </div>
        </Modal>
      )}

      {modal === "viewMilkFeed" && (
        <Modal title={`Milk Feedings — ${milkFeedRecords.length} entries`} onClose={() => setModal(null)}>
          <button onClick={() => setModal("milkFeed")} className="mb-4 bg-amber-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-amber-600">+ Record feeding</button>
          {milkFeedRecords.length === 0 ? <p className="text-gray-400 text-center py-8">No feedings recorded yet.</p> : (
            <div className="space-y-3">
              {[...milkFeedRecords].reverse().map((r) => (
                <div key={r.id} className="bg-amber-50 rounded-xl p-3 flex justify-between items-start">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-amber-900">{r.date}{r.time ? ` at ${r.time}` : ""}</p>
                    <p className="text-xs text-gray-600">{r.feedType}{r.amount ? ` · ${r.amount} mL` : ""}</p>
                    {r.notes && <p className="text-xs text-gray-500 italic">{r.notes}</p>}
                  </div>
                  <button onClick={() => deleteMilkFeed(r.id)} className="text-red-400 hover:text-red-600 text-lg ml-3">&times;</button>
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
              {["Navel Dressing","Vaccination","Deworming","Scours Treatment","Pneumonia Treatment","Vitamin / Iron Injection","Ear Tagging","Checkup","Other"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Medicine / Product"><input value={newMedical.medicine} onChange={(e) => setNewMedical({...newMedical, medicine:e.target.value})} className="border rounded-lg p-2 w-full" /></Field>
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
                    {r.medicine && <p className="text-xs text-gray-600">Product: {r.medicine}</p>}
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

      {/* GRADUATE CONFIRMATION */}
      {graduateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-green-900 mb-2">Graduate {calf.name}?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will move <strong>{calf.name}</strong> from Calves to <strong>{calf.gender === "Male" ? "Bull Calves" : "Heifers"}</strong>. All records will be kept.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800 mb-4">
              {calf.gender === "Male"
                ? "👦 Male → Bull Calves (growing toward maturity)"
                : "👧 Female → Heifers (growing toward first breeding)"}
            </div>
            <div className="flex gap-3">
              <button onClick={graduate} className="flex-1 bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 font-semibold">Confirm Graduate</button>
              <button onClick={() => setGraduateModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
