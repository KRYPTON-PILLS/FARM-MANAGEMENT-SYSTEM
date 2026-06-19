/**
 * UseProfile.js
 *
 * Stores profile data in:
 * /farms/{uid}/profile/info
 *
 * Uses Firestore realtime listeners so profile updates
 * appear immediately across devices and browser tabs.
 */

import { useState, useCallback, useEffect } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig.js";
import { useAuth } from "../context/AuthContext.jsx";
import { getDoc } from "firebase/firestore";

const DEFAULTS = {
  displayName: "",
  phone: "",
  photoURL: "",
  farmName: "",
  farmLocation: "",
  farmSize: "",
  farmSizeUnit: "Acres",
  farmType: "Mixed",
  country: "Kenya",
  bio: "",
};

/* ── Firestore helper ── */
async function saveToFirestore(uid, data) {
  try {
    if (!uid || !db) return;

    const ref = doc(db, "farms", uid, "profile", "info");

    await setDoc(ref, data, {
      merge: true,
    });
  } catch (err) {
    console.error("UseProfile saveToFirestore error:", err);
    throw err;
  }
}

export function UseProfile() {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid ?? null;

  const [profile, setProfileState] = useState({ ...DEFAULTS });

  /* ── Realtime profile listener ── */
  useEffect(() => {
    if (!uid) {
      console.log("No uid yet");
      setProfileState({ ...DEFAULTS });
      return;
    }

    console.log("Listening for profile changes for uid:", uid);

    const ref = doc(db, "farms", uid, "profile", "info");

    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        console.log("Profile snapshot received:",snap.exists(), snap.data());
        if (snap.exists()) {
          setProfileState({
            ...DEFAULTS,
            ...snap.data(),
          });
        } else {
          setProfileState({ ...DEFAULTS });
        }
      },
      (error) => {
        console.error("UseProfile snapshot error:", error);
        setProfileState({ ...DEFAULTS });
      }
    );

    return unsubscribe;
  }, [uid]);

  /* ── Update profile ── */
  const updateProfile = useCallback(
    async (updates) => {
      const next = {
        ...profile,
        ...updates,
      };

      setProfileState(next);

      if (uid) {
        await saveToFirestore(uid, next);
      }

      return next;
    },
    [uid, profile]
  );

  /* ── Reset profile ── */
  const resetProfile = useCallback(async () => {
    const fresh = { ...DEFAULTS };

    setProfileState(fresh);

    if (uid) {
      await saveToFirestore(uid, fresh);
    }
  }, [uid]);

  return {
    profile,
    updateProfile,
    resetProfile,
  };
}