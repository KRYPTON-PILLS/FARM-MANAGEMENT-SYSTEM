import { Syringe, Wheat, ClipboardList, ChevronRight } from 'lucide-react';

const KIND_STYLES = {
  vaccination: { Icon: Syringe, color: 'text-rose-600', bg: 'bg-rose-50' },
  feed: { Icon: Wheat, color: 'text-amber-600', bg: 'bg-amber-50' },
  activity: { Icon: ClipboardList, color: 'text-sky-600', bg: 'bg-sky-50' },
};

/** @param {Array<{id, kind, label, dueDate?}>} items */
export default function AttentionFeed({ items = [], onItemClick }) {
  if (items.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="mb-1 text-sm font-semibold text-green-900">Needs your attention</h3>
        <p className="text-sm text-gray-400">Nothing overdue right now — the farm is on track.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-green-900">Needs your attention</h3>
        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600">{items.length}</span>
      </div>
      <ul className="divide-y divide-gray-100">
        {items.slice(0, 6).map((item) => {
          const style = KIND_STYLES[item.kind] || KIND_STYLES.activity;
          const { Icon } = style;
          return (
            <li key={item.id}>
              <button
                onClick={() => onItemClick?.(item)}
                className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-gray-50"
              >
                <span className={`rounded-lg p-1.5 ${style.bg} ${style.color}`}>
                  <Icon size={14} />
                </span>
                <span className="flex-1 text-sm text-green-900">{item.label}</span>
                <ChevronRight size={14} className="text-gray-300" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}