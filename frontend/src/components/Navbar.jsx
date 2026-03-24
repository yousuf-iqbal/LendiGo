import { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function Navbar() {
  const { user, fbUser, loading } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const hideNav = ['/login', '/signup'].includes(location.pathname);
  if (hideNav) return null;

  async function handleLogout() {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isLoggedIn = !!fbUser && fbUser.emailVerified;

  if (loading) {
    return (
      <nav style={styles.nav}>
        <div style={styles.inner}>
          <div style={styles.logo}>
            <span style={styles.logoText}>Udhaari</span>
            <span style={styles.logoDot}>.</span>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav style={styles.nav} className="glass">
      <div style={styles.inner}>
        <Link to="/" style={styles.logo}>
          <span style={styles.logoText}>Udhaari</span>
          <span style={styles.logoDot}>.</span>
        </Link>

        <div style={styles.links}>
          <Link to="/browse" style={{ ...styles.link, ...(isActive('/browse') ? styles.linkActive : {}) }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
              <path d="M3 9L12 3L21 9L12 15L3 9Z M3 15L12 21L21 15"/>
            </svg>
            Browse
          </Link>
          <Link to="/requests" style={{ ...styles.link, ...(isActive('/requests') ? styles.linkActive : {}) }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Requests
          </Link>
          {isLoggedIn && (
            <>
              <Link to="/requests/new" style={{ ...styles.link, ...(isActive('/requests/new') ? styles.linkActive : {}) }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                Post Request
              </Link>
              <Link to="/profile" style={{ ...styles.link, ...(isActive('/profile') ? styles.linkActive : {}) }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Profile
              </Link>
            </>
          )}
        </div>

        <div style={styles.right}>
          {isLoggedIn ? (
            <div style={styles.userMenu}>
              <div style={styles.userAvatar}>
                {fbUser.email?.charAt(0).toUpperCase()}
              </div>
              <span style={styles.userEmail}>{fbUser.email?.split('@')[0]}</span>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
              </button>
            </div>
          ) : (
            <div style={styles.authButtons}>
              <Link to="/login" style={styles.loginLink}>Login</Link>
              <Link to="/signup" style={styles.signupLink}>Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
    padding: '12px 0',
  },
  inner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'baseline',
  },
  logoText: {
    fontFamily: "'Syne', sans-serif",
    fontSize: '26px',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #8b5cf6 0%, #ec489a 100%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    letterSpacing: '-0.02em',
  },
  logoDot: {
    fontSize: '30px',
    fontWeight: 800,
    color: '#8b5cf6',
  },
  links: {
    display: 'flex',
    gap: '28px',
    alignItems: 'center',
  },
  link: {
    color: '#a1a1aa',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.3s ease',
  },
  linkActive: {
    color: '#8b5cf6',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  userEmail: {
    color: '#a1a1aa',
    fontSize: '13px',
    fontWeight: 500,
  },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    padding: '6px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.3s ease',
  },
  authButtons: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  loginLink: {
    color: '#8b5cf6',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
    padding: '8px 16px',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
  },
  signupLink: {
    background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    color: 'white',
    textDecoration: 'none',
    padding: '8px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.3s ease',
  }
};