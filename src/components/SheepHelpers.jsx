/**
 * Shared helpers for all sheep pages.
 * Import what you need: Modal, Field, BCSPicker, BCSBadge, FAMACHABadge, ActionCard
 */

/* ─── Modal ─── */
export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-green-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ─── Field wrapper ─── */
export const Field = ({ label, children }) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{label}</label>
    {children}
  </div>
);

/* ─── Body Condition Score (sheep standard 1-5, ideal = 3) ─── */
export const BCS_LABELS = {
  1: { label: "Very Thin",  color: "bg-red-600",    text: "Emaciated — urgent action needed" },
  2: { label: "Thin",       color: "bg-orange-500", text: "Below ideal — increase nutrition" },
  3: { label: "Moderate",   color: "bg-green-600",  text: "Ideal — maintain condition" },
  4: { label: "Fat",        color: "bg-amber-500",  text: "Above ideal — reduce feed" },
  5: { label: "Obese",      color: "bg-red-700",    text: "Too fat — restrict and monitor" },
};

export function BCSPicker({ value, onChange }) {
  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-1">
        {[1,2,3,4,5].map((n) => {
          const b = BCS_LABELS[n];
          return (
            <button key={n} type="button" onClick={() => onChange(n)}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border-2 transition
                ${value === n ? `${b.color} text-white border-transparent shadow-md` : "bg-gray-50 border-gray-200 hover:border-gray-400"}`}>
              <span className="text-lg font-bold">{n}</span>
              <span className="text-[8px] font-semibold uppercase leading-tight text-center px-0.5">{b.label}</span>
            </button>
          );
        })}
      </div>
      {value > 0 && <p className="text-xs text-gray-500 italic">{BCS_LABELS[value]?.text}</p>}
    </div>
  );
}

export function BCSBadge({ score }) {
  if (!score) return <span className="text-gray-300 text-xs">—</span>;
  const b = BCS_LABELS[score];
  return <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${b.color} text-white`}>BCS {score} · {b.label}</span>;
}

/* ─── FAMACHA eye score (1=good, 5=severely anaemic) ─── */
export const FAMACHA_LABELS = {
  1: { label: "Normal",    color: "bg-green-600",  desc: "Red — no treatment" },
  2: { label: "Acceptable",color: "bg-lime-500",   desc: "Red-Pink — monitor" },
  3: { label: "Borderline",color: "bg-yellow-500", desc: "Pink — treat if other signs" },
  4: { label: "Anaemic",   color: "bg-orange-600", desc: "Pink-White — treat now" },
  5: { label: "Severe",    color: "bg-red-700",    desc: "White — treat immediately" },
};

export function FAMACHAPicker({ value, onChange }) {
  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-1">
        {[1,2,3,4,5].map((n) => {
          const f = FAMACHA_LABELS[n];
          return (
            <button key={n} type="button" onClick={() => onChange(n)}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border-2 transition
                ${value === n ? `${f.color} text-white border-transparent shadow-md` : "bg-gray-50 border-gray-200 hover:border-gray-400"}`}>
              <span className="text-lg font-bold">{n}</span>
              <span className="text-[8px] font-semibold uppercase leading-tight text-center px-0.5">{f.label}</span>
            </button>
          );
        })}
      </div>
      {value > 0 && <p className="text-xs text-gray-500 italic">{FAMACHA_LABELS[value]?.desc}</p>}
    </div>
  );
}

export function FAMACHABadge({ score }) {
  if (!score) return <span className="text-gray-300 text-xs">—</span>;
  const f = FAMACHA_LABELS[score];
  return <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${f.color} text-white`}>FAMACHA {score} · {f.label}</span>;
}

/* ─── Reusable action card ─── */
const ACCENT_MAP = {
  green:  { bg:"bg-green-50",  icon:"#16a34a", count:"text-green-700",  add:"bg-green-600 hover:bg-green-700",   view:"bg-green-50 text-green-700 hover:bg-green-100" },
  amber:  { bg:"bg-amber-50",  icon:"#d97706", count:"text-amber-700",  add:"bg-amber-500 hover:bg-amber-600",   view:"bg-amber-50 text-amber-700 hover:bg-amber-100" },
  red:    { bg:"bg-red-50",    icon:"#dc2626", count:"text-red-700",    add:"bg-red-600 hover:bg-red-700",       view:"bg-red-50 text-red-700 hover:bg-red-100" },
  blue:   { bg:"bg-blue-50",   icon:"#2563eb", count:"text-blue-700",   add:"bg-blue-600 hover:bg-blue-700",     view:"bg-blue-50 text-blue-700 hover:bg-blue-100" },
  violet: { bg:"bg-violet-50", icon:"#7c3aed", count:"text-violet-700", add:"bg-violet-600 hover:bg-violet-700", view:"bg-violet-50 text-violet-700 hover:bg-violet-100" },
  rose:   { bg:"bg-rose-50",   icon:"#e11d48", count:"text-rose-700",   add:"bg-rose-600 hover:bg-rose-700",     view:"bg-rose-50 text-rose-700 hover:bg-rose-100" },
  teal:   { bg:"bg-teal-50",   icon:"#0d9488", count:"text-teal-700",   add:"bg-teal-600 hover:bg-teal-700",     view:"bg-teal-50 text-teal-700 hover:bg-teal-100" },
  sky:    { bg:"bg-sky-50",    icon:"#0284c7", count:"text-sky-700",    add:"bg-sky-600 hover:bg-sky-700",       view:"bg-sky-50 text-sky-700 hover:bg-sky-100" },
};

export function ActionCard({ title, count, accent = "green", latest, latestDate, onAdd, onView, iconPath }) {
  const a = ACCENT_MAP[accent] || ACCENT_MAP.green;
  return (
    <div className="bg-white rounded-2xl shadow p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase font-semibold leading-tight">{title}</p>
          <p className={`text-2xl font-bold mt-0.5 ${a.count}`}>{count}</p>
        </div>
        <div className={`${a.bg} rounded-xl p-2`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={a.icon} className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
          </svg>
        </div>
      </div>
      {latest && <p className="text-xs text-gray-500 truncate">{latestDate && <span className="text-gray-400">{latestDate} · </span>}{latest}</p>}
      <div className="flex gap-2 mt-auto">
        <button onClick={onAdd}  className={`flex-1 ${a.add} text-white text-xs py-2 rounded-lg transition`}>+ Add</button>
        <button onClick={onView} className={`flex-1 ${a.view} text-xs py-2 rounded-lg transition`}>View all</button>
      </div>
    </div>
  );
}

/* ─── Back button (top-left absolute) ─── */
export function BackButton({ onClick, color = "text-green-700" }) {
  return (
    <button onClick={onClick}
      className="bg-white shadow w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 ${color}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
    </button>
  );
}

/* ─── Scrollable data table ─── */
export function GrowthTable({ records, onDelete, accentHover = "hover:bg-green-50/40" }) {
  if (!records.length) return null;
  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500 uppercase">Growth Entries</p>
        <span className="text-xs text-gray-400">{records.length} records · scroll to see all</span>
      </div>
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="overflow-y-auto" style={{ maxHeight: "220px" }}>
            <table className="w-full text-sm min-w-[580px]">
              <thead>
                <tr className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                  {["Date","Weight (kg)","BCS","Est. Price (KES)","Notes",""].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...records].reverse().map((r, i) => (
                  <tr key={r.id} className={`${accentHover} transition ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                    <td className="px-4 py-2.5 text-xs text-gray-700 font-medium whitespace-nowrap">{r.date}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">{r.weight ? <span className="font-bold text-green-700">{parseFloat(r.weight).toLocaleString()} kg</span> : <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-2.5"><BCSBadge score={r.bcs} /></td>
                    <td className="px-4 py-2.5 whitespace-nowrap">{r.price ? <span className="font-bold text-amber-700">KES {parseFloat(r.price).toLocaleString()}</span> : <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 italic max-w-[160px]"><span className="block truncate" title={r.notes}>{r.notes || "—"}</span></td>
                    <td className="px-4 py-2.5"><button onClick={() => onDelete(r.id)} className="text-gray-300 hover:text-red-500 transition text-lg leading-none">&times;</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {records.length > 4 && <div className="h-5 bg-gradient-to-t from-gray-100 to-transparent pointer-events-none -mt-5 relative z-10" />}
      </div>
    </div>
  );
}
