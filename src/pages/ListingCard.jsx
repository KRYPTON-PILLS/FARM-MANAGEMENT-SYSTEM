import { useState } from "react";
import "./ListingCard.css";

export default function ListingCard({ listing, currentUserId, onInquire, onMarkSold, onDelete }) {
  const [inquirySent, setInquirySent] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSold, setConfirmSold] = useState(false);
  const isOwner = listing.sellerId === currentUserId;

  function handleInquire() {
    onInquire(listing);
    setInquirySent(true);
  }

  const typeColors = {
    Livestock: { bg: "#fef3e8", color: "#8a4a10", dot: "#e07a30" },
    Crops:     { bg: "#eaf3ea", color: "#2d5a27", dot: "#4a9a40" },
    Poultry:   { bg: "#fff8e8", color: "#8a6a10", dot: "#d4aa30" },
    Dairy:     { bg: "#e8f0fe", color: "#1a4a8a", dot: "#4a7ae0" },
    Fisheries: { bg: "#e8f8fe", color: "#1a6a8a", dot: "#3aaad4" },
  };

  const colors = typeColors[listing.type] || typeColors.Crops;

  const postedDate = listing.createdAt?.toDate
    ? listing.createdAt.toDate().toLocaleDateString("en-KE", {
        day: "numeric", month: "short", year: "numeric"
      })
    : "Recently";

  return (
    <div className="listing-card">
      {listing.imageUrl && (
        <div className="listing-img-wrap">
          <img src={listing.imageUrl} alt={listing.title} className="listing-img" />
        </div>
      )}

      <div className="listing-body">
        <div className="listing-top">
          <span
            className="listing-type-badge"
            style={{ background: colors.bg, color: colors.color }}
          >
            <span className="type-dot" style={{ background: colors.dot }} />
            {listing.type}
          </span>

          {isOwner && (
            <div className="owner-controls">
              <span className="owner-badge">Your listing</span>
              {/* ✕ Delete button — only visible to owner */}
              <button
                className="btn-delete-listing"
                title="Remove listing"
                onClick={() => setConfirmDelete(true)}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <h3 className="listing-title">{listing.title}</h3>
        <p className="listing-desc">{listing.description}</p>

        <div className="listing-meta">
          {listing.quantity && (
            <div className="meta-item">
              <span className="meta-label">Qty</span>
              <span className="meta-val">{listing.quantity} {listing.unit || ""}</span>
            </div>
          )}
          {listing.county && (
            <div className="meta-item">
              <span className="meta-label">📍</span>
              <span className="meta-val">{listing.county}</span>
            </div>
          )}
        </div>

        <div className="listing-footer">
          <div className="listing-price-wrap">
            <span className="listing-price">
              KES {Number(listing.price).toLocaleString()}
            </span>
            {listing.priceUnit && (
              <span className="price-unit">/ {listing.priceUnit}</span>
            )}
            {listing.negotiable && (
              <span className="neg-badge">Negotiable</span>
            )}
          </div>

          <div className="listing-actions">
            {isOwner ? (
              <button
                className="btn-mark-sold"
                onClick={() => setConfirmSold(true)}
              >
                Mark sold
              </button>
            ) : (
              <button
                className={`btn-inquire ${inquirySent ? "sent" : ""}`}
                onClick={handleInquire}
                disabled={inquirySent}
              >
                {inquirySent ? "✓ Inquired" : "Inquire"}
              </button>
            )}
          </div>
        </div>

        <p className="listing-date">Posted {postedDate} · {listing.sellerName}</p>
      </div>

      {/* ── Confirm Delete ── */}
      {confirmDelete && (
        <div className="card-confirm-overlay">
          <div className="card-confirm-box">
            <p>Remove this listing?</p>
            <p className="card-confirm-sub">It will be permanently deleted.</p>
            <div className="card-confirm-actions">
              <button className="btn-confirm-cancel" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
              <button
                className="btn-confirm-delete"
                onClick={() => { setConfirmDelete(false); onDelete(listing); }}
              >
                Yes, remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Mark Sold ── */}
      {confirmSold && (
        <div className="card-confirm-overlay">
          <div className="card-confirm-box">
            <p>Mark as sold?</p>
            <p className="card-confirm-sub">This will create a sales record and remove the listing.</p>
            <div className="card-confirm-actions">
              <button className="btn-confirm-cancel" onClick={() => setConfirmSold(false)}>
                Cancel
              </button>
              <button
                className="btn-confirm-sold"
                onClick={() => { setConfirmSold(false); onMarkSold(listing); }}
              >
                Yes, mark sold
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
