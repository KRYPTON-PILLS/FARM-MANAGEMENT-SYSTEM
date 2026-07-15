import { useReportsFilters } from '../context/ReportsContext';
import ExportMenu from './ExportMenu';

const SPECIES_OPTIONS = [
  { value: 'all', label: 'All animals' },
  { value: 'cattle', label: 'Cattle' },
  { value: 'sheep', label: 'Sheep' },
  { value: 'goats', label: 'Goats' },
  { value: 'pigs', label: 'Pigs' },
  { value: 'poultry', label: 'Poultry' },
];

export default function FilterBar({ exportData, exportFilename = 'report', reportTitle, summaryStats }) {
  const { preset, setPreset, DATE_PRESETS, compareEnabled, setCompareEnabled, animalType, setAnimalType } =
    useReportsFilters();

  return (
    <div className="flex flex-wrap items-center gap-2 bg-white p-4 rounded-xl shadow">
      <select
        value={preset}
        onChange={(e) => setPreset(e.target.value)}
        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-green-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
      >
        {Object.entries(DATE_PRESETS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      <select
        value={animalType}
        onChange={(e) => setAnimalType(e.target.value)}
        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-green-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
      >
        {SPECIES_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-green-900">
        <input
          type="checkbox"
          checked={compareEnabled}
          onChange={(e) => setCompareEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-gray-200 text-green-600 focus:ring-green-600"
        />
        Compare to previous period
      </label>

      <div className="ml-auto">
        <ExportMenu data={exportData} filename={exportFilename} reportTitle={reportTitle} summaryStats={summaryStats} />
      </div>
    </div>
  );
}