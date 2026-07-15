import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import EmptyState from './EmptyState';

/**
 * @param {string} title
 * @param {Array<{label, value, forecastValue}>} data - from forecastSeries()
 * @param {(v:number)=>string} [valueFormatter]
 * @param {string} [color]
 */
export default function ForecastChart({ title, data = [], valueFormatter = (v) => v, color = '#16a34a' }) {
  const hasData = data.length > 0 && data.some((d) => d.value != null);

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-green-900">{title}</h3>
        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Projected</span>
      </div>

      {!hasData ? (
        <EmptyState title="Not enough history yet" description="Forecasting needs at least a couple of periods of data." />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={valueFormatter} width={56} />
            <Tooltip
              formatter={(value, name) => [valueFormatter(value), name === 'value' ? 'Actual' : 'Forecast']}
              contentStyle={{ backgroundColor: '#f9fafb', borderRadius: '8px', fontSize: 12 }}
            />
            <Legend formatter={(value) => (value === 'value' ? 'Actual' : 'Forecast')} wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={{ r: 4 }} connectNulls={false} />
            <Line
              type="monotone"
              dataKey="forecastValue"
              stroke={color}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={{ r: 3 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}