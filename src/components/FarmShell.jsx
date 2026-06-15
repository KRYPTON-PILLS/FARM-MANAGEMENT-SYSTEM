import { useContext, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { FarmContext } from "../context/FarmContext";
import { useAuth } from "../context/AuthContext";
import { UseProfile } from "../hooks/UseProfile.js";
import TransitionNotifications from "./TransitionNotifications";
import { ActivityPlannerModal, NotificationCenter } from "./AssistantComponents";

/* ── helpers ── */
const TYPE_LABELS = {
  calf:"Calf","bull-calf":"Bull Calf",heifer:"Heifer",bull:"Bull",cow:"Cow",
  lamb:"Lamb","ewe-lamb":"Ewe Lamb","ram-lamb":"Ram Lamb",ewe:"Ewe",ram:"Ram",
  kid:"Kid",buckling:"Buckling",doeling:"Doeling",buck:"Buck",doe:"Doe",
};

const TYPE_COLOR = (to) => {
  if (["bull","ram","buck"].includes(to)) return "bg-green-700";
  if (["cow","ewe","doe"].includes(to)) return "bg-pink-600";
  if (["heifer","ewe-lamb","doeling"].includes(to)) return "bg-purple-500";
  if (["bull-calf","ram-lamb","buckling"].includes(to)) return "bg-blue-500";
  return "bg-orange-500";
};

const navLink = ({ isActive }) =>
  isActive
    ? "block bg-green-700 p-2 rounded text-sm"
    : "block p-2 rounded hover:bg-green-700 text-sm";

/* ── FARM SHELL ── */
export default function FarmShell() {
  const { transitionLog, pendingNotifications, alerts, activities, dismissAlert, addActivity } =
    useContext(FarmContext);

  const { profile } = UseProfile();
  const { currentUser } = useAuth();

  const [showLog, setShowLog] = useState(false);
  const [showActivityPlanner, setShowActivityPlanner] = useState(false);

  return (
    <div className="app-shell">

      {/* ── SIDEBAR ── */}
      <div className="app-sidebar w-full md:w-64 bg-green-900 text-white md:p-6 shadow-xl flex flex-col">
        <h1 className="text-2xl font-bold mb-8">🌿 Farm System</h1>

        <ul className="space-y-2 flex-1">
          <li><NavLink to="/dashboard"  className={navLink}>📊 Dashboard</NavLink></li>
          <li><NavLink to="/assistant"  className={navLink}>🤖 Assistant</NavLink></li>
          <li><NavLink to="/animals"    className={navLink}>🐄 Animals</NavLink></li>
          <li><NavLink to="/crops"      className={navLink}>🌱 Crops</NavLink></li>
          <li><NavLink to="/sales"      className={navLink}>💰 Sales</NavLink></li>
          <li><NavLink to="/reports"    className={navLink}>📈 Reports</NavLink></li>
        </ul>

        {/* ── BOTTOM SECTION — Profile + Transition Log ── */}
        <div className="mt-4 space-y-2">
          <NavLink to="/profile" className={navLink}>
            👤 Profile
          </NavLink>
          <button
            onClick={() => setShowLog(true)}
            className="w-full p-2 bg-green-700 rounded text-sm text-left"
          >
            🔄 Transition Log
          </button>
        </div>

      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="app-main">
        <Outlet />
      </div>

      {/* ── GLOBAL COMPONENTS ── */}
      <TransitionNotifications />

      <NotificationCenter
        alerts={alerts}
        activities={activities}
        onDismiss={dismissAlert}
      />

      <ActivityPlannerModal
        isOpen={showActivityPlanner}
        onClose={() => setShowActivityPlanner(false)}
        onAddActivity={(activity) => {
          addActivity(activity);
          setShowActivityPlanner(false);
        }}
      />

      {/* ── TRANSITION LOG DRAWER ── */}
      {showLog && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex justify-end"
          onClick={() => setShowLog(false)}
        >
          <div
            className="w-96 bg-white h-full shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b bg-green-900 text-white">
              <h3 className="font-bold text-lg">🔄 Transition Log</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {!transitionLog?.length ? (
                <p className="text-gray-500 text-sm">No transitions yet.</p>
              ) : (
                [...transitionLog].reverse().map((n, i) => (
                  <div key={i} className="p-3 border rounded mb-2">
                    <div className="flex gap-2">
                      <span className="font-bold">{n.name}</span>
                      <span className={`text-white px-2 rounded ${TYPE_COLOR(n.to)}`}>
                        {TYPE_LABELS[n.to] || n.to}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{n.reason}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
