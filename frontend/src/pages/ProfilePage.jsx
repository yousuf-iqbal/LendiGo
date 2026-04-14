import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    city: '',
    area: '',
    cnic: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    const userStr = localStorage.getItem('udhaari_user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      setFormData({
        fullName: userData.fullName || '',
        phone: userData.phone || '',
        city: userData.city || '',
        area: userData.area || '',
        cnic: userData.cnic || ''
      });
    }
    setLoading(false);
  }, [navigate]);

  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.name === 'cnic') {
      value = value.replace(/\D/g, '');
      if (value.length > 13) value = value.slice(0, 13);
      if (value.length > 5) {
        value = value.slice(0, 5) + '-' + value.slice(5);
      }
      if (value.length > 13) {
        value = value.slice(0, 13) + '-' + value.slice(13, 14);
      }
    }
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await API.put('/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Get current user from localStorage
      const currentUser = JSON.parse(localStorage.getItem('udhaari_user') || '{}');
      
      // Update localStorage with new data
      const updatedUser = { 
        ...currentUser, 
        ...formData,
        fullName: formData.fullName,
        phone: formData.phone,
        city: formData.city,
        area: formData.area
      };
      localStorage.setItem('udhaari_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setSuccess('Profile updated successfully!');
      setEditing(false);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('udhaari_user');
    navigate('/login');
  };

  if (loading && !user) {
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
        <div style={styles.subtitle}>
          {editing ? 'Edit Profile' : 'My Profile'}
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <div style={styles.avatarSection}>
          <img 
            src={user?.profilePic || 'https://ui-avatars.com/api/?background=7c5cfc&color=fff&bold=true&size=100&name=' + (user?.fullName?.charAt(0) || 'U')} 
            alt="Profile" 
            style={styles.avatar}
          />
        </div>

        {!editing ? (
          <>
            <div style={styles.infoSection}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Full Name:</span>
                <span style={styles.infoValue}>{user?.fullName || 'Not set'}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Phone:</span>
                <span style={styles.infoValue}>{user?.phone || 'Not set'}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>City:</span>
                <span style={styles.infoValue}>{user?.city || 'Not set'}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Area:</span>
                <span style={styles.infoValue}>{user?.area || 'Not set'}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>CNIC:</span>
                <span style={styles.infoValue}>{user?.cnic || 'Not set'}</span>
              </div>
            </div>

            <button onClick={() => setEditing(true)} style={styles.editBtn}>
              Edit Profile
            </button>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Sign Out
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={styles.field}>
              <label style={styles.label}>Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={styles.input}
                placeholder="03001234567"
                required
              />
            </div>

            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Area</label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., DHA Phase 5"
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>CNIC Number *</label>
              <input
                type="text"
                name="cnic"
                value={formData.cnic}
                onChange={handleChange}
                style={styles.input}
                placeholder="35201-1234567-1"
                maxLength="15"
                required
              />
            </div>

            <div style={styles.buttonGroup}>
              <button type="button" onClick={() => setEditing(false)} style={styles.cancelBtn}>
                Cancel
              </button>
              <button type="submit" disabled={loading} style={styles.saveBtn}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        <p style={styles.switchText}>
          <Link to="/requests" style={styles.link}>← Back to Requests</Link>
        </p>
      </div>
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
    background: '#10b98115',
    border: '1px solid #10b98130',
    color: '#10b981',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    fontSize: '0.875rem',
    marginBottom: '1rem',
  },
  avatarSection: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  avatar: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #7c5cfc',
  },
  infoSection: {
    marginBottom: '2rem',
  },
  infoRow: {
    display: 'flex',
    padding: '12px 0',
    borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
  },
  infoLabel: {
    width: '100px',
    color: '#888',
    fontSize: '14px',
    fontWeight: 500,
  },
  infoValue: {
    color: '#fff',
    fontSize: '14px',
    flex: 1,
  },
  field: {
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
  editBtn: {
    width: '100%',
    padding: '0.85rem',
    background: '#7c5cfc',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '1rem',
  },
  saveBtn: {
    padding: '0.85rem',
    background: '#7c5cfc',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  cancelBtn: {
    padding: '0.85rem',
    background: 'transparent',
    border: '1px solid #ffffff12',
    borderRadius: '10px',
    color: '#888',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
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
    cursor: 'pointer',
  },
  switchText: {
    textAlign: 'center',
    color: '#666',
    fontSize: '0.85rem',
    marginTop: '1.5rem',
  },
  link: {
    color: '#5cfc91',
    textDecoration: 'none',
    fontWeight: 500,
  },
};
