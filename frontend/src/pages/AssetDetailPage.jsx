import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function AssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [booking, setBooking] = useState({ start_date: "", end_date: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);
  const user = JSON.parse(localStorage.getItem("udhaari_user") || "null");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const { data } = await API.get(`/assets/${id}`);
        console.log("Asset data:", data);
        setAsset(data);
        // Set primary image as selected
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
      await API.post("/bookings", {
        asset_id: id,
        borrower_id: user.UserID || user.id,
        start_date: booking.start_date,
        end_date: booking.end_date,
        message: booking.message,
      });
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
  const images = asset.images || [];
  const currentImage = images[selectedImage]?.ImageURL || null;

  return (
    <div style={{ padding: "80px 24px", maxWidth: "1000px", margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: "24px", background: "none", border: "none", fontSize: "14px", cursor: "pointer" }}>← Back</button>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
        {/* Image Gallery */}
        <div>
          <div style={{ 
            width: "100%", 
            height: "400px", 
            background: currentImage ? `url(${currentImage})` : "#f5f5f5",
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: "20px",
            marginBottom: "12px"
          }}>
            {!currentImage && (
              <div style={{ 
                height: "100%", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                color: "#9ca3af",
                fontSize: "4rem"
              }}>
                📦
              </div>
            )}
          </div>
          
          {/* Thumbnail Navigation */}
          {images.length > 1 && (
            <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
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
                    border: selectedImage === idx ? "3px solid #059669" : "2px solid #e5e7eb",
                    borderRadius: "8px",
                    cursor: "pointer",
                    flexShrink: 0,
                    opacity: selectedImage === idx ? 1 : 0.7
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Asset Details */}
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