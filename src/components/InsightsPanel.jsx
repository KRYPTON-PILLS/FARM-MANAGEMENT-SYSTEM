import { TrendingUp, AlertTriangle, Info } from 'lucide-react';

const TONE_STYLES = {
  positive: { Icon: TrendingUp, color: 'text-green-700', bg: 'bg-green-50' },
  warning: { Icon: AlertTriangle, color: 'text-amber-700', bg: 'bg-amber-50' },
  neutral: { Icon: Info, color: 'text-gray-500', bg: 'bg-gray-100' },
};

/**
 * @param {Array<{id: string, tone: 'positive'|'warning'|'neutral', text: string}>} insights
 * @param {string} [title]
 */
export default function InsightsPanel({ insights = [], title = 'Insights' }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h3 className="text-lg font-semibold mb-4 text-green-900">{title}</h3>
      <ul className="space-y-3">
        {insights.map((item) => {
          const style = TONE_STYLES[item.tone] || TONE_STYLES.neutral;
          const { Icon } = style;
          return (
            <li key={item.id} className="flex items-start gap-3">
              <span className={`mt-0.5 rounded-lg p-1.5 ${style.bg} ${style.color}`}>
                <Icon size={14} />
              </span>
              <p className="text-sm text-gray-700">{item.text}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}