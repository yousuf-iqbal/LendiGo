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

const checkPasswordRequirements = (pw) => ({
  length: pw.length >= 10,
  upper: /[A-Z]/.test(pw),
  lower: /[a-z]/.test(pw),
  special: /[^a-zA-Z0-9]/.test(pw),
});

// -- Pupil Component --
function Pupil({ size = 12, maxDistance = 5, pupilColor = 'black', forceLookX, forceLookY }) {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const pupilRef = useRef(null);

  useEffect(() => {
    const h = (e) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  const pos = () => {
    if (!pupilRef.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
    const r = pupilRef.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance);
    const angle = Math.atan2(dy, dx);
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
  };

  const { x, y } = pos();
  return (
    <div
      ref={pupilRef}
      style={{
        width: size, height: size,
        backgroundColor: pupilColor,
        borderRadius: '50%',
        transform: `translate(${x}px, ${y}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    />
  );
}

// -- EyeBall Component --
function EyeBall({ size = 20, pupilSize = 8, maxDistance = 6, eyeColor = 'white', pupilColor = 'black', isBlinking = false, forceLookX, forceLookY }) {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const eyeRef = useRef(null);

  useEffect(() => {
    const h = (e) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  const pos = () => {
    if (!eyeRef.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
    const r = eyeRef.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance);
    const angle = Math.atan2(dy, dx);
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
  };

  const { x, y } = pos();
  return (
    <div
      ref={eyeRef}
      style={{
        width: size,
        height: isBlinking ? 2 : size,
        backgroundColor: eyeColor,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'height 0.1s ease',
      }}
    >
      {!isBlinking && (
        <div
          style={{
            width: pupilSize,
            height: pupilSize,
            backgroundColor: pupilColor,
            borderRadius: '50%',
            transform: `translate(${x}px, ${y}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
    </div>
  );
}

// -- Animated Characters Component (absolute-positioned, full peek behavior) --
function AnimatedCharacters({ pwVisible, password, isTyping }) {
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);

  const purpleRef = useRef(null);
  const blackRef = useRef(null);
  const yellowRef = useRef(null);
  const orangeRef = useRef(null);

  useEffect(() => {
    const h = (e) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  // Purple blinking
  useEffect(() => {
    const scheduleBlink = () => {
      const t = setTimeout(() => {
        setIsPurpleBlinking(true);
        setTimeout(() => { setIsPurpleBlinking(false); scheduleBlink(); }, 150);
      }, Math.random() * 4000 + 3000);
      return t;
    };
    const t = scheduleBlink();
    return () => clearTimeout(t);
  }, []);

  // Black blinking
  useEffect(() => {
    const scheduleBlink = () => {
      const t = setTimeout(() => {
        setIsBlackBlinking(true);
        setTimeout(() => { setIsBlackBlinking(false); scheduleBlink(); }, 150);
      }, Math.random() * 4000 + 3000);
      return t;
    };
    const t = scheduleBlink();
    return () => clearTimeout(t);
  }, []);

  // Look at each other on typing start
  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const t = setTimeout(() => setIsLookingAtEachOther(false), 800);
      return () => clearTimeout(t);
    } else {
      setIsLookingAtEachOther(false);
    }
  }, [isTyping]);

  // Purple sneaky peek when password is visible
  useEffect(() => {
    if (password.length > 0 && pwVisible) {
      const schedulePeek = () => {
        const t = setTimeout(() => {
          setIsPurplePeeking(true);
          setTimeout(() => setIsPurplePeeking(false), 800);
        }, Math.random() * 3000 + 2000);
        return t;
      };
      const t = schedulePeek();
      return () => clearTimeout(t);
    } else {
      setIsPurplePeeking(false);
    }
  }, [password, pwVisible, isPurplePeeking]);

  const calcPos = (ref) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 3;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    const faceX = Math.max(-12, Math.min(12, dx / 22));
    const faceY = Math.max(-8, Math.min(8, dy / 32));
    const bodySkew = Math.max(-5, Math.min(5, -dx / 130));
    return { faceX, faceY, bodySkew };
  };

  const purplePos = calcPos(purpleRef);
  const blackPos = calcPos(blackRef);
  const yellowPos = calcPos(yellowRef);
  const orangePos = calcPos(orangeRef);

  const pwHidden = password.length > 0 && !pwVisible;
  const pwShown = password.length > 0 && pwVisible;

  // Purple peeking transform: leans toward center and grows
  const purpleTransform = pwShown
    ? `skewX(0deg)`
    : pwHidden
      ? `skewX(${(purplePos.bodySkew || 0) - 10}deg) translateX(22px)`
      : `skewX(${purplePos.bodySkew || 0}deg)`;

  // Purple eye force: look away when shown, occasional peek when shown
  const purpleFX = pwShown ? (isPurplePeeking ? 4 : -5) : isLookingAtEachOther ? 3 : undefined;
  const purpleFY = pwShown ? (isPurplePeeking ? 5 : -5) : isLookingAtEachOther ? 4 : undefined;

  // Black eye force: look away when pw shown
  const blackFX = pwShown ? -4 : isLookingAtEachOther ? 0 : undefined;
  const blackFY = pwShown ? -4 : isLookingAtEachOther ? -4 : undefined;

  // Orange/yellow force look: look away when pw shown
  const otherFX = pwShown ? -5 : undefined;
  const otherFY = pwShown ? -4 : undefined;

  return (
    <div style={{ position: 'relative', width: '310px', height: '270px' }}>
      {/* Purple tall rectangle - Back layer */}
      <div
        ref={purpleRef}
        style={{
          position: 'absolute',
          bottom: 0,
          left: '55px',
          width: '100px',
          height: pwHidden ? '295px' : '240px',
          backgroundColor: '#8B1538',
          borderRadius: '10px 10px 0 0',
          zIndex: 1,
          transform: purpleTransform,
          transformOrigin: 'bottom center',
          transition: 'all 0.7s ease-in-out',
        }}
      >
        <div style={{
          position: 'absolute',
          display: 'flex',
          gap: '14px',
          left: pwShown ? '18px' : isLookingAtEachOther ? '38px' : `${32 + purplePos.faceX}px`,
          top: pwHidden
            ? '20px'
            : pwShown
              ? '30px'
              : isLookingAtEachOther
                ? '50px'
                : `${38 + purplePos.faceY}px`,
          transition: 'left 0.7s ease-in-out, top 0.7s ease-in-out',
        }}>
          <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D0A0A" isBlinking={isPurpleBlinking} forceLookX={purpleFX} forceLookY={purpleFY} />
          <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D0A0A" isBlinking={isPurpleBlinking} forceLookX={purpleFX} forceLookY={purpleFY} />
        </div>
      </div>

      {/* Dark rectangle character - Middle layer */}
      <div
        ref={blackRef}
        style={{
          position: 'absolute',
          bottom: 0,
          left: '168px',
          width: '72px',
          height: '190px',
          backgroundColor: '#4A0404',
          borderRadius: '8px 8px 0 0',
          zIndex: 2,
          transform: pwShown
            ? `skewX(0deg)`
            : isLookingAtEachOther
              ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 8}deg) translateX(12px)`
              : `skewX(${blackPos.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center',
          transition: 'all 0.7s ease-in-out',
        }}
      >
        <div style={{
          position: 'absolute',
          display: 'flex',
          gap: '11px',
          left: pwShown ? '8px' : isLookingAtEachOther ? '26px' : `${20 + blackPos.faceX}px`,
          top: pwShown ? '22px' : isLookingAtEachOther ? '18px' : `${28 + blackPos.faceY}px`,
          transition: 'left 0.7s ease-in-out, top 0.7s ease-in-out',
        }}>
          <EyeBall size={14} pupilSize={5} maxDistance={3} eyeColor="white" pupilColor="#2D0A0A" isBlinking={isBlackBlinking} forceLookX={blackFX} forceLookY={blackFY} />
          <EyeBall size={14} pupilSize={5} maxDistance={3} eyeColor="white" pupilColor="#2D0A0A" isBlinking={isBlackBlinking} forceLookX={blackFX} forceLookY={blackFY} />
        </div>
      </div>

      {/* Amber/orange semi-circle - Front left */}
      <div
        ref={orangeRef}
        style={{
          position: 'absolute',
          bottom: 0,
          left: '0px',
          width: '145px',
          height: '120px',
          backgroundColor: '#D97706',
          borderRadius: '72px 72px 0 0',
          zIndex: 3,
          transform: pwShown ? `skewX(0deg)` : `skewX(${orangePos.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center',
          transition: 'all 0.7s ease-in-out',
        }}
      >
        <div style={{
          position: 'absolute',
          display: 'flex',
          gap: '14px',
          left: pwShown ? `${40}px` : `${60 + (orangePos.faceX || 0)}px`,
          top: pwShown ? `${55}px` : `${58 + (orangePos.faceY || 0)}px`,
          transition: 'left 0.7s ease-in-out, top 0.7s ease-in-out',
        }}>
          <Pupil size={9} maxDistance={3} pupilColor="#2D0A0A" forceLookX={otherFX} forceLookY={otherFY} />
          <Pupil size={9} maxDistance={3} pupilColor="#2D0A0A" forceLookX={otherFX} forceLookY={otherFY} />
        </div>
      </div>

      {/* Amber/yellow rectangle - Front right */}
      <div
        ref={yellowRef}
        style={{
          position: 'absolute',
          bottom: 0,
          left: '220px',
          width: '78px',
          height: '148px',
          backgroundColor: '#F59E0B',
          borderRadius: '39px 39px 0 0',
          zIndex: 4,
          transform: pwShown ? `skewX(0deg)` : `skewX(${yellowPos.bodySkew || 0}deg)`,
          transformOrigin: 'bottom center',
          transition: 'all 0.7s ease-in-out',
        }}
      >
        <div style={{
          position: 'absolute',
          display: 'flex',
          gap: '11px',
          left: pwShown ? `${16}px` : `${32 + (yellowPos.faceX || 0)}px`,
          top: pwShown ? `${26}px` : `${32 + (yellowPos.faceY || 0)}px`,
          transition: 'left 0.7s ease-in-out, top 0.7s ease-in-out',
        }}>
          <Pupil size={9} maxDistance={3} pupilColor="#2D0A0A" forceLookX={otherFX} forceLookY={otherFY} />
          <Pupil size={9} maxDistance={3} pupilColor="#2D0A0A" forceLookX={otherFX} forceLookY={otherFY} />
        </div>
        {/* Mouth */}
        <div style={{
          position: 'absolute',
          left: pwShown ? `${10}px` : `${24 + (yellowPos.faceX || 0)}px`,
          top: pwShown ? `${70}px` : `${72 + (yellowPos.faceY || 0)}px`,
          width: '28px',
          height: '3px',
          backgroundColor: '#2D0A0A',
          borderRadius: '2px',
          transition: 'left 0.2s ease-out, top 0.2s ease-out',
        }} />
      </div>
    </div>
  );
}

// -- Main AuthPage Component --
export default function AuthPage() {
  const navigate = useNavigate();
  const [view, setView] = useState(VIEWS.LOGIN);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pwFocused, setPwFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
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
    setView(v);
  };

  // -- LOGIN --
  const handleLogin = async (e) => {
    e.preventDefault();
    clear();
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
      if (!verified) { setError('Please verify your email first. Check your inbox.'); setLoading(false); return; }
      const token = await auth.currentUser.getIdToken(true);
      localStorage.setItem('token', token);
      try {
        const res = await API.post('/auth/login', {}, { headers: { Authorization: `Bearer ${token}` } });
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
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        try {
          const checkRes = await API.post('/auth/check-provider', { email: liEmail });
          if (checkRes.data.provider === 'google') {
            setError('This account was created with Google. Please use "Continue with Google" to sign in.');
          } else {
            setError('Wrong email or password.');
          }
        } catch {
          setError('Wrong email or password.');
        }
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Try again later.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else {
        setError('Something went wrong. Please try again.');
      }
      triggerShake();
    }
    setLoading(false);
  };

  // -- SIGNUP STEP 1 --
  const handleStep1 = async (e) => {
    e.preventDefault();
    clear();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(suEmail)) { setError('Enter a valid email address.'); triggerShake(); return; }
    const pwReqs = checkPasswordRequirements(suPass);
    if (!pwReqs.length) { setError('Password must be at least 10 characters.'); triggerShake(); return; }
    if (!pwReqs.upper) { setError('Password must contain at least 1 uppercase letter.'); triggerShake(); return; }
    if (!pwReqs.lower) { setError('Password must contain at least 1 lowercase letter.'); triggerShake(); return; }
    if (!pwReqs.special) { setError('Password must contain at least 1 special character.'); triggerShake(); return; }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, suEmail, suPass);
      await sendEmailVerification(userCredential.user);
      localStorage.setItem('udhaari_pending_email', suEmail);
      setSuccess('Verification email sent! Please check your inbox.');
      setTimeout(() => { setView(VIEWS.VERIFY); setSuccess(''); }, 2000);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('Email already registered. Please log in.');
      else if (err.code === 'auth/invalid-email') setError('Invalid email format.');
      else setError(err.message || 'Something went wrong.');
      triggerShake();
    }
    setLoading(false);
  };

  const pwReqs = checkPasswordRequirements(suPass);
  const showPwRequirements = view === VIEWS.SIGNUP && step === 1 && suPass.length > 0;

  // -- GOOGLE AUTH --
  const handleGoogleAuth = async () => {
    clear();
    setLoading(true);
    try {
      const { signInWithPopup } = await import('firebase/auth');
      const { googleProvider } = await import('../config/firebase');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const token = await user.getIdToken();
      localStorage.setItem('token', token);
      const response = await API.post('/auth/google', {
        token, email: user.email, fullName: user.displayName, photoURL: user.photoURL,
      });
      if (response.data.user) localStorage.setItem('udhaari_user', JSON.stringify(response.data.user));
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

  // -- FORGOT --
  const handleForgot = async (e) => {
    e.preventDefault();
    clear();
    if (!liEmail) { setError('Enter your email address.'); triggerShake(); return; }
    setLoading(true);
    try {
      const checkRes = await API.post('/auth/check-user-status', { email: liEmail });
      if (!checkRes.data.exists) { setError('No account found with this email.'); setLoading(false); return; }
      if (!checkRes.data.isVerified) {
        setError('Please verify your email first. Check your inbox for the verification link.');
        setLoading(false);
        return;
      }
      await sendPasswordResetEmail(auth, liEmail);
      setSuccess('Reset link sent. Check your inbox.');
    } catch {
      setSuccess('If that email exists and is verified, a reset link has been sent.');
    }
    setLoading(false);
  };

  const currentPassword = view === VIEWS.LOGIN ? liPass : suPass;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      background: 'linear-gradient(135deg, #FAF5F0 0%, #F5F0E8 50%, #FAF5F0 100%)',
      fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      <ParticleBackground />

      {/* Ambient blobs */}
      <div style={{ position: 'fixed', top: '-18%', left: '-8%', width: '44vw', height: '44vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139, 21, 56, 0.08) 0%, rgba(107, 15, 26, 0.04) 40%, transparent 75%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-18%', right: '-8%', width: '36vw', height: '36vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(217, 119, 6, 0.08) 0%, rgba(245, 158, 11, 0.04) 40%, transparent 75%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      {/* LEFT COLUMN - Characters */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 40px',
        background: 'linear-gradient(135deg, #8B1538 0%, #6B0F1A 100%)',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        position: 'relative',
        zIndex: 10,
        overflow: 'hidden',
      }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
          LENDIGO
        </div>

        <div style={{ marginBottom: '0.5rem' }}>
          <AnimatedCharacters
            pwVisible={showPw}
            password={currentPassword}
            isTyping={typingIndicator}
          />
        </div>

        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#FFFFFF', margin: '1.5rem 0 0.75rem', letterSpacing: '-0.02em', lineHeight: 1.2, textAlign: 'center' }}>
          {view === VIEWS.LOGIN ? 'Welcome back!' : view === VIEWS.SIGNUP ? 'Join LendiGo!' : 'Check your email'}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: 1.65, margin: 0, maxWidth: 320, textAlign: 'center' }}>
          {view === VIEWS.LOGIN
            ? 'Sign in to continue lending and borrowing with your neighbors'
            : view === VIEWS.SIGNUP
              ? 'Create an account to start lending and borrowing in your community'
              : 'A verification link was sent to your email'}
        </p>

        {/* Footer links */}
        <div style={{ position: 'absolute', bottom: 32, display: 'flex', gap: '2rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Contact</a>
        </div>
      </div>

      {/* RIGHT COLUMN - Forms */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 40px',
        background: 'rgba(255,255,255,0.5)',
        backdropFilter: 'blur(10px)',
        overflow: 'auto',
        position: 'relative',
        zIndex: 10,
        maxHeight: '100vh',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* LOGIN VIEW */}
          {view === VIEWS.LOGIN && (
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#4A0404', margin: '0 0 0.5rem', letterSpacing: '-0.03em' }}>Sign in</h1>
                <p style={{ color: 'rgba(74, 4, 4, 0.5)', fontSize: '1rem', margin: 0 }}>Enter your credentials to continue</p>
              </div>

              {error && <AlertBox type="error" shake={shake}>{error}</AlertBox>}
              {success && <AlertBox type="success">{success}</AlertBox>}

              <form onSubmit={handleLogin}>
                <FloatingField
                  label="Email address"
                  type="email"
                  value={liEmail}
                  onChange={(e) => setLiEmail(e.target.value)}
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>}
                />
                <PwField
                  label="Password"
                  value={liPass}
                  onChange={(e) => { setLiPass(e.target.value); setTypingIndicator(e.target.value.length > 0); }}
                  show={showPw}
                  toggle={() => setShowPw(p => !p)}
                  onFocus={() => setPwFocused(true)}
                  onBlur={() => { setPwFocused(false); }}
                  showTyping={typingIndicator}
                />
                <div style={{ textAlign: 'right', marginTop: '-0.5rem', marginBottom: '1.5rem' }}>
                  <button type="button" onClick={() => go(VIEWS.FORGOT)} style={{ background: 'none', border: 'none', color: '#8B1538', fontSize: '0.9rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontWeight: 500 }}>
                    Forgot password?
                  </button>
                </div>
                <RippleButton loading={loading} type="submit">Sign In</RippleButton>
              </form>

              <Divider />
              <RippleButton type="button" onClick={handleGoogleAuth} loading={loading} variant="outline">
                <GoogleIcon />
                {loading ? 'Signing in...' : 'Continue with Google'}
              </RippleButton>

              <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '1rem', color: 'rgba(74, 4, 4, 0.6)' }}>
                Don't have an account?{' '}
                <button onClick={() => go(VIEWS.SIGNUP)} style={{ background: 'none', border: 'none', color: '#8B1538', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Sign Up
                </button>
              </div>
            </div>
          )}

          {/* SIGNUP VIEW */}
          {view === VIEWS.SIGNUP && step === 1 && (
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#4A0404', margin: '0 0 0.5rem', letterSpacing: '-0.03em' }}>Create account</h1>
                <p style={{ color: 'rgba(74, 4, 4, 0.5)', fontSize: '1rem', margin: 0 }}>Start with your email and a strong password</p>
              </div>

              {error && <AlertBox type="error" shake={shake}>{error}</AlertBox>}
              {success && <AlertBox type="success">{success}</AlertBox>}

              <form onSubmit={handleStep1}>
                <FloatingField
                  label="Email address"
                  type="email"
                  value={suEmail}
                  onChange={(e) => setSuEmail(e.target.value)}
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>}
                />
                <PwField
                  label="Password"
                  value={suPass}
                  onChange={(e) => { setSuPass(e.target.value); setTypingIndicator(e.target.value.length > 0); }}
                  show={showPw}
                  toggle={() => setShowPw(p => !p)}
                  onFocus={() => setPwFocused(true)}
                  onBlur={() => { setPwFocused(false); }}
                  showTyping={typingIndicator}
                />

                {showPwRequirements && (
                  <div style={{ marginTop: '-0.5rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(139, 21, 56, 0.03)', borderRadius: 12, border: '1px solid rgba(139, 21, 56, 0.08)' }}>
                    <RequirementItem met={pwReqs.length} text="At least 10 characters" />
                    <RequirementItem met={pwReqs.upper} text="1 uppercase letter" />
                    <RequirementItem met={pwReqs.lower} text="1 lowercase letter" />
                    <RequirementItem met={pwReqs.special} text="1 special character" />
                  </div>
                )}

                <RippleButton loading={loading} type="submit">Continue</RippleButton>
              </form>

              <Divider />
              <RippleButton type="button" onClick={handleGoogleAuth} loading={loading} variant="outline">
                <GoogleIcon />
                {loading ? 'Signing up...' : 'Continue with Google'}
              </RippleButton>

              <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '1rem', color: 'rgba(74, 4, 4, 0.6)' }}>
                Already have an account?{' '}
                <button onClick={() => go(VIEWS.LOGIN)} style={{ background: 'none', border: 'none', color: '#8B1538', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Sign In
                </button>
              </div>
            </div>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {view === VIEWS.FORGOT && (
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#4A0404', margin: '0 0 0.5rem', letterSpacing: '-0.03em' }}>Reset password</h1>
                <p style={{ color: 'rgba(74, 4, 4, 0.5)', fontSize: '1rem', margin: 0 }}>Enter your email and we'll send a link</p>
              </div>

              {error && <AlertBox type="error" shake={shake}>{error}</AlertBox>}
              {success && <AlertBox type="success">{success}</AlertBox>}

              <form onSubmit={handleForgot}>
                <FloatingField
                  label="Email address"
                  type="email"
                  value={liEmail}
                  onChange={(e) => setLiEmail(e.target.value)}
                />
                <RippleButton loading={loading} type="submit">Send Reset Link</RippleButton>
                <GhostBtn onClick={() => go(VIEWS.LOGIN)}>Back to sign in</GhostBtn>
              </form>
            </div>
          )}

          {/* VERIFY EMAIL VIEW */}
          {view === VIEWS.VERIFY && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 24 }}>📬</div>
              <p style={{ color: 'rgba(74, 4, 4, 0.6)', fontSize: '1.1rem', lineHeight: 1.8, marginBottom: '2rem' }}>
                A verification link was sent to{' '}
                <strong style={{ color: '#8B1538' }}>{pendingEmail}</strong>.<br /><br />
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
                      setSuccess('Email verified successfully!');
                      setTimeout(() => navigate('/complete-profile'), 1500);
                    } else {
                      setError('Email not verified yet. Please check your inbox and spam folder.');
                      triggerShake();
                    }
                  } catch {
                    setError('Failed to verify. Please try again.');
                    triggerShake();
                  }
                  setLoading(false);
                }}
              >
                {loading ? 'Checking...' : "I've Verified My Email"}
              </RippleButton>
              <GhostBtn onClick={() => go(VIEWS.LOGIN)}>Back to Sign In</GhostBtn>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        @keyframes ripple { to { transform: translate(-50%, -50%) scale(25); opacity: 0; } }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
        }
        @keyframes typing { 0%, 100% { height: 4px; opacity: 0.3; } 50% { height: 12px; opacity: 1; } }
      `}</style>
    </div>
  );
}

// -- Floating Field --
function FloatingField({ label, type, value, onChange, icon, placeholder }) {
  const [focused, setFocused] = useState(false);
  const hasValue = value.length > 0;
  return (
    <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
      <div style={{
        position: 'relative',
        background: focused ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 21, 56, 0.03)',
        border: `1px solid ${focused ? '#8B1538' : 'rgba(139, 21, 56, 0.15)'}`,
        borderRadius: 12,
        padding: '1.2rem 1rem 0.7rem',
        transition: 'all 0.2s',
        boxShadow: focused ? '0 0 0 4px rgba(139, 21, 56, 0.1)' : 'none',
      }}>
        <label style={{
          position: 'absolute', left: '1rem',
          top: focused || hasValue ? '0.4rem' : '1.1rem',
          fontSize: focused || hasValue ? '0.75rem' : '1rem',
          color: focused ? '#8B1538' : 'rgba(74, 4, 4, 0.5)',
          transition: 'all 0.2s', pointerEvents: 'none', fontWeight: 500,
        }}>{label}</label>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder=" "
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#4A0404', fontSize: '1rem', paddingTop: '0.2rem', fontFamily: 'inherit' }}
        />
        {icon && (
          <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: focused ? '#8B1538' : 'rgba(74, 4, 4, 0.3)', transition: 'color 0.2s' }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// -- Password Field --
function PwField({ label, value, onChange, show, toggle, onFocus, onBlur, showTyping }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{
        position: 'relative',
        background: focused ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 21, 56, 0.03)',
        border: `1px solid ${focused ? '#8B1538' : 'rgba(139, 21, 56, 0.15)'}`,
        borderRadius: 12,
        padding: '1.2rem 3rem 0.7rem 1rem',
        transition: 'all 0.2s',
        boxShadow: focused ? '0 0 0 4px rgba(139, 21, 56, 0.1)' : 'none',
      }}>
        <label style={{
          position: 'absolute', left: '1rem',
          top: focused || value.length > 0 ? '0.4rem' : '1.1rem',
          fontSize: focused || value.length > 0 ? '0.75rem' : '1rem',
          color: focused ? '#8B1538' : 'rgba(74, 4, 4, 0.5)',
          transition: 'all 0.2s', pointerEvents: 'none', fontWeight: 500,
        }}>{label}</label>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder=" "
          onFocus={() => { setFocused(true); onFocus?.(); }}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#4A0404', fontSize: '1rem', paddingTop: '0.2rem', fontFamily: 'inherit' }}
        />
        <button type="button" onClick={toggle} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: show ? '#8B1538' : 'rgba(74, 4, 4, 0.3)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}>
          {showTyping && (
            <span style={{ position: 'absolute', right: '35px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '2px' }}>
              {[0, 0.2, 0.4].map((delay, i) => (
                <span key={i} style={{ width: '3px', height: '12px', background: '#8B1538', animation: `typing 1s ease-in-out infinite ${delay}s` }} />
              ))}
            </span>
          )}
          {show
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
          }
        </button>
      </div>
    </div>
  );
}

// -- Requirement Item --
function RequirementItem({ met, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', fontSize: '0.9rem', color: met ? '#166534' : 'rgba(74, 4, 4, 0.5)', transition: 'color 0.3s' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
        {met ? <polyline points="20 6 9 17 4 12" /> : <circle cx="12" cy="12" r="10" />}
      </svg>
      {text}
    </div>
  );
}

// -- Ripple Button --
function RippleButton({ children, loading, type, onClick, variant }) {
  const [ripples, setRipples] = useState([]);
  const isOutline = variant === 'outline';

  const handleClick = (e) => {
    if (loading) return;
    const r = e.currentTarget.getBoundingClientRect();
    const newRipple = { x: e.clientX - r.left, y: e.clientY - r.top, id: Date.now() };
    setRipples(prev => [...prev, newRipple]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== newRipple.id)), 600);
    onClick?.(e);
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={loading}
      style={{
        width: '100%', padding: '1rem',
        background: isOutline ? 'transparent' : loading ? '#991B1B' : 'linear-gradient(135deg, #8B1538 0%, #6B0F1A 100%)',
        border: isOutline ? '2px solid rgba(139, 21, 56, 0.3)' : 'none',
        borderRadius: 14,
        color: isOutline ? '#4A0404' : '#fff',
        fontSize: '1rem', fontWeight: 700,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.75 : 1,
        boxShadow: isOutline ? 'none' : loading ? 'none' : '0 6px 24px rgba(139, 21, 56, 0.35)',
        transition: 'all 0.2s',
        position: 'relative', overflow: 'hidden',
        fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          if (isOutline) { e.currentTarget.style.borderColor = '#8B1538'; e.currentTarget.style.background = 'rgba(139, 21, 56, 0.05)'; }
          else { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(139, 21, 56, 0.45)'; }
        }
      }}
      onMouseLeave={(e) => {
        if (isOutline) { e.currentTarget.style.borderColor = 'rgba(139, 21, 56, 0.3)'; e.currentTarget.style.background = 'transparent'; }
        else { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 6px 24px rgba(139, 21, 56, 0.35)'; }
      }}
    >
      {ripples.map(r => (
        <span key={r.id} style={{ position: 'absolute', width: '20px', height: '20px', background: isOutline ? 'rgba(139, 21, 56, 0.2)' : 'rgba(255,255,255,0.4)', borderRadius: '50%', transform: 'translate(-50%, -50%) scale(0)', animation: 'ripple 0.6s ease-out', left: r.x, top: r.y, pointerEvents: 'none' }} />
      ))}
      {children}
    </button>
  );
}

// -- Alert Box --
function AlertBox({ type, children, shake }) {
  const err = type === 'error';
  return (
    <div style={{
      padding: '0.9rem 1.2rem', borderRadius: 12, marginBottom: '1.5rem',
      background: err ? 'rgba(220, 38, 38, 0.08)' : 'rgba(34, 197, 94, 0.08)',
      border: `1px solid ${err ? 'rgba(220, 38, 38, 0.25)' : 'rgba(34, 197, 94, 0.25)'}`,
      color: err ? '#991B1B' : '#166534',
      fontSize: '0.95rem', lineHeight: 1.5,
      animation: shake ? 'shake 0.5s ease-in-out' : 'none',
    }}>
      {children}
    </div>
  );
}

// -- Ghost Button --
function GhostBtn({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={{ width: '100%', padding: '0.9rem', background: 'transparent', border: '1px solid rgba(139, 21, 56, 0.15)', borderRadius: 14, color: 'rgba(74, 4, 4, 0.6)', fontSize: '0.95rem', cursor: 'pointer', marginTop: 16, fontFamily: 'inherit', transition: 'all 0.2s', fontWeight: 500 }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139, 21, 56, 0.3)'; e.currentTarget.style.color = 'rgba(74, 4, 4, 0.8)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139, 21, 56, 0.15)'; e.currentTarget.style.color = 'rgba(74, 4, 4, 0.6)'; }}
    >
      {children}
    </button>
  );
}

// -- Divider --
function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', margin: '2rem 0', color: 'rgba(74, 4, 4, 0.4)', fontSize: '0.9rem' }}>
      <div style={{ flex: 1, height: '1px', background: 'rgba(139, 21, 56, 0.15)' }} />
      <span style={{ padding: '0 1.5rem' }}>or continue with</span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(139, 21, 56, 0.15)' }} />
    </div>
  );
}

// -- Google Icon --
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4" />
      <path d="M12.2401 24.0008C15.4766 24.0008 18.2059 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.2401 24.0008Z" fill="#34A853" />
      <path d="M5.50253 14.3003C5.00236 12.8099 5.00236 11.1961 5.50253 9.70575V6.61481H1.5166C-0.18551 10.0056 -0.18551 14.0004 1.5166 17.3912L5.50253 14.3003Z" fill="#FBBC05" />
      <path d="M12.2401 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.2401 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.2401 4.74966Z" fill="#EA4335" />
    </svg>
  );
}

// -- Particle Background --
function ParticleBackground() {
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    const t = setTimeout(() => {
      setParticles(Array.from({ length: 50 }, (_, i) => ({
        id: i, x: Math.random() * 100, y: Math.random() * 100,
        size: Math.random() * 3 + 1, duration: Math.random() * 20 + 10, delay: Math.random() * 5,
      })));
    }, 0);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {particles.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: 'rgba(139, 21, 56, 0.15)', borderRadius: '50%', animation: `float ${p.duration}s ease-in-out infinite`, animationDelay: `${p.delay}s` }} />
      ))}
    </div>
  );
}