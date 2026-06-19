import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordStrength = (pw) => {
    if (!pw) return null;
    if (pw.length < 6) return { level: 1, label: "Too short", color: "bg-red-400" };
    if (pw.length < 8) return { level: 2, label: "Weak", color: "bg-orange-400" };
    const strong = /[A-Z]/.test(pw) && /[0-9]/.test(pw);
    if (pw.length >= 8 && strong)
      return { level: 4, label: "Strong", color: "bg-green-500" };
    return { level: 3, label: "Fair", color: "bg-yellow-400" };
  };

  const strength = passwordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirm) {
      return setError("Passwords do not match.");
    }

    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setError("");
    setLoading(true);

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
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">

        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Create account
          </h2>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-700 text-sm">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* EMAIL */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-green-400 focus:outline-none"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create password"
                required
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-green-400 focus:outline-none"
              />

              {/* Strength indicator */}
              {strength && (
                <p className="text-xs text-gray-500 mt-1">
                  Strength: <span className="font-semibold">{strength.label}</span>
                </p>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                Confirm Password
              </label>

              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm password"
                required
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-green-400 focus:outline-none"
              />

              {confirm && password && confirm !== password && (
                <p className="text-xs text-red-500 mt-1">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading || (confirm && password && confirm !== password)}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-green-600 font-semibold">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function friendlyError(code) {
  const map = {
    "auth/email-already-in-use": "Email already in use.",
    "auth/invalid-email": "Invalid email.",
    "auth/weak-password": "Weak password.",
  };
  return map[code] || "Something went wrong.";
}