import { Suspense, useMemo } from 'react';
import { ClipboardCheck, ClipboardX, Wallet } from 'lucide-react';
import { useReportData } from '../hooks/useReportData';
import {
  groupByCategory,
  complianceRate,
  combinedInventoryBreakdown,
  KES,
} from '../utils/aggregations';
import FilterBar from '../components/FilterBar';
import KpiCard from '../components/KpiCard';
import BreakdownDonut from '../components/BreakdownDonut';
import RankingBar from '../components/RankingBar';
import ReportSkeleton from '../components/ReportSkeleton';

// ASSUMPTIONS:
// - activities have `completed` (boolean), `dueDate`, and `assignedTo` (worker name) fields.
// - medicineInventory / equipmentInventory (new arrays added to useReportData in this phase)
//   have `name`, `quantity`, and `costPerUnit` fields. If your equipment tracking uses
//   something other than a per-unit cost (e.g. a single asset value), adjust the
//   `costField` passed into combinedInventoryBreakdown below.
// - Low-stock threshold reuses the same 50-unit placeholder as Crops & Feed — these are
//   different units for different item types, so treat this as a starting point, not a
//   real reorder rule, until you wire in per-item thresholds.

const LOW_STOCK_THRESHOLD = 50;

function ActivityInventoryContent() {
  const { current, allFeedInventory, allMedicineInventory, allEquipmentInventory } = useReportData();

  const completed = current.activities.filter((a) => a.completed).length;
  const pending = current.activities.filter((a) => !a.completed && new Date(a.dueDate) >= new Date()).length;
  const overdue = current.activities.filter((a) => !a.completed && new Date(a.dueDate) < new Date()).length;
  const completionRate = complianceRate(current.activities, 'completed', true);

  const workerProductivity = useMemo(
    () => groupByCategory(current.activities.filter((a) => a.completed), { categoryField: 'assignedTo' }),
    [current.activities]
  );

  const inventoryValue = useMemo(
    () =>
      combinedInventoryBreakdown([
        { name: 'Feed', items: allFeedInventory, quantityField: 'quantityKg', costField: 'costPerKg' },
        { name: 'Medicine', items: allMedicineInventory, quantityField: 'quantity', costField: 'costPerUnit' },
        { name: 'Equipment', items: allEquipmentInventory, quantityField: 'quantity', costField: 'costPerUnit' },
      ]),
    [allFeedInventory, allMedicineInventory, allEquipmentInventory]
  );

  const totalInventoryValue = inventoryValue.reduce((acc, c) => acc + c.value, 0);

  const lowStockItems = useMemo(() => {
    const feed = allFeedInventory.filter((f) => f.quantityKg < LOW_STOCK_THRESHOLD).map((f) => ({ name: f.name, value: f.quantityKg }));
    const medicine = allMedicineInventory.filter((m) => m.quantity < LOW_STOCK_THRESHOLD).map((m) => ({ name: m.name, value: m.quantity }));
    const equipment = allEquipmentInventory.filter((e) => e.quantity < LOW_STOCK_THRESHOLD).map((e) => ({ name: e.name, value: e.quantity }));
    return [...feed, ...medicine, ...equipment].sort((a, b) => a.value - b.value);
  }, [allFeedInventory, allMedicineInventory, allEquipmentInventory]);

  const money = (v) => KES(v).replace('KES', 'KES ');
  const exportRows = current.activities.map((a) => ({ title: a.title, dueDate: a.dueDate, completed: a.completed, assignedTo: a.assignedTo }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-green-900 mb-1">Activity & Inventory</h1>
        <p className="text-sm text-gray-500 mb-6">Task completion, worker productivity, and stock levels across the farm</p>
      </div>

      <FilterBar
        exportData={exportRows}
        exportFilename="activity-inventory"
        reportTitle="Activity & Inventory"
        summaryStats={[
          { label: 'Completed', value: completed },
          { label: 'Overdue', value: overdue },
          { label: 'Pending', value: pending },
          { label: 'Completion Rate', value: `${completionRate}%` },
        ]}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Completed" value={completed.toLocaleString()} icon={ClipboardCheck} />
        <KpiCard label="Overdue" value={overdue.toLocaleString()} icon={ClipboardX} trendIsGood={false} />
        <KpiCard label="Pending" value={pending.toLocaleString()} icon={ClipboardCheck} subtitle="not yet due" />
        <KpiCard label="Completion Rate" value={`${completionRate}%`} icon={ClipboardCheck} />
      </div>

      <RankingBar title="Worker productivity (tasks completed)" data={workerProductivity} limit={6} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <BreakdownDonut title="Inventory valuation by category" data={inventoryValue} valueFormatter={money} />
        <RankingBar title="Low stock items (lowest first)" data={lowStockItems} limit={6} />
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Wallet size={14} />
          Total inventory value across feed, medicine, and equipment: <span className="font-semibold text-green-900">{money(totalInventoryValue)}</span>
        </div>
      </div>
    </div>
  );
}

export default function ReportsActivityInventory() {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <ActivityInventoryContent />
    </Suspense>
  );
}