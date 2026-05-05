import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem('udhaari_user') || 'null');
  const isLoggedIn = !!storedUser;
  const userRole = storedUser?.Role || storedUser?.role || 'user';
  const isAdmin = userRole === 'admin';
  const displayName = storedUser?.FullName || storedUser?.fullName || storedUser?.name || 'User';
  const initials = displayName.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  const profilePic = storedUser?.ProfilePic || storedUser?.profilePic || null;

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = async () => {
    try { await signOut(auth); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('udhaari_user');
    setMenuOpen(false);
    navigate('/auth');
  };

  const linkStyle = (path) => ({
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
    color: isActive(path) ? '#059669' : '#374151',
    padding: '6px 12px',
    borderRadius: '8px',
    background: isActive(path) ? '#f0fdf4' : 'transparent',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  });

  return (
    <>
      <style>{`
        .nav-link:hover { background: #f3f4f6 !important; color: #1f2937 !important; }
        .nav-link.active-link { background: #f0fdf4 !important; color: #059669 !important; }
        .admin-badge { animation: pulse-badge 2s ease-in-out infinite; }
        @keyframes pulse-badge {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(220, 38, 38, 0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e5e7eb',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '16px',
      }}>

        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{
            fontSize: '22px',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            color: '#1f2937',
          }}>
            Lendigo
          </span>
          {isAdmin && (
            <span className="admin-badge" style={{
              fontSize: '10px',
              fontWeight: 700,
              background: '#dc2626',
              color: '#fff',
              padding: '2px 7px',
              borderRadius: '20px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Admin
            </span>
          )}
        </Link>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Nav Links — Desktop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>

          {/* Admin gets a special nav */}
          {isAdmin ? (
            <>
              <Link to="/admin" className="nav-link" style={linkStyle('/admin')}>
                🛡️ Admin Panel
              </Link>
              <Link to="/browse" className="nav-link" style={linkStyle('/browse')}>
                Browse
              </Link>
              <Link to="/requests" className="nav-link" style={linkStyle('/requests')}>
                Requests
              </Link>
            </>
          ) : isLoggedIn ? (
            <>
              <Link to="/browse" className="nav-link" style={linkStyle('/browse')}>
                Browse
              </Link>
              <Link to="/requests" className="nav-link" style={linkStyle('/requests')}>
                Requests
              </Link>
              <Link to="/bookings" className="nav-link" style={linkStyle('/bookings')}>
                Bookings
              </Link>
              <Link to="/dashboard" className="nav-link" style={linkStyle('/dashboard')}>
                Dashboard
              </Link>
              <Link to="/wallet" className="nav-link" style={linkStyle('/wallet')}>
                Wallet
              </Link>
            </>
          ) : (
            <>
              <Link to="/browse" className="nav-link" style={linkStyle('/browse')}>
                Browse
              </Link>
              <Link to="/requests" className="nav-link" style={linkStyle('/requests')}>
                Requests
              </Link>
            </>
          )}
        </div>

        {/* Auth Section */}
        {isLoggedIn ? (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                padding: '6px 12px 6px 6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#059669'; e.currentTarget.style.background = '#f0fdf4'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = 'none'; }}
            >
              {/* Avatar */}
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: profilePic ? `url(${profilePic}) center/cover` : (isAdmin ? '#dc2626' : '#059669'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '12px',
                flexShrink: 0,
              }}>
                {profilePic ? '' : initials}
              </div>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isAdmin ? `${displayName} (Admin)` : displayName}
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: '#9ca3af', transform: menuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}>
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  minWidth: '200px',
                  padding: '6px',
                  animation: 'slideDown 0.15s ease-out',
                  zIndex: 100,
                }}
              >
                {/* Admin shortcut at top of dropdown */}
                {isAdmin && (
                  <>
                    <DropItem
                      onClick={() => { navigate('/admin'); setMenuOpen(false); }}
                      icon="🛡️"
                      label="Admin Panel"
                      danger
                    />
                    <div style={{ height: '1px', background: '#f3f4f6', margin: '4px 0' }} />
                  </>
                )}

                {!isAdmin && (
                  <>
                    <DropItem onClick={() => { navigate('/dashboard'); setMenuOpen(false); }} icon="📊" label="Dashboard" />
                    <DropItem onClick={() => { navigate('/my-assets'); setMenuOpen(false); }} icon="🏠" label="My Assets" />
                    <DropItem onClick={() => { navigate('/my-requests'); setMenuOpen(false); }} icon="📋" label="My Requests" />
                    <DropItem onClick={() => { navigate('/my-offers'); setMenuOpen(false); }} icon="📬" label="Offers Received" />
                    <DropItem onClick={() => { navigate('/my-offers-made'); setMenuOpen(false); }} icon="🤝" label="Offers Made" />
                    <DropItem onClick={() => { navigate('/bookings'); setMenuOpen(false); }} icon="📅" label="My Bookings" />
                    <DropItem onClick={() => { navigate('/wallet'); setMenuOpen(false); }} icon="💳" label="Wallet" />
                    <div style={{ height: '1px', background: '#f3f4f6', margin: '4px 0' }} />
                  </>
                )}

                <DropItem onClick={() => { navigate('/profile'); setMenuOpen(false); }} icon="👤" label="Profile" />
                <DropItem onClick={handleLogout} icon="🚪" label="Sign out" danger />
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <Link to="/auth" style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#374151'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
            >
              Sign in
            </Link>
            <Link to="/auth" style={{
              padding: '8px 16px',
              background: '#059669',
              border: '1px solid #059669',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#fff',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#047857'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#059669'; }}
            >
              Get started
            </Link>
          </div>
        )}
      </nav>

      {/* Click outside to close dropdown */}
      {menuOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}

function DropItem({ onClick, icon, label, danger }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '9px 12px',
        background: hovered ? (danger ? '#fef2f2' : '#f9fafb') : 'transparent',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
        color: danger ? '#dc2626' : '#374151',
        textAlign: 'left',
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: '16px' }}>{icon}</span>
      {label}
    </button>
  );
}