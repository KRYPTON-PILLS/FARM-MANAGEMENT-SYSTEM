import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { FarmContext } from "./context/FarmContext";
import TransitionNotifications from "./components/TransitionNotifications";
import { ActivityPlannerModal, NotificationCenter } from "./components/AssistantComponents.jsx";

/* ── Pages ── */
import Dashboard         from "./pages/Dashboard.jsx";
import Animals           from "./pages/Animals.jsx";
import Crops             from "./pages/Crops.jsx";
import Reports           from "./pages/Reports.jsx";
import AssistantHub      from "./pages/AssistantHub.jsx";

/* Cattle */
import Cattle            from "./pages/Cattle.jsx";
import Bulls             from "./pages/Bulls.jsx";
import BullsProfile      from "./pages/BullsProfile.jsx";
import Cows              from "./pages/Cows.jsx";
import CowsProfile       from "./pages/CowsProfile.jsx";
import BullCalves        from "./pages/BullCalves.jsx";
import BullCalvesProfile from "./pages/BullCalvesProfile.jsx";
import Heifers           from "./pages/Heifers.jsx";
import HeiferProfile     from "./pages/HeiferProfile.jsx";
import Calves            from "./pages/Calves.jsx";
import CalfProfile       from "./pages/CalfProfile.jsx";

/* Sheep */
import Sheep             from "./pages/Sheep.jsx";
import Lambs             from "./pages/Lambs.jsx";
import LambProfile       from "./pages/LambProfile.jsx";
import EweLambs          from "./pages/EweLambs.jsx";
import EweLambProfile    from "./pages/EweLambProfile.jsx";
import RamLambs          from "./pages/RamLambs.jsx";
import RamLambProfile    from "./pages/RamLambProfile.jsx";
import Ewes              from "./pages/Ewes.jsx";
import EwesProfile       from "./pages/EwesProfile.jsx";
import Rams              from "./pages/Rams.jsx";
import RamsProfile       from "./pages/RamsProfile.jsx";

/* Goats */
import Goats             from "./pages/Goats.jsx";
import Bucks              from "./pages/Bucks.jsx";
import BuckProfile        from "./pages/BuckProfile.jsx";
import Does              from "./pages/Does.jsx";
import DoeProfile        from "./pages/DoeProfile.jsx";
import Kids               from "./pages/Kids.jsx";
import KidProfile        from "./pages/KidProfile.jsx";
import Bucklings         from "./pages/Bucklings.jsx";
import BucklingProfile   from "./pages/BucklingProfile.jsx";
import DoelingsPage       from "./pages/Doelings.jsx";
import DoelingProfile    from "./pages/DoelingProfile.jsx";


/* Poultry */
import Poultry           from "./pages/Poultry.jsx";
import Chicken           from "./pages/Chicken.jsx";

/* Pigs */
import Pigs              from "./pages/Pigs.jsx";

/* Crops */
import CropProfile         from "./pages/CropProfile.jsx";


const TYPE_LABELS = {
  "calf":"Calf","bull-calf":"Bull Calf","heifer":"Heifer","bull":"Bull","cow":"Cow",
  "lamb":"Lamb","ewe-lamb":"Ewe Lamb","ram-lamb":"Ram Lamb","ewe":"Ewe","ram":"Ram",
};

const navLink = ({ isActive }) =>
  isActive ? "block bg-green-700 p-2 rounded text-sm" : "block p-2 rounded hover:bg-green-700 text-sm";

export default function App() {
  const { transitionLog, pendingNotifications, alerts, activities, dismissAlert, addActivity } = useContext(FarmContext);
  const [showLog, setShowLog] = useState(false);
  const [showActivityPlanner, setShowActivityPlanner] = useState(false);

  return (
    <div className="app-shell">

      {/* ── SIDEBAR ── */}
      <div className="app-sidebar w-64 bg-green-900 text-white p-6 shadow-xl flex flex-col">
        <h1 className="text-2xl font-bold mb-8">🌿 Farm System</h1>

        <ul className="space-y-2 flex-1">
          <li><NavLink to="/dashboard" className={navLink}>📊 Dashboard</NavLink></li>
          <li><NavLink to="/assistant"   className={navLink}>🤖 Farm Assistant</NavLink></li>
          <li><NavLink to="/animals"   className={navLink}>🐄 Animals</NavLink></li>
          <li><NavLink to="/crops"     className={navLink}>🌱 Crops</NavLink></li>
          <li><NavLink to="/reports"   className={navLink}>📈 Reports</NavLink></li>
        </ul>

        {/* Activity Planner Button */}
        <div className="mb-4 border-t border-green-700 pt-4">
          <button 
            onClick={() => setShowActivityPlanner(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 rounded transition font-semibold text-sm"
          >
            <span>📋</span> Plan Activity
          </button>
        </div>

        {/* Transition log */}
        <div className="pt-4 border-t border-green-700">
          <button onClick={() => setShowLog(true)}
            className="w-full flex items-center justify-between p-2 rounded hover:bg-green-700 transition text-sm">
            <span>🔄 Transition Log</span>
            {pendingNotifications?.length > 0
              ? <span className="bg-amber-400 text-green-900 text-xs font-bold px-2 py-0.5 rounded-full">{pendingNotifications.length}</span>
              : transitionLog?.length > 0
                ? <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">{transitionLog.length}</span>
                : null}
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="app-main">
        <Routes>
          {/* Core */}
          <Route path="/"          element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assistant" element={<AssistantHub />} />
          <Route path="/animals"   element={<Animals />} />
          <Route path="/crops"     element={<Crops />} />
          <Route path="/reports"   element={<Reports />} />

          {/* Cattle */}
          <Route path="/animals/cattle"                  element={<Cattle />} />
          <Route path="/animals/cattle/bulls"            element={<Bulls />} />
          <Route path="/animals/cattle/bulls/:id"        element={<BullsProfile />} />
          <Route path="/animals/cattle/cows"             element={<Cows />} />
          <Route path="/animals/cattle/cows/:id"         element={<CowsProfile />} />
          <Route path="/animals/cattle/bull-calves"      element={<BullCalves />} />
          <Route path="/animals/cattle/bull-calves/:id"  element={<BullCalvesProfile />} />
          <Route path="/animals/cattle/heifers"          element={<Heifers />} />
          <Route path="/animals/cattle/heifers/:id"      element={<HeiferProfile />} />
          <Route path="/animals/cattle/calves"           element={<Calves />} />
          <Route path="/animals/cattle/calves/:id"       element={<CalfProfile />} />

          {/* Sheep */}
          <Route path="/animals/sheep"                   element={<Sheep />} />
          <Route path="/animals/sheep/lambs"             element={<Lambs />} />
          <Route path="/animals/sheep/lambs/:id"         element={<LambProfile />} />
          <Route path="/animals/sheep/ewe-lambs"         element={<EweLambs />} />
          <Route path="/animals/sheep/ewe-lambs/:id"     element={<EweLambProfile />} />
          <Route path="/animals/sheep/ram-lambs"         element={<RamLambs />} />
          <Route path="/animals/sheep/ram-lambs/:id"     element={<RamLambProfile />} />
          <Route path="/animals/sheep/ewes"              element={<Ewes />} />
          <Route path="/animals/sheep/ewes/:id"          element={<EwesProfile />} />
          <Route path="/animals/sheep/rams"              element={<Rams />} />
          <Route path="/animals/sheep/rams/:id"          element={<RamsProfile />} />

          {/* Goats */}
          <Route path="/animals/goats"                   element={<Goats />} />
          <Route path="/animals/goats/bucks"             element={<Bucks />} />
          <Route path="/animals/goats/bucks/:id"         element={<BuckProfile />} />
          <Route path="/animals/goats/does"              element={<Does />} />
          <Route path="/animals/goats/does/:id"          element={<DoeProfile />} />
          <Route path="/animals/goats/kids"              element={<Kids />} />
          <Route path="/animals/goats/kids/:id"          element={<KidProfile />} />
          <Route path="/animals/goats/bucklings"         element={<Bucklings />} />
          <Route path="/animals/goats/bucklings/:id"     element={<BucklingProfile />} />
          <Route path="/animals/goats/doelings"          element={<DoelingsPage />} />
          <Route path="/animals/goats/doelings/:id"      element={<DoelingProfile />} />


          {/* Pigs */}
          <Route path="/animals/pigs"                    element={<Pigs />} />

          {/* Poultry */}
          <Route path="/animals/poultry"                 element={<Poultry />} />
          <Route path="/animals/poultry/chicken"         element={<Chicken />} />

          {/* Crops */}
          <Route path="/crops/:id"                      element={<CropProfile />} />


        </Routes>
      </div>

      {/* ── TOAST NOTIFICATIONS ── */}
      <TransitionNotifications />

      {/* ── NOTIFICATION CENTER ── */}
      <NotificationCenter 
        alerts={alerts} 
        activities={activities}
        onDismiss={dismissAlert}
      />

      {/* ── ACTIVITY PLANNER MODAL ── */}
      <ActivityPlannerModal 
        isOpen={showActivityPlanner}
        onClose={() => setShowActivityPlanner(false)}
        onAddActivity={(activity) => {
          addActivity(activity);
          setShowActivityPlanner(false);
        }}
      />

      {showLog && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={() => setShowLog(false)}>
          <div className="w-96 bg-white h-full shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b bg-green-900 text-white">
              <h3 className="font-bold text-lg">🔄 Transition Log</h3>
              <button onClick={() => setShowLog(false)} className="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {!transitionLog?.length ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">🐾</p>
                  <p className="text-gray-500 text-sm">No transitions yet.</p>
                  <p className="text-gray-400 text-xs mt-1">Category changes from age milestones or calving/lambing events appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...transitionLog].reverse().map((n, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900 text-sm">{n.name}</span>
                        <span className="text-gray-300 text-xs">→</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full text-white
                          ${n.to==="bull"||n.to==="ram"?"bg-green-700":
                            n.to==="cow"||n.to==="ewe"?"bg-pink-600":
                            n.to==="heifer"||n.to==="ewe-lamb"?"bg-purple-500":
                            n.to==="bull-calf"||n.to==="ram-lamb"?"bg-blue-500":"bg-orange-500"}`}>
                          {TYPE_LABELS[n.to]||n.to}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{TYPE_LABELS[n.from]||n.from} → {TYPE_LABELS[n.to]||n.to}</p>
                      <p className="text-xs text-gray-400 italic mt-0.5">{n.reason}</p>
                      {n.date && <p className="text-xs text-gray-300 mt-1">{n.date}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 text-xs text-gray-400 text-center">
              Transitions run on app load and every 24 hours
            </div>
          </div>
        </div>
      )}
    </div>
  );
}