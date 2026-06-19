// farmDB.js — Firestore Database Layer for Farm Management App
// Covers:
//   1. loadFarmState / saveFarmState  ← used by FarmContext.jsx
//   2. Per-collection CRUD helpers    ← for individual pages
//   3. Dashboard summary

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig.js";

// ─────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────

/** Returns the currently logged-in user's UID (throws if not logged in) */
const getUid = () => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");
  return user.uid;
};

/** Reference to a user-scoped sub-collection */
const userCol = (uid, colName) => collection(db, "users", uid, colName);

/** Reference to a specific document inside a user-scoped sub-collection */
const userDoc = (uid, colName, docId) =>
  doc(db, "users", uid, colName, docId);

// ─────────────────────────────────────────────
// CORE STATE FUNCTIONS  (used by FarmContext.jsx)
// ─────────────────────────────────────────────

/**
 * The keys FarmContext stores.
 * Each key maps to a Firestore sub-collection under /users/{uid}/
 * EXCEPT for scalar/small arrays which go into a single "meta" document.
 */
const ARRAY_COLLECTIONS = [
  "animals",
  "crops",
  "activities",
  "feedInventory",
  "productionHistory",
  "mortalityRecords",
  "salesRecords",
  "expenseRecords",
  "transitionLog",
  "pendingNotifications",
];

const META_KEYS = ["dismissedAlerts"];

/**
 * loadFarmState()
 * Reads the full farm state for auth.currentUser from Firestore.
 * Returns an object with all the keys FarmContext expects.
 */
export const loadFarmState = async () => {
  const uid = getUid();
  const result = {};

  // Load each large array from its own sub-collection
  await Promise.all(
    ARRAY_COLLECTIONS.map(async (colName) => {
      try {
        const snap = await getDocs(userCol(uid, colName));
        result[colName] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch {
        result[colName] = [];
      }
    })
  );

  // Load small/scalar values from a single "meta" document
  try {
    const metaSnap = await getDoc(doc(db, "users", uid, "meta", "farmMeta"));
    if (metaSnap.exists()) {
      const metaData = metaSnap.data();
      META_KEYS.forEach((key) => {
        result[key] = metaData[key] ?? [];
      });
    } else {
      META_KEYS.forEach((key) => (result[key] = []));
    }
  } catch {
    META_KEYS.forEach((key) => (result[key] = []));
  }

  return result;
};

/**
 * saveFarmState(state)
 * Persists the full farm state for auth.currentUser to Firestore.
 * Called automatically by FarmContext whenever state changes.
 *
 * Strategy:
 *  - Large arrays  → each item gets its own document in a sub-collection
 *                    (upserted by item.id so we don't duplicate)
 *  - Small/scalar  → written to a single "meta" document
 */
export const saveFarmState = async (state) => {
  const uid = getUid();

  // Save each large array to its sub-collection (upsert by item.id)
  await Promise.all(
    ARRAY_COLLECTIONS.map(async (colName) => {
      const items = state[colName];
      if (!Array.isArray(items)) return;
      await Promise.all(
        items.map(async (item) => {
          if (!item?.id) return; // skip items without an id
          const ref = doc(db, "users", uid, colName, String(item.id));
          // setDoc with merge:true creates or updates without wiping fields
          await setDoc(ref, { ...item, _savedAt: new Date().toISOString() }, { merge: true });
        })
      );
    })
  );

  // Save small/scalar values to the meta document
  const metaRef = doc(db, "users", uid, "meta", "farmMeta");
  const metaPayload = {};
  META_KEYS.forEach((key) => {
    metaPayload[key] = state[key] ?? [];
  });
  await setDoc(metaRef, { ...metaPayload, updatedAt: serverTimestamp() }, { merge: true });
};

// ─────────────────────────────────────────────


// ─────────────────────────────
// COVER IMAGES
// Stored at /users/{uid}/coverImages/{categoryKey}
// so they persist independently of the animals array
// ─────────────────────────────

/**
 * Save a cover image URL for a category (e.g. "calves", "bulls").
 * Call this right after a successful Firebase Storage upload.
 */
export const saveCoverImage = async (categoryKey, downloadURL) => {
  const uid = getUid();
  const ref = doc(db, "users", uid, "coverImages", categoryKey);
  await setDoc(ref, {
    categoryKey,
    coverImage: downloadURL,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Load all saved cover image URLs for the current user.
 * Returns an object like: { calves: "https://...", bulls: "https://..." }
 */
export const loadCoverImages = async () => {
  const uid = getUid();
  try {
    const snap = await getDocs(userCol(uid, "coverImages"));
    const result = {};
    snap.docs.forEach((d) => {
      result[d.id] = d.data().coverImage;
    });
    return result;
  } catch {
    return {};
  }
};

// ─────────────────────────────
// GENERIC CRUD
// GENERIC CRUD  (used by individual page components)
// ─────────────────────────────────────────────

/** Add a new document — returns the new Firestore doc ID */
export const addRecord = async (uid, colName, data) => {
  const ref = userCol(uid, colName);
  const docRef = await addDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

/** Fetch a single document by its Firestore ID */
export const getRecord = async (uid, colName, docId) => {
  const snap = await getDoc(userDoc(uid, colName, docId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/** Fetch every document in a collection */
export const getAllRecords = async (uid, colName) => {
  const snap = await getDocs(userCol(uid, colName));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Update specific fields on a document */
export const updateRecord = async (uid, colName, docId, data) => {
  await updateDoc(userDoc(uid, colName, docId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

/** Delete a document */
export const deleteRecord = async (uid, colName, docId) => {
  await deleteDoc(userDoc(uid, colName, docId));
};

/** Subscribe to real-time updates on a collection */
export const subscribeToCollection = (uid, colName, callback) => {
  return onSnapshot(userCol(uid, colName), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

// ─────────────────────────────────────────────
// CATTLE
// Bulls · Cows · Heifers · Calves · Bull Calves
// ─────────────────────────────────────────────

export const cattle = {
  addBull:      (uid, data)      => addRecord(uid, "bulls", data),
  getBulls:     (uid)            => getAllRecords(uid, "bulls"),
  getBull:      (uid, id)        => getRecord(uid, "bulls", id),
  updateBull:   (uid, id, data)  => updateRecord(uid, "bulls", id, data),
  deleteBull:   (uid, id)        => deleteRecord(uid, "bulls", id),

  addCow:       (uid, data)      => addRecord(uid, "cows", data),
  getCows:      (uid)            => getAllRecords(uid, "cows"),
  getCow:       (uid, id)        => getRecord(uid, "cows", id),
  updateCow:    (uid, id, data)  => updateRecord(uid, "cows", id, data),
  deleteCow:    (uid, id)        => deleteRecord(uid, "cows", id),

  addHeifer:    (uid, data)      => addRecord(uid, "heifers", data),
  getHeifers:   (uid)            => getAllRecords(uid, "heifers"),
  getHeifer:    (uid, id)        => getRecord(uid, "heifers", id),
  updateHeifer: (uid, id, data)  => updateRecord(uid, "heifers", id, data),
  deleteHeifer: (uid, id)        => deleteRecord(uid, "heifers", id),

  addCalf:      (uid, data)      => addRecord(uid, "calves", data),
  getCalves:    (uid)            => getAllRecords(uid, "calves"),
  getCalf:      (uid, id)        => getRecord(uid, "calves", id),
  updateCalf:   (uid, id, data)  => updateRecord(uid, "calves", id, data),
  deleteCalf:   (uid, id)        => deleteRecord(uid, "calves", id),

  addBullCalf:    (uid, data)     => addRecord(uid, "bullCalves", data),
  getBullCalves:  (uid)           => getAllRecords(uid, "bullCalves"),
  updateBullCalf: (uid, id, data) => updateRecord(uid, "bullCalves", id, data),
  deleteBullCalf: (uid, id)       => deleteRecord(uid, "bullCalves", id),
};

// ─────────────────────────────────────────────
// GOATS
// Bucks · Does · Kids · Bucklings · Doelings
// ─────────────────────────────────────────────

export const goats = {
  addBuck:      (uid, data)      => addRecord(uid, "bucks", data),
  getBucks:     (uid)            => getAllRecords(uid, "bucks"),
  getBuck:      (uid, id)        => getRecord(uid, "bucks", id),
  updateBuck:   (uid, id, data)  => updateRecord(uid, "bucks", id, data),
  deleteBuck:   (uid, id)        => deleteRecord(uid, "bucks", id),

  addDoe:       (uid, data)      => addRecord(uid, "does", data),
  getDoes:      (uid)            => getAllRecords(uid, "does"),
  getDoe:       (uid, id)        => getRecord(uid, "does", id),
  updateDoe:    (uid, id, data)  => updateRecord(uid, "does", id, data),
  deleteDoe:    (uid, id)        => deleteRecord(uid, "does", id),

  addKid:       (uid, data)      => addRecord(uid, "kids", data),
  getKids:      (uid)            => getAllRecords(uid, "kids"),
  getKid:       (uid, id)        => getRecord(uid, "kids", id),
  updateKid:    (uid, id, data)  => updateRecord(uid, "kids", id, data),
  deleteKid:    (uid, id)        => deleteRecord(uid, "kids", id),

  addBuckling:    (uid, data)     => addRecord(uid, "bucklings", data),
  getBucklings:   (uid)           => getAllRecords(uid, "bucklings"),
  updateBuckling: (uid, id, data) => updateRecord(uid, "bucklings", id, data),
  deleteBuckling: (uid, id)       => deleteRecord(uid, "bucklings", id),

  addDoeling:    (uid, data)      => addRecord(uid, "doelings", data),
  getDoelings:   (uid)            => getAllRecords(uid, "doelings"),
  updateDoeling: (uid, id, data)  => updateRecord(uid, "doelings", id, data),
  deleteDoeling: (uid, id)        => deleteRecord(uid, "doelings", id),
};

// ─────────────────────────────────────────────
// SHEEP
// Rams · Ewes · Lambs · Ram Lambs · Ewe Lambs
// ─────────────────────────────────────────────

export const sheep = {
  addRam:      (uid, data)      => addRecord(uid, "rams", data),
  getRams:     (uid)            => getAllRecords(uid, "rams"),
  getRam:      (uid, id)        => getRecord(uid, "rams", id),
  updateRam:   (uid, id, data)  => updateRecord(uid, "rams", id, data),
  deleteRam:   (uid, id)        => deleteRecord(uid, "rams", id),

  addEwe:      (uid, data)      => addRecord(uid, "ewes", data),
  getEwes:     (uid)            => getAllRecords(uid, "ewes"),
  getEwe:      (uid, id)        => getRecord(uid, "ewes", id),
  updateEwe:   (uid, id, data)  => updateRecord(uid, "ewes", id, data),
  deleteEwe:   (uid, id)        => deleteRecord(uid, "ewes", id),

  addLamb:     (uid, data)      => addRecord(uid, "lambs", data),
  getLambs:    (uid)            => getAllRecords(uid, "lambs"),
  getLamb:     (uid, id)        => getRecord(uid, "lambs", id),
  updateLamb:  (uid, id, data)  => updateRecord(uid, "lambs", id, data),
  deleteLamb:  (uid, id)        => deleteRecord(uid, "lambs", id),

  addRamLamb:    (uid, data)     => addRecord(uid, "ramLambs", data),
  getRamLambs:   (uid)           => getAllRecords(uid, "ramLambs"),
  updateRamLamb: (uid, id, data) => updateRecord(uid, "ramLambs", id, data),
  deleteRamLamb: (uid, id)       => deleteRecord(uid, "ramLambs", id),

  addEweLamb:    (uid, data)     => addRecord(uid, "eweLambs", data),
  getEweLambs:   (uid)           => getAllRecords(uid, "eweLambs"),
  updateEweLamb: (uid, id, data) => updateRecord(uid, "eweLambs", id, data),
  deleteEweLamb: (uid, id)       => deleteRecord(uid, "eweLambs", id),
};

// ─────────────────────────────────────────────
// PIGS
// ─────────────────────────────────────────────

export const pigs = {
  addPig:         (uid, data)     => addRecord(uid, "pigs", data),
  getPigs:        (uid)           => getAllRecords(uid, "pigs"),
  getPig:         (uid, id)       => getRecord(uid, "pigs", id),
  updatePig:      (uid, id, data) => updateRecord(uid, "pigs", id, data),
  deletePig:      (uid, id)       => deleteRecord(uid, "pigs", id),
  subscribeToPigs:(uid, cb)       => subscribeToCollection(uid, "pigs", cb),
};

// ─────────────────────────────────────────────
// POULTRY
// ─────────────────────────────────────────────

export const poultry = {
  addBird:           (uid, data)     => addRecord(uid, "poultry", data),
  getBirds:          (uid)           => getAllRecords(uid, "poultry"),
  getBird:           (uid, id)       => getRecord(uid, "poultry", id),
  updateBird:        (uid, id, data) => updateRecord(uid, "poultry", id, data),
  deleteBird:        (uid, id)       => deleteRecord(uid, "poultry", id),
  subscribeToPoultry:(uid, cb)       => subscribeToCollection(uid, "poultry", cb),
};

// ─────────────────────────────────────────────
// CROPS
// ─────────────────────────────────────────────

export const crops = {
  addCrop:         (uid, data)     => addRecord(uid, "crops", data),
  getCrops:        (uid)           => getAllRecords(uid, "crops"),
  getCrop:         (uid, id)       => getRecord(uid, "crops", id),
  updateCrop:      (uid, id, data) => updateRecord(uid, "crops", id, data),
  deleteCrop:      (uid, id)       => deleteRecord(uid, "crops", id),
  subscribeToCrops:(uid, cb)       => subscribeToCollection(uid, "crops", cb),

  getActiveCrops: async (uid) => {
    const q = query(userCol(uid, "crops"), where("status", "==", "growing"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },
};

// ─────────────────────────────────────────────
// SALES
// ─────────────────────────────────────────────

export const sales = {
  addSale:          (uid, data)     => addRecord(uid, "sales", data),
  getSales:         (uid)           => getAllRecords(uid, "sales"),
  getSale:          (uid, id)       => getRecord(uid, "sales", id),
  updateSale:       (uid, id, data) => updateRecord(uid, "sales", id, data),
  deleteSale:       (uid, id)       => deleteRecord(uid, "sales", id),
  subscribeToSales: (uid, cb)       => subscribeToCollection(uid, "sales", cb),

  getSalesByCategory: async (uid, category) => {
    const q = query(userCol(uid, "sales"), where("category", "==", category));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  getSalesByDateRange: async (uid, startDate, endDate) => {
    const q = query(
      userCol(uid, "sales"),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },
};

// ─────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────

export const reports = {
  saveReport:   (uid, data)     => addRecord(uid, "reports", data),
  getReports:   (uid)           => getAllRecords(uid, "reports"),
  getReport:    (uid, id)       => getRecord(uid, "reports", id),
  updateReport: (uid, id, data) => updateRecord(uid, "reports", id, data),
  deleteReport: (uid, id)       => deleteRecord(uid, "reports", id),

  getReportsByType: async (uid, type) => {
    const q = query(
      userCol(uid, "reports"),
      where("type", "==", type),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },
};

// ─────────────────────────────────────────────
// USER PROFILE
// ─────────────────────────────────────────────

export const userProfile = {
  saveProfile: async (uid, data) => {
    const ref = doc(db, "users", uid);
    await setDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  },

  getProfile: async (uid) => {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },
};

// ─────────────────────────────────────────────
// DASHBOARD SUMMARY
// ─────────────────────────────────────────────

export const getDashboardSummary = async (uid) => {
  const colNames = [
    "bulls", "cows", "heifers", "calves", "bullCalves",
    "bucks", "does", "kids", "bucklings", "doelings",
    "rams", "ewes", "lambs", "ramLambs", "eweLambs",
    "pigs", "poultry", "crops", "sales",
  ];

  const counts = await Promise.all(
    colNames.map(async (colName) => {
      const snap = await getDocs(userCol(uid, colName));
      return { [colName]: snap.size };
    })
  );

  return Object.assign({}, ...counts);
};