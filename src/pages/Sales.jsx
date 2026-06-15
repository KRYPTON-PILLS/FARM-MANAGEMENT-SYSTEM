import { useContext, useState, useMemo } from "react";
import { FarmContext } from "../context/FarmContext";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

/* ── colour palette ── */
const PIE_COLORS = ["#16a34a","#2563eb","#d97706","#dc2626","#7c3aed","#0d9488","#db2777","#64748b"];

const SPECIES_COLOR = {
  Cattle:  { bg:"bg-stone-100",  text:"text-stone-800",  badge:"bg-stone-700",  dot:"#78716c" },
  Sheep:   { bg:"bg-blue-50",    text:"text-blue-800",   badge:"bg-blue-600",   dot:"#2563eb" },
  Goat:    { bg:"bg-amber-50",   text:"text-amber-800",  badge:"bg-amber-500",  dot:"#d97706" },
  Poultry: { bg:"bg-yellow-50",  text:"text-yellow-800", badge:"bg-yellow-500", dot:"#ca8a04" },
  Pig:     { bg:"bg-pink-50",    text:"text-pink-800",   badge:"bg-pink-500",   dot:"#ec4899" },
  Crops:   { bg:"bg-green-50",   text:"text-green-800",  badge:"bg-green-600",  dot:"#16a34a" },
  Eggs:    { bg:"bg-orange-50",  text:"text-orange-800", badge:"bg-orange-500", dot:"#f97316" },
  Other:   { bg:"bg-gray-50",    text:"text-gray-800",   badge:"bg-gray-500",   dot:"#64748b" },
};

function sc(species) { return SPECIES_COLOR[species] || SPECIES_COLOR.Other; }

/* ── stat card ── */
function StatCard({ label, value, sub, color = "text-green-700", icon }) {
  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        {icon && <span className="text-3xl">{icon}</span>}
      </div>
    </div>
  );
}

/* ── month key ── */
function monthKey(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}
function monthLabel(key) {
  if (!key) return "";
  const [y, m] = key.split("-");
  return new Date(parseInt(y), parseInt(m)-1, 1).toLocaleDateString("en-US",{month:"short",year:"2-digit"});
}

const TABS = ["Overview","Animal Sales","Crop Revenue","All Transactions"];

export default function Sales() {
  const navigate = useNavigate();
  const { salesRecords = [], crops = [], animals = [] } = useContext(FarmContext);

  const [activeTab,    setActiveTab]    = useState("Overview");
  const [filterSpecies,setFilterSpecies]= useState("All");
  const [filterMonth,  setFilterMonth]  = useState("All");
  const [sortBy,       setSortBy]       = useState("date-desc");
  const [searchQ,      setSearchQ]      = useState("");

  /* ── Crop revenue from harvest records ── */
  const cropSales = useMemo(() => {
    const rows = [];
    crops.forEach((c) => {
      (c.harvestRecords || []).forEach((h) => {
        if (!h.revenue && !h.yield) return;
        const rev = parseFloat(h.revenue) || (parseFloat(h.yield||0) * parseFloat(h.sellingPrice||0));
        if (rev <= 0) return;
        rows.push({
          id:           `crop-${c.id}-${h.id}`,
          source:       "crop",
          cropId:       c.id,
          animalName:   c.name,
          species:      "Crops",
          animalType:   c.variety || "Crop",
          saleDate:     h.date,
          salePrice:    rev,
          purchasePrice:null,
          profit:       rev - (c.expenses||[]).reduce((s,e)=>s+(parseFloat(e.amount)||0),0),
          buyer:        h.buyer || "—",
          notes:        h.notes || "",
          yield:        `${h.yield} ${h.unit}`,
        });
      });
    });
    return rows;
  }, [crops]);

  /* ── Egg revenue from chicken flock records ── */
  const eggSales = useMemo(() => {
    const rows = [];
    animals.filter((a) => a.__flockRecord && a.category === "chicken").forEach((flock) => {
      (flock.eggRecords || []).forEach((r) => {
        if (!r.eggsSold || !r.pricePerEgg) return;
        const rev = parseInt(r.eggsSold) * parseFloat(r.pricePerEgg);
        if (rev <= 0) return;
        rows.push({
          id:          `egg-${flock.id}-${r.id}`,
          source:      "egg",
          animalName:  `${flock.type} eggs`,
          species:     "Eggs",
          animalType:  "Eggs",
          saleDate:    r.date,
          salePrice:   rev,
          purchasePrice: null,
          profit:      rev,
          buyer:       "—",
          notes:       `${r.eggsSold} eggs @ KES ${r.pricePerEgg}`,
        });
      });
    });
    return rows;
  }, [animals]);

  /* ── All transactions combined ── */
  const allTransactions = useMemo(() => {
    return [...salesRecords, ...cropSales, ...eggSales]
      .sort((a,b) => (b.saleDate||"").localeCompare(a.saleDate||""));
  }, [salesRecords, cropSales, eggSales]);

  /* ── Summary numbers ── */
  const totalRevenue  = allTransactions.reduce((s,r) => s+(parseFloat(r.salePrice)||0), 0);
  const animalRevenue = salesRecords.reduce((s,r) => s+(parseFloat(r.salePrice)||0), 0);
  const cropRevenue   = cropSales.reduce((s,r) => s+(parseFloat(r.salePrice)||0), 0);
  const eggRevenue    = eggSales.reduce((s,r) => s+(parseFloat(r.salePrice)||0), 0);
  const totalProfit   = allTransactions.reduce((s,r) => s+(parseFloat(r.profit)||0), 0);
  const animalsSold   = salesRecords.length;

  /* ── Monthly trend (last 12 months) ── */
  const monthlyTrend = useMemo(() => {
    const map = {};
    allTransactions.forEach((r) => {
      const k = monthKey(r.saleDate);
      if (!k) return;
      if (!map[k]) map[k] = { key:k, label:monthLabel(k), revenue:0, profit:0, count:0 };
      map[k].revenue += parseFloat(r.salePrice) || 0;
      map[k].profit  += parseFloat(r.profit)    || 0;
      map[k].count++;
    });
    return Object.values(map).sort((a,b) => a.key.localeCompare(b.key)).slice(-12);
  }, [allTransactions]);

  /* ── Revenue by species (pie) ── */
  const bySpecies = useMemo(() => {
    const map = {};
    allTransactions.forEach((r) => {
      const sp = r.species || "Other";
      if (!map[sp]) map[sp] = 0;
      map[sp] += parseFloat(r.salePrice) || 0;
    });
    return Object.entries(map).map(([name,value]) => ({ name, value })).sort((a,b) => b.value-a.value);
  }, [allTransactions]);

  /* ── Filter options ── */
  const allMonths = useMemo(() => {
    const keys = [...new Set(allTransactions.map(r => monthKey(r.saleDate)).filter(Boolean))].sort();
    return keys;
  }, [allTransactions]);

  const allSpecies = useMemo(() => {
    return ["All", ...new Set(allTransactions.map(r => r.species).filter(Boolean))];
  }, [allTransactions]);

  /* ── Filtered + sorted transactions ── */
  const filteredTx = useMemo(() => {
    let rows = allTransactions;
    if (filterSpecies !== "All") rows = rows.filter(r => r.species === filterSpecies);
    if (filterMonth   !== "All") rows = rows.filter(r => monthKey(r.saleDate) === filterMonth);
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      rows = rows.filter(r =>
        r.animalName?.toLowerCase().includes(q) ||
        r.buyer?.toLowerCase().includes(q) ||
        r.animalType?.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case "date-desc":    return [...rows].sort((a,b) => (b.saleDate||"").localeCompare(a.saleDate||""));
      case "date-asc":     return [...rows].sort((a,b) => (a.saleDate||"").localeCompare(b.saleDate||""));
      case "price-desc":   return [...rows].sort((a,b) => (parseFloat(b.salePrice)||0)-(parseFloat(a.salePrice)||0));
      case "price-asc":    return [...rows].sort((a,b) => (parseFloat(a.salePrice)||0)-(parseFloat(b.salePrice)||0));
      case "profit-desc":  return [...rows].sort((a,b) => (parseFloat(b.profit)||0)-(parseFloat(a.profit)||0));
      default:             return rows;
    }
  }, [allTransactions, filterSpecies, filterMonth, sortBy, searchQ]);

  /* ── Animal sales filtered ── */
  const filteredAnimalSales = useMemo(() => {
    let rows = salesRecords;
    if (filterSpecies !== "All" && filterSpecies !== "Crops" && filterSpecies !== "Eggs")
      rows = rows.filter(r => r.species === filterSpecies);
    if (filterMonth !== "All") rows = rows.filter(r => monthKey(r.saleDate) === filterMonth);
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      rows = rows.filter(r =>
        r.animalName?.toLowerCase().includes(q) ||
        r.buyer?.toLowerCase().includes(q) ||
        r.animalType?.toLowerCase().includes(q) ||
        r.breed?.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case "date-desc":   return [...rows].sort((a,b) => (b.saleDate||"").localeCompare(a.saleDate||""));
      case "date-asc":    return [...rows].sort((a,b) => (a.saleDate||"").localeCompare(b.saleDate||""));
      case "price-desc":  return [...rows].sort((a,b) => (parseFloat(b.salePrice)||0)-(parseFloat(a.salePrice)||0));
      case "price-asc":   return [...rows].sort((a,b) => (parseFloat(a.salePrice)||0)-(parseFloat(b.salePrice)||0));
      case "profit-desc": return [...rows].sort((a,b) => (parseFloat(b.profit)||0)-(parseFloat(a.profit)||0));
      default:            return rows;
    }
  }, [salesRecords, filterSpecies, filterMonth, sortBy, searchQ]);

  const fmt = (n) => `KES ${(parseFloat(n)||0).toLocaleString()}`;

  /* ══════════════════════ RENDER ══════════════════════ */
  return (
    <div className="bg-green-50 min-h-full">
      {/* TOP BAR */}
      <div className="flex items-center gap-4 px-6 py-4 bg-white shadow-sm sticky top-0 z-20">
        <button onClick={()=>navigate(-1)}
          className="bg-white shadow w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-green-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
          </svg>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-green-900">Sales & Income</h2>
          <p className="text-gray-500 text-xs mt-0.5">Track revenue from animals, crops and eggs</p>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Total Revenue"   value={fmt(totalRevenue)}  color="text-green-700"  icon="💰"/>
          <StatCard label="Net Profit"       value={fmt(totalProfit)}   color={totalProfit>=0?"text-green-700":"text-red-600"} icon="📈"/>
          <StatCard label="Animal Sales"     value={fmt(animalRevenue)} color="text-stone-700"  icon="🐄" sub={`${animalsSold} animals`}/>
          <StatCard label="Crop Revenue"     value={fmt(cropRevenue)}   color="text-lime-700"   icon="🌾" sub={`${cropSales.length} harvests`}/>
          <StatCard label="Egg Revenue"      value={fmt(eggRevenue)}    color="text-amber-600"  icon="🥚" sub={`${eggSales.length} records`}/>
          <StatCard label="Transactions"     value={allTransactions.length} color="text-blue-700" icon="📋"/>
        </div>

        {/* TABS */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="flex border-b overflow-x-auto">
            {TABS.map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition ${
                  activeTab===t ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}>
                {t}
              </button>
            ))}
          </div>

          {/* ══ OVERVIEW TAB ══ */}
          {activeTab === "Overview" && (
            <div className="p-5 space-y-6">
              {allTransactions.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-5xl mb-4">💰</p>
                  <p className="text-lg font-semibold text-gray-600 mb-1">No sales recorded yet</p>
                  <p className="text-sm">Mark animals as Sold on their profile pages, or add crop harvests with prices to see income here.</p>
                </div>
              ) : (
                <>
                  {/* Monthly revenue chart */}
                  {monthlyTrend.length > 0 && (
                    <div>
                      <p className="text-sm font-bold text-gray-600 mb-3">Monthly Revenue & Profit (KES)</p>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={monthlyTrend} barGap={4}>
                          <CartesianGrid strokeDasharray="4 4" stroke="#f0fdf4"/>
                          <XAxis dataKey="label" tick={{fontSize:11}}/>
                          <YAxis tick={{fontSize:11}} tickFormatter={(v)=>`${(v/1000).toFixed(0)}K`}/>
                          <Tooltip formatter={(v)=>`KES ${v.toLocaleString()}`} contentStyle={{borderRadius:"8px",fontSize:"12px"}}/>
                          <Legend wrapperStyle={{fontSize:"11px"}}/>
                          <Bar dataKey="revenue" name="Revenue" fill="#16a34a" radius={[4,4,0,0]} barSize={18}/>
                          <Bar dataKey="profit"  name="Profit"  fill="#86efac" radius={[4,4,0,0]} barSize={18}/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Revenue by category pie */}
                    {bySpecies.length > 0 && (
                      <div>
                        <p className="text-sm font-bold text-gray-600 mb-3">Revenue by Category</p>
                        <div className="flex items-center gap-4">
                          <ResponsiveContainer width={160} height={160}>
                            <PieChart>
                              <Pie data={bySpecies} dataKey="value" cx="50%" cy="50%" outerRadius={72} innerRadius={36}>
                                {bySpecies.map((_,i) => <Cell key={i} fill={sc(bySpecies[i].name).dot || PIE_COLORS[i%PIE_COLORS.length]}/>)}
                              </Pie>
                              <Tooltip formatter={(v)=>`KES ${v.toLocaleString()}`}/>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex-1 space-y-1.5">
                            {bySpecies.map((s,i) => (
                              <div key={s.name} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full shrink-0" style={{backgroundColor: sc(s.name).dot || PIE_COLORS[i%PIE_COLORS.length]}}/>
                                  <span className="text-sm text-gray-600">{s.name}</span>
                                </div>
                                <span className="text-sm font-bold text-gray-800">KES {s.value.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recent sales */}
                    <div>
                      <p className="text-sm font-bold text-gray-600 mb-3">Recent Transactions</p>
                      <div className="space-y-2">
                        {allTransactions.slice(0,6).map((r) => {
                          const c = sc(r.species);
                          const profitNum = parseFloat(r.profit) || 0;
                          return (
                            <div key={r.id} className={`${c.bg} rounded-xl p-3 flex items-center gap-3`}>
                              <div className={`w-2 h-8 rounded-full shrink-0`} style={{backgroundColor:c.dot}}/>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{r.animalName}</p>
                                <p className="text-xs text-gray-500">{r.saleDate} · {r.species} · {r.buyer}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-green-700">KES {(parseFloat(r.salePrice)||0).toLocaleString()}</p>
                                {r.purchasePrice && <p className={`text-xs font-semibold ${profitNum>=0?"text-green-600":"text-red-500"}`}>{profitNum>=0?"+":""}KES {profitNum.toLocaleString()}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Best performers */}
                  {salesRecords.length > 0 && (
                    <div>
                      <p className="text-sm font-bold text-gray-600 mb-3">Top Animal Sales by Price</p>
                      <div className="grid md:grid-cols-3 gap-3">
                        {[...salesRecords]
                          .sort((a,b)=>(parseFloat(b.salePrice)||0)-(parseFloat(a.salePrice)||0))
                          .slice(0,3)
                          .map((r,i) => {
                            const c = sc(r.species);
                            const profitNum = parseFloat(r.profit)||0;
                            return (
                              <div key={r.id} className={`${c.bg} border border-gray-200 rounded-2xl p-4`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-lg font-bold text-gray-400">#{i+1}</span>
                                  <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-full ${c.badge}`}>{r.species}</span>
                                </div>
                                <p className="font-bold text-gray-900">{r.animalName}</p>
                                <p className="text-xs text-gray-500">{r.animalType}{r.breed?` · ${r.breed}`:""}</p>
                                <p className="text-lg font-bold text-green-700 mt-2">KES {(parseFloat(r.salePrice)||0).toLocaleString()}</p>
                                {r.purchasePrice && <p className={`text-xs font-semibold ${profitNum>=0?"text-green-600":"text-red-500"}`}>{profitNum>=0?"Profit +":"Loss "}KES {Math.abs(profitNum).toLocaleString()}</p>}
                                <p className="text-xs text-gray-400 mt-0.5">{r.saleDate} · {r.buyer}</p>
                              </div>
                            );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ══ ANIMAL SALES TAB ══ */}
          {activeTab === "Animal Sales" && (
            <div className="p-5">
              {/* Filters */}
              <FilterBar
                searchQ={searchQ} setSearchQ={setSearchQ}
                filterSpecies={filterSpecies} setFilterSpecies={setFilterSpecies}
                filterMonth={filterMonth} setFilterMonth={setFilterMonth}
                sortBy={sortBy} setSortBy={setSortBy}
                allSpecies={allSpecies.filter(s=>!["Crops","Eggs"].includes(s))}
                allMonths={allMonths}
              />

              {filteredAnimalSales.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-4xl mb-3">🐄</p>
                  <p>No animal sales yet. Mark an animal as Sold on its profile page.</p>
                </div>
              ) : (
                <SalesTable rows={filteredAnimalSales} showYield={false}/>
              )}
            </div>
          )}

          {/* ══ CROP REVENUE TAB ══ */}
          {activeTab === "Crop Revenue" && (
            <div className="p-5">
              <FilterBar
                searchQ={searchQ} setSearchQ={setSearchQ}
                filterSpecies="Crops" setFilterSpecies={()=>{}}
                filterMonth={filterMonth} setFilterMonth={setFilterMonth}
                sortBy={sortBy} setSortBy={setSortBy}
                allSpecies={["Crops"]}
                allMonths={allMonths}
                hideSpecies
              />
              {cropSales.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-4xl mb-3">🌾</p>
                  <p>No crop revenue yet. Add harvest records with selling prices on your crop profiles.</p>
                </div>
              ) : (
                <SalesTable rows={cropSales} showYield/>
              )}
            </div>
          )}

          {/* ══ ALL TRANSACTIONS TAB ══ */}
          {activeTab === "All Transactions" && (
            <div className="p-5">
              <FilterBar
                searchQ={searchQ} setSearchQ={setSearchQ}
                filterSpecies={filterSpecies} setFilterSpecies={setFilterSpecies}
                filterMonth={filterMonth} setFilterMonth={setFilterMonth}
                sortBy={sortBy} setSortBy={setSortBy}
                allSpecies={allSpecies}
                allMonths={allMonths}
              />
              {filteredTx.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-4xl mb-3">📋</p>
                  <p>No transactions match your filters.</p>
                </div>
              ) : (
                <SalesTable rows={filteredTx} showYield/>
              )}

              {/* Running total */}
              {filteredTx.length > 0 && (
                <div className="mt-4 flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-5 py-3">
                  <span className="text-sm font-semibold text-gray-600">Total for current filter ({filteredTx.length} records)</span>
                  <span className="text-lg font-bold text-green-700">
                    KES {filteredTx.reduce((s,r)=>s+(parseFloat(r.salePrice)||0),0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Filter bar ── */
function FilterBar({ searchQ, setSearchQ, filterSpecies, setFilterSpecies, filterMonth, setFilterMonth, sortBy, setSortBy, allSpecies, allMonths, hideSpecies }) {
  return (
    <div className="flex flex-wrap gap-3 mb-5">
      <input value={searchQ} onChange={(e)=>setSearchQ(e.target.value)}
        placeholder="Search name, buyer, type…"
        className="border border-gray-200 rounded-xl px-4 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:border-green-400"/>
      {!hideSpecies && (
        <select value={filterSpecies} onChange={(e)=>setFilterSpecies(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-400">
          {allSpecies.map((s)=><option key={s}>{s}</option>)}
        </select>
      )}
      <select value={filterMonth} onChange={(e)=>setFilterMonth(e.target.value)}
        className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-400">
        <option value="All">All Months</option>
        {allMonths.map((k)=><option key={k} value={k}>{new Date(k+"-01").toLocaleDateString("en-US",{month:"long",year:"numeric"})}</option>)}
      </select>
      <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)}
        className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-400">
        <option value="date-desc">Newest first</option>
        <option value="date-asc">Oldest first</option>
        <option value="price-desc">Highest price</option>
        <option value="price-asc">Lowest price</option>
        <option value="profit-desc">Best profit</option>
      </select>
    </div>
  );
}

/* ── Sales table ── */
function SalesTable({ rows, showYield }) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <div className="overflow-y-auto" style={{maxHeight:"480px"}}>
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 sticky top-0 border-b border-gray-200 z-10">
                {["Date","Name","Category","Type / Breed","Buyer",showYield?"Yield/Qty":"","Sale Price","Purchase Price","Profit / Loss",""].map((h,i)=>
                  h ? <th key={i} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th> : null
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r,i) => {
                const c = SPECIES_COLOR[r.species] || SPECIES_COLOR.Other;
                const profitNum = parseFloat(r.profit) || 0;
                const hasPurchase = r.purchasePrice !== null && r.purchasePrice !== undefined;
                return (
                  <tr key={r.id} className={`${i%2===0?"bg-white":"bg-gray-50/40"} hover:bg-green-50/30 transition`}>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700 font-medium">{r.saleDate || "—"}</td>
                    <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">{r.animalName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full text-white ${c.badge}`}>{r.species}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.animalType}{r.breed?` · ${r.breed}`:""}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.buyer || "—"}</td>
                    {showYield && <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{r.yield || r.notes || "—"}</td>}
                    <td className="px-4 py-3 whitespace-nowrap font-bold text-green-700">KES {(parseFloat(r.salePrice)||0).toLocaleString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">{hasPurchase ? `KES ${parseFloat(r.purchasePrice).toLocaleString()}` : "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {hasPurchase ? (
                        <span className={`font-bold ${profitNum>=0?"text-green-700":"text-red-600"}`}>
                          {profitNum>=0?"+":""}KES {Math.abs(profitNum).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.notes && (
                        <div className="group relative">
                          <span className="text-gray-400 hover:text-gray-600 cursor-help text-base">ℹ️</span>
                          <div className="absolute right-0 top-6 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 w-48 hidden group-hover:block z-10 leading-relaxed">{r.notes}</div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}