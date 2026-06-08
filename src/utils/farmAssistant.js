/**
 * Farm Assistant Utility Functions
 * Generates alerts, recommendations, and schedules based on farm data
 */

export const ALERT_TYPES = {
  ACTIVITY_DUE: "activity-due",
  ACTIVITY_OVERDUE: "activity-overdue",
  VACCINATION_DUE: "vaccination-due",
  VACCINATION_OVERDUE: "vaccination-overdue",
  FEED_LOW: "feed-low",
  FEED_CRITICAL: "feed-critical",
  MORTALITY_HIGH: "mortality-high",
  PRODUCTION_DROP: "production-drop",
  PRODUCTION_INCREASE: "production-increase",
  EXPENSE_HIGH: "expense-high",
};

export const ALERT_SEVERITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

export const ALERT_ICONS = {
  [ALERT_TYPES.ACTIVITY_DUE]: "📋",
  [ALERT_TYPES.ACTIVITY_OVERDUE]: "⚠️",
  [ALERT_TYPES.VACCINATION_DUE]: "💉",
  [ALERT_TYPES.VACCINATION_OVERDUE]: "⚠️",
  [ALERT_TYPES.FEED_LOW]: "🌾",
  [ALERT_TYPES.FEED_CRITICAL]: "🚨",
  [ALERT_TYPES.MORTALITY_HIGH]: "⚠️",
  [ALERT_TYPES.PRODUCTION_DROP]: "📉",
  [ALERT_TYPES.PRODUCTION_INCREASE]: "📈",
  [ALERT_TYPES.EXPENSE_HIGH]: "💰",
};

/* ═════════════════════════════════════════════════════════════
   ACTIVITY MANAGEMENT
   ═════════════════════════════════════════════════════════════ */

export function generateActivityAlerts(activities = []) {
  const alerts = [];
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 604800000).toISOString().split("T")[0];

  activities.forEach((activity) => {
    if (activity.completed) return;

    const dueDate = new Date(activity.dueDate).toISOString().split("T")[0];
    const daysUntilDue = Math.floor(
      (new Date(dueDate).getTime() - new Date(today).getTime()) / 86400000
    );

    if (daysUntilDue < 0) {
      alerts.push({
        id: `activity-overdue-${activity.id}`,
        type: ALERT_TYPES.ACTIVITY_OVERDUE,
        severity: ALERT_SEVERITY.HIGH,
        title: `${activity.task} - OVERDUE`,
        description: `Was due ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? "s" : ""} ago`,
        data: { activity },
        createdAt: today,
      });
    } else if (daysUntilDue === 0) {
      alerts.push({
        id: `activity-due-today-${activity.id}`,
        type: ALERT_TYPES.ACTIVITY_DUE,
        severity: ALERT_SEVERITY.MEDIUM,
        title: `${activity.task} - Due Today`,
        description: `This task is due today`,
        data: { activity },
        createdAt: today,
      });
    } else if (daysUntilDue === 1) {
      alerts.push({
        id: `activity-due-tomorrow-${activity.id}`,
        type: ALERT_TYPES.ACTIVITY_DUE,
        severity: ALERT_SEVERITY.LOW,
        title: `${activity.task} - Due Tomorrow`,
        description: `This task is due tomorrow`,
        data: { activity },
        createdAt: today,
      });
    } else if (daysUntilDue <= 7) {
      alerts.push({
        id: `activity-upcoming-${activity.id}`,
        type: ALERT_TYPES.ACTIVITY_DUE,
        severity: ALERT_SEVERITY.LOW,
        title: `${activity.task} - Due in ${daysUntilDue} days`,
        description: `This task is coming up`,
        data: { activity },
        createdAt: today,
      });
    }
  });

  return alerts;
}

/* ═════════════════════════════════════════════════════════════
   VACCINATION & HEALTH MANAGEMENT
   ═════════════════════════════════════════════════════════════ */

export function calculateNextVaccinationDate(lastGiven, frequencyMonths) {
  if (!lastGiven) return null;
  const last = new Date(lastGiven);
  const next = new Date(last.getTime() + frequencyMonths * 30.44 * 86400000);
  return next.toISOString().split("T")[0];
}

export function generateVaccinationAlerts(animals = []) {
  const alerts = [];
  const today = new Date().toISOString().split("T")[0];

  animals.forEach((animal) => {
    if (!animal.medicalLog || animal.medicalLog.length === 0) return;

    // Check vaccination records
    animal.medicalLog.forEach((record) => {
      if (!record.type?.toLowerCase().includes("vaccin")) return;

      const frequency = record.frequency || 3; // Default 3 months
      const nextDue = calculateNextVaccinationDate(record.date, frequency);
      if (!nextDue) return;

      const daysUntilDue = Math.floor(
        (new Date(nextDue).getTime() - new Date(today).getTime()) / 86400000
      );

      if (daysUntilDue < 0) {
        alerts.push({
          id: `vax-overdue-${animal.id}-${record.id}`,
          type: ALERT_TYPES.VACCINATION_OVERDUE,
          severity: ALERT_SEVERITY.HIGH,
          title: `${animal.name || "Animal"}: ${record.name || "Vaccination"} - OVERDUE`,
          description: `${animal.name} is ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? "s" : ""} overdue for ${record.name}`,
          data: { animal, record },
          createdAt: today,
        });
      } else if (daysUntilDue <= 7) {
        const severity = daysUntilDue <= 2 ? ALERT_SEVERITY.MEDIUM : ALERT_SEVERITY.LOW;
        alerts.push({
          id: `vax-due-${animal.id}-${record.id}`,
          type: ALERT_TYPES.VACCINATION_DUE,
          severity,
          title: `${animal.name || "Animal"}: ${record.name} due in ${daysUntilDue} day${daysUntilDue !== 1 ? "s" : ""}`,
          description: `Schedule ${record.name} for ${animal.name}`,
          data: { animal, record },
          createdAt: today,
        });
      }
    });
  });

  return alerts;
}

/* ═════════════════════════════════════════════════════════════
   FEED MONITORING
   ═════════════════════════════════════════════════════════════ */

export function estimateFeedRunout(feedStock, dailyConsumption) {
  if (!feedStock || !dailyConsumption || dailyConsumption === 0) return null;
  return Math.ceil(feedStock / dailyConsumption);
}

export function generateFeedAlerts(feedInventory = []) {
  const alerts = [];
  const today = new Date().toISOString().split("T")[0];

  feedInventory.forEach((feed) => {
    if (!feed.currentStock || !feed.averageDailyUsage) return;

    const daysRemaining = estimateFeedRunout(feed.currentStock, feed.averageDailyUsage);

    // Critical: Less than 3 days
    if (daysRemaining < 3 && daysRemaining > 0) {
      alerts.push({
        id: `feed-critical-${feed.id}`,
        type: ALERT_TYPES.FEED_CRITICAL,
        severity: ALERT_SEVERITY.CRITICAL,
        title: `🚨 ${feed.name} - CRITICAL LOW STOCK`,
        description: `${feed.name} may run out in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}. Current stock: ${feed.currentStock}kg, Daily usage: ${feed.averageDailyUsage}kg/day`,
        data: { feed, daysRemaining },
        createdAt: today,
      });
    }
    // Low: 3-7 days
    else if (daysRemaining >= 3 && daysRemaining <= 7) {
      alerts.push({
        id: `feed-low-${feed.id}`,
        type: ALERT_TYPES.FEED_LOW,
        severity: ALERT_SEVERITY.MEDIUM,
        title: `${feed.name} - Stock low`,
        description: `${feed.name} will run out in approximately ${daysRemaining} days`,
        data: { feed, daysRemaining },
        createdAt: today,
      });
    }
  });

  return alerts;
}

/* ═════════════════════════════════════════════════════════════
   PRODUCTION MONITORING
   ═════════════════════════════════════════════════════════════ */

export function generateProductionAlerts(productionHistory = []) {
  const alerts = [];
  const today = new Date().toISOString().split("T")[0];

  // Compare this week vs last week
  const thisWeekData = productionHistory.filter(
    (p) => {
      const pDate = new Date(p.date).getTime();
      const weekAgo = Date.now() - 7 * 86400000;
      return pDate > weekAgo;
    }
  );

  const lastWeekData = productionHistory.filter(
    (p) => {
      const pDate = new Date(p.date).getTime();
      const twoWeeksAgo = Date.now() - 14 * 86400000;
      const weekAgo = Date.now() - 7 * 86400000;
      return pDate > twoWeeksAgo && pDate < weekAgo;
    }
  );

  if (thisWeekData.length > 0 && lastWeekData.length > 0) {
    const thisWeekTotal = thisWeekData.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const lastWeekTotal = lastWeekData.reduce((sum, p) => sum + (p.quantity || 0), 0);

    if (lastWeekTotal > 0) {
      const percentChange = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;

      if (percentChange < -20) {
        alerts.push({
          id: `prod-drop-${thisWeekData[0]?.productType}`,
          type: ALERT_TYPES.PRODUCTION_DROP,
          severity: ALERT_SEVERITY.HIGH,
          title: `⚠️ ${thisWeekData[0]?.productType || "Production"} - Significant Drop`,
          description: `${thisWeekData[0]?.productType || "Production"} has dropped by ${Math.abs(percentChange).toFixed(1)}% this week (Last week: ${lastWeekTotal}, This week: ${thisWeekTotal})`,
          data: { thisWeekTotal, lastWeekTotal, percentChange },
          createdAt: today,
        });
      } else if (percentChange > 15) {
        alerts.push({
          id: `prod-increase-${thisWeekData[0]?.productType}`,
          type: ALERT_TYPES.PRODUCTION_INCREASE,
          severity: ALERT_SEVERITY.LOW,
          title: `📈 ${thisWeekData[0]?.productType || "Production"} - Positive Trend`,
          description: `${thisWeekData[0]?.productType || "Production"} has increased by ${percentChange.toFixed(1)}% this week!`,
          data: { thisWeekTotal, lastWeekTotal, percentChange },
          createdAt: today,
        });
      }
    }
  }

  return alerts;
}

/* ═════════════════════════════════════════════════════════════
   MORTALITY MONITORING
   ═════════════════════════════════════════════════════════════ */

export function generateMortalityAlerts(animals = [], mortalityRecords = []) {
  const alerts = [];
  const today = new Date().toISOString().split("T")[0];
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  // Group by category
  const categories = {};
  animals.forEach((a) => {
    const cat = a.category || "unknown";
    if (!categories[cat]) categories[cat] = { total: 0, deaths: 0 };
    categories[cat].total += 1;
  });

  mortalityRecords.forEach((record) => {
    const recordDate = new Date(record.date);
    if (recordDate.getMonth() === thisMonth && recordDate.getFullYear() === thisYear) {
      const cat = record.category || "unknown";
      if (categories[cat]) {
        categories[cat].deaths += record.count || 1;
      }
    }
  });

  // Check mortality rates
  Object.entries(categories).forEach(([category, data]) => {
    if (data.total === 0) return;

    const mortalityRate = (data.deaths / data.total) * 100;
    const recommendedRate = 5; // 5% is typical

    if (mortalityRate > recommendedRate) {
      alerts.push({
        id: `mortality-${category}`,
        type: ALERT_TYPES.MORTALITY_HIGH,
        severity: mortalityRate > 10 ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.HIGH,
        title: `⚠️ ${category} - High Mortality Rate`,
        description: `Mortality rate for ${category} is ${mortalityRate.toFixed(1)}% (${data.deaths}/${data.total}). Recommended: <${recommendedRate}%`,
        data: { category, mortalityRate, deaths: data.deaths, total: data.total },
        createdAt: today,
      });
    }
  });

  return alerts;
}

/* ═════════════════════════════════════════════════════════════
   FINANCIAL MONITORING
   ═════════════════════════════════════════════════════════════ */

export function generateFinancialAlerts(salesRecords = [], expenseRecords = []) {
  const alerts = [];
  const today = new Date().toISOString().split("T")[0];
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  // Sum this month's data
  const monthlyExpenses = expenseRecords
    .filter((e) => {
      const eDate = new Date(e.date);
      return eDate.getMonth() === thisMonth && eDate.getFullYear() === thisYear;
    })
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const monthlySales = salesRecords
    .filter((s) => {
      const sDate = new Date(s.date);
      return sDate.getMonth() === thisMonth && sDate.getFullYear() === thisYear;
    })
    .reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);

  // Alert if expenses are very high
  if (monthlyExpenses > 100000) {
    alerts.push({
      id: `expense-high-${thisMonth}`,
      type: ALERT_TYPES.EXPENSE_HIGH,
      severity: monthlyExpenses > 200000 ? ALERT_SEVERITY.HIGH : ALERT_SEVERITY.MEDIUM,
      title: `💰 High Monthly Expenses`,
      description: `Monthly expenses (KES ${monthlyExpenses.toLocaleString()}) are significantly high. Monthly income: KES ${monthlySales.toLocaleString()}`,
      data: { monthlyExpenses, monthlySales },
      createdAt: today,
    });
  }

  return alerts;
}

/* ═════════════════════════════════════════════════════════════
   MASTER ALERT GENERATOR
   ═════════════════════════════════════════════════════════════ */

export function generateAllAlerts(farmData) {
  const {
    activities = [],
    animals = [],
    feedInventory = [],
    productionHistory = [],
    mortalityRecords = [],
    salesRecords = [],
    expenseRecords = [],
  } = farmData;

  const alerts = [
    ...generateActivityAlerts(activities),
    ...generateVaccinationAlerts(animals),
    ...generateFeedAlerts(feedInventory),
    ...generateProductionAlerts(productionHistory),
    ...generateMortalityAlerts(animals, mortalityRecords),
    ...generateFinancialAlerts(salesRecords, expenseRecords),
  ];

  // Remove duplicates and sort by severity
  const uniqueAlerts = Array.from(
    new Map(alerts.map((a) => [a.id, a])).values()
  );

  const severityOrder = {
    [ALERT_SEVERITY.CRITICAL]: 0,
    [ALERT_SEVERITY.HIGH]: 1,
    [ALERT_SEVERITY.MEDIUM]: 2,
    [ALERT_SEVERITY.LOW]: 3,
  };

  return uniqueAlerts.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
}

export function formatAlertTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMs < 60000) return "Just now";
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
