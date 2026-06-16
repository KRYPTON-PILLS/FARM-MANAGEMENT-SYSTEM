import { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * AlertCard - Displays a single alert notification
 */
export function AlertCard({ alert, onDismiss, compact = false }) {
  const ALERT_ICONS = {
    "activity-due":         "📋",
    "activity-overdue":     "⚠️",
    "vaccination-due":      "💉",
    "vaccination-overdue":  "⚠️",
    "feed-low":             "🌾",
    "feed-critical":        "🚨",
    "mortality-high":       "⚠️",
    "production-drop":      "📉",
    "production-increase":  "📈",
    "expense-high":         "💰",
  };

  const getSeverityColor = (severity) => ({
    critical: "bg-red-100 border-red-300 border",
    high:     "bg-orange-100 border-orange-300 border",
    medium:   "bg-yellow-100 border-yellow-300 border",
    low:      "bg-blue-100 border-blue-300 border",
  }[severity] || "bg-blue-100 border-blue-300 border");

  const getSeverityTextColor = (severity) => ({
    critical: "text-red-900",
    high:     "text-orange-900",
    medium:   "text-yellow-900",
    low:      "text-blue-900",
  }[severity] || "text-blue-900");

  if (compact) {
    return (
      <div className={`p-3 rounded ${getSeverityColor(alert.severity)} flex items-center justify-between gap-2`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg shrink-0">{ALERT_ICONS[alert.type] || "ℹ️"}</span>
          <p className={`text-sm font-semibold truncate ${getSeverityTextColor(alert.severity)}`}>{alert.title}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs px-2 py-1 bg-white rounded hover:bg-gray-100 transition shrink-0"
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border-l-4 shadow-md ${getSeverityColor(alert.severity)}`}>
      <div className="flex gap-3">
        <span className="text-2xl shrink-0">{ALERT_ICONS[alert.type] || "ℹ️"}</span>
        <div className="flex-1 min-w-0">
          <h4 className={`font-bold ${getSeverityTextColor(alert.severity)}`}>{alert.title}</h4>
          <p className="text-sm text-gray-700 mt-1 leading-snug">{alert.description}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs px-3 py-1 bg-white rounded hover:bg-gray-100 transition whitespace-nowrap self-start shrink-0"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * ActivityPlannerModal — Modal for creating and managing activities.
 * On mobile it slides up from the bottom like a sheet.
 */
export function ActivityPlannerModal({ isOpen, onClose, onAddActivity }) {
  const [formData, setFormData] = useState({
    task:        "",
    description: "",
    dueDate:     new Date().toISOString().split("T")[0],
    priority:    "Medium",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.task.trim()) { alert("Please enter a task"); return; }
    onAddActivity(formData);
    setFormData({ task: "", description: "", dueDate: new Date().toISOString().split("T")[0], priority: "Medium" });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
      {/*
        Mobile:  full-width sheet that slides up from the bottom (rounded top corners)
        Desktop: centered modal with max-w-md
      */}
      <div className="bg-white w-full sm:max-w-md sm:rounded-lg rounded-t-2xl shadow-xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold">📋 Plan New Activity</h2>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-gray-700 leading-none" aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Task</label>
            <input
              type="text"
              required
              placeholder="e.g., Vaccinate Layers"
              value={formData.task}
              onChange={(e) => setFormData({ ...formData, task: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              placeholder="Add any details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-base"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              required
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-base"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>

          {/* Full-width stacked buttons on mobile, side by side on sm+ */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 active:scale-95 transition"
            >
              Create Activity
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 active:scale-95 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * NotificationCenter — Floating notification bell.
 * On mobile the panel opens upward and is full-width to avoid overflow.
 */
export function NotificationCenter({ alerts, activities, onDismiss }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const criticalAlerts     = alerts.filter((a) => a.severity === "critical");
  const highAlerts         = alerts.filter((a) => a.severity === "high");
  const mediumAlerts       = alerts.filter((a) => a.severity === "medium");
  const pendingActivities  = activities.filter((a) => !a.completed);
  const alertCount         = criticalAlerts.length + highAlerts.length + mediumAlerts.length;

  return (
    /*
      On mobile the bottom nav sits 64px above the bottom edge.
      We push the bell button up by that amount so it doesn't overlap.
      On desktop (md+) keep original bottom-6 right-6 position.
    */
    <div className="fixed bottom-[80px] right-4 md:bottom-6 md:right-6 z-40">

      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-12 h-12 sm:w-14 sm:h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 active:scale-95 transition flex items-center justify-center text-xl sm:text-2xl"
        aria-label="Toggle notifications"
      >
        🔔
        {alertCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
            {alertCount > 9 ? "9+" : alertCount}
          </span>
        )}
      </button>

      {/* Notification panel */}
      {isOpen && (
        <div
          /*
            Mobile:  fixed full-width panel anchored above the bell, constrained to viewport
            Desktop: absolute right-aligned panel (original w-80)
          */
          className="
            fixed left-2 right-2 bottom-[148px]
            sm:absolute sm:left-auto sm:bottom-20 sm:right-0 sm:w-80
            bg-white rounded-2xl shadow-2xl p-4 max-h-[60vh] overflow-y-auto
          "
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base sm:text-lg">Recent Notifications</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none" aria-label="Close">✕</button>
          </div>

          {/* Critical */}
          {criticalAlerts.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-red-600 mb-2">🚨 CRITICAL</p>
              <div className="space-y-2">
                {criticalAlerts.slice(0, 3).map((alert) => (
                  <AlertCard key={alert.id} alert={alert} onDismiss={() => onDismiss(alert.id)} compact />
                ))}
              </div>
            </div>
          )}

          {/* High */}
          {highAlerts.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-orange-600 mb-2">⚠️ HIGH PRIORITY</p>
              <div className="space-y-2">
                {highAlerts.slice(0, 2).map((alert) => (
                  <AlertCard key={alert.id} alert={alert} onDismiss={() => onDismiss(alert.id)} compact />
                ))}
              </div>
            </div>
          )}

          {/* Pending activities */}
          {pendingActivities.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-blue-600 mb-2">📋 ACTIVITIES</p>
              <div className="space-y-2">
                {pendingActivities.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    <p className="font-semibold">{activity.task}</p>
                    <p className="text-xs text-gray-600">Due: {activity.dueDate}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {alertCount === 0 && pendingActivities.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">All clear! No notifications.</p>
            </div>
          )}

          <button
            className="mt-4 w-full px-4 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 active:scale-95 transition text-sm"
            onClick={() => { setIsOpen(false); navigate("/assistant"); }}
          >
            View Full Assistant
          </button>
        </div>
      )}
    </div>
  );
}
