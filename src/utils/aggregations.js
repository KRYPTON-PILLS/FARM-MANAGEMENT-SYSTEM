/**
 * Pure aggregation helpers used across all report pages.
 * None of these know anything about Firestore/IndexedDB/FarmContext —
 * they just operate on arrays of records with a date field.
 */

/** Filters records to those with `dateField` inside [start, end] inclusive. */
export function filterByRange(records, dateField, range) {
  if (!range || !range.start || !range.end) return records;
  const s = range.start.getTime();
  const e = range.end.getTime();
  return records.filter((r) => {
    const t = new Date(r[dateField]).getTime();
    return t >= s && t <= e;
  });
}

/**
 * Groups records into buckets by day/week/month and sums a numeric field.
 * granularity: 'day' | 'week' | 'month'
 * Returns an array sorted chronologically: [{ label, key, value }]
 */
export function groupByPeriod(records, { dateField, valueField, granularity = 'month' }) {
  const buckets = new Map();

  for (const r of records) {
    const d = new Date(r[dateField]);
    let key;
    let label;

    if (granularity === 'day') {
      key = d.toISOString().slice(0, 10);
      label = d.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
    } else if (granularity === 'week') {
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      key = weekStart.toISOString().slice(0, 10);
      label = `Wk of ${weekStart.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}`;
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      label = d.toLocaleDateString('en-KE', { month: 'short', year: '2-digit' });
    }

    const existing = buckets.get(key) || { key, label, value: 0 };
    existing.value += valueField ? Number(r[valueField] || 0) : 1;
    buckets.set(key, existing);
  }

  return Array.from(buckets.values()).sort((a, b) => (a.key > b.key ? 1 : -1));
}

/** Sums a numeric field across records. */
export function sumBy(records, valueField) {
  return records.reduce((acc, r) => acc + Number(r[valueField] || 0), 0);
}

/** Simple moving average over a numeric series (array of numbers). */
export function movingAverage(series, windowSize = 3) {
  return series.map((_, i) => {
    const start = Math.max(0, i - windowSize + 1);
    const window = series.slice(start, i + 1);
    return window.reduce((a, b) => a + b, 0) / window.length;
  });
}

/**
 * Percent change between current and previous totals.
 * Returns { direction: 'up' | 'down' | 'flat', percent }
 */
export function percentChange(current, previous) {
  if (!previous) {
    return { direction: current > 0 ? 'up' : 'flat', percent: current > 0 ? 100 : 0 };
  }
  const percent = ((current - previous) / Math.abs(previous)) * 100;
  return {
    direction: percent > 0.5 ? 'up' : percent < -0.5 ? 'down' : 'flat',
    percent: Math.abs(Math.round(percent * 10) / 10),
  };
}

/** Groups records by a categorical field and sums a value (for donut/bar breakdowns). */
export function groupByCategory(records, { categoryField, valueField }) {
  const buckets = new Map();
  for (const r of records) {
    const key = r[categoryField] || 'Uncategorized';
    const existing = buckets.get(key) || 0;
    buckets.set(key, existing + (valueField ? Number(r[valueField] || 0) : 1));
  }
  return Array.from(buckets.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/** Collapses small slices into an "Other" bucket, keeping the chart readable. */
export function capSlices(data, maxSlices = 5) {
  if (data.length <= maxSlices) return data;
  const top = data.slice(0, maxSlices - 1);
  const rest = data.slice(maxSlices - 1);
  const otherValue = rest.reduce((acc, d) => acc + d.value, 0);
  return [...top, { name: 'Other', value: otherValue }];
}

/** Simple linear regression forecast — used by Phase 5 forecasting utils, exposed here as base math. */
export function linearForecast(series, stepsAhead = 3) {
  const n = series.length;
  if (n < 2) return [];
  const xMean = (n - 1) / 2;
  const yMean = series.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  series.forEach((y, x) => {
    num += (x - xMean) * (y - yMean);
    den += (x - xMean) ** 2;
  });
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  return Array.from({ length: stepsAhead }, (_, i) => {
    const x = n + i;
    return Math.max(0, slope * x + intercept);
  });
}

/**
 * Merges two groupByPeriod() outputs (e.g. revenue and expenses) into one
 * dataset keyed by period label, so a single chart can plot both series.
 * Returns: [{ label, a: number, b: number }]
 */
export function mergeSeries(seriesA, seriesB, keyA = 'a', keyB = 'b') {
  const map = new Map();
  for (const point of seriesA) {
    map.set(point.key, { key: point.key, label: point.label, [keyA]: point.value, [keyB]: 0 });
  }
  for (const point of seriesB) {
    const existing = map.get(point.key);
    if (existing) {
      existing[keyB] = point.value;
    } else {
      map.set(point.key, { key: point.key, label: point.label, [keyA]: 0, [keyB]: point.value });
    }
  }
  return Array.from(map.values()).sort((a, b) => (a.key > b.key ? 1 : -1));
}

/**
 * Buckets animals into age ranges based on a birthDate field.
 * Returns [{ name, value }] shaped for BreakdownDonut / RankingBar.
 */
export function ageDistribution(animals, dateField = 'birthDate') {
  const buckets = { '0–6 mo': 0, '6–12 mo': 0, '1–2 yr': 0, '2+ yr': 0 };
  const now = new Date();
  for (const a of animals) {
    if (!a[dateField]) continue;
    const months = (now - new Date(a[dateField])) / (1000 * 60 * 60 * 24 * 30.44);
    if (months < 6) buckets['0–6 mo']++;
    else if (months < 12) buckets['6–12 mo']++;
    else if (months < 24) buckets['1–2 yr']++;
    else buckets['2+ yr']++;
  }
  return Object.entries(buckets).map(([name, value]) => ({ name, value }));
}

/** Percent of records where statusField === doneValue. */
export function complianceRate(records, statusField = 'status', doneValue = 'done') {
  if (records.length === 0) return 0;
  const done = records.filter((r) => r[statusField] === doneValue).length;
  return Math.round((done / records.length) * 100);
}

/**
 * Net weight change per animal within the given growth records, joined
 * against the animals list for display names. Returns top N descending,
 * shaped as [{ name, value }] for RankingBar.
 */
export function weightGainRanking(growthRecords, animals, { animalIdField = 'animalId', weightField = 'weightKg', nameField = 'name' } = {}) {
  const byAnimal = new Map();
  for (const r of growthRecords) {
    const list = byAnimal.get(r[animalIdField]) || [];
    list.push(r);
    byAnimal.set(r[animalIdField], list);
  }

  const animalById = new Map(animals.map((a) => [a.id, a]));

  const results = [];
  for (const [animalId, records] of byAnimal.entries()) {
    if (records.length < 2) continue;
    const sorted = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
    const gain = sorted[sorted.length - 1][weightField] - sorted[0][weightField];
    const animal = animalById.get(animalId);
    const name = animal ? animal[nameField] || animal.tagNumber || animalId : animalId;
    results.push({ name: String(name), value: Math.round(gain * 10) / 10 });
  }

  return results.sort((a, b) => b.value - a.value);
}

/**
 * Sums a value field per animal (e.g. total milk yield per animal) and joins
 * against the animals list for display names. Returns top-N descending,
 * shaped as [{ name, value }] for RankingBar.
 */
export function sumByAnimal(records, animals, { animalIdField = 'animalId', valueField = 'quantity', nameField = 'name' } = {}) {
  const totals = new Map();
  for (const r of records) {
    const key = r[animalIdField];
    totals.set(key, (totals.get(key) || 0) + Number(r[valueField] || 0));
  }
  const animalById = new Map(animals.map((a) => [a.id, a]));
  return Array.from(totals.entries())
    .map(([animalId, value]) => {
      const animal = animalById.get(animalId);
      const name = animal ? animal[nameField] || animal.tagNumber || animalId : animalId;
      return { name: String(name), value: Math.round(value * 10) / 10 };
    })
    .sort((a, b) => b.value - a.value);
}

/**
 * Internal: advances a period key/date forward by n periods for label generation.
 */
function addPeriod(date, granularity, n) {
  const d = new Date(date);
  if (granularity === 'month') d.setMonth(d.getMonth() + n);
  else if (granularity === 'week') d.setDate(d.getDate() + 7 * n);
  else d.setDate(d.getDate() + n);
  return d;
}

/**
 * Core forecast-blending logic, shared by forecastSeries() (raw records) and
 * forecastFromSeries() (an already-grouped series, e.g. a derived profit trend).
 */
function buildForecastFromHistorical(historical, { granularity = 'month', periodsAhead = 3 } = {}) {
  if (historical.length === 0) return [];

  const values = historical.map((h) => h.value);
  const predicted = linearForecast(values, periodsAhead);

  const combined = historical.map((h) => ({ label: h.label, value: h.value, forecastValue: null }));
  combined[combined.length - 1].forecastValue = combined[combined.length - 1].value;

  const lastKeyAsDate = granularity === 'month' ? new Date(`${historical[historical.length - 1].key}-01`) : new Date(historical[historical.length - 1].key);

  predicted.forEach((value, i) => {
    const futureDate = addPeriod(lastKeyAsDate, granularity, i + 1);
    const label =
      granularity === 'month'
        ? futureDate.toLocaleDateString('en-KE', { month: 'short', year: '2-digit' })
        : futureDate.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
    combined.push({ label, value: null, forecastValue: Math.round(value) });
  });

  return combined;
}

/**
 * Builds a chart-ready series that blends actuals with a linear-regression
 * forecast for the next `periodsAhead` periods, starting from raw records.
 * The last actual point is duplicated into `forecastValue` so the projected
 * (dashed) line connects continuously from the solid actual line — see
 * ForecastChart. For a series you've already grouped/derived (e.g. profit
 * = revenue - expenses per period), use forecastFromSeries() instead.
 *
 * Returns: [{ label, value: number|null, forecastValue: number|null }]
 */
export function forecastSeries(records, { dateField, valueField, granularity = 'month', periodsAhead = 3 }) {
  const historical = groupByPeriod(records, { dateField, valueField, granularity });
  return buildForecastFromHistorical(historical, { granularity, periodsAhead });
}

/**
 * Same output shape as forecastSeries(), but starting from a series you've
 * already computed (e.g. a profit trend derived via mergeSeries). Each item
 * needs { key, label, value }.
 */
export function forecastFromSeries(historicalSeries, { granularity = 'month', periodsAhead = 3 } = {}) {
  return buildForecastFromHistorical(historicalSeries, { granularity, periodsAhead });
}

/**
 * Estimates days remaining for each feed inventory item based on average
 * daily consumption over the trailing `windowDays`. Items with no logged
 * consumption in that window return daysRemaining: null (can't forecast,
 * not necessarily fine — surface separately rather than treating as "OK").
 */
export function feedDepletionForecast(feedInventory, feedConsumption, { windowDays = 30 } = {}) {
  const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const consumedByItem = new Map();

  for (const c of feedConsumption) {
    if (new Date(c.date) < windowStart) continue;
    const key = c.feedItemId || c.feedName;
    consumedByItem.set(key, (consumedByItem.get(key) || 0) + Number(c.quantityKg || 0));
  }

  return feedInventory
    .map((item) => {
      const consumed = consumedByItem.get(item.id) ?? consumedByItem.get(item.name) ?? 0;
      const avgDaily = consumed / windowDays;
      const daysRemaining = avgDaily > 0 ? Math.round(item.quantityKg / avgDaily) : null;
      return { name: item.name, quantityKg: item.quantityKg, daysRemaining };
    })
    .sort((a, b) => (a.daysRemaining ?? Infinity) - (b.daysRemaining ?? Infinity));
}

/**
 * Rule-based (template) insight generator — NOT an AI/LLM call. Produces
 * short plain-language observations from numbers already computed on the
 * page. This is the Phase 5 default; if/when the Anthropic API question is
 * decided, these can be swapped for or supplemented by LLM-narrated insights
 * without changing anything that consumes generateRuleBasedInsights' output
 * shape (InsightsPanel just renders { id, tone, text } either way).
 */
export function generateRuleBasedInsights({ revenue, prevRevenue, expenses, prevExpenses, mortalityCount, prevMortalityCount, feedDepletion = [] }) {
  const insights = [];

  if (prevRevenue != null && prevRevenue > 0) {
    const { direction, percent } = percentChange(revenue, prevRevenue);
    if (direction !== 'flat') {
      insights.push({
        id: 'revenue-trend',
        tone: direction === 'up' ? 'positive' : 'warning',
        text: `Revenue ${direction === 'up' ? 'rose' : 'fell'} ${percent}% compared to the previous period.`,
      });
    }
  }

  if (prevExpenses != null && prevExpenses > 0) {
    const { direction, percent } = percentChange(expenses, prevExpenses);
    if (direction === 'up' && percent > 10) {
      insights.push({
        id: 'expense-trend',
        tone: 'warning',
        text: `Expenses climbed ${percent}% compared to the previous period — worth a look at what drove it.`,
      });
    }
  }

  if (prevMortalityCount != null && mortalityCount > prevMortalityCount) {
    insights.push({
      id: 'mortality-trend',
      tone: 'warning',
      text: `Mortality is up compared to the previous period (${prevMortalityCount} → ${mortalityCount}).`,
    });
  }

  const urgent = feedDepletion.filter((f) => f.daysRemaining !== null && f.daysRemaining <= 7);
  if (urgent.length > 0) {
    insights.push({
      id: 'feed-depletion',
      tone: 'warning',
      text: `${urgent[0].name} is projected to run out in about ${urgent[0].daysRemaining} day${urgent[0].daysRemaining === 1 ? '' : 's'}${urgent.length > 1 ? `, along with ${urgent.length - 1} other item${urgent.length > 2 ? 's' : ''}` : ''}.`,
    });
  }

  if (insights.length === 0) {
    insights.push({ id: 'steady', tone: 'neutral', text: 'Nothing unusual to flag for this period — figures are holding steady.' });
  }

  return insights;
}

/**
 * Sums quantity * cost across an inventory array.
 */
export function inventoryValuation(items, { quantityField = 'quantity', costField = 'costPerUnit' } = {}) {
  return items.reduce((acc, i) => acc + Number(i[quantityField] || 0) * Number(i[costField] || 0), 0);
}

/**
 * Combines several inventory collections (feed, medicine, equipment) into a
 * single category breakdown by total valuation — shaped for BreakdownDonut.
 */
export function combinedInventoryBreakdown(categories) {
  // categories: [{ name: 'Feed', items, quantityField, costField }, ...]
  return categories
    .map(({ name, items, quantityField, costField }) => ({
      name,
      value: inventoryValuation(items, { quantityField, costField }),
    }))
    .filter((c) => c.value > 0);
}

export const KES = (value) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(
    value || 0
  );