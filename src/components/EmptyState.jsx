import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'Nothing here yet', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
      <span className="mb-3 rounded-full bg-white p-3 text-gray-300 shadow-sm">
        <Inbox size={20} />
      </span>
      <h3 className="text-sm font-semibold text-green-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}