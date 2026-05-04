import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import ChatPanel from "../components/ChatPanel";
import ReviewModal from "../components/ReviewModal";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("borrower");
  const [processing, setProcessing] = useState(null);
  const [chatBooking, setChatBooking] = useState(null);
  const [reviewBooking, setReviewBooking] = useState(null);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("udhaari_user") || "null");

  useEffect(() => {
    fetchBookings();
  }, [role]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await API.get(`/bookings/my?role=${role}`);
      setBookings(response.data || []);
    } catch (err) {
      alert(err.response?.data?.error || "Could not load bookings");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (bookingId, newStatus) => {
    setProcessing(bookingId);
    try {
      await API.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.error || "Could not update status");
    } finally {
      setProcessing(null);
    }
  };

  const acceptBooking = async (bookingId) => {
    if (!window.confirm("Accept this booking? The borrower will be able to proceed to payment.")) return;
    setProcessing(bookingId);
    try {
      await API.patch(`/bookings/${bookingId}/accept`);
      fetchBookings();
      alert("Booking accepted. The borrower can now pay from wallet.");
    } catch (err) {
      alert(err.response?.data?.error || "Could not accept booking");
    } finally {
      setProcessing(null);
    }
  };

  const rejectBooking = async (bookingId) => {
    if (!window.confirm("Reject this booking?")) return;
    setProcessing(bookingId);
    try {
      await API.patch(`/bookings/${bookingId}/reject`);
      fetchBookings();
      alert("Booking rejected.");
    } catch (err) {
      alert(err.response?.data?.error || "Could not reject booking");
    } finally {
      setProcessing(null);
    }
  };

  const badge = (status) => {
    const map = {
      pending: ["#fff7ed", "#c2410c", "#fed7aa"],
      confirmed: ["#dcfce7", "#166534", "#86efac"],
      ongoing: ["#dbeafe", "#1e40af", "#93c5fd"],
      returned: ["#fef3c7", "#92400e", "#fde68a"],
      completed: ["#dcfce7", "#166534", "#86efac"],
      cancelled: ["#fee2e2", "#dc2626", "#fca5a5"],
    };
    const [background, color, border] = map[status] || map.pending;
    return (
      <span style={{
        padding: "6px 14px",
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 700,
        textTransform: "capitalize",
        background,
        color,
        border: `1px solid ${border}`,
      }}>
        {status || "pending"}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p style={{ color: "#6b7280" }}>Loading bookings...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.inner}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>My Bookings</h1>
            <p style={styles.subtitle}>Track rentals, payments, chat, and reviews in one place.</p>
          </div>
          <button onClick={fetchBookings} style={styles.ghostButton}>Refresh</button>
        </div>

        <div style={styles.tabs}>
          <button onClick={() => setRole("borrower")} style={role === "borrower" ? styles.activeTab : styles.tab}>
            Items I Requested
          </button>
          <button onClick={() => setRole("lender")} style={role === "lender" ? styles.activeTab : styles.tab}>
            Requests for My Items
          </button>
        </div>

        {bookings.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📭</div>
            <h3 style={{ color: "#1f2937", marginBottom: "0.5rem" }}>No bookings found</h3>
            <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
              {role === "borrower" ? "Browse items and send your first booking request." : "Incoming booking requests will appear here."}
            </p>
            {role === "borrower" && (
              <button onClick={() => navigate("/browse")} style={styles.primaryButton}>Browse Items</button>
            )}
          </div>
        ) : (
          <div style={styles.grid}>
            {bookings.map((booking) => {
              const status = String(booking.status || booking.Status || "pending").toLowerCase();
              const bookingId = booking.booking_id || booking.BookingID;
              const assetId = booking.asset_id || booking.AssetID;

              return (
                <div key={bookingId} style={styles.card} className="animate-fade-up">
                  <div style={styles.cardHeader}>
                    <div>
                      <h3 style={styles.cardTitle}>{booking.asset_name || booking.AssetTitle || booking.RequestTitle || "Booking"}</h3>
                      <p style={styles.meta}>
                        {new Date(booking.start_date || booking.StartDate).toLocaleDateString()} to {new Date(booking.end_date || booking.EndDate).toLocaleDateString()}
                      </p>
                    </div>
                    {badge(status)}
                  </div>

                  <div style={styles.infoGrid}>
                    <div>
                      <p style={styles.label}>Total</p>
                      <p style={styles.value}>Rs. {Number(booking.total_price || booking.TotalPrice || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p style={styles.label}>{role === "borrower" ? "Lender" : "Borrower"}</p>
                      <p style={styles.value}>{role === "borrower" ? booking.lender_name : booking.borrower_name}</p>
                    </div>
                    <div>
                      <p style={styles.label}>Payment</p>
                      <p style={styles.value}>{booking.is_paid ? "Paid" : "Unpaid"}</p>
                    </div>
                  </div>

                  <div style={styles.actions}>
                    {role === "lender" && status === "pending" && (
                      <>
                        <button disabled={processing === bookingId} onClick={() => acceptBooking(bookingId)} style={styles.primaryButton}>
                          {processing === bookingId ? "Processing..." : "Accept"}
                        </button>
                        <button disabled={processing === bookingId} onClick={() => rejectBooking(bookingId)} style={styles.dangerButton}>
                          Reject
                        </button>
                      </>
                    )}

                    {role === "borrower" && status === "pending" && (
                      <button disabled={processing === bookingId} onClick={() => updateStatus(bookingId, "cancelled")} style={styles.dangerButton}>
                        Cancel Request
                      </button>
                    )}

                    {role === "borrower" && status === "confirmed" && !booking.is_paid && (
                      <button onClick={() => navigate(`/bookings/${bookingId}/payment`)} style={styles.primaryButton}>
                        Pay Now
                      </button>
                    )}

                    {role === "lender" && ["confirmed", "ongoing", "returned"].includes(status) && (
                      <button disabled={processing === bookingId} onClick={() => updateStatus(bookingId, "completed")} style={styles.primaryButton}>
                        Mark Completed
                      </button>
                    )}

                    <button onClick={() => setChatBooking(booking)} style={styles.blueButton}>Open Chat</button>

                    {assetId && <button onClick={() => navigate(`/assets/${assetId}`)} style={styles.ghostButton}>View Asset</button>}

                    {status === "completed" && (
                      <button onClick={() => setReviewBooking(booking)} style={styles.orangeButton}>Leave Review</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {chatBooking && (
        <ChatPanel
          bookingId={chatBooking.booking_id || chatBooking.BookingID}
          currentUserId={currentUser?.id || currentUser?.UserID}
          title={chatBooking.asset_name || chatBooking.AssetTitle || "Booking chat"}
          onClose={() => setChatBooking(null)}
        />
      )}

      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          role={role}
          onClose={() => setReviewBooking(null)}
          onSubmitted={fetchBookings}
        />
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f9fafb", padding: "2rem" },
  inner: { maxWidth: 1100, margin: "0 auto" },
  loading: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f9fafb" },
  spinner: { width: 48, height: 48, border: "4px solid #e5e7eb", borderTop: "4px solid #059669", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "1rem" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1.5rem" },
  title: { fontSize: "2.25rem", fontWeight: 900, color: "#111827", margin: 0 },
  subtitle: { color: "#6b7280", margin: "0.35rem 0 0" },
  tabs: { display: "flex", gap: "0.5rem", background: "#fff", padding: "0.5rem", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", width: "fit-content", marginBottom: "2rem" },
  tab: { padding: "0.75rem 1.5rem", background: "transparent", color: "#374151", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 },
  activeTab: { padding: "0.75rem 1.5rem", background: "#059669", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 800 },
  empty: { textAlign: "center", padding: "4rem", background: "#fff", borderRadius: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  grid: { display: "grid", gap: "1rem" },
  card: { background: "#fff", borderRadius: 14, padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" },
  cardTitle: { margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#111827" },
  meta: { color: "#6b7280", margin: "0.25rem 0 0", fontSize: "0.9rem" },
  infoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", background: "#f9fafb", borderRadius: 10, padding: "1rem", marginBottom: "1rem" },
  label: { color: "#9ca3af", margin: 0, fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" },
  value: { color: "#111827", margin: "0.2rem 0 0", fontWeight: 800 },
  actions: { display: "flex", flexWrap: "wrap", gap: "0.75rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" },
  primaryButton: { padding: "0.65rem 1rem", background: "#059669", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 800 },
  dangerButton: { padding: "0.65rem 1rem", background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 8, cursor: "pointer", fontWeight: 800 },
  blueButton: { padding: "0.65rem 1rem", background: "#eff6ff", color: "#1e40af", border: "1px solid #93c5fd", borderRadius: 8, cursor: "pointer", fontWeight: 800 },
  orangeButton: { padding: "0.65rem 1rem", background: "#fff7ed", color: "#c2410c", border: "1px solid #fdba74", borderRadius: 8, cursor: "pointer", fontWeight: 800 },
  ghostButton: { padding: "0.65rem 1rem", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 800 },
};
