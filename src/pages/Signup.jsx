import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { signup, firebaseAvailable } = useAuth();
  const navigate = useNavigate();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const passwordStrength = (pw) => {
    if (!pw) return null;
    if (pw.length < 6)  return { level: 1, label: "Too short",  color: "bg-red-400"    };
    if (pw.length < 8)  return { level: 2, label: "Weak",       color: "bg-orange-400" };
    const strong = /[A-Z]/.test(pw) && /[0-9]/.test(pw);
    if (pw.length >= 8 && strong) return { level: 4, label: "Strong",  color: "bg-green-500" };
    return { level: 3, label: "Fair", color: "bg-yellow-400" };
  };
  const strength = passwordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firebaseAvailable) return;
    if (password !== confirm) return setError("Passwords do not match.");
    if (password.length < 6)  return setError("Password must be at least 6 characters.");
    setError(""); setLoading(true);
    try {
      await signup(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{backgroundImage:"radial-gradient(circle at 25px 25px,white 2px,transparent 0)",backgroundSize:"50px 50px"}}/>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
            <span className="text-4xl">🌿</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Farm System</h1>
          <p className="text-green-300 mt-1 text-sm">Manage your farm intelligently</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Top accent */}
          <div className="h-1.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400"/>

          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Create account</h2>
            <p className="text-gray-500 text-sm mb-6">Sign up for farm management access and secure your data with Firebase Authentication.</p>

            {/* Firebase not configured warning */}
            {!firebaseAvailable && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
                <p className="text-red-700 font-semibold text-sm mb-1">Firebase not configured for signup</p>
                <p className="text-red-600 text-xs">
                  Copy <code className="bg-red-100 px-1 rounded font-mono">.env.example</code> to{" "}
                  <code className="bg-red-100 px-1 rounded font-mono">.env</code> and fill in your Firebase project values.
                </p>
                <div className="mt-3 bg-gray-900 rounded-lg p-3 text-xs font-mono text-green-400 space-y-1">
                  <p className="text-gray-400"># .env</p>
                  <p>VITE_FIREBASE_API_KEY=your_key</p>
                  <p>VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com</p>
                  <p>VITE_FIREBASE_PROJECT_ID=your_project</p>
                </div>
                <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer"
                  className="inline-block mt-3 text-xs text-blue-600 hover:underline font-semibold">
                  → Open Firebase Console ↗
                </a>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-700 text-sm flex items-center gap-2">
                <span>❌</span>{error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e)=>setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={!firebaseAvailable}
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 transition disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e)=>setPassword(e.target.value)}
                  placeholder="Create password"
                  required
                  disabled={!firebaseAvailable}
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 transition disabled:bg-gray-50 disabled:text-gray-400"
                />
                {/* Strength bar */}
                {strength && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4].map((n)=>(
                        <div key={n} className={`h-1 flex-1 rounded-full transition-all ${n<=strength.level?strength.color:"bg-gray-200"}`}/>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">Strength: <span className="font-semibold text-gray-600">{strength.label}</span></p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e)=>setConfirm(e.target.value)}
                    placeholder="Confirm password"
                    required
                    disabled={!firebaseAvailable}
                    className={`w-full border-2 rounded-xl px-4 py-3 text-sm focus:outline-none transition disabled:bg-gray-50 disabled:text-gray-400 pr-10 ${
                      confirm&&password
                        ? confirm===password?"border-green-400":"border-red-300"
                        : "border-gray-100 focus:border-green-400"
                    }`}
                  />
                  {confirm&&password&&(
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                      {confirm===password?"✅":"❌"}
                    </span>
                  )}
                </div>
                {confirm&&password&&confirm!==password&&(
                  <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading||!firebaseAvailable||(confirm&&password&&confirm!==password)}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition mt-2 flex items-center justify-center gap-2">
                {loading?<><Spinner/>Creating account...</>:"Create account"}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold">Sign in</Link>
            </div>
          </div>
        </div>

        <p className="text-center text-green-400/60 text-xs mt-6">
          🌱 Secure farm data management
        </p>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

function friendlyError(code) {
  const map = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-email":        "Please enter a valid email address.",
    "auth/weak-password":        "Password must be at least 6 characters.",
    "auth/network-request-failed":"Network error. Check your connection.",
    "auth/operation-not-allowed":"Email/password accounts are not enabled in Firebase Console.",
  };
  return map[code] || "Something went wrong. Please try again.";
}
