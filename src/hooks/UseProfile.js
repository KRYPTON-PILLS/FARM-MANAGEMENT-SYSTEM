import { useState, useCallback } from "react";
 
const STORAGE_KEY = "farm_user_profile";
 
const DEFAULTS = {
  displayName:  "",
  phone:        "",
  photoURL:     "",     // base64 data URL after upload
  farmName:     "",
  farmLocation: "",
  farmSize:     "",
  farmSizeUnit: "Acres",
  farmType:     "Mixed",
  country:      "Kenya",
  bio:          "",
};
 
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}
 
function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}
 
export function UseProfile() {
  const [profile, setProfileState] = useState(load);
 
  const updateProfile = useCallback((updates) => {
    setProfileState((prev) => {
      const next = { ...prev, ...updates };
      save(next);
      return next;
    });
  }, []);
 
  const resetProfile = useCallback(() => {
    const fresh = { ...DEFAULTS };
    save(fresh);
    setProfileState(fresh);
  }, []);
 
  return { profile, updateProfile, resetProfile };
}