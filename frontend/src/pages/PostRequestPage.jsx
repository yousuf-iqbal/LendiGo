import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./PostRequestPage.css";

export default function PostRequestPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    startDate: "",
    endDate: "",
    maxBudget: "",
    city: "",
    area: ""
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/requests/categories", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCategories(res.data);
      } catch (err) {
        console.error("Categories error:", err);
        setCategories([
          { id: 1, name: "Electronics" },
          { id: 2, name: "Tools" },
          { id: 3, name: "Party Supplies" },
          { id: 4, name: "Vehicles" },
          { id: 5, name: "Sports" },
          { id: 6, name: "Books" },
          { id: 7, name: "Clothing" }
        ]);
      }
    };
    loadCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!form.startDate || !form.endDate) {
      setError("Start and end dates are required");
      return;
    }

    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    const payload = {
      title: form.title,
      description: form.description,
      categoryId: form.categoryId ? parseInt(form.categoryId) : null,
      startDate: form.startDate,
      endDate: form.endDate,
      maxBudget: form.maxBudget ? parseFloat(form.maxBudget) : null,
      city: form.city,
      area: form.area
    };

    try {
      await axios.post("http://localhost:5000/api/requests", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Request posted successfully!");
      setTimeout(() => navigate("/requests"), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to post request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-request-page">
      <div className="post-request__bg">
        <div className="post-request__orb post-request__orb--1"></div>
        <div className="post-request__orb post-request__orb--2"></div>
        <div className="post-request__orb post-request__orb--3"></div>
      </div>

      <div className="post-request__inner">
        <div className="post-request__header animate-fade-up">
          <button className="post-request__back" onClick={() => navigate("/requests")}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Requests
          </button>
          <div>
            <p className="post-request__eyebrow">Community Board</p>
            <h1 className="post-request__title">Post a <span className="post-request__title-accent">Request</span></h1>
            <p className="post-request__sub">Tell your community what you need. Someone nearby might have it.</p>
          </div>
        </div>

        <div className="post-request__body animate-fade-up delay-1">
          <div className="post-request__form-container">
            {error && <div className="post-request__error">{error}</div>}
            {success && <div className="post-request__success">{success}</div>}

            <form onSubmit={handleSubmit} className="post-request__form">
              <div className="post-request__field">
                <label className="post-request__label">What do you need? *</label>
                <input
                  type="text"
                  className="post-request__input"
                  placeholder="e.g., DSLR Camera for wedding shoot"
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                />
              </div>

              <div className="post-request__field">
                <label className="post-request__label">Description</label>
                <textarea
                  className="post-request__textarea"
                  placeholder="Tell them why you need it, when, any special requirements..."
                  rows="4"
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                />
              </div>

              <div className="post-request__row">
                <div className="post-request__field">
                  <label className="post-request__label">Category</label>
                  <select
                    className="post-request__select"
                    value={form.categoryId}
                    onChange={e => setForm({...form, categoryId: e.target.value})}
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="post-request__field">
                  <label className="post-request__label">Max Budget (Rs)</label>
                  <div className="post-request__input-group">
                    <span className="post-request__input-prefix">Rs</span>
                    <input
                      type="number"
                      className="post-request__input post-request__input--prefixed"
                      placeholder="Negotiable"
                      value={form.maxBudget}
                      onChange={e => setForm({...form, maxBudget: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="post-request__row">
                <div className="post-request__field">
                  <label className="post-request__label">Start Date *</label>
                  <input
                    type="date"
                    className="post-request__input"
                    value={form.startDate}
                    onChange={e => setForm({...form, startDate: e.target.value})}
                  />
                </div>

                <div className="post-request__field">
                  <label className="post-request__label">End Date *</label>
                  <input
                    type="date"
                    className="post-request__input"
                    value={form.endDate}
                    onChange={e => setForm({...form, endDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="post-request__row">
                <div className="post-request__field">
                  <label className="post-request__label">City</label>
                  <input
                    type="text"
                    className="post-request__input"
                    placeholder="Lahore"
                    value={form.city}
                    onChange={e => setForm({...form, city: e.target.value})}
                  />
                </div>

                <div className="post-request__field">
                  <label className="post-request__label">Area</label>
                  <input
                    type="text"
                    className="post-request__input"
                    placeholder="DHA Phase 5"
                    value={form.area}
                    onChange={e => setForm({...form, area: e.target.value})}
                  />
                </div>
              </div>

              <button type="submit" className="post-request__btn" disabled={loading}>
                {loading ? "Posting..." : "Post Request"}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </form>
          </div>

          <aside className="post-request__sidebar">
            <div className="post-request__hint">
              <p className="post-request__hint-title">✨ Pro Tips</p>
              <ul className="post-request__hint-list">
                <li>Be specific about what you need</li>
                <li>Mention exact dates for better matches</li>
                <li>Set a realistic budget</li>
                <li>Add your area for local lending</li>
                <li>Clear descriptions get faster responses</li>
              </ul>
            </div>

            <div className="post-request__hint post-request__hint--accent">
              <p className="post-request__hint-title">💡 Did you know?</p>
              <p className="post-request__hint-body">
                Most requests get responses within 24 hours. Your community is here to help!
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
