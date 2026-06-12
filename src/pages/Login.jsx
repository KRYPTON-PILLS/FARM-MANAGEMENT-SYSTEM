import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, resetPassword, firebaseAvailable } = useAuth();
  const navigate = useNavigate();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [resetSent,setResetSent]= useState(false);
  const [showReset,setShowReset]= useState(false);
  const [resetEmail,setResetEmail]=useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firebaseAvailable) return;
    setError(""); setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!firebaseAvailable) return;
    setError(""); setLoading(true);
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
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
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-gray-500 text-sm mb-6">Sign in to access your farm dashboard</p>

            {/* Firebase not configured warning */}
            {!firebaseAvailable && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-5 flex gap-3">
                <span className="text-amber-500 text-lg shrink-0">⚠️</span>
                <div>
                  <p className="text-amber-800 font-semibold text-sm">Firebase not configured</p>
                  <p className="text-amber-700 text-xs mt-0.5">Copy <code className="bg-amber-100 px-1 rounded">.env.example</code> to <code className="bg-amber-100 px-1 rounded">.env</code> and add your Firebase credentials to enable login.</p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-700 text-sm flex items-center gap-2">
                <span>❌</span>{error}
              </div>
            )}

            {!showReset ? (
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase">Password</label>
                    <button type="button" onClick={()=>setShowReset(true)} className="text-xs text-green-600 hover:text-green-700 font-semibold">Forgot password?</button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e)=>setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={!firebaseAvailable}
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 transition disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !firebaseAvailable}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition mt-2 flex items-center justify-center gap-2">
                  {loading ? <><Spinner/>Signing in...</> : "Sign in"}
                </button>
              </form>
            ) : (
              /* ── RESET PASSWORD ── */
              <form onSubmit={handleReset} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-blue-700 text-sm">
                  Enter your email and we'll send a password reset link.
                </div>
                {resetSent
                  ? <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm text-center">✅ Reset email sent! Check your inbox.</div>
                  : <>
                      <input type="email" value={resetEmail} onChange={(e)=>setResetEmail(e.target.value)} placeholder="you@example.com" required className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 transition"/>
                      <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
                        {loading?<><Spinner/>Sending...</>:"Send Reset Link"}
                      </button>
                    </>}
                <button type="button" onClick={()=>{setShowReset(false);setResetSent(false);setError("");}} className="w-full text-gray-500 hover:text-gray-700 text-sm font-semibold py-2 transition">← Back to sign in</button>
              </form>
            )}

            <div className="mt-6 pt-5 border-t border-gray-100 text-center text-sm text-gray-500">
              Don't have an account?{" "}
              <Link to="/signup" className="text-green-600 hover:text-green-700 font-semibold">Create account</Link>
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
    "auth/user-not-found":       "No account found with that email address.",
    "auth/wrong-password":       "Incorrect password. Please try again.",
    "auth/invalid-email":        "Please enter a valid email address.",
    "auth/user-disabled":        "This account has been disabled.",
    "auth/too-many-requests":    "Too many failed attempts. Please wait a moment.",
    "auth/network-request-failed":"Network error. Check your connection.",
    "auth/invalid-credential":   "Invalid email or password.",
  };
  return map[code] || "Something went wrong. Please try again.";
}
