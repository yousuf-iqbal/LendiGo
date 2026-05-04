import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [view, setView] = useState('borrower');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, [view]);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = view === 'borrower' ? '/dashboard/borrower' : '/dashboard/lender';
      const res = await API.get(endpoint);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0fdf4 0%, #fff 100%)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', border: '4px solid #e5e7eb', borderTop: '4px solid #059669', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#059669', fontSize: '1rem', fontWeight: 600 }}>Loading dashboard...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '450px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>Failed to Load Dashboard</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={fetchDashboard} style={{ padding: '0.875rem 2rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#047857'} onMouseLeave={(e) => e.target.style.background = '#059669'}>Try Again</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // ✅ SAFER data extraction with fallbacks
  const stats = data.stats || {};
  const history = data.history || [];
  const reviews = data.reviews || [];
  const earnings = data.earnings || [];

  const getStatusBadge = (status) => {
    const styles = {
      pending: { background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' },
      approved: { background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac' },
      rejected: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' },
      completed: { background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac' },
      cancelled: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' },
      ongoing: { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #93c5fd' },
      available: { background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac' },
      unavailable: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }
    };
    const style = styles[status] || styles.pending;
    return (
      <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, textTransform: 'capitalize', ...style }}>
        {status}
      </span>
    );
  };

  const getAvailabilityBadge = (isActive) => {
    return isActive ? (
      <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <span>✓</span> Available
      </span>
    ) : (
      <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <span>✗</span> Unavailable
      </span>
    );
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  // ✅ SAFER COLOR FUNCTION (Prevents crashes if name is missing)
  const getRandomColor = (name) => {
    if (!name) return '#059669';
    const colors = ['#059669', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #fff 50%, #eff6ff 100%)', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header with Gradient */}
        <div style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)', color: '#fff' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {view === 'borrower' ? '👤 Borrower Dashboard' : '🏪 Lender Dashboard'}
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, margin: '0.5rem 0 0 0' }}>
            {view === 'borrower' ? 'Track your rentals and spending' : 'Monitor your earnings and asset performance'}
          </p>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem', background: '#fff', padding: '0.5rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', width: 'fit-content', margin: '0 auto 2.5rem' }}>
          <button onClick={() => setView('borrower')} style={{ padding: '1rem 2.5rem', background: view === 'borrower' ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'transparent', color: view === 'borrower' ? '#fff' : '#374151', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s', boxShadow: view === 'borrower' ? '0 4px 12px rgba(5, 150, 105, 0.4)' : 'none', fontSize: '1rem' }} onMouseEnter={(e) => { if (view !== 'borrower') e.target.style.background = '#f3f4f6'; }} onMouseLeave={(e) => { if (view !== 'borrower') e.target.style.background = 'transparent'; }}>
            👤 Borrower View
          </button>
          <button onClick={() => setView('lender')} style={{ padding: '1rem 2.5rem', background: view === 'lender' ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'transparent', color: view === 'lender' ? '#fff' : '#374151', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s', boxShadow: view === 'lender' ? '0 4px 12px rgba(5, 150, 105, 0.4)' : 'none', fontSize: '1rem' }} onMouseEnter={(e) => { if (view !== 'lender') e.target.style.background = '#f3f4f6'; }} onMouseLeave={(e) => { if (view !== 'lender') e.target.style.background = 'transparent'; }}>
            🏪 Lender View
          </button>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {view === 'borrower' ? (
            <>
              <button onClick={() => navigate('/browse')} style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s', fontSize: '1rem', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)' }} onMouseEnter={(e) => { e.target.style.transform = 'translateY(-4px)'; e.target.style.boxShadow = '0 8px 20px rgba(5, 150, 105, 0.4)'; }} onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.3)'; }}>🔍 Browse Items</button>
              <button onClick={() => navigate('/bookings')} style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s', fontSize: '1rem', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }} onMouseEnter={(e) => { e.target.style.transform = 'translateY(-4px)'; e.target.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)'; }} onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'; }}>📋 My Bookings</button>
              <button onClick={() => navigate('/requests')} style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s', fontSize: '1rem', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' }} onMouseEnter={(e) => { e.target.style.transform = 'translateY(-4px)'; e.target.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.4)'; }} onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)'; }}>📝 My Requests</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/my-assets/add')} style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s', fontSize: '1rem', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)' }} onMouseEnter={(e) => { e.target.style.transform = 'translateY(-4px)'; e.target.style.boxShadow = '0 8px 20px rgba(5, 150, 105, 0.4)'; }} onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.3)'; }}>➕ Add Asset</button>
              <button onClick={() => navigate('/my-assets')} style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s', fontSize: '1rem', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }} onMouseEnter={(e) => { e.target.style.transform = 'translateY(-4px)'; e.target.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)'; }} onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'; }}>📦 My Assets</button>
              <button onClick={() => navigate('/bookings')} style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s', fontSize: '1rem', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' }} onMouseEnter={(e) => { e.target.style.transform = 'translateY(-4px)'; e.target.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.4)'; }} onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)'; }}>📋 Booking Requests</button>
            </>
          )}
        </div>

        {/* BORROWER DASHBOARD */}
        {view === 'borrower' && (
          <>
            {/* Stats Cards with Enhanced Design */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem', marginBottom: '2.5rem' }}>
              <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '2px solid #e5e7eb', transition: 'all 0.3s' }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-4px)'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <p style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>Total Bookings</p>
                  <span style={{ fontSize: '2.5rem' }}>📦</span>
                </div>
                <p style={{ fontSize: '3rem', fontWeight: 800, color: '#1f2937', margin: '0.5rem 0', lineHeight: 1 }}>{stats?.TotalBookings || 0}</p>
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid #e5e7eb', display: 'flex', gap: '1rem', fontSize: '0.95rem', flexWrap: 'wrap' }}>
                  <span style={{ color: '#15803d', fontWeight: 600 }}>{stats?.CompletedBookings || 0} completed</span>
                  <span style={{ color: '#6b7280' }}>•</span>
                  <span style={{ color: '#1d4ed8', fontWeight: 600 }}>{stats?.OngoingBookings || 0} ongoing</span>
                </div>
              </div>
              
              <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '2px solid #e5e7eb', transition: 'all 0.3s' }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-4px)'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <p style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>Total Spent</p>
                  <span style={{ fontSize: '2.5rem' }}>💰</span>
                </div>
                <p style={{ fontSize: '3rem', fontWeight: 800, color: '#059669', margin: '0.5rem 0', lineHeight: 1 }}>Rs. {parseFloat(stats?.TotalSpent || 0).toLocaleString()}</p>
                <p style={{ fontSize: '0.95rem', color: '#6b7280', marginTop: '1rem', fontWeight: 500 }}>All time spending</p>
              </div>

              <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '2px solid #e5e7eb', transition: 'all 0.3s' }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-4px)'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <p style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>Cancelled</p>
                  <span style={{ fontSize: '2.5rem' }}>❌</span>
                </div>
                <p style={{ fontSize: '3rem', fontWeight: 800, color: '#dc2626', margin: '0.5rem 0', lineHeight: 1 }}>{stats?.CancelledBookings || 0}</p>
                <p style={{ fontSize: '0.95rem', color: '#6b7280', marginTop: '1rem', fontWeight: 500 }}>Cancelled bookings</p>
              </div>
            </div>

            {/* Recent Bookings with Enhanced UI */}
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '2.5rem', border: '2px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>Recent Bookings</h2>
                <button onClick={() => navigate('/bookings')} style={{ color: '#059669', background: 'none', border: '2px solid #059669', padding: '0.625rem 1.5rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.target.style.background = '#059669'; e.target.style.color = '#fff'; }} onMouseLeave={(e) => { e.target.style.background = 'none'; e.target.style.color = '#059669'; }}>View All →</button>
              </div>
              {history?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280', background: 'linear-gradient(135deg, #f0fdf4 0%, #fff 100%)', borderRadius: '12px', border: '2px dashed #86efac' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📭</div>
                  <p style={{ marginBottom: '1.5rem', fontWeight: 600, fontSize: '1.1rem', color: '#374151' }}>No bookings yet</p>
                  <p style={{ marginBottom: '2rem', fontSize: '0.95rem' }}>Start exploring items to rent!</p>
                  <button onClick={() => navigate('/browse')} style={{ padding: '1rem 2.5rem', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)', transition: 'all 0.3s' }} onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.4)'; }} onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.3)'; }}>Browse Items</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  {history?.slice(0, 5).map(b => (
                    <div key={b.BookingID} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1.5rem', alignItems: 'center', padding: '1.5rem', background: '#fff', borderRadius: '12px', border: '2px solid #e5e7eb', transition: 'all 0.3s' }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                      <div>
                        <p style={{ fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem', fontSize: '1.1rem' }}>{b.AssetTitle || 'Unknown Asset'}</p>
                        <p style={{ fontSize: '0.95rem', color: '#6b7280', marginBottom: '0.375rem' }}>
                          <strong style={{ color: '#374151' }}>Dates:</strong> {b.StartDate ? new Date(b.StartDate).toLocaleDateString() : 'N/A'} to {b.EndDate ? new Date(b.EndDate).toLocaleDateString() : 'N/A'}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Lender: {b.LenderName || 'Unknown'}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 700, color: '#059669', marginBottom: '0.75rem', fontSize: '1.25rem' }}>Rs. {parseFloat(b.TotalPrice || 0).toLocaleString()}</p>
                        {getStatusBadge(b.Status)}
                      </div>
                      <button onClick={() => navigate(`/assets/${b.AssetID}`)} style={{ padding: '0.75rem 1.5rem', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, color: '#374151', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.target.style.background = '#e5e7eb'; }} onMouseLeave={(e) => { e.target.style.background = '#f3f4f6'; }}>View Asset</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews Received */}
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '2px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginBottom: '1.5rem' }}>Reviews You Received</h2>
              {reviews?.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '3rem', fontSize: '1rem' }}>Complete bookings to receive reviews.</p>
              ) : (
                reviews?.slice(0, 3).map(r => (
                  <div key={r.ReviewID} style={{ padding: '1.25rem', background: '#f9fafb', borderRadius: '12px', marginBottom: '1rem', border: '2px solid #e5e7eb', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 700, color: '#1f2937', fontSize: '1.05rem' }}>{r.ReviewerName || 'Anonymous'}</span>
                      <span style={{ color: '#f59e0b', fontSize: '1.25rem' }}>{'⭐'.repeat(r.Rating || 0)}</span>
                    </div>
                    <p style={{ color: '#374151', fontSize: '0.95rem', marginBottom: '0.5rem', lineHeight: 1.5 }}>"{r.Comment}"</p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>For: {r.AssetTitle || 'Unknown Asset'}</p>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* LENDER DASHBOARD */}
        {view === 'lender' && (
          <>
            {/* Stats Cards with Enhanced Design */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem', marginBottom: '2.5rem' }}>
              <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '2px solid #e5e7eb', transition: 'all 0.3s' }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-4px)'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <p style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>Total Earnings</p>
                  <span style={{ fontSize: '2.5rem' }}>💵</span>
                </div>
                <p style={{ fontSize: '3rem', fontWeight: 800, color: '#059669', margin: '0.5rem 0', lineHeight: 1 }}>Rs. {parseFloat(stats?.TotalEarned || 0).toLocaleString()}</p>
                <p style={{ fontSize: '0.95rem', color: '#6b7280', marginTop: '1rem', fontWeight: 500 }}>{stats?.CompletedBookings || 0} rentals completed</p>
              </div>
              
              <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '2px solid #e5e7eb', transition: 'all 0.3s' }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-4px)'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <p style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>Active Rentals</p>
                  <span style={{ fontSize: '2.5rem' }}>🔄</span>
                </div>
                <p style={{ fontSize: '3rem', fontWeight: 800, color: '#3b82f6', margin: '0.5rem 0', lineHeight: 1 }}>{stats?.OngoingBookings || 0}</p>
                <p style={{ fontSize: '0.95rem', color: '#6b7280', marginTop: '1rem', fontWeight: 500 }}>Currently ongoing</p>
              </div>

              <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '2px solid #e5e7eb', transition: 'all 0.3s' }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-4px)'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <p style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>Unique Renters</p>
                  <span style={{ fontSize: '2.5rem' }}>👥</span>
                </div>
                <p style={{ fontSize: '3rem', fontWeight: 800, color: '#1f2937', margin: '0.5rem 0', lineHeight: 1 }}>{stats?.UniqueRenters || 0}</p>
                <p style={{ fontSize: '0.95rem', color: '#6b7280', marginTop: '1rem', fontWeight: 500 }}>Total renters served</p>
              </div>
            </div>

            {/* Top Earning Assets with Thumbnails & Availability */}
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '2.5rem', border: '2px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>Your Assets Performance</h2>
                <button onClick={() => navigate('/my-assets')} style={{ color: '#059669', background: 'none', border: '2px solid #059669', padding: '0.625rem 1.5rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.target.style.background = '#059669'; e.target.style.color = '#fff'; }} onMouseLeave={(e) => { e.target.style.background = 'none'; e.target.style.color = '#059669'; }}>Manage Assets →</button>
              </div>
              {earnings?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280', background: 'linear-gradient(135deg, #f0fdf4 0%, #fff 100%)', borderRadius: '12px', border: '2px dashed #86efac' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📦</div>
                  <p style={{ marginBottom: '1.5rem', fontWeight: 600, fontSize: '1.1rem', color: '#374151' }}>No assets listed yet</p>
                  <p style={{ marginBottom: '2rem', fontSize: '0.95rem' }}>Start earning by listing your first asset!</p>
                  <button onClick={() => navigate('/my-assets/add')} style={{ padding: '1rem 2.5rem', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)', transition: 'all 0.3s' }} onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.4)'; }} onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.3)'; }}>List Your First Asset</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  {earnings?.slice(0, 5).map(e => (
                    <div key={e.AssetID} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto', gap: '1.25rem', alignItems: 'center', padding: '1.5rem', background: '#fff', borderRadius: '12px', border: '2px solid #e5e7eb', transition: 'all 0.3s' }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                      <div style={{ width: '80px', height: '80px', background: `linear-gradient(135deg, ${getRandomColor(e.AssetTitle)}20 0%, ${getRandomColor(e.AssetTitle)}40 100%)`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', border: `2px solid ${getRandomColor(e.AssetTitle)}` }}>
                        📦
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, color: '#1f2937', marginBottom: '0.375rem', fontSize: '1.1rem' }}>{e.AssetTitle || 'Unknown Asset'}</p>
                        <p style={{ fontSize: '0.95rem', color: '#6b7280' }}>{e.CategoryName || 'Uncategorized'}</p>
                      </div>
                      <div style={{ textAlign: 'center', minWidth: '80px' }}>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 600 }}>Bookings</p>
                        <p style={{ fontWeight: 700, color: '#1f2937', fontSize: '1.25rem' }}>{e.TotalBookings || 0}</p>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: '120px' }}>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 600 }}>Earnings</p>
                        <p style={{ fontWeight: 700, color: '#059669', fontSize: '1.25rem' }}>Rs. {parseFloat(e.TotalEarned || 0).toLocaleString()}</p>
                      </div>
                      <div>{getAvailabilityBadge(e.IsActive)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Rental History with Avatars */}
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '2px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>Recent Rentals</h2>
                <button onClick={() => navigate('/bookings')} style={{ color: '#059669', background: 'none', border: '2px solid #059669', padding: '0.625rem 1.5rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.target.style.background = '#059669'; e.target.style.color = '#fff'; }} onMouseLeave={(e) => { e.target.style.background = 'none'; e.target.style.color = '#059669'; }}>View All →</button>
              </div>
              {history?.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '3rem', fontSize: '1rem' }}>No rental history yet.</p>
              ) : (
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  {history?.slice(0, 5).map(b => (
                    <div key={b.BookingID} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: '1.25rem', alignItems: 'center', padding: '1.5rem', background: '#fff', borderRadius: '12px', border: '2px solid #e5e7eb', transition: 'all 0.3s' }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: `linear-gradient(135deg, ${getRandomColor(b.RenterName)} 0%, ${getRandomColor(b.RenterName)}cc 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                        {getInitials(b.RenterName)}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, color: '#1f2937', marginBottom: '0.375rem', fontSize: '1.1rem' }}>{b.AssetTitle || 'Unknown Asset'}</p>
                        <p style={{ fontSize: '0.95rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                          <strong style={{ color: '#374151' }}>Rented by:</strong> {b.RenterName || 'Unknown'}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          <strong style={{ color: '#374151' }}>Dates:</strong> {b.StartDate ? new Date(b.StartDate).toLocaleDateString() : 'N/A'} - {b.EndDate ? new Date(b.EndDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 700, color: '#059669', marginBottom: '0.75rem', fontSize: '1.25rem' }}>Rs. {parseFloat(b.TotalPrice || 0).toLocaleString()}</p>
                        {getStatusBadge(b.Status)}
                      </div>
                      <button onClick={() => navigate(`/assets/${b.AssetID}`)} style={{ padding: '0.75rem 1.5rem', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, color: '#374151', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.target.style.background = '#e5e7eb'; }} onMouseLeave={(e) => { e.target.style.background = '#f3f4f6'; }}>View Asset</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}