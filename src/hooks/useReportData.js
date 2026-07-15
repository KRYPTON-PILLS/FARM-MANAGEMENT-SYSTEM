import { useMemo } from 'react';
// ADJUST THIS IMPORT to match your actual context path/hook name.
import { useFarm } from '../context/FarmContext';
import { useReportsFilters } from '../context/ReportsContext';
import { filterByRange } from '../utils/aggregations';

/**
 * ============================================================================
 * ASSUMPTIONS ABOUT YOUR DATA SHAPE — please confirm/adjust these field names.
 * This is the ONLY file that should need edits to match your real FarmContext.
 * ============================================================================
 *
 * useFarm() is expected to expose (rename below to match reality):
 *   animals: Array<{ id, species, breed, gender, status, birthDate, weight, purchaseDate }>
 *   salesRecords: Array<{ id, date, amount, category, animalId, customer, type: 'animal'|'product' }>
 *   expenseRecords: Array<{ id, date, amount, category }>
 *   productionRecords: Array<{ id, date, species, type: 'milk'|'egg'|'wool'|'honey', quantity, animalId }>
 *   medicalRecords: Array<{ id, date, animalId, type: 'vaccination'|'treatment', dueDate, status }>
 *   mortalityRecords: Array<{ id, date, animalId, cause }>
 *   cropRecords: Array<{ id, field, crop, plantedDate, harvestDate, yieldKg, revenue }>
 *   feedInventory: Array<{ id, name, quantityKg, costPerKg, lastRestocked }>
 *   activities: Array<{ id, title, dueDate, completed, assignedTo }>
 *   growthRecords: Array<{ id, animalId, date, weightKg }>
 *   feedConsumption: Array<{ id, date, feedItemId, feedName, quantityKg, cost }>
 *   medicineInventory: Array<{ id, name, quantity, unit, costPerUnit, lastRestocked }>
 *   equipmentInventory: Array<{ id, name, quantity, unit, costPerUnit, condition }>
 *
 * If your context uses different names, only the destructuring line below
 * and the field references inside this hook need to change — every
 * component downstream just consumes the normalized shape this hook returns.
 */

export function useReportData() {
  const {
    animals = [],
    salesRecords = [],
    expenseRecords = [],
    productionRecords = [],
    medicalRecords = [],
    mortalityRecords = [],
    cropRecords = [],
    feedInventory = [],
    activities = [],
    growthRecords = [],
    feedConsumption = [],
    medicineInventory = [],
    equipmentInventory = [],
  } = useFarm();

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