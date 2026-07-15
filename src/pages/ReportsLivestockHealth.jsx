import { Suspense, useMemo } from 'react';
import { PawPrint, Skull, HeartPulse, Baby, Syringe } from 'lucide-react';
import { useReportData } from '../hooks/useReportData';
import { useReportsFilters } from '../context/ReportsContext';
import {
  groupByPeriod,
  groupByCategory,
  mergeSeries,
  ageDistribution,
  complianceRate,
  weightGainRanking,
  percentChange,
} from '../utils/aggregations';
import FilterBar from '../components/FilterBar';
import KpiCard from '../components/KpiCard';
import DualTrendChart from '../components/DualTrendChart';
import BreakdownDonut from '../components/BreakdownDonut';
import RankingBar from '../components/RankingBar';
import ProgressRing from '../components/ProgressRing';
import ReportSkeleton from '../components/ReportSkeleton';

function LivestockHealthContent() {
  const { current, previous, allAnimals } = useReportData();
  const { compareEnabled } = useReportsFilters();

  const totalAnimals = allAnimals.length;
  const activeAnimals = allAnimals.filter((a) => a.status === 'active').length;
  const sickAnimals = allAnimals.filter((a) => a.status === 'sick').length;

  const births = current.medical.filter((m) => m.type === 'birth').length; // ASSUMPTION: births tracked as a medical record type
  const deaths = current.mortality.length;
  const birthRate = totalAnimals ? ((births / totalAnimals) * 100).toFixed(1) : '0.0';
  const mortalityRate = totalAnimals ? ((deaths / totalAnimals) * 100).toFixed(1) : '0.0';

  const prevDeaths = previous.mortality.length;

  const vaccinationRecords = current.medical.filter((m) => m.type === 'vaccination');
  const vaccinationCompliance = complianceRate(vaccinationRecords, 'status', 'done');

  // ASSUMPTION: animals have `breed` and `gender` fields.
  const breedDistribution = useMemo(() => groupByCategory(allAnimals, { categoryField: 'breed' }), [allAnimals]);
  const genderDistribution = useMemo(() => groupByCategory(allAnimals, { categoryField: 'gender' }), [allAnimals]);
  const ageBuckets = useMemo(() => ageDistribution(allAnimals, 'birthDate'), [allAnimals]);

  // New animals (purchased/born) vs deaths, per period.
  // ASSUMPTION: animals have a `purchaseDate` field marking when they entered the farm.
  const populationTrend = useMemo(() => {
    const additions = groupByPeriod(allAnimals.filter((a) => a.purchaseDate), {
      dateField: 'purchaseDate',
      granularity: 'month',
    });
    const deathsTrend = groupByPeriod(current.mortality, { dateField: 'date', granularity: 'month' });
    return mergeSeries(additions, deathsTrend);
  }, [allAnimals, current.mortality]);

  const weightGains = useMemo(
    () => weightGainRanking(current.growth, allAnimals),
    [current.growth, allAnimals]
  );

  const exportRows = allAnimals.map((a) => ({
    id: a.id,
    species: a.species,
    breed: a.breed,
    gender: a.gender,
    status: a.status,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-green-900 mb-1">Livestock & Health</h1>
        <p className="text-sm text-gray-500 mb-6">Population, breeding, and health for the selected period</p>
      </div>

      <FilterBar
        exportData={exportRows}
        exportFilename="livestock-health"
        reportTitle="Livestock & Health"
        summaryStats={[
          { label: 'Total Animals', value: totalAnimals },
          { label: 'Sick Animals', value: sickAnimals },
          { label: 'Mortality Rate', value: `${mortalityRate}%` },
          { label: 'Birth Rate', value: `${birthRate}%` },
        ]}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Total Animals" value={totalAnimals.toLocaleString()} icon={PawPrint} subtitle={`${activeAnimals} active`} />
        <KpiCard label="Sick Animals" value={sickAnimals.toLocaleString()} icon={HeartPulse} trendIsGood={false} />
        <KpiCard
          label="Mortality Rate"
          value={`${mortalityRate}%`}
          trend={compareEnabled ? percentChange(deaths, prevDeaths) : undefined}
          trendIsGood={false}
          icon={Skull}
        />
        <KpiCard label="Birth Rate" value={`${birthRate}%`} icon={Baby} />
      </div>

      <DualTrendChart
        title="New animals vs deaths"
        data={populationTrend}
        labelA="New animals"
        labelB="Deaths"
        colorA="#16a34a"
        colorB="#e11d48"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <BreakdownDonut title="Breed distribution" data={breedDistribution} />
        <BreakdownDonut title="Gender distribution" data={genderDistribution} maxSlices={4} />
        <ProgressRing
          label="Vaccination compliance"
          percent={vaccinationCompliance}
          color={vaccinationCompliance >= 80 ? '#16a34a' : vaccinationCompliance >= 50 ? '#d97706' : '#e11d48'}
          subtitle={`${vaccinationRecords.length} scheduled this period`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <RankingBar title="Age distribution" data={ageBuckets} limit={4} />
        <RankingBar title="Top weight gain (kg)" data={weightGains} valueFormatter={(v) => `${v} kg`} limit={5} />
      </div>
    </div>
  );
}

export default function ReportsLivestockHealth() {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <LivestockHealthContent />
    </Suspense>
  );
}