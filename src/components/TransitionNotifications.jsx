import { useContext } from "react";
import { FarmContext } from "../context/FarmContext";
import { useNavigate } from "react-router-dom";

const TYPE_LABELS = {
  "calf":      "Calf",
  "bull-calf": "Bull Calf",
  "heifer":    "Heifer",
  "bull":      "Bull",
  "cow":       "Cow",
};

const TYPE_ROUTES = {
  "bull-calf": "/animals/cattle/bull-calves",
  "heifer":    "/animals/cattle/heifers",
  "bull":      "/animals/cattle/bulls",
  "cow":       "/animals/cattle/cows",
};

const TYPE_COLORS = {
  "calf":      "bg-orange-500",
  "bull-calf": "bg-blue-500",
  "heifer":    "bg-purple-500",
  "bull":      "bg-green-700",
  "cow":       "bg-pink-600",
};

export default function TransitionNotifications() {
  const { pendingNotifications, dismissNotification } = useContext(FarmContext);
  const navigate = useNavigate();

  if (!pendingNotifications?.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
      {pendingNotifications.map((n, i) => {
        const toColor = TYPE_COLORS[n.to] || "bg-green-600";
        const toRoute = TYPE_ROUTES[n.to];
        return (
          <div
            key={`${n.id}-${i}`}
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fade"
          >
            {/* colour accent strip */}
            <div className={`h-1.5 w-full ${toColor}`} />

            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm">
                    🎉 {n.name} has been promoted!
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {TYPE_LABELS[n.from] || n.from}
                    {" → "}
                    <span className="font-semibold text-gray-700">
                      {TYPE_LABELS[n.to] || n.to}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 italic">{n.reason}</p>
                </div>
                <button
                  onClick={() => dismissNotification(i)}
                  className="text-gray-300 hover:text-gray-500 text-xl leading-none mt-0.5"
                >
                  &times;
                </button>
              </div>

              <div className="flex gap-2 mt-3">
                {toRoute && (
                  <button
                    onClick={() => { navigate(toRoute); dismissNotification(i); }}
                    className={`flex-1 text-xs font-semibold text-white py-1.5 rounded-lg ${toColor} hover:opacity-90 transition`}
                  >
                    View {TYPE_LABELS[n.to]}s →
                  </button>
                )}
                <button
                  onClick={() => dismissNotification(i)}
                  className="flex-1 text-xs font-semibold text-gray-500 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
