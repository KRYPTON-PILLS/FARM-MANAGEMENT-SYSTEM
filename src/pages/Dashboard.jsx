import { useContext, useMemo } from "react";
import { FarmContext } from "../context/FarmContext";
import { useNavigate, Link } from "react-router-dom";
import { UseProfile } from "../hooks/UseProfile.js";
import {
  CartesianGrid, XAxis, YAxis,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";

/* ── helpers ── */
function fmt(n)        { return `KES ${(parseFloat(n) || 0).toLocaleString()}`; }
function monthKey(d)   { if (!d) return ""; const dt = new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`; }
function monthLabel(k) { if (!k) return ""; const [y, m] = k.split("-"); return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString("en-US", { month: "short" }); }

function StatCard({ label, value, sub, icon, color = "text-green-700", onClick, linkTo, accent }) {
  const content = (
    <div className={`bg-white rounded-2xl shadow p-4 transition ${onClick || linkTo ? "hover:shadow-md hover:-translate-y-0.5 cursor-pointer active:scale-95" : ""} ${accent || ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-400 uppercase mb-1 truncate">{label}</p>
          {/* Slightly smaller value on mobile so 4-col grid doesn't overflow */}
          <p className={`text-xl sm:text-2xl font-bold leading-tight ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5 leading-tight">{sub}</p>}
        </div>
        {icon && <span className="text-2xl sm:text-3xl shrink-0">{icon}</span>}
      </div>
      {(onClick || linkTo) && (
        <p className="text-xs text-green-600 font-semibold mt-2 flex items-center gap-1">
          View details <span>→</span>
        </p>
      )}
    </div>
  );
  if (linkTo) return <Link to={linkTo}>{content}</Link>;
  if (onClick) return <div onClick={onClick}>{content}</div>;
  return content;
}

export default function Dashboard() {
  const { profile } = UseProfile();
  const {
    animals = [],
    crops = [],
    salesRecords = [],
    activities = [],
    alerts = [],
    dismissedAlerts = [],
    expenseRecords = [],
    mortalityRecords = [],
    treatmentCount,
  } = useContext(FarmContext);

  /* ---------- Animal counts ---------- */
  const realAnimals  = animals.filter((a) => !a.__coverKey && !a.__flockRecord);
  const totalAnimals = realAnimals.length;
  const healthyCount = realAnimals.filter((a) => a.status === "Healthy").length;
  const sickCount    = realAnimals.filter((a) => a.status === "Sick").length;
  const soldCount    = realAnimals.filter((a) => a.status === "Sold").length;

  /* ---------- Crop counts ---------- */
  const activeCrops     = crops.filter((c) => !["Harvested", "Sold"].includes(c.status)).length;
  const readyForHarvest = crops.filter((c) => c.status === "Ready for Harvest").length;
  const totalCropRevenue = crops.reduce((s, c) => (c.harvestRecords || []).reduce((ss, h) => ss + (parseFloat(h.revenue) || 0), s), 0);

  /* ---------- Sales ---------- */
  const totalAnimalRevenue = salesRecords.reduce((sum, r) => sum + (parseFloat(r.salePrice) || 0), 0);
  const totalRevenue       = totalAnimalRevenue + totalCropRevenue;
  const totalProfit        = salesRecords.reduce((s, r) => s + (parseFloat(r.profit) || 0), 0);
  const thisMonth          = new Date().toISOString().slice(0, 7);
  const thisMonthSales     = salesRecords
    .filter((r) => monthKey(r.saleDate) === thisMonth)
    .reduce((s, r) => s + (parseFloat(r.salePrice) || 0), 0);

  /* ── Monthly revenue chart (last 6 months) ── */
  const monthlyRevenue = useMemo(() => {
    const map = {};
    salesRecords.forEach((r) => {
      const k = monthKey(r.saleDate); if (!k) return;
      if (!map[k]) map[k] = { key: k, label: monthLabel(k), animals: 0, crops: 0 };
      map[k].animals += parseFloat(r.salePrice) || 0;
    });
    crops.forEach((c) => {
      (c.harvestRecords || []).forEach((h) => {
        const k = monthKey(h.date); if (!k) return;
        if (!map[k]) map[k] = { key: k, label: monthLabel(k), animals: 0, crops: 0 };
        map[k].crops += parseFloat(h.revenue) || 0;
      });
    });
    return Object.values(map).sort((a, b) => a.key.localeCompare(b.key)).slice(-6);
  }, [salesRecords, crops]);

  /* ── Alerts ── */
  const activeAlerts   = alerts.filter((a) => !dismissedAlerts.includes(a.id));
  const criticalAlerts = activeAlerts.filter((a) => a.severity === "critical").length;

  /* ── Upcoming activities ── */
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcomingActivities = activities
    .filter((a) => !a.completed && a.dueDate && new Date(a.dueDate + "T00:00:00") >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  /* ── Animal breakdown ── */
  const animalBreakdown = useMemo(() => {
    const map = {};
    realAnimals.forEach((a) => {
      const sp = a.category || "Other";
      if (!map[sp]) map[sp] = 0;
      map[sp]++;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }))
      .sort((a, b) => b.count - a.count);
  }, [realAnimals]);

  /* ── Recent animals (last 4 added) ── */
  const recentAnimals = [...realAnimals].sort((a, b) => b.id - a.id).slice(0, 4);

  const greetingName = profile.displayName?.split(" ")[0] || "Farmer";
  const farmLabel    = profile.farmName || "Your Farm";
  const hourNow      = new Date().getHours();
  const greeting     = hourNow < 12 ? "Good morning" : hourNow < 17 ? "Good afternoon" : "Good evening";

  const safeTreatmentCount = parseInt(treatmentCount) || 0;
  const sickAndTreatment   = sickCount + safeTreatmentCount;

  return (
    <div className="bg-green-50 min-h-full p-4 sm:p-6 space-y-4 sm:space-y-6">

      {/* ── Greeting banner ── */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-600 rounded-2xl p-5 sm:p-6 text-white shadow-lg">
        <p className="text-green-200 text-sm font-semibold">{greeting},</p>
        <h2 className="text-2xl sm:text-3xl font-bold mt-0.5">{greetingName} 👋</h2>
        <p className="text-green-200 mt-1 text-sm">{farmLabel} — Here's today's overview</p>
        {/* Pill badges — wrap naturally on small screens */}
        <div className="flex flex-wrap gap-2 mt-4 text-xs sm:text-sm">
          {criticalAlerts > 0 && (
            <Link to="/assistant" className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-300/30 px-3 py-1.5 rounded-xl transition">
              🚨 <span>{criticalAlerts} critical alert{criticalAlerts !== 1 ? "s" : ""}</span>
            </Link>
          )}
          {readyForHarvest > 0 && (
            <Link to="/crops" className="flex items-center gap-1.5 bg-lime-500/20 hover:bg-lime-500/30 border border-lime-300/30 px-3 py-1.5 rounded-xl transition">
              🌾 <span>{readyForHarvest} crop{readyForHarvest !== 1 ? "s" : ""} ready</span>
            </Link>
          )}
          {upcomingActivities.length > 0 && (
            <Link to="/assistant" className="flex items-center gap-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-300/30 px-3 py-1.5 rounded-xl transition">
              📋 <span>{upcomingActivities.length} activit{upcomingActivities.length !== 1 ? "ies" : "y"}</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── STAT CARDS ROW 1 — Animals & Crops ── */}
      {/* 2 cols on mobile, 4 on md+ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Animals"    value={totalAnimals}       icon="🐄" color="text-green-700"  linkTo="/animals" sub={`${healthyCount} healthy`} />
        <StatCard label="Sick / Treatment" value={sickAndTreatment}   icon="💊" color={sickAndTreatment > 0 ? "text-red-600" : "text-green-600"} linkTo="/animals"
          sub={sickAndTreatment > 0 ? `${sickCount} sick · ${safeTreatmentCount} in care` : "All Healthy"} />
        <StatCard label="Sold"             value={soldCount}           icon="🏷️" color="text-amber-600" sub="this session" />
        <StatCard label="Active Crops"     value={activeCrops}        icon="🌱" color="text-lime-700"   linkTo="/crops"
          sub={readyForHarvest > 0 ? `${readyForHarvest} ready` : ""} />
      </div>

      {/* ── STAT CARDS ROW 2 — Financials ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Revenue"     value={fmt(totalRevenue)}     icon="💰" color="text-green-700" linkTo="/sales" sub="All sources" />
        <StatCard label="This Month"        value={fmt(thisMonthSales)}   icon="📅" color="text-blue-700"  linkTo="/sales" sub="Animal sales" />
        <StatCard label="Crop Revenue"      value={fmt(totalCropRevenue)} icon="🌾" color="text-lime-700"  linkTo="/sales" sub="From harvest" />
        <StatCard label="Net Profit"        value={fmt(totalProfit)}      icon="📈" color={totalProfit >= 0 ? "text-green-700" : "text-red-600"} linkTo="/sales" sub="Sale minus cost" />
      </div>

      {/* ── CHARTS ROW ── */}
      {/* Stack vertically on mobile, side by side on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-2xl shadow p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-700">Monthly Revenue (KES)</p>
            <Link to="/sales" className="text-xs text-green-600 hover:text-green-700 font-semibold">View all →</Link>
          </div>
          {monthlyRevenue.length === 0
            ? <div className="text-center py-10 text-gray-400 text-sm">No revenue data yet</div>
            : <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthlyRevenue} barGap={3}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f0fdf4" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} width={36} />
                  <Tooltip formatter={(v) => `KES ${v.toLocaleString()}`} contentStyle={{ borderRadius: "8px", fontSize: "11px" }} />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Bar dataKey="animals" name="Animals" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={12} />
                  <Bar dataKey="crops"   name="Crops"   fill="#84cc16" radius={[4, 4, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>}
        </div>

        {/* Animal Breakdown */}
        <div className="bg-white rounded-2xl shadow p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-700">Animals by Species</p>
            <Link to="/animals" className="text-xs text-green-600 hover:text-green-700 font-semibold">View all →</Link>
          </div>
          {animalBreakdown.length === 0
            ? <div className="text-center py-10 text-gray-400 text-sm">No animals added yet</div>
            : <ResponsiveContainer width="100%" height={180}>
                <BarChart data={animalBreakdown} layout="vertical" barSize={16}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f0fdf4" />
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={56} />
                  <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "11px" }} />
                  <Bar dataKey="count" name="Count" fill="#16a34a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>}
        </div>
      </div>

      {/* ── BOTTOM ROW — Sales + Activities ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

        {/* Recent Animal Sales */}
        <div className="bg-white rounded-2xl shadow p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-700">Recent Animal Sales</p>
            <Link to="/sales" className="text-xs text-green-600 hover:text-green-700 font-semibold">View all →</Link>
          </div>
          {salesRecords.length === 0
            ? <div className="text-center py-8 text-gray-400">
                <p className="text-3xl mb-2">🏷️</p>
                <p className="text-sm">No animal sales yet.</p>
                <p className="text-xs mt-1">Mark an animal as Sold on its profile.</p>
              </div>
            : <div className="space-y-2">
                {[...salesRecords].sort((a, b) => (b.saleDate || "").localeCompare(a.saleDate || "")).slice(0, 5).map((r) => {
                  const profitNum = parseFloat(r.profit) || 0;
                  return (
                    <div key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center text-sm shrink-0">
                        {r.species === "Cattle" ? "🐄" : r.species === "Sheep" ? "🐑" : r.species === "Goat" ? "🐐" : r.species === "Poultry" ? "🐔" : "🐾"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{r.animalName}</p>
                        <p className="text-xs text-gray-400 truncate">{r.saleDate} · {r.buyer || "—"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-green-700">KES {(parseFloat(r.salePrice) || 0).toLocaleString()}</p>
                        {r.purchasePrice && <p className={`text-xs font-semibold ${profitNum >= 0 ? "text-green-500" : "text-red-500"}`}>{profitNum >= 0 ? "+" : ""}KES {profitNum.toLocaleString()}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>}
        </div>

        {/* Upcoming Activities */}
        <div className="bg-white rounded-2xl shadow p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-700">Upcoming Activities</p>
            <Link to="/assistant" className="text-xs text-green-600 hover:text-green-700 font-semibold">View calendar →</Link>
          </div>
          {upcomingActivities.length === 0
            ? <div className="text-center py-8 text-gray-400">
                <p className="text-3xl mb-2">📅</p>
                <p className="text-sm">No upcoming activities.</p>
                <Link to="/assistant" className="text-xs text-green-600 hover:text-green-700 font-semibold mt-1 inline-block">Plan an activity →</Link>
              </div>
            : <div className="space-y-2">
                {upcomingActivities.map((a) => {
                  const d = new Date(a.dueDate + "T12:00:00");
                  const daysAway = Math.ceil((d - today) / 86400000);
                  const isOverdue = daysAway < 0;
                  return (
                    <div key={a.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className={`w-10 shrink-0 rounded-xl text-center py-1 ${daysAway === 0 ? "bg-green-600 text-white" : isOverdue ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                        <p className="text-xs font-semibold uppercase leading-tight">{d.toLocaleDateString("en-US", { month: "short" })}</p>
                        <p className="text-lg font-bold leading-tight">{d.getDate()}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{a.task}</p>
                        <p className="text-xs text-gray-400">{a.category || "General"}{a.priority && a.priority !== "Medium" ? ` · ${a.priority}` : ""}</p>
                      </div>
                      <span className={`text-xs font-bold shrink-0 ${daysAway === 0 ? "text-green-600" : isOverdue ? "text-red-500" : "text-gray-400"}`}>
                        {daysAway === 0 ? "Today" : isOverdue ? `${Math.abs(daysAway)}d overdue` : `${daysAway}d`}
                      </span>
                    </div>
                  );
                })}
              </div>}
        </div>
      </div>

      {/* ── Active Alerts ── */}
      {activeAlerts.length > 0 && (
        <div className="bg-white rounded-2xl shadow p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-700">Active Alerts <span className="text-red-500">({activeAlerts.length})</span></p>
            <Link to="/assistant" className="text-xs text-green-600 hover:text-green-700 font-semibold">View all →</Link>
          </div>
          <div className="space-y-2">
            {activeAlerts.slice(0, 4).map((a) => (
              <div key={a.id} className={`flex items-start gap-3 p-3 rounded-xl border ${
                a.severity === "critical" ? "bg-red-50 border-red-200" :
                a.severity === "high"     ? "bg-orange-50 border-orange-200" :
                                            "bg-yellow-50 border-yellow-200"
              }`}>
                <span className="text-base shrink-0">{a.severity === "critical" ? "🚨" : a.severity === "high" ? "⚠️" : "ℹ️"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{a.title}</p>
                  <p className="text-xs text-gray-500 leading-snug">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recently Added ── */}
      {recentAnimals.length > 0 && (
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow">
          <h3 className="text-base font-semibold text-green-900 mb-3">Recently added</h3>
          {/* 2 cols on mobile, 4 on md+ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {recentAnimals.map((a) => (
              <div key={a.id} className="flex items-center gap-2 sm:gap-3 bg-green-50 rounded-lg p-3">
                {a.image
                  ? <img src={a.image} alt={a.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shrink-0" />
                  : <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-200 flex items-center justify-center text-green-800 font-bold text-base sm:text-lg shrink-0">
                      {a.name?.[0]?.toUpperCase() || "?"}
                    </div>}
                <div className="min-w-0">
                  <p className="font-semibold text-green-900 text-sm truncate">{a.name}</p>
                  <p className="text-xs text-gray-500 capitalize truncate">{a.type} · {a.age} yrs</p>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                    a.status === "Healthy" ? "bg-green-100 text-green-800" :
                    a.status === "Sick"    ? "bg-red-100 text-red-700" :
                                             "bg-amber-100 text-amber-700"
                  }`}>
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty State CTA ── */}
      {totalAnimals === 0 && (
        <div className="bg-white border-2 border-dashed border-green-300 rounded-xl p-8 sm:p-10 text-center">
          <p className="text-gray-500 text-base sm:text-lg mb-3">Your farm is empty — let's add some animals!</p>
          <Link to="/animals/cattle/bulls" className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
            Add your first bull
          </Link>
        </div>
      )}

    </div>
  );
}
