import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function MyOutgoingOffersPage() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await API.get('/offers/my-outgoing');
      setOffers(res.data);
    } catch (err) {
      console.error('Error fetching outgoing offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' },
      accepted: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
      declined: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
    };
    return (
      <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize', ...styles[status] }}>
        {status}
      </span>
    );
  };

  const filteredOffers = filterStatus === 'all' ? offers : offers.filter(o => o.Status === filterStatus);

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ width: '56px', height: '56px', border: '4px solid #e5e7eb', borderTop: '4px solid #059669', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <button onClick={() => navigate(-1)} style={{ marginBottom: '1rem', background: 'none', border: 'none', color: '#059669', cursor: 'pointer', fontWeight: 500 }}>← Back</button>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1f2937', marginBottom: '0.5rem' }}>My Offers Made</h1>
          <p style={{ color: '#6b7280', fontSize: '1rem' }}>Offers you've made to other users' requests</p>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', background: '#fff', padding: '0.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', width: 'fit-content' }}>
          {['all', 'pending', 'accepted', 'declined'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: '0.75rem 1.5rem',
                background: filterStatus === status ? '#059669' : 'transparent',
                color: filterStatus === status ? '#fff' : '#374151',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s',
                textTransform: 'capitalize',
              }}
            >
              {status === 'all' ? 'All Offers' : status}
            </button>
          ))}
        </div>

        {/* Offers List */}
        {filteredOffers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📤</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>
              {filterStatus === 'all' ? 'No offers yet' : `No ${filterStatus} offers`}
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              {filterStatus === 'all' ? 'Browse requests and make offers to help others!' : 'Check other requests'}
            </p>
            <button
              onClick={() => navigate('/requests')}
              style={{
                padding: '0.875rem 2rem',
                background: '#059669',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Browse Requests
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {filteredOffers.map(offer => {
              const days = calculateDays(offer.StartDate || offer.RequestStartDate, offer.EndDate || offer.RequestEndDate);
              const pricePerDay = Math.round(offer.OfferedPrice / (days || 1));
              
              return (
                <div
                  key={offer.OfferID}
                  style={{
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '1.75rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.25rem' }}>{offer.RequestTitle}</h3>
                      <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        Requested by <strong>{offer.RequesterName}</strong>
                      </p>
                    </div>
                    {getStatusBadge(offer.Status)}
                  </div>

                  {/* Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '12px' }}>
                    <div>
                      <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500 }}>Offered Price</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>Rs. {offer.OfferedPrice.toLocaleString()}</p>
                      <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>({pricePerDay.toLocaleString()}/day)</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500 }}>Duration</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>
                        {new Date(offer.StartDate || offer.RequestStartDate).toLocaleDateString()} - {new Date(offer.EndDate || offer.RequestEndDate).toLocaleDateString()}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>({days} days)</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 500 }}>Request Dates</p>
                      <p style={{ fontSize: '0.95rem', color: '#374151' }}>
                        {new Date(offer.RequestStartDate).toLocaleDateString()} - {new Date(offer.RequestEndDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Message */}
                  {offer.Message && (
                    <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', borderLeft: '4px solid #059669' }}>
                      <p style={{ fontStyle: 'italic', color: '#374151', margin: 0, fontSize: '0.9rem' }}>"{offer.Message}"</p>
                    </div>
                  )}

                  {/* Timeline */}
                  <div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '12px', fontSize: '0.85rem', color: '#6b7280' }}>
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Offered on:</strong> {new Date(offer.CreatedAt).toLocaleDateString()} at {new Date(offer.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {offer.Status === 'accepted' && (
                      <p style={{ margin: '0.25rem 0', color: '#166534', fontWeight: 600 }}>
                        ✓ Accepted - Booking created
                      </p>
                    )}
                    {offer.Status === 'declined' && (
                      <p style={{ margin: '0.25rem 0', color: '#991b1b', fontWeight: 600 }}>
                        ✗ Declined by requester
                      </p>
                    )}
                  </div>

                  {/* Action Button */}
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
                    <button
                      onClick={() => navigate(`/requests/${offer.RequestID}`)}
                      style={{
                        padding: '0.875rem 1.5rem',
                        background: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#e5e7eb';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#f3f4f6';
                      }}
                    >
                      View Original Request
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
