import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { login, authError, firebaseAvailable, devAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Farm Login</h1>
        <p className="text-sm text-slate-500 mb-6">Sign in to manage animals, crops, reports, and farm operations.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200"
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200"
              placeholder="Enter password"
              required
            />
          </label>

          {!firebaseAvailable && !devAuth && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
              Firebase not configured for login — add Firebase env values (see .env.example)
            </div>
          )}

          {devAuth && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
              Dev auth enabled — logging in will use a mock user (set `VITE_DEV_AUTH=false` to disable).
            </div>
          )}

          {(error || authError) && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
              {error || authError}
            </div>
          )}

          <button
            type="submit"
            disabled={!firebaseAvailable && !devAuth}
            className={`w-full rounded-2xl px-4 py-3 text-white font-semibold transition ${(firebaseAvailable || devAuth) ? 'bg-green-700 hover:bg-green-600' : 'bg-slate-300 cursor-not-allowed'}`}>
            Sign in
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Don’t have an account? <Link to="/signup" className="font-semibold text-green-700 hover:underline">Create one</Link>
        </div>
      </div>
    </div>
  );
}
