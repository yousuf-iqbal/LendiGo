import { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../config/firebase';
import API from '../api/axios';

export default function SignupPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [cnic, setCnic] = useState('');

  const handleStep1 = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      return setError('Passwords do not match.');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      setStep(2);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email format.');
      } else {
        setError(err.message);
      }
    }
    setLoading(false);
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }
    if (!phone.match(/^03\d{9}$/)) {
      setError('Phone must be 11 digits starting with 03');
      return;
    }
    if (!cnic.match(/^\d{13}$/)) {
      setError('CNIC must be exactly 13 digits');
      return;
    }

    setLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      
      const userData = {
        fullName: fullName,
        phone: phone,
        city: city,
        area: area,
        cnic: cnic
      };
      
      console.log('Sending user data:', userData);
      
      await API.post('/auth/register', userData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStep(3);
    } catch (err) {
      console.error('Registration error:', err.response?.data);
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>Udhaari</div>
        <div style={styles.subtitle}>
          {step === 1 && 'Create your account'}
          {step === 2 && 'Complete your profile'}
          {step === 3 && 'Check your email'}
        </div>

        <div style={styles.steps}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{
              ...styles.stepDot,
              background: step >= s ? '#7c5cfc' : '#ffffff15',
            }} />
          ))}
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {step === 1 && (
          <form onSubmit={handleStep1}>
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="min 6 characters" />
            <Field label="Confirm Password" type="password" value={confirm} onChange={setConfirm} placeholder="repeat password" />
            <button type="submit" disabled={loading} style={styles.primaryBtn}>
              {loading ? 'Creating...' : 'Continue →'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2}>
            <Field label="Full Name" value={fullName} onChange={setFullName} placeholder="Your full name" />
            <Field label="Phone Number" value={phone} onChange={setPhone} placeholder="03001234567" />
            <div style={styles.row}>
              <Field label="City" value={city} onChange={setCity} placeholder="Lahore" />
              <Field label="Area" value={area} onChange={setArea} placeholder="DHA Phase 5" />
            </div>
            <Field label="CNIC Number" value={cnic} onChange={setCnic} placeholder="3520112345671" />
            <button type="submit" disabled={loading} style={styles.primaryBtn}>
              {loading ? 'Saving...' : 'Save Profile →'}
            </button>
            <button type="button" onClick={() => setStep(1)} style={styles.backBtn}>
              ← Back
            </button>
          </form>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <p style={{ color: '#ccc', marginBottom: '1.5rem' }}>
              Verification link sent to<br />
              <strong>{email}</strong>
            </p>
            <button onClick={() => navigate('/login')} style={styles.primaryBtn}>
              Go to Login
            </button>
          </div>
        )}

        {step !== 3 && (
          <p style={styles.switchText}>
            Already have an account? <Link to="/login" style={styles.link}>Log in</Link>
          </p>
        )}
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required
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
    maxWidth: '460px',
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
  },
  subtitle: {
    color: '#888',
    fontSize: '0.9rem',
    marginBottom: '1.5rem',
  },
  steps: {
    display: 'flex',
    gap: '8px',
    marginBottom: '1.5rem',
  },
  stepDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    transition: 'all 0.3s',
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
  primaryBtn: {
    width: '100%',
    padding: '0.85rem',
    background: '#7c5cfc',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  backBtn: {
    width: '100%',
    padding: '0.7rem',
    background: 'transparent',
    border: '1px solid #ffffff12',
    borderRadius: '10px',
    color: '#888',
    fontSize: '0.85rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
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
