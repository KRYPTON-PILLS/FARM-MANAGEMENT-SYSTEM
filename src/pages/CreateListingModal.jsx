import { useState } from "react";
import "./CreateListingModal.css";

const COUNTIES = [
  "Baringo","Bomet","Bungoma","Busia","Elgeyo-Marakwet","Embu","Garissa",
  "Homa Bay","Isiolo","Kajiado","Kakamega","Kericho","Kiambu","Kilifi","Kirinyaga",
  "Kisii","Kisumu","Kitui","Kwale","Laikipia","Lamu","Machakos","Makueni","Mandera",
  "Marsabit","Meru","Migori","Mombasa","Murang'a","Nairobi","Nakuru","Nandi","Narok",
  "Nyamira","Nyandarua","Nyeri","Samburu","Siaya","Taita-Taveta","Tana River",
  "Tharaka-Nithi","Trans Nzoia","Turkana","Uasin Gishu","Vihiga","Wajir","West Pokot",
];

const TYPE_UNITS = {
  Livestock: ["head", "kg", "pair"],
  Crops:     ["kg", "bags (90kg)", "bags (50kg)", "tonnes", "crates"],
  Poultry:   ["birds", "trays", "kg"],
  Dairy:     ["litres", "kg"],
  Fisheries: ["kg", "pieces", "buckets"],
};

const EMPTY = {
  title: "", type: "Livestock", description: "",
  price: "", priceUnit: "head", quantity: "", unit: "head",
  county: "Nairobi", negotiable: false,
  phone: "", whatsapp: "",
};

// Format phone to international Kenyan format for tel: and wa.me links
function toKenyaIntl(phone) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  if (digits.startsWith("7") || digits.startsWith("1")) return "254" + digits;
  return digits;
}

export default function CreateListingModal({ onClose, onSubmit, defaultPhone = "" }) {
  const [form, setForm] = useState({ ...EMPTY, phone: defaultPhone, whatsapp: defaultPhone });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [sameAsPhone, setSameAsPhone] = useState(true);

  const units = TYPE_UNITS[form.type] || ["kg"];

  function set(field, value) {
    setForm((f) => {
      const updated = { ...f, [field]: value };
      if (field === "type") {
        const newUnits = TYPE_UNITS[value] || ["kg"];
        updated.unit = newUnits[0];
        updated.priceUnit = newUnits[0];
      }
      // Keep WhatsApp in sync if checkbox is ticked
      if (field === "phone" && sameAsPhone) {
        updated.whatsapp = value;
      }
      return updated;
    });
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function handleSameAsPhone(checked) {
    setSameAsPhone(checked);
    if (checked) {
      setForm((f) => ({ ...f, whatsapp: f.phone }));
    }
  }

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      e.price = "Enter a valid price";
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) <= 0)
      e.quantity = "Enter a valid quantity";
    if (!form.description.trim()) e.description = "Add a short description";
    if (!form.phone.trim()) e.phone = "Phone number is required so buyers can reach you";
    else if (form.phone.replace(/\D/g, "").length < 9) e.phone = "Enter a valid phone number";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);

    const phoneIntl = toKenyaIntl(form.phone);
    const whatsappIntl = toKenyaIntl(sameAsPhone ? form.phone : form.whatsapp);

    await onSubmit({
      ...form,
      price: Number(form.price),
      quantity: Number(form.quantity),
      phone: form.phone,
      phoneIntl,
      whatsapp: whatsappIntl,
    });
    setSubmitting(false);
  }

  const canSubmit = form.title && form.price && form.quantity && form.description && form.phone;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2>Post a listing</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="form-row">
            <label className="form-label">What are you selling? *</label>
            <input
              className={`form-input ${errors.title ? "input-error" : ""}`}
              placeholder="e.g. 5 Dairy Cows, 10 bags of Maize..."
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </div>

          <div className="form-row-split">
            <div className="form-row">
              <label className="form-label">Category *</label>
              <select
                className="form-select"
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
              >
                {Object.keys(TYPE_UNITS).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label className="form-label">County *</label>
              <select
                className="form-select"
                value={form.county}
                onChange={(e) => set("county", e.target.value)}
              >
                {COUNTIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">Description *</label>
            <textarea
              className={`form-textarea ${errors.description ? "input-error" : ""}`}
              placeholder="Describe breed, quality, age, condition, feeding, etc."
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
            {errors.description && <span className="field-error">{errors.description}</span>}
          </div>

          <div className="form-row-split">
            <div className="form-row">
              <label className="form-label">Quantity *</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  min="0"
                  className={`form-input ${errors.quantity ? "input-error" : ""}`}
                  placeholder="0"
                  value={form.quantity}
                  onChange={(e) => set("quantity", e.target.value)}
                />
                <select
                  className="unit-select"
                  value={form.unit}
                  onChange={(e) => set("unit", e.target.value)}
                >
                  {units.map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
              {errors.quantity && <span className="field-error">{errors.quantity}</span>}
            </div>

            <div className="form-row">
              <label className="form-label">Price (KES) *</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  min="0"
                  className={`form-input ${errors.price ? "input-error" : ""}`}
                  placeholder="0"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                />
                <select
                  className="unit-select"
                  value={form.priceUnit}
                  onChange={(e) => set("priceUnit", e.target.value)}
                >
                  <option value="">total</option>
                  {units.map((u) => <option key={u} value={u}>per {u}</option>)}
                </select>
              </div>
              {errors.price && <span className="field-error">{errors.price}</span>}
            </div>
          </div>

          {/* ── Contact details ── */}
          <div className="contact-section">
            <p className="contact-section-label">📞 Contact details for buyers</p>

            <div className="form-row">
              <label className="form-label">Phone number *</label>
              <div className="phone-input-wrap">
                <span className="phone-prefix">🇰🇪 +254</span>
                <input
                  type="tel"
                  className={`form-input phone-input ${errors.phone ? "input-error" : ""}`}
                  placeholder="07XX XXX XXX"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>

            <label className="checkbox-label" style={{ marginTop: "0.25rem" }}>
              <input
                type="checkbox"
                checked={sameAsPhone}
                onChange={(e) => handleSameAsPhone(e.target.checked)}
              />
              WhatsApp is the same number
            </label>

            {!sameAsPhone && (
              <div className="form-row" style={{ marginTop: "0.75rem" }}>
                <label className="form-label">WhatsApp number</label>
                <div className="phone-input-wrap">
                  <span className="phone-prefix">🇰🇪 +254</span>
                  <input
                    type="tel"
                    className="form-input phone-input"
                    placeholder="07XX XXX XXX"
                    value={form.whatsapp}
                    onChange={(e) => set("whatsapp", e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="form-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.negotiable}
                onChange={(e) => set("negotiable", e.target.checked)}
              />
              Price is negotiable
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className="btn-post"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? "Posting..." : "Post listing"}
          </button>
        </div>
      </div>
    </div>
  );
}
