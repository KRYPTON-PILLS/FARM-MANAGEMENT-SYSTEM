import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import EmptyState from './EmptyState';

/**
 * @param {string} title
 * @param {Array<{label: string, a: number, b: number}>} data - from mergeSeries()
 * @param {string} labelA - e.g. "Revenue"
 * @param {string} labelB - e.g. "Expenses"
 * @param {string} [colorA]
 * @param {string} [colorB]
 */
export default function DualTrendChart({
  title,
  data = [],
  labelA = 'Series A',
  labelB = 'Series B',
  colorA = '#16a34a',
  colorB = '#d97706',
  valueFormatter = (v) => v,
}) {
  const hasData = data.length > 0 && data.some((d) => d.a > 0 || d.b > 0);

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h3 className="text-lg font-semibold mb-4 text-green-900">{title}</h3>

      {!hasData ? (
        <EmptyState title="No data for this period" description="Try widening the date range." />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colorA} stopOpacity={0.25} />
                <stop offset="100%" stopColor={colorA} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colorB} stopOpacity={0.2} />
                <stop offset="100%" stopColor={colorB} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={valueFormatter} width={56} />
            <Tooltip
              formatter={(value, name) => [valueFormatter(value), name === 'a' ? labelA : labelB]}
              contentStyle={{ backgroundColor: '#f9fafb', borderRadius: '8px', fontSize: 12 }}
            />
            <Legend
              formatter={(value) => (value === 'a' ? labelA : labelB)}
              wrapperStyle={{ fontSize: 12 }}
            />
            <Area type="monotone" dataKey="a" stroke={colorA} strokeWidth={2.5} fill="url(#gradA)" dot={{ r: 3 }} />
            <Area type="monotone" dataKey="b" stroke={colorB} strokeWidth={2.5} fill="url(#gradB)" dot={{ r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}