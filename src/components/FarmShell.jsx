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

  const [showLog, setShowLog]                     = useState(false);
  const [showActivityPlanner, setShowActivityPlanner] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen]       = useState(false);

  return (
    <div className="app-shell">

      {/* ════════════════════════════════════════
          DESKTOP SIDEBAR  (hidden on mobile)
      ════════════════════════════════════════ */}
      <div className="app-sidebar hidden md:flex w-64 bg-green-900 text-white p-6 shadow-xl flex-col">
        <h1 className="text-2xl font-bold mb-8">🌿 Farm System</h1>

        <ul className="space-y-2 flex-1">
          <li><NavLink to="/dashboard"   className={navLink}>📊 Dashboard</NavLink></li>
          <li><NavLink to="/assistant"   className={navLink}>🤖 Assistant</NavLink></li>
          <li><NavLink to="/animals"     className={navLink}>🐄 Animals</NavLink></li>
          <li><NavLink to="/crops"       className={navLink}>🌱 Crops</NavLink></li>
          <li><NavLink to="/sales"       className={navLink}>💰 Sales</NavLink></li>
          <li><NavLink to="/marketpage"  className={navLink}>🏪 Market</NavLink></li>
          <li><NavLink to="/reports"     className={navLink}>📈 Reports</NavLink></li>
        </ul>

        <div className="mt-4 space-y-2">
          <NavLink to="/profile" className={navLink}>👤 Profile</NavLink>
          <button
            onClick={() => setShowLog(true)}
            className="w-full p-2 bg-green-700 rounded text-sm text-left"
          >
            🔄 Transition Log
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════
          MOBILE TOP BAR  (hidden on desktop)
      ════════════════════════════════════════ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-green-900 text-white flex items-center justify-between px-4 py-3 shadow-lg">
        <h1 className="text-lg font-bold">🌿 Farm System</h1>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded hover:bg-green-700 transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* ════════════════════════════════════════
          MOBILE SLIDE-IN DRAWER MENU
      ════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-72 bg-green-900 text-white flex flex-col p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-xl font-bold">🌿 Farm System</h1>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded hover:bg-green-700"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav links — close drawer on tap */}
            <ul className="space-y-2 flex-1">
              {[
                { to: "/dashboard",  label: "📊 Dashboard" },
                { to: "/assistant",  label: "🤖 Assistant" },
                { to: "/animals",    label: "🐄 Animals"   },
                { to: "/crops",      label: "🌱 Crops"     },
                { to: "/sales",      label: "💰 Sales"     },
                { to: "/marketpage", label: "🏪 Market"    },
                { to: "/reports",    label: "📈 Reports"   },
              ].map(({ to, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={navLink}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-2">
              <NavLink
                to="/profile"
                className={navLink}
                onClick={() => setMobileMenuOpen(false)}
              >
                👤 Profile
              </NavLink>
              <button
                onClick={() => { setMobileMenuOpen(false); setShowLog(true); }}
                className="w-full p-2 bg-green-700 rounded text-sm text-left"
              >
                🔄 Transition Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════ */}
      <div className="app-main">
        <Outlet />
      </div>

      {/* ════════════════════════════════════════
          MOBILE BOTTOM NAV BAR
      ════════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-green-900 text-white border-t border-green-700 flex justify-around items-center py-2 shadow-lg">
        {[
          { to: "/dashboard",  icon: "📊", label: "Home"    },
          { to: "/animals",    icon: "🐄", label: "Animals" },
          { to: "/crops",      icon: "🌱", label: "Crops"   },
          { to: "/marketpage", icon: "🏪", label: "Market"  },
          { to: "/profile",    icon: "👤", label: "Profile" },
        ].map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 rounded text-xs transition-colors ${
                isActive ? "text-green-300" : "text-green-100 hover:text-white"
              }`
            }
          >
            <span className="text-xl leading-none">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

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
            className="w-full max-w-sm md:w-96 bg-white h-full shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b bg-green-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-lg">🔄 Transition Log</h3>
              <button
                onClick={() => setShowLog(false)}
                className="p-1 rounded hover:bg-green-700"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
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
