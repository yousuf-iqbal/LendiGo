import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function LenderDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await API.get('/dashboard/lender');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading...</div>;
  if (!data) return <div style={{ padding: '100px', textAlign: 'center', color: 'red' }}>Failed to load data</div>;

  const { stats, history, earnings, reviews } = data;

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1f2937', marginBottom: '2rem' }}>Lender Dashboard</h1>
        
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Earnings</p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: '#059669' }}>Rs. {parseFloat(stats.TotalEarned || 0).toLocaleString()}</p>
          </div>
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Completed Rentals</p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: '#1f2937' }}>{stats.CompletedBookings || 0}</p>
          </div>
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Unique Renters</p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: '#1f2937' }}>{stats.UniqueRenters || 0}</p>
          </div>
        </div>

        {/* Earnings by Asset */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem' }}>Top Earning Assets</h2>
          {earnings.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No earnings yet. <button onClick={() => navigate('/my-assets/add')} style={{ color: '#059669', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>List an asset</button></p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {earnings.slice(0, 5).map(e => (
                <div key={e.AssetID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                  <div>
                    <p style={{ fontWeight: 600, color: '#1f2937' }}>{e.AssetTitle}</p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{e.CategoryName || 'Uncategorized'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 700, color: '#059669' }}>Rs. {parseFloat(e.TotalEarned).toLocaleString()}</p>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{e.TotalBookings} bookings</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Rental History */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem' }}>Recent Rentals</h2>
          {history.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No rental history yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {history.slice(0, 5).map(b => (
                <div key={b.BookingID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                  <div>
                    <p style={{ fontWeight: 600, color: '#1f2937' }}>{b.AssetTitle}</p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Rented by {b.RenterName} • {new Date(b.StartDate).toLocaleDateString()}</p>
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
      </div>
    </div>
  );
}