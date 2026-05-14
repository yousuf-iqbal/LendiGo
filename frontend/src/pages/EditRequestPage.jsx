import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import Calendar from '../components/Calendar';
import '../theme.css';

const C = {
  saffron: "#F4A020", saffronDark: "#E08800", saffronPale: "#FFF0CC",
  maroon: "#800020", maroonL: "#B00030", maroonDeep: "#5C0018",
  brownLight: "#C4956A", cream: "#FDF6EC", warmWhite: "#FFF9F0",
  textDark: "#2C1810", textMuted: "#6B4C3B", textFaint: "#A68070",
  border: "rgba(128,0,32,0.12)", borderS: "rgba(128,0,32,0.25)",
};

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
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: C.textMuted, textAlign: 'center' }}>Loading request details...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>Lendigo</div>
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
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Start Date *</label>
              <Calendar 
                onDateSelect={(date) => setFormData({...formData, startDate: date.toISOString().split('T')[0]})}
                selectedDate={formData.startDate}
                minDate={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>End Date *</label>
              <Calendar 
                onDateSelect={(date) => setFormData({...formData, endDate: date.toISOString().split('T')[0]})}
                selectedDate={formData.endDate}
                minDate={formData.startDate || new Date().toISOString().split('T')[0]}
              />
            </div>
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
    background: C.cream,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    fontFamily: "'Outfit', sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: '560px',
    background: C.warmWhite,
    border: `1px solid ${C.border}`,
    borderRadius: '24px',
    padding: '2.5rem',
    boxShadow: '0 4px 24px rgba(128,0,32,0.08)',
  },
  logo: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '2rem',
    fontWeight: 700,
    color: C.maroon,
    marginBottom: '0.25rem',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: C.textMuted,
    fontSize: '0.9rem',
    marginBottom: '1.5rem',
  },
  error: {
    background: '#FEE2E2',
    border: '1px solid #FCA5A5',
    color: '#991B1B',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    fontSize: '0.875rem',
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.72rem',
    fontWeight: 700,
    color: C.textFaint,
    marginBottom: '0.4rem',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    background: C.cream,
    border: `1.5px solid ${C.border}`,
    borderRadius: '10px',
    color: C.textDark,
    fontSize: '0.95rem',
    outline: 'none',
    fontFamily: "'Outfit', sans-serif",
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
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
    background: C.maroon,
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: 700,
    fontFamily: "'Outfit', sans-serif",
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  secondaryBtn: {
    padding: '0.85rem',
    background: 'transparent',
    border: `1.5px solid ${C.border}`,
    borderRadius: '10px',
    color: C.textMuted,
    fontSize: '0.95rem',
    fontWeight: 600,
    fontFamily: "'Outfit', sans-serif",
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  switchText: {
    textAlign: 'center',
    color: C.textFaint,
    fontSize: '0.85rem',
    marginTop: '1.5rem',
  },
  link: {
    color: C.maroon,
    textDecoration: 'none',
    fontWeight: 600,
  },
};

// Add focus styles for inputs
const inputFocusStyle = `
  input:focus, textarea:focus, select:focus {
    border-color: ${C.saffron} !important;
    box-shadow: 0 0 0 3px rgba(244,160,32,0.15) !important;
  }
`;
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = inputFocusStyle;
  document.head.appendChild(style);
}