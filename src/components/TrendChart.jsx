import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

/**
 * @param {Array<{label: string, value: number, comparisonValue?: number}>} data
 * @param {string} title
 * @param {string} [valueFormatter] - function(value) => string
 * @param {string} [color] - primary series color
 */
export default function TrendChart({ data, title, valueFormatter = (v) => v, color = '#16a34a', showComparison = false }) {
  const hasData = data && data.length > 0 && data.some((d) => d.value > 0);

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h3 className="text-lg font-semibold mb-4 text-green-900">{title}</h3>

      {!hasData ? (
        <div className="flex h-56 flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm text-gray-400">No data for this period yet</p>
          <p className="text-xs text-gray-300">Try widening the date range or check back after recording activity</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={valueFormatter} width={56} />
            <Tooltip
              formatter={(value, name) => [valueFormatter(value), name === 'value' ? 'Current period' : 'Previous period']}
              contentStyle={{ backgroundColor: '#f9fafb', borderRadius: '8px', fontSize: 12 }}
            />
            {showComparison && <Legend wrapperStyle={{ fontSize: 11 }} />}
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              fill={`url(#grad-${title.replace(/\s+/g, '')})`}
              name="Current period"
            />
            {showComparison && (
              <Area type="monotone" dataKey="comparisonValue" stroke="#d1d5db" strokeWidth={1.5} strokeDasharray="4 3" fill="none" name="Previous period" />
            )}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}