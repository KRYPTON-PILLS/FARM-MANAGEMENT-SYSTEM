# 🔗 Integration Guide - Adding Monitoring to Dashboard

This guide shows how to integrate Farm Assistant monitoring components into your existing Dashboard and other pages.

## Option 1: Add Monitoring to Dashboard

### Before (Current Dashboard)

```jsx
// src/pages/Dashboard.jsx
import { useContext } from "react";
import { FarmContext } from "../context/FarmContext";

export default function Dashboard() {
  const { animals = [] } = useContext(FarmContext);
  
  // ... existing dashboard code
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Existing widgets */}
    </div>
  );
}
```

### After: With Farm Assistant

```jsx
// src/pages/Dashboard.jsx
import { useContext } from "react";
import { FarmContext } from "../context/FarmContext";
import { AlertCard } from "../components/AssistantComponents.jsx";
import { FeedMonitor, ProductionMonitor, HealthMonitor } from "../components/MonitoringComponents.jsx";

export default function Dashboard() {
  const { animals = [], alerts } = useContext(FarmContext);
  
  // Get only critical and high priority alerts
  const urgentAlerts = alerts.filter(a => 
    a.severity === "critical" || a.severity === "high"
  ).slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      
      {/* ─── CRITICAL ALERTS SECTION ─── */}
      {urgentAlerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">⚠️ Urgent Alerts</h2>
          <div className="space-y-3">
            {urgentAlerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} compact={false} />
            ))}
          </div>
        </div>
      )}

      {/* ─── EXISTING DASHBOARD WIDGETS ─── */}
      {/* Your existing dashboard content here */}

      {/* ─── MONITORING COMPONENTS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="lg:col-span-2">
          <FeedMonitor />
        </div>
        <ProductionMonitor />
        <HealthMonitor />
      </div>
    </div>
  );
}
```

---

## Option 2: Add Alerts to Animal Profile Pages

### Example: Show Vaccination Alerts on Cow Profile

```jsx
// src/pages/CowsProfile.jsx
import { useContext } from "react";
import { FarmContext } from "../context/FarmContext";
import { AlertCard } from "../components/AssistantComponents.jsx";
import { generateVaccinationAlerts } from "../utils/farmAssistant.js";

export default function CowsProfile({ id }) {
  const { animals } = useContext(FarmContext);
  const animal = animals.find(a => a.id === id);
  
  const vaccinationAlerts = generateVaccinationAlerts(animal ? [animal] : []);

  return (
    <div className="p-6">
      
      {/* ─── VACCINATION ALERTS ─── */}
      {vaccinationAlerts.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-bold text-lg mb-3 text-blue-900">💉 Health Alerts</h3>
          <div className="space-y-2">
            {vaccinationAlerts.map(alert => (
              <AlertCard 
                key={alert.id} 
                alert={alert} 
                compact={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── EXISTING PROFILE CONTENT ─── */}
      {/* Your existing profile code here */}
    </div>
  );
}
```

---

## Option 3: Add Feed Alerts to Poultry Page

### Show Feed Status for Poultry

```jsx
// src/pages/Poultry.jsx
import { useContext } from "react";
import { FarmContext } from "../context/FarmContext";
import { estimateFeedRunout } from "../utils/farmAssistant.js";

export default function Poultry() {
  const { feedInventory } = useContext(FarmContext);
  
  // Show poultry-related feed items
  const poultryFeed = feedInventory.filter(f => 
    f.name?.toLowerCase().includes("layer") || 
    f.name?.toLowerCase().includes("poultry")
  );

  return (
    <div className="p-6">
      
      {/* ─── FEED STATUS ─── */}
      {poultryFeed.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-4">🌾 Feed Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {poultryFeed.map(feed => {
              const daysRemaining = estimateFeedRunout(
                feed.currentStock, 
                feed.averageDailyUsage
              );
              
              return (
                <div 
                  key={feed.id} 
                  className={`p-4 rounded-lg border-2 ${
                    daysRemaining < 3 
                      ? "bg-red-50 border-red-300" 
                      : daysRemaining < 7 
                        ? "bg-yellow-50 border-yellow-300"
                        : "bg-green-50 border-green-300"
                  }`}
                >
                  <p className="font-bold">{feed.name}</p>
                  <p className="text-sm">Stock: {feed.currentStock}kg</p>
                  <p className="text-sm">Usage: {feed.averageDailyUsage}kg/day</p>
                  <p className="text-lg font-bold mt-2">
                    {daysRemaining || "?"} days remaining
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── EXISTING POULTRY CONTENT ─── */}
    </div>
  );
}
```

---

## Option 4: Create an "At a Glance" Widget

### Quick Summary Widget for Any Page

```jsx
// src/components/AssistantQuickSummary.jsx
import { useContext } from "react";
import { FarmContext } from "../context/FarmContext";

export function AssistantQuickSummary() {
  const { alerts, activities, feedInventory } = useContext(FarmContext);
  
  const criticalCount = alerts.filter(a => a.severity === "critical").length;
  const highCount = alerts.filter(a => a.severity === "high").length;
  const pendingActivities = activities.filter(a => !a.completed).length;
  const criticalFeed = feedInventory.filter(f => {
    const remaining = f.currentStock / f.averageDailyUsage;
    return remaining < 3;
  }).length;

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className={`p-4 rounded-lg text-center ${criticalCount > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
        <div className="text-3xl font-bold">{criticalCount}</div>
        <div className="text-sm font-semibold">Critical</div>
      </div>
      
      <div className={`p-4 rounded-lg text-center ${highCount > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
        <div className="text-3xl font-bold">{highCount}</div>
        <div className="text-sm font-semibold">High Priority</div>
      </div>
      
      <div className={`p-4 rounded-lg text-center ${pendingActivities > 0 ? 'bg-blue-100' : 'bg-gray-100'}`}>
        <div className="text-3xl font-bold">{pendingActivities}</div>
        <div className="text-sm font-semibold">Activities</div>
      </div>
      
      <div className={`p-4 rounded-lg text-center ${criticalFeed > 0 ? 'bg-yellow-100' : 'bg-gray-100'}`}>
        <div className="text-3xl font-bold">{criticalFeed}</div>
        <div className="text-sm font-semibold">Low Feed</div>
      </div>
    </div>
  );
}
```

Then use it on any page:

```jsx
import { AssistantQuickSummary } from "../components/AssistantQuickSummary.jsx";

export default function Dashboard() {
  return (
    <div>
      <AssistantQuickSummary />
      {/* ... rest of dashboard */}
    </div>
  );
}
```

---

## Option 5: Add Production Trends to Reports Page

### Show Production Analytics

```jsx
// src/pages/Reports.jsx
import { useContext } from "react";
import { FarmContext } from "../context/FarmContext";

export default function Reports() {
  const { productionHistory } = useContext(FarmContext);
  
  // Group by week
  const thisWeekData = productionHistory.filter(p => {
    const pDate = new Date(p.date).getTime();
    const weekAgo = Date.now() - 7 * 86400000;
    return pDate > weekAgo;
  });

  const lastWeekData = productionHistory.filter(p => {
    const pDate = new Date(p.date).getTime();
    const twoWeeksAgo = Date.now() - 14 * 86400000;
    const weekAgo = Date.now() - 7 * 86400000;
    return pDate > twoWeeksAgo && pDate < weekAgo;
  });

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold mb-8">📊 Reports</h1>

      {/* ─── PRODUCTION TRENDS ─── */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Production Trends</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded">
            <p className="text-sm text-gray-600">Last Week Total</p>
            <p className="text-2xl font-bold">
              {lastWeekData.reduce((sum, p) => sum + p.quantity, 0)}
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded">
            <p className="text-sm text-gray-600">This Week Total</p>
            <p className="text-2xl font-bold">
              {thisWeekData.reduce((sum, p) => sum + p.quantity, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* ─── EXISTING REPORTS ─── */}
    </div>
  );
}
```

---

## Step-by-Step Integration Process

### 1. Choose Your Page
Decide which pages to enhance:
- Dashboard (recommended - most visible)
- Animal profile pages (for health tracking)
- Poultry/Cattle/Crops pages (for feed status)
- Reports page (for trends)

### 2. Import Components
```javascript
import { AlertCard } from "../components/AssistantComponents.jsx";
import { 
  FeedMonitor, 
  ProductionMonitor, 
  HealthMonitor 
} from "../components/MonitoringComponents.jsx";
import { 
  generateVaccinationAlerts, 
  generateFeedAlerts 
} from "../utils/farmAssistant.js";
```

### 3. Add to JSX
Place components in your page layout with appropriate styling

### 4. Test
- Check that data flows correctly
- Verify no console errors
- Test adding/updating data
- Ensure styling matches

---

## Performance Considerations

### 1. Memoize Components
```jsx
import { useMemo } from "react";

export default function Dashboard() {
  const { alerts, animals } = useContext(FarmContext);
  
  const vaccinationAlerts = useMemo(
    () => generateVaccinationAlerts(animals),
    [animals]
  );

  return <div>{/* Use vaccinationAlerts */}</div>;
}
```

### 2. Limit Alert Display
```jsx
// Show only 5 most urgent
const urgentAlerts = alerts
  .filter(a => a.severity === "critical" || a.severity === "high")
  .slice(0, 5);
```

### 3. Lazy Load Components
```jsx
import { lazy, Suspense } from "react";

const FeedMonitor = lazy(() => 
  import("../components/MonitoringComponents.jsx")
    .then(m => ({ default: m.FeedMonitor }))
);

// Use with Suspense
<Suspense fallback={<div>Loading...</div>}>
  <FeedMonitor />
</Suspense>
```

---

## Styling Integration

### Using Existing Theme
All components use Tailwind classes that match your existing app:
- Colors: `bg-green-600`, `bg-red-500`, etc.
- Spacing: `p-6`, `mb-8`, etc.
- Layout: `grid`, `flex`, etc.

### Customization
To match specific brand colors, update the component color utilities:

```javascript
// Change primary color from green to blue
getSeverityColor = (severity) => {
  switch (severity) {
    case ALERT_SEVERITY.CRITICAL:
      return "bg-red-100 border-red-300"; // Keep red
    case ALERT_SEVERITY.HIGH:
      return "bg-blue-100 border-blue-300"; // Changed from orange
    // ...
  }
};
```

---

## Troubleshooting Integration

### Issue: Components not showing
- ✓ Check imports are correct
- ✓ Verify FarmContext is wrapped around component
- ✓ Check console for errors

### Issue: Styling looks off
- ✓ Ensure Tailwind CSS is loaded
- ✓ Check no conflicting CSS
- ✓ Verify viewport is wide enough for responsive styles

### Issue: Alerts not updating
- ✓ Check farm data is being set in context
- ✓ Verify useEffect dependencies
- ✓ Console log alerts to debug

---

## Quick Copy-Paste: Add to Dashboard

Replace your current Dashboard with this minimal integration:

```jsx
import { useContext } from "react";
import { FarmContext } from "../context/FarmContext";
import { AlertCard } from "../components/AssistantComponents.jsx";
import { FeedMonitor } from "../components/MonitoringComponents.jsx";

export default function Dashboard() {
  const { alerts } = useContext(FarmContext);
  
  const urgentAlerts = alerts
    .filter(a => a.severity === "critical" || a.severity === "high")
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-4xl font-bold mb-8">📊 Dashboard</h1>

      {/* Urgent Alerts */}
      {urgentAlerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">⚠️ Urgent Alerts</h2>
          <div className="space-y-3">
            {urgentAlerts.map(a => <AlertCard key={a.id} alert={a} />)}
          </div>
        </div>
      )}

      {/* Monitoring */}
      <FeedMonitor />
    </div>
  );
}
```

---

**Created**: 2026-06-07  
**Status**: Ready to Integrate
