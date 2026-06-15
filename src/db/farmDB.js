/**
 * farmDB.js
 * 
 * Replaces the old IndexedDB implementation.
 * All farm data is now stored in Firestore under:
 *   /farms/{uid}/data/state
 *
 * This means data follows the farmer across every device,
 * browser, and deployment automatically.
 */

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig.js";       // adjust path if your firebase.js lives elsewhere


/* ── Get the current user's UID safely ── */
function getUid() {
  return auth?.currentUser?.uid ?? null;
}

/* ── Load all farm state for the logged-in user ── */
export async function loadFarmState() {
  try {
    const uid = getUid();
    if (!uid || !db) return {};                      // not logged in or no DB

    const ref  = doc(db, "farms", uid, "data", "state");
    const snap = await getDoc(ref);

    if (!snap.exists()) return {};                   // first time — no data yet
    return snap.data() ?? {};
  } catch (err) {
    console.error("loadFarmState error:", err);
    return {};
  }
}

/* ── Save all farm state for the logged-in user ── */
export async function saveFarmState(state) {
  try {
    const uid = getUid();
    if (!uid || !db) return;                         // not logged in or no DB

    const ref = doc(db, "farms", uid, "data", "state");

    // merge:true so a partial save never wipes unrelated fields
    await setDoc(ref, sanitize(state), { merge: true });
  } catch (err) {
    console.error("saveFarmState error:", err);
  }
}

/* ── Strip anything Firestore can't store ── */
function sanitize(obj) {
  return JSON.parse(JSON.stringify(obj));
}