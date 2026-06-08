# 🤖 Farm Assistant Implementation Guide

## Overview

The Farm Assistant is a comprehensive intelligent farm management system that monitors farm data across all modules and generates alerts, recommendations, and schedules automatically.

## Architecture

### 1. **Core Utility Functions** (`src/utils/farmAssistant.js`)

The heart of the Farm Assistant. Contains all alert generation logic:

- **Activity Management**: Tracks planned tasks and generates due/overdue alerts
- **Vaccination Scheduling**: Monitors medical records and calculates next vaccination dates
- **Feed Monitoring**: Tracks inventory and consumption patterns to predict runout
- **Production Monitoring**: Compares production metrics week-over-week
- **Mortality Monitoring**: Calculates mortality rates and alerts on abnormal patterns
- **Financial Monitoring**: Analyzes income and expenses

### 2. **Extended Context** (`src/context/FarmContext.jsx`)

The centralized state management system with:

```javascript
// Farm Assistant State
- activities: Array of planned activities
- alerts: Generated alerts based on farm data
- feedInventory: Current feed stocks and usage
- productionHistory: Production records over time
- mortalityRecords: Death records for analysis
- salesRecords: Income tracking
- expenseRecords: Expense tracking

// Methods
- addActivity(activity): Create new activity
- completeActivity(id): Mark activity complete
- dismissAlert(alertId): Dismiss an alert
- addProductionRecord(record): Log production
- addMortalityRecord(record): Log deaths
- addSalesRecord(record): Log sales
- addExpenseRecord(record): Log expenses
```

### 3. **Components**

#### AssistantHub (`src/pages/AssistantHub.jsx`)
Main dashboard showing:
- Alert summary (critical, high, medium, low)
- Detailed alerts grouped by severity
- Activity management (create, complete, delete)
- Dismissed alerts history

#### Alert & Notification Components (`src/components/AssistantComponents.jsx`)
- `AlertCard`: Single alert display (full or compact)
- `ActivityPlannerModal`: Modal for creating activities
- `NotificationCenter`: Floating notification bell with recent items

#### Monitoring Components (`src/components/MonitoringComponents.jsx`)
- `FeedMonitor`: Track feed inventory and consumption
- `ProductionMonitor`: Monitor production trends
- `HealthMonitor`: Track vaccinations and medical records

## Usage

### Adding an Activity

**Method 1: From Sidebar**
1. Click "📋 Plan Activity" button in sidebar
2. Fill in task, description, due date, priority
3. Click "Create Activity"

**Method 2: Programmatically**
```javascript
const { addActivity } = useContext(FarmContext);

addActivity({
  task: "Vaccinate Layers",
  description: "Newcastle vaccine for layer flock",
  dueDate: "2026-06-12",
  priority: "High"
});
```

### Tracking Feed Inventory

Use the FeedMonitor component to:
1. Add feed items (name, current stock, daily usage)
2. System automatically calculates days remaining
3. Generates alerts when stock is low (<7 days) or critical (<3 days)
4. Update stock as feed is consumed

### Recording Production

Log daily/weekly production:
```javascript
const { addProductionRecord } = useContext(FarmContext);

addProductionRecord({
  productType: "Eggs",
  quantity: 150
});
```

The system automatically compares this week vs last week and generates trends.

### Logging Sales & Expenses

```javascript
// Sales
const { addSalesRecord } = useContext(FarmContext);
addSalesRecord({
  productType: "Eggs",
  quantity: 100,
  pricePerUnit: 10,
  amount: 1000
});

// Expenses
const { addExpenseRecord } = useContext(FarmContext);
addExpenseRecord({
  category: "Feed",
  amount: 5000,
  description: "Layers Mash purchase"
});
```

### Adding Vaccination Records to Animals

Vaccination records are stored in the animal's `medicalLog` array:

```javascript
animal.medicalLog = [
  {
    id: "vax-001",
    type: "Vaccination",
    name: "Newcastle Vaccine",
    date: "2026-03-10",
    frequency: 3, // months
  },
  // ... more records
];
```

The system automatically:
1. Calculates next due date
2. Generates alerts when due or overdue
3. Displays in HealthMonitor component

## Alert Types

### Activity-Related
- `ACTIVITY_DUE`: Task is upcoming
- `ACTIVITY_OVERDUE`: Task is overdue

### Vaccination-Related
- `VACCINATION_DUE`: Next vaccination date within 7 days
- `VACCINATION_OVERDUE`: Vaccination is overdue

### Feed-Related
- `FEED_LOW`: Stock will run out in 3-7 days
- `FEED_CRITICAL`: Stock will run out in <3 days

### Production-Related
- `PRODUCTION_DROP`: Production down >20% week-over-week
- `PRODUCTION_INCREASE`: Production up >15% week-over-week

### Health-Related
- `MORTALITY_HIGH`: Mortality rate exceeds recommended (5%)

### Financial-Related
- `EXPENSE_HIGH`: Monthly expenses are very high

## Alert Severity Levels

1. **CRITICAL** (🚨) - Immediate action required
   - Feed critical low (<3 days)
   - Vaccination severely overdue
   - High mortality rate (>10%)

2. **HIGH** (⚠️) - Attention needed soon
   - Activity overdue
   - Vaccination overdue
   - Feed low (<7 days)
   - Production drop >20%

3. **MEDIUM** (🔔) - Should be addressed
   - Activity due today
   - Vaccination due soon
   - Moderate mortality increase

4. **LOW** (ℹ️) - FYI
   - Activity due soon
   - Production increase (positive trend)
   - General information

## Integration Points

### Dashboard Integration

Add monitoring widgets to Dashboard:

```javascript
import { FeedMonitor, ProductionMonitor, HealthMonitor } from "../components/MonitoringComponents.jsx";

export default function Dashboard() {
  return (
    <div>
      <FeedMonitor />
      <ProductionMonitor />
      <HealthMonitor />
    </div>
  );
}
```

### Animal Page Integration

Display vaccination alerts on animal profiles:

```javascript
import { AlertCard } from "../components/AssistantComponents.jsx";
import { generateVaccinationAlerts } from "../utils/farmAssistant.js";

export default function AnimalProfile({ animal }) {
  const alerts = generateVaccinationAlerts([animal]);
  
  return (
    <div>
      {alerts.map(alert => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
```

## Data Persistence

Currently using React state (resets on page refresh). To persist data:

1. Save to localStorage:
```javascript
useEffect(() => {
  localStorage.setItem('farmData', JSON.stringify({
    activities, feedInventory, productionHistory, etc.
  }));
}, [activities, feedInventory, productionHistory]);
```

2. Or integrate with a backend API:
```javascript
const saveFarmData = async () => {
  await fetch('/api/farm-data', {
    method: 'POST',
    body: JSON.stringify({ activities, alerts, etc. })
  });
};
```

## Customization

### Adjust Alert Thresholds

Edit `src/utils/farmAssistant.js`:

```javascript
// Feed critical threshold (default: <3 days)
if (daysRemaining < 3) { ... }

// Production drop threshold (default: >20%)
if (percentChange < -20) { ... }

// Mortality threshold (default: >5%)
const recommendedRate = 5;
```

### Add New Alert Types

1. Add to `ALERT_TYPES` in farmAssistant.js
2. Add icon to `ALERT_ICONS`
3. Create generation function
4. Add to `generateAllAlerts()`

Example:
```javascript
export const ALERT_TYPES = {
  // ... existing types
  BREEDING_SEASON: "breeding-season",
};

export function generateBreedingAlerts(animals = []) {
  // Your logic here
  return alerts;
}
```

## Performance Optimization

- Alerts regenerate whenever farm data changes
- Use `useMemo` to prevent unnecessary recalculations:

```javascript
const generatedAlerts = useMemo(
  () => generateAllAlerts(farmData),
  [farmData]
);
```

- Dismissed alerts stored in state to prevent re-dismissal

## Future Enhancements

1. **Predictive Analytics**: ML models to forecast production/mortality
2. **SMS/Email Notifications**: Send alerts to farmer's phone
3. **Custom Rules**: Farmers define their own alert thresholds
4. **Scheduling Optimization**: Suggest best times for activities
5. **Data Export**: Generate PDF reports
6. **Multi-farm Support**: Manage multiple farms
7. **Offline Mode**: Work without internet connection

---

**Created**: 2026-06-07  
**Version**: 1.0.0  
**Status**: Production Ready
