import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check admin role from localStorage immediately — redirect before any fetch
  const storedUser = JSON.parse(localStorage.getItem('udhaari_user') || 'null');
  const userRole = storedUser?.Role || storedUser?.role || 'user';

  useEffect(() => {
    if (userRole === 'admin') {
      navigate('/admin', { replace: true });
      return;
    }
    fetchDashboard();
    const interval = setInterval(() => {
      silentRefreshDashboard();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/dashboard/comprehensive');
      setData(res.data.data || res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const silentRefreshDashboard = async () => {
    try {
      const res = await API.get('/dashboard/comprehensive');
      setData(res.data.data || res.data);
    } catch (err) {
      console.warn('Silent refresh failed:', err.message);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      booking_received: '📅',
      offer_received: '🤝',
      booking_confirmed: '✅',
      payment_received: '💰',
    };
    return icons[type] || '📌';
  };

  const getActivityColor = (type) => {
    const colors = {
      booking_received: '#f59e0b',
      offer_received: '#3b82f6',
      booking_confirmed: '#10b981',
      payment_received: '#059669',
    };
    return colors[type] || '#6b7280';
  };

  const getActivityLabel = (type) => {
    const labels = {
      booking_received: 'Booking Received',
      offer_received: 'Offer Received',
      booking_confirmed: 'Booking Confirmed',
      payment_received: 'Payment Received',
    };
    return labels[type] || 'Activity';
  };

  // If admin, we're redirecting — render nothing
  if (userRole === 'admin') return null;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0fdf4 0%, #f9fafb 100%)' }}>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        `}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', border: '4px solid #e5e7eb', borderTop: '4px solid #059669', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#6b7280', fontSize: '1rem', fontWeight: 500 }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', padding: '2rem', background: 'linear-gradient(135deg, #fef2f2 0%, #f9fafb 100%)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #fee2e2', padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>Unable to Load Dashboard</h3>
            <p style={{ color: '#dc2626', fontSize: '1rem', marginBottom: '2rem' }}>{error}</p>
            <button onClick={fetchDashboard} style={{ padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 16px rgba(5,150,105,0.3)'; }} onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}>
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const activity = data?.activity || [];
  const earnings = data?.earnings || [];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #f8f9fa 50%, #eff6ff 100%)', padding: '2rem 1rem' }}>
      <style>{`
        @keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .dashboard-container > * { animation: slideInUp 0.5s ease-out forwards; }
        .stat-card:hover { box-shadow: 0 12px 32px rgba(5, 150, 105, 0.15); }
      `}</style>
      
      <div style={{ maxWidth: '1600px', margin: '0 auto' }} className="dashboard-container">
        {/* HEADER */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '3.5rem', fontWeight: 900, background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>Dashboard</h1>
              <p style={{ color: '#6b7280', fontSize: '1.1rem', fontWeight: 500 }}>Welcome back, <strong style={{ color: '#059669' }}>{user?.fullName || user?.FullName || 'User'}</strong>! 👋</p>
            </div>
            <button onClick={fetchDashboard} style={{ padding: '0.75rem 1.5rem', background: '#fff', border: '2px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, color: '#6b7280', fontSize: '0.95rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#059669'; e.currentTarget.style.color = '#059669'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; }}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* USER PROFILE BANNER */}
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem', alignItems: 'center', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', padding: '3rem', borderRadius: '20px', color: '#fff', boxShadow: '0 12px 32px rgba(5, 150, 105, 0.25)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '16px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
            {user?.profilePic || user?.ProfilePic ? (
              <img src={user?.profilePic || user?.ProfilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '4rem', fontWeight: 900, color: '#059669' }}>{(user?.fullName || user?.FullName || 'U')[0]?.toUpperCase()}</span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>{user?.fullName || user?.FullName || 'User'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: '2rem', marginTop: '1rem' }}>
              <div>
                <p style={{ opacity: 0.85, fontSize: '0.9rem', marginBottom: '0.25rem' }}>📍 Location</p>
                <p style={{ fontWeight: 700, fontSize: '1rem' }}>{user?.city || user?.City || 'Not specified'}</p>
              </div>
              <div>
                <p style={{ opacity: 0.85, fontSize: '0.9rem', marginBottom: '0.25rem' }}>📧 Email</p>
                <p style={{ fontWeight: 700, fontSize: '1rem', wordBreak: 'break-all' }}>{user?.email || user?.Email || 'N/A'}</p>
              </div>
              <div>
                <p style={{ opacity: 0.85, fontSize: '0.9rem', marginBottom: '0.25rem' }}>📅 Member Since</p>
                <p style={{ fontWeight: 700, fontSize: '1rem' }}>{new Date(user?.createdAt || new Date()).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN STATS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #fff 100%)', padding: '2.5rem', borderRadius: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(5,150,105,0.1)', cursor: 'pointer', transition: 'all 0.3s' }} onClick={() => navigate('/my-assets')} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3.5rem', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', borderRadius: '14px', padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏠</div>
              <span style={{ padding: '0.5rem 1.2rem', background: 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)', color: '#059669', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assets</span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 500 }}>Total Assets Owned</p>
            <p style={{ fontSize: '3rem', fontWeight: 900, color: '#059669', marginBottom: '0.75rem' }}>{stats.TotalAssets || 0}</p>
            <p style={{ color: '#d1d5db', fontSize: '0.9rem' }}>Tap to manage your assets</p>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fff 100%)', padding: '2.5rem', borderRadius: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(217,119,6,0.1)', cursor: 'pointer', transition: 'all 0.3s' }} onClick={() => navigate('/bookings')} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3.5rem', background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)', borderRadius: '14px', padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏳</div>
              <span style={{ padding: '0.5rem 1.2rem', background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)', color: '#d97706', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action</span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 500 }}>Pending Approvals</p>
            <p style={{ fontSize: '3rem', fontWeight: 900, color: '#d97706', marginBottom: '0.75rem' }}>{stats.PendingBookings || 0}</p>
            <p style={{ color: '#d1d5db', fontSize: '0.9rem' }}>Awaiting your decision</p>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #fff 100%)', padding: '2.5rem', borderRadius: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(2,132,199,0.1)', cursor: 'pointer', transition: 'all 0.3s' }} onClick={() => navigate('/my-requests')} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3.5rem', background: 'linear-gradient(135deg, #0284c7 0%, #0891b2 100%)', borderRadius: '14px', padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📋</div>
              <span style={{ padding: '0.5rem 1.2rem', background: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)', color: '#0284c7', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active</span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 500 }}>Active Requests</p>
            <p style={{ fontSize: '3rem', fontWeight: 900, color: '#0284c7', marginBottom: '0.75rem' }}>{stats.ActiveRequests || 0}</p>
            <p style={{ color: '#d1d5db', fontSize: '0.9rem' }}>Browse and manage requests</p>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #fff 100%)', padding: '2.5rem', borderRadius: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(147,51,234,0.1)', cursor: 'pointer', transition: 'all 0.3s' }} onClick={() => navigate('/my-offers-made')} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3.5rem', background: 'linear-gradient(135deg, #9333ea 0%, #a855f7 100%)', borderRadius: '14px', padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🤝</div>
              <span style={{ padding: '0.5rem 1.2rem', background: 'linear-gradient(135deg, #f3e8ff 0%, #faf5ff 100%)', color: '#9333ea', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Offers</span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 500 }}>Pending Offers</p>
            <p style={{ fontSize: '3rem', fontWeight: 900, color: '#9333ea', marginBottom: '0.75rem' }}>{stats.PendingOffers || 0}</p>
            <p style={{ color: '#d1d5db', fontSize: '0.9rem' }}>Offers awaiting response</p>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)', padding: '2.5rem', borderRadius: '18px', boxShadow: '0 8px 24px rgba(22,163,74,0.25)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all 0.3s', color: '#fff' }} onClick={() => navigate('/wallet')} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(22,163,74,0.35)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(22,163,74,0.25)'; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3.5rem', background: 'rgba(255,255,255,0.2)', borderRadius: '14px', padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>💰</div>
              <span style={{ padding: '0.5rem 1.2rem', background: 'rgba(255,255,255,0.25)', color: '#fff', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', backdropFilter: 'blur(10px)' }}>Balance</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 500 }}>Available Balance</p>
            <p style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.75rem' }}>Rs. {(stats.WalletBalance || 0).toLocaleString()}</p>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem' }}>Ready to use</p>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f0fdfa 0%, #fff 100%)', padding: '2.5rem', borderRadius: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(16,185,129,0.1)', cursor: 'pointer', transition: 'all 0.3s' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3.5rem', background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)', borderRadius: '14px', padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✅</div>
              <span style={{ padding: '0.5rem 1.2rem', background: 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)', color: '#16a34a', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Success</span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 500 }}>Completed Bookings</p>
            <p style={{ fontSize: '3rem', fontWeight: 900, color: '#16a34a', marginBottom: '0.75rem' }}>{stats.CompletedBookings || 0}</p>
            <p style={{ color: '#d1d5db', fontSize: '0.9rem' }}>Successfully completed</p>
          </div>
        </div>

        {/* TWO COLUMN: Activity & Earnings */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '2.5rem', marginBottom: '3rem' }}>
          <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '2px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>📌 <span>Recent Activity</span></h3>
              {activity.length > 0 && <span style={{ padding: '0.4rem 1rem', background: '#f0fdf4', color: '#059669', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>{activity.length} events</span>}
            </div>
            {activity.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af' }}>
                <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🌟</p>
                <p style={{ fontSize: '1rem', fontWeight: 500 }}>No activity yet</p>
                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Your recent activities will appear here</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
                {activity.slice(0, 10).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '1rem', padding: '1.2rem', background: '#f9fafb', borderRadius: '12px', borderLeft: `4px solid ${getActivityColor(item.ActivityType)}`, transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.transform = 'translateX(4px)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                    <div style={{ fontSize: '1.75rem', flexShrink: 0, minWidth: '32px' }}>{getActivityIcon(item.ActivityType)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#1f2937', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>{getActivityLabel(item.ActivityType)}</p>
                      <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '0.3rem', whiteSpace: 'normal', wordBreak: 'break-word' }}>{item.Description}</p>
                      <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                        <strong>{item.UserName}</strong> • {new Date(item.Timestamp).toLocaleDateString()} {new Date(item.Timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '2px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>📊 <span>This Year's Earnings</span></h3>
              {earnings.length > 0 && <span style={{ padding: '0.4rem 1rem', background: '#f0fdf4', color: '#059669', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>{earnings.length} months</span>}
            </div>
            {earnings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af' }}>
                <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💸</p>
                <p style={{ fontSize: '1rem', fontWeight: 500 }}>No earnings yet</p>
                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Your earnings will appear as you complete bookings</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', maxHeight: '350px', overflowY: 'auto' }}>
                  {earnings.map((month, idx) => {
                    const maxEarning = Math.max(...earnings.map(e => e.Earnings), 1);
                    const percentage = (month.Earnings / maxEarning) * 100;
                    return (
                      <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', color: '#6b7280', minWidth: '70px', fontWeight: 600 }}>
                          {new Date(month.Month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                        </span>
                        <div style={{ flex: 1, height: '28px', background: '#e5e7eb', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                          <div style={{ height: '100%', width: `${percentage}%`, background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)', transition: 'width 0.5s ease-out', borderRadius: '6px' }} />
                        </div>
                        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1f2937', minWidth: '100px', textAlign: 'right' }}>Rs. {month.Earnings.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 500 }}>💰 Total Earned (All Time)</p>
                  <p style={{ fontSize: '2rem', fontWeight: 900, color: '#059669' }}>Rs. {(stats.TotalEarned || 0).toLocaleString()}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1f2937', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>⚡ <span>Quick Actions</span></h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem' }}>
            <button onClick={() => navigate('/my-assets/add')} style={{ padding: '1.5rem 1rem', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '2px solid #86efac', borderRadius: '12px', color: '#059669', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', fontSize: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(5,150,105,0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <span style={{ fontSize: '1.75rem' }}>➕</span> Add Asset
            </button>
            <button onClick={() => navigate('/post-request')} style={{ padding: '1.5rem 1rem', background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', border: '2px solid #60a5fa', borderRadius: '12px', color: '#0284c7', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', fontSize: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(2,132,199,0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <span style={{ fontSize: '1.75rem' }}>📝</span> Post Request
            </button>
            <button onClick={() => navigate('/bookings')} style={{ padding: '1.5rem 1rem', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '2px solid #fcd34d', borderRadius: '12px', color: '#d97706', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', fontSize: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(217,119,6,0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <span style={{ fontSize: '1.75rem' }}>📅</span> My Bookings
            </button>
            <button onClick={() => navigate('/my-offers-made')} style={{ padding: '1.5rem 1rem', background: 'linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%)', border: '2px solid #d8b4fe', borderRadius: '12px', color: '#9333ea', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', fontSize: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(147,51,234,0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <span style={{ fontSize: '1.75rem' }}>🤝</span> My Offers
            </button>
            <button onClick={() => navigate('/wallet')} style={{ padding: '1.5rem 1rem', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '2px solid #86efac', borderRadius: '12px', color: '#059669', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', fontSize: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(5,150,105,0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <span style={{ fontSize: '1.75rem' }}>💳</span> Wallet
            </button>
            <button onClick={() => navigate('/browse')} style={{ padding: '1.5rem 1rem', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '2px solid #60a5fa', borderRadius: '12px', color: '#0284c7', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', fontSize: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(2,132,199,0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <span style={{ fontSize: '1.75rem' }}>🔍</span> Browse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}