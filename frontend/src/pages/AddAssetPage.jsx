import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AddAssetPage.css";

const CATEGORIES = [
  "Electronics", "Tools", "Books", "Sports", "Vehicles",
  "Furniture", "Cameras", "Music", "Clothing", "Other"
];

const CONDITIONS = ["New", "Like new", "Good", "Fair", "Poor"];

export default function AddAssetPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("udhaari_user") || "null");
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    condition: "",
    price_per_day: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.category) errs.category = "Select a category";
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    const userId = user?.UserID || user?.id || user?.user_id;
    
    const assetData = {
      name: form.name,
      description: form.description,
      category: form.category,
      price_per_day: parseFloat(form.price_per_day) || 0,
      location: form.location,
      owner_id: userId
    };
    
    console.log("Sending asset data:", assetData);
    
    try {
      const response = await axios.post("http://localhost:5000/api/assets", assetData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      console.log("Response:", response.data);
      navigate("/my-assets");
    } catch (err) {
      console.error("Error:", err.response?.data);
      setErrors({ general: err.response?.data?.error || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-asset-page">
      <div className="add-asset__inner">
        <div className="add-asset__header animate-fade-up">
          <button className="add-asset__back" onClick={() => navigate("/my-assets")}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            My Assets
          </button>
          <div>
            <p className="add-asset__eyebrow">Lender Dashboard</p>
            <h1 className="add-asset__title">List an asset</h1>
            <p className="add-asset__sub">Share what you own. Set your own terms.</p>
          </div>
        </div>

        <div className="add-asset__body animate-fade-up delay-1">
          <div className="add-asset__form">
            <div className={`add-asset__field ${errors.name ? "add-asset__field--error" : ""}`}>
              <label className="add-asset__label">Item name *</label>
              <input
                type="text"
                className="add-asset__input"
                placeholder="e.g. Canon EOS R50 Camera"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <p className="add-asset__error-msg">{errors.name}</p>}
            </div>

            <div className="add-asset__row">
              <div className={`add-asset__field ${errors.category ? "add-asset__field--error" : ""}`}>
                <label className="add-asset__label">Category *</label>
                <select
                  className="add-asset__select"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <p className="add-asset__error-msg">{errors.category}</p>}
              </div>

              <div className="add-asset__field">
                <label className="add-asset__label">Condition</label>
                <select
                  className="add-asset__select"
                  value={form.condition}
                  onChange={e => setForm({ ...form, condition: e.target.value })}
                >
                  <option value="">Select condition</option>
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="add-asset__field">
              <label className="add-asset__label">Description</label>
              <textarea
                className="add-asset__textarea"
                placeholder="What is it? What comes with it? Any instructions?"
                rows={4}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="add-asset__row">
              <div className="add-asset__field">
                <label className="add-asset__label">Price per day (Rs)</label>
                <div className="add-asset__input-group">
                  <span className="add-asset__input-prefix">Rs</span>
                  <input
                    type="number"
                    className="add-asset__input add-asset__input--prefixed"
                    placeholder="0 = free"
                    value={form.price_per_day}
                    min="0"
                    onChange={e => setForm({ ...form, price_per_day: e.target.value })}
                  />
                </div>
              </div>

              <div className="add-asset__field">
                <label className="add-asset__label">Location</label>
                <input
                  type="text"
                  className="add-asset__input"
                  placeholder="e.g. DHA Lahore"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                />
              </div>
            </div>

            {errors.general && (
              <div className="add-asset__error-banner">{errors.general}</div>
            )}

            <div className="add-asset__submit-row">
              <button
                className="add-asset__cancel-btn"
                onClick={() => navigate("/my-assets")}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="add-asset__submit-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Listing..." : "List asset"}
              </button>
            </div>
          </div>

          <aside className="add-asset__sidebar">
            <div className="add-asset__hint">
              <p className="add-asset__hint-title">Tips for better listings</p>
              <ul className="add-asset__hint-list">
                <li>Clear photos get 3× more requests</li>
                <li>Mention exact condition and any quirks</li>
                <li>Set a fair price — or make it free for goodwill</li>
                <li>Add your general area so borrowers know pickup distance</li>
              </ul>
            </div>

            <div className="add-asset__hint add-asset__hint--accent">
              <p className="add-asset__hint-title">Forgot a calculator for your exam?</p>
              <p className="add-asset__hint-body">
                Browse <a href="/requests">open requests</a> — someone nearby might need exactly what you have.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
