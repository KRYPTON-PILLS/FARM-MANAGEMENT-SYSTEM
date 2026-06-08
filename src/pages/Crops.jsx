import { useContext, useState } from "react";
import { FarmContext } from "../context/FarmContext";
import { Link } from "react-router-dom";

/* ── Status config ── */
export const STATUS_CONFIG = {
  "Planned":           { color: "bg-gray-400",    text: "text-gray-700",   bg: "bg-gray-100"   },
  "Planted":           { color: "bg-blue-500",     text: "text-blue-700",   bg: "bg-blue-100"   },
  "Growing":           { color: "bg-green-500",    text: "text-green-700",  bg: "bg-green-100"  },
  "Flowering":         { color: "bg-yellow-400",   text: "text-yellow-700", bg: "bg-yellow-100" },
  "Fruiting":          { color: "bg-orange-400",   text: "text-orange-700", bg: "bg-orange-100" },
  "Ready for Harvest": { color: "bg-lime-500",     text: "text-lime-700",   bg: "bg-lime-100"   },
  "Harvested":         { color: "bg-teal-500",     text: "text-teal-700",   bg: "bg-teal-100"   },
  "Failed Crop":       { color: "bg-red-500",      text: "text-red-700",    bg: "bg-red-100"    },
};

export const STATUSES = Object.keys(STATUS_CONFIG);

function daysUntil(d) {
  if (!d) return null;
  return Math.ceil((new Date(d) - new Date()) / 86400000);
}

function daysSince(d) {
  if (!d) return null;
  return Math.floor((new Date() - new Date(d)) / 86400000);
}

function lastActivity(crop) {
  const all = [
    ...(crop.growthReports  || []).map((r) => r.date),
    ...(crop.activities     || []).map((r) => r.date),
    ...(crop.diseases       || []).map((r) => r.date),
    ...(crop.expenses       || []).map((r) => r.date),
    ...(crop.harvestRecords || []).map((r) => r.date),
  ].filter(Boolean).sort();
  return all.at(-1) || crop.createdAt?.split("T")[0] || null;
}

export default function Crops() {
  const { crops = [], setCrops } = useContext(FarmContext);
  const [showForm, setShowForm] = useState(false);
  const [name,     setName]     = useState("");
  const [status,   setStatus]   = useState("Planted");
  const [image,    setImage]    = useState("");

  /* ── stats ── */
  const active          = crops.filter((c) => !["Harvested","Failed Crop"].includes(c.status));
  const readyForHarvest = crops.filter((c) => c.status === "Ready for Harvest");
  const harvested       = crops.filter((c) => c.status === "Harvested");
  const failed          = crops.filter((c) => c.status === "Failed Crop");
  const expectedRevenue = crops.reduce((sum, c) => {
    return sum + (c.harvestRecords || []).reduce((s, h) => {
      const rev = parseFloat(h.revenue) || (parseFloat(h.yield) * parseFloat(h.sellingPrice)) || 0;
      return s + rev;
    }, 0);
  }, 0);

  /* ── status distribution ── */
  const statusDist = STATUSES.map((s) => ({ label: s, count: crops.filter((c) => c.status === s).length })).filter((s) => s.count > 0);

  /* ── alerts ── */
  const alerts = [];
  crops.forEach((c) => {
    const dtu = daysUntil(c.expectedHarvestDate);
    if (dtu !== null && dtu >= 0 && dtu <= 14 && c.status !== "Harvested")
      alerts.push({ type: "harvest", crop: c.name, msg: `Harvest in ${dtu} day${dtu !== 1 ? "s" : ""}`, color: dtu <= 7 ? "bg-red-500" : "bg-amber-500" });
    const la = lastActivity(c);
    const ds = daysSince(la);
    if (ds !== null && ds >= 30 && !["Harvested","Failed Crop"].includes(c.status))
      alerts.push({ type: "stale", crop: c.name, msg: `Not updated in ${ds} days`, color: "bg-orange-400" });
    const criticalDisease = (c.diseases || []).some((d) => d.severity === "Critical");
    if (criticalDisease)
      alerts.push({ type: "disease", crop: c.name, msg: "Critical disease detected!", color: "bg-red-600" });
  });

  /* ── add crop ── */
  const addCrop = () => {
    if (!name || !status) return;
    setCrops((prev) => [...prev, {
      id:                Date.now(),
      name, status, image,
      fieldName:         "",
      area:              "",
      areaUnit:          "Acres",
      variety:           "",
      plantingDate:      "",
      expectedHarvestDate: "",
      notes:             "",
      createdAt:         new Date().toISOString(),
      growthReports:     [],
      activities:        [],
      diseases:          [],
      expenses:          [],
      harvestRecords:    [],
    }]);
    setName(""); setStatus("Planted"); setImage(""); setShowForm(false);
  };

  return (
    <div className="space-y-6">

      {/* ── ALERTS ── */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`${a.color} text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2`}>
              <span>⚠</span>
              <span className="font-bold">{a.crop}:</span>
              <span>{a.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-green-900">Crops</h2>
          <p className="text-gray-500 text-sm mt-0.5">Manage and track your crops</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 transition font-semibold shadow-sm">
          + Add Crop
        </button>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Crops",        value: crops.length,           color: "text-gray-800" },
          { label: "Active Crops",       value: active.length,          color: "text-green-700" },
          { label: "Ready for Harvest",  value: readyForHarvest.length, color: "text-lime-700"  },
          { label: "Harvested",          value: harvested.length,       color: "text-teal-700"  },
          { label: "Failed",             value: failed.length,          color: "text-red-600"   },
          { label: "Total Revenue",      value: expectedRevenue > 0 ? `KES ${expectedRevenue.toLocaleString()}` : "—", color: "text-amber-700" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow p-4">
            <p className="text-xs text-gray-400 uppercase font-semibold">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── STATUS DISTRIBUTION ── */}
      {statusDist.length > 0 && (
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm font-semibold text-gray-600 mb-3">Status breakdown</p>
          <div className="flex flex-wrap gap-3">
            {statusDist.map((s) => {
              const cfg = STATUS_CONFIG[s.label] || {};
              return (
                <div key={s.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${cfg.bg || "bg-gray-100"}`}>
                  <span className={`w-2 h-2 rounded-full ${cfg.color || "bg-gray-400"}`} />
                  <span className={`text-xs font-semibold ${cfg.text || "text-gray-700"}`}>{s.label}: {s.count}</span>
                </div>
              );
            })}
          </div>
          {/* visual bar */}
          <div className="mt-3 h-3 rounded-full overflow-hidden flex">
            {statusDist.map((s) => {
              const cfg = STATUS_CONFIG[s.label] || {};
              const pct = Math.round((s.count / crops.length) * 100);
              return <div key={s.label} className={`${cfg.color} h-full`} style={{ width: `${pct}%` }} title={`${s.label}: ${s.count}`} />;
            })}
          </div>
        </div>
      )}

      {/* ── CROP CARDS GRID ── */}
      {crops.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-green-300 rounded-xl p-12 text-center">
          <p className="text-4xl mb-3">🌱</p>
          <p className="text-gray-500 text-lg mb-3">No crops added yet.</p>
          <button onClick={() => setShowForm(true)} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
            Add your first crop
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {crops.map((crop) => {
            const cfg   = STATUS_CONFIG[crop.status] || {};
            const dtu   = daysUntil(crop.expectedHarvestDate);
            const nearHarvest = dtu !== null && dtu <= 14 && dtu >= 0 && crop.status !== "Harvested";
            const totalRevenue = (crop.harvestRecords || []).reduce((s, h) => s + (parseFloat(h.revenue) || 0), 0);

            return (
              <div key={crop.id} className="relative rounded-2xl overflow-hidden shadow-xl group h-72 bg-gray-100">
                {/* image */}
                {crop.image
                  ? <img src={crop.image} alt={crop.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  : <div className="absolute inset-0 flex items-center justify-center text-6xl bg-gradient-to-br from-green-100 to-green-200">🌾</div>}

                {/* overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

                {/* top left: name + status */}
                <div className="absolute top-4 left-4 z-10">
                  <h3 className="text-white text-lg font-bold drop-shadow">{crop.name}</h3>
                  {crop.variety && <p className="text-white/70 text-xs">{crop.variety}</p>}
                </div>

                {/* top right: status badge */}
                <div className={`absolute top-3 right-3 z-10 ${cfg.color || "bg-gray-400"} text-white px-3 py-1 text-xs rounded-full font-semibold`}>
                  {crop.status}
                </div>

                {/* harvest alert */}
                {nearHarvest && (
                  <div className="absolute top-10 right-3 z-10 bg-lime-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                    {dtu === 0 ? "Harvest today!" : `${dtu}d to harvest`}
                  </div>
                )}

                {/* middle info */}
                {(crop.fieldName || crop.area) && (
                  <div className="absolute top-1/2 left-4 -translate-y-1/2 z-10">
                    {crop.fieldName && <p className="text-white/80 text-xs">📍 {crop.fieldName}</p>}
                    {crop.area     && <p className="text-white/80 text-xs">📐 {crop.area} {crop.areaUnit}</p>}
                  </div>
                )}

                {/* revenue badge if harvested */}
                {totalRevenue > 0 && (
                  <div className="absolute bottom-14 left-4 z-10 bg-amber-500/90 text-white text-xs px-2 py-0.5 rounded-full">
                    💰 KES {totalRevenue.toLocaleString()}
                  </div>
                )}

                {/* bottom: view button */}
                <div className="absolute bottom-4 left-4 z-10">
                  <Link to={`/crops/${crop.id}`}
                    className="bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-5 py-2 rounded-xl shadow-lg transition">
                    View Crop
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ADD CROP MODAL ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-green-900">Add New Crop</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Crop Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maize, Beans, Wheat"
                  className="border rounded-lg p-3 w-full focus:outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded-lg p-3 w-full">
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cover Image (optional)</label>
                <input type="file" accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    const r = new FileReader(); r.onloadend = () => setImage(r.result); r.readAsDataURL(f);
                  }}
                  className="border rounded-lg p-2 w-full" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={addCrop} className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 font-semibold transition">
                  Create Crop
                </button>
                <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}