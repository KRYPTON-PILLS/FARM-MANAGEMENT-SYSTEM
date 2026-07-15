import { Suspense, useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { useReportData } from '../hooks/useReportData';
import { useReportsFilters } from '../context/ReportsContext';
import {
  sumBy,
  groupByPeriod,
  groupByCategory,
  mergeSeries,
  forecastSeries,
  forecastFromSeries,
  percentChange,
  KES,
} from '../utils/aggregations';
import FilterBar from '../components/FilterBar';
import KpiCard from '../components/KpiCard';
import DualTrendChart from '../components/DualTrendChart';
import TrendChart from '../components/TrendChart';
import ForecastChart from '../components/ForecastChart';
import BreakdownDonut from '../components/BreakdownDonut';
import RankingBar from '../components/RankingBar';
import ReportSkeleton from '../components/ReportSkeleton';

function FinancialsContent() {
  const { current, previous } = useReportData();
  const { compareEnabled } = useReportsFilters();

  const revenue = sumBy(current.sales, 'amount');
  const expenses = sumBy(current.expenses, 'amount');
  const profit = revenue - expenses;
  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0.0';

  const prevRevenue = sumBy(previous.sales, 'amount');
  const prevExpenses = sumBy(previous.expenses, 'amount');
  const prevProfit = prevRevenue - prevExpenses;

  // ASSUMPTION: sales/expense records expose a `category` field.
  // Adjust the categoryField below if yours is named differently
  // (e.g. `type`, `expenseCategory`, `incomeType`).
  const revenueByCategory = useMemo(
    () => groupByCategory(current.sales, { categoryField: 'category', valueField: 'amount' }),
    [current.sales]
  );
  const expenseByCategory = useMemo(
    () => groupByCategory(current.expenses, { categoryField: 'category', valueField: 'amount' }),
    [current.expenses]
  );

  // ASSUMPTION: sales records expose a `customer` field for top-revenue-source ranking.
  // Falls back to `category` if you'd rather rank by product/category instead of customer.
  const topRevenueSources = useMemo(
    () => groupByCategory(current.sales, { categoryField: 'customer', valueField: 'amount' }),
    [current.sales]
  );

  const revenueVsExpenseTrend = useMemo(() => {
    const rev = groupByPeriod(current.sales, { dateField: 'date', valueField: 'amount', granularity: 'month' });
    const exp = groupByPeriod(current.expenses, { dateField: 'date', valueField: 'amount', granularity: 'month' });
    return mergeSeries(rev, exp);
  }, [current.sales, current.expenses]);

  const profitTrend = useMemo(() => {
    return revenueVsExpenseTrend.map((point) => ({
      key: point.key,
      label: point.label,
      value: point.a - point.b,
    }));
  }, [revenueVsExpenseTrend]);

  const profitForecast = useMemo(
    () => forecastFromSeries(profitTrend, { granularity: 'month', periodsAhead: 3 }),
    [profitTrend]
  );

  const money = (v) => KES(v).replace('KES', 'KES ');
  const exportRows = current.sales.map((s) => ({ date: s.date, amount: s.amount, category: s.category, customer: s.customer }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-green-900 mb-1">Financials</h1>
        <p className="text-sm text-gray-500 mb-6">Revenue, expenses, and profit for the selected period</p>
      </div>

      <FilterBar
        exportData={exportRows}
        exportFilename="financials"
        reportTitle="Financials"
        summaryStats={[
          { label: 'Total Revenue', value: money(revenue) },
          { label: 'Total Expenses', value: money(expenses) },
          { label: 'Net Profit', value: money(profit) },
          { label: 'Profit Margin', value: `${margin}%` },
        ]}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Total Revenue"
          value={money(revenue)}
          trend={compareEnabled ? percentChange(revenue, prevRevenue) : undefined}
          icon={TrendingUp}
        />
        <KpiCard
          label="Total Expenses"
          value={money(expenses)}
          trend={compareEnabled ? percentChange(expenses, prevExpenses) : undefined}
          trendIsGood={false}
          icon={TrendingDown}
        />
        <KpiCard
          label="Net Profit"
          value={money(profit)}
          trend={compareEnabled ? percentChange(profit, prevProfit) : undefined}
          icon={Wallet}
        />
        <KpiCard label="Profit Margin" value={`${margin}%`} icon={PiggyBank} subtitle="of total revenue" />
      </div>

      <DualTrendChart
        title="Revenue vs Expenses"
        data={revenueVsExpenseTrend}
        labelA="Revenue"
        labelB="Expenses"
        colorA="#16a34a"
        colorB="#d97706"
        valueFormatter={money}
      />

      <TrendChart title="Profit trend" data={profitTrend} valueFormatter={money} color="#16a34a" />

      <ForecastChart title="Profit forecast (next 3 months)" data={profitForecast} valueFormatter={money} color="#16a34a" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <BreakdownDonut title="Expense breakdown" data={expenseByCategory} valueFormatter={money} />
        <BreakdownDonut title="Revenue by category" data={revenueByCategory} valueFormatter={money} />
      </div>

      <RankingBar title="Top revenue sources" data={topRevenueSources} valueFormatter={money} limit={5} />
    </div>
  );
}

export default function ReportsFinancials() {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <FinancialsContent />
    </Suspense>
  );
}