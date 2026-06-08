import { createContext, useContext, useEffect, useState } from "react";
import { auth, firebaseAvailable } from "../firebaseConfig.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  inMemoryPersistence,
  onAuthStateChanged,
} from "firebase/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const devAuth = import.meta.env.VITE_DEV_AUTH === "true" ;

  useEffect(() => {
    if (!firebaseAvailable) {
      // If firebase isn't available but devAuth is enabled, allow a mock flow.
      if (devAuth) {
        setUser(null);
        setLoading(false);
        return () => {};
      }
      // If not using dev auth, avoid hanging the UI.
      setUser(null);
      setLoading(false);
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signup = async (email, password) => {
    if (!firebaseAvailable && !devAuth) throw new Error("Firebase not configured for signup");
    setAuthError(null);
    try {
      if (!firebaseAvailable && devAuth) {
        // Mock signup for local development
        const mockUser = { email, uid: `dev-${Date.now()}` };
        setUser(mockUser);
        return mockUser;
      }
      await setPersistence(auth, inMemoryPersistence);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      setUser(result.user);
      return result.user;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  const login = async (email, password) => {
    if (!firebaseAvailable && !devAuth) throw new Error("Firebase not configured for login");
    setAuthError(null);
    try {
      if (!firebaseAvailable && devAuth) {
        // Mock login for local development
        const mockUser = { email, uid: `dev-${Date.now()}` };
        setUser(mockUser);
        return mockUser;
      }
      await setPersistence(auth, inMemoryPersistence);
      const result = await signInWithEmailAndPassword(auth, email, password);
      setUser(result.user);
      return result.user;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    if (!firebaseAvailable && devAuth) {
      setUser(null);
      return;
    }
    if (!firebaseAvailable) return;
    setAuthError(null);
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, authError, signup, login, logout, firebaseAvailable, devAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
