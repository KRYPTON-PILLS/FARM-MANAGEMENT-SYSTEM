import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import EmptyState from './EmptyState';

const COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'];

/**
 * @param {string} title
 * @param {Array<{name: string, value: number}>} data - pre-sorted descending, will be capped to `limit`
 * @param {(v: number) => string} [valueFormatter]
 */
export default function RankingBar({ title, data = [], valueFormatter = (v) => v, limit = 5 }) {
  const top = data.slice(0, limit);
  const hasData = top.some((d) => d.value > 0);

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h3 className="text-lg font-semibold mb-4 text-green-900">{title}</h3>

      {!hasData ? (
        <EmptyState title="No data for this period" description="Try widening the date range." />
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(180, top.length * 44)}>
          <BarChart data={top} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={valueFormatter} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: '#14532d' }}
              axisLine={false}
              tickLine={false}
              width={110}
            />
            <Tooltip
              formatter={(value) => valueFormatter(value)}
              contentStyle={{ backgroundColor: '#f9fafb', borderRadius: '8px', fontSize: 12 }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
              {top.map((entry, i) => (
                <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}