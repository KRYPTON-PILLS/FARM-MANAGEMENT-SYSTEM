import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { UseProfile } from "../hooks/UseProfile.js";

const FARM_TYPES  = ["Mixed","Livestock Only","Crops Only","Dairy","Poultry","Aquaculture"];
const SIZE_UNITS  = ["Acres","Hectares","Square Metres"];
const COUNTRIES   = ["Kenya","Uganda","Tanzania","Rwanda","Ethiopia","Nigeria","Ghana","South Africa","Zimbabwe","Other"];

/* ── small helpers ── */
function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        <span>{icon}</span>{title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div className="mb-4 last:mb-0">
      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", disabled = false, className = "" }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full border-2 ${
        disabled
          ? "border-transparent bg-transparent text-gray-700 cursor-default"
          : "border-gray-100 focus:border-green-400 bg-white"
      } rounded-xl px-4 py-2.5 text-sm outline-none transition ${className}`}
    />
  );
}

function Select({ value, onChange, options, disabled = false }) {
  if (disabled) {
    return (
      <div className="w-full px-4 py-2.5 text-sm text-gray-700">{value}</div>
    );
  }
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 transition bg-white"
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

/* ── read-only text display ── */
function ReadOnlyValue({ value, placeholder = "—" }) {
  return (
    <p className="px-4 py-2.5 text-sm text-gray-700 min-h-[42px]">
      {value || <span className="text-gray-400 italic">{placeholder}</span>}
    </p>
  );
}

export default function UserProfile() {
  const navigate = useNavigate();
  const { user, logout, resetPassword, firebaseAvailable } = useAuth();
  const { profile, updateProfile } = UseProfile();

  const [editing,      setEditing]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [resetSent,    setResetSent]    = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError,   setResetError]   = useState("");
  const [logoutConfirm,setLogoutConfirm]= useState(false);

  /* local edit state — starts from stored profile */
  const [form, setForm] = useState({ ...profile });
  const fileRef = useRef();

  const uf = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  /* ── photo upload ── */
  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm((prev) => ({ ...prev, photoURL: reader.result }));
    reader.readAsDataURL(file);
  };

  /* ── save ── */
  const handleSave = () => {
    setSaving(true);
    updateProfile(form);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setEditing(false);
    }, 400);
    setTimeout(() => setSaved(false), 3000);
  };

  /* ── cancel edit ── */
  const handleCancel = () => {
    setForm({ ...profile }); // revert changes
    setEditing(false);
  };

  /* ── change password ── */
  const handleResetPassword = async () => {
    if (!firebaseAvailable || !user?.email) return;
    setResetError(""); setResetLoading(true);
    try {
      await resetPassword(user.email);
      setResetSent(true);
    } catch (err) {
      setResetError(err.message || "Failed to send reset email.");
    } finally {
      setResetLoading(false);
    }
  };

  /* ── avatar initials ── */
  const initials = form.displayName
    ? form.displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "F";

  return (
    <div className="bg-green-50 min-h-full">

      {/* ── TOP BAR ── */}
      <div className="flex items-center gap-4 px-6 py-4 bg-white shadow-sm sticky top-0 z-20">
        <button
          onClick={() => navigate(-1)}
          className="bg-white shadow w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-green-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-green-900">My Profile</h2>

        <div className="ml-auto flex items-center gap-3">
          {saved && (
            <span className="text-green-600 text-sm font-semibold flex items-center gap-1 animate-pulse">
              ✅ Saved
            </span>
          )}

          {editing ? (
            <>
              <button
                onClick={handleCancel}
                className="border-2 border-gray-200 hover:border-gray-300 text-gray-600 font-semibold px-5 py-2 rounded-xl text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-xl text-sm transition"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-xl text-sm transition flex items-center gap-2"
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">

        {/* ── PROFILE HEADER CARD ── */}
        <div className="bg-white rounded-2xl shadow p-6 flex flex-wrap items-center gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-green-100 flex items-center justify-center shadow-md">
              {form.photoURL
                ? <img src={form.photoURL} alt="Profile" className="w-full h-full object-cover"/>
                : <span className="text-3xl font-bold text-green-700">{initials}</span>}
            </div>
            {editing && (
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center shadow hover:bg-green-700 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>
                </svg>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto}/>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900">
              {form.displayName || <span className="text-gray-400 font-normal italic">No name set</span>}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
            {form.farmName && (
              <p className="text-sm text-green-700 font-semibold mt-1">🌿 {form.farmName}</p>
            )}
            {(form.farmLocation || form.country) && (
              <p className="text-xs text-gray-400 mt-0.5">
                📍 {[form.farmLocation, form.country].filter(Boolean).join(", ")}
              </p>
            )}
          </div>

          {user?.metadata?.creationTime && (
            <div className="text-right shrink-0">
              <p className="text-xs text-gray-400 uppercase font-semibold">Member since</p>
              <p className="text-sm font-bold text-gray-700 mt-0.5">
                {new Date(user.metadata.creationTime).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>
          )}
        </div>

        {/* ── edit mode banner ── */}
        {editing && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2 text-green-700 text-sm font-semibold">
            ✏️ You're in edit mode — make your changes and click <span className="underline">Save Changes</span> when done.
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">

          {/* ── PERSONAL INFORMATION ── */}
          <Section title="Personal Information" icon="👤">
            <Field label="Full Name">
              {editing
                ? <Input value={form.displayName} onChange={uf("displayName")} placeholder="e.g. John Kamau"/>
                : <ReadOnlyValue value={form.displayName} placeholder="No name set"/>}
            </Field>
            <Field label="Email Address" hint="Managed by Firebase — cannot be changed here.">
              <ReadOnlyValue value={user?.email}/>
            </Field>
            <Field label="Phone Number">
              {editing
                ? <Input value={form.phone} onChange={uf("phone")} placeholder="e.g. +254 712 345678" type="tel"/>
                : <ReadOnlyValue value={form.phone} placeholder="Not set"/>}
            </Field>
            <Field label="Bio / About">
              {editing
                ? <textarea
                    value={form.bio ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                    placeholder="Tell us about yourself or your farming experience..."
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 transition resize-none h-20"
                  />
                : <ReadOnlyValue value={form.bio} placeholder="No bio added"/>}
            </Field>
          </Section>

          {/* ── FARM DETAILS ── */}
          <Section title="Farm Details" icon="🌾">
            <Field label="Farm Name">
              {editing
                ? <Input value={form.farmName} onChange={uf("farmName")} placeholder="e.g. Sunrise Farm"/>
                : <ReadOnlyValue value={form.farmName} placeholder="Not set"/>}
            </Field>
            <Field label="Farm Location">
              {editing
                ? <Input value={form.farmLocation} onChange={uf("farmLocation")} placeholder="e.g. Nakuru, Rift Valley"/>
                : <ReadOnlyValue value={form.farmLocation} placeholder="Not set"/>}
            </Field>
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Farm Size</label>
                {editing
                  ? <Input value={form.farmSize} onChange={uf("farmSize")} placeholder="e.g. 50" type="number"/>
                  : <ReadOnlyValue value={form.farmSize ? `${form.farmSize} ${form.farmSizeUnit || ""}` : null} placeholder="Not set"/>}
              </div>
              {editing && (
                <div className="w-32">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Unit</label>
                  <Select value={form.farmSizeUnit} onChange={uf("farmSizeUnit")} options={SIZE_UNITS}/>
                </div>
              )}
            </div>
            <Field label="Farm Type">
              {editing
                ? <Select value={form.farmType} onChange={uf("farmType")} options={FARM_TYPES}/>
                : <ReadOnlyValue value={form.farmType} placeholder="Not set"/>}
            </Field>
            <Field label="Country">
              {editing
                ? <Select value={form.country} onChange={uf("country")} options={COUNTRIES}/>
                : <ReadOnlyValue value={form.country} placeholder="Not set"/>}
            </Field>
          </Section>
        </div>

        {/* ── ACCOUNT & SECURITY ── */}
        <Section title="Account & Security" icon="🔐">
          <div className="grid md:grid-cols-2 gap-6">

            {/* Change password */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-bold text-gray-800 mb-1">Change Password</p>
              <p className="text-xs text-gray-500 mb-3">
                We'll send a password reset link to <strong>{user?.email}</strong>.
              </p>
              {resetSent
                ? <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-xs font-semibold">✅ Reset email sent! Check your inbox.</div>
                : <>
                    {resetError && <div className="bg-red-50 border border-red-200 rounded-xl p-2 text-red-600 text-xs mb-2">{resetError}</div>}
                    <button
                      onClick={handleResetPassword}
                      disabled={resetLoading || !firebaseAvailable}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-2 rounded-xl text-sm transition flex items-center justify-center gap-2"
                    >
                      {resetLoading
                        ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Sending…</>
                        : "Send Reset Email"}
                    </button>
                  </>}
            </div>

            {/* Sign out */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-bold text-gray-800 mb-1">Sign Out</p>
              <p className="text-xs text-gray-500 mb-3">
                You'll be redirected to the login page. Your farm data stays saved.
              </p>
              {!logoutConfirm
                ? <button
                    onClick={() => setLogoutConfirm(true)}
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2 rounded-xl text-sm transition"
                  >
                    Sign out
                  </button>
                : <div className="space-y-2">
                    <p className="text-xs text-gray-600 font-semibold text-center">Are you sure?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={logout}
                        className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2 rounded-xl text-sm transition"
                      >
                        Yes, sign out
                      </button>
                      <button
                        onClick={() => setLogoutConfirm(false)}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-xl text-sm transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>}
            </div>
          </div>
        </Section>

        {/* Account info */}
        <div className="bg-white rounded-2xl shadow p-5 flex flex-wrap gap-6 text-sm text-gray-500">
          <div><span className="font-semibold text-gray-700">User ID: </span><span className="font-mono text-xs">{user?.uid}</span></div>
          {user?.metadata?.creationTime && <div><span className="font-semibold text-gray-700">Account created: </span>{new Date(user.metadata.creationTime).toLocaleDateString()}</div>}
          {user?.metadata?.lastSignInTime && <div><span className="font-semibold text-gray-700">Last sign in: </span>{new Date(user.metadata.lastSignInTime).toLocaleDateString()}</div>}
        </div>

      </div>
    </div>
  );
}
