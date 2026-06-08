import { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * AlertCard - Displays a single alert notification
 * Used in both the AssistantHub and as floating notifications
 */
export function AlertCard({ alert, onDismiss, compact = false }) {
  const ALERT_ICONS = {
    "activity-due": "📋",
    "activity-overdue": "⚠️",
    "vaccination-due": "💉",
    "vaccination-overdue": "⚠️",
    "feed-low": "🌾",
    "feed-critical": "🚨",
    "mortality-high": "⚠️",
    "production-drop": "📉",
    "production-increase": "📈",
    "expense-high": "💰",
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: "bg-red-100 border-red-300 border",
      high: "bg-orange-100 border-orange-300 border",
      medium: "bg-yellow-100 border-yellow-300 border",
      low: "bg-blue-100 border-blue-300 border",
    };
    return colors[severity] || colors.low;
  };

  const getSeverityTextColor = (severity) => {
    const colors = {
      critical: "text-red-900",
      high: "text-orange-900",
      medium: "text-yellow-900",
      low: "text-blue-900",
    };
    return colors[severity] || colors.low;
  };

  if (compact) {
    return (
      <div className={`p-3 rounded ${getSeverityColor(alert.severity)} flex items-center justify-between gap-2`}>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-lg">{ALERT_ICONS[alert.type] || "ℹ️"}</span>
          <p className={`text-sm font-semibold ${getSeverityTextColor(alert.severity)}`}>{alert.title}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs px-2 py-1 bg-white rounded hover:bg-gray-100 transition"
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
        <span className="text-2xl">{ALERT_ICONS[alert.type] || "ℹ️"}</span>
        <div className="flex-1">
          <h4 className={`font-bold ${getSeverityTextColor(alert.severity)}`}>{alert.title}</h4>
          <p className="text-sm text-gray-700 mt-1">{alert.description}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs px-3 py-1 bg-white rounded hover:bg-gray-100 transition whitespace-nowrap"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * ActivityPlannerModal - Modal for creating and managing activities
 */
export function ActivityPlannerModal({ isOpen, onClose, onAddActivity }) {
  const [formData, setFormData] = useState({
    task: "",
    description: "",
    dueDate: new Date().toISOString().split("T")[0],
    priority: "Medium",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.task.trim()) {
      alert("Please enter a task");
      return;
    }
    onAddActivity(formData);
    setFormData({
      task: "",
      description: "",
      dueDate: new Date().toISOString().split("T")[0],
      priority: "Medium",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">📋 Plan New Activity</h2>
          <button
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Task
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Vaccinate Layers"
              value={formData.task}
              onChange={(e) =>
                setFormData({ ...formData, task: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              placeholder="Add any details..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              required
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
            >
              Create Activity
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition"
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
 * NotificationCenter - Compact floating notification panel
 * Shows recent alerts and quick actions
 */
export function NotificationCenter({ alerts, activities, onDismiss }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  const mediumAlerts = alerts.filter((a) => a.severity === "medium");

  const pendingActivities = activities.filter((a) => !a.completed);

  const alertCount = criticalAlerts.length + highAlerts.length + mediumAlerts.length;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition flex items-center justify-center text-2xl"
      >
        🔔
        {alertCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {alertCount > 9 ? "9+" : alertCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 bg-white rounded-lg shadow-2xl p-4 w-80 max-h-96 overflow-y-auto">
          <h3 className="font-bold text-lg mb-4">Recent Notifications</h3>

          {/* Critical Alerts */}
          {criticalAlerts.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-red-600 mb-2">🚨 CRITICAL</p>
              <div className="space-y-2">
                {criticalAlerts.slice(0, 3).map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onDismiss={() => onDismiss(alert.id)}
                    compact
                  />
                ))}
              </div>
            </div>
          )}

          {/* High Priority Alerts */}
          {highAlerts.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-orange-600 mb-2">⚠️ HIGH PRIORITY</p>
              <div className="space-y-2">
                {highAlerts.slice(0, 2).map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onDismiss={() => onDismiss(alert.id)}
                    compact
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pending Activities */}
          {pendingActivities.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-blue-600 mb-2">📋 ACTIVITIES</p>
              <div className="space-y-2">
                {pendingActivities.slice(0, 3).map((activity) => (
                  <div
                    key={activity.id}
                    className="p-2 bg-blue-50 border border-blue-200 rounded text-sm"
                  >
                    <p className="font-semibold">{activity.task}</p>
                    <p className="text-xs text-gray-600">Due: {activity.dueDate}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {alertCount === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">All clear! No notifications.</p>
            </div>
          )}

          <button
            className="mt-4 w-full px-4 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition text-sm"
            onClick={() => {
              setIsOpen(false);
              navigate("/assistant");
            }}
          >
            View Full Assistant
          </button>
        </div>
      )}
    </div>
  );
}
