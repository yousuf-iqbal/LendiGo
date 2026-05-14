import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import ChatButton from '../components/ChatButton';
import DisputeModal from '../components/DisputeModal';
import '../theme.css';

const C = {
  saffron: "#F4A020", saffronDark: "#E08800", saffronPale: "#FFF0CC",
  maroon: "#800020", maroonL: "#B00030", maroonDeep: "#5C0018",
  brownLight: "#C4956A", cream: "#FDF6EC", warmWhite: "#FFF9F0",
  textDark: "#2C1810", textMuted: "#6B4C3B", textFaint: "#A68070",
  border: "rgba(128,0,32,0.12)", borderS: "rgba(128,0,32,0.25)",
};

export default function MyRequestsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

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
      setRequests(res.data.data || res.data || []);
    } catch (err) {
      console.error('Failed to load requests:', err);
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
      open: { text: 'Open', color: '#D1FAE5', textColor: '#059669' },
      closed: { text: 'Closed', color: '#F3F4F6', textColor: '#6B7280' },
      expired: { text: 'Expired', color: '#FEE2E2', textColor: '#DC2626' },
    };
    const badge = badges[status?.toLowerCase()] || { text: status, color: '#F3F4F6', textColor: '#6B7280' };
    return (
      <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, background: badge.color, color: badge.textColor }}>
        {badge.text}
      </span>
    );
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.cream }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', padding: '2rem', background: C.cream }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', background: C.warmWhite, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', color: C.textDark, marginBottom: '0.5rem' }}>Unable to Load Requests</h3>
          <p style={{ color: C.maroon, fontSize: '1rem', marginBottom: '2rem' }}>{error}</p>
          <button onClick={fetchRequests} className="btn btn-primary">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.cream, padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.8rem', fontWeight: 700, color: C.textDark, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
              My Requests
            </h1>
            <p style={{ color: C.textMuted, fontSize: '1rem' }}>Items you're looking to borrow</p>
          </div>
          <button onClick={() => navigate('/post-request')} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            + Post New Request
          </button>
        </div>

        {/* Search and Filter */}
        <div style={{ background: C.warmWhite, padding: '1.5rem', borderRadius: '16px', border: `1px solid ${C.border}`, marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="field-input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Requests', count: requests.length },
              { id: 'open', label: 'Open', count: requests.filter(r => r.Status?.toLowerCase() === 'open').length },
              { id: 'closed', label: 'Closed', count: requests.filter(r => r.Status?.toLowerCase() === 'closed').length },
              { id: 'expired', label: 'Expired', count: requests.filter(r => r.Status?.toLowerCase() === 'expired').length },
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={activeFilter === filter.id ? 'btn-primary' : 'btn-ghost'}
                style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {/* Requests Grid */}
        {filteredRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: C.warmWhite, borderRadius: '16px', border: `1px solid ${C.border}` }}>
            <div style={{ width: 64, height: 64, margin: '0 auto 1rem', color: C.textFaint }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 700, color: C.textDark, marginBottom: '0.5rem' }}>
              No Requests Found
            </h3>
            <p style={{ color: C.textMuted, marginBottom: '2rem' }}>
              {searchTerm ? 'Try adjusting your search terms' : 'Start by posting your first request!'}
            </p>
            {!searchTerm && (
              <button onClick={() => navigate('/post-request')} className="btn btn-primary">
                + Post Your First Request
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {filteredRequests.map((request) => (
              <div
                key={request.RequestID}
                className="card"
                style={{ cursor: 'pointer', overflow: 'hidden', transition: 'all 0.3s ease' }}
                onClick={() => navigate(`/request/${request.RequestID}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = C.saffron;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = C.border;
                }}
              >
                {/* Card Header */}
                <div style={{ background: `linear-gradient(135deg, ${getStatusColor(request.Status)} 0%, ${getStatusColor(request.Status)}dd 100%)`, padding: '1.25rem', color: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, fontFamily: "'Cormorant Garamond', serif" }}>
                      {request.Title}
                    </h3>
                    {getStatusBadge(request.Status)}
                  </div>
                  <p style={{ margin: 0, opacity: 0.9, fontSize: '0.8rem' }}>{request.CategoryName || 'General'}</p>
                </div>

                {/* Card Body */}
                <div style={{ padding: '1.25rem' }}>
                  <p style={{ color: C.textMuted, fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {request.Description}
                  </p>

                  {/* Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: `1px solid ${C.border}` }}>
                    <div>
                      <p style={{ color: C.textFaint, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Budget</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: 800, color: C.maroon }}>{formatCurrency(request.BudgetPerDay)}</p>
                      <p style={{ color: C.textFaint, fontSize: '0.7rem' }}>per day</p>
                    </div>
                    <div>
                      <p style={{ color: C.textFaint, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Duration</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: 800, color: C.saffronDark }}>
                        {Math.ceil((new Date(request.EndDate) - new Date(request.StartDate)) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                  </div>

                  {/* Offers Count */}
                  <div style={{ background: C.saffronPale, padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: C.maroon }}>{request.OffersCount || 0}</p>
                    <p style={{ margin: 0, color: C.textMuted, fontSize: '0.75rem', fontWeight: 500 }}>{(request.OffersCount || 0) === 1 ? 'Offer received' : 'Offers received'}</p>
                  </div>

                  {/* Dates */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                    <span style={{ color: C.textFaint }}>📅 {formatDate(request.StartDate)}</span>
                    <span style={{ color: C.textFaint }}>→</span>
                    <span style={{ color: C.textFaint }}>{formatDate(request.EndDate)}</span>
                  </div>

                  <p style={{ color: C.textFaint, fontSize: '0.7rem', margin: 0 }}>
                    Posted {new Date(request.CreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                {/* Card Footer */}
                <div style={{ padding: '1rem', background: C.cream, borderTop: `1px solid ${C.border}`, display: 'grid', gridTemplateColumns: 'auto auto auto', gap: '0.5rem' }}>
                  <button
                    className="btn-outline"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/request/${request.RequestID}`);
                    }}
                  >
                    View Details
                  </button>
                  <button
                    className="btn-ghost"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/request/${request.RequestID}/edit`);
                    }}
                  >
                    Edit Request
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowDisputeModal(true);
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#f3f4f6',
                      color: '#666',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                    }}
                  >
                    Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dispute Modal */}
      {showDisputeModal && (
        <DisputeModal
          bookingId={selectedRequest?.BookingID}
          onClose={() => {
            setShowDisputeModal(false);
            setSelectedRequest(null);
          }}
          onSubmitSuccess={() => {
            setShowDisputeModal(false);
            setSelectedRequest(null);
          }}
        />
      )}
    </div>
  );
}