import { Suspense, useMemo } from 'react';
import { PawPrint, Wallet, Skull, Baby } from 'lucide-react';
import { useReportData } from '../hooks/useReportData';
import { useReportsFilters } from '../context/ReportsContext';
import { sumBy, groupByPeriod, percentChange, KES } from '../utils/aggregations';
import FilterBar from '../components/FilterBar';
import KpiCard from '../components/KpiCard';
import TrendChart from '../components/TrendChart';
import AttentionFeed from '../components/AttentionFeed';
import ReportSkeleton from '../components/ReportSkeleton';

function OverviewContent() {
  const { current, previous, attentionItems, allAnimals } = useReportData();
  const { compareEnabled } = useReportsFilters();

  const revenue = sumBy(current.sales, 'amount');
  const expenses = sumBy(current.expenses, 'amount');
  const profit = revenue - expenses;

  const prevRevenue = previous ? sumBy(previous.sales, 'amount') : null;
  const prevExpenses = previous ? sumBy(previous.expenses, 'amount') : null;
  const prevProfit = previous ? prevRevenue - prevExpenses : null;

  const activeAnimals = allAnimals.filter((a) => a.status === 'active').length;
  const sickAnimals = allAnimals.filter((a) => a.status === 'sick').length;
  const mortalityCount = current.mortality.length;
  const mortalityRate = allAnimals.length ? ((mortalityCount / allAnimals.length) * 100).toFixed(1) : '0.0';

  const revenueTrend = useMemo(
    () =>
      groupByPeriod(current.sales, { dateField: 'date', valueField: 'amount', granularity: 'month' }).map(
        (bucket, i, arr) => ({
          ...bucket,
          comparisonValue: compareEnabled && previous ? groupByPeriod(previous.sales, {
            dateField: 'date', valueField: 'amount', granularity: 'month',
          })[i]?.value : undefined,
        })
      ),
    [current.sales, previous, compareEnabled]
  );

  const exportRows = current.sales.map((s) => ({ date: s.date, amount: s.amount, category: s.category }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-green-900 mb-1">Overview</h1>
        <p className="text-sm text-gray-500 mb-6">A snapshot of how the farm is doing right now</p>
      </div>

      <FilterBar exportData={exportRows} exportFilename="overview" />

      <AttentionFeed items={attentionItems} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Net Profit"
          value={KES(profit)}
          trend={compareEnabled && prevProfit !== null ? percentChange(profit, prevProfit) : undefined}
          icon={Wallet}
        />
        <KpiCard
          label="Active Animals"
          value={activeAnimals.toLocaleString()}
          icon={PawPrint}
          subtitle={`${allAnimals.length.toLocaleString()} total`}
        />
        <KpiCard
          label="Mortality Rate"
          value={`${mortalityRate}%`}
          trend={{ direction: mortalityCount > 0 ? 'up' : 'flat', percent: Number(mortalityRate) }}
          trendIsGood={false}
          icon={Skull}
        />
        <KpiCard
          label="Sick Animals"
          value={sickAnimals.toLocaleString()}
          trendIsGood={false}
          icon={Baby}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TrendChart
          title="Revenue trend"
          data={revenueTrend}
          valueFormatter={(v) => KES(v).replace('KES', 'KES ')}
          color="#15803d"
          showComparison={compareEnabled}
        />
        <TrendChart
          title="Expense trend"
          data={groupByPeriod(current.expenses, { dateField: 'date', valueField: 'amount', granularity: 'month' })}
          valueFormatter={(v) => KES(v).replace('KES', 'KES ')}
          color="#d97706"
        />
      </div>
    </div>
  );
}

export default function OverviewPage() {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <OverviewContent />
    </Suspense>
  );
}