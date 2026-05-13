import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import StaggeredMenu from './StaggeredMenu';
import './Navbar.css';

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

function Logo() {
  return (
    <Link to="/" className="navbar-logo" aria-label="Go to homepage">
      {'LendiGo'.split('').map((letter, index) => (
        <span className={`navbar-logo__letter navbar-logo__letter--${index}`} key={`${letter}-${index}`}>
          {letter}
        </span>
      ))}
    </Link>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('udhaari_user') || 'null');
    } catch {
      return null;
    }
  }, []);

  const isLoggedIn = !!storedUser;
  const role = storedUser?.Role || storedUser?.role || 'user';
  const isAdmin = role === 'admin';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      // Local cleanup is still enough if Firebase is already signed out.
    }
    localStorage.removeItem('token');
    localStorage.removeItem('udhaari_user');
    navigate('/auth');
  };

  const publicItems = [
    { link: '/', text: 'Home', eyebrow: 'Landing', image: makeMenuImage('Home', '#F4A020', '#800020') },
    { link: '/browse', text: 'Browse', eyebrow: 'Assets nearby', image: makeMenuImage('Browse', '#800020', '#C4956A') },
    { link: '/requests', text: 'Requests', eyebrow: 'Community needs', image: makeMenuImage('Need', '#5C0018', '#F4A020') },
  ];

  const signedInItems = [
    { link: '/post-request', text: 'Post Request', eyebrow: 'Ask community', image: makeMenuImage('Post', '#F4A020', '#5C0018') },
    { link: '/dashboard', text: 'Dashboard', eyebrow: 'Overview', image: makeMenuImage('Hub', '#800020', '#F4A020') },
    { link: '/my-assets', text: 'My Assets', eyebrow: 'Things you lend', image: makeMenuImage('Assets', '#C4956A', '#5C0018') },
    { link: '/my-assets/add', text: 'List Asset', eyebrow: 'Add item', image: makeMenuImage('List', '#F4A020', '#800020') },
    { link: '/my-requests', text: 'My Requests', eyebrow: 'Needs posted', image: makeMenuImage('Mine', '#800020', '#C4956A') },
    { link: '/my-offers', text: 'Offers Gotten', eyebrow: 'Received', image: makeMenuImage('Got', '#5C0018', '#F4A020') },
    { link: '/my-offers-made', text: 'Offers Made', eyebrow: 'Sent', image: makeMenuImage('Made', '#F4A020', '#5C0018') },
    { link: '/bookings', text: 'Bookings', eyebrow: 'Orders', image: makeMenuImage('Book', '#800020', '#F4A020') },
    { link: '/wallet', text: 'Wallet', eyebrow: 'Payments', image: makeMenuImage('Pay', '#C4956A', '#800020') },
    { link: '/profile', text: 'Profile', eyebrow: 'Account', image: makeMenuImage('You', '#5C0018', '#C4956A') },
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

  const menuItems = [
    ...publicItems,
    ...(isLoggedIn ? signedInItems : []),
    ...adminItems,
    ...authItems,
  ];

  return (
    <nav className={`navbar navbar--minimal ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        <Logo />
        <StaggeredMenu
          items={menuItems}
          colors={['#F4A020', '#800020', '#5C0018']}
          accentColor="#F4A020"
          menuButtonColor="#6B4C3B"
          openMenuButtonColor="#FDF6EC"
        />
      </div>
    </nav>
  );
}
