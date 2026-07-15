/**
 * @param {string} label
 * @param {number} percent - 0 to 100
 * @param {string} [color]
 * @param {string} [subtitle]
 */
export default function ProgressRing({ label, percent, color = '#16a34a', subtitle }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="bg-white p-6 rounded-xl shadow flex flex-col items-center text-center">
      <h3 className="text-lg font-semibold mb-4 text-green-900 self-start">{label}</h3>
      <svg width="120" height="120" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="55" textAnchor="middle" fontSize="20" fontWeight="600" fill="#14532d">
          {clamped}%
        </text>
      </svg>
      {subtitle && <p className="mt-2 text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}