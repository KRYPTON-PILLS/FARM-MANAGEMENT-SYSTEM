import { createContext, useContext, useState, useEffect } from "react";
import { auth, firebaseAvailable } from "../firebaseConfig.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { migrateLocalProfileToFirestore } from "../utils/MigrateProfile.js";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!firebaseAvailable || !auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Silently migrate any leftover localStorage profile to Firestore.
        // Safe to call on every login — it's a no-op if already migrated.
        await migrateLocalProfileToFirestore(user.uid);
      }

      setLoading(false);
    });
    return unsub;
  }, []);

  const login         = (email, pw)  => signInWithEmailAndPassword(auth, email, pw);
  const signup        = (email, pw)  => createUserWithEmailAndPassword(auth, email, pw);
  const logout        = ()           => signOut(auth);
  const resetPassword = (email)      => sendPasswordResetEmail(auth, email);

  const value = {
    currentUser,
    loading,
    firebaseAvailable,
    login,
    signup,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
