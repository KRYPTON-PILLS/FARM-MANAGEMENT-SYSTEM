import Dexie from "dexie";

const db = new Dexie("FarmAssistantDB");
db.version(1).stores({ kv: "&key" });

export async function loadFarmState() {
  const keys = [
    "animals",
    "crops",
    "transitionLog",
    "pendingNotifications",
    "activities",
    "feedInventory",
    "productionHistory",
    "mortalityRecords",
    "salesRecords",
    "expenseRecords",
    "dismissedAlerts",
  ];

  const entries = await Promise.all(keys.map(async (key) => {
    const value = await db.kv.get(key);
    return [key, value?.value ?? null];
  }));

  return Object.fromEntries(entries);
}

export async function saveFarmState(state) {
  const records = Object.entries(state).map(([key, value]) => ({ key, value: value ?? null }));
  await db.kv.bulkPut(records);
}
