import { Suspense, useMemo } from 'react';
import { Milk, TrendingUp, Award, CalendarDays } from 'lucide-react';
import { useReportData } from '../hooks/useReportData';
import { useReportsFilters } from '../context/ReportsContext';
import {
  sumBy,
  groupByPeriod,
  groupByCategory,
  sumByAnimal,
  percentChange,
} from '../utils/aggregations';
import FilterBar from '../components/FilterBar';
import KpiCard from '../components/KpiCard';
import TrendChart from '../components/TrendChart';
import BreakdownDonut from '../components/BreakdownDonut';
import RankingBar from '../components/RankingBar';
import ReportSkeleton from '../components/ReportSkeleton';

// ASSUMPTION: productionRecords have a `type` field ('milk' | 'egg' | 'wool' | 'honey' | 'meat')
// and a `quantity` field. Units differ by type in real life (litres vs count vs kg) — this
// page treats `quantity` as a single number per record; if you store units separately,
// group the KPIs/charts per-type instead of summing across types.

function ProductionContent() {
  const { current, previous, allAnimals } = useReportData();
  const { compareEnabled } = useReportsFilters();

  const totalProduction = sumBy(current.production, 'quantity');
  const prevProduction = previous ? sumBy(previous.production, 'quantity') : null;

  const dayCount = current.production.length
    ? new Set(current.production.map((p) => new Date(p.date).toDateString())).size || 1
    : 1;
  const avgDaily = (totalProduction / dayCount).toFixed(1);

  const productionByType = useMemo(
    () => groupByCategory(current.production, { categoryField: 'type', valueField: 'quantity' }),
    [current.production]
  );

  const topProducers = useMemo(
    () => sumByAnimal(current.production, allAnimals, { valueField: 'quantity' }),
    [current.production, allAnimals]
  );

  const topProducerName = topProducers[0]?.name || '—';

  const productionTrend = useMemo(
    () => groupByPeriod(current.production, { dateField: 'date', valueField: 'quantity', granularity: 'month' }),
    [current.production]
  );

  const exportRows = current.production.map((p) => ({ date: p.date, type: p.type, quantity: p.quantity, animalId: p.animalId }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-green-900 mb-1">Production</h1>
        <p className="text-sm text-gray-500 mb-6">Milk, egg, wool, and other production output for the selected period</p>
      </div>

      <FilterBar
        exportData={exportRows}
        exportFilename="production"
        reportTitle="Production"
        summaryStats={[
          { label: 'Total Production', value: totalProduction },
          { label: 'Average Daily', value: avgDaily },
          { label: 'Top Producer', value: topProducerName },
          { label: 'Production Types', value: productionByType.length },
        ]}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Total Production"
          value={totalProduction.toLocaleString()}
          trend={compareEnabled && prevProduction !== null ? percentChange(totalProduction, prevProduction) : undefined}
          icon={Milk}
        />
        <KpiCard label="Average Daily" value={avgDaily} icon={CalendarDays} subtitle="per active day" />
        <KpiCard label="Top Producer" value={topProducerName} icon={Award} />
        <KpiCard label="Production Types" value={productionByType.length} icon={TrendingUp} subtitle="tracked this period" />
      </div>

      <TrendChart title="Production trend" data={productionTrend} color="#0891b2" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <BreakdownDonut title="Production by type" data={productionByType} />
        <RankingBar title="Top producing animals" data={topProducers} limit={5} />
      </div>
    </div>
  );
}

export default function ReportsProduction() {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <ProductionContent />
    </Suspense>
  );
}