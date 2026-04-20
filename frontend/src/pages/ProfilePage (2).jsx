import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import API from "../api/axios";
import "./ProfilePage.css";

/* ── tiny spinner ── */
function Spin() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ animation: "spin 0.7s linear infinite" }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

/* ── Arrow icon for links ── */
function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="profile__link-arrow">
      <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Lock icon ── */
function Lock() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="profile__lock-icon">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/* ── Camera icon for avatar overlay ── */
function Camera() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // ── auth ──
  const fbUser = auth.currentUser;
  const storedUser = JSON.parse(localStorage.getItem("udhaari_user") || "null");
  const token = localStorage.getItem("token");

  // ── state ──
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState({ text: "", ok: true });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    city: "",
    area: "",
    cnic: "",
  });
  const [errors, setErrors] = useState({});

  // ── load profile ──
  useEffect(() => {
    if (!fbUser && !storedUser) { navigate("/login"); return; }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.user || res.data;
      setProfile(data);
      setForm({
        fullName: data.FullName || data.fullName || storedUser?.fullName || "",
        phone: data.Phone || data.phone || storedUser?.phone || "",
        city: data.City || data.city || storedUser?.city || "",
        area: data.Area || data.area || storedUser?.area || "",
        cnic: data.CNIC || data.cnic || storedUser?.cnic || "",
      });
      if (data.ProfilePic || data.profilePic) {
        setAvatarPreview(data.ProfilePic || data.profilePic);
      }
    } catch {
      // fallback to localStorage
      const u = storedUser;
      if (u) {
        setProfile(u);
        setForm({
          fullName: u.fullName || u.FullName || "",
          phone: u.phone || u.Phone || "",
          city: u.city || u.City || "",
          area: u.area || u.Area || "",
          cnic: u.cnic || u.CNIC || "",
        });
        if (u.profilePic || u.ProfilePic) {
          setAvatarPreview(u.profilePic || u.ProfilePic);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // ── avatar click triggers file input ──
  const handleAvatarClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // ── avatar file selected ──
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);

    // upload to backend
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("profilePic", file);
      const res = await API.post("/profile/avatar", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const url = res.data?.profilePic || res.data?.url || reader.result;
      setAvatarPreview(url);
      flash("Profile picture updated", true);
      // sync localStorage
      const updated = { ...storedUser, profilePic: url };
      localStorage.setItem("udhaari_user", JSON.stringify(updated));
    } catch {
      flash("Photo upload failed — try a smaller image", false);
    } finally {
      setAvatarUploading(false);
    }
  };

  // ── validate ──
  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (form.phone && !/^03\d{9}$/.test(form.phone))
      errs.phone = "Must be 11 digits starting with 03";
    if (!form.cnic.trim()) errs.cnic = "CNIC is required";
    else if (!/^\d{13}$/.test(form.cnic.replace(/-/g, "")))
      errs.cnic = "Must be 13 digits (e.g. 3520112345671)";
    return errs;
  };

  // ── save ──
  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSaving(true);
    try {
      await API.put("/auth/profile", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // also try the profile endpoint
      try {
        await API.put("/profile", form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
      setProfile((p) => ({ ...p, ...form }));
      const updated = { ...storedUser, ...form };
      localStorage.setItem("udhaari_user", JSON.stringify(updated));
      setEditMode(false);
      flash("Changes saved", true);
    } catch (err) {
      flash(err.response?.data?.error || "Could not save changes", false);
    } finally {
      setSaving(false);
    }
  };

  const flash = (text, ok) => {
    setSaveMsg({ text, ok });
    setTimeout(() => setSaveMsg({ text: "", ok: true }), 3000);
  };

  // ── logout ──
  const handleLogout = async () => {
    try { await signOut(auth); } catch {}
    localStorage.removeItem("token");
    localStorage.removeItem("udhaari_user");
    navigate("/login");
  };

  // ── derived ──
  const displayName =
    form.fullName ||
    profile?.FullName ||
    profile?.fullName ||
    storedUser?.fullName ||
    "User";

  const displayEmail =
    fbUser?.email ||
    storedUser?.email ||
    profile?.Email ||
    profile?.email ||
    "";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const memberSince = (profile?.CreatedAt || profile?.createdAt)
    ? new Date(profile.CreatedAt || profile.createdAt).toLocaleDateString("en-PK", {
        month: "long",
        year: "numeric",
      })
    : null;

  const isVerified = fbUser?.emailVerified;

  // ── loading skeleton ──
  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile__inner">
          <div className="profile-skeleton">
            <div className="skeleton" style={{ height: 160, borderRadius: 16 }} />
            <div className="skeleton" style={{ height: 120, borderRadius: 16 }} />
            <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* inject spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="profile__inner">

        {/* ── PAGE HEADER ── */}
        <div className="profile__header animate-fade-up">
          <div>
            <p className="profile__eyebrow">Account</p>
            <h1 className="profile__title">My Profile</h1>
          </div>
        </div>

        {/* ── HERO CARD ── */}
        <div className="profile__hero animate-fade-up delay-1">

          {/* Avatar block */}
          <div className="profile__avatar-block">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="profile__avatar-input"
              onChange={handleAvatarChange}
            />
            <div
              className="profile__avatar-wrap"
              onClick={handleAvatarClick}
              title="Click to change photo"
            >
              {avatarUploading ? (
                <div className="profile__avatar-uploading">
                  <Spin />
                </div>
              ) : avatarPreview ? (
                <img src={avatarPreview} alt={displayName} className="profile__avatar-img" />
              ) : (
                <div className="profile__avatar-initials">{initials}</div>
              )}
              {!avatarUploading && (
                <div className="profile__avatar-overlay">
                  <Camera />
                </div>
              )}
            </div>
            <span className="profile__avatar-label">Click to<br />change photo</span>
          </div>

          {/* Name / email */}
          <div className="profile__hero-info">
            <h2 className="profile__name">{displayName}</h2>
            <div className="profile__email-row">
              <span className="profile__email">{displayEmail}</span>
              {isVerified && (
                <span className="profile__verified-badge">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Verified
                </span>
              )}
            </div>
            {memberSince && (
              <p className="profile__since">Member since {memberSince}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="profile__hero-actions">
            {saveMsg.text && (
              <span className={`profile__save-toast ${saveMsg.ok ? "profile__save-toast--ok" : "profile__save-toast--err"}`}>
                {saveMsg.text}
              </span>
            )}
            {editMode ? (
              <>
                <button
                  className="profile__btn profile__btn--primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <><Spin /> &nbsp;Saving…</> : "Save changes"}
                </button>
                <button
                  className="profile__btn profile__btn--ghost"
                  onClick={() => { setEditMode(false); setErrors({}); }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                className="profile__btn profile__btn--edit"
                onClick={() => setEditMode(true)}
              >
                Edit profile
              </button>
            )}
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="profile__body animate-fade-up delay-2">

          {/* ── LEFT: MAIN PANELS ── */}
          <div>

            {/* Personal Info Panel */}
            <div className="profile__panel">
              <div className="profile__panel-header">
                <h3 className="profile__panel-title">Personal info</h3>
                {editMode && (
                  <span className="profile__required-note">
                    <span className="profile__required-star">*</span> required
                  </span>
                )}
              </div>

              <div className="profile__fields">

                {/* Full Name — required */}
                <div className="profile__field">
                  <label className="profile__field-label">
                    Full Name {editMode && <span className="req">*</span>}
                  </label>
                  {editMode ? (
                    <>
                      <input
                        className={`profile__input ${errors.fullName ? "profile__input--error" : ""}`}
                        value={form.fullName}
                        onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                        placeholder="Yousuf Ahmed"
                      />
                      {errors.fullName && <span className="profile__field-error">{errors.fullName}</span>}
                    </>
                  ) : (
                    <p className={`profile__field-value ${!form.fullName ? "profile__field-value--empty" : ""}`}>
                      {form.fullName || "Not set"}
                    </p>
                  )}
                </div>

                {/* Email — always read-only from Firebase */}
                <div className="profile__field">
                  <label className="profile__field-label">Email</label>
                  <div className="profile__email-display">
                    <span>{displayEmail}</span>
                    <Lock />
                  </div>
                  {editMode && (
                    <span className="profile__field-hint">Email is linked to your login and cannot be changed here.</span>
                  )}
                </div>

                {/* Phone — optional */}
                <div className="profile__field">
                  <label className="profile__field-label">Phone</label>
                  {editMode ? (
                    <>
                      <input
                        className={`profile__input ${errors.phone ? "profile__input--error" : ""}`}
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="03001234567"
                        maxLength={11}
                      />
                      {errors.phone
                        ? <span className="profile__field-error">{errors.phone}</span>
                        : <span className="profile__field-hint">Optional — 11 digits, starts with 03</span>
                      }
                    </>
                  ) : (
                    <p className={`profile__field-value ${!form.phone ? "profile__field-value--empty" : ""}`}>
                      {form.phone || "Not provided"}
                    </p>
                  )}
                </div>

                {/* City — optional */}
                <div className="profile__field">
                  <label className="profile__field-label">City</label>
                  {editMode ? (
                    <input
                      className="profile__input"
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      placeholder="Lahore"
                    />
                  ) : (
                    <p className={`profile__field-value ${!form.city ? "profile__field-value--empty" : ""}`}>
                      {form.city || "Not provided"}
                    </p>
                  )}
                </div>

                {/* Area — optional */}
                <div className="profile__field">
                  <label className="profile__field-label">Area</label>
                  {editMode ? (
                    <>
                      <input
                        className="profile__input"
                        value={form.area}
                        onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                        placeholder="DHA Phase 5"
                      />
                      <span className="profile__field-hint">Optional neighbourhood / locality</span>
                    </>
                  ) : (
                    <p className={`profile__field-value ${!form.area ? "profile__field-value--empty" : ""}`}>
                      {form.area || "Not provided"}
                    </p>
                  )}
                </div>

              </div>
            </div>

            {/* CNIC Panel */}
            <div className="profile__panel" style={{ marginTop: 16 }}>
              <div className="profile__panel-header">
                <h3 className="profile__panel-title">Identity</h3>
                {editMode && (
                  <span className="profile__required-note">
                    <span className="profile__required-star">*</span> required
                  </span>
                )}
              </div>

              <div className="profile__fields">

                {/* CNIC Number — required */}
                <div className="profile__field">
                  <label className="profile__field-label">
                    CNIC Number {editMode && <span className="req">*</span>}
                  </label>
                  {editMode ? (
                    <>
                      <input
                        className={`profile__input ${errors.cnic ? "profile__input--error" : ""}`}
                        value={form.cnic}
                        onChange={(e) => {
                          // strip non-digits, max 13
                          const raw = e.target.value.replace(/\D/g, "").slice(0, 13);
                          setForm((f) => ({ ...f, cnic: raw }));
                        }}
                        placeholder="3520112345671"
                        maxLength={13}
                        inputMode="numeric"
                      />
                      {errors.cnic
                        ? <span className="profile__field-error">{errors.cnic}</span>
                        : <span className="profile__field-hint">13 digits, no dashes</span>
                      }
                    </>
                  ) : (
                    <p className={`profile__field-value ${!form.cnic ? "profile__field-value--empty" : ""}`}>
                      {form.cnic
                        ? `${form.cnic.slice(0, 5)}-${form.cnic.slice(5, 12)}-${form.cnic.slice(12)}`
                        : "Not provided"}
                    </p>
                  )}
                </div>

                {/* CNIC Verification status */}
                <div className="profile__field">
                  <label className="profile__field-label">Verification status</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 4 }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      fontSize: 12, fontFamily: "var(--font-mono)", textTransform: "uppercase",
                      letterSpacing: "0.06em", padding: "3px 10px", borderRadius: 20,
                      background: (profile?.IsVerified || profile?.isVerified) ? "#e6f7ee" : "#fff3e0",
                      color: (profile?.IsVerified || profile?.isVerified) ? "#15803d" : "#b45309",
                    }}>
                      {(profile?.IsVerified || profile?.isVerified) ? "Verified" : "Pending review"}
                    </span>
                  </div>
                  {editMode && (
                    <span className="profile__field-hint">Verification is done by the Udhaari team.</span>
                  )}
                </div>

              </div>
            </div>

          </div>

          {/* ── RIGHT: SIDEBAR ── */}
          <div className="profile__side">

            {/* Quick links */}
            <div className="profile__panel profile__panel--links">
              <div className="profile__panel-header">
                <h3 className="profile__panel-title">Quick links</h3>
              </div>
              <div className="profile__links">
                <Link to="/my-assets" className="profile__link-item">
                  <span>My Assets</span><Arrow />
                </Link>
                <Link to="/my-assets/add" className="profile__link-item">
                  <span>List a new asset</span><Arrow />
                </Link>
                <Link to="/my-bookings" className="profile__link-item">
                  <span>My Bookings</span><Arrow />
                </Link>
                <Link to="/my-requests" className="profile__link-item">
                  <span>My Requests</span><Arrow />
                </Link>
                <Link to="/requests" className="profile__link-item">
                  <span>Browse requests</span><Arrow />
                </Link>
              </div>
            </div>

            {/* Sign out */}
            <div className="profile__panel profile__panel--danger">
              <button onClick={handleLogout} className="profile__logout-btn">
                Sign out
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
