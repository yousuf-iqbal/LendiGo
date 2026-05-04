import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const profilePic = user?.profilePic || user?.ProfilePic || null;
  const fullName = user?.fullName || user?.FullName || '';

  const navLink = (to, label) => (
    <Link
      to={to}
      style={{ color: '#374151', textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem', transition: 'color 0.2s' }}
      onMouseEnter={(e) => e.target.style.color = '#059669'}
      onMouseLeave={(e) => e.target.style.color = '#374151'}
    >
      {label}
    </Link>
  );

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
      flexWrap: 'wrap',
      gap: '1rem',
      minWidth: 0,
    }}>

      {/* Logo */}
      <Link to="/" style={{ color: '#065f46', fontSize: '1.25rem', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1rem', fontWeight: 700 }}>
          L
        </span>
        endigo
      </Link>

      {/* Center Nav Links */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', flex: 1, justifyContent: 'center', minWidth: 0 }}>
        {navLink('/browse', 'Baazar')}
        {navLink('/requests', 'Requests')}

        {!loading && user && (
          <>
            {navLink('/my-assets', 'My Assets')}
            {/* My Requests links to /requests with My Requests tab */}
            {navLink('/bookings', 'Bookings')}
            {navLink('/my-offers-made', 'My Offers Made')}
            {navLink('/dashboard', 'Dashboard')}
          </>
        )}
      </div>

      {/* Right Side */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {!loading && user ? (
          <>
            {/* Profile */}
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065f46', textDecoration: 'none' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%',
                background: profilePic ? `url(${profilePic}) center/cover no-repeat` : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.9rem', fontWeight: 600,
                color: profilePic ? 'transparent' : '#fff',
                border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', flexShrink: 0,
              }}>
                {!profilePic && (fullName?.[0]?.toUpperCase() || 'U')}
              </div>
              <span style={{ color: '#374151', fontSize: '0.9rem', fontWeight: 500 }}>{fullName}</span>
            </Link>

            {/* Wallet */}
            <Link to="/wallet" style={{ padding: '0.5rem 1rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', color: '#065f46', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.target.style.background = '#dcfce7'; e.target.style.borderColor = '#4ade80'; }}
              onMouseLeave={(e) => { e.target.style.background = '#f0fdf4'; e.target.style.borderColor = '#86efac'; }}>
              Wallet
            </Link>

            {/* Logout */}
            <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#dc2626', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.target.style.background = '#fecaca'; }}
              onMouseLeave={(e) => { e.target.style.background = '#fee2e2'; }}>
              Logout
            </button>
          </>
        ) : !loading ? (
          <Link to="/auth" style={{ padding: '0.5rem 1rem', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', border: 'none', borderRadius: '8px', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 4px 12px rgba(5,150,105,0.4)'; }}
            onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}>
            Sign In
          </Link>
        ) : (
          <div style={{ width: '80px', height: '38px', background: '#e5e7eb', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </nav>
  );
}