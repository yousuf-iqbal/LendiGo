// src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <nav style={{
      padding: '1rem 2rem',
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    }}>
      {/* Logo - Left */}
      <Link to="/" style={{
        color: '#065f46',
        fontSize: '1.25rem',
        fontWeight: 800,
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        <span style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '1rem',
          fontWeight: 700,
        }}>
          U
        </span>
        dhaari
      </Link>

      {/* Feature Links - Center */}
      <div style={{ 
        display: 'flex', 
        gap: '2rem',
        alignItems: 'center',
        marginLeft: 'auto',
        marginRight: '2rem',
      }}>
        <Link 
          to="/browse" 
          style={{ 
            color: '#374151', 
            textDecoration: 'none',
            fontWeight: 500,
            fontSize: '0.95rem',
          }}
        >
          Browse
        </Link>
        <Link 
          to="/requests" 
          style={{ 
            color: '#374151', 
            textDecoration: 'none',
            fontWeight: 500,
            fontSize: '0.95rem',
          }}
        >
          Requests
        </Link>
        
        {user && (
          <>
            <Link 
              to="/my-assets" 
              style={{ 
                color: '#374151', 
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '0.95rem',
              }}
            >
              My Assets
            </Link>
            <Link 
              to="/bookings" 
              style={{ 
                color: '#374151', 
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '0.95rem',
              }}
            >
              Bookings
            </Link>
          </>
        )}
      </div>

      {/* Auth Actions - Right */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {user ? (
          <>
            {/* Profile */}
            <Link to="/profile" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#065f46',
              textDecoration: 'none',
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#fff',
              }}>
                {user.fullName?.[0]?.toUpperCase() || user.FullName?.[0]?.toUpperCase() || 'U'}
              </div>
              <span style={{ color: '#374151', fontSize: '0.9rem', fontWeight: 500 }}>
                {user.fullName || user.FullName}
              </span>
            </Link>
            
            {/* Wallet */}
            <Link to="/wallet" style={{
              padding: '0.5rem 1rem',
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '8px',
              color: '#065f46',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}>
              Wallet
            </Link>
            
            {/* Logout */}
            <button onClick={handleLogout} style={{
              padding: '0.5rem 1rem',
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              color: '#dc2626',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/auth" style={{
            padding: '0.5rem 1rem',
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}>
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}