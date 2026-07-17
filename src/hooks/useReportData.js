import { useMemo } from 'react';
// ADJUST THIS IMPORT to match your actual context path/hook name.
import { useFarm } from '../context/FarmContext';
import { useReportsFilters } from '../context/ReportsContext';
import { filterByRange } from '../utils/aggregations';

/**
 * ============================================================================
 * CONFIRMED against your actual FarmContext.jsx (as of the file you shared):
 * ============================================================================
 *
 *   animals            ✓ confirmed (array of animal objects)
 *   salesRecords       ✓ confirmed — { id, date, ...whatever addSalesRecord's caller passes }
 *   expenseRecords     ✓ confirmed — { id, date, ...whatever addExpenseRecord's caller passes }
 *   mortalityRecords   ✓ confirmed
 *   feedInventory      ✓ confirmed
 *   activities         ✓ confirmed — { id, createdAt, completed, ...caller-supplied fields }
 *   productionHistory  ✓ confirmed — NOTE: renamed from `productionRecords`, the name
 *                        this file originally assumed
 *   crops              ✓ confirmed to exist, but only as a generic array (`setCrops`) —
 *                        the specific fields this hook reads (`harvestDate`, `yieldKg`,
 *                        `revenue`, `field`, `crop`) are UNCONFIRMED. If your actual crop
 *                        objects use different field names, update the `crops:` line
 *                        below and every `crops`-related calculation in the Crops & Feed
 *                        report page.
 *
 * NOT PRESENT in FarmContext — these were assumptions this hook made in earlier
 * rounds that turned out to be wrong once the real file was shared:
 *
 *   medicalRecords       ✗ no flat collection. Health/vaccination data (if you track
 *                          it) most likely lives nested per-animal — the transition
 *                          engine in FarmContext references `a.medicalLog` on each
 *                          animal object. Until you confirm that shape, vaccination
 *                          compliance / births-this-period on the Livestock & Health
 *                          report will show 0, not an error — silently empty, not broken.
 *   feedConsumption      ✗ not present anywhere. The Crops & Feed report's "feed cost
 *                          trend" chart will always render empty until this exists
 *                          somewhere (either a new FarmContext collection, or derived
 *                          from something else you do track).
 *   medicineInventory    ✗ not present. Activity & Inventory's medicine valuation/
 *   equipmentInventory     low-stock sections will always show zero.
 *
 * growthRecords is a partial fix, not a full one: animals DO carry a nested
 * `growthRecords` array per the transition engine (`a.growthRecords||[]`), so
 * this hook now flattens that across all animals with the animal's id attached
 * — but the exact shape of each entry (assumed `{ date, weight }`) is a guess,
 * since I haven't seen an actual entry, only the field name's existence.
 */

export function useReportData() {
  const {
    animals = [],
    salesRecords = [],
    expenseRecords = [],
    productionHistory: productionRecords = [],
    mortalityRecords = [],
    crops: cropRecords = [],
    feedInventory = [],
    activities = [],
    // The four below are NOT in your FarmContext — kept here with safe
    // defaults so this hook doesn't crash, and so nothing needs to change
    // structurally the moment you do add them. See the comment block above.
    medicalRecords = [],
    feedConsumption = [],
    medicineInventory = [],
    equipmentInventory = [],
  } = useFarm();

  // Derived, not destructured: flattens each animal's nested growthRecords
  // array into one list with animalId attached, since FarmContext doesn't
  // expose growth data as its own top-level collection.
  const growthRecords = animals.flatMap((a) =>
    (a.growthRecords || []).map((g) => ({ ...g, animalId: a.id }))
  );

  const { range, comparisonRange, animalType } = useReportsFilters();

  return useMemo(() => {
    const bySpecies = (list, field = 'species') =>
      animalType === 'all' ? list : list.filter((r) => r[field] === animalType);

    const current = {
      animals: bySpecies(animals),
      sales: filterByRange(bySpecies(salesRecords), 'date', range),
      expenses: filterByRange(expenseRecords, 'date', range),
      production: filterByRange(bySpecies(productionRecords), 'date', range),
      medical: filterByRange(bySpecies(medicalRecords), 'date', range),
      mortality: filterByRange(bySpecies(mortalityRecords), 'date', range),
      crops: filterByRange(cropRecords, 'harvestDate', range),
      activities: filterByRange(activities, 'dueDate', range),
      feedInventory: bySpecies(feedInventory),
      growth: filterByRange(growthRecords, 'date', range),
      feedConsumption: filterByRange(feedConsumption, 'date', range),
    };

    // Always computed (not gated on compareEnabled) — insights and forecast
    // panels need last-period figures regardless of whether the user has the
    // chart comparison overlay switched on. compareEnabled still controls
    // whether TrendChart/DualTrendChart visually render the overlay.
    const previous = {
      sales: filterByRange(bySpecies(salesRecords), 'date', comparisonRange),
      expenses: filterByRange(expenseRecords, 'date', comparisonRange),
      production: filterByRange(bySpecies(productionRecords), 'date', comparisonRange),
      mortality: filterByRange(bySpecies(mortalityRecords), 'date', comparisonRange),
      crops: filterByRange(cropRecords, 'harvestDate', comparisonRange),
      feedConsumption: filterByRange(feedConsumption, 'date', comparisonRange),
    };

    // Alerts feed for the Overview page — items needing attention right now.
    const attentionItems = [
      ...medicalRecords
        .filter((m) => m.type === 'vaccination' && m.status !== 'done' && new Date(m.dueDate) <= new Date())
        .map((m) => ({ id: m.id, kind: 'vaccination', label: 'Vaccination overdue', dueDate: m.dueDate })),
      ...feedInventory
        .filter((f) => f.quantityKg < 50) // adjust threshold to your low-stock rule
        .map((f) => ({ id: f.id, kind: 'feed', label: `${f.name} running low`, quantityKg: f.quantityKg })),
      ...activities
        .filter((a) => !a.completed && new Date(a.dueDate) < new Date())
        .map((a) => ({ id: a.id, kind: 'activity', label: `${a.title} overdue`, dueDate: a.dueDate })),
    ];

    return {
      current,
      previous,
      attentionItems,
      allAnimals: animals,
      allFeedInventory: feedInventory,
      allMedicineInventory: medicineInventory,
      allEquipmentInventory: equipmentInventory,
    };
  }, [
    animals,
    salesRecords,
    expenseRecords,
    productionRecords,
    medicalRecords,
    mortalityRecords,
    cropRecords,
    feedInventory,
    activities,
    growthRecords,
    feedConsumption,
    medicineInventory,
    equipmentInventory,
    range,
    comparisonRange,
    animalType,
  ]);
}