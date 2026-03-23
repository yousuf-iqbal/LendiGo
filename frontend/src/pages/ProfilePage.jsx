import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    city: '',
    area: '',
    cnic: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        const response = await API.get('/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
        setFormData({
          fullName: response.data.fullName || '',
          phone: response.data.phone || '',
          city: response.data.city || '',
          area: response.data.area || '',
          cnic: response.data.cnic || ''
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await API.put('/auth/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logo}>Udhaari</div>
          <div style={styles.subtitle}>Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>Udhaari</div>
        <div style={styles.subtitle}>My Profile</div>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <Field 
            label="Full Name *"
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Your full name"
          />

          <Field 
            label="Email"
            type="email"
            value={user?.email || ''}
            disabled={true}
            placeholder="Email cannot be changed"
          />

          <Field 
            label="Phone Number *"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="03001234567"
          />

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
              label="Area"
              type="text"
              name="area"
              value={formData.area}
              onChange={handleChange}
              placeholder="DHA Phase 5"
            />
          </div>

          <Field 
            label="CNIC Number *"
            type="text"
            name="cnic"
            value={formData.cnic}
            onChange={handleChange}
            placeholder="3520112345671"
          />

          <button 
            type="submit" 
            disabled={saving}
            style={{
              ...styles.primaryBtn,
              opacity: saving ? 0.7 : 1,
              cursor: saving ? 'not-allowed' : 'pointer',
              marginTop: '1rem'
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        <div style={styles.divider} />

        <button 
          onClick={() => {
            localStorage.removeItem('token');
            navigate('/login');
          }}
          style={styles.logoutBtn}
        >
          Sign Out
        </button>

        <p style={styles.switchText}>
          <Link to="/requests" style={styles.link}>← Back to Requests</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', name, value, onChange, placeholder, disabled = false }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          ...styles.input,
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'text'
        }}
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
  success: {
    background: '#00ff8815',
    border: '1px solid #00ff8830',
    color: '#00ff88',
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
  primaryBtn: {
    width: '100%',
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
  logoutBtn: {
    width: '100%',
    padding: '0.85rem',
    background: 'transparent',
    border: '1px solid #ff5e78',
    borderRadius: '10px',
    color: '#ff5e78',
    fontSize: '0.95rem',
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer',
    marginTop: '1rem',
  },
  divider: {
    height: '1px',
    background: '#ffffff12',
    margin: '1.5rem 0',
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