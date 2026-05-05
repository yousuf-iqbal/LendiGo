import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import FloatingBackground from "../components/FloatingBackground";

const C = {
  saffron: "#F4A020", saffronDark: "#E08800", saffronPale: "#FFF0CC",
  maroon: "#800020", maroonL: "#B00030", maroonDeep: "#5C0018",
  brownLight: "#C4956A", cream: "#FDF6EC", warmWhite: "#FFF9F0",
  textDark: "#2C1810", textMuted: "#6B4C3B", textFaint: "#A68070",
  border: "rgba(128,0,32,0.12)", borderS: "rgba(128,0,32,0.25)",
};

function StatCard({ label, value, sub, color, onClick, idx }) {
  return (
    <div onClick={onClick}
      style={{
        background: C.warmWhite, border: `1px solid ${C.border}`, borderRadius: 16,
        padding: "1.75rem", cursor: onClick ? "pointer" : "default",
        boxShadow: "0 2px 12px rgba(128,0,32,0.07)", transition: "all 0.28s ease",
        animation: `fadeUp 0.5s ease ${idx * 0.06}s both`,
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(128,0,32,0.13)"; e.currentTarget.style.borderColor = C.borderS; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(128,0,32,0.07)"; e.currentTarget.style.borderColor = C.border; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", color, fontSize: "1.2rem", fontWeight: 700 }}>{label[0]}</div>
        {sub && <span style={{ fontSize: "0.72rem", fontWeight: 700, color, background: `${color}15`, padding: "3px 10px", borderRadius: 999, border: `1px solid ${color}30` }}>{sub}</span>}
      </div>
      <p style={{ color: C.textFaint, fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.3rem" }}>{label}</p>
      <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "2.2rem", fontWeight: 700, color, margin: 0, lineHeight: 1 }}>{value}</p>
    </div>
  );
}

function QuickBtn({ icon, label, onClick, color }) {
  return (
    <button onClick={onClick}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "1.25rem 1rem", background: C.warmWhite, border: `1px solid ${C.border}`, borderRadius: 14, cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "0.88rem", color: C.textDark, transition: "all 0.25s ease" }}
      onMouseEnter={e => { e.currentTarget.style.background = `${color}12`; e.currentTarget.style.borderColor = `${color}50`; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 6px 20px ${color}20`; }}
      onMouseLeave={e => { e.currentTarget.style.background = C.warmWhite; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
      <span style={{ fontSize: "1.5rem", fontWeight: 400 }}>{icon}</span>
      {label}
    </button>
  );
}

const ACTIVITY_LABELS = { booking_received: "Booking Received", offer_received: "Offer Received", booking_confirmed: "Booking Confirmed", payment_received: "Payment Received" };
const ACTIVITY_COLORS = { booking_received: C.saffron, offer_received: "#3B82F6", booking_confirmed: "#059669", payment_received: C.maroon };

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const storedUser = JSON.parse(localStorage.getItem("udhaari_user") || "null");
  const userRole = storedUser?.Role || storedUser?.role || "user";

  useEffect(() => {
    if (userRole === "admin") {
      navigate("/admin", { replace: true });
      return;
    }
    fetchDashboard();
    const interval = setInterval(silentRefresh, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    setLoading(true); setError(null);
    try {
      const res = await API.get("/dashboard/comprehensive");
      setData(res.data.data || res.data);
    } catch (err) { 
      console.error("Dashboard error:", err);
      setError(err.response?.data?.error || "Failed to load dashboard"); 
    }
    finally { setLoading(false); }
  };

  const silentRefresh = async () => {
    try { const res = await API.get("/dashboard/comprehensive"); setData(res.data.data || res.data); } catch {}
  };

  if (userRole === "admin") return null;

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.cream, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <FloatingBackground variant="minimal" />
      <div style={{ width: 44, height: 44, border: `3px solid ${C.border}`, borderTopColor: C.saffron, borderRadius: "50%", animation: "spin 0.8s linear infinite", zIndex: 1 }} />
      <p style={{ color: C.textMuted, zIndex: 1, fontFamily: "'Outfit', sans-serif" }}>Loading dashboard…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <FloatingBackground variant="minimal" />
      <div style={{ textAlign: "center", zIndex: 1, maxWidth: 400 }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
        <h3 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "1.5rem", color: C.textDark, marginBottom: "0.5rem" }}>Couldn't load dashboard</h3>
        <p style={{ color: C.maroon, marginBottom: "1.5rem", fontSize: "0.95rem" }}>{error}</p>
        <button onClick={fetchDashboard} style={{ padding: "0.75rem 2rem", background: C.maroon, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>Try Again</button>
      </div>
    </div>
  );

  const stats = data?.stats || {};
  const activity = data?.activity || [];
  const earnings = data?.earnings || [];
  const displayName = user?.fullName || user?.FullName || storedUser?.FullName || storedUser?.fullName || "there";

  return (
    <div style={{ background: C.cream, minHeight: "100vh", position: "relative", fontFamily: "'Outfit', system-ui, sans-serif" }}>
      <FloatingBackground variant="minimal" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* Rest of your dashboard content */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2.5rem", animation: "fadeUp 0.5s ease both", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <p style={{ color: C.saffron, fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>Overview</p>
            <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "2.8rem", fontWeight: 700, color: C.textDark, letterSpacing: "-0.02em", margin: 0 }}>
              Welcome, <em style={{ color: C.maroon, fontStyle: "italic" }}>{displayName}</em>
            </h1>
            <p style={{ color: C.textMuted, marginTop: "0.4rem", fontSize: "0.95rem" }}>Here's what's happening across your account.</p>
          </div>
          <button onClick={fetchDashboard}
            style={{ padding: "0.65rem 1.25rem", background: C.warmWhite, border: `1.5px solid ${C.border}`, borderRadius: 10, fontWeight: 600, cursor: "pointer", color: C.textMuted, fontFamily: "'Outfit', sans-serif", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6 }}>
            ↻ Refresh
          </button>
        </div>

        <div style={{ background: `linear-gradient(135deg, ${C.maroon}, ${C.maroonDeep})`, borderRadius: 20, padding: "2rem 2.5rem", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap", boxShadow: "0 8px 32px rgba(128,0,32,0.25)", animation: "fadeUp 0.5s ease 0.05s both" }}>
          <div style={{ width: 80, height: 80, borderRadius: 16, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.2)", border: "2px solid rgba(255,255,255,0.25)" }}>
            {storedUser?.ProfilePic ? (
              <img src={storedUser.ProfilePic} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "2.5rem", fontWeight: 700, color: C.saffron }}>{displayName[0]?.toUpperCase()}</span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "1.6rem", fontWeight: 700, color: "#fff", margin: "0 0 0.5rem", letterSpacing: "-0.01em" }}>{displayName}</h2>
            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
              <div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 2px" }}>Location</p>
                <p style={{ color: "#fff", fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>{storedUser?.City || "Not set"}</p>
              </div>
              <div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 2px" }}>Email</p>
                <p style={{ color: "#fff", fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>{storedUser?.Email || "—"}</p>
              </div>
            </div>
          </div>
          <button onClick={() => navigate("/profile")} style={{ padding: "0.65rem 1.5rem", background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.25)", borderRadius: 10, color: "#fff", fontFamily: "'Outfit', sans-serif", fontWeight: 600, cursor: "pointer", fontSize: "0.88rem", transition: "all 0.2s", flexShrink: 0 }}>
            Edit Profile
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
          <StatCard label="Assets Owned" value={stats.TotalAssets || 0} sub="Listed" color={C.maroon} onClick={() => navigate("/my-assets")} idx={0} />
          <StatCard label="Pending Approvals" value={stats.PendingBookings || 0} sub="Action needed" color={C.saffronDark} onClick={() => navigate("/bookings")} idx={1} />
          <StatCard label="Active Requests" value={stats.ActiveRequests || 0} sub="Open" color="#0284C7" onClick={() => navigate("/my-requests")} idx={2} />
          <StatCard label="Pending Offers" value={stats.PendingOffers || 0} sub="Awaiting" color="#7C3AED" onClick={() => navigate("/my-offers-made")} idx={3} />
          <StatCard label="Completed Bookings" value={stats.CompletedBookings || 0} sub="Done" color="#059669" idx={4} />
        </div>

        <div style={{ background: `linear-gradient(135deg, ${C.saffronPale}, #FFFAEE)`, border: `1px solid rgba(244,160,32,0.35)`, borderRadius: 16, padding: "1.5rem 2rem", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", animation: "fadeUp 0.5s ease 0.36s both" }}>
          <div>
            <p style={{ color: C.saffronDark, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>Wallet Balance</p>
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "2.8rem", fontWeight: 700, color: C.maroon, margin: 0, lineHeight: 1 }}>Rs. {Number(stats.WalletBalance || 0).toLocaleString()}</p>
          </div>
          <button onClick={() => navigate("/wallet")} style={{ padding: "0.75rem 1.5rem", background: C.maroon, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
            View Wallet
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ background: C.warmWhite, border: `1px solid ${C.border}`, borderRadius: 16, padding: "1.75rem", animation: "fadeUp 0.5s ease 0.42s both" }}>
            <h3 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "1.35rem", fontWeight: 700, color: C.textDark, margin: "0 0 1.5rem", borderBottom: `1px solid ${C.border}`, paddingBottom: "0.75rem" }}>Recent Activity</h3>
            {activity.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: C.textFaint }}>
                <p style={{ fontWeight: 500 }}>No activity yet</p>
                <p style={{ fontSize: "0.85rem" }}>Your recent events will appear here</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: 400, overflowY: "auto" }}>
                {activity.slice(0, 8).map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.875rem", padding: "0.875rem", background: C.cream, borderRadius: 10, borderLeft: `3px solid ${ACTIVITY_COLORS[item.ActivityType] || C.saffron}` }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${ACTIVITY_COLORS[item.ActivityType] || C.saffron}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>📋</div>
                    <div>
                      <p style={{ fontWeight: 700, color: C.textDark, fontSize: "0.88rem", margin: "0 0 2px" }}>{ACTIVITY_LABELS[item.ActivityType] || "Activity"}</p>
                      <p style={{ color: C.textMuted, fontSize: "0.82rem", margin: "0 0 2px" }}>{item.Description}</p>
                      <p style={{ color: C.textFaint, fontSize: "0.75rem", margin: 0 }}>{new Date(item.Timestamp).toLocaleDateString("en-PK")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: C.warmWhite, border: `1px solid ${C.border}`, borderRadius: 16, padding: "1.75rem", animation: "fadeUp 0.5s ease 0.48s both" }}>
            <h3 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "1.35rem", fontWeight: 700, color: C.textDark, margin: "0 0 1.5rem", borderBottom: `1px solid ${C.border}`, paddingBottom: "0.75rem" }}>Monthly Earnings</h3>
            {earnings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: C.textFaint }}>
                <p style={{ fontWeight: 500 }}>No earnings yet</p>
                <p style={{ fontSize: "0.85rem" }}>Complete bookings to start earning</p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem", maxHeight: 280, overflowY: "auto" }}>
                  {earnings.map((month, i) => {
                    const max = Math.max(...earnings.map(e => e.Earnings), 1);
                    const pct = (month.Earnings / max) * 100;
                    return (
                      <div key={i} style={{ display: "flex", gap: "0.875rem", alignItems: "center" }}>
                        <span style={{ fontSize: "0.82rem", color: C.textMuted, fontWeight: 600, minWidth: 56 }}>{new Date(month.Month).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}</span>
                        <div style={{ flex: 1, height: 22, background: C.cream, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.border}` }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${C.maroon}, ${C.maroonL})`, borderRadius: 6 }} />
                        </div>
                        <span style={{ fontWeight: 700, color: C.textDark, fontSize: "0.85rem", minWidth: 80, textAlign: "right" }}>Rs. {Number(month.Earnings).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ background: C.cream, borderRadius: 12, padding: "1rem 1.25rem", border: `1px solid ${C.border}` }}>
                  <p style={{ color: C.textFaint, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 4px" }}>Total Earned (All Time)</p>
                  <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "1.8rem", fontWeight: 700, color: C.maroon, margin: 0 }}>Rs. {Number(stats.TotalEarned || 0).toLocaleString()}</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ background: C.warmWhite, border: `1px solid ${C.border}`, borderRadius: 16, padding: "1.75rem", animation: "fadeUp 0.5s ease 0.54s both" }}>
          <h3 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "1.35rem", fontWeight: 700, color: C.textDark, margin: "0 0 1.25rem" }}>Quick Actions</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem" }}>
            <QuickBtn icon="+" label="Add Asset" onClick={() => navigate("/my-assets/add")} color={C.maroon} />
            <QuickBtn icon="✎" label="Post Request" onClick={() => navigate("/post-request")} color="#0284C7" />
            <QuickBtn icon="📅" label="My Bookings" onClick={() => navigate("/bookings")} color={C.saffronDark} />
            <QuickBtn icon="🤝" label="My Offers" onClick={() => navigate("/my-offers-made")} color="#7C3AED" />
            <QuickBtn icon="$" label="Wallet" onClick={() => navigate("/wallet")} color="#059669" />
            <QuickBtn icon="🔍" label="Browse" onClick={() => navigate("/browse")} color={C.brownLight} />
          </div>
        </div>
      </div>
    </div>
  );
}