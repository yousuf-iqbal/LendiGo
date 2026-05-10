﻿import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import './Navbar.css';

// SVG Icons
const BrowseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const RequestsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

const BookingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const DashboardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const WalletIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4h-4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4z"/>
    <line x1="18" y1="12" x2="18" y2="12.01"/>
  </svg>
);

const AdminIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const AssetsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7l-8-4-8 4M20 12l-8 4-8-4M12 3v18"/>
  </svg>
);

const OffersInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
  </svg>
);

const OffersOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 22l9-11M2 22l7-20 4 9 9 4-20 7z"/>
  </svg>
);

const ProfileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const MyRequestsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16v16H4z"/>
    <line x1="8" y1="8" x2="16" y2="8"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
    <line x1="8" y1="16" x2="12" y2="16"/>
  </svg>
);

const ChevronIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2.5 4.5 6 8 9.5 4.5"/>
  </svg>
);

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  const storedUser = JSON.parse(localStorage.getItem('udhaari_user') || 'null');
  const isLoggedIn = !!storedUser;
  const userRole = storedUser?.Role || storedUser?.role || 'user';
  const isAdmin = userRole === 'admin';
  const displayName = storedUser?.FullName || storedUser?.fullName || storedUser?.name || 'User';
  const initials = displayName.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  const profilePic = storedUser?.ProfilePic || storedUser?.profilePic || null;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = async () => {
    try { await signOut(auth); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('udhaari_user');
    setMenuOpen(false);
    navigate('/auth');
  };

  // Main Navigation Links (visible in navbar - NOT in dropdown)
  const navLinks = isAdmin ? [
    { path: '/admin', label: 'Admin', icon: AdminIcon },
    { path: '/browse', label: 'Browse', icon: BrowseIcon },
    { path: '/requests', label: 'Requests', icon: RequestsIcon },
  ] : isLoggedIn ? [
    { path: '/browse', label: 'Browse', icon: BrowseIcon },
    { path: '/requests', label: 'Requests', icon: RequestsIcon },
    { path: '/bookings', label: 'Bookings', icon: BookingsIcon },
    { path: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { path: '/wallet', label: 'Wallet', icon: WalletIcon },
  ] : [
    { path: '/browse', label: 'Browse', icon: BrowseIcon },
    { path: '/requests', label: 'Requests', icon: RequestsIcon },
  ];

  // Dropdown Items (ONLY account options - no duplicate nav links)
  const dropdownItems = [
    { path: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { path: '/my-assets', label: 'My Assets', icon: AssetsIcon },
    { path: '/my-requests', label: 'My Requests', icon: MyRequestsIcon },
    { path: '/my-offers', label: 'Offers Received', icon: OffersInIcon },
    { path: '/my-offers-made', label: 'Offers Made', icon: OffersOutIcon },
    { path: '/bookings', label: 'My Bookings', icon: BookingsIcon },
    { path: '/wallet', label: 'Wallet', icon: WalletIcon },
    { path: '/profile', label: 'Profile', icon: ProfileIcon },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700;800&display=swap');
        
        body {
          padding-top: 88px;
        }
        
        @media (max-width: 768px) {
          body {
            padding-top: 80px;
          }
        }
        
        .navbar {
          position: fixed;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 32px);
          max-width: 1280px;
          z-index: 1000;
          background: rgba(255, 249, 240, 0.92);
          backdrop-filter: blur(16px);
          border-radius: 60px;
          padding: 8px 20px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px rgba(128, 0, 32, 0.08);
          border: 1px solid rgba(128, 0, 32, 0.1);
        }
        
        .navbar--scrolled {
          top: 8px;
          background: rgba(255, 249, 240, 0.98);
          box-shadow: 0 8px 32px rgba(128, 0, 32, 0.12);
          border-color: rgba(128, 0, 32, 0.2);
        }
        
        .navbar__inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        
        /* Logo Styles */
        .logo {
          display: flex;
          align-items: center;
          text-decoration: none;
          position: relative;
          overflow: hidden;
          border-radius: 40px;
          padding: 6px 16px 6px 12px;
          transition: all 0.3s ease;
        }
        
        .logo::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(244, 160, 32, 0.2), transparent);
          transition: left 0.5s ease;
        }
        
        .logo:hover::before {
          left: 100%;
        }
        
        .logo:hover {
          transform: scale(1.02);
        }
        
        .logo__letter {
          display: inline-block;
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.02em;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          text-shadow: 2px 2px 4px rgba(128, 0, 32, 0.1);
        }
        
        .logo__letter--L { color: #800020; }
        .logo__letter--e { color: #F4A020; }
        .logo__letter--n { color: #800020; }
        .logo__letter--d { color: #C4956A; }
        .logo__letter--i { color: #F4A020; }
        .logo__letter--g { color: #800020; }
        .logo__letter--o { color: #C4956A; }
        
        .logo:hover .logo__letter--L { color: #F4A020; }
        .logo:hover .logo__letter--e { color: #800020; }
        .logo:hover .logo__letter--n { color: #C4956A; }
        .logo:hover .logo__letter--d { color: #F4A020; }
        .logo:hover .logo__letter--i { color: #800020; }
        .logo:hover .logo__letter--g { color: #F4A020; }
        .logo:hover .logo__letter--o { color: #800020; }
        
        .admin-badge {
          font-size: 9px;
          font-weight: 700;
          background: linear-gradient(135deg, #800020, #B00030);
          color: #fff;
          padding: 3px 8px;
          border-radius: 30px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-left: 4px;
          animation: pulse-admin 2s ease-in-out infinite;
        }
        
        @keyframes pulse-admin {
          0%, 100% { box-shadow: 0 0 0 0 rgba(128, 0, 32, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(128, 0, 32, 0); }
        }
        
        /* Nav Links Container */
        .nav-links {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(128, 0, 32, 0.04);
          padding: 4px;
          border-radius: 50px;
        }
        
        .nav-link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          border-radius: 40px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          z-index: 1;
        }
        
        .nav-link::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #F4A020, #800020);
          border-radius: 40px;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: -1;
        }
        
        .nav-link:hover::before {
          opacity: 1;
        }
        
        .nav-link:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(244, 160, 32, 0.3);
          color: white !important;
        }
        
        .nav-link--active {
          background: linear-gradient(135deg, #800020, #5C0018);
          color: white !important;
          box-shadow: 0 4px 12px rgba(128, 0, 32, 0.3);
        }
        
        .nav-link--active::before {
          display: none;
        }
        
        .nav-link--active:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(128, 0, 32, 0.4);
        }
        
        .nav-link:not(.nav-link--active) {
          color: #6B4C3B;
        }
        
        .nav-link svg {
          flex-shrink: 0;
        }
        
        /* Profile Button */
        .profile-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(128, 0, 32, 0.06);
          border: 1px solid rgba(128, 0, 32, 0.12);
          border-radius: 50px;
          padding: 6px 16px 6px 6px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .profile-btn:hover {
          background: rgba(244, 160, 32, 0.15);
          border-color: #F4A020;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(244, 160, 32, 0.2);
        }
        
        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #F4A020, #800020);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 14px;
          transition: transform 0.3s ease;
        }
        
        .profile-btn:hover .avatar {
          transform: scale(1.05);
        }
        
        .profile-name {
          font-size: 14px;
          font-weight: 500;
          color: #6B4C3B;
        }
        
        /* Dropdown Menu - Clean & Compact */
        .dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          background: rgba(255, 249, 240, 0.98);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(128, 0, 32, 0.12);
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(128, 0, 32, 0.15);
          min-width: 240px;
          padding: 8px;
          animation: dropdownFadeIn 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          z-index: 100;
        }
        
        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-15px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 14px;
          background: transparent;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #6B4C3B;
          text-align: left;
          transition: all 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          font-family: 'Outfit', sans-serif;
        }
        
        .dropdown-item:hover {
          background: rgba(244, 160, 32, 0.12);
          transform: translateX(4px) scale(1.02);
          color: #800020;
        }
        
        .dropdown-item:active {
          transform: translateX(2px) scale(0.98);
        }
        
        .dropdown-item--danger {
          color: #DC2626;
        }
        
        .dropdown-item--danger:hover {
          background: #FEE2E2;
          transform: translateX(4px) scale(1.02);
        }
        
        .dropdown-item svg {
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }
        
        .dropdown-item:hover svg {
          transform: scale(1.1);
        }
        
        .dropdown-divider {
          height: 1px;
          background: rgba(128, 0, 32, 0.08);
          margin: 8px 0;
        }
        
        /* Auth Buttons */
        .auth-buttons {
          display: flex;
          gap: 10px;
        }
        
        .auth-btn {
          padding: 10px 24px;
          border-radius: 40px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .auth-btn--outline {
          background: transparent;
          border: 2px solid rgba(128, 0, 32, 0.2);
          color: #6B4C3B;
        }
        
        .auth-btn--outline:hover {
          border-color: #F4A020;
          background: rgba(244, 160, 32, 0.1);
          transform: translateY(-2px);
        }
        
        .auth-btn--solid {
          background: linear-gradient(135deg, #800020, #5C0018);
          border: none;
          color: white;
          box-shadow: 0 4px 12px rgba(128, 0, 32, 0.3);
        }
        
        .auth-btn--solid:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(128, 0, 32, 0.4);
        }
        
        /* Burger Menu */
        .burger {
          display: none;
          flex-direction: column;
          gap: 5px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
        }
        
        .burger span {
          width: 24px;
          height: 2px;
          background: #6B4C3B;
          border-radius: 2px;
          transition: all 0.3s ease;
        }
        
        .burger.open span:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }
        
        .burger.open span:nth-child(2) {
          opacity: 0;
        }
        
        .burger.open span:nth-child(3) {
          transform: rotate(-45deg) translate(5px, -5px);
        }
        
        /* Mobile Menu with Expand Animation */
        .mobile-menu {
          display: none;
          position: fixed;
          top: 88px;
          left: 16px;
          right: 16px;
          background: rgba(255, 249, 240, 0.98);
          backdrop-filter: blur(16px);
          border-radius: 24px;
          border: 1px solid rgba(128, 0, 32, 0.12);
          padding: 16px;
          flex-direction: column;
          gap: 8px;
          animation: mobileSlideIn 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          z-index: 999;
          max-height: 80vh;
          overflow-y: auto;
        }
        
        @keyframes mobileSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .mobile-menu.open {
          display: flex;
        }
        
        .mobile-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 14px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.25s cubic-bezier(0.2, 0.9, 0.4, 1.1);
        }
        
        .mobile-link:hover {
          background: rgba(244, 160, 32, 0.1);
          transform: translateX(4px) scale(1.01);
        }
        
        .mobile-divider {
          height: 1px;
          background: rgba(128, 0, 32, 0.08);
          margin: 8px 0;
        }
        
        @media (max-width: 880px) {
          .nav-links { display: none; }
          .burger { display: flex; }
        }
        
        @media (max-width: 640px) {
          body { padding-top: 80px; }
          .navbar { top: 12px; width: calc(100% - 24px); }
          .profile-name { display: none; }
          .profile-btn { padding: 6px; }
          .auth-buttons { display: none; }
          .dropdown { right: -10px; min-width: 220px; }
          .mobile-menu { top: 80px; }
        }
        
        @media (max-width: 480px) {
          .logo__letter { font-size: 24px; }
          .navbar__inner { padding: 6px 16px; }
        }
      `}</style>

      <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
        <div className="navbar__inner">
          {/* Logo */}
          <Link to="/" className="logo">
            <div className="logo__letter logo__letter--L">L</div>
            <div className="logo__letter logo__letter--e">e</div>
            <div className="logo__letter logo__letter--n">n</div>
            <div className="logo__letter logo__letter--d">d</div>
            <div className="logo__letter logo__letter--i">i</div>
            <div className="logo__letter logo__letter--g">g</div>
            <div className="logo__letter logo__letter--o">o</div>
            {isAdmin && <span className="admin-badge">Admin</span>}
          </Link>

          {/* Desktop Navigation Links */}
          <div className="nav-links">
            {navLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`nav-link ${isActive(link.path) ? 'nav-link--active' : ''}`}
                >
                  <IconComponent />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Auth Section */}
          {isLoggedIn ? (
            <div style={{ position: 'relative' }}>
              <button className="profile-btn" onClick={() => setMenuOpen(!menuOpen)}>
                <div className="avatar">
                  {profilePic ? '' : initials}
                </div>
                <span className="profile-name">{displayName.split(' ')[0]}</span>
                <ChevronIcon />
              </button>

              {menuOpen && (
                <div className="dropdown">
                  {dropdownItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.path}
                        className="dropdown-item"
                        onClick={() => {
                          navigate(item.path);
                          setMenuOpen(false);
                        }}
                        onMouseEnter={() => setHoveredItem(item.path)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <IconComponent />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                  <div className="dropdown-divider" />
                  <button className="dropdown-item dropdown-item--danger" onClick={handleLogout}>
                    <LogoutIcon /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/auth" className="auth-btn auth-btn--outline">Sign in</Link>
              <Link to="/auth" className="auth-btn auth-btn--solid">Get started</Link>
            </div>
          )}

          {/* Burger Menu Button */}
          <button className={`burger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        {navLinks.map((link) => {
          const IconComponent = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              className="mobile-link"
              style={{ color: isActive(link.path) ? '#800020' : '#6B4C3B' }}
              onClick={() => setMenuOpen(false)}
            >
              <IconComponent />
              <span style={{ fontWeight: 600 }}>{link.label}</span>
            </Link>
          );
        })}
        
        <div className="mobile-divider" />
        
        {dropdownItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="mobile-link"
              style={{ color: '#6B4C3B' }}
              onClick={() => setMenuOpen(false)}
            >
              <IconComponent />
              <span>{item.label}</span>
            </Link>
          );
        })}
        
        <div className="mobile-divider" />
        
        {isLoggedIn ? (
          <button className="mobile-link" onClick={handleLogout} style={{ color: '#DC2626', width: '100%', textAlign: 'left' }}>
            <LogoutIcon /> Sign out
          </button>
        ) : (
          <Link
            to="/auth"
            className="mobile-link"
            style={{ justifyContent: 'center', background: 'linear-gradient(135deg, #800020, #5C0018)', color: 'white', marginTop: '8px' }}
            onClick={() => setMenuOpen(false)}
          >
            Get Started
          </Link>
        )}
      </div>

      {/* Click outside to close */}
      {menuOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 90 }}
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}