// src/pages/CompleteProfile.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import API from '../api/axios';

// -- Validation helpers --
const nameValid = (v) => v.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(v.trim());
const phoneValid = (v) => /^03\d{9}$/.test(v);
const cnicValid = (v) => /^\d{13}$/.test(v);
const cityValid = (v) => v.trim().length >= 2;

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

  // Track which fields have been touched so we only show errors after interaction
  const [touched, setTouched] = useState({});

  useEffect(() => {
    const checkAuth = async () => {
      const user = auth.currentUser;
      if (!user) { navigate('/auth', { replace: true }); return; }
      try {
        await user.reload();
        if (!user.emailVerified) navigate('/auth', { state: { view: 'verify' }, replace: true });
      } catch {
        navigate('/auth', { replace: true });
      }
    };
    checkAuth();
  }, [navigate]);

  const touch = (field) => setTouched(t => ({ ...t, [field]: true }));

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // Phone: only digits, enforce 03 prefix, max 11
  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); // strip non-digits
    if (val.length > 11) val = val.slice(0, 11);  // hard cap at 11
    setPhone(val);
  };

  // CNIC: only digits, max 13
  const handleCnicChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 13) val = val.slice(0, 13);
    setCnic(val);
  };

  // Full name: only letters + spaces
  const handleNameChange = (e) => {
    const val = e.target.value;
    if (/^[a-zA-Z\s]*$/.test(val)) setFullName(val);
  };

  // City: only letters, spaces, hyphens
  const handleCityChange = (e) => {
    const val = e.target.value;
    if (/^[a-zA-Z\s\-]*$/.test(val)) setCity(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Touch all fields to show all errors
    setTouched({ fullName: true, phone: true, city: true, cnic: true });

    if (!nameValid(fullName)) { setError('Please enter a valid full name (letters only, at least 2 characters).'); triggerShake(); return; }
    if (!phoneValid(phone)) { setError('Phone must be 11 digits and start with 03 (e.g. 03001234567).'); triggerShake(); return; }
    if (!cityValid(city)) { setError('Please enter your city.'); triggerShake(); return; }
    if (!cnicValid(cnic)) { setError('CNIC must be exactly 13 digits.'); triggerShake(); return; }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const formData = new FormData();
      formData.append('fullName', fullName.trim());
      formData.append('phone', phone);
      formData.append('city', city.trim());
      formData.append('area', area.trim());
      formData.append('cnic', cnic);
      if (profilePic) formData.append('profilePic', profilePic);
      if (cnicPic) formData.append('cnicPicture', cnicPic);

      const response = await API.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data && response.data.user) {
        localStorage.setItem('udhaari_user', JSON.stringify(response.data.user));
      } else {
        try {
          const token = await auth.currentUser.getIdToken(true);
          const loginRes = await API.post('/auth/login', {}, { headers: { Authorization: `Bearer ${token}` } });
          if (loginRes.data.user) localStorage.setItem('udhaari_user', JSON.stringify(loginRes.data.user));
        } catch (loginErr) {
          console.error('Login fallback failed:', loginErr);
        }
      }

      localStorage.removeItem('udhaari_pending_profile');
      localStorage.removeItem('udhaari_pending_email');

      setSuccess('Profile saved! Welcome to LendiGo.');
      setTimeout(() => navigate('/', { replace: true }), 2000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save profile');
      triggerShake();
    }
    setLoading(false);
  };

  // Field-level validation states
  const nameErr = touched.fullName && !nameValid(fullName);
  const phoneErr = touched.phone && !phoneValid(phone);
  const cityErr = touched.city && !cityValid(city);
  const cnicErr = touched.cnic && !cnicValid(cnic);

  const nameOk = touched.fullName && nameValid(fullName);
  const phoneOk = touched.phone && phoneValid(phone);
  const cityOk = touched.city && cityValid(city);
  const cnicOk = touched.cnic && cnicValid(cnic);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #FAF5F0 0%, #F5F0E8 50%, #FAF5F0 100%)',
      fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif",
      position: 'relative',
      overflowX: 'hidden',
      overflowY: 'auto',
      padding: '5rem 1.5rem 2.5rem',
    }}>
      <ParticleBackground />

      {/* Ambient blobs */}
      <div style={{ position: 'fixed', top: '-10%', left: '-5%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139, 21, 56, 0.06) 0%, rgba(107, 15, 26, 0.03) 40%, transparent 75%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-5%', width: '32vw', height: '32vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(217, 119, 6, 0.06) 0%, rgba(245, 158, 11, 0.03) 40%, transparent 75%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      {/* Card */}
      <div style={{
        width: 'min(82vw, 680px)',
        borderRadius: 24,
        position: 'relative',
        boxShadow: '0 24px 64px rgba(139, 21, 56, 0.13), 0 0 0 1px rgba(139, 21, 56, 0.07)',
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        padding: '2rem 2.25rem',
        animation: 'slideUp 0.5s ease-out',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 58, height: 58, borderRadius: '50%',
            background: 'linear-gradient(135deg, #8B1538 0%, #6B0F1A 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 28px rgba(139, 21, 56, 0.28)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4A0404', margin: '0 0 0.35rem', letterSpacing: '-0.02em' }}>
            Complete Your Profile
          </h1>
          <p style={{ color: 'rgba(74, 4, 4, 0.6)', fontSize: '0.9rem', margin: 0 }}>
            Just a few more details to get you started
          </p>
        </div>

        {/* Alert messages */}
        {error && (
          <div style={{
            padding: '0.9rem 1.2rem', borderRadius: 12, marginBottom: '1.5rem',
            background: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.25)',
            color: '#991B1B', fontSize: '0.95rem', lineHeight: 1.5,
            display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
            animation: shake ? 'shake 0.5s ease-in-out' : 'none',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: '0.9rem 1.2rem', borderRadius: 12, marginBottom: '1.5rem',
            background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)',
            color: '#166534', fontSize: '0.95rem',
            display: 'flex', alignItems: 'center', gap: '0.6rem',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <ValidatedField
            label="Full Name"
            type="text"
            value={fullName}
            onChange={handleNameChange}
            onBlur={() => touch('fullName')}
            isError={nameErr}
            isOk={nameOk}
            hint={nameErr ? 'Letters only, at least 2 characters' : null}
            counterText={fullName.length > 0 ? `${fullName.trim().split(/\s+/).filter(Boolean).length} word${fullName.trim().split(/\s+/).filter(Boolean).length !== 1 ? 's' : ''}` : null}
            icon={
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            }
          />

          {/* City and Area row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <ValidatedField
              label="City"
              type="text"
              value={city}
              onChange={handleCityChange}
              onBlur={() => touch('city')}
              isError={cityErr}
              isOk={cityOk}
              hint={cityErr ? 'Enter a valid city name' : null}
              icon={
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" /><circle cx="12" cy="10" r="3" />
                </svg>
              }
            />
            <ValidatedField
              label="Area (Optional)"
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              isError={false}
              isOk={false}
              icon={
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
                </svg>
              }
            />
          </div>

          {/* Phone and CNIC row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <ValidatedField
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              onBlur={() => touch('phone')}
              isError={phoneErr}
              isOk={phoneOk}
              hint={phoneErr ? (phone.length > 0 && !phone.startsWith('03') ? 'Must start with 03' : `${phone.length}/11 digits`) : null}
              counterText={phone.length > 0 ? `${phone.length}/11` : null}
              counterOk={phone.length === 11}
              maxLength={11}
              inputMode="numeric"
              placeholder="03001234567"
              icon={
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.19 11.9 19.79 19.79 0 0 1 1.12 3.26 2 2 0 0 1 3.1 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z" />
                </svg>
              }
            />
            <ValidatedField
              label="CNIC Number"
              type="text"
              value={cnic}
              onChange={handleCnicChange}
              onBlur={() => touch('cnic')}
              isError={cnicErr}
              isOk={cnicOk}
              hint={cnicErr ? `${cnic.length}/13 digits entered` : null}
              counterText={cnic.length > 0 ? `${cnic.length}/13` : null}
              counterOk={cnic.length === 13}
              maxLength={13}
              inputMode="numeric"
              placeholder="3520112345671"
              icon={
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              }
            />
          </div>

          {/* File Uploads */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <FileUploadField
              label="Profile Picture"
              accept="image/*"
              file={profilePic}
              onChange={(e) => setProfilePic(e.target.files[0])}
              optional
            />
            <FileUploadField
              label="CNIC Picture"
              accept="image/*,.pdf"
              file={cnicPic}
              onChange={(e) => setCnicPic(e.target.files[0])}
              optional
            />
          </div>

          {/* Submit */}
          <RippleButton loading={loading} type="submit">
            {loading ? (
              <>
                <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', marginRight: 10 }} />
                Saving...
              </>
            ) : (
              <>
                Save and Continue
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 8 }}>
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </RippleButton>
        </form>
      </div>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); } 20%, 40%, 60%, 80% { transform: translateX(8px); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes ripple { to { transform: translate(-50%, -50%) scale(25); opacity: 0; } }
        @keyframes float { 0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; } 50% { transform: translateY(-20px) translateX(10px); opacity: 0.6; } }
      `}</style>
    </div>
  );
}

// -- Validated Field Component --
function ValidatedField({ label, type, value, onChange, onBlur, isError, isOk, hint, counterText, counterOk, maxLength, inputMode, placeholder, icon }) {
  const [focused, setFocused] = useState(false);
  const hasValue = value.length > 0;

  const borderColor = isError ? '#DC2626' : isOk ? '#16A34A' : focused ? '#8B1538' : 'rgba(139, 21, 56, 0.15)';
  const shadowColor = isError ? 'rgba(220, 38, 38, 0.12)' : isOk ? 'rgba(22, 163, 74, 0.12)' : focused ? 'rgba(139, 21, 56, 0.1)' : 'none';
  const bgColor = isError ? 'rgba(220, 38, 38, 0.04)' : isOk ? 'rgba(22, 163, 74, 0.04)' : focused ? 'rgba(139, 92, 246, 0.06)' : 'rgba(139, 21, 56, 0.03)';

  return (
    <div style={{ marginBottom: '1rem', position: 'relative' }}>
      <div style={{
        position: 'relative',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        padding: icon ? '1.1rem 2.8rem 0.6rem 1rem' : '1.1rem 1rem 0.6rem',
        transition: 'all 0.2s',
        boxShadow: `0 0 0 3px ${shadowColor}`,
      }}>
        <label style={{
          position: 'absolute', left: '1rem',
          top: focused || hasValue ? '0.35rem' : '1rem',
          fontSize: focused || hasValue ? '0.72rem' : '0.92rem',
          color: isError ? '#DC2626' : isOk ? '#16A34A' : focused ? '#8B1538' : 'rgba(74, 4, 4, 0.5)',
          transition: 'all 0.2s', pointerEvents: 'none', fontWeight: 600,
        }}>{label}</label>

        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          maxLength={maxLength}
          inputMode={inputMode}
          placeholder={focused && placeholder ? placeholder : ' '}
          autoComplete="off"
          style={{
            width: '100%', background: 'transparent', border: 'none', outline: 'none',
            color: '#4A0404', fontSize: '0.95rem', paddingTop: '0.15rem',
            fontFamily: 'inherit', letterSpacing: type === 'tel' ? '0.05em' : 'normal',
          }}
        />

        {/* Status icon */}
        {(isOk || isError) && (
          <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
            {isOk && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {isError && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
          </div>
        )}

        {/* Regular icon (when no status) */}
        {icon && !isOk && !isError && (
          <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: focused ? '#8B1538' : 'rgba(74, 4, 4, 0.25)', transition: 'color 0.2s' }}>
            {icon}
          </div>
        )}
      </div>

      {/* Below-field: hint or counter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '1.2rem', marginTop: '0.3rem', padding: '0 0.25rem' }}>
        <span style={{ fontSize: '0.75rem', color: isError ? '#DC2626' : 'transparent', transition: 'color 0.2s' }}>
          {hint || ''}
        </span>
        {counterText && (
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: counterOk ? '#16A34A' : 'rgba(74, 4, 4, 0.35)', transition: 'color 0.2s', letterSpacing: '0.03em' }}>
            {counterText}
          </span>
        )}
      </div>
    </div>
  );
}

// -- File Upload Field --
function FileUploadField({ label, accept, file, onChange, optional }) {
  const [focused, setFocused] = useState(false);
  const hasFile = !!file;

  return (
    <div style={{ marginBottom: '0' }}>
      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(74, 4, 4, 0.5)', marginBottom: '0.5rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}{optional && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}> (optional)</span>}
      </label>

      <label
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '1rem 0.75rem', gap: '0.4rem',
          background: hasFile ? 'rgba(22, 163, 74, 0.04)' : focused ? 'rgba(139, 92, 246, 0.06)' : 'rgba(139, 21, 56, 0.03)',
          border: `1.5px dashed ${hasFile ? '#16A34A' : focused ? '#8B1538' : 'rgba(139, 21, 56, 0.2)'}`,
          borderRadius: 12,
          cursor: 'pointer',
          transition: 'all 0.2s',
          minHeight: '70px',
        }}
        onMouseEnter={(e) => { if (!hasFile) { e.currentTarget.style.borderColor = '#8B1538'; e.currentTarget.style.background = 'rgba(139, 21, 56, 0.06)'; } }}
        onMouseLeave={(e) => { if (!hasFile) { e.currentTarget.style.borderColor = 'rgba(139, 21, 56, 0.2)'; e.currentTarget.style.background = 'rgba(139, 21, 56, 0.03)'; } }}
      >
        {hasFile ? (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 600, textAlign: 'center', wordBreak: 'break-all', maxWidth: '100%' }}>
              {file.name.length > 20 ? file.name.slice(0, 18) + '...' : file.name}
            </span>
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(139, 21, 56, 0.4)" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span style={{ fontSize: '0.75rem', color: 'rgba(74, 4, 4, 0.45)', textAlign: 'center' }}>Click to upload</span>
          </>
        )}
        <input type="file" accept={accept} onChange={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{ display: 'none' }} />
      </label>
    </div>
  );
}

// -- Ripple Button --
function RippleButton({ children, loading, type, onClick }) {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    if (loading) return;
    const r = e.currentTarget.getBoundingClientRect();
    const newRipple = { x: e.clientX - r.left, y: e.clientY - r.top, id: Date.now() };
    setRipples(prev => [...prev, newRipple]);
    setTimeout(() => setRipples(prev => prev.filter(rp => rp.id !== newRipple.id)), 600);
    onClick?.(e);
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={loading}
      style={{
        width: '100%', padding: '1rem',
        background: loading ? '#991B1B' : 'linear-gradient(135deg, #8B1538 0%, #6B0F1A 100%)',
        border: 'none', borderRadius: 14, color: '#fff',
        fontSize: '1rem', fontWeight: 700,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.75 : 1,
        boxShadow: loading ? 'none' : '0 6px 24px rgba(139, 21, 56, 0.35)',
        transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
        fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(139, 21, 56, 0.45)'; } }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 6px 24px rgba(139, 21, 56, 0.35)'; }}
    >
      {ripples.map(r => (
        <span key={r.id} style={{ position: 'absolute', width: '20px', height: '20px', background: 'rgba(255,255,255,0.4)', borderRadius: '50%', transform: 'translate(-50%, -50%) scale(0)', animation: 'ripple 0.6s ease-out', left: r.x, top: r.y, pointerEvents: 'none' }} />
      ))}
      {children}
    </button>
  );
}

// -- Particle Background --
function ParticleBackground() {
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    const t = setTimeout(() => {
      setParticles(Array.from({ length: 40 }, (_, i) => ({
        id: i, x: Math.random() * 100, y: Math.random() * 100,
        size: Math.random() * 3 + 1, duration: Math.random() * 20 + 10, delay: Math.random() * 5,
      })));
    }, 0);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {particles.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: 'rgba(139, 21, 56, 0.12)', borderRadius: '50%', animation: `float ${p.duration}s ease-in-out infinite`, animationDelay: `${p.delay}s` }} />
      ))}
    </div>
  );
}