import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import FloatingBackground from "../components/FloatingBackground";

const C = {
  saffron: "#F4A020", saffronDark: "#E08800", saffronPale: "#FFF0CC",
  maroon: "#800020", maroonL: "#B00030", maroonDeep: "#5C0018",
  cream: "#FDF6EC", warmWhite: "#FFF9F0",
  textDark: "#2C1810", textMuted: "#6B4C3B", textFaint: "#A68070",
  border: "rgba(128,0,32,0.12)", borderS: "rgba(128,0,32,0.25)",
};

const CATEGORIES = [
  "Electronics", "Tools", "Books", "Sports", "Vehicles",
  "Furniture", "Cameras", "Music", "Clothing", "Other",
];

function FloatField({ label, type = "text", value, onChange, placeholder, min, required, children }) {
  const [focused, setFocused] = useState(false);
  const active = focused || (value && String(value).length > 0);
  return (
    <div style={{ position: "relative", marginBottom: "1.1rem" }}>
      <div style={{
        position: "relative",
        background: focused ? "rgba(244,160,32,0.06)" : C.warmWhite,
        border: `1.5px solid ${focused ? C.saffron : C.border}`,
        borderRadius: 12,
        padding: "1rem 1rem 0.55rem",
        transition: "all 0.25s ease",
        boxShadow: focused ? "0 0 0 3px rgba(244,160,32,0.15)" : "none",
      }}>
        <label style={{
          position: "absolute", left: "1rem",
          top: active ? "0.38rem" : "0.95rem",
          fontSize: active ? "0.68rem" : "0.93rem",
          fontWeight: active ? 700 : 500,
          color: focused ? C.saffronDark : C.textFaint,
          letterSpacing: active ? "0.07em" : "normal",
          textTransform: active ? "uppercase" : "none",
          transition: "all 0.2s ease", pointerEvents: "none",
        }}>{label}</label>
        {children || (
          <input
            type={type} value={value} onChange={onChange} min={min}
            required={required} placeholder={focused ? placeholder : ""}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            style={{
              width: "100%", background: "transparent", border: "none",
              outline: "none", color: C.textDark, fontSize: "0.97rem",
              fontFamily: "'Outfit', sans-serif", paddingTop: "0.3rem",
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function AddAssetPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", description: "", category: "",
    price_per_day: "", deposit: "", city: "", area: "",
  });
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.category) errs.category = "Select a category";
    if (!form.price_per_day || parseFloat(form.price_per_day) < 0) errs.price_per_day = "Valid price required";
    if (!form.city.trim()) errs.city = "City is required";
    if (images.length === 0) errs.images = "At least one image is required";
    return errs;
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      setErrors(prev => ({ ...prev, images: "Maximum 5 images allowed" }));
      return;
    }
    setImages(prev => [...prev, ...files]);
    setPreviewUrls(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    setErrors(prev => ({ ...prev, images: "" }));
  };

  const removeImage = (i) => {
    setImages(prev => prev.filter((_, idx) => idx !== i));
    setPreviewUrls(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setErrors({});
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      images.forEach(img => fd.append("images", img));
      const res = await API.post("/assets", fd, { headers: { "Content-Type": "multipart/form-data" } });
      navigate(`/assets/${res.data.asset_id}`);
    } catch (err) {
      setErrors({ general: err.response?.data?.error || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: C.cream, minHeight: "100vh", position: "relative", fontFamily: "'Outfit', system-ui, sans-serif" }}>
      <FloatingBackground variant="minimal" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .img-thumb { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .img-thumb:hover { transform: scale(1.03); box-shadow: 0 6px 20px rgba(128,0,32,0.18); }
        input[type="file"]::file-selector-button {
          padding: 0.45rem 1rem; background: ${C.maroon}; color: #fff;
          border: none; border-radius: 8px; cursor: pointer;
          font-family: 'Outfit', sans-serif; font-weight: 600; font-size: 0.82rem;
          margin-right: 0.75rem; transition: background 0.2s;
        }
        input[type="file"]::file-selector-button:hover { background: ${C.maroonL}; }
      `}</style>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* Back */}
        <button onClick={() => navigate("/my-assets")} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Outfit', sans-serif", fontWeight: 500, fontSize: "0.95rem", transition: "color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.color = C.maroon}
          onMouseLeave={e => e.currentTarget.style.color = C.textMuted}>
          ← My Assets
        </button>

        {/* Header */}
        <div style={{ marginBottom: "2.5rem", animation: "fadeUp 0.5s ease both" }}>
          <p style={{ color: C.saffron, fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>Marketplace</p>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "2.8rem", fontWeight: 700, color: C.textDark, letterSpacing: "-0.02em", margin: 0 }}>
            List an <em style={{ color: C.maroon, fontStyle: "italic" }}>Asset</em>
          </h1>
          <p style={{ color: C.textMuted, marginTop: "0.6rem", fontSize: "1rem", lineHeight: 1.6 }}>Share what you own. Set your own terms. Earn from idle things.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "2rem", alignItems: "start" }}>
          {/* Form */}
          <div style={{ background: C.warmWhite, border: `1px solid ${C.border}`, borderRadius: 20, padding: "2rem", boxShadow: "0 4px 24px rgba(128,0,32,0.08)", animation: "fadeUp 0.5s ease 0.08s both" }}>
            {errors.general && (
              <div style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5", padding: "0.85rem 1rem", borderRadius: 10, marginBottom: "1.25rem", fontSize: "0.88rem", fontWeight: 600 }}>
                ⚠️ {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <FloatField label="Asset Name *" value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g., Canon EOS M50 Camera" />
              {errors.name && <p style={{ color: "#991B1B", fontSize: "0.78rem", marginTop: "-0.8rem", marginBottom: "0.75rem" }}>{errors.name}</p>}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <FloatField label="Category *" value={form.category} onChange={() => {}}>
                    <select value={form.category} onChange={e => set("category", e.target.value)}
                      style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: form.category ? C.textDark : C.textFaint, fontSize: "0.97rem", fontFamily: "'Outfit', sans-serif", paddingTop: "0.3rem", cursor: "pointer" }}>
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </FloatField>
                  {errors.category && <p style={{ color: "#991B1B", fontSize: "0.78rem", marginTop: "-0.8rem", marginBottom: "0.75rem" }}>{errors.category}</p>}
                </div>
                <div>
                  <FloatField label="Price per Day (Rs.) *" type="number" value={form.price_per_day} onChange={e => set("price_per_day", e.target.value)} placeholder="1500" min="0" />
                  {errors.price_per_day && <p style={{ color: "#991B1B", fontSize: "0.78rem", marginTop: "-0.8rem", marginBottom: "0.75rem" }}>{errors.price_per_day}</p>}
                </div>
              </div>

              <FloatField label="Security Deposit (Rs.) — optional" type="number" value={form.deposit} onChange={e => set("deposit", e.target.value)} placeholder="0" min="0" />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <FloatField label="City *" value={form.city} onChange={e => set("city", e.target.value)} placeholder="Lahore" />
                  {errors.city && <p style={{ color: "#991B1B", fontSize: "0.78rem", marginTop: "-0.8rem", marginBottom: "0.75rem" }}>{errors.city}</p>}
                </div>
                <FloatField label="Area (optional)" value={form.area} onChange={e => set("area", e.target.value)} placeholder="DHA Phase 5" />
              </div>

              {/* Description */}
              <div style={{ marginBottom: "1.1rem" }}>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.4rem" }}>Description</label>
                <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4}
                  placeholder="Describe your asset — condition, features, rules for use…"
                  style={{ width: "100%", padding: "0.85rem 1rem", borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.cream, fontFamily: "'Outfit', sans-serif", fontSize: "0.95rem", color: C.textDark, outline: "none", resize: "vertical", transition: "all 0.2s", boxSizing: "border-box" }}
                  onFocus={e => { e.target.style.borderColor = C.saffron; e.target.style.boxShadow = "0 0 0 3px rgba(244,160,32,0.15)"; }}
                  onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }} />
              </div>

              {/* Images */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.6rem" }}>
                  Photos * <span style={{ color: C.textFaint, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(up to 5)</span>
                </label>
                <div style={{ border: `2px dashed ${C.borderS}`, borderRadius: 12, padding: "1.25rem", background: "rgba(253,246,236,0.5)", textAlign: "center" }}>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} id="asset-images" style={{ display: "none" }} />
                  <label htmlFor="asset-images" style={{ cursor: "pointer", display: "inline-block" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.4rem" }}>📷</div>
                    <p style={{ color: C.textMuted, fontSize: "0.9rem", marginBottom: "0.25rem", fontWeight: 500 }}>Click to upload photos</p>
                    <p style={{ color: C.textFaint, fontSize: "0.78rem" }}>PNG, JPG up to 5MB each</p>
                  </label>
                </div>
                {errors.images && <p style={{ color: "#991B1B", fontSize: "0.78rem", marginTop: "0.4rem" }}>{errors.images}</p>}

                {previewUrls.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "0.75rem", marginTop: "1rem" }}>
                    {previewUrls.map((url, i) => (
                      <div key={i} className="img-thumb" style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
                        <img src={url} alt={`Preview ${i + 1}`} style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} />
                        {i === 0 && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(128,0,32,0.75)", color: "#fff", fontSize: "0.65rem", fontWeight: 700, textAlign: "center", padding: "2px 0" }}>PRIMARY</div>}
                        <button type="button" onClick={() => removeImage(i)} style={{ position: "absolute", top: 4, right: 4, background: C.maroon, color: "#fff", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button type="button" onClick={() => navigate("/my-assets")} disabled={loading}
                  style={{ flex: 1, padding: "0.95rem", background: "transparent", border: `1.5px solid ${C.border}`, borderRadius: 10, fontWeight: 600, cursor: "pointer", color: C.textMuted, fontFamily: "'Outfit', sans-serif", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderS; e.currentTarget.style.color = C.textDark; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  style={{ flex: 2, padding: "0.95rem", background: loading ? "#9ca3af" : C.maroon, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 4px 16px rgba(128,0,32,0.28)", transition: "all 0.25s ease", fontFamily: "'Outfit', sans-serif" }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = C.maroonL; e.currentTarget.style.transform = "translateY(-2px)"; } }}
                  onMouseLeave={e => { e.currentTarget.style.background = loading ? "#9ca3af" : C.maroon; e.currentTarget.style.transform = "translateY(0)"; }}>
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                      Listing…
                    </span>
                  ) : "List Asset →"}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", animation: "fadeUp 0.5s ease 0.12s both" }}>
            <div style={{ background: C.warmWhite, border: `1px solid ${C.border}`, borderRadius: 16, padding: "1.5rem", boxShadow: "0 2px 12px rgba(128,0,32,0.07)" }}>
              <h3 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "1.2rem", fontWeight: 700, color: C.textDark, marginBottom: "1rem" }}>📸 Great listings include</h3>
              {[
                "Clear photos in good lighting",
                "Honest description of condition",
                "Accurate price per day",
                "Security deposit if item is valuable",
                "Your city and area for local discovery",
              ].map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: "0.75rem", alignItems: "flex-start" }}>
                  <span style={{ color: C.saffron, fontWeight: 700, flexShrink: 0 }}>→</span>
                  <p style={{ margin: 0, fontSize: "0.88rem", color: C.textMuted, lineHeight: 1.55 }}>{tip}</p>
                </div>
              ))}
            </div>

            <div style={{ background: `linear-gradient(135deg, ${C.saffronPale}, #FFF9EC)`, border: "1px solid rgba(244,160,32,0.30)", borderRadius: 16, padding: "1.5rem", boxShadow: "0 2px 12px rgba(128,0,32,0.07)" }}>
              <h3 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "1.2rem", fontWeight: 700, color: C.maroon, marginBottom: "0.6rem" }}>💰 Earn while you sleep</h3>
              <p style={{ color: C.textMuted, lineHeight: 1.65, margin: 0, fontSize: "0.92rem" }}>Your idle items can generate consistent income. Most lenders earn back 20% of the item's value in the first month.</p>
            </div>

            <div style={{ background: C.warmWhite, border: `1px solid ${C.border}`, borderRadius: 16, padding: "1.5rem", boxShadow: "0 2px 12px rgba(128,0,32,0.07)" }}>
              <h3 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "1.2rem", fontWeight: 700, color: C.textDark, marginBottom: "0.75rem" }}>🔒 You're in control</h3>
              <p style={{ color: C.textMuted, fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>You approve every booking request. You set the deposit. You decide who gets your item.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
