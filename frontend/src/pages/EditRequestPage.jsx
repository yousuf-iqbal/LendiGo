import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';

export default function EditRequestPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryID: '',
    city: '',
    area: '',
    startDate: '',
    endDate: '',
    maxBudget: ''
  });

  useEffect(() => {
    // Fetch request details
    const fetchRequest = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await API.get(`/requests/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const request = response.data;
        setFormData({
          title: request.title,
          description: request.description,
          categoryID: request.categoryID,
          city: request.city,
          area: request.area || '',
          startDate: request.startDate ? request.startDate.split('T')[0] : '',
          endDate: request.endDate ? request.endDate.split('T')[0] : '',
          maxBudget: request.maxBudget || ''
        });
      } catch (err) {
        console.error('Error fetching request:', err);
        setError('Failed to load request');
        setTimeout(() => navigate('/my-requests'), 2000);
      }
    };

    // Fetch categories
    const fetchCategories = async () => {
      try {
        const response = await API.get('/requests/filters');
        setCategories(response.data.categories);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    Promise.all([fetchRequest(), fetchCategories()]).finally(() => setLoading(false));
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await API.put(`/requests/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/requests/${id}`);
    } catch (err) {
      console.error('Error updating request:', err);
      setError(err.response?.data?.error || 'Failed to update request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logo}>Udhaari</div>
          <div style={styles.subtitle}>Loading request details...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>Udhaari</div>
        <div style={styles.subtitle}>Edit Request</div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <Field 
            label="Title *"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Need a camera for wedding"
          />

          <div style={{ marginBottom: '1rem' }}>
            <label style={styles.label}>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what you need, when, and any special requirements..."
              required
              rows="4"
              style={{ ...styles.input, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={styles.label}>Category *</label>
            <select
              name="categoryID"
              value={formData.categoryID}
              onChange={handleChange}
              required
              style={styles.input}
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div style={styles.row}>
            <Field 
              label="City *"
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Lahore"
            />
            <Field 
              label="Area (optional)"
              type="text"
              name="area"
              value={formData.area}
              onChange={handleChange}
              placeholder="DHA Phase 5"
            />
          </div>

          <div style={styles.row}>
            <Field 
              label="Start Date *"
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
            />
            <Field 
              label="End Date *"
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
            />
          </div>

          <Field 
            label="Max Budget (PKR) *"
            type="number"
            name="maxBudget"
            value={formData.maxBudget}
            onChange={handleChange}
            placeholder="5000"
            step="1000"
          />

          <div style={styles.buttonGroup}>
            <button 
              type="button" 
              onClick={() => navigate(`/requests/${id}`)}
              style={styles.secondaryBtn}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              style={{
                ...styles.primaryBtn,
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        <p style={styles.switchText}>
          <Link to={`/requests/${id}`} style={styles.link}>Back to Request Details</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', name, value, onChange, placeholder, required = false }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={styles.input}
      />
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: '560px',
    background: '#13131a',
    border: '1px solid #ffffff12',
    borderRadius: '24px',
    padding: '2.5rem',
  },
  logo: {
    fontFamily: "'Syne', sans-serif",
    fontSize: '1.8rem',
    fontWeight: 800,
    color: '#7c5cfc',
    marginBottom: '0.25rem',
    letterSpacing: '-0.03em',
  },
  subtitle: {
    color: '#888',
    fontSize: '0.9rem',
    marginBottom: '1.5rem',
  },
  error: {
    background: '#ff5e7815',
    border: '1px solid #ff5e7830',
    color: '#ff5e78',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    fontSize: '0.875rem',
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 500,
    color: '#888',
    marginBottom: '0.4rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    background: '#0a0a0f',
    border: '1px solid #ffffff12',
    borderRadius: '10px',
    color: '#f0f0f5',
    fontSize: '0.95rem',
    outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
  },
  buttonGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
    marginTop: '1rem',
  },
  primaryBtn: {
    padding: '0.85rem',
    background: '#7c5cfc',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: 700,
    fontFamily: "'Syne', sans-serif",
    cursor: 'pointer',
    letterSpacing: '0.02em',
  },
  secondaryBtn: {
    padding: '0.85rem',
    background: 'transparent',
    border: '1px solid #ffffff12',
    borderRadius: '10px',
    color: '#888',
    fontSize: '0.95rem',
    fontWeight: 700,
    fontFamily: "'Syne', sans-serif",
    cursor: 'pointer',
  },
  switchText: {
    textAlign: 'center',
    color: '#666',
    fontSize: '0.85rem',
    marginTop: '1.5rem',
  },
  link: {
    color: '#7c5cfc',
    textDecoration: 'none',
    fontWeight: 500,
  },
};
