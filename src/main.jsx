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

/* Animal species pages */
import Cattle  from "./pages/Cattle.jsx";
import Sheep   from "./pages/Sheep.jsx";
import Goats   from "./pages/Goats.jsx";
import Pigs    from "./pages/Pigs.jsx";
import Poultry from "./pages/Poultry.jsx";

/* Cattle sub-pages */
import Cows    from "./pages/Cows.jsx";
import Bulls   from "./pages/Bulls.jsx";
import Heifers from "./pages/Heifers.jsx";
import Calves  from "./pages/Calves.jsx";

/* Sheep sub-pages — add imports if you have these files */
import Ewes    from "./pages/Ewes.jsx";
import Rams    from "./pages/Rams.jsx";
import Lambs   from "./pages/Lambs.jsx";

/* Goat sub-pages — add imports if you have these files */
import Bucks     from "./pages/Bucks.jsx";
import Does      from "./pages/Does.jsx";
import Bucklings from "./pages/Bucklings.jsx";
import Doelings  from "./pages/Doelings.jsx";
import Kids      from "./pages/Kids.jsx";

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

      /* ── Animal species ── */
      { path: "animals/cattle",   element: <Cattle /> },
      { path: "animals/sheep",    element: <Sheep /> },
      { path: "animals/goats",    element: <Goats /> },
      { path: "animals/pigs",     element: <Pigs /> },
      { path: "animals/poultry",  element: <Poultry /> },

      /* ── Cattle sub-pages ── */
      { path: "animals/cattle/cows",    element: <Cows /> },
      { path: "animals/cattle/bulls",   element: <Bulls /> },
      { path: "animals/cattle/heifers", element: <Heifers /> },
      { path: "animals/cattle/calves",  element: <Calves /> },

      /* ── Sheep sub-pages (uncomment when files exist) ── */
      { path: "animals/sheep/ewes",   element: <Ewes /> },
      { path: "animals/sheep/rams",   element: <Rams /> },
      { path: "animals/sheep/lambs",  element: <Lambs /> },

      /* ── Goat sub-pages (uncomment when files exist) ── */
      { path: "animals/goats/bucks",     element: <Bucks /> },
      { path: "animals/goats/does",      element: <Does /> },
      { path: "animals/goats/bucklings", element: <Bucklings /> },
      { path: "animals/goats/doelings",  element: <Doelings /> },
      { path: "animals/goats/kids",      element: <Kids /> },

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
