import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function MyRequestsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/requests/my-requests');
      console.log('✅ Requests fetched:', res.data);
      setRequests(res.data.data || res.data || []);
    } catch (err) {
      console.error('❌ Failed to load requests:', err);
      setError(err.response?.data?.error || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesFilter = activeFilter === 'all' || req.Status?.toLowerCase() === activeFilter;
    const matchesSearch = req.Title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.Description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    const colors = {
      open: '#10b981',
      closed: '#6b7280',
      expired: '#dc2626',
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: { text: 'Open', color: '#d1fae5', textColor: '#059669' },
      closed: { text: 'Closed', color: '#f3f4f6', textColor: '#6b7280' },
      expired: { text: 'Expired', color: '#fee2e2', textColor: '#dc2626' },
    };
    return badges[status?.toLowerCase()] || { text: status, color: '#f3f4f6', textColor: '#6b7280' };
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return `Rs. ${(amount || 0).toLocaleString()}`;
  };

  if (loading && requests.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0fdf4 0%, #f9fafb 100%)' }}>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', border: '4px solid #e5e7eb', borderTop: '4px solid #059669', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: '#6b7280', fontSize: '1rem', fontWeight: 500 }}>Loading your requests...</p>
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
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>Unable to Load Requests</h3>
            <p style={{ color: '#dc2626', fontSize: '1rem', marginBottom: '2rem' }}>{error}</p>
            <button onClick={fetchRequests} style={{ padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 16px rgba(5,150,105,0.3)'; }} onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}>
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #f8f9fa 50%, #eff6ff 100%)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 900, background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>My Requests</h1>
            <p style={{ color: '#6b7280', fontSize: '1.1rem', fontWeight: 500 }}>Items you're looking to borrow</p>
          </div>
          <button onClick={() => navigate('/post-request')} style={{ padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 16px rgba(5,150,105,0.3)'; }} onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}>
            📝 Post New Request
          </button>
        </div>

        {/* Search and Filter */}
        <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <input
              type="text"
              placeholder="🔍 Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '0.75rem 1.2rem', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '1rem', transition: 'all 0.2s' }}
              onFocus={(e) => { e.target.style.borderColor = '#059669'; e.target.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: '📋 All Requests', count: requests.length },
              { id: 'open', label: '🟢 Open', count: requests.filter(r => r.Status?.toLowerCase() === 'open').length },
              { id: 'closed', label: '⚫ Closed', count: requests.filter(r => r.Status?.toLowerCase() === 'closed').length },
              { id: 'expired', label: '🔴 Expired', count: requests.filter(r => r.Status?.toLowerCase() === 'expired').length },
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                style={{
                  padding: '0.5rem 1.2rem',
                  background: activeFilter === filter.id ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : '#f3f4f6',
                  color: activeFilter === filter.id ? '#fff' : '#6b7280',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (activeFilter !== filter.id) {
                    e.target.style.background = '#e5e7eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeFilter !== filter.id) {
                    e.target.style.background = '#f3f4f6';
                  }
                }}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {/* Requests Grid */}
        {filteredRequests.length === 0 ? (
          <div style={{ background: '#fff', padding: '4rem 2rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>No Requests Found</h3>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              {searchTerm ? 'Try adjusting your search terms' : 'Start by posting your first request!'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate('/post-request')}
                style={{ padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 16px rgba(5,150,105,0.3)'; }}
                onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
              >
                ➕ Post Your First Request
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
            {filteredRequests.map((request) => (
              <div
                key={request.RequestID}
                onClick={() => navigate(`/request/${request.RequestID}`)}
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.12)';
                  e.currentTarget.style.borderColor = '#059669';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                {/* Card Header */}
                <div style={{ background: `linear-gradient(135deg, ${getStatusColor(request.Status)} 0%, ${getStatusColor(request.Status)}dd 100%)`, padding: '1.5rem', color: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, maxWidth: '80%' }}>{request.Title}</h3>
                    <span style={{ padding: '0.3rem 0.8rem', background: 'rgba(255,255,255,0.3)', color: '#fff', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', backdropFilter: 'blur(10px)' }}>
                      {getStatusBadge(request.Status).text}
                    </span>
                  </div>
                  <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>📌 {request.CategoryName || 'General'}</p>
                </div>

                {/* Card Body */}
                <div style={{ padding: '1.5rem' }}>
                  {/* Description */}
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {request.Description}
                  </p>

                  {/* Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                    <div>
                      <p style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.25rem' }}>Budget</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>{formatCurrency(request.BudgetPerDay)}</p>
                      <p style={{ color: '#d1d5db', fontSize: '0.75rem' }}>per day</p>
                    </div>
                    <div>
                      <p style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.25rem' }}>Duration</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7' }}>
                        {Math.ceil((new Date(request.EndDate) - new Date(request.StartDate)) / (1000 * 60 * 60 * 24))} days
                      </p>
                      <p style={{ color: '#d1d5db', fontSize: '0.75rem' }}>requested</p>
                    </div>
                  </div>

                  {/* Offers Count */}
                  <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '1rem', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>{request.OffersCount || 0}</p>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem', fontWeight: 500 }}>{(request.OffersCount || 0) === 1 ? 'Offer received' : 'Offers received'}</p>
                  </div>

                  {/* Dates */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                    <div>
                      <p style={{ color: '#9ca3af', margin: '0 0 0.25rem 0' }}>📅 Start</p>
                      <p style={{ color: '#1f2937', fontWeight: 600, margin: 0 }}>{formatDate(request.StartDate)}</p>
                    </div>
                    <div>
                      <p style={{ color: '#9ca3af', margin: '0 0 0.25rem 0' }}>📅 End</p>
                      <p style={{ color: '#1f2937', fontWeight: 600, margin: 0 }}>{formatDate(request.EndDate)}</p>
                    </div>
                  </div>

                  {/* Posted Date */}
                  <p style={{ color: '#d1d5db', fontSize: '0.75rem', margin: '1rem 0 0 0' }}>
                    Posted {new Date(request.CreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                {/* Card Footer - Action Buttons */}
                <div style={{ padding: '1rem', background: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/request/${request.RequestID}`);
                    }}
                    style={{
                      padding: '0.6rem 1rem',
                      background: '#fff',
                      border: '2px solid #059669',
                      color: '#059669',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f0fdf4';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fff';
                    }}
                  >
                    👁️ View
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/request/${request.RequestID}/edit`);
                    }}
                    style={{
                      padding: '0.6rem 1rem',
                      background: '#fff',
                      border: '2px solid #0284c7',
                      color: '#0284c7',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#eff6ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fff';
                    }}
                  >
                    ✏️ Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
