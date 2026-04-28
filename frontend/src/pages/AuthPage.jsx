// src/pages/AuthPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import API from '../api/axios';

const VIEWS = { LOGIN: 'login', SIGNUP: 'signup', FORGOT: 'forgot', VERIFY: 'verify' };

// Password requirements checker
const checkPasswordRequirements = (pw) => ({
  length: pw.length >= 10,
  upper: /[A-Z]/.test(pw),
  lower: /[a-z]/.test(pw),
  special: /[^a-zA-Z0-9]/.test(pw),
});

// ── Eye character ──────────────────────────────────────────────────────────────
function EyeCharacter({ pwFocused, pwVisible }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
      const d = Math.min(Math.hypot(e.clientX - cx, e.clientY - cy) / 22, 7);
      setPos({ x: Math.cos(angle) * d, y: Math.sin(angle) * d });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const closed = pwFocused && !pwVisible;
  const squinted = pwFocused && pwVisible;
  const eyeH = closed ? 3 : squinted ? 15 : 34;

  return (
    <div ref={ref} style={{
      width: 148, height: 148, borderRadius: '50%',
      background: 'rgba(255,255,255,0.16)',
      border: '2.5px solid rgba(255,255,255,0.32)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', margin: '0 auto 20px',
      userSelect: 'none', flexShrink: 0,
    }}>
      <div style={{ position:'absolute', bottom:34, left:16, width:22, height:11, borderRadius:'50%', background:'rgba(255,110,160,0.45)' }} />
      <div style={{ position:'absolute', bottom:34, right:16, width:22, height:11, borderRadius:'50%', background:'rgba(255,110,160,0.45)' }} />
      <div style={{ display:'flex', gap:22, marginBottom:10 }}>
        {[0,1].map(i => (
          <div key={i} style={{
            width:34, height:eyeH,
            borderRadius: closed ? 3 : '50%',
            background:'rgba(255,255,255,0.93)',
            overflow:'hidden', position:'relative',
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'height .14s ease, border-radius .14s ease',
            flexShrink: 0,
          }}>
            {!closed && (
              <div style={{
                width: squinted ? 10 : 15,
                height: squinted ? 10 : 15,
                borderRadius:'50%', background:'#310d80',
                transform:`translate(${pos.x}px,${pos.y}px)`,
                transition:'transform .06s linear, width .12s, height .12s',
                position:'relative', flexShrink:0,
              }}>
                <div style={{
                  position:'absolute', top:2, right:2,
                  width:5, height:5, borderRadius:'50%',
                  background:'rgba(255,255,255,0.85)',
                }} />
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{
        width: closed ? 16 : 20,
        height: closed ? 3 : 9,
        borderRadius: closed ? 3 : '0 0 20px 20px',
        background: closed ? 'rgba(255,255,255,0.45)' : 'transparent',
        border: closed ? 'none' : '2px solid rgba(255,255,255,0.5)',
        borderTop: 'none',
        transition:'all .14s ease',
      }} />
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const navigate = useNavigate();
  const [view, setView] = useState(VIEWS.LOGIN);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pwFocused, setPwFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [slideLeft, setSlideLeft] = useState(false);
  const [shake, setShake] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState(false);

  const [liEmail, setLiEmail] = useState('');
  const [liPass, setLiPass] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPass, setSuPass] = useState('');

  const pendingEmail = localStorage.getItem('udhaari_pending_email') || suEmail;

  const clear = () => { setError(''); setSuccess(''); };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const go = (v) => {
    clear();
    setStep(1);
    setShowPw(false);
    setPwFocused(false);
    setSlideLeft(v === VIEWS.SIGNUP || v === VIEWS.VERIFY);
    setView(v);
  };


  // ── LOGIN ─────────────────────────────────────────────────────────────────
const handleLogin = async (e) => {
  e.preventDefault(); clear();
  if (!liEmail || !liPass) { setError('Please fill in all fields.'); triggerShake(); return; }
  setLoading(true);
  try {
    const cred = await signInWithEmailAndPassword(auth, liEmail, liPass);
    let verified = false;
    for (let i = 0; i < 3; i++) {
      await cred.user.reload();
      if (auth.currentUser?.emailVerified) { verified = true; break; }
      await new Promise(r => setTimeout(r, 800));
    }
    if (!verified) {
      setError('Please verify your email first. Check your inbox.');
      setLoading(false); return;
    }
   // ✅ GET AND SAVE THE FIREBASE TOKEN
const token = await auth.currentUser.getIdToken(true);
localStorage.setItem('token', token);  // ← CRITICAL: Save as 'token'

try {
  const res = await API.post('/auth/login', {}, {
    headers: { 'Authorization': `Bearer ${token}` }  // ← Send token to backend
  });
  localStorage.setItem('udhaari_user', JSON.stringify(res.data.user));
  navigate('/');
    } catch (apiErr) {
      if (apiErr.response?.status === 404) {
        navigate('/complete-profile');
      } else {
        setError(apiErr.response?.data?.error || 'Login failed. Is the server running?');
        triggerShake();
      }
    }
  } catch (err) {
    //  Handle Google account trying to login with password
   // Inside handleLogin catch block, replace the Google check part:

// Inside handleLogin catch block, replace the Google check:
if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
  try {
    console.log('Checking provider for:', liEmail);
    
    const checkRes = await API.post('/auth/check-provider', { email: liEmail });
    
    console.log('📊 Check response:', checkRes.data);
    
    if (checkRes.data.provider === 'google') {
      setError('This account was created with Google. Please use "Continue with Google" to sign in.');
    } else {
      setError('Wrong email or password.');
    }
  } catch (checkErr) {
    // Log full error for debugging
    // At the start of handleLogin catch block:
console.error('Login error details:', {
  code: err.code,
  message: err.message,
  email: liEmail,
});
    console.error('Check provider failed:', {
      message: checkErr.message,
      code: checkErr.code,
      response: checkErr.response?.data,
      status: checkErr.response?.status,
    });
    
    // Show generic error if check fails
    setError('Wrong email or password.');
  }
}
    else if (err.code === 'auth/too-many-requests') {
      setError('Too many attempts. Try again later.');
    }
    else if (err.code === 'auth/user-not-found') {
      setError('No account found with this email.');
    }
    else {
      setError('Something went wrong. Please try again.');
    }
    triggerShake();
  }
  setLoading(false);
};

  // ── SIGNUP STEP 1 ─────────────────────────────────────────────────────────
  const handleStep1 = async (e) => {
    e.preventDefault(); clear();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(suEmail)) { setError('Enter a valid email address.'); triggerShake(); return; }
    
    const pwReqs = checkPasswordRequirements(suPass);
    if (!pwReqs.length) { setError('Password must be at least 10 characters.'); triggerShake(); return; }
    if (!pwReqs.upper) { setError('Password must contain at least 1 uppercase letter.'); triggerShake(); return; }
    if (!pwReqs.lower) { setError('Password must contain at least 1 lowercase letter.'); triggerShake(); return; }
    if (!pwReqs.special) { setError('Password must contain at least 1 special character.'); triggerShake(); return; }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, suEmail, suPass);
      const user = userCredential.user;
      
      
      // Send verification email
      await sendEmailVerification(user);
      
      // Store for verification page
      localStorage.setItem('udhaari_pending_email', suEmail);
      
      setSuccess('✅ Verification email sent! Please check your inbox.');
      
      
      // Navigate to verify view (stay on same page, just change view)
      setTimeout(() => {
        setView(VIEWS.VERIFY);
        setSlideLeft(true);
        setSuccess('');
      }, 2000);
      
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('Email already registered. Please log in.');
      else if (err.code === 'auth/invalid-email') setError('Invalid email format.');
      else setError(err.message || 'Something went wrong.');
      triggerShake();
    }
    setLoading(false);
  };
  
  const pwReqs = checkPasswordRequirements(suPass);
  const showEye = view === VIEWS.LOGIN || (view === VIEWS.SIGNUP && step === 1);
  const showPwRequirements = view === VIEWS.SIGNUP && step === 1 && suPass.length > 0;

  const overlayTitle = slideLeft ? 'Join UDHAARiii' : 'Hello, friend!';
  const overlaySub = slideLeft ? 'Already have an account? Sign in to continue' : 'Join the community';
  const overlayBtn = slideLeft ? 'Sign In' : 'Sign Up';
  const overlayAction = () => go(slideLeft ? VIEWS.LOGIN : VIEWS.SIGNUP);

  const leftOpacity = slideLeft ? 0 : 1;
  const leftTransition = slideLeft ? 'opacity 0.15s ease' : 'opacity 0.3s ease 0.35s';
  const rightOpacity = slideLeft ? 1 : 0;
  const rightTransition = slideLeft ? 'opacity 0.3s ease 0.35s' : 'opacity 0.15s ease';

  // ── GOOGLE AUTH ────────────────────────────────────────────────────────────
const handleGoogleAuth = async () => {
  clear();
  setLoading(true);
  try {
    const { signInWithPopup } = await import('firebase/auth');
    const { googleProvider } = await import('../config/firebase');
    
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // ✅ SAVE TOKEN IMMEDIATELY
    const token = await user.getIdToken();
    localStorage.setItem('token', token);
    
    const response = await API.post('/auth/google', {
      token,
      email: user.email,
      fullName: user.displayName,
      photoURL: user.photoURL,
    });
    
    if (response.data.user) {
      localStorage.setItem('udhaari_user', JSON.stringify(response.data.user));
    }
    
    if (response.data.requiresProfileCompletion) {
      navigate('/complete-profile');
    } else {
      navigate('/');
    }
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') {
      setError(err.code === 'auth/account-exists-with-different-credential' 
        ? 'An account already exists with this email. Please sign in with your existing method.'
        : 'Google sign-in failed. Please try again.');
      triggerShake();
    }
  }
  setLoading(false);
};
  
// ── FORGOT ────────────────────────────────────────────────────────────────
const handleForgot = async (e) => {
  e.preventDefault(); clear();
  if (!liEmail) { setError('Enter your email address.'); triggerShake(); return; }
  setLoading(true);
  
  try {
    //  First check if user exists and is verified
    const checkRes = await API.post('/auth/check-user-status', { email: liEmail });
    
    if (!checkRes.data.exists) {
      setError('No account found with this email.');
      setLoading(false);
      return;
    }
    
    if (!checkRes.data.isVerified) {
      setError('Please verify your email first. Check your inbox for the verification link.');
      setLoading(false);
      return;
    }
    
    // ✅ User exists and is verified - send reset email
    await sendPasswordResetEmail(auth, liEmail);
    setSuccess('Reset link sent. Check your inbox.');
    
  } catch (err) {
    // For security, don't reveal if email exists or not in error messages
    console.error('Forgot password error:', err);
    setSuccess('If that email exists and is verified, a reset link has been sent.');
  }
  setLoading(false);
  };
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '1.5rem', background: 'linear-gradient(135deg, #050508 0%, #0f0518 40%, #1a0b2e 100%)',
      fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Particle Background */}
      <ParticleBackground />

      {/* Ambient blobs */}
      <div style={{ position:'fixed', top:'-18%', left:'-8%', width:'44vw', height:'44vw', borderRadius:'50%', background:'radial-gradient(circle, #7c3aed50 0%, #4c1d9530 40%, transparent 75%)', filter:'blur(60px)', pointerEvents:'none' }} />
      <div style={{ position:'fixed', bottom:'-18%', right:'-8%', width:'36vw', height:'36vw', borderRadius:'50%', background:'radial-gradient(circle, #6d28d940 0%, #2e106530 40%, transparent 75%)', filter:'blur(60px)', pointerEvents:'none' }} />

      {/* CARD */}
      <div style={{
        width:'100%', maxWidth:860, minHeight:580,
        borderRadius:28, overflow:'hidden',
        position:'relative', display:'flex',
        boxShadow:'0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.12), 0 0 60px rgba(109,40,217,0.15)',
        animation: 'slideUp 0.5s ease-out',
      }}>

{/* LEFT HALF: login / forgot */}
<div style={{
  flex:'0 0 50%', background:'rgba(8, 5, 12, 0.95)',
  display:'flex', flexDirection:'column',
  justifyContent:'center', padding:'2.5rem 2.5rem',
  overflowY:'auto',
}}>
  <div style={{
    opacity: leftOpacity,
    transition: leftTransition,
    pointerEvents: slideLeft ? 'none' : 'auto',
  }}>
    <div style={{ marginBottom:'1.5rem' }}>
      <h1 style={{ fontSize:'1.5rem', fontWeight:800, color:'#fff', margin:'0 0 0.3rem', letterSpacing:'-0.03em' }}>
        {view === VIEWS.FORGOT ? 'Reset password' : 'Sign in'}
      </h1>
      <p style={{ color:'rgba(255,255,255,0.28)', fontSize:'0.8rem', margin:0 }}>
        {view === VIEWS.FORGOT ? "Enter your email and we'll send a link" : 'Enter your credentials to continue'}
      </p>
    </div>

    {error && !slideLeft && (
      <AlertBox type="error" shake={shake}>{error}</AlertBox>
    )}
    {success && <AlertBox type="success">{success}</AlertBox>}

    {/* ✅ LOGIN FORM - Google button is OUTSIDE this form */}
    {(view === VIEWS.LOGIN || (!slideLeft)) && view !== VIEWS.FORGOT && (
      <form onSubmit={handleLogin}>
        <FloatingField
          label="Email address"
          type="email"
          value={liEmail}
          onChange={(e) => setLiEmail(e.target.value)}
          placeholder="you@example.com"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          }
        />
        <PwField
          label="Password"
          value={liPass}
          onChange={(e) => {
            setLiPass(e.target.value);
            setTypingIndicator(e.target.value.length > 0);
          }}
          placeholder="your password"
          show={showPw}
          toggle={() => setShowPw(p => !p)}
          onFocus={() => setPwFocused(true)}
          onBlur={() => setPwFocused(false)}
          showTyping={typingIndicator}
        />
        <div style={{ textAlign:'right', marginTop:'-0.5rem', marginBottom:'1.25rem' }}>
          <button type="button" onClick={() => go(VIEWS.FORGOT)}
            style={{ background:'none', border:'none', color:'#8b5cf6', fontSize:'0.75rem', cursor:'pointer', padding:0, fontFamily:'inherit' }}>
            Forgot password?
          </button>
        </div>
        <RippleButton loading={loading} type="submit">Sign In</RippleButton>
      </form>
    )}

    {/* ✅ GOOGLE BUTTON - OUTSIDE the form, ONLY on Login page */}
    {view === VIEWS.LOGIN && (
      <>
        {/* Divider */}
        <div style={{ 
          display: 'flex', alignItems: 'center', margin: '1.5rem 0',
          color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ padding: '0 1rem' }}>or continue with</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Google Button - MUST have type="button" */}
        <RippleButton 
          type="button" 
          onClick={handleGoogleAuth}
          loading={loading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 8 }}>
            <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4"/>
            <path d="M12.2401 24.0008C15.4766 24.0008 18.2059 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.2401 24.0008Z" fill="#34A853"/>
            <path d="M5.50253 14.3003C5.00236 12.8099 5.00236 11.1961 5.50253 9.70575V6.61481H1.5166C-0.18551 10.0056 -0.18551 14.0004 1.5166 17.3912L5.50253 14.3003Z" fill="#FBBC05"/>
            <path d="M12.2401 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.2401 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.2401 4.74966Z" fill="#EA4335"/>
          </svg>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </RippleButton>
      </>
    )}

    {/* FORGOT PASSWORD FORM */}
    {view === VIEWS.FORGOT && (
      <form onSubmit={handleForgot}>
        <FloatingField
          label="Email address"
          type="email"
          value={liEmail}
          onChange={(e) => setLiEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <RippleButton loading={loading} type="submit">Send Reset Link</RippleButton>
        <GhostBtn onClick={() => go(VIEWS.LOGIN)}>← Back to sign in</GhostBtn>
      </form>
    )}
  </div>
        </div>
        
{/* RIGHT HALF: signup / verify */}
<div style={{
  flex:'0 0 50%', background:'rgba(8, 5, 12, 0.95)',
  display:'flex', flexDirection:'column',
  justifyContent:'center', padding:'2.5rem 2.5rem',
  overflowY:'auto',
  maxHeight: '650px',
}}>
  <div style={{
    opacity: rightOpacity,
    transition: rightTransition,
    pointerEvents: slideLeft ? 'auto' : 'none',
    maxHeight: '580px',
    overflowY: 'auto',
    paddingRight: '8px',
  }}>
    <div style={{ marginBottom:'1.5rem' }}>
      <h1 style={{ fontSize:'1.5rem', fontWeight:800, color:'#fff', margin:'0 0 0.3rem', letterSpacing:'-0.03em' }}>
        {view === VIEWS.SIGNUP && step === 1 ? 'Create account' : view === VIEWS.VERIFY ? 'Check your email' : ''}
      </h1>
      <p style={{ color:'rgba(255,255,255,0.28)', fontSize:'0.8rem', margin:0 }}>
        {view === VIEWS.SIGNUP && step === 1 ? 'Start with your email and a strong password' : view === VIEWS.VERIFY ? 'Click the link in your inbox to activate' : ''}
      </p>
    </div>

    {error && slideLeft && <AlertBox type="error" shake={shake}>{error}</AlertBox>}

    {/* ✅ SIGNUP STEP 1 FORM - Google button is OUTSIDE this form */}
    {view === VIEWS.SIGNUP && step === 1 && (
      <form onSubmit={handleStep1}>
        <FloatingField
          label="Email address"
          type="email"
          value={suEmail}
          onChange={(e) => setSuEmail(e.target.value)}
          placeholder="you@example.com"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          }
        />
        <PwField
          label="Password"
          value={suPass}
          onChange={(e) => {
            setSuPass(e.target.value);
            setTypingIndicator(e.target.value.length > 0);
          }}
          placeholder="min 10 characters"
          show={showPw}
          toggle={() => setShowPw(p => !p)}
          onFocus={() => setPwFocused(true)}
          onBlur={() => setPwFocused(false)}
          showTyping={typingIndicator}
        />
        
        {/* Password Requirements */}
        {showPwRequirements && (
          <div style={{
            marginTop: '-0.5rem',
            marginBottom: '1rem',
            padding: '0.75rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <RequirementItem met={pwReqs.length} text="At least 10 characters" />
            <RequirementItem met={pwReqs.upper} text="1 uppercase letter" />
            <RequirementItem met={pwReqs.lower} text="1 lowercase letter" />
            <RequirementItem met={pwReqs.special} text="1 special character" />
          </div>
        )}

        <RippleButton loading={loading} type="submit">Continue →</RippleButton>
      </form>
    )}

    {/* ✅ GOOGLE BUTTON - OUTSIDE the form, ONLY on Signup Step 1 */}
    {view === VIEWS.SIGNUP && step === 1 && (
      <>
        {/* Divider */}
        <div style={{ 
          display: 'flex', alignItems: 'center', margin: '1.5rem 0',
          color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ padding: '0 1rem' }}>or continue with</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Google Button - MUST have type="button" */}
        <RippleButton 
          type="button" 
          onClick={handleGoogleAuth}
          loading={loading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 8 }}>
            <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4"/>
            <path d="M12.2401 24.0008C15.4766 24.0008 18.2059 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.2401 24.0008Z" fill="#34A853"/>
            <path d="M5.50253 14.3003C5.00236 12.8099 5.00236 11.1961 5.50253 9.70575V6.61481H1.5166C-0.18551 10.0056 -0.18551 14.0004 1.5166 17.3912L5.50253 14.3003Z" fill="#FBBC05"/>
            <path d="M12.2401 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.2401 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.2401 4.74966Z" fill="#EA4335"/>
          </svg>
          {loading ? 'Signing up...' : 'Continue with Google'}
        </RippleButton>
      </>
    )}

    {/* ✅ VERIFY PAGE */}
    {view === VIEWS.VERIFY && (
      <div style={{ textAlign:'center', padding:'0.5rem 0' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>📬</div>
        <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.875rem', lineHeight:1.8, marginBottom:'1.5rem' }}>
          A verification link was sent to{' '}
          <strong style={{ color:'#a78bfa' }}>{pendingEmail}</strong>.<br /><br />
          Click the link in your email, then come back and continue.
        </p>
        
        {error && <AlertBox type="error" shake={shake}>{error}</AlertBox>}
        {success && <AlertBox type="success">{success}</AlertBox>}
        
        <RippleButton 
          loading={loading} 
          onClick={async () => {
            setLoading(true);
            setError('');
            
            try {
              await auth.currentUser?.reload();
              
              if (auth.currentUser?.emailVerified) {
                await auth.currentUser.getIdToken(true);
                
                setSuccess('✅ Email verified successfully!');
                
                setTimeout(() => {
                  navigate('/complete-profile');
                }, 1500);
              } else {
                setError('Email not verified yet. Please check your inbox and spam folder.');
                triggerShake();
              }
            } catch (verificationError) {
              setError('Failed to verify. Please try again.');
              triggerShake();
            }
            setLoading(false);
          }}
        >
          {loading ? 'Checking...' : 'I\'ve Verified My Email'}
        </RippleButton>
        
        <GhostBtn onClick={() => go(VIEWS.LOGIN)}>← Back to Sign In</GhostBtn>
      </div>
    )}
  </div>
        </div>
        {/* SLIDING OVERLAY PANEL */}
        <div style={{
          position:'absolute', top:0, left:0,
          width:'50%', height:'100%',
          background:'linear-gradient(148deg, #8b5cf6 0%, #6d28d9 35%, #4c1d95 70%, #1e1b4b 100%)',
          display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          padding:'2.5rem 2rem', textAlign:'center',
          zIndex:10,
          transform: slideLeft ? 'translateX(0%)' : 'translateX(100%)',
          transition: 'transform 0.65s cubic-bezier(0.65, 0, 0.35, 1)',
          overflow:'hidden',
        }}>
          <div style={{ position:'absolute', inset:0, pointerEvents:'none',
            backgroundImage:'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.06) 0%, transparent 55%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 55%)' }} />

          <div style={{ fontSize:'0.7rem', fontWeight:700, color:'rgba(255,255,255,0.65)', letterSpacing:'0.22em', textTransform:'uppercase', marginBottom:'1.25rem' }}>
            UDHAARI
          </div>

          {showEye ? <EyeCharacter pwFocused={pwFocused} pwVisible={showPw} /> : (
            <div style={{ width:76, height:76, borderRadius:'50%', background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:30 }}>
              {view === VIEWS.VERIFY ? '📬' : '🔑'}
            </div>
          )}

          <h2 style={{ fontSize:'1.55rem', fontWeight:800, color:'#fff', margin:'0 0 0.5rem', letterSpacing:'-0.02em', lineHeight:1.2 }}>
            {view === VIEWS.VERIFY ? 'Almost there!' : view === VIEWS.FORGOT ? 'Recover account' : overlayTitle}
          </h2>
          <p style={{ color:'rgba(255,255,255,0.58)', fontSize:'0.84rem', lineHeight:1.65, margin:'0 0 1.75rem', maxWidth:176 }}>
            {view === VIEWS.VERIFY ? `Sent to ${pendingEmail}` : view === VIEWS.FORGOT ? "Check your email for a reset link" : overlaySub}
          </p>

          {view !== VIEWS.VERIFY && view !== VIEWS.FORGOT && (
            <button onClick={overlayAction} style={{
              padding:'0.58rem 2rem', background:'transparent',
              border:'2px solid rgba(255,255,255,0.62)', borderRadius:99,
              color:'#fff', fontSize:'0.78rem', fontWeight:700,
              cursor:'pointer', letterSpacing:'0.12em',
              textTransform:'uppercase', fontFamily:'inherit',
              transition:'background 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.14)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; }}
            >
              {overlayBtn}
            </button>
          )}
        </div>
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

// ── Floating Field ────────────────────────────────────────────────────────────
function FloatingField({ label, type, value, onChange, icon }) {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  useEffect(() => {
    setHasValue(value.length > 0);
  }, [value]);

  return (
    <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
      <div style={{
        position: 'relative',
        background: focused ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${focused ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 12,
        padding: '1.1rem 1rem 0.6rem',
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
          placeholder=""
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

// ── Password Field ───────────────────────────────────────────────────────────
function PwField({ label, value, onChange, show, toggle, onFocus, onBlur, showTyping }) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{
        position: 'relative',
        background: focused ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${focused ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 12,
        padding: '1.1rem 3rem 0.6rem 1rem',
        transition: 'all 0.2s',
        boxShadow: focused ? '0 0 0 4px rgba(139,92,246,0.15)' : 'none',
      }}>
        <label style={{
          position: 'absolute',
          left: '1rem',
          top: focused || value.length > 0 ? '0.4rem' : '1rem',
          fontSize: focused || value.length > 0 ? '0.7rem' : '0.95rem',
          color: focused ? '#a78bfa' : 'rgba(255,255,255,0.4)',
          transition: 'all 0.2s',
          pointerEvents: 'none',
          fontWeight: 500,
        }}>
          {label}
        </label>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder=""
          onFocus={() => { setFocused(true); onFocus?.(); }}
          onBlur={() => { setFocused(false); onBlur?.(); }}
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
        <button type="button" onClick={toggle} style={{
          position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
          background:'none', border:'none', padding:4, cursor:'pointer',
          color: show ? '#8b5cf6' : 'rgba(255,255,255,0.22)',
          display:'flex', alignItems:'center', transition:'color 0.2s',
        }}>
          {showTyping && (
            <span style={{
              position: 'absolute',
              right: '35px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              gap: '2px',
            }}>
              <span style={{
                width: '3px', height: '12px', background: '#8b5cf6',
                animation: 'typing 1s ease-in-out infinite',
              }} />
              <span style={{
                width: '3px', height: '12px', background: '#8b5cf6',
                animation: 'typing 1s ease-in-out infinite 0.2s',
              }} />
              <span style={{
                width: '3px', height: '12px', background: '#8b5cf6',
                animation: 'typing 1s ease-in-out infinite 0.4s',
              }} />
            </span>
          )}
          {show
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          }
        </button>
      </div>
      <style>{`
        @keyframes typing {
          0%, 100% { height: 4px; opacity: 0.3; }
          50% { height: 12px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Requirement Item ─────────────────────────────────────────────────────────
function RequirementItem({ met, text }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '0.4rem',
      fontSize: '0.75rem',
      color: met ? '#86efac' : 'rgba(255,255,255,0.4)',
      transition: 'color 0.3s',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
        {met ? (
          <polyline points="20 6 9 17 4 12" />
        ) : (
          <circle cx="12" cy="12" r="10" />
        )}
      </svg>
      {text}
    </div>
  );
}

// ── Ripple Button ────────────────────────────────────────────────────────────
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
        fontSize: '0.9rem',
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
        <span key={ripple.id} style={{
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
        }} />
      ))}
      {children}
    </button>
  );
}

// ── AlertBox ─────────────────────────────────────────────────────────────────
function AlertBox({ type, children, shake }) {
  const err = type === 'error';
  return (
    <div style={{
      padding:'0.62rem 1rem', borderRadius:10, marginBottom:'1.25rem',
      background: err ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
      border:`1px solid ${err ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
      color: err ? '#fca5a5' : '#86efac',
      fontSize:'0.8rem', lineHeight:1.5,
      animation: shake ? 'shake 0.5s ease-in-out' : 'none',
    }}>{children}</div>
  );
}

// ── GhostBtn ─────────────────────────────────────────────────────────────────
function GhostBtn({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={{
      width:'100%', padding:'0.68rem', background:'transparent',
      border:'1px solid rgba(255,255,255,0.07)', borderRadius:12,
      color:'rgba(255,255,255,0.25)', fontSize:'0.82rem',
      cursor:'pointer', marginTop:10, fontFamily:'inherit', transition:'all 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.16)'; e.currentTarget.style.color='rgba(255,255,255,0.5)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; e.currentTarget.style.color='rgba(255,255,255,0.25)'; }}
    >
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