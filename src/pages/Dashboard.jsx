import { useContext } from "react";
import { FarmContext } from "../context/FarmContext";
import { Link } from "react-router-dom";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";

export default function Dashboard() {
  const { animals = [] } = useContext(FarmContext);

  /* ─── LIVE STATS ─── */
  const totalAnimals = animals.length;

  const cattle = animals.filter((a) => a.category === "cattle");
  const bulls   = cattle.filter((a) => a.type?.toLowerCase() === "bull");
  const cows    = cattle.filter((a) => a.type?.toLowerCase() === "cow");
  const heifers = cattle.filter((a) => a.type?.toLowerCase() === "heifer");
  const calves  = cattle.filter(
    (a) =>
      a.type?.toLowerCase() === "calf" ||
      a.type?.toLowerCase() === "bull-calf"
  );

  const healthyCount  = animals.filter((a) => a.status === "Healthy").length;
  const sickCount     = animals.filter((a) => a.status === "Sick").length;
  const treatmentCount = animals.filter((a) => a.status === "Under Treatment").length;
  const soldCount     = animals.filter((a) => a.status === "Sold").length;

  /* ─── CATTLE BREAKDOWN CHART DATA ─── */
  const cattleBreakdown = [
    { name: "Bulls",   count: bulls.length },
    { name: "Cows",    count: cows.length },
    { name: "Heifers", count: heifers.length },
    { name: "Calves",  count: calves.length },
  ];

  /* ─── DUMMY SALES DATA (replace with real later) ─── */
  const salesData = [
    { day: "Mon", sales: 400 },
    { day: "Tue", sales: 300 },
    { day: "Wed", sales: 500 },
    { day: "Thu", sales: 200 },
    { day: "Fri", sales: 700 },
    { day: "Sat", sales: 600 },
    { day: "Sun", sales: 800 },
  ];

  /* ─── RECENT ANIMALS (last 4 added) ─── */
  const recentAnimals = [...animals]
    .sort((a, b) => b.id - a.id)
    .slice(0, 4);

  /* ─── STAT CARD ─── */
  const StatCard = ({ label, value, sub, color = "text-green-700", to }) => (
    <div className="bg-white p-5 rounded-xl shadow hover:shadow-md transition">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </h3>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      {to && (
        <Link to={to} className="text-xs text-green-600 hover:underline mt-2 block">
          View →
        </Link>
      )}
    </div>
  );

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-3xl font-bold text-green-900">Dashboard</h2>
        <p className="text-gray-500 mt-1 text-sm">Live overview of your farm</p>
      </div>

      {/* TOP STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Animals"
          value={totalAnimals}
          sub={totalAnimals === 0 ? "Add animals to get started" : `${cattle.length} cattle`}
          to="/animals"
        />
        <StatCard
          label="Healthy"
          value={healthyCount}
          sub={totalAnimals > 0 ? `${Math.round((healthyCount / totalAnimals) * 100)}% of herd` : "—"}
          color="text-green-600"
        />
        <StatCard
          label="Sick / Treatment"
          value={sickCount + treatmentCount}
          sub={sickCount + treatmentCount > 0 ? `${sickCount} sick · ${treatmentCount} in treatment` : "All clear"}
          color={sickCount + treatmentCount > 0 ? "text-red-600" : "text-green-600"}
        />
        <StatCard
          label="Sold"
          value={soldCount}
          sub="this session"
          color="text-amber-600"
        />
      </div>

      {/* CHARTS ROW */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* CATTLE BREAKDOWN */}
        <div className="bg-white p-5 rounded-xl shadow">
          <h3 className="text-base font-semibold text-green-900 mb-3">
            Cattle breakdown
          </h3>
          {cattle.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">
              No cattle added yet.{" "}
              <Link to="/animals/cattle" className="text-green-600 hover:underline">
                Go to Cattle →
              </Link>
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cattleBreakdown} barSize={36}>
                <CartesianGrid strokeDasharray="5 5" stroke="#d1fae5" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#f9fafb", borderRadius: "8px" }}
                />
                <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* WEEKLY SALES */}
        <div className="bg-white p-5 rounded-xl shadow">
          <h3 className="text-base font-semibold text-green-900 mb-3">
            Weekly sales (KES)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={salesData}>
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#16a34a"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <CartesianGrid stroke="#d1fae5" strokeDasharray="5 5" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#f9fafb", borderRadius: "8px" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RECENTLY ADDED */}
      {recentAnimals.length > 0 && (
        <div className="bg-white p-5 rounded-xl shadow">
          <h3 className="text-base font-semibold text-green-900 mb-3">
            Recently added
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentAnimals.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 bg-green-50 rounded-lg p-3"
              >
                {a.image ? (
                  <img
                    src={a.image}
                    alt={a.name}
                    className="w-12 h-12 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center text-green-800 font-bold text-lg shrink-0">
                    {a.name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-green-900 text-sm truncate">
                    {a.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {a.type} · {a.age} yrs
                  </p>
                  <span
                    className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                      a.status === "Healthy"
                        ? "bg-green-100 text-green-800"
                        : a.status === "Sick"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EMPTY STATE CTA */}
      {totalAnimals === 0 && (
        <div className="bg-white border-2 border-dashed border-green-300 rounded-xl p-10 text-center">
          <p className="text-gray-500 text-lg mb-3">Your farm is empty — let's add some animals!</p>
          <Link
            to="/animals/cattle/bulls"
            className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Add your first bull
          </Link>
        </div>
      )}
    </div>
  );
}
