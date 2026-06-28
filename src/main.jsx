import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import { FarmProvider } from "./context/FarmContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

/* Layout */
import FarmShell from "./components/FarmShell";

/* Pages */
import Dashboard    from "./pages/Dashboard.jsx";
import Animals      from "./pages/Animals.jsx";
import Crops        from "./pages/Crops.jsx";
import CropProfile  from "./pages/CropProfile.jsx";
import Reports      from "./pages/Reports.jsx";
import Login        from "./pages/Login.jsx";
import Signup       from "./pages/Signup.jsx";
import AssistantHub from "./pages/AssistantHub.jsx";
import UserProfile  from "./pages/UserProfile.jsx";
import Sales        from "./pages/Sales.jsx";
import MarketPage from "./pages/MarketPage.jsx";

/* Animal species pages */
import Cattle  from "./pages/Cattle.jsx";
import Sheep   from "./pages/Sheep.jsx";
import Goats   from "./pages/Goats.jsx";
import Pigs    from "./pages/Pigs.jsx";
import Poultry from "./pages/Poultry.jsx";

/* Cattle sub-pages */
import Bulls   from "./pages/Bulls.jsx";
import Cows    from "./pages/Cows.jsx";
import BullCalves from "./pages/BullCalves.jsx"
import Heifers from "./pages/Heifers.jsx";
import Calves  from "./pages/Calves.jsx";
import BullsProfile from "./pages/BullsProfile.jsx"
import CowsProfile from "./pages/CowsProfile.jsx"
import BullCalvesProfile from "./pages/BullCalvesProfile.jsx";
import HeiferProfile from "./pages/HeiferProfile.jsx"
import CalfProfile from "./pages/CalfProfile.jsx"

/* Sheep sub-pages — add imports if you have these files */
import Rams    from "./pages/Rams.jsx";
import Ewes    from "./pages/Ewes.jsx";
import RamLambs from "./pages/RamLambs.jsx"
import EweLambs from "./pages/EweLambs.jsx"
import Lambs   from "./pages/Lambs.jsx";
import RamsProfile from "./pages/RamsProfile.jsx"
import EwesProfile from "./pages/EwesProfile.jsx"
import RamLambProfile from "./pages/RamLambProfile.jsx"
import EweLambProfile from "./pages/EweLambProfile.jsx"
import LambProfile from "./pages/LambProfile.jsx"

/* Goat sub-pages — add imports if you have these files */
import Bucks     from "./pages/Bucks.jsx";
import Does      from "./pages/Does.jsx";
import Bucklings from "./pages/Bucklings.jsx";
import Doelings  from "./pages/Doelings.jsx";
import Kids      from "./pages/Kids.jsx";
import BuckProfile from "./pages/BuckProfile.jsx";
import DoeProfile from "./pages/DoeProfile.jsx";
import BucklingProfile from "./pages/BucklingProfile.jsx";
import DoelingProfile from "./pages/DoelingProfile.jsx";
import KidProfile from "./pages/KidProfile.jsx";

/* Pig sub-pages — add imports if you have these files */
//import Boars    from "./pages/Boars.jsx";
//import Sows     from "./pages/Sows.jsx";
//import Gilts    from "./pages/Gilts.jsx";
//import Weaners  from "./pages/Weaners.jsx";
//import Piglets  from "./pages/Piglets.jsx";

/* Poultry sub-pages — add imports if you have these files */
import Chicken from "./pages/Chicken.jsx";


import "./index.css";

/* ── ROUTES ── */
const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },

  {
    path: "/",
    element: (
      <ProtectedRoute>
        <FarmShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true,              element: <Dashboard /> },
      { path: "dashboard",        element: <Dashboard /> },
      { path: "assistant",        element: <AssistantHub /> },
      { path: "profile",          element: <UserProfile /> },
      { path: "animals",          element: <Animals /> },
      { path: "crops",            element: <Crops /> },
      { path: "crops/:id",        element: <CropProfile /> },
      { path: "reports",          element: <Reports /> },
      { path: "sales",            element: <Sales /> },
      { path: "marketpage",       element: <MarketPage /> },

      /* ── Animal species ── */
      { path: "animals/cattle",   element: <Cattle /> },
      { path: "animals/sheep",    element: <Sheep /> },
      { path: "animals/goats",    element: <Goats /> },
      { path: "animals/pigs",     element: <Pigs /> },
      { path: "animals/poultry",  element: <Poultry /> },

      /* ── Cattle sub-pages ── */
      { path: "animals/cattle/bulls",   element: <Bulls /> },
      { path: "animals/cattle/cows",    element: <Cows /> },
      { path: "animals/cattle/heifers", element: <Heifers /> },
      { path: "animals/cattle/bull-calves", element: <BullCalves /> },
      { path: "animals/cattle/calves",  element: <Calves /> },
      { path: "animals/cattle/bulls/:id",   element: <BullsProfile /> },
      { path: "animals/cattle/cows/:id",    element: <CowsProfile /> },
      { path: "animals/cattle/heifers/:id", element: <HeiferProfile /> },
      { path: "animals/cattle/bull-calves/:id", element: <BullCalvesProfile /> },
      { path: "animals/cattle/calves/:id",  element: <CalfProfile /> },

      /* ── Sheep sub-pages (uncomment when files exist) ── */
      { path: "animals/sheep/rams",   element: <Rams /> },
      { path: "animals/sheep/ewes",   element: <Ewes /> },
      { path: "animals/sheep/ram-lambs",  element: <RamLambs /> },
      { path: "animals/sheep/ewe-lambs",  element: <EweLambs /> },
      { path: "animals/sheep/lambs",  element: <Lambs /> },
      { path: "animals/sheep/rams/:id",   element: <RamsProfile /> },
      { path: "animals/sheep/ewes/:id",   element: <EwesProfile /> },
      { path: "animals/sheep/ram-lambs/:id",  element: <RamLambProfile /> },
      { path: "animals/sheep/ewe-lambs/:id",  element: <EweLambProfile /> },
      { path: "animals/sheep/lambs/:id",  element: <LambProfile /> },

      /* ── Goat sub-pages (uncomment when files exist) ── */
      { path: "animals/goats/bucks",     element: <Bucks /> },
      { path: "animals/goats/does",      element: <Does /> },
      { path: "animals/goats/bucklings", element: <Bucklings /> },
      { path: "animals/goats/doelings",  element: <Doelings /> },
      { path: "animals/goats/kids",      element: <Kids /> },
      { path: "animals/goats/bucks/:id",     element: <BuckProfile /> },
      { path: "animals/goats/does/:id",      element: <DoeProfile /> },
      { path: "animals/goats/bucklings/:id", element: <BucklingProfile /> },
      { path: "animals/goats/doelings/:id",  element: <DoelingProfile /> },
      { path: "animals/goats/kids/:id",      element: <KidProfile /> },

      /* ── Pig sub-pages (uncomment when files exist) ── */
      //{ path: "animals/pigs/boars",   element: <Boars /> },
      //{ path: "animals/pigs/sows",    element: <Sows /> },
      //{ path: "animals/pigs/gilts",   element: <Gilts /> },
      //{ path: "animals/pigs/weaners", element: <Weaners /> },
      //{ path: "animals/pigs/piglets", element: <Piglets /> },

      /* ── Poultry sub-pages (uncomment when files exist) ── */
      { path: "animals/poultry/chicken", element: <Chicken /> },
      //{ path: "animals/poultry/duck",    element: <Duck /> },
      //{ path: "animals/poultry/goose",   element: <Goose /> },
      //{ path: "animals/poultry/turkey",  element: <Turkey /> },
      //{ path: "animals/poultry/quail",   element: <Quail /> },
    ],
  },
]);

/* ── ROOT ── */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <FarmProvider>
        <RouterProvider router={router} />
      </FarmProvider>
    </AuthProvider>
  </React.StrictMode>
);
