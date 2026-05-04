import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

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
        const res = await API.get('/requests/categories');
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
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError("End date must be after start date");
      return;
    }
    
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      categoryId: form.categoryId ? parseInt(form.categoryId) : null,
      startDate: form.startDate,
      endDate: form.endDate,
      maxBudget: form.maxBudget ? parseFloat(form.maxBudget) : null,
      city: form.city.trim(),
      area: form.area.trim()
    };

    try {
      await API.post("/requests", payload);
      setSuccess("Request posted successfully!");
      setTimeout(() => navigate("/my-requests"), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to post request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #fff 50%, #eff6ff 100%)', padding: '2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Back Button */}
        <button 
          onClick={() => navigate("/requests")} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#059669', 
            cursor: 'pointer', 
            marginBottom: '1.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            fontSize: '1rem',
            fontWeight: 500,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.target.style.color = '#047857'; e.target.style.transform = 'translateX(-4px)'; }}
          onMouseLeave={(e) => { e.target.style.color = '#059669'; e.target.style.transform = 'translateX(0)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Requests
        </button>

        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{ color: '#059669', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Community Board</p>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1f2937', marginBottom: '0.75rem', lineHeight: 1.2 }}>
            Post a <span style={{ color: '#059669' }}>Request</span>
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1.1rem', maxWidth: '600px', lineHeight: 1.6 }}>
            Tell your community what you need. Someone nearby might have it.
          </p>
        </div>

        {/* Form Container */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
          {/* Main Form */}
          <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            {error && (
              <div style={{ 
                background: '#fee2e2', 
                color: '#dc2626', 
                padding: '1rem 1.25rem', 
                borderRadius: '12px', 
                marginBottom: '1.5rem',
                border: '1px solid #fca5a5',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div style={{ 
                background: '#dcfce7', 
                color: '#166534', 
                padding: '1rem 1.25rem', 
                borderRadius: '12px', 
                marginBottom: '1.5rem',
                border: '1px solid #86efac',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{ fontSize: '1.25rem' }}>✅</span>
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Title */}
              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.625rem', fontWeight: 600, color: '#374151', fontSize: '0.95rem' }}>
                  What do you need? <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., DSLR Camera for wedding shoot"
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '0.875rem 1rem', 
                    borderRadius: '12px', 
                    border: '1px solid #d1d5db',
                    fontSize: '1rem',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#059669'; e.target.style.boxShadow = '0 0 0 3px rgba(5, 150, 105, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.625rem', fontWeight: 600, color: '#374151', fontSize: '0.95rem' }}>
                  Description
                </label>
                <textarea
                  placeholder="Tell them why you need it, when, any special requirements..."
                  rows="4"
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  style={{ 
                    width: '100%', 
                    padding: '0.875rem 1rem', 
                    borderRadius: '12px', 
                    border: '1px solid #d1d5db',
                    fontSize: '1rem',
                    resize: 'vertical',
                    minHeight: '120px',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#059669'; e.target.style.boxShadow = '0 0 0 3px rgba(5, 150, 105, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Category & Budget */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.625rem', fontWeight: 600, color: '#374151', fontSize: '0.95rem' }}>
                    Category
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={e => setForm({...form, categoryId: e.target.value})}
                    style={{ 
                      width: '100%', 
                      padding: '0.875rem 1rem', 
                      borderRadius: '12px', 
                      border: '1px solid #d1d5db',
                      fontSize: '1rem',
                      backgroundColor: '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#059669'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; }}
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.625rem', fontWeight: 600, color: '#374151', fontSize: '0.95rem' }}>
                    Max Budget (Rs)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ 
                      position: 'absolute', 
                      left: '1rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: '#6b7280',
                      fontWeight: 500
                    }}>Rs</span>
                    <input
                      type="number"
                      placeholder="Negotiable"
                      value={form.maxBudget}
                      onChange={e => setForm({...form, maxBudget: e.target.value})}
                      style={{ 
                        width: '100%', 
                        padding: '0.875rem 1rem 0.875rem 2.5rem', 
                        borderRadius: '12px', 
                        border: '1px solid #d1d5db',
                        fontSize: '1rem',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#059669'; e.target.style.boxShadow = '0 0 0 3px rgba(5, 150, 105, 0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>
              </div>

              {/* Start & End Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.625rem', fontWeight: 600, color: '#374151', fontSize: '0.95rem' }}>
                    Start Date <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm({...form, startDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    style={{ 
                      width: '100%', 
                      padding: '0.875rem 1rem', 
                      borderRadius: '12px', 
                      border: '1px solid #d1d5db',
                      fontSize: '1rem',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#059669'; e.target.style.boxShadow = '0 0 0 3px rgba(5, 150, 105, 0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.625rem', fontWeight: 600, color: '#374151', fontSize: '0.95rem' }}>
                    End Date <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm({...form, endDate: e.target.value})}
                    min={form.startDate || new Date().toISOString().split('T')[0]}
                    style={{ 
                      width: '100%', 
                      padding: '0.875rem 1rem', 
                      borderRadius: '12px', 
                      border: '1px solid #d1d5db',
                      fontSize: '1rem',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#059669'; e.target.style.boxShadow = '0 0 0 3px rgba(5, 150, 105, 0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              {/* City & Area */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.625rem', fontWeight: 600, color: '#374151', fontSize: '0.95rem' }}>
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="Lahore"
                    value={form.city}
                    onChange={e => setForm({...form, city: e.target.value})}
                    style={{ 
                      width: '100%', 
                      padding: '0.875rem 1rem', 
                      borderRadius: '12px', 
                      border: '1px solid #d1d5db',
                      fontSize: '1rem',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#059669'; e.target.style.boxShadow = '0 0 0 3px rgba(5, 150, 105, 0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.625rem', fontWeight: 600, color: '#374151', fontSize: '0.95rem' }}>
                    Area
                  </label>
                  <input
                    type="text"
                    placeholder="DHA Phase 5"
                    value={form.area}
                    onChange={e => setForm({...form, area: e.target.value})}
                    style={{ 
                      width: '100%', 
                      padding: '0.875rem 1rem', 
                      borderRadius: '12px', 
                      border: '1px solid #d1d5db',
                      fontSize: '1rem',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#059669'; e.target.style.boxShadow = '0 0 0 3px rgba(5, 150, 105, 0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  width: '100%', 
                  padding: '1rem', 
                  background: loading ? '#9ca3af' : 'linear-gradient(135deg, #059669 0%, #10b981 100%)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontWeight: 700, 
                  fontSize: '1.05rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(5, 150, 105, 0.3)',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => { if (!loading) { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.4)'; } }}
                onMouseLeave={(e) => { if (!loading) { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.3)'; } }}
              >
                {loading ? 'Posting...' : 'Post Request'}
              </button>
            </form>
          </div>

          {/* Sidebar */}
          <div>
            <div style={{ background: '#fff', padding: '1.75rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>✨</span> Pro Tips
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#374151' }}>
                <li style={{ marginBottom: '0.75rem', lineHeight: 1.6 }}>Be specific about what you need</li>
                <li style={{ marginBottom: '0.75rem', lineHeight: 1.6 }}>Mention exact dates for better matches</li>
                <li style={{ marginBottom: '0.75rem', lineHeight: 1.6 }}>Set a realistic budget</li>
                <li style={{ marginBottom: '0.75rem', lineHeight: 1.6 }}>Add your area for local lending</li>
                <li style={{ lineHeight: 1.6 }}>Clear descriptions get faster responses</li>
              </ul>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', padding: '1.75rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #86efac' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#166534', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>💡</span> Did you know?
              </h3>
              <p style={{ color: '#166534', lineHeight: 1.6, margin: 0 }}>
                Most requests get responses within 24 hours. Your community is here to help!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}