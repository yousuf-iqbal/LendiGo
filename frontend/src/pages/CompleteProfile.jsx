// src/pages/CompleteProfile.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import API from '../api/axios';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shake, setShake] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [cnic, setCnic] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [cnicPic, setCnicPic] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const user = auth.currentUser;
      
      if (!user) {
        navigate('/auth', { replace: true });
        return;
      }
      
      try {
        await user.reload();
        if (!user.emailVerified) {
          navigate('/auth', { state: { view: 'verify' }, replace: true });
        }
      } catch {
        navigate('/auth', { replace: true });
      }
    };
    
    checkAuth();
  }, [navigate]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };


const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setSuccess('');

  // Validation
  if (!fullName.trim()) {
    setError('Full name is required');
    triggerShake();
    return;
  }
  if (!/^[a-zA-Z\s]+$/.test(fullName)) {
    setError('Name can only contain letters');
    triggerShake();
    return;
  }
  if (!/^03\d{9}$/.test(phone)) {
    setError('Phone must be 11 digits starting with 03');
    triggerShake();
    return;
  }
  if (!city.trim()) {
    setError('City is required');
    triggerShake();
    return;
  }
  if (!/^\d{13}$/.test(cnic)) {
    setError('CNIC must be exactly 13 digits');
    triggerShake();
    return;
  }

  setLoading(true);
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Prepare FormData
    const formData = new FormData();
    formData.append('fullName', fullName.trim());
    formData.append('phone', phone);
    formData.append('city', city.trim());
    formData.append('area', area.trim());
    formData.append('cnic', cnic);
    
    if (profilePic) formData.append('profilePic', profilePic);
    if (cnicPic) formData.append('cnicPicture', cnicPic);

    console.log('📤 Sending profile data to backend...');

    // Send to backend
    const response = await API.post('/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    console.log('📥 Backend response:', response.data);
    
    // ✅ Check if user exists in response
    if (response.data && response.data.user) {
      console.log('✅ User object received:', response.data.user);
      const userData = response.data.user;
      
      // Save to localStorage
      localStorage.setItem('udhaari_user', JSON.stringify(userData));
      console.log('✅ Saved to localStorage:', localStorage.getItem('udhaari_user'));
    } else {
      console.error('❌ NO USER in response! Response:', response.data);
      // If no user in response, try to login to get it
      try {
       const token = await auth.currentUser.getIdToken(true);
const loginRes = await API.post('/auth/login', {}, {
  headers: { Authorization: `Bearer ${token}` }
});
        if (loginRes.data.user) {
          localStorage.setItem('udhaari_user', JSON.stringify(loginRes.data.user));
          console.log('✅ Got user from login:', loginRes.data.user);
        }
      } catch (loginErr) {
        console.error('❌ Login also failed:', loginErr);
      }
    }
    
    // Clear pending data
    localStorage.removeItem('udhaari_pending_profile');
    localStorage.removeItem('udhaari_pending_email');
    
    setSuccess('✅ Profile saved! Welcome to UDHAARiii 🎉');
    
    // Redirect
    setTimeout(() => {
      console.log('🧭 Navigating to home...');
      console.log('📦 localStorage before nav:', localStorage.getItem('udhaari_user'));
      navigate('/', { replace: true });
    }, 2000);
    
  } catch (err) {
    console.error('❌ Submission error:', err);
    console.error('Error response:', err.response?.data);
    setError(err.response?.data?.error || err.message || 'Failed to save profile');
    triggerShake();
  }
  setLoading(false);
};

  // Validation helpers
  const isPhoneValid = /^03\d{9}$/.test(phone);
  const isCnicValid = /^\d{13}$/.test(cnic);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #050508 0%, #0f0518 40%, #1a0b2e 100%)',
      fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
      padding: '1.5rem',
    }}>
      {/* Particle Background */}
      <ParticleBackground />

      {/* Ambient blobs */}
      <div style={{ position:'fixed', top:'-10%', left:'-5%', width:'40vw', height:'40vw', borderRadius:'50%', background:'radial-gradient(circle, #7c3aed50 0%, #4c1d9530 40%, transparent 75%)', filter:'blur(80px)', pointerEvents:'none' }} />
      <div style={{ position:'fixed', bottom:'-10%', right:'-5%', width:'32vw', height:'32vw', borderRadius:'50%', background:'radial-gradient(circle, #6d28d940 0%, #2e106530 40%, transparent 75%)', filter:'blur(80px)', pointerEvents:'none' }} />

      {/* Card */}
      <div style={{
        width: 'min(92vw, 750px)',
        maxWidth: '780px',
        borderRadius: 24,
        overflow: 'visible',
        position: 'relative',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.12), 0 0 60px rgba(109,40,217,0.15)',
        background: 'rgba(8, 5, 12, 0.98)',
        backdropFilter: 'blur(10px)',
        padding: '2rem 2.25rem',
        animation: 'slideUp 0.5s ease-out',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 32px rgba(139,92,246,0.5)',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>
            Complete Your Profile
          </h1>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div style={{
            padding: '0.7rem 1rem',
            borderRadius: 10,
            marginBottom: '1.25rem',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#fca5a5',
            fontSize: '0.85rem',
            animation: shake ? 'shake 0.5s ease-in-out' : 'none',
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: '0.7rem 1rem',
            borderRadius: 10,
            marginBottom: '1.25rem',
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.25)',
            color: '#86efac',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Full Name - Full Width */}
          <FloatingField
            label="Full Name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            }
          />

          {/* City & Area - 2 Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <FloatingField
              label="City"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 21h18M5 21V7l8-4 8 4v14M9 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0M17 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0"/>
                </svg>
              }
            />
            <FloatingField
              label="Area (Optional)"
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                  <path d="M2 12h20"/>
                </svg>
              }
            />
          </div>

          {/* Phone & CNIC - 2 Columns with Validation Messages */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <FloatingField
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={11}
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                }
              />
              {/* Phone Validation Message */}
              {phone.length > 0 && !isPhoneValid && (
                <p style={{
                  color: '#fca5a5',
                  fontSize: '0.75rem',
                  margin: '0.25rem 0 0 0',
                  paddingLeft: '0.25rem',
                }}>
                  Number should start from 03 and have 11 digits
                </p>
              )}
            </div>
            <div>
              <FloatingField
                label="CNIC Number"
                type="text"
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                maxLength={13}
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="16" rx="2"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                }
              />
              {/* CNIC Validation Message */}
              {cnic.length > 0 && !isCnicValid && (
                <p style={{
                  color: '#fca5a5',
                  fontSize: '0.75rem',
                  margin: '0.25rem 0 0 0',
                  paddingLeft: '0.25rem',
                }}>
                  CNIC must contain 13 digits
                </p>
              )}
            </div>
          </div>

          {/* File Uploads - 2 Columns */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '1.25rem',
            marginBottom: '1.5rem',
          }}>
            <div>
              <label style={{ display:'block', fontSize:'0.7rem', fontWeight:600, color:'rgba(255,255,255,0.4)', marginBottom:8, letterSpacing:'0.09em', textTransform:'uppercase' }}>
                Profile Picture
              </label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setProfilePic(e.target.files[0])} 
                style={{
                  width:'100%', 
                  padding:'0.65rem', 
                  background:'rgba(255,255,255,0.04)',
                  border:'1px solid rgba(255,255,255,0.1)', 
                  borderRadius:10,
                  color:'rgba(255,255,255,0.5)', 
                  fontSize:'0.8rem', 
                  cursor:'pointer',
                }} 
              />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.7rem', fontWeight:600, color:'rgba(255,255,255,0.4)', marginBottom:8, letterSpacing:'0.09em', textTransform:'uppercase' }}>
                CNIC Picture
              </label>
              <input 
                type="file" 
                accept="image/*,.pdf" 
                onChange={(e) => setCnicPic(e.target.files[0])} 
                style={{
                  width:'100%', 
                  padding:'0.65rem', 
                  background:'rgba(255,255,255,0.04)',
                  border:'1px solid rgba(255,255,255,0.1)', 
                  borderRadius:10,
                  color:'rgba(255,255,255,0.5)', 
                  fontSize:'0.8rem', 
                  cursor:'pointer',
                }} 
              />
            </div>
          </div>

          {/* Submit Button */}
          <RippleButton loading={loading} type="submit">
            {loading ? (
              <>
                <span style={{
                  width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid #fff', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite', display: 'inline-block',
                  marginRight: 8,
                }} />
                Saving...
              </>
            ) : (
              <>
                Save & Continue
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 8 }}>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </>
            )}
          </RippleButton>
        </form>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes ripple {
          to { transform: translate(-50%, -50%) scale(25); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

// ── Floating Field Component ─────────────────────────────────────────────────
function FloatingField({ label, type, value, onChange, icon, maxLength }) {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  useEffect(() => {
    setHasValue(value.length > 0);
  }, [value]);

  return (
    <div style={{ marginBottom: '0', position: 'relative' }}>
      <div style={{
        position: 'relative',
        background: focused ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${focused ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 12,
        padding: '1rem 1rem 0.6rem',
        transition: 'all 0.2s',
        boxShadow: focused ? '0 0 0 4px rgba(139,92,246,0.15)' : 'none',
      }}>
        <label style={{
          position: 'absolute',
          left: '1rem',
          top: focused || hasValue ? '0.4rem' : '1rem',
          fontSize: focused || hasValue ? '0.7rem' : '0.95rem',
          color: focused ? '#a78bfa' : 'rgba(255,255,255,0.4)',
          transition: 'all 0.2s',
          pointerEvents: 'none',
          fontWeight: 500,
        }}>
          {label}
        </label>
        <input
          type={type}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#fff',
            fontSize: '0.95rem',
            paddingTop: '0.2rem',
            fontFamily: 'inherit',
          }}
        />
        {icon && (
          <div style={{
            position: 'absolute',
            right: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: focused ? '#a78bfa' : 'rgba(255,255,255,0.3)',
            transition: 'color 0.2s',
          }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Ripple Button Component ──────────────────────────────────────────────────
function RippleButton({ children, loading, type, onClick }) {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    if (loading) return;
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple = { x, y, id: Date.now() };
    setRipples((prev) => [...prev, newRipple]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== newRipple.id)), 600);
    onClick?.(e);
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={loading}
      style={{
        width: '100%',
        padding: '0.85rem',
        background: loading ? '#5b21b6' : 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
        border: 'none',
        borderRadius: 12,
        color: '#fff',
        fontSize: '0.95rem',
        fontWeight: 700,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.75 : 1,
        boxShadow: loading ? 'none' : '0 4px 18px rgba(109,40,217,0.4)',
        transition: 'all 0.2s',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(109,40,217,0.5)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 18px rgba(109,40,217,0.4)';
      }}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          style={{
            position: 'absolute',
            width: '20px',
            height: '20px',
            background: 'rgba(255,255,255,0.4)',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%) scale(0)',
            animation: 'ripple 0.6s ease-out',
            left: ripple.x,
            top: ripple.y,
            pointerEvents: 'none',
          }}
        />
      ))}
      {children}
    </button>
  );
}

// ── Particle Background ──────────────────────────────────────────────────────
function ParticleBackground() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 5,
      }));
      setParticles(newParticles);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
      zIndex: 0,
    }}>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: 'rgba(139,92,246,0.3)',
            borderRadius: '50%',
            animation: `float ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}