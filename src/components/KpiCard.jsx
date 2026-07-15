import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const TREND_STYLES = {
  up: { color: 'text-emerald-600', bg: 'bg-emerald-50', Icon: ArrowUpRight },
  down: { color: 'text-rose-600', bg: 'bg-rose-50', Icon: ArrowDownRight },
  flat: { color: 'text-slate-500', bg: 'bg-slate-100', Icon: Minus },
};

/**
 * @param {string} label
 * @param {string|number} value - already formatted (e.g. "KES 240,000" or "1,204")
 * @param {{direction: 'up'|'down'|'flat', percent: number}} [trend] - from percentChange()
 * @param {boolean} [trendIsGood] - if false, 'up' renders as a warning color (e.g. mortality rate)
 * @param {React.ComponentType} [icon]
 * @param {string} [sparklineData] - reserved for future sparkline overlay
 */
export default function KpiCard({ label, value, trend, trendIsGood = true, icon: Icon, subtitle }) {
  const trendKey = trend?.direction || 'flat';
  const style =
    trendKey === 'flat'
      ? TREND_STYLES.flat
      : trendIsGood === (trendKey === 'up')
      ? TREND_STYLES.up
      : TREND_STYLES.down;
  const { Icon: TrendIcon } = style;

  return (
    <div className="bg-white p-6 rounded-xl shadow transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        {Icon && (
          <span className="rounded-lg bg-green-100 p-1.5 text-green-600">
            <Icon size={16} />
          </span>
        )}
      </div>

      <div className="mt-3 text-2xl font-semibold tracking-tight text-green-900">{value}</div>

      <div className="mt-2 flex items-center gap-2">
        {trend && (
          <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ${style.bg} ${style.color}`}>
            <TrendIcon size={12} />
            {trend.percent}%
          </span>
        )}
        {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
      </div>
    </div>
  );
}