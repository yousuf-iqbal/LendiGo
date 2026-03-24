import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const CATEGORIES = [
  { id: 1, name: 'Electronics' },
  { id: 2, name: 'Party Supplies' },
  { id: 3, name: 'Vehicles' },
  { id: 4, name: 'Tools' },
  { id: 6, name: 'Sports' },
];

export default function PostRequestPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    city: '',
    area: '',
    startDate: '',
    endDate: '',
    maxBudget: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    // Check if token exists
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login first');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    // Validation - Title
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    if (form.title.length < 5) {
      setError('Title must be at least 5 characters');
      return;
    }
    if (form.title.length > 100) {
      setError('Title must be less than 100 characters');
      return;
    }

    // Validation - Description
    if (!form.description.trim()) {
      setError('Description is required');
      return;
    }
    if (form.description.length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }
    if (form.description.length > 500) {
      setError('Description must be less than 500 characters');
      return;
    }

    // Validation - Category
    if (!form.category) {
      setError('Please select a category');
      return;
    }

    // Validation - City
    if (!form.city.trim()) {
      setError('City is required');
      return;
    }
    if (!/^[a-zA-Z\s]{2,50}$/.test(form.city.trim())) {
      setError('City name should only contain letters and spaces (2-50 characters)');
      return;
    }

    // Validation - Area (optional but if provided, validate)
    if (form.area && !/^[a-zA-Z0-9\s]{2,50}$/.test(form.area.trim())) {
      setError('Area name should only contain letters, numbers, and spaces');
      return;
    }

    // Validation - Start Date
    if (!form.startDate) {
      setError('Start date is required');
      return;
    }
    if (form.startDate < today) {
      setError('Start date cannot be in the past');
      return;
    }

    // Validation - End Date
    if (!form.endDate) {
      setError('End date is required');
      return;
    }
    if (form.endDate <= form.startDate) {
      setError('End date must be after start date');
      return;
    }

    // Validation - Max Budget (optional but if provided, validate)
    if (form.maxBudget) {
      const budget = Number(form.maxBudget);
      if (isNaN(budget) || budget <= 0) {
        setError('Budget must be a positive number');
        return;
      }
      if (budget > 1000000) {
        setError('Budget cannot exceed 1,000,000 PKR');
        return;
      }
    }

    try {
      setLoading(true);
      
      const requestData = {
        title: form.title.trim(),
        description: form.description.trim(),
        categoryID: Number(form.category),
        city: form.city.trim(),
        area: form.area.trim() || null,
        startDate: form.startDate,
        endDate: form.endDate,
        maxBudget: form.maxBudget ? Number(form.maxBudget) : null,
      };
      
      console.log('Sending request:', requestData);
      
      const res = await API.post('/requests', requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Response:', res.data);
      navigate(`/requests/${res.data.request.RequestID}`);
    } catch (err) {
      console.error('Error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Could not post request. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <button style={styles.back} onClick={() => navigate('/requests')}>← Back to Board</button>

      <div style={styles.card}>
        <h1 style={styles.title}>Post a Request</h1>
        <p style={styles.subtitle}>Tell lenders what you need and for how long</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Title *</label>
          <input
            style={styles.input}
            name="title"
            placeholder="e.g. Need a DSLR camera for wedding"
            value={form.title}
            onChange={handleChange}
            maxLength="100"
          />

          <label style={styles.label}>Description *</label>
          <textarea
            style={{ ...styles.input, height: 100, resize: 'vertical' }}
            name="description"
            placeholder="Describe what you need, when, and any special requirements..."
            value={form.description}
            onChange={handleChange}
            maxLength="500"
          />

          <label style={styles.label}>Category *</label>
          <select style={styles.input} name="category" value={form.category} onChange={handleChange}>
            <option value="">Select a category</option>
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>City *</label>
              <input
                style={styles.input}
                name="city"
                placeholder="e.g. Lahore"
                value={form.city}
                onChange={handleChange}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Area</label>
              <input
                style={styles.input}
                name="area"
                placeholder="e.g. DHA Phase 5"
                value={form.area}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Start Date *</label>
              <input
                style={styles.input}
                name="startDate"
                type="date"
                min={today}
                value={form.startDate}
                onChange={handleChange}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>End Date *</label>
              <input
                style={styles.input}
                name="endDate"
                type="date"
                min={form.startDate || today}
                value={form.endDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <label style={styles.label}>Max Budget (PKR) - Optional</label>
          <input
            style={styles.input}
            name="maxBudget"
            type="number"
            min="0"
            step="1000"
            placeholder="e.g. 5000"
            value={form.maxBudget}
            onChange={handleChange}
          />

          <button style={loading ? styles.btnDisabled : styles.btn} type="submit" disabled={loading}>
            {loading ? 'Posting...' : 'Post Request'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { 
    maxWidth: 620, 
    margin: '0 auto', 
    padding: '30px 20px', 
    fontFamily: 'Segoe UI, sans-serif' 
  },
  back: { 
    background: 'none', 
    border: 'none', 
    color: '#4f46e5', 
    fontSize: 14, 
    cursor: 'pointer', 
    marginBottom: 20, 
    padding: 0, 
    fontWeight: 600 
  },
  card: { 
    background: '#fff', 
    border: '1px solid #e5e7eb', 
    borderRadius: 14, 
    padding: '36px 32px', 
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)' 
  },
  title: { 
    fontSize: 26, 
    fontWeight: 700, 
    margin: '0 0 6px', 
    color: '#1a1a2e' 
  },
  subtitle: { 
    color: '#888', 
    fontSize: 14, 
    margin: '0 0 28px' 
  },
  label: { 
    display: 'block', 
    fontSize: 13, 
    fontWeight: 600, 
    color: '#444', 
    marginBottom: 6 
  },
  input: { 
    width: '100%', 
    padding: '11px 14px', 
    border: '1.5px solid #e5e7eb', 
    borderRadius: 8, 
    fontSize: 14, 
    marginBottom: 18, 
    boxSizing: 'border-box', 
    outline: 'none', 
    fontFamily: 'inherit' 
  },
  row: { 
    display: 'flex', 
    gap: 16 
  },
  btn: { 
    width: '100%', 
    background: '#4f46e5', 
    color: '#fff', 
    border: 'none', 
    borderRadius: 8, 
    padding: '13px', 
    fontSize: 15, 
    fontWeight: 600, 
    cursor: 'pointer', 
    marginTop: 4 
  },
  btnDisabled: { 
    width: '100%', 
    background: '#a5b4fc', 
    color: '#fff', 
    border: 'none', 
    borderRadius: 8, 
    padding: '13px', 
    fontSize: 15, 
    fontWeight: 600, 
    cursor: 'not-allowed', 
    marginTop: 4 
  },
  error: { 
    background: '#fef2f2', 
    color: '#dc2626', 
    border: '1px solid #fecaca', 
    borderRadius: 8, 
    padding: '10px 14px', 
    marginBottom: 20, 
    fontSize: 14 
  },
};