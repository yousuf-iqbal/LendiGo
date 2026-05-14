import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import ChatButton from "../components/ChatButton";
import DisputeModal from "../components/DisputeModal";
import Calendar from "../components/Calendar";

const C = {
  saffron: "#F4A020", saffronDark: "#E08800", saffronPale: "#FFF0CC",
  maroon: "#800020", maroonL: "#B00030", maroonDeep: "#5C0018",
  brownLight: "#C4956A", cream: "#FDF6EC", warmWhite: "#FFF9F0",
  textDark: "#2C1810", textMuted: "#6B4C3B", textFaint: "#A68070",
  border: "rgba(128,0,32,0.12)", borderS: "rgba(128,0,32,0.25)",
};

export default function AssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [booking, setBooking] = useState({ start_date: "", end_date: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  
  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  
  const user = JSON.parse(localStorage.getItem("udhaari_user") || "null");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const { data } = await API.get(`/assets/${id}`);
        setAsset(data);
        if (data.images && data.images.length > 0) {
          const primaryIdx = data.images.findIndex(img => img.IsPrimary);
          setSelectedImage(primaryIdx >= 0 ? primaryIdx : 0);
        }
      } catch (err) {
        setError("Asset not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchAsset();
    fetchReviews();
  }, [id]);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await API.get(`/reviews/asset/${id}`);
      const allReviews = res.data?.data || res.data || [];
      setReviews(allReviews);

      if (allReviews.length > 0) {
        const avgRating = (allReviews.reduce((sum, r) => sum + (r.Rating || 0), 0) / allReviews.length).toFixed(1);
        setStats({ avgRating, totalReviews: allReviews.length });
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleBook = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!booking.start_date || !booking.end_date) {
      setError("Please select start and end dates.");
      return;
    }
    if (new Date(booking.end_date) <= new Date(booking.start_date)) {
      setError("End date must be after start date.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      // Calculate total price: rate × (number of days inclusive)
      const startDate = new Date(booking.start_date);
      const endDate = new Date(booking.end_date);
      const daysInclusive = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      const totalPrice = daysInclusive * parseFloat(asset.price_per_day);

      const res = await API.post("/bookings", {
        asset_id: id,
        borrower_id: user.UserID || user.id,
        start_date: booking.start_date,
        end_date: booking.end_date,
        message: booking.message,
        total_price: totalPrice,
      });
      setBookingSuccess({
        bookingId: res.data.bookingId,
        message: "Booking request sent successfully! Waiting for owner approval..."
      });
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!reviewForm.comment.trim()) {
      setError("Please write a comment.");
      return;
    }

    setSubmittingReview(true);
    setError("");
    try {
      await API.post("/reviews", {
        assetId: id,
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
      });
      setReviewForm({ rating: 5, comment: "" });
      setShowReviewForm(false);
      fetchReviews();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div style={{ padding: "100px", textAlign: "center" }}>Loading...</div>;
  if (error && !bookingSuccess) return <div style={{ padding: "100px", textAlign: "center", color: "red" }}>{error}</div>;
  if (!asset) return <div style={{ padding: "100px", textAlign: "center" }}>Asset not found</div>;

  const isOwner = user && (user.UserID === asset.owner_id || user.id === asset.owner_id);
  const isAvailable = asset.availability_status === "available";
  const images = asset.images || [];
  const currentImage = images[selectedImage]?.ImageURL || null;

  return (
    <div style={{ background: C.cream, minHeight: "100vh" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}>
        <button onClick={() => navigate(-1)} style={{ marginBottom: "1.5rem", background: "none", border: "none", fontSize: "14px", cursor: "pointer", color: C.maroon, fontWeight: 600 }}>← Back</button>
        
        {/* Main Content Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "start", marginBottom: "3rem" }}>
          {/* Image Gallery */}
          <div>
            <div style={{ 
              width: "100%", 
              aspectRatio: "1",
              background: currentImage ? `url(${currentImage})` : C.warmWhite,
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderRadius: "16px",
              marginBottom: "1rem",
              border: `1px solid ${C.border}`
            }}>
              {!currentImage && (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: C.textFaint, fontSize: "4rem" }}>
                  📦
                </div>
              )}
            </div>
            
            {images.length > 1 && (
              <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto" }}>
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    style={{
                      width: "80px",
                      height: "80px",
                      background: `url(${img.ImageURL})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      border: selectedImage === idx ? `3px solid ${C.maroon}` : `2px solid ${C.border}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      flexShrink: 0,
                      opacity: selectedImage === idx ? 1 : 0.6
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Asset Details */}
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.2rem", fontWeight: 700, color: C.textDark, marginBottom: "0.5rem" }}>{asset.name}</h1>
            <p style={{ color: C.textMuted, marginBottom: "1.5rem", fontWeight: 500 }}>by {asset.owner_name || "Owner"}</p>
            
            <div style={{ marginBottom: "1.5rem" }}>
              <span style={{ 
                background: isAvailable ? "#e6f7ee" : "#fce8e8",
                color: isAvailable ? "#15803d" : "#dc2626",
                padding: "0.5rem 1rem",
                borderRadius: "20px",
                fontSize: "0.85rem",
                fontWeight: 600
              }}>
                {isAvailable ? "✓ Available" : "✗ Unavailable"}
              </span>
            </div>

            <div style={{ background: C.warmWhite, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
              <p style={{ margin: 0, color: C.textFaint, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.07em", marginBottom: "0.5rem" }}>Price Per Day</p>
              <p style={{ fontSize: "2rem", fontWeight: 700, color: C.maroon, margin: 0 }}>Rs {Number(asset.price_per_day).toLocaleString()}</p>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.textDark, marginBottom: "0.5rem" }}>Description</h3>
              <p style={{ color: C.textMuted, lineHeight: 1.6 }}>{asset.description || "No description provided"}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: C.warmWhite, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <p style={{ margin: 0, color: C.textFaint, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase" }}>Category</p>
                <p style={{ margin: "0.25rem 0 0", fontWeight: 600, color: C.textDark }}>{asset.category || "Uncategorized"}</p>
              </div>
              <div>
                <p style={{ margin: 0, color: C.textFaint, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase" }}>Location</p>
                <p style={{ margin: "0.25rem 0 0", fontWeight: 600, color: C.textDark }}>{asset.location || "Not specified"}</p>
              </div>
            </div>

            {!isOwner && isAvailable && !bookingSuccess && (
              <div style={{ display: "flex", gap: "1rem" }}>
                <ChatButton userId={asset.owner_id} style={{ flex: 1 }} />
                <button
                  onClick={() => setShowDisputeModal(true)}
                  style={{
                    flex: 1,
                    padding: "0.75rem 1rem",
                    background: C.warmWhite,
                    color: C.textMuted,
                    border: `1px solid ${C.border}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    justifyContent: "center"
                  }}
                >
                  ⚠️ Report Issue
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Booking Form */}
        {!isOwner && isAvailable && !bookingSuccess && (
          <div style={{ background: C.warmWhite, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "2rem", marginBottom: "3rem" }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", fontWeight: 700, color: C.textDark, marginBottom: "1.5rem" }}>Request this item</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: C.textDark }}>Start Date</label>
                <Calendar 
                  onDateSelect={(date) => setBooking({...booking, start_date: date.toISOString().split("T")[0]})}
                  selectedDate={booking.start_date}
                  minDate={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: C.textDark }}>End Date</label>
                <Calendar 
                  onDateSelect={(date) => setBooking({...booking, end_date: date.toISOString().split("T")[0]})}
                  selectedDate={booking.end_date}
                  minDate={booking.start_date || new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: C.textDark }}>Message (optional)</label>
              <textarea 
                style={{ width: "100%", padding: "0.75rem", border: `1px solid ${C.border}`, borderRadius: "8px", minHeight: "80px", fontFamily: "inherit", resize: "vertical" }}
                placeholder="Tell the owner about your rental needs..."
                value={booking.message} 
                onChange={e => setBooking({...booking, message: e.target.value})} 
              />
            </div>
            {error && <p style={{ color: "#dc2626", marginBottom: "1rem", fontSize: "0.9rem" }}>⚠️ {error}</p>}
            <button 
              onClick={handleBook} 
              disabled={submitting}
              style={{ 
                width: "100%", 
                padding: "1rem", 
                background: C.maroon, 
                color: "white", 
                border: "none", 
                borderRadius: "10px", 
                cursor: "pointer", 
                fontWeight: 700,
                opacity: submitting ? 0.6 : 1,
                fontSize: "1rem"
              }}
            >
              {submitting ? "Sending..." : "Send Booking Request"}
            </button>
          </div>
        )}

        {bookingSuccess && (
          <div style={{ background: "#e6f7ee", border: "2px solid #059669", borderRadius: "16px", padding: "2rem", marginBottom: "3rem", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✓</div>
            <h3 style={{ color: "#059669", marginBottom: "0.5rem", fontSize: "1.3rem", fontWeight: 700 }}>Booking Request Sent!</h3>
            <p style={{ color: "#166534", marginBottom: "1.5rem" }}>
              {bookingSuccess.message}<br/>
              <span style={{ fontSize: "0.9rem", color: "#0d6e4f" }}>Booking ID: #{bookingSuccess.bookingId}</span>
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => navigate("/bookings?role=borrower")} 
                style={{ padding: "0.75rem 1.5rem", background: "#059669", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}>
                View My Bookings
              </button>
              <button onClick={() => navigate("/")} 
                style={{ padding: "0.75rem 1.5rem", background: "white", color: "#059669", border: "2px solid #059669", borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}>
                Continue Shopping
              </button>
            </div>
          </div>
        )}

        {isOwner && (
          <div style={{ background: C.warmWhite, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "2rem", marginBottom: "3rem", textAlign: "center" }}>
            <p style={{ color: C.textMuted, marginBottom: "1rem" }}>This is your listing. You cannot book your own item.</p>
            <button onClick={() => navigate("/my-assets")} style={{ padding: "0.75rem 1.5rem", background: C.maroon, color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}>
              Manage My Assets
            </button>
          </div>
        )}

        {/* Reviews Section */}
        <div style={{ marginTop: "3rem", borderTop: `2px solid ${C.border}`, paddingTop: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", fontWeight: 700, color: C.textDark, margin: 0, marginBottom: "0.5rem" }}>Reviews & Ratings</h2>
              <p style={{ color: C.textMuted, margin: 0 }}>See what users say about this item</p>
            </div>
            {stats && (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "2rem", fontWeight: 700, color: C.maroon, margin: "0 0 0.25rem" }}>{stats.avgRating}</p>
                <div style={{ display: "flex", gap: "2px", justifyContent: "center" }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span key={star} style={{ fontSize: "1rem", color: star <= Math.round(stats.avgRating) ? C.saffronDark : C.border }}>★</span>
                  ))}
                </div>
                <p style={{ color: C.textFaint, fontSize: "0.8rem", margin: "0.25rem 0 0" }}>{stats.totalReviews} reviews</p>
              </div>
            )}
          </div>

          {loadingReviews ? (
            <div style={{ textAlign: "center", padding: "2rem", color: C.textMuted }}>Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", background: C.warmWhite, borderRadius: "12px", border: `1px solid ${C.border}`, color: C.textMuted }}>
              No reviews yet. Be the first to review!
            </div>
          ) : (
            <div style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}>
              {reviews.map((review) => (
                <div key={review.ReviewID} style={{ background: C.warmWhite, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                    <div>
                      <p style={{ fontWeight: 700, color: C.textDark, margin: 0 }}>{review.ReviewerName}</p>
                      <p style={{ color: C.textFaint, fontSize: "0.8rem", margin: "0.25rem 0 0" }}>{new Date(review.CreatedAt).toLocaleDateString()}</p>
                    </div>
                    <div style={{ display: "flex", gap: "2px" }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} style={{ fontSize: "0.9rem", color: star <= review.Rating ? C.saffronDark : C.border }}>★</span>
                      ))}
                    </div>
                  </div>
                  <p style={{ color: C.textMuted, lineHeight: 1.5, margin: 0 }}>{review.Comment}</p>
                </div>
              ))}
            </div>
          )}

          {!isOwner && (
            <div style={{ background: C.warmWhite, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "1.5rem", marginTop: "1.5rem", textAlign: "center" }}>
              <h4 style={{ color: C.textDark, fontWeight: 700, marginBottom: "0.5rem" }}>Share Your Experience</h4>
              <p style={{ color: C.textMuted, margin: 0 }}>Complete a booking for this item and add your review after. This helps other users make informed decisions.</p>
            </div>
          )}
        </div>
      </div>

      {/* Dispute Modal */}
      {showDisputeModal && (
        <DisputeModal
          assetId={id}
          onClose={() => setShowDisputeModal(false)}
          onSubmitSuccess={() => {
            setShowDisputeModal(false);
          }}
        />
      )}
    </div>
  );
}