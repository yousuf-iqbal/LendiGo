import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("borrower");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchBookings();
  }, [role]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/bookings/my?role=${role}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (bookingId, newStatus) => {
    try {
      await axios.patch(`http://localhost:5000/api/bookings/${bookingId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.error || "Could not update status");
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { background: "#fff3e0", color: "#b45309" },
      approved: { background: "#e6f7ee", color: "#15803d" },
      rejected: { background: "#fce8e8", color: "#dc2626" },
      completed: { background: "#e6f7ee", color: "#15803d" },
      cancelled: { background: "#fce8e8", color: "#dc2626" }
    };
    const style = styles[status] || styles.pending;
    return <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", ...style }}>{status}</span>;
  };

  if (loading) return <div style={{ padding: "100px", textAlign: "center" }}>Loading bookings...</div>;

  return (
    <div style={{ padding: "80px 24px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "36px", marginBottom: "20px" }}>My Bookings</h1>
      
      <div style={{ display: "flex", gap: "12px", marginBottom: "32px", borderBottom: "1px solid #e0e0e0" }}>
        <button onClick={() => setRole("borrower")} style={{ padding: "10px 24px", background: "none", border: "none", borderBottom: role === "borrower" ? "2px solid #c8f230" : "none", cursor: "pointer", fontWeight: role === "borrower" ? "bold" : "normal" }}>
          Items I Requested
        </button>
        <button onClick={() => setRole("lender")} style={{ padding: "10px 24px", background: "none", border: "none", borderBottom: role === "lender" ? "2px solid #c8f230" : "none", cursor: "pointer", fontWeight: role === "lender" ? "bold" : "normal" }}>
          Requests for My Items
        </button>
      </div>

      {bookings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#666" }}>
          <p>No bookings found.</p>
          {role === "borrower" && <button onClick={() => navigate("/browse")} style={{ marginTop: "16px", padding: "10px 24px", background: "#1a1a1a", color: "white", border: "none", borderRadius: "30px", cursor: "pointer" }}>Browse Items</button>}
        </div>
      ) : (
        bookings.map((b) => (
          <div key={b.booking_id} style={{ background: "#f9f9f9", borderRadius: "16px", padding: "20px", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0 }}>{b.asset_name}</h3>
              {getStatusBadge(b.status)}
            </div>
            <div style={{ marginBottom: "12px" }}>
              <p><strong>Dates:</strong> {new Date(b.start_date).toLocaleDateString()} to {new Date(b.end_date).toLocaleDateString()}</p>
              <p><strong>Total:</strong> Rs {Number(b.total_price).toLocaleString()}</p>
              {role === "borrower" ? <p><strong>Lender:</strong> {b.lender_name}</p> : <p><strong>Borrower:</strong> {b.borrower_name}</p>}
            </div>
            {b.message && <p style={{ background: "#f0f0f0", padding: "10px", borderRadius: "8px", fontStyle: "italic" }}>"{b.message}"</p>}
            
            <div style={{ display: "flex", gap: "12px", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #e0e0e0" }}>
              {role === "lender" && b.status === "pending" && (
                <>
                  <button onClick={() => updateStatus(b.booking_id, "approved")} style={{ padding: "8px 20px", background: "#1a1a1a", color: "white", border: "none", borderRadius: "30px", cursor: "pointer" }}>Approve</button>
                  <button onClick={() => updateStatus(b.booking_id, "rejected")} style={{ padding: "8px 20px", background: "transparent", border: "1px solid #dc2626", color: "#dc2626", borderRadius: "30px", cursor: "pointer" }}>Decline</button>
                </>
              )}
              {role === "lender" && b.status === "approved" && (
                <button onClick={() => updateStatus(b.booking_id, "completed")} style={{ padding: "8px 20px", background: "#1a1a1a", color: "white", border: "none", borderRadius: "30px", cursor: "pointer" }}>Mark Completed</button>
              )}
              {role === "borrower" && b.status === "pending" && (
                <button onClick={() => updateStatus(b.booking_id, "cancelled")} style={{ padding: "8px 20px", background: "transparent", border: "1px solid #dc2626", color: "#dc2626", borderRadius: "30px", cursor: "pointer" }}>Cancel Request</button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
