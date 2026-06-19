import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebaseConfig.js";
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
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);

      if (user) {
        migrateLocalProfileToFirestore(user.uid).catch(console.error);
      }
    });

    return unsub; // ✅ properly closes useEffect — no stray });
  }, []);         // ✅ this closes useEffect correctly

  const login         = (email, pw) => signInWithEmailAndPassword(auth, email, pw);
  const signup        = (email, pw) => createUserWithEmailAndPassword(auth, email, pw);
  const logout        = ()          => signOut(auth);
  const resetPassword = (email)     => sendPasswordResetEmail(auth, email);

  const value = {
    currentUser,
    user: currentUser,
    loading,
    firebaseAvailable: !!auth,
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
