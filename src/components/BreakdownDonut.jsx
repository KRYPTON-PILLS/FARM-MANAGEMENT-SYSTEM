import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { capSlices } from '../utils/aggregations';
import EmptyState from './EmptyState';

const COLORS = ['#16a34a', '#65a30d', '#d97706', '#0891b2', '#7c3aed', '#9ca3af'];

/**
 * @param {string} title
 * @param {Array<{name: string, value: number}>} data - from groupByCategory()
 * @param {(v: number) => string} [valueFormatter]
 */
export default function BreakdownDonut({ title, data = [], valueFormatter = (v) => v, maxSlices = 5 }) {
  const sliced = capSlices(data, maxSlices);
  const hasData = sliced.some((d) => d.value > 0);

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h3 className="text-lg font-semibold mb-4 text-green-900">{title}</h3>

      {!hasData ? (
        <EmptyState title="No data for this period" description="Try widening the date range." />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={sliced}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              stroke="none"
            >
              {sliced.map((entry, i) => (
                <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [valueFormatter(value), name]}
              contentStyle={{ backgroundColor: '#f9fafb', borderRadius: '8px', fontSize: 12 }}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ fontSize: 12, lineHeight: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}