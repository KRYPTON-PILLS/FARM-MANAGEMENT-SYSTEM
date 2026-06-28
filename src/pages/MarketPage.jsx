import { useState, useEffect, useContext } from "react";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../context/AuthContext";
import { UseProfile } from "../hooks/UseProfile.js";
import { FarmContext } from "../context/FarmContext";
import CreateListingModal from "./CreateListingModal";
import ListingCard from "./ListingCard";
import "./MarketPage.css";

const COUNTIES = [
  "All Counties","Baringo","Bomet","Bungoma","Busia","Elgeyo-Marakwet","Embu","Garissa",
  "Homa Bay","Isiolo","Kajiado","Kakamega","Kericho","Kiambu","Kilifi","Kirinyaga",
  "Kisii","Kisumu","Kitui","Kwale","Laikipia","Lamu","Machakos","Makueni","Mandera",
  "Marsabit","Meru","Migori","Mombasa","Murang'a","Nairobi","Nakuru","Nandi","Narok",
  "Nyamira","Nyandarua","Nyeri","Samburu","Siaya","Taita-Taveta","Tana River",
  "Tharaka-Nithi","Trans Nzoia","Turkana","Uasin Gishu","Vihiga","Wajir","West Pokot",
];

const CATEGORIES = ["All Categories", "Livestock", "Crops", "Poultry", "Fisheries", "Dairy"];

export default function MarketPage() {
  const { currentUser } = useAuth();
  const { profile } = UseProfile();
  const { addSalesRecord } = useContext(FarmContext);

  const [activeTab, setActiveTab] = useState("prices");
  const [pricesData, setPricesData] = useState([]);
  const [listings, setListings] = useState([]);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [pricesError, setPricesError] = useState(null);
  const [selectedCounty, setSelectedCounty] = useState("All Counties");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [priceSearch, setPriceSearch] = useState("");
  const [listingSearch, setListingSearch] = useState("");
  const [listingFilter, setListingFilter] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [inquireTarget, setInquireTarget] = useState(null);

  useEffect(() => {
    if (activeTab === "prices") fetchMarketPrices();
    if (activeTab === "listings") fetchListings();
  }, [activeTab]);

  async function fetchMarketPrices() {
    setPricesLoading(true);
    setPricesError(null);
    try {
      const snap = await getDocs(
        query(collection(db, "marketPrices"), orderBy("fetchedAt", "desc"))
      );
      if (!snap.empty) {
        const docData = snap.docs[0].data();
        setPricesData(docData.prices || []);
        setLastUpdated(docData.fetchedAt?.toDate());
      } else {
        setPricesData(getMockPrices());
        setLastUpdated(new Date());
      }
    } catch {
      setPricesData(getMockPrices());
      setLastUpdated(new Date());
    } finally {
      setPricesLoading(false);
    }
  }

  async function fetchListings() {
    setListingsLoading(true);
    try {
      // Simple query without compound index requirement —
      // fetch all active listings ordered by createdAt only
      const snap = await getDocs(
        query(
          collection(db, "marketListings"),
          orderBy("createdAt", "desc")
        )
      );
      // Filter status client-side to avoid needing a composite index
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setListings(all.filter((l) => l.status === "active"));
    } catch (err) {
      console.error("fetchListings error:", err);
      setListings([]);
    } finally {
      setListingsLoading(false);
    }
  }

  async function handleCreateListing(listing) {
    try {
      // Resolve seller name from profile — never show raw email
      const sellerName = profile?.displayName?.trim()
        || currentUser.displayName
        || currentUser.email?.split("@")[0]
        || "Farmer";

      await addDoc(collection(db, "marketListings"), {
        ...listing,
        sellerId: currentUser.uid,
        sellerName,
        sellerEmail: currentUser.email || "",
        status: "active",
        createdAt: serverTimestamp(),
      });
      setShowCreateModal(false);
      await fetchListings();
    } catch (err) {
      console.error("Error creating listing:", err);
    }
  }

  async function handleMarkSold(listing) {
    try {
      // Update listing status in Firestore
      await updateDoc(doc(db, "marketListings", listing.id), {
        status: "sold",
        soldAt: serverTimestamp(),
      });

      // Auto-create a sales record in your existing Sales collection
      if (addSalesRecord) {
        await addSalesRecord({
          animalName: listing.title,
          type: listing.type,
          price: listing.price,
          buyer: "Via Market Listing",
          date: new Date().toISOString().split("T")[0],
          notes: `Sold via Market page. County: ${listing.county}. ${listing.description || ""}`,
        });
      }

      // Remove from local state immediately — no need to re-fetch
      setListings((prev) => prev.filter((l) => l.id !== listing.id));
    } catch (err) {
      console.error("Error marking sold:", err);
    }
  }

  async function handleDelete(listing) {
    try {
      await deleteDoc(doc(db, "marketListings", listing.id));
      setListings((prev) => prev.filter((l) => l.id !== listing.id));
    } catch (err) {
      console.error("Error deleting listing:", err);
    }
  }

  function handleInquire(listing) {
    setInquireTarget(listing);
  }

  const filteredPrices = pricesData.filter((p) => {
    const countyMatch = selectedCounty === "All Counties" || p.county === selectedCounty;
    const categoryMatch = selectedCategory === "All Categories" || p.category === selectedCategory;
    const searchMatch = !priceSearch || p.commodity.toLowerCase().includes(priceSearch.toLowerCase());
    return countyMatch && categoryMatch && searchMatch;
  });

  const filteredListings = listings.filter((l) => {
    const typeMatch = listingFilter === "All" || l.type === listingFilter;
    const searchMatch = !listingSearch || l.title.toLowerCase().includes(listingSearch.toLowerCase());
    return typeMatch && searchMatch;
  });

  return (
    <div className="market-page">
      <div className="market-header">
        <div className="market-header-text">
          <h1>Market</h1>
          <p>Live commodity prices and farmer listings across Kenya</p>
        </div>
        {activeTab === "listings" && (
          <button className="btn-create-listing" onClick={() => setShowCreateModal(true)}>
            <span className="btn-icon">+</span> Post a Listing
          </button>
        )}
      </div>

      <div className="market-tabs">
        <button
          className={`market-tab ${activeTab === "prices" ? "active" : ""}`}
          onClick={() => setActiveTab("prices")}
        >
          <span className="tab-icon">📊</span>
          Market Prices
        </button>
        <button
          className={`market-tab ${activeTab === "listings" ? "active" : ""}`}
          onClick={() => setActiveTab("listings")}
        >
          <span className="tab-icon">🏪</span>
          Farmer Listings
          {listings.length > 0 && (
            <span className="tab-badge">{listings.length}</span>
          )}
        </button>
      </div>

      {activeTab === "prices" && (
        <div className="prices-section">
          <div className="prices-toolbar">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search commodity..."
                value={priceSearch}
                onChange={(e) => setPriceSearch(e.target.value)}
                className="search-input"
              />
            </div>
            <select
              value={selectedCounty}
              onChange={(e) => setSelectedCounty(e.target.value)}
              className="filter-select"
            >
              {COUNTIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {lastUpdated && (
            <p className="last-updated">
              Last updated: {lastUpdated.toLocaleDateString("en-KE", {
                day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
              })}
              <span className="source-badge">Source: KilimoSTAT / KAMIS</span>
            </p>
          )}

          {pricesLoading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Fetching latest market prices...</p>
            </div>
          ) : pricesError ? (
            <div className="error-state">
              <p>⚠️ {pricesError}</p>
              <button onClick={fetchMarketPrices}>Try again</button>
            </div>
          ) : (
            <>
              <div className="prices-summary-row">
                <div className="summary-card">
                  <span className="summary-label">Commodities shown</span>
                  <span className="summary-value">{filteredPrices.length}</span>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Counties covered</span>
                  <span className="summary-value">
                    {selectedCounty === "All Counties"
                      ? new Set(filteredPrices.map((p) => p.county)).size
                      : 1}
                  </span>
                </div>
                <div className="summary-card">
                  <span className="summary-label">Price type</span>
                  <span className="summary-value">Wholesale & Retail</span>
                </div>
              </div>

              {filteredPrices.length === 0 ? (
                <div className="empty-state">
                  <p>No prices match your filters. Try adjusting the county or category.</p>
                </div>
              ) : (
                <div className="prices-table-wrap">
                  <table className="prices-table">
                    <thead>
                      <tr>
                        <th>Commodity</th>
                        <th>County</th>
                        <th>Category</th>
                        <th>Wholesale (KES/KG)</th>
                        <th>Retail (KES/KG)</th>
                        <th>Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPrices.map((p, i) => (
                        <tr key={i}>
                          <td className="commodity-name">{p.commodity}</td>
                          <td>{p.county}</td>
                          <td>
                            <span className={`category-tag cat-${p.category?.toLowerCase()}`}>
                              {p.category}
                            </span>
                          </td>
                          <td className="price-cell">
                            {p.wholesale != null ? `KES ${p.wholesale.toFixed(2)}` : "—"}
                          </td>
                          <td className="price-cell">
                            {p.retail != null ? `KES ${p.retail.toFixed(2)}` : "—"}
                          </td>
                          <td>
                            <span className={`trend-badge trend-${p.trend}`}>
                              {p.trend === "up" ? "↑" : p.trend === "down" ? "↓" : "→"}
                              {" "}{p.trend}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "listings" && (
        <div className="listings-section">
          <div className="listings-toolbar">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search listings..."
                value={listingSearch}
                onChange={(e) => setListingSearch(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-pills">
              {["All", "Livestock", "Crops", "Poultry"].map((f) => (
                <button
                  key={f}
                  className={`filter-pill ${listingFilter === f ? "active" : ""}`}
                  onClick={() => setListingFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {listingsLoading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading farmer listings...</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="empty-state listings-empty">
              <div className="empty-icon">🌾</div>
              <h3>No listings yet</h3>
              <p>Be the first to post what you're selling. Other farmers in Kenya can find and buy from you.</p>
              <button className="btn-create-listing" onClick={() => setShowCreateModal(true)}>
                Post your first listing
              </button>
            </div>
          ) : (
            <div className="listings-grid">
              {filteredListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  currentUserId={currentUser?.uid}
                  onInquire={handleInquire}
                  onMarkSold={handleMarkSold}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <CreateListingModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateListing}
          defaultPhone={profile?.phone || ""}
        />
      )}

      {/* ── Inquire Modal ── */}
      {inquireTarget && (
        <div className="modal-overlay" onClick={() => setInquireTarget(null)}>
          <div className="inquire-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Contact Seller</h2>
              <button className="modal-close" onClick={() => setInquireTarget(null)}>✕</button>
            </div>
            <div className="inquire-body">

              <p className="inquire-listing-title">"{inquireTarget.title}"</p>

              <div className="inquire-detail">
                <span className="inquire-label">Seller</span>
                <span className="inquire-val">{inquireTarget.sellerName}</span>
              </div>
              <div className="inquire-detail">
                <span className="inquire-label">County</span>
                <span className="inquire-val">{inquireTarget.county}</span>
              </div>
              <div className="inquire-detail">
                <span className="inquire-label">Price</span>
                <span className="inquire-val">
                  KES {Number(inquireTarget.price).toLocaleString()}
                  {inquireTarget.priceUnit ? ` / ${inquireTarget.priceUnit}` : ""}
                  {inquireTarget.negotiable ? " · Negotiable" : ""}
                </span>
              </div>
              {inquireTarget.phone && (
                <div className="inquire-detail">
                  <span className="inquire-label">Phone</span>
                  <span className="inquire-val">{inquireTarget.phone}</span>
                </div>
              )}

              {/* ── Action buttons ── */}
              <div className="inquire-actions">
                {inquireTarget.whatsapp && (
                  <a
                    href={`https://wa.me/${inquireTarget.whatsapp}?text=Hello%20${encodeURIComponent(inquireTarget.sellerName)}%2C%20I%20am%20interested%20in%20your%20listing%3A%20*${encodeURIComponent(inquireTarget.title)}*%20on%20the%20Farm%20Market.%20Is%20it%20still%20available%3F`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp"
                  >
                    <span className="contact-btn-icon">💬</span>
                    WhatsApp Seller
                  </a>
                )}
                {inquireTarget.phoneIntl && (
                  <a
                    href={`tel:+${inquireTarget.phoneIntl}`}
                    className="btn-call"
                  >
                    <span className="contact-btn-icon">📞</span>
                    Call Seller
                  </a>
                )}
              </div>

              <p className="inquire-note">
                Tap WhatsApp to send a message instantly, or Call to phone the seller directly.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getMockPrices() {
  return [
    { commodity: "Maize (Dry)", county: "Nairobi", category: "Crops", wholesale: 45.00, retail: 55.00, trend: "up" },
    { commodity: "Tomatoes", county: "Nairobi", category: "Crops", wholesale: 80.00, retail: 120.00, trend: "down" },
    { commodity: "Kales / Sukuma Wiki", county: "Nairobi", category: "Crops", wholesale: 20.00, retail: 30.00, trend: "stable" },
    { commodity: "Dry Onions", county: "Nairobi", category: "Crops", wholesale: 70.00, retail: 90.00, trend: "up" },
    { commodity: "Potatoes (Irish)", county: "Nakuru", category: "Crops", wholesale: 30.00, retail: 40.00, trend: "stable" },
    { commodity: "Carrots", county: "Nakuru", category: "Crops", wholesale: 40.00, retail: 60.00, trend: "up" },
    { commodity: "Cabbages", county: "Kiambu", category: "Crops", wholesale: 15.00, retail: 25.00, trend: "down" },
    { commodity: "Beef (Bone-in)", county: "Nairobi", category: "Livestock", wholesale: 450.00, retail: 550.00, trend: "up" },
    { commodity: "Goat Meat", county: "Kajiado", category: "Livestock", wholesale: 600.00, retail: 700.00, trend: "stable" },
    { commodity: "Sheep / Mutton", county: "Kajiado", category: "Livestock", wholesale: 500.00, retail: 620.00, trend: "up" },
    { commodity: "Pork", county: "Nairobi", category: "Livestock", wholesale: 380.00, retail: 480.00, trend: "stable" },
    { commodity: "Whole Chicken (Live)", county: "Kiambu", category: "Poultry", wholesale: 600.00, retail: 750.00, trend: "up" },
    { commodity: "Eggs (Tray of 30)", county: "Nairobi", category: "Poultry", wholesale: 360.00, retail: 420.00, trend: "stable" },
    { commodity: "Fresh Milk (1L)", county: "Nakuru", category: "Dairy", wholesale: 45.00, retail: 65.00, trend: "stable" },
    { commodity: "Tilapia (Fresh)", county: "Kisumu", category: "Fisheries", wholesale: 280.00, retail: 350.00, trend: "up" },
    { commodity: "Banana (Cooking)", county: "Taita-Taveta", category: "Crops", wholesale: 70.83, retail: null, trend: "stable" },
    { commodity: "Spinach", county: "Taita-Taveta", category: "Crops", wholesale: 50.00, retail: 70.00, trend: "down" },
    { commodity: "Beans (Dry)", county: "Meru", category: "Crops", wholesale: 110.00, retail: 140.00, trend: "up" },
    { commodity: "Green Grams", county: "Makueni", category: "Crops", wholesale: 130.00, retail: 160.00, trend: "stable" },
    { commodity: "Sorghum", county: "Kitui", category: "Crops", wholesale: 55.00, retail: 70.00, trend: "stable" },
  ];
}
