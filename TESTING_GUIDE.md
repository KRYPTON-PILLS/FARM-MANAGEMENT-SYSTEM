# 🧪 Farm Assistant - Testing & Demo Guide

## Quick Start Testing

### 1. **Launch Farm Assistant**

```
Click: Sidebar → 🤖 Farm Assistant
URL: http://localhost:5173/assistant
```

Should see:
- 4 summary cards (Critical, High, Medium, Pending Activities)
- Two tabs: "Alerts" and "Activities"
- Currently empty state

---

## Test Scenarios

### Scenario A: Create & Manage Activities

**Steps:**
1. Click "📋 Plan Activity" button in sidebar
2. Fill form:
   - Task: "Vaccinate Layers"
   - Description: "Newcastle vaccine for layer flock"
   - Due Date: Tomorrow's date
   - Priority: "High"
3. Click "Create Activity"

**Expected Results:**
- ✅ Modal closes
- ✅ Activity appears in "Activities" tab with pending status
- ✅ Summary card updates to show "1 Pending Activities"
- ✅ Can click "Complete" or "Delete"

**Complete Activity:**
1. Click "Complete" on an activity
2. Activity moves to "Completed Activities" section
3. Shows checkmark icon ✅

---

### Scenario B: Feed Monitoring

**Steps:**
1. Go to **AssistantHub** page
2. Scroll to find a way to access FeedMonitor (note: needs to be added to UI manually)
3. Or test by importing in a test component

**To Test FeedMonitor in a page:**

Add to any page (e.g., Dashboard):
```jsx
import { FeedMonitor } from "../components/MonitoringComponents.jsx";

export default function Dashboard() {
  return (
    <div>
      <FeedMonitor />
    </div>
  );
}
```

Then:
1. Click "+ Add Feed"
2. Fill form:
   - Feed Type: "Layers Mash"
   - Current Stock: 100
   - Daily Usage: 15
3. Click "Add Feed Item"

**Expected Results:**
- ✅ Feed item appears with status "OK" (6 days remaining)
- ✅ Progress bar shows 20% remaining
- ✅ Can update stock by entering new amount
- ✅ Can delete item

**Test Critical Alert:**
1. Update stock to 30kg (leaves ~2 days at 15kg/day)
2. Should show "CRITICAL" badge
3. Status updates in real-time

---

### Scenario C: Production Monitoring

**Test Production Records:**

Add to Dashboard:
```jsx
import { ProductionMonitor } from "../components/MonitoringComponents.jsx";
```

Then:
1. Click "+ Record Production"
2. Fill form:
   - Product Type: "Eggs"
   - Quantity: 150
3. Click "Record Production"

**Create Trend:**
1. Add multiple records on different dates
2. System groups by product type
3. Compares this week vs last week
4. Shows percentage change

**Test Production Drop Alert:**
1. Add Eggs: 500 units (last week)
2. Add Eggs: 400 units (this week)
3. Should generate alert: "Production down 20%"

---

### Scenario D: Vaccination Alerts

**Setup:**

Animals must have medical records. Example animal structure:
```javascript
{
  id: "cow-001",
  name: "Bessie",
  type: "Cow",
  medicalLog: [
    {
      id: "vax-001",
      type: "Vaccination",
      name: "Newcastle Vaccine",
      date: "2026-03-10",
      frequency: 3, // months
    }
  ]
}
```

**Expected Results:**
- ✅ HealthMonitor shows vaccination schedule
- ✅ Calculates next due date (June 10, 2026)
- ✅ If today is within 7 days of due date, generates alert
- ✅ If past due date, generates HIGH priority alert

---

### Scenario E: Mortality Monitoring

**Add Mortality Records:**

```javascript
const { addMortalityRecord } = useContext(FarmContext);

addMortalityRecord({
  category: "Poultry",
  count: 15,
  reason: "Disease outbreak"
});

// Add more to trigger alert
addMortalityRecord({
  category: "Poultry",
  count: 20
});
```

**Expected Results:**
- ✅ If >5% of flock dies in a month, alert generates
- ✅ Shows: "Mortality rate exceeds recommended levels"
- ✅ Severity: HIGH (if >5%), CRITICAL (if >10%)

---

### Scenario F: Financial Monitoring

**Add Sales & Expenses:**

```javascript
const { addSalesRecord, addExpenseRecord } = useContext(FarmContext);

// Sales
addSalesRecord({
  productType: "Eggs",
  quantity: 1000,
  amount: 50000
});

// Expenses
addExpenseRecord({
  category: "Feed",
  amount: 120000,
  description: "Bulk feed purchase"
});
```

**Expected Results:**
- ✅ If total expenses > 100,000 this month, generates alert
- ✅ Shows: "High Monthly Expenses"
- ✅ Severity: HIGH or CRITICAL depending on amount

---

### Scenario G: Notification Center

**Steps:**
1. Create some activities, add feed items, etc.
2. Click 🔔 bell icon (bottom right corner)

**Expected Results:**
- ✅ Shows recent critical alerts
- ✅ Shows pending activities
- ✅ Badge shows count
- ✅ Can dismiss alerts from here
- ✅ "View Full Assistant" button links to AssistantHub

---

### Scenario H: Activity Planner Modal

**Steps:**
1. Click "📋 Plan Activity" in sidebar
2. Test form validation:
   - Leave Task empty → "Please enter a task"
   - All fields filled → Creates activity

**Expected Results:**
- ✅ Modal appears at center
- ✅ Can close with X button or Cancel
- ✅ Form clears after submission
- ✅ Activity appears in list

---

### Scenario I: Dismiss & Restore Alerts

**Steps:**
1. View AssistantHub
2. On any alert, click "Dismiss"

**Expected Results:**
- ✅ Alert disappears from active list
- ✅ Alert count decreases
- ✅ "Dismissed Alerts" section shows count
- ✅ Can click to expand dismissed section
- ✅ Can click "Restore" to bring back

---

### Scenario J: Alert Severity Colors

Check alert display colors:

| Severity | Color | Icon |
|----------|-------|------|
| CRITICAL | Red 🚨 | 🚨 |
| HIGH | Orange ⚠️ | ⚠️ |
| MEDIUM | Yellow 🔔 | 📋 |
| LOW | Blue ℹ️ | 🌾 |

**Test by creating:**
- Feed critical alert (stock < 3 days)
- Activity overdue (due date < today)
- Vaccination overdue
- Production drop > 20%

---

## Debug Checklist

### ✓ Context is Working
```javascript
// Open browser console
const { alerts, activities, feedInventory } = useContext(FarmContext);
console.log({ alerts, activities, feedInventory });
```

### ✓ Alerts Generating
Check FarmContext logs:
```javascript
useEffect(() => {
  console.log("Generated alerts:", alerts);
}, [alerts]);
```

### ✓ Routing Works
- `/` → Dashboard ✓
- `/dashboard` → Dashboard ✓
- `/assistant` → AssistantHub ✓
- `/animals` → Animals ✓

### ✓ Notification Bell
- Should appear bottom-right on all pages
- Badge should update when alerts change
- Should open/close on click

### ✓ Sidebar Updates
- "🤖 Farm Assistant" link visible
- "📋 Plan Activity" button visible
- Button opens modal on click

---

## Sample Test Data

Add to FarmProvider on mount for testing:

```javascript
useEffect(() => {
  // Add test activity
  addActivity({
    task: "Test Vaccination",
    dueDate: new Date().toISOString().split("T")[0],
    priority: "High"
  });

  // Add test feed
  setFeedInventory([{
    id: "1",
    name: "Layers Mash",
    currentStock: 50,
    averageDailyUsage: 20
  }]);

  // Add test production
  addProductionRecord({
    productType: "Eggs",
    quantity: 200
  });
}, []);
```

---

## Performance Testing

### Check for:
- ✓ No console errors
- ✓ Alerts update immediately
- ✓ No lag when adding items
- ✓ Modal opens/closes smoothly
- ✓ Notification bell updates in real-time

### Monitor:
```javascript
// Performance
console.time("Alert Generation");
generateAllAlerts(farmData);
console.timeEnd("Alert Generation");
```

---

## Browser Compatibility

Tested on:
- ✓ Chrome/Edge (v120+)
- ✓ Firefox (v121+)
- ✓ Safari (v17+)

---

## Known Limitations

1. **No Data Persistence**: Data resets on page refresh
2. **No Real API**: Uses local state only
3. **No Email/SMS**: Notifications only in-app
4. **No Offline Mode**: Requires internet

---

## Next Steps

After testing, consider:
1. Add data persistence (localStorage or API)
2. Integrate monitoring components into Dashboard
3. Add email/SMS notifications
4. Create report generation
5. Add user preferences/settings

---

**Last Updated**: 2026-06-07  
**Status**: Ready for Testing
