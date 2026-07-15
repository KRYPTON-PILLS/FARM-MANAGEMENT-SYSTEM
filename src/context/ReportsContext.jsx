import { createContext, useContext, useMemo, useState } from 'react';

/**
 * ReportsContext holds UI-level filter state for the Reports module only.
 * It is intentionally separate from FarmContext — FarmContext owns the
 * source-of-truth farm data, this context owns how the user is currently
 * slicing/viewing that data (date range, comparison toggle, animal type, etc).
 */

const DATE_PRESETS = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  lastMonth: 'Last Month',
  quarter: 'This Quarter',
  year: 'This Year',
  custom: 'Custom',
};

function getPresetRange(preset) {
  const now = new Date();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  switch (preset) {
    case 'today': {
      const start = startOfDay(now);
      return { start, end: now };
    }
    case 'week': {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      return { start: startOfDay(start), end: now };
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end: now };
    }
    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { start, end };
    }
    case 'quarter': {
      const q = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), q * 3, 1);
      return { start, end: now };
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start, end: now };
    }
    default:
      return { start: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)), end: now };
  }
}

const ReportsFilterContext = createContext(null);

export function ReportsProvider({ children }) {
  const [preset, setPreset] = useState('month');
  const [customRange, setCustomRange] = useState(null); // { start, end } when preset === 'custom'
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [animalType, setAnimalType] = useState('all'); // 'all' | 'cattle' | 'sheep' | 'goats' | 'pigs' | 'poultry'
  const [searchTerm, setSearchTerm] = useState('');

  const range = useMemo(() => {
    if (preset === 'custom' && customRange) return customRange;
    return getPresetRange(preset);
  }, [preset, customRange]);

  // The equivalent-length prior period, used when compareEnabled is true
  const comparisonRange = useMemo(() => {
    const spanMs = range.end.getTime() - range.start.getTime();
    const end = new Date(range.start.getTime() - 1);
    const start = new Date(end.getTime() - spanMs);
    return { start, end };
  }, [range]);

  const value = {
    preset,
    setPreset,
    customRange,
    setCustomRange,
    range,
    compareEnabled,
    setCompareEnabled,
    comparisonRange,
    animalType,
    setAnimalType,
    searchTerm,
    setSearchTerm,
    DATE_PRESETS,
  };

  return (
    <ReportsFilterContext.Provider value={value}>
      {children}
    </ReportsFilterContext.Provider>
  );
}

export function useReportsFilters() {
  const ctx = useContext(ReportsFilterContext);
  if (!ctx) {
    throw new Error('useReportsFilters must be used within a ReportsProvider');
  }
  return ctx;
}