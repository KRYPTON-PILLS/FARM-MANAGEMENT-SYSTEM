import { Suspense, useMemo } from 'react';
import { Wheat, Wallet, AlertTriangle } from 'lucide-react';
import { useReportData } from '../hooks/useReportData';
import { useReportsFilters } from '../context/ReportsContext';
import { sumBy, groupByPeriod, groupByCategory, feedDepletionForecast, percentChange, KES } from '../utils/aggregations';
import FilterBar from '../components/FilterBar';
import KpiCard from '../components/KpiCard';
import TrendChart from '../components/TrendChart';
import BreakdownDonut from '../components/BreakdownDonut';
import RankingBar from '../components/RankingBar';
import ReportSkeleton from '../components/ReportSkeleton';

// ASSUMPTIONS:
// - cropRecords have `crop`, `field`, `yieldKg`, `revenue`, `harvestDate` fields (per Phase 1 notes).
// - feedConsumption records (added to useReportData in this phase) have `feedName`,
//   `quantityKg`, `cost`, `date` fields.
// - feedInventory items have `name` and `quantityKg`; the low-stock threshold below
//   (50kg) is the same placeholder used for the Overview attention feed — update both
//   together if you change your reorder point.

const LOW_STOCK_THRESHOLD = 50;

function CropsFeedContent() {
  const { current, previous, allFeedInventory } = useReportData();
  const { compareEnabled } = useReportsFilters();

  const totalYield = sumBy(current.crops, 'yieldKg');
  const cropRevenue = sumBy(current.crops, 'revenue');
  const feedCost = sumBy(current.feedConsumption, 'cost');
  const feedRemaining = sumBy(allFeedInventory, 'quantityKg');

  const prevFeedCost = sumBy(previous.feedConsumption, 'cost');
  const prevCropRevenue = sumBy(previous.crops, 'revenue');

  const yieldByCrop = useMemo(
    () => groupByCategory(current.crops, { categoryField: 'crop', valueField: 'yieldKg' }),
    [current.crops]
  );

  const yieldByField = useMemo(
    () => groupByCategory(current.crops, { categoryField: 'field', valueField: 'yieldKg' }),
    [current.crops]
  );

  const feedCostTrend = useMemo(
    () => groupByPeriod(current.feedConsumption, { dateField: 'date', valueField: 'cost', granularity: 'month' }),
    [current.feedConsumption]
  );

  const feedStockLevels = useMemo(
    () =>
      allFeedInventory
        .map((f) => ({ name: f.name, value: f.quantityKg }))
        .sort((a, b) => a.value - b.value),
    [allFeedInventory]
  );

  const lowStockCount = allFeedInventory.filter((f) => f.quantityKg < LOW_STOCK_THRESHOLD).length;

  const feedDepletion = useMemo(
    () => feedDepletionForecast(allFeedInventory, current.feedConsumption).filter((f) => f.daysRemaining !== null),
    [allFeedInventory, current.feedConsumption]
  );

  const money = (v) => KES(v).replace('KES', 'KES ');
  const exportRows = current.crops.map((c) => ({ crop: c.crop, field: c.field, yieldKg: c.yieldKg, revenue: c.revenue, harvestDate: c.harvestDate }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-green-900 mb-1">Crops & Feed</h1>
        <p className="text-sm text-gray-500 mb-6">Harvest yield, crop revenue, and feed inventory for the selected period</p>
      </div>

      <FilterBar
        exportData={exportRows}
        exportFilename="crops-feed"
        reportTitle="Crops & Feed"
        summaryStats={[
          { label: 'Total Harvest Yield', value: `${totalYield.toLocaleString()} kg` },
          { label: 'Crop Revenue', value: money(cropRevenue) },
          { label: 'Feed Cost', value: money(feedCost) },
          { label: 'Feed Remaining', value: `${feedRemaining.toLocaleString()} kg` },
        ]}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Total Harvest Yield" value={`${totalYield.toLocaleString()} kg`} icon={Wheat} />
        <KpiCard
          label="Crop Revenue"
          value={money(cropRevenue)}
          trend={compareEnabled ? percentChange(cropRevenue, prevCropRevenue) : undefined}
          icon={Wallet}
        />
        <KpiCard
          label="Feed Cost"
          value={money(feedCost)}
          trend={compareEnabled ? percentChange(feedCost, prevFeedCost) : undefined}
          trendIsGood={false}
          icon={Wallet}
        />
        <KpiCard
          label="Feed Remaining"
          value={`${feedRemaining.toLocaleString()} kg`}
          icon={AlertTriangle}
          trendIsGood={lowStockCount === 0}
          subtitle={lowStockCount > 0 ? `${lowStockCount} item${lowStockCount > 1 ? 's' : ''} low` : 'stock healthy'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <BreakdownDonut title="Yield by crop" data={yieldByCrop} valueFormatter={(v) => `${v} kg`} />
        <RankingBar title="Yield by field" data={yieldByField} valueFormatter={(v) => `${v} kg`} limit={5} />
      </div>

      <TrendChart title="Feed cost trend" data={feedCostTrend} valueFormatter={money} color="#d97706" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <RankingBar
          title="Feed stock levels (lowest first)"
          data={feedStockLevels}
          valueFormatter={(v) => `${v} kg`}
          limit={6}
        />
        <RankingBar
          title="Feed depletion forecast (days remaining)"
          data={feedDepletion.map((f) => ({ name: f.name, value: f.daysRemaining }))}
          valueFormatter={(v) => `${v} day${v === 1 ? '' : 's'}`}
          limit={6}
        />
      </div>
    </div>
  );
}

export default function ReportsCropsFeed() {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <CropsFeedContent />
    </Suspense>
  );
}