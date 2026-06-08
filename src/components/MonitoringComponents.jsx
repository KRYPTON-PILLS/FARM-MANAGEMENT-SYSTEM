import { useContext, useState } from "react";
import { FarmContext } from "../context/FarmContext";
import { estimateFeedRunout } from "../utils/farmAssistant.js";

/**
 * FeedMonitor - Tracks feed inventory and consumption patterns
 */
export function FeedMonitor() {
  const { feedInventory, setFeedInventory } = useContext(FarmContext);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    currentStock: "",
    averageDailyUsage: "",
  });

  const handleAddFeed = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.currentStock || !formData.averageDailyUsage) {
      alert("Please fill all fields");
      return;
    }

    const newFeed = {
      id: Date.now().toString(),
      name: formData.name,
      currentStock: parseFloat(formData.currentStock),
      averageDailyUsage: parseFloat(formData.averageDailyUsage),
      createdAt: new Date().toISOString().split("T")[0],
    };

    setFeedInventory((prev) => [newFeed, ...prev]);
    setFormData({ name: "", currentStock: "", averageDailyUsage: "" });
    setShowAddForm(false);
  };

  const handleUpdateFeed = (id, currentStock) => {
    setFeedInventory((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, currentStock: parseFloat(currentStock) } : f
      )
    );
  };

  const handleDeleteFeed = (id) => {
    setFeedInventory((prev) => prev.filter((f) => f.id !== id));
  };

  const getStockStatus = (daysRemaining) => {
    if (!daysRemaining) return { color: "bg-gray-200", label: "Unknown", severity: "gray" };
    if (daysRemaining < 3) return { color: "bg-red-200", label: "CRITICAL", severity: "critical" };
    if (daysRemaining < 7) return { color: "bg-yellow-200", label: "LOW", severity: "warning" };
    return { color: "bg-green-200", label: "OK", severity: "ok" };
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          🌾 Feed Inventory Monitor
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          {showAddForm ? "Cancel" : "+ Add Feed"}
        </button>
      </div>

      {/* Add Feed Form */}
      {showAddForm && (
        <form onSubmit={handleAddFeed} className="bg-gray-50 p-4 rounded mb-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Feed Type</label>
              <input
                type="text"
                required
                placeholder="e.g., Layers Mash"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Current Stock (kg)</label>
              <input
                type="number"
                required
                step="0.1"
                placeholder="100"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Daily Usage (kg/day)</label>
              <input
                type="number"
                required
                step="0.1"
                placeholder="15"
                value={formData.averageDailyUsage}
                onChange={(e) => setFormData({ ...formData, averageDailyUsage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition"
          >
            Add Feed Item
          </button>
        </form>
      )}

      {/* Feed List */}
      {feedInventory.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No feed items tracked yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {feedInventory.map((feed) => {
            const daysRemaining = estimateFeedRunout(feed.currentStock, feed.averageDailyUsage);
            const status = getStockStatus(daysRemaining);

            return (
              <div key={feed.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{feed.name}</h3>
                    <p className="text-sm text-gray-600">
                      Added: {feed.createdAt}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm font-bold text-gray-800 ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 bg-gray-50 p-3 rounded">
                  <div>
                    <p className="text-xs text-gray-600">Current Stock</p>
                    <p className="text-lg font-bold text-gray-900">{feed.currentStock}kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Daily Usage</p>
                    <p className="text-lg font-bold text-gray-900">{feed.averageDailyUsage}kg/day</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Days Remaining</p>
                    <p className={`text-lg font-bold ${
                      daysRemaining < 3 ? "text-red-600" : daysRemaining < 7 ? "text-yellow-600" : "text-green-600"
                    }`}>
                      {daysRemaining ? `${daysRemaining} days` : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        daysRemaining && daysRemaining < 3
                          ? "bg-red-500"
                          : daysRemaining && daysRemaining < 7
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min((feed.currentStock / (feed.averageDailyUsage * 30)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Stock Update */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Update Stock (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder={feed.currentStock}
                      onChange={(e) => {
                        if (e.target.value) {
                          handleUpdateFeed(feed.id, e.target.value);
                          e.target.value = "";
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                  </div>
                  <button
                    onClick={() => handleDeleteFeed(feed.id)}
                    className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * ProductionMonitor - Tracks production metrics and trends
 */
export function ProductionMonitor() {
  const { productionHistory, addProductionRecord } = useContext(FarmContext);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    productType: "Eggs",
    quantity: "",
  });

  const handleAddRecord = (e) => {
    e.preventDefault();
    if (!formData.productType || !formData.quantity) {
      alert("Please fill all fields");
      return;
    }

    addProductionRecord({
      productType: formData.productType,
      quantity: parseFloat(formData.quantity),
    });

    setFormData({ productType: "Eggs", quantity: "" });
    setShowAddForm(false);
  };

  // Group by product type and period
  const thisWeekData = productionHistory.filter((p) => {
    const pDate = new Date(p.date).getTime();
    const weekAgo = Date.now() - 7 * 86400000;
    return pDate > weekAgo;
  });

  const lastWeekData = productionHistory.filter((p) => {
    const pDate = new Date(p.date).getTime();
    const twoWeeksAgo = Date.now() - 14 * 86400000;
    const weekAgo = Date.now() - 7 * 86400000;
    return pDate > twoWeeksAgo && pDate < weekAgo;
  });

  const productTypes = [...new Set(productionHistory.map((p) => p.productType))];

  const getProductionStats = (type) => {
    const thisWeekTotal = thisWeekData
      .filter((p) => p.productType === type)
      .reduce((sum, p) => sum + p.quantity, 0);

    const lastWeekTotal = lastWeekData
      .filter((p) => p.productType === type)
      .reduce((sum, p) => sum + p.quantity, 0);

    const percentChange = lastWeekTotal > 0 ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0;

    return {
      thisWeek: thisWeekTotal,
      lastWeek: lastWeekTotal,
      percentChange,
      trend: percentChange > 0 ? "up" : "down",
    };
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          📊 Production Monitor
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          {showAddForm ? "Cancel" : "+ Record Production"}
        </button>
      </div>

      {/* Add Record Form */}
      {showAddForm && (
        <form onSubmit={handleAddRecord} className="bg-gray-50 p-4 rounded mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Product Type</label>
              <select
                required
                value={formData.productType}
                onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                <option>Eggs</option>
                <option>Milk</option>
                <option>Meat</option>
                <option>Wool</option>
                <option>Crops</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                required
                step="0.1"
                placeholder="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition"
          >
            Record Production
          </button>
        </form>
      )}

      {/* Production Stats */}
      {productTypes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No production records yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {productTypes.map((type) => {
            const stats = getProductionStats(type);
            const icons = {
              "Eggs": "🥚",
              "Milk": "🥛",
              "Meat": "🥩",
              "Wool": "🧶",
              "Crops": "🌾",
            };

            return (
              <div key={type} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    <span className="text-2xl">{icons[type] || "📦"}</span>
                    {type}
                  </h3>
                  <div
                    className={`px-3 py-1 rounded text-sm font-bold flex items-center gap-1 ${
                      stats.percentChange > 0
                        ? "bg-green-100 text-green-800"
                        : stats.percentChange < 0
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <span>{stats.percentChange > 0 ? "📈" : "📉"}</span>
                    {Math.abs(stats.percentChange).toFixed(1)}%
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 bg-gray-50 p-3 rounded">
                  <div>
                    <p className="text-xs text-gray-600">Last Week</p>
                    <p className="text-lg font-bold text-gray-900">{stats.lastWeek}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">This Week</p>
                    <p className="text-lg font-bold text-gray-900">{stats.thisWeek}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Change</p>
                    <p
                      className={`text-lg font-bold ${
                        stats.percentChange > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {stats.percentChange.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Records */}
      {productionHistory.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-semibold text-gray-900 mb-3">Recent Records</h4>
          <div className="space-y-2">
            {productionHistory.slice(0, 10).map((record) => (
              <div key={record.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-700">
                  {record.productType}: <strong>{record.quantity}</strong>
                </span>
                <span className="text-xs text-gray-500">{record.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * HealthMonitor - Tracks vaccinations and medical records
 */
export function HealthMonitor() {
  const { animals } = useContext(FarmContext);

  // Extract vaccination schedules from animals
  const getVaccinationSchedules = () => {
    const schedules = [];

    animals.forEach((animal) => {
      if (!animal.medicalLog || animal.medicalLog.length === 0) return;

      animal.medicalLog.forEach((record) => {
        if (record.type?.toLowerCase().includes("vaccin")) {
          schedules.push({
            id: `${animal.id}-${record.id}`,
            animalName: animal.name,
            animalType: animal.type,
            vaccineName: record.name,
            lastGiven: record.date,
            frequency: record.frequency || 3,
          });
        }
      });
    });

    return schedules;
  };

  const schedules = getVaccinationSchedules();

  const getVaccinationStatus = (lastGiven, frequency) => {
    if (!lastGiven) return { status: "Never", color: "bg-gray-200", textColor: "text-gray-800" };

    const last = new Date(lastGiven);
    const nextDue = new Date(last.getTime() + frequency * 30.44 * 86400000);
    const today = new Date();

    const daysUntilDue = Math.floor((nextDue - today) / 86400000);

    if (daysUntilDue < 0) {
      return { status: `OVERDUE ${Math.abs(daysUntilDue)}d`, color: "bg-red-200", textColor: "text-red-800" };
    } else if (daysUntilDue <= 7) {
      return { status: `DUE ${daysUntilDue}d`, color: "bg-yellow-200", textColor: "text-yellow-800" };
    } else {
      return { status: `OK ${daysUntilDue}d`, color: "bg-green-200", textColor: "text-green-800" };
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        💉 Health & Vaccination Monitor
      </h2>

      {schedules.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No vaccination records found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {schedules.map((schedule) => {
            const status = getVaccinationStatus(schedule.lastGiven, schedule.frequency);

            return (
              <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{schedule.animalName}</h3>
                    <p className="text-sm text-gray-600">{schedule.animalType}</p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm font-bold ${status.color} ${status.textColor}`}>
                    {status.status}
                  </span>
                </div>

                <div className="bg-gray-50 p-3 rounded grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Vaccine</p>
                    <p className="font-semibold text-gray-900">{schedule.vaccineName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Last Given</p>
                    <p className="font-semibold text-gray-900">{schedule.lastGiven || "Never"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Frequency</p>
                    <p className="font-semibold text-gray-900">Every {schedule.frequency} months</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
