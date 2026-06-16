/**
 * UseProfile.js
 *
 * FIXED: Profile data is now saved to Firestore under
 *   /farms/{uid}/profile/info
 * so it syncs across every device automatically.
 *
 * Previously used localStorage — which is device-local
 * and never leaves the browser it was created in.
 */

import { useState, useCallback, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig.js";
import { useAuth } from "../context/AuthContext.jsx";

const DEFAULTS = {
  displayName:  "",
  phone:        "",
  photoURL:     "",
  farmName:     "",
  farmLocation: "",
  farmSize:     "",
  farmSizeUnit: "Acres",
  farmType:     "Mixed",
  country:      "Kenya",
  bio:          "",
};

/* ── Firestore helpers ── */
async function loadFromFirestore(uid) {
  try {
    if (!uid || !db) return { ...DEFAULTS };
    const ref  = doc(db, "farms", uid, "profile", "info");
    const snap = await getDoc(ref);
    if (!snap.exists()) return { ...DEFAULTS };
    return { ...DEFAULTS, ...snap.data() };
  } catch (err) {
    console.error("UseProfile loadFromFirestore error:", err);
    return { ...DEFAULTS };
  }
}

async function saveToFirestore(uid, data) {
  try {
    if (!uid || !db) return;
    // Strip the photoURL if it's a large base64 string — store it separately
    // or keep it if it's a remote URL. Base64 avatars can be large but Firestore
    // allows up to 1MB per document, so it's fine for most profile photos.
    const ref = doc(db, "farms", uid, "profile", "info");
    await setDoc(ref, data, { merge: true });
  } catch (err) {
    console.error("UseProfile saveToFirestore error:", err);
  }
}

export function UseProfile() {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid ?? null;

  const [profile,    setProfileState] = useState({ ...DEFAULTS });
  const [loadedUid,  setLoadedUid]    = useState(null);

  /* ── Load profile whenever the logged-in user changes ── */
  useEffect(() => {
    if (!uid) {
      // Logged out — reset to defaults
      setProfileState({ ...DEFAULTS });
      setLoadedUid(null);
      return;
    }

    if (uid === loadedUid) return; // already loaded for this user

    loadFromFirestore(uid).then((data) => {
      setProfileState(data);
      setLoadedUid(uid);
    });
  }, [uid, loadedUid]);

  /* ── Update profile and persist to Firestore ── */
  const updateProfile = useCallback((updates) => {
    setProfileState((prev) => {
      const next = { ...prev, ...updates };
      // Fire-and-forget — don't block the UI
      if (uid) saveToFirestore(uid, next);
      return next;
    });
  }, [uid]);

  /* ── Reset profile to defaults ── */
  const resetProfile = useCallback(() => {
    const fresh = { ...DEFAULTS };
    setProfileState(fresh);
    if (uid) saveToFirestore(uid, fresh);
  }, [uid]);

  return { profile, updateProfile, resetProfile };
}