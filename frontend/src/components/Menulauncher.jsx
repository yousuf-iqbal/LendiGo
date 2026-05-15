import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import StaggeredMenu from './StaggeredMenu';

// Copy the makeMenuImage function from Navbar.jsx
function makeMenuImage(seed, primary, secondary) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="420" height="160" viewBox="0 0 420 160">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="${primary}"/>
          <stop offset="1" stop-color="${secondary}"/>
        </linearGradient>
      </defs>
      <rect width="420" height="160" rx="80" fill="url(#g)"/>
      <circle cx="78" cy="72" r="48" fill="rgba(255,249,240,0.2)"/>
      <circle cx="336" cy="94" r="62" fill="rgba(255,249,240,0.14)"/>
      <path d="M54 102 C 112 36, 248 132, 362 46" fill="none" stroke="rgba(255,249,240,0.42)" stroke-width="11" stroke-linecap="round"/>
      <text x="34" y="126" font-family="Georgia, serif" font-size="34" font-weight="700" fill="rgba(253,246,236,0.86)">${seed}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function MenuLauncher() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('udhaari_user') || 'null'); }
    catch { return null; }
  })();

  const isLoggedIn = !!storedUser;
  const role = storedUser?.Role || storedUser?.role || 'user';
  const isAdmin = role === 'admin';

  const handleLogout = async () => {
    try { await signOut(auth); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('udhaari_user');
    navigate('/auth');
  };

  const publicItems = [
    { link: '/browse', text: 'Browse', eyebrow: 'Explore assets', image: makeMenuImage('Browse', '#800020', '#C4956A') },
    { link: '/requests', text: 'Requests', eyebrow: 'Community needs', image: makeMenuImage('Need', '#5C0018', '#F4A020') },
  ];

  const signedInItems = [
    { link: '/post-request', text: 'Post Request', eyebrow: 'Ask community', image: makeMenuImage('Post', '#F4A020', '#5C0018') },
    { link: '/my-assets/add', text: 'List Asset', eyebrow: 'Add item', image: makeMenuImage('List', '#F4A020', '#800020') },
    { link: '/bookings', text: 'Bookings', eyebrow: 'Your orders', image: makeMenuImage('Book', '#800020', '#F4A020') },
    { link: '/messages', text: 'Messages', eyebrow: 'Conversations', image: makeMenuImage('Chat', '#F4A020', '#800020') },
    { link: '/my-assets', text: 'My Assets', eyebrow: 'Items you lend', image: makeMenuImage('Assets', '#C4956A', '#5C0018') },
    { link: '/my-offers-made', text: 'Offers Made', eyebrow: 'Offers sent', image: makeMenuImage('Made', '#F4A020', '#5C0018') },
    { link: '/my-offers', text: 'Offers Received', eyebrow: 'Offers gotten', image: makeMenuImage('Got', '#5C0018', '#F4A020') },
    { link: '/wallet', text: 'Wallet', eyebrow: 'Payments & topups', image: makeMenuImage('Pay', '#C4956A', '#800020') },
    { link: '/dashboard', text: 'Dashboard', eyebrow: 'Overview & stats', image: makeMenuImage('Hub', '#800020', '#F4A020') },
    { link: '/profile', text: 'Profile', eyebrow: 'Account settings', image: makeMenuImage('You', '#5C0018', '#C4956A') },
  ];

  const authItems = isLoggedIn
    ? [{ text: 'Sign Out', eyebrow: 'End session', action: handleLogout, image: makeMenuImage('Exit', '#800020', '#2C1810') }]
    : [
      { link: '/auth', text: 'Sign In', eyebrow: 'Welcome back', image: makeMenuImage('In', '#800020', '#F4A020') },
      { link: '/auth', text: 'Get Started', eyebrow: 'Join free', image: makeMenuImage('Join', '#F4A020', '#5C0018') },
    ];

  const adminItems = isAdmin
    ? [{ link: '/admin', text: 'Admin', eyebrow: 'Control panel', image: makeMenuImage('Admin', '#5C0018', '#800020') }]
    : [];

  const menuItems = [...publicItems, ...(isLoggedIn ? signedInItems : []), ...adminItems, ...authItems];

  return (
    <>
      {/* BIG MENU BUTTON - Extreme Left */}
      <button
        className="big-menu-btn"
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          position: 'fixed',
          left: '20px',
          top: '20px',
          zIndex: 9999,
          width: '70px',
          height: '70px',
          fontSize: '2.2rem',
          background: menuOpen ? '#F4A020' : '#800020',
          color: '#fff',
          border: '3px solid rgba(255,255,255,0.3)',
          borderRadius: '18px',
          boxShadow: '0 8px 32px rgba(128,0,32,0.5)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
        }}
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {/* Show StaggeredMenu when button clicked */}
      
       {menuOpen && (
  <StaggeredMenu
    items={menuItems}
    colors={['#F4A020', '#800020', '#5C0018']}
    accentColor="#F4A020"
    hideToggle={true}
    startOpen={true}
    onMenuClose={() => setMenuOpen(false)}
  />
)}
      
    
    </>
  );
}