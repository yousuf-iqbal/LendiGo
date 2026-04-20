import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const getCategoryImage = (category) => {
  const images = {
    'Electronics': 'https://cdn-icons-png.flaticon.com/512/1055/1055685.png',
    'Tools': 'https://cdn-icons-png.flaticon.com/512/2963/2963308.png',
    'Party Supplies': 'https://cdn-icons-png.flaticon.com/512/2963/2963198.png',
    'Vehicles': 'https://cdn-icons-png.flaticon.com/512/2963/2963201.png',
    'Sports': 'https://cdn-icons-png.flaticon.com/512/2963/2963206.png',
  };
  return images[category] || 'https://cdn-icons-png.flaticon.com/512/1055/1055685.png';
};

export default function AssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState({ start_date: "", end_date: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);
  const user = JSON.parse(localStorage.getItem("udhaari_user") || "null");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/assets/${id}`);
        console.log("Asset data:", data);
        setAsset(data);
      } catch (err) {
        setError("Asset not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchAsset();
  }, [id]);

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
      await axios.post("http://localhost:5000/api/bookings", {
        asset_id: id,
        borrower_id: user.UserID || user.id,
        start_date: booking.start_date,
        end_date: booking.end_date,
        message: booking.message,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setBooked(true);
    } catch (err) {
      setError(err.response?.data?.message || "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: "100px", textAlign: "center" }}>Loading...</div>;
  if (error) return <div style={{ padding: "100px", textAlign: "center", color: "red" }}>{error}</div>;
  if (!asset) return <div style={{ padding: "100px", textAlign: "center" }}>Asset not found</div>;

  const isOwner = user && (user.UserID === asset.owner_id || user.id === asset.owner_id);
  const isAvailable = asset.availability_status === "available";

  return (
    <div style={{ padding: "80px 24px", maxWidth: "1000px", margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: "24px", background: "none", border: "none", fontSize: "14px", cursor: "pointer" }}>← Back</button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
        <div style={{ background: "#f5f5f5", borderRadius: "20px", padding: "40px", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <img src={getCategoryImage(asset.category)} alt={asset.name} style={{ width: "200px", height: "200px", objectFit: "contain" }} />
        </div>

        <div>
          <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>{asset.name}</h1>
          <p style={{ color: "#666", marginBottom: "16px" }}>by {asset.owner_name || "Owner"}</p>
          
          <div style={{ marginBottom: "24px" }}>
            <span style={{ 
              background: isAvailable ? "#e6f7ee" : "#fce8e8",
              color: isAvailable ? "#15803d" : "#dc2626",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "12px"
            }}>
              {isAvailable ? "Available" : "Unavailable"}
            </span>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <h3>Description</h3>
            <p style={{ color: "#666" }}>{asset.description || "No description"}</p>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <span style={{ fontSize: "28px", fontWeight: "bold" }}>Rs {Number(asset.price_per_day).toLocaleString()}</span>
            <span style={{ color: "#999" }}> / day</span>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <p><strong>Location:</strong> {asset.location || "Not specified"}</p>
            <p><strong>Category:</strong> {asset.category || "Uncategorised"}</p>
          </div>

          {!isOwner && isAvailable && !booked && (
            <div style={{ marginTop: "32px", padding: "24px", background: "#f9f9f9", borderRadius: "16px" }}>
              <h3 style={{ marginBottom: "16px" }}>Request this item</h3>
              <div style={{ marginBottom: "12px" }}>
                <label>Start Date</label>
                <input type="date" style={{ width: "100%", padding: "10px", marginTop: "4px", border: "1px solid #ddd", borderRadius: "8px" }}
                  value={booking.start_date} min={new Date().toISOString().split("T")[0]}
                  onChange={e => setBooking({...booking, start_date: e.target.value})} />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label>End Date</label>
                <input type="date" style={{ width: "100%", padding: "10px", marginTop: "4px", border: "1px solid #ddd", borderRadius: "8px" }}
                  value={booking.end_date} min={booking.start_date}
                  onChange={e => setBooking({...booking, end_date: e.target.value})} />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label>Message</label>
                <textarea style={{ width: "100%", padding: "10px", marginTop: "4px", border: "1px solid #ddd", borderRadius: "8px", minHeight: "80px" }}
                  placeholder="Optional message to the owner..."
                  value={booking.message} onChange={e => setBooking({...booking, message: e.target.value})} />
              </div>
              {error && <p style={{ color: "red", marginBottom: "12px" }}>{error}</p>}
              <button onClick={handleBook} disabled={submitting}
                style={{ width: "100%", padding: "12px", background: "#1a1a1a", color: "white", border: "none", borderRadius: "30px", cursor: "pointer" }}>
                {submitting ? "Sending..." : "Send Request"}
              </button>
            </div>
          )}

          {isOwner && (
            <div style={{ marginTop: "32px", padding: "24px", background: "#f5f5f5", borderRadius: "16px", textAlign: "center" }}>
              <p>This is your listing. You cannot book your own item.</p>
              <button onClick={() => navigate("/my-assets")} style={{ marginTop: "12px", padding: "10px 20px", background: "#1a1a1a", color: "white", border: "none", borderRadius: "30px", cursor: "pointer" }}>
                Manage My Assets
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
