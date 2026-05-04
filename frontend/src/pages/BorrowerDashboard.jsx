import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function BorrowerDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await API.get('/dashboard/borrower');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading...</div>;
  if (!data) return <div style={{ padding: '100px', textAlign: 'center', color: 'red' }}>Failed to load data</div>;

  const { stats, history, reviews } = data;

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1f2937', marginBottom: '2rem' }}>Borrower Dashboard</h1>
        
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Bookings</p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: '#1f2937' }}>{stats.TotalBookings || 0}</p>
          </div>
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Completed</p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: '#059669' }}>{stats.CompletedBookings || 0}</p>
          </div>
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Spent</p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: '#059669' }}>Rs. {parseFloat(stats.TotalSpent || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Recent Bookings */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem' }}>Recent Bookings</h2>
          {history.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No bookings yet. <button onClick={() => navigate('/browse')} style={{ color: '#059669', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Browse items</button></p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {history.slice(0, 5).map(b => (
                <div key={b.BookingID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                  <div>
                    <p style={{ fontWeight: 600, color: '#1f2937' }}>{b.AssetTitle}</p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{new Date(b.StartDate).toLocaleDateString()} - {new Date(b.EndDate).toLocaleDateString()}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 700, color: '#059669' }}>Rs. {parseFloat(b.TotalPrice).toLocaleString()}</p>
                    <span style={{ 
                      fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '12px',
                      background: b.Status === 'completed' ? '#dcfce7' : b.Status === 'ongoing' ? '#dbeafe' : '#fee2e2',
                      color: b.Status === 'completed' ? '#166534' : b.Status === 'ongoing' ? '#1e40af' : '#991b1b'
                    }}>{b.Status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reviews Received */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem' }}>Reviews You Received</h2>
          {reviews.length === 0 ? (
            <p style={{ color: '#6b7280' }}>Complete bookings to receive reviews.</p>
          ) : (
            reviews.slice(0, 3).map(r => (
              <div key={r.ReviewID} style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600 }}>{r.ReviewerName}</span>
                  <span style={{ color: '#f59e0b' }}>{'⭐'.repeat(r.Rating)}</span>
                </div>
                <p style={{ color: '#374151', fontSize: '0.9rem' }}>"{r.Comment}"</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}