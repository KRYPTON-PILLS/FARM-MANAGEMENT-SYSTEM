/**
 * SellAnimalModal.jsx
 * 
 * A reusable modal that appears when a farmer marks an animal as "Sold".
 * It captures sale details and automatically adds a record to salesRecords
 * in FarmContext, which feeds directly into Sales.jsx.
 * 
 * Usage in any profile page:
 * 
 *   import SellAnimalModal from "../components/SellAnimalModal";
 * 
 *   const [showSellModal, setShowSellModal] = useState(false);
 * 
 *   // In JSX:
 *   {showSellModal && (
 *     <SellAnimalModal
 *       animal={bull}
 *       species="Cattle"
 *       onConfirm={(saleData) => {
 *         // 1. Update animal status to Sold
 *         updateBull({ ...bull, status: "Sold" });
 *         // 2. Close modal
 *         setShowSellModal(false);
 *       }}
 *       onCancel={() => setShowSellModal(false)}
 *     />
 *   )}
 * 
 *   // Trigger it from the status dropdown or a "Sell Animal" button:
 *   <button onClick={() => setShowSellModal(true)}>
 *     Mark as Sold
 *   </button>
 */

import { useState, useContext } from "react";
import { FarmContext } from "../context/FarmContext";

export default function SellAnimalModal({ animal, species, onConfirm, onCancel }) {
  const { addSalesRecord } = useContext(FarmContext);

  const today = new Date().toISOString().split("T")[0];

  const [saleDate,     setSaleDate]     = useState(today);
  const [salePrice,    setSalePrice]    = useState("");
  const [buyerName,    setBuyerName]    = useState("");
  const [paymentMethod,setPaymentMethod]= useState("Cash");
  const [notes,        setNotes]        = useState("");
  const [saving,       setSaving]       = useState(false);

  // Map animal category/type to species label used by Sales.jsx
  const speciesLabel = species || (() => {
    const cat = animal.category?.toLowerCase();
    if (cat === "cattle")  return "Cattle";
    if (cat === "sheep")   return "Sheep";
    if (cat === "goats")   return "Goat";
    if (cat === "pigs")    return "Pig";
    if (cat === "poultry") return "Poultry";
    return "Other";
  })();

  const handleConfirm = async () => {
    if (!salePrice || !saleDate) return;

    setSaving(true);
    try {
      // Build the sale record exactly as Sales.jsx expects it
      const saleRecord = {
        id:            `sale-${animal.id}-${Date.now()}`,
        source:        "animal",
        animalId:      animal.id,
        animalName:    animal.name,
        species:       speciesLabel,
        animalType:    animal.type
                         ? animal.type.charAt(0).toUpperCase() + animal.type.slice(1)
                         : speciesLabel,
        breed:         animal.breed || "",
        saleDate,
        salePrice:     parseFloat(salePrice),
        purchasePrice: animal.purchasePrice ? parseFloat(animal.purchasePrice) : null,
        profit:        animal.purchasePrice
                         ? parseFloat(salePrice) - parseFloat(animal.purchasePrice)
                         : null,
        buyer:         buyerName || "—",
        paymentMethod,
        notes,
      };

      // Add to FarmContext salesRecords → automatically shows in Sales.jsx
      addSalesRecord(saleRecord);

      // Call parent's onConfirm so it can update the animal status to "Sold"
      onConfirm(saleRecord);

    } catch (err) {
      console.error("Failed to record sale:", err);
    } finally {
      setSaving(false);
    }
  };

  const profitEstimate = salePrice && animal.purchasePrice
    ? parseFloat(salePrice) - parseFloat(animal.purchasePrice)
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Sell {animal.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {speciesLabel} · {animal.type} {animal.breed ? `· ${animal.breed}` : ""}
            </p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {/* FORM */}
        <div className="p-5 space-y-4">

          {/* Animal summary */}
          <div className="bg-green-50 rounded-xl p-3 flex items-center gap-3">
            {animal.image && (
              <img src={animal.image} alt={animal.name}
                className="w-14 h-14 rounded-xl object-cover shrink-0" />
            )}
            <div>
              <p className="font-bold text-green-900">{animal.name}</p>
              <p className="text-xs text-green-700">
                {animal.age ? `Age: ${animal.age}` : ""}
                {animal.weight ? ` · ${animal.weight} kg` : ""}
              </p>
              {animal.purchasePrice && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Bought for: KES {parseFloat(animal.purchasePrice).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Sale Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
              Sale Date *
            </label>
            <input
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="border-2 border-gray-100 focus:border-green-400 rounded-xl px-4 py-2.5 text-sm w-full outline-none transition"
            />
          </div>

          {/* Sale Price */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
              Sale Price (KES) *
            </label>
            <input
              type="number"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="e.g. 85000"
              className="border-2 border-gray-100 focus:border-green-400 rounded-xl px-4 py-2.5 text-sm w-full outline-none transition"
            />
            {/* Live profit/loss estimate */}
            {profitEstimate !== null && (
              <p className={`text-xs font-semibold mt-1.5 ${profitEstimate >= 0 ? "text-green-600" : "text-red-500"}`}>
                {profitEstimate >= 0 ? "✅ Profit" : "⚠️ Loss"}: KES {Math.abs(profitEstimate).toLocaleString()}
              </p>
            )}
          </div>

          {/* Buyer Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
              Buyer Name
            </label>
            <input
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="e.g. John Kamau"
              className="border-2 border-gray-100 focus:border-green-400 rounded-xl px-4 py-2.5 text-sm w-full outline-none transition"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="border-2 border-gray-100 focus:border-green-400 rounded-xl px-4 py-2.5 text-sm w-full outline-none transition bg-white"
            >
              <option>Cash</option>
              <option>M-Pesa</option>
              <option>Bank Transfer</option>
              <option>Cheque</option>
              <option>Other</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details about the sale..."
              className="border-2 border-gray-100 focus:border-green-400 rounded-xl px-4 py-2.5 text-sm w-full outline-none transition resize-none h-20"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleConfirm}
              disabled={!salePrice || !saleDate || saving}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition text-sm"
            >
              {saving ? "Recording..." : "✅ Confirm Sale"}
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition text-sm"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            This will mark <strong>{animal.name}</strong> as Sold and add a record to your Sales page.
          </p>
        </div>
      </div>
    </div>
  );
}
