/**
 * migrateProfile.js
 *
 * One-time migration utility.
 * If a user has profile data in localStorage (from the old system),
 * this copies it up to Firestore and then clears localStorage.
 *
 * Call this once inside AuthContext or App.jsx right after login:
 *
 *   import { migrateLocalProfileToFirestore } from "./utils/migrateProfile.js";
 *   // inside onAuthStateChanged, after user is confirmed:
 *   await migrateLocalProfileToFirestore(user.uid);
 */

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig.js";

const OLD_KEY = "farm_user_profile";

export async function migrateLocalProfileToFirestore(uid) {
  try {
    if (!uid || !db) return;

    // Only migrate if there's something in localStorage
    const raw = localStorage.getItem(OLD_KEY);
    if (!raw) return;

    // Only migrate if Firestore doesn't already have a profile
    const ref  = doc(db, "farms", uid, "profile", "info");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      // Firestore already has data — just clear the stale localStorage copy
      localStorage.removeItem(OLD_KEY);
      return;
    }

    // Write the localStorage data up to Firestore
    const parsed = JSON.parse(raw);
    await setDoc(ref, parsed, { merge: true });

    // Clean up localStorage so this never runs again
    localStorage.removeItem(OLD_KEY);

    console.log("✅ Profile migrated from localStorage to Firestore.");
  } catch (err) {
    console.error("Profile migration error:", err);
  }
}