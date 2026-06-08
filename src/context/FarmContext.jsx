import { createContext, useState, useEffect, useCallback } from "react";
import { generateAllAlerts } from "../utils/farmAssistant.js";
import { loadFarmState, saveFarmState } from "../db/farmDB.js";

export const FarmContext = createContext();

/* ════════════ AGE UTILITIES ════════════ */

export function calcAgeMonths(animal) {
  if (animal.birthDate) {
    const ms = Date.now() - new Date(animal.birthDate).getTime();
    return ms / (1000 * 60 * 60 * 24 * 30.44);
  }
  const raw = parseFloat(animal.age);
  if (isNaN(raw)) return null;
  const t = animal.type?.toLowerCase();
  if (["bull","cow","ewe","ram","buck","doe"].includes(t)) return raw * 12;
  return raw; // months for juveniles
}

export function formatAge(animal) {
  if (animal.birthDate) {
    const days = Math.floor((Date.now() - new Date(animal.birthDate).getTime()) / 86_400_000);
    if (days < 0)   return "Not yet born";
    if (days === 0) return "Born today";
    if (days < 7)   return `${days} day${days !== 1 ? "s" : ""}`;
    if (days < 30)  return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? "s" : ""}`;
    if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? "s" : ""}`;
    const yrs = (days / 365).toFixed(1);
    return `${yrs} yr${yrs !== "1.0" ? "s" : ""}`;
  }
  const raw = parseFloat(animal.age);
  if (isNaN(raw)) return "—";
  const t = animal.type?.toLowerCase();
  if (["bull","cow","ewe","ram","buck","doe"].includes(t))
    return raw < 2 ? `${raw} yr` : `${raw} yrs`;
  if (raw < 12) return `${Math.round(raw)} mo`;
  return `${(raw / 12).toFixed(1)} yrs`;
}

/* ════════════ TRANSITION ENGINE ════════════ */

function runTransitions(animals) {
  const log  = [];
  const today = new Date().toISOString().split("T")[0];

  const next = animals.map((a) => {
    if (a.__coverKey) return a;
    const type   = a.type?.toLowerCase();
    const months = calcAgeMonths(a);

    /* ─── CATTLE ─── */
    if (type === "calf" && months !== null && months >= 12) {
      const to = a.gender === "Male" ? "bull-calf" : "heifer";
      log.push({ id:a.id, name:a.name, from:"calf", to, reason:`Reached 12 months`, date:today });
      return { ...a, type:to, age:String(Math.round(months)), graduated:true };
    }
    if (type === "bull-calf" && months !== null) {
      const threshold = a.birthDate ? 24 : 12;
      if (months >= threshold) {
        log.push({ id:a.id, name:a.name, from:"bull-calf", to:"bull", reason:"12 months as bull calf", date:today });
        return { ...a, type:"bull", age:(months/12).toFixed(1) };
      }
    }
    if (type === "heifer") {
      const hasCalved = (a.calfHistory?.length > 0) || (a.reproductiveRecords?.some((r) => r.actualBirth));
      if (hasCalved) {
        log.push({ id:a.id, name:a.name, from:"heifer", to:"cow", reason:"First calving recorded", date:today });
        return { ...a, type:"cow", age:months?(months/12).toFixed(1):a.age, pregnancyStatus:"Lactating",
          growthRecords:a.growthRecords||[], feedRecords:a.feedRecords||[], medicalLog:a.medicalLog||[],
          heatRecords:a.heatRecords||[], reproductiveRecords:a.reproductiveRecords||[],
          lactationHistory:a.lactationHistory||[], calfHistory:a.calfHistory||[] };
      }
    }

    /* ─── SHEEP ─── */
    if (type === "lamb" && months !== null && months >= 6) {
      const to = a.gender === "Male" ? "ram-lamb" : "ewe-lamb";
      log.push({ id:a.id, name:a.name, from:"lamb", to, reason:`Reached 6 months`, date:today });
      return { ...a, type:to, age:String(Math.round(months)), graduated:true,
        heatRecords:a.heatRecords||[], drenchingRecords:a.drenchingRecords||[],
        growthRecords:a.growthRecords||[], feedRecords:a.feedRecords||[], medicalLog:a.medicalLog||[] };
    }
    if (type === "ewe-lamb") {
      const ageReady  = months !== null && months >= 12;
      const hasLambed = (a.lambingRecords?.length > 0) || (a.tuppingRecords?.some((r) => r.lambingComplete));
      if (ageReady || hasLambed) {
        log.push({ id:a.id, name:a.name, from:"ewe-lamb", to:"ewe",
          reason: hasLambed ? "First lambing recorded" : "Reached 12 months", date:today });
        return { ...a, type:"ewe", age:months?(months/12).toFixed(1):a.age, pregnancyStatus:"Open",
          drenchingRecords:a.drenchingRecords||[], woolRecords:a.woolRecords||[],
          lambingRecords:a.lambingRecords||[], tuppingRecords:a.tuppingRecords||[],
          growthRecords:a.growthRecords||[], feedRecords:a.feedRecords||[],
          medicalLog:a.medicalLog||[], heatRecords:a.heatRecords||[] };
      }
    }
    if (type === "ram-lamb" && months !== null) {
      const threshold = a.birthDate ? 18 : 12;
      if (months >= threshold) {
        log.push({ id:a.id, name:a.name, from:"ram-lamb", to:"ram", reason:"12 months as ram lamb", date:today });
        return { ...a, type:"ram", age:(months/12).toFixed(1),
          drenchingRecords:a.drenchingRecords||[], woolRecords:[], breedingRecords:[],
          growthRecords:a.growthRecords||[], feedRecords:a.feedRecords||[], medicalLog:a.medicalLog||[] };
      }
    }

    /* ─── GOATS ─── */
    // kid → buckling (male) or doeling (female) at 3 months
    if (type === "kid" && months !== null && months >= 3) {
      const to = a.gender === "Male" ? "buckling" : "doeling";
      log.push({ id:a.id, name:a.name, from:"kid", to, reason:`Reached 3 months`, date:today });
      return { ...a, type:to, age:String(Math.round(months)), graduated:true,
        drenchingRecords:a.drenchingRecords||[], growthRecords:a.growthRecords||[],
        feedRecords:a.feedRecords||[], medicalLog:a.medicalLog||[],
        ...(to === "doeling" ? { heatRecords:a.heatRecords||[], readinessStatus:"Growing" } : { maturityStatus:"Growing" }) };
    }

    // buckling → buck at 12 months
    // (if came through kid stage via birthDate: transition at 15 months total)
    if (type === "buckling" && months !== null) {
      const threshold = a.birthDate ? 15 : 12;
      if (months >= threshold) {
        log.push({ id:a.id, name:a.name, from:"buckling", to:"buck", reason:"12 months as buckling", date:today });
        return { ...a, type:"buck", age:(months/12).toFixed(1),
          drenchingRecords:a.drenchingRecords||[], breedingRecords:[],
          growthRecords:a.growthRecords||[], feedRecords:a.feedRecords||[], medicalLog:a.medicalLog||[] };
      }
    }

    // doeling → doe at 12 months OR after first kidding
    if (type === "doeling") {
      const ageReady  = months !== null && months >= 12;
      const hasKidded = (a.kiddingRecords?.length > 0) || (a.matingRecords?.some((r) => r.kiddingComplete));
      if (ageReady || hasKidded) {
        log.push({ id:a.id, name:a.name, from:"doeling", to:"doe",
          reason: hasKidded ? "First kidding recorded" : "Reached 12 months", date:today });
        return { ...a, type:"doe", age:months?(months/12).toFixed(1):a.age, pregnancyStatus:"Open",
          drenchingRecords:a.drenchingRecords||[], milkRecords:a.milkRecords||[],
          kiddingRecords:a.kiddingRecords||[], matingRecords:a.matingRecords||[],
          growthRecords:a.growthRecords||[], feedRecords:a.feedRecords||[],
          medicalLog:a.medicalLog||[], heatRecords:a.heatRecords||[] };
      }
    }

    return a;
  });

  return { next, log };
}

function refreshAgeFields(animals) {
  return animals.map((a) => {
    if (a.__coverKey || !a.birthDate) return a;
    const months = calcAgeMonths(a);
    if (months === null) return a;
    const t = a.type?.toLowerCase();
    const newAge = ["bull","cow","ewe","ram","buck","doe"].includes(t)
      ? (months / 12).toFixed(1)
      : String(Math.round(months));
    return { ...a, age: newAge };
  });
}

/* ════════════ PROVIDER ════════════ */

export function FarmProvider({ children }) {
  const [animals,              setAnimals]              = useState([]);
  const [crops,                setCrops]                = useState([]);
  const [transitionLog,        setTransitionLog]        = useState([]);
  const [pendingNotifications, setPendingNotifications] = useState([]);

  // Farm Assistant State
  const [activities,           setActivities]           = useState([]);
  const [alerts,               setAlerts]               = useState([]);
  const [feedInventory,        setFeedInventory]        = useState([]);
  const [productionHistory,    setProductionHistory]    = useState([]);
  const [mortalityRecords,     setMortalityRecords]     = useState([]);
  const [salesRecords,         setSalesRecords]         = useState([]);
  const [expenseRecords,       setExpenseRecords]       = useState([]);
  const [dismissedAlerts,      setDismissedAlerts]      = useState([]);
  const [isHydrated,           setIsHydrated]           = useState(false);

  const applyTransitions = useCallback((current) => {
    const refreshed     = refreshAgeFields(current);
    const { next, log } = runTransitions(refreshed);
    if (log.length > 0) {
      setTransitionLog((prev) => [...prev, ...log]);
      setPendingNotifications((prev) => [...prev, ...log]);
      return next;
    }
    return refreshed;
  }, []);

  /* ─── Generate alerts whenever farm data changes ─── */
  useEffect(() => {
    const farmData = {
      activities: activities.filter((a) => !a.completed),
      animals,
      feedInventory,
      productionHistory,
      mortalityRecords,
      salesRecords,
      expenseRecords,
    };

    const generatedAlerts = generateAllAlerts(farmData);
    const activeAlerts = generatedAlerts.filter(
      (a) => !dismissedAlerts.includes(a.id)
    );
    setAlerts(activeAlerts);
  }, [
    activities,
    animals,
    feedInventory,
    productionHistory,
    mortalityRecords,
    salesRecords,
    expenseRecords,
    dismissedAlerts,
  ]);

  /* Load persisted farm assistant state from IndexedDB */
  useEffect(() => {
    let canceled = false;

    loadFarmState()
      .then((stored) => {
        if (canceled) return;
        if (stored.animals) setAnimals(stored.animals);
        if (stored.crops) setCrops(stored.crops);
        if (stored.transitionLog) setTransitionLog(stored.transitionLog);
        if (stored.pendingNotifications) setPendingNotifications(stored.pendingNotifications);
        if (stored.activities) setActivities(stored.activities);
        if (stored.feedInventory) setFeedInventory(stored.feedInventory);
        if (stored.productionHistory) setProductionHistory(stored.productionHistory);
        if (stored.mortalityRecords) setMortalityRecords(stored.mortalityRecords);
        if (stored.salesRecords) setSalesRecords(stored.salesRecords);
        if (stored.expenseRecords) setExpenseRecords(stored.expenseRecords);
        if (stored.dismissedAlerts) setDismissedAlerts(stored.dismissedAlerts);
      })
      .finally(() => {
        if (!canceled) setIsHydrated(true);
      });

    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    setAnimals((prev) => applyTransitions(prev));
  }, [isHydrated, applyTransitions]);

  useEffect(() => {
    if (!isHydrated) return;
    saveFarmState({
      animals,
      crops,
      transitionLog,
      pendingNotifications,
      activities,
      feedInventory,
      productionHistory,
      mortalityRecords,
      salesRecords,
      expenseRecords,
      dismissedAlerts,
    });
  }, [
    isHydrated,
    animals,
    crops,
    transitionLog,
    pendingNotifications,
    activities,
    feedInventory,
    productionHistory,
    mortalityRecords,
    salesRecords,
    expenseRecords,
    dismissedAlerts,
  ]);

  /* Run every 24 hours */
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimals((prev) => applyTransitions(prev));
    }, 1000 * 60 * 60 * 24);
    return () => clearInterval(timer);
  }, [applyTransitions]);

  const dismissNotification = useCallback((idx) => {
    setPendingNotifications((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  /* ─── Activity Management ─── */
  const addActivity = useCallback((activity) => {
    const newActivity = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split("T")[0],
      completed: false,
      ...activity,
    };
    setActivities((prev) => [newActivity, ...prev]);
    return newActivity;
  }, []);

  const updateActivity = useCallback((id, updates) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  }, []);

  const deleteActivity = useCallback((id) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const completeActivity = useCallback((id) => {
    updateActivity(id, { completed: true, completedAt: new Date().toISOString().split("T")[0] });
  }, [updateActivity]);

  /* ─── Alert Management ─── */
  const dismissAlert = useCallback((alertId) => {
    setDismissedAlerts((prev) => [...prev, alertId]);
  }, []);

  const undismissAlert = useCallback((alertId) => {
    setDismissedAlerts((prev) => prev.filter((id) => id !== alertId));
  }, []);

  const clearAllDismissedAlerts = useCallback(() => {
    setDismissedAlerts([]);
  }, []);

  /* ─── Production Records ─── */
  const addProductionRecord = useCallback((record) => {
    const newRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      ...record,
    };
    setProductionHistory((prev) => [newRecord, ...prev]);
    return newRecord;
  }, []);

  /* ─── Mortality Records ─── */
  const addMortalityRecord = useCallback((record) => {
    const newRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      count: 1,
      ...record,
    };
    setMortalityRecords((prev) => [newRecord, ...prev]);
    return newRecord;
  }, []);

  /* ─── Sales Records ─── */
  const addSalesRecord = useCallback((record) => {
    const newRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      ...record,
    };
    setSalesRecords((prev) => [newRecord, ...prev]);
    return newRecord;
  }, []);

  /* ─── Expense Records ─── */
  const addExpenseRecord = useCallback((record) => {
    const newRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      ...record,
    };
    setExpenseRecords((prev) => [newRecord, ...prev]);
    return newRecord;
  }, []);

  return (
    <FarmContext.Provider value={{
      // Existing
      animals, setAnimals,
      crops,   setCrops,
      transitionLog, pendingNotifications, dismissNotification,
      calcAgeMonths, formatAge,

      // Farm Assistant
      activities, setActivities, addActivity, updateActivity, deleteActivity, completeActivity,
      alerts, dismissAlert, undismissAlert, clearAllDismissedAlerts,
      feedInventory, setFeedInventory,
      productionHistory, addProductionRecord,
      mortalityRecords, addMortalityRecord,
      salesRecords, addSalesRecord,
      expenseRecords, addExpenseRecord,
      dismissedAlerts,
    }}>
      {children}
    </FarmContext.Provider>
  );
}
