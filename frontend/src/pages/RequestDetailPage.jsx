import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
//import FloatingBackground from "../components/FloatingBackground";

const C = {
  saffron: "#F4A020", saffronDark: "#E08800", saffronPale: "#FFF0CC",
  maroon: "#800020", maroonL: "#B00030", maroonDeep: "#5C0018",
  cream: "#FDF6EC", warmWhite: "#FFF9F0",
  textDark: "#2C1810", textMuted: "#6B4C3B", textFaint: "#A68070",
  border: "rgba(128,0,32,0.12)", borderS: "rgba(128,0,32,0.25)",
};

function FloatField({ label, type = "text", value, onChange, placeholder, min, children }) {
  const [focused, setFocused] = useState(false);
  const active = focused || (value && String(value).length > 0);
  return (
    <div style={{ position: "relative", marginBottom: "1rem" }}>
      <div style={{
        position: "relative", background: focused ? "rgba(244,160,32,0.06)" : C.cream,
        border: `1.5px solid ${focused ? C.saffron : C.border}`, borderRadius: 10,
        padding: "0.9rem 1rem 0.5rem", transition: "all 0.25s ease",
        boxShadow: focused ? "0 0 0 3px rgba(244,160,32,0.15)" : "none",
      }}>
        <label style={{
          position: "absolute", left: "1rem",
          top: active ? "0.3rem" : "0.85rem",
          fontSize: active ? "0.65rem" : "0.9rem",
          fontWeight: active ? 700 : 500,
          color: focused ? C.saffronDark : C.textFaint,
          letterSpacing: active ? "0.07em" : "normal",
          textTransform: active ? "uppercase" : "none",
          transition: "all 0.2s ease", pointerEvents: "none",
        }}>{label}</label>
        {children || (
          <input type={type} value={value} onChange={onChange} min={min}
            placeholder={focused ? placeholder : ""}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: C.textDark, fontSize: "0.95rem", fontFamily: "'Outfit', sans-serif", paddingTop: "0.25rem" }} />
        )}
      </div>
    </div>
  );
}

export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerForm, setOfferForm] = useState({ offeredPrice: "", message: "", assetId: "", startDate: "", endDate: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [offerSuccess, setOfferSuccess] = useState(false);
  const user = JSON.parse(localStorage.getItem("udhaari_user") || "null");

  useEffect(() => { fetchRequest(); }, [id]);

  const fetchRequest = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/requests/${id}`);
      setRequest(res.data);
    } catch { setError("Request not found"); }
    finally { setLoading(false); }
  };

  const handleMakeOffer = async (e) => {
    e.preventDefault();
    if (!offerForm.offeredPrice || parseFloat(offerForm.offeredPrice) <= 0) {
      setError("Please enter a valid offer price"); return;
    }
    setSubmitting(true); setError("");
    try {
      await API.post("/offers", {
        requestId: parseInt(id, 10),
        assetId: offerForm.assetId || null,
        offeredPrice: parseFloat(offerForm.offeredPrice),
        message: offerForm.message?.trim(),
        startDate: offerForm.startDate || null,
        endDate: offerForm.endDate || null,
      });
      setOfferSuccess(true);
      setShowOfferForm(false);
      setOfferForm({ offeredPrice: "", message: "", assetId: "", startDate: "", endDate: "" });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit offer");
    } finally { setSubmitting(false); }
  };

  const currentUserId = user?.UserID ?? user?.id ?? user?.userId ?? user?.userID;
  const requestOwnerId = request?.RequesterID ?? request?.requesterId;
  const isRequester = user && currentUserId && requestOwnerId && Number(currentUserId) === Number(requestOwnerId);
  const isPending = request?.Status === "open" || request?.status === "open";

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "N/A";
  const days = request ? Math.ceil((new Date(request.EndDate || request.endDate) - new Date(request.StartDate || request.startDate)) / 86400000) : 0;

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.cream, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      {/*<FloatingBackground variant="minimal" />*/}
      <div style={{ width: 44, height: 44, border: `3px solid ${C.border}`, borderTopColor: C.saffron, borderRadius: "50%", animation: "spin 0.8s linear infinite", zIndex: 1 }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  if (error && !request) return (
    <div style={{ minHeight: "100vh", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/*<FloatingBackground variant="minimal" />*/}
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>!</div>
        <p style={{ color: C.maroon, fontWeight: 600, fontSize: "1.1rem" }}>{error}</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: "1rem", padding: "0.7rem 1.5rem", background: C.maroon, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>Go Back</button>
      </div>
    </div>
  );

  return (
    <div style={{ background: C.cream, minHeight: "100vh", position: "relative", fontFamily: "'Outfit', system-ui, sans-serif" }}>
      {/*<FloatingBackground variant="minimal" />*/}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Outfit:wght@300;400;500;600;700;800&display=swap');
          @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes slideDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        `}
      </style>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem" }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Outfit', sans-serif", fontWeight: 500, fontSize: "0.95rem", transition: "color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.color = C.maroon}
          onMouseLeave={e => e.currentTarget.style.color = C.textMuted}>
          ← Back
        </button>

        {/* Main card */}
        <div style={{ background: C.warmWhite, border: `1px solid ${C.border}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(128,0,32,0.08)", animation: "fadeUp 0.5s ease both", marginBottom: "1.5rem" }}>
          {/* Header strip */}
          <div style={{ background: `linear-gradient(135deg, ${C.maroon}, ${C.maroonDeep})`, padding: "2rem 2.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>
                  {request?.CategoryName || request?.categoryName || "General"} Request
                </p>
                <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "2rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2 }}>
                  {request?.Title || request?.title}
                </h1>
              </div>
              <span style={{
                padding: "6px 16px", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700, textTransform: "capitalize",
                background: isPending ? "rgba(244,160,32,0.25)" : "rgba(255,255,255,0.15)",
                color: isPending ? C.saffron : "rgba(255,255,255,0.7)",
                border: `1px solid ${isPending ? "rgba(244,160,32,0.5)" : "rgba(255,255,255,0.2)"}`,
                flexShrink: 0,
              }}>
                {request?.Status || request?.status}
              </span>
            </div>
          </div>

          <div style={{ padding: "2rem 2.5rem" }}>
            {/* Description */}
            <p style={{ color: C.textMuted, fontSize: "0.97rem", lineHeight: 1.7, marginBottom: "2rem", borderLeft: `3px solid ${C.saffron}`, paddingLeft: "1rem" }}>
              {request?.Description || request?.description || "No description provided."}
            </p>

            {/* Meta grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              {[
                { label: "Duration", value: `${fmtDate(request?.StartDate || request?.startDate)} — ${fmtDate(request?.EndDate || request?.endDate)}` },
                { label: "Days Needed", value: `${days > 0 ? days : "—"} day${days !== 1 ? "s" : ""}` },
                { label: "Max Budget", value: `Rs. ${(request?.MaxBudget || request?.maxBudget)?.toLocaleString() || "Negotiable"}` },
                { label: "Location", value: [request?.City || request?.city, request?.Area || request?.area].filter(Boolean).join(", ") || "Not specified" },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: C.cream, borderRadius: 12, padding: "0.875rem 1rem", border: `1px solid ${C.border}` }}>
                  <p style={{ fontSize: "0.7rem", fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 4px" }}>{label}</p>
                  <p style={{ fontSize: "0.95rem", fontWeight: 600, color: C.textDark, margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Poster */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "1rem", background: C.cream, borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: "1.5rem" }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                background: request?.RequesterPic ? `url(${request.RequesterPic}) center/cover` : `linear-gradient(135deg, ${C.saffron}, ${C.maroon})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: "1.1rem",
              }}>
                {!request?.RequesterPic && (request?.RequesterName || "U")[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 700, color: C.textDark, margin: 0, fontSize: "0.95rem" }}>{request?.RequesterName || request?.requesterName}</p>
                <p style={{ fontSize: "0.8rem", color: C.textFaint, margin: 0 }}>
                  Posted {request?.CreatedAt ? new Date(request.CreatedAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "recently"}
                </p>
              </div>
            </div>

            {/* Owner notice */}
            {isRequester && (
              <div style={{ background: "rgba(244,160,32,0.1)", padding: "1rem 1.25rem", borderRadius: 12, borderLeft: `4px solid ${C.saffron}` }}>
                <p style={{ color: C.maroon, margin: 0, fontWeight: 600, fontSize: "0.9rem" }}>
                  ✓ This is your request — manage offers and status from My Requests.
                </p>
              </div>
            )}

            {/* Offer success */}
            {offerSuccess && (
              <div style={{ background: "#D1FAE5", border: "1px solid #6EE7B7", padding: "1rem 1.25rem", borderRadius: 12, animation: "slideDown 0.3s ease" }}>
                <p style={{ color: "#065F46", margin: 0, fontWeight: 600 }}>✓ Offer submitted! The requester will review it shortly.</p>
              </div>
            )}

            {/* Make offer CTA */}
            {!isRequester && isPending && !offerSuccess && (
              <div style={{ marginTop: "1.5rem" }}>
                {!showOfferForm ? (
                  <button onClick={() => setShowOfferForm(true)}
                    style={{ padding: "0.875rem 2rem", background: C.maroon, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "1rem", cursor: "pointer", boxShadow: "0 4px 16px rgba(128,0,32,0.28)", transition: "all 0.25s ease", fontFamily: "'Outfit', sans-serif" }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.maroonL; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = C.maroon; e.currentTarget.style.transform = "translateY(0)"; }}>
                    Make an Offer →
                  </button>
                ) : (
                  <div style={{ background: C.cream, borderRadius: 16, padding: "1.75rem", border: `1px solid ${C.borderS}`, animation: "slideDown 0.3s ease" }}>
                    <h3 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "1.4rem", fontWeight: 700, color: C.textDark, marginBottom: "1.25rem" }}>Submit Your Offer</h3>
                    {error && (
                      <div style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5", padding: "0.75rem 1rem", borderRadius: 10, marginBottom: "1rem", fontSize: "0.88rem", fontWeight: 600 }}>
                        ⚠ {error}
                      </div>
                    )}
                    <form onSubmit={handleMakeOffer}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <FloatField label="Your Price (Rs.) *" type="number" value={offerForm.offeredPrice}
                          onChange={e => setOfferForm({ ...offerForm, offeredPrice: e.target.value })} placeholder="e.g. 2500" min="1" />
                        <FloatField label="Asset Name (optional)" value={offerForm.assetId}
                          onChange={e => setOfferForm({ ...offerForm, assetId: e.target.value })} placeholder="What you'll lend" />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <FloatField label="Start Date" type="date" value={offerForm.startDate}
                          onChange={e => setOfferForm({ ...offerForm, startDate: e.target.value })} />
                        <FloatField label="End Date" type="date" value={offerForm.endDate}
                          onChange={e => setOfferForm({ ...offerForm, endDate: e.target.value })} />
                      </div>
                      <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.4rem" }}>Message (optional)</label>
                        <textarea rows={3} placeholder="Tell them about your item, availability, or terms…"
                          value={offerForm.message} onChange={e => setOfferForm({ ...offerForm, message: e.target.value })}
                          style={{ width: "100%", padding: "0.85rem 1rem", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.warmWhite, fontFamily: "'Outfit', sans-serif", fontSize: "0.93rem", color: C.textDark, outline: "none", resize: "vertical", transition: "all 0.2s", boxSizing: "border-box" }}
                          onFocus={e => { e.target.style.borderColor = C.saffron; e.target.style.boxShadow = "0 0 0 3px rgba(244,160,32,0.15)"; }}
                          onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }} />
                      </div>
                      <div style={{ display: "flex", gap: "0.75rem" }}>
                        <button type="submit" disabled={submitting}
                          style={{ flex: 2, padding: "0.875rem", background: submitting ? "#9ca3af" : C.maroon, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "'Outfit', sans-serif", boxShadow: submitting ? "none" : "0 4px 14px rgba(128,0,32,0.25)", transition: "all 0.25s" }}>
                          {submitting ? "Submitting…" : "Submit Offer"}
                        </button>
                        <button type="button" onClick={() => { setShowOfferForm(false); setError(""); }}
                          style={{ flex: 1, padding: "0.875rem", background: "transparent", border: `1.5px solid ${C.border}`, borderRadius: 10, fontWeight: 600, cursor: "pointer", color: C.textMuted, fontFamily: "'Outfit', sans-serif", transition: "all 0.2s" }}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {!isPending && !isRequester && (
              <div style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", background: "rgba(128,0,32,0.05)", borderRadius: 12, border: `1px solid ${C.border}` }}>
                <p style={{ color: C.textMuted, margin: 0, fontSize: "0.9rem" }}>This request is no longer open for offers.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}