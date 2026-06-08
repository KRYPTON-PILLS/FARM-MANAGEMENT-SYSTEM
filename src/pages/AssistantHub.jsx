import { useContext, useState } from "react";
import { FarmContext } from "../context/FarmContext";
import { ALERT_ICONS, ALERT_SEVERITY, formatAlertTime } from "../utils/farmAssistant.js";

export default function AssistantHub() {
  const {
    alerts,
    activities,
    dismissAlert,
    dismissedAlerts,
    undismissAlert,
    completeActivity,
    deleteActivity,
  } = useContext(FarmContext);

  const [activeTab, setActiveTab] = useState("alerts");
  const [showDismissed, setShowDismissed] = useState(false);

  // Filter alerts
  const activeAlerts = alerts.filter((a) => !dismissedAlerts.includes(a.id));
  const dismissedAlertsList = alerts.filter((a) => dismissedAlerts.includes(a.id));

  // Group alerts by severity
  const alertsBySeverity = {
    critical: activeAlerts.filter((a) => a.severity === ALERT_SEVERITY.CRITICAL),
    high: activeAlerts.filter((a) => a.severity === ALERT_SEVERITY.HIGH),
    medium: activeAlerts.filter((a) => a.severity === ALERT_SEVERITY.MEDIUM),
    low: activeAlerts.filter((a) => a.severity === ALERT_SEVERITY.LOW),
  };

  // Filter activities
  const pendingActivities = activities.filter((a) => !a.completed);
  const completedActivities = activities.filter((a) => a.completed);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case ALERT_SEVERITY.CRITICAL:
        return "bg-red-100 border-red-300";
      case ALERT_SEVERITY.HIGH:
        return "bg-orange-100 border-orange-300";
      case ALERT_SEVERITY.MEDIUM:
        return "bg-yellow-100 border-yellow-300";
      default:
        return "bg-blue-100 border-blue-300";
    }
  };

  const getSeverityBadgeColor = (severity) => {
    switch (severity) {
      case ALERT_SEVERITY.CRITICAL:
        return "bg-red-500";
      case ALERT_SEVERITY.HIGH:
        return "bg-orange-500";
      case ALERT_SEVERITY.MEDIUM:
        return "bg-yellow-500";
      default:
        return "bg-blue-500";
    }
  };

  const renderAlertsList = (alertsList) => {
    if (alertsList.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">No alerts</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {alertsList.map((alert) => (
          <div
            key={alert.id}
            className={`border-l-4 p-4 rounded shadow-sm ${getSeverityColor(alert.severity)}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{ALERT_ICONS[alert.type] || "ℹ️"}</span>
                  <h4 className="font-semibold text-gray-800">{alert.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded text-white ${getSeverityBadgeColor(alert.severity)}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{alert.description}</p>
                <p className="text-xs text-gray-500 mt-2">{formatAlertTime(alert.createdAt)}</p>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 transition whitespace-nowrap"
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderActivitiesList = (activitiesList) => {
    if (activitiesList.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">No {activitiesList === completedActivities ? "completed" : "pending"} activities</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {activitiesList.map((activity) => {
          const isCompleted = activity.completed;
          const today = new Date().toISOString().split("T")[0];
          const isOverdue = !isCompleted && activity.dueDate < today;

          return (
            <div
              key={activity.id}
              className={`border-l-4 p-4 rounded shadow-sm ${
                isCompleted
                  ? "bg-green-50 border-green-300"
                  : isOverdue
                    ? "bg-red-50 border-red-300"
                    : "bg-blue-50 border-blue-300"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">
                      {isCompleted ? "✅" : isOverdue ? "⚠️" : "📋"}
                    </span>
                    <h4 className={`font-semibold ${isCompleted ? "line-through text-gray-500" : "text-gray-800"}`}>
                      {activity.task}
                    </h4>
                  </div>
                  {activity.description && (
                    <p className="text-sm text-gray-700 ml-7">{activity.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 ml-7 text-xs text-gray-600">
                    <span>
                      📅 Due: <strong>{activity.dueDate}</strong>
                    </span>
                    {activity.priority && (
                      <span className={`px-2 py-1 rounded ${
                        activity.priority === "High"
                          ? "bg-red-200 text-red-800"
                          : activity.priority === "Medium"
                            ? "bg-yellow-200 text-yellow-800"
                            : "bg-green-200 text-green-800"
                      }`}>
                        {activity.priority} Priority
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!isCompleted && (
                    <button
                      onClick={() => completeActivity(activity.id)}
                      className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition whitespace-nowrap"
                    >
                      Complete
                    </button>
                  )}
                  <button
                    onClick={() => deleteActivity(activity.id)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition whitespace-nowrap"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🤖 Farm Assistant</h1>
          <p className="text-gray-600">
            Your intelligent farming companion. Monitoring activities, health, production, and more.
          </p>
        </div>

        {/* Alert Summary */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{alertsBySeverity.critical.length}</div>
            <div className="text-sm text-gray-700">Critical Alerts</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">{alertsBySeverity.high.length}</div>
            <div className="text-sm text-gray-700">High Priority</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">{alertsBySeverity.medium.length}</div>
            <div className="text-sm text-gray-700">Medium Priority</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{pendingActivities.length}</div>
            <div className="text-sm text-gray-700">Pending Activities</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("alerts")}
            className={`px-4 py-3 font-semibold border-b-2 transition ${
              activeTab === "alerts"
                ? "border-green-600 text-green-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Alerts ({activeAlerts.length})
          </button>
          <button
            onClick={() => setActiveTab("activities")}
            className={`px-4 py-3 font-semibold border-b-2 transition ${
              activeTab === "activities"
                ? "border-green-600 text-green-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Activities ({pendingActivities.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === "alerts" && (
          <div className="bg-white rounded-lg shadow p-6">
            {/* Critical Alerts */}
            {alertsBySeverity.critical.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
                  <span>🚨</span> CRITICAL ALERTS
                </h3>
                {renderAlertsList(alertsBySeverity.critical)}
              </div>
            )}

            {/* High Priority Alerts */}
            {alertsBySeverity.high.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-orange-600 mb-4 flex items-center gap-2">
                  <span>⚠️</span> High Priority
                </h3>
                {renderAlertsList(alertsBySeverity.high)}
              </div>
            )}

            {/* Medium Priority Alerts */}
            {alertsBySeverity.medium.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-yellow-600 mb-4">Medium Priority</h3>
                {renderAlertsList(alertsBySeverity.medium)}
              </div>
            )}

            {/* Low Priority Alerts */}
            {alertsBySeverity.low.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-blue-600 mb-4">Low Priority</h3>
                {renderAlertsList(alertsBySeverity.low)}
              </div>
            )}

            {/* No Alerts */}
            {activeAlerts.length === 0 && (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">✨</div>
                <p className="text-xl text-gray-600">All clear! No active alerts.</p>
              </div>
            )}

            {/* Dismissed Alerts */}
            {dismissedAlertsList.length > 0 && (
              <div className="mt-8 border-t pt-6">
                <button
                  onClick={() => setShowDismissed(!showDismissed)}
                  className="text-sm text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-2"
                >
                  <span>{showDismissed ? "▼" : "▶"}</span>
                  Dismissed Alerts ({dismissedAlertsList.length})
                </button>
                {showDismissed && (
                  <div className="mt-4 space-y-3 opacity-60">
                    {dismissedAlertsList.map((alert) => (
                      <div
                        key={alert.id}
                        className="border-l-4 border-gray-300 p-4 rounded bg-gray-50 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm text-gray-600 line-through">{alert.title}</p>
                        </div>
                        <button
                          onClick={() => undismissAlert(alert.id)}
                          className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
                        >
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "activities" && (
          <div className="space-y-8">
            {/* Pending Activities */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Pending Activities</h3>
              {renderActivitiesList(pendingActivities)}
            </div>

            {/* Completed Activities */}
            {completedActivities.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">✅ Completed Activities</h3>
                {renderActivitiesList(completedActivities)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
