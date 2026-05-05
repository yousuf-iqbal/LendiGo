import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import '../theme.css';

const C = {
  saffron: "#F4A020", saffronDark: "#E08800", saffronPale: "#FFF0CC",
  maroon: "#800020", maroonL: "#B00030", maroonDeep: "#5C0018",
  brownLight: "#C4956A", cream: "#FDF6EC", warmWhite: "#FFF9F0",
  textDark: "#2C1810", textMuted: "#6B4C3B", textFaint: "#A68070",
  border: "rgba(128,0,32,0.12)", borderS: "rgba(128,0,32,0.25)",
};

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
      pending: { background: '#FFF3CD', color: '#856404', border: '1px solid #FFDF7E' },
      accepted: { background: '#D1FAE5', color: '#065F46', border: '1px solid #86efac' },
      declined: { background: '#FEE2E2', color: '#991B1B', border: '1px solid #fca5a5' },
    };
    return (
      <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, textTransform: 'capitalize', ...styles[status] }}>
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.cream }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.cream, padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', animation: 'fadeUp 0.5s ease both' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ marginBottom: '1rem', background: 'none', border: 'none', color: C.maroon, cursor: 'pointer', fontWeight: 600, fontFamily: "'Outfit', sans-serif", fontSize: '0.9rem' }}
            onMouseEnter={e => e.currentTarget.style.color = C.saffron}
            onMouseLeave={e => e.currentTarget.style.color = C.maroon}
          >
            ← Back
          </button>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.8rem', fontWeight: 700, color: C.textDark, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            My Offers Made
          </h1>
          <p style={{ color: C.textMuted, fontSize: '1rem', fontFamily: "'Outfit', sans-serif" }}>
            Offers you've made to other users' requests
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: C.warmWhite, padding: '4px', borderRadius: '12px', width: 'fit-content', border: `1px solid ${C.border}` }}>
          {['all', 'pending', 'accepted', 'declined'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: '0.65rem 1.4rem',
                background: filterStatus === status ? C.maroon : 'transparent',
                color: filterStatus === status ? '#fff' : C.textMuted,
                border: 'none',
                borderRadius: '9px',
                cursor: 'pointer',
                fontWeight: 600,
                fontFamily: "'Outfit', sans-serif",
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                textTransform: 'capitalize',
              }}
              onMouseEnter={e => {
                if (filterStatus !== status) {
                  e.currentTarget.style.background = 'rgba(128,0,32,0.08)';
                  e.currentTarget.style.color = C.textDark;
                }
              }}
              onMouseLeave={e => {
                if (filterStatus !== status) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = C.textMuted;
                }
              }}
            >
              {status === 'all' ? 'All Offers' : status}
            </button>
          ))}
        </div>

        {/* Offers List */}
        {filteredOffers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: C.warmWhite, borderRadius: '16px', border: `1px solid ${C.border}`, boxShadow: '0 2px 12px rgba(128,0,32,0.06)' }}>
            <div style={{ width: 64, height: 64, margin: '0 auto 1rem', color: C.textFaint }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M22 12v3a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4h-4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4z"/>
              </svg>
            </div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 700, color: C.textDark, marginBottom: '0.5rem' }}>
              {filterStatus === 'all' ? 'No offers yet' : `No ${filterStatus} offers`}
            </h3>
            <p style={{ color: C.textMuted, marginBottom: '2rem' }}>
              {filterStatus === 'all' ? 'Browse requests and make offers to help others!' : 'Check other requests'}
            </p>
            <button
              onClick={() => navigate('/requests')}
              className="btn btn-primary"
            >
              Browse Requests
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {filteredOffers.map(offer => {
              const days = calculateDays(offer.StartDate || offer.RequestStartDate, offer.EndDate || offer.RequestEndDate);
              const pricePerDay = Math.round(offer.OfferedPrice / (days || 1));
              
              return (
                <div
                  key={offer.OfferID}
                  className="card"
                  style={{
                    padding: '1.75rem',
                    transition: 'all 0.28s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = C.saffron;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = C.border;
                  }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.35rem', fontWeight: 700, color: C.textDark, marginBottom: '0.25rem' }}>
                        {offer.RequestTitle}
                      </h3>
                      <p style={{ color: C.textMuted, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        Requested by <strong style={{ color: C.maroon }}>{offer.RequesterName}</strong>
                      </p>
                    </div>
                    {getStatusBadge(offer.Status)}
                  </div>

                  {/* Details Grid */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '1rem', 
                    marginBottom: '1.5rem', 
                    padding: '1rem', 
                    background: C.cream, 
                    borderRadius: '12px', 
                    border: `1px solid ${C.border}`
                  }}>
                    <div>
                      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>
                        Offered Price
                      </p>
                      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 700, color: C.maroon }}>
                        Rs. {offer.OfferedPrice.toLocaleString()}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: C.textFaint }}>({pricePerDay.toLocaleString()}/day)</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>
                        Duration
                      </p>
                      <p style={{ fontWeight: 700, color: C.textDark, fontSize: '0.95rem' }}>
                        {new Date(offer.StartDate || offer.RequestStartDate).toLocaleDateString()} - {new Date(offer.EndDate || offer.RequestEndDate).toLocaleDateString()}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: C.textFaint }}>({days} days)</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>
                        Request Dates
                      </p>
                      <p style={{ fontSize: '0.9rem', color: C.textDark }}>
                        {new Date(offer.RequestStartDate).toLocaleDateString()} - {new Date(offer.RequestEndDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Message */}
                  {offer.Message && (
                    <div style={{ 
                      background: C.saffronPale, 
                      padding: '1rem', 
                      borderRadius: '12px', 
                      marginBottom: '1.5rem', 
                      borderLeft: `4px solid ${C.saffron}` 
                    }}>
                      <p style={{ fontStyle: 'italic', color: C.textDark, margin: 0, fontSize: '0.9rem' }}>
                        "{offer.Message}"
                      </p>
                    </div>
                  )}

                  {/* Timeline */}
                  <div style={{ 
                    padding: '1rem', 
                    background: C.cream, 
                    borderRadius: '12px', 
                    fontSize: '0.85rem', 
                    color: C.textMuted,
                    border: `1px solid ${C.border}`
                  }}>
                    <p style={{ margin: '0.25rem 0' }}>
                      <strong>Offered on:</strong> {new Date(offer.CreatedAt).toLocaleDateString()} at {new Date(offer.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {offer.Status === 'accepted' && (
                      <p style={{ margin: '0.25rem 0', color: '#059669', fontWeight: 600 }}>
                        ✓ Accepted - Booking created
                      </p>
                    )}
                    {offer.Status === 'declined' && (
                      <p style={{ margin: '0.25rem 0', color: C.maroon, fontWeight: 600 }}>
                        ✗ Declined by requester
                      </p>
                    )}
                  </div>

                  {/* Action Button */}
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: `1px solid ${C.border}` }}>
                    <button
                      onClick={() => navigate(`/requests/${offer.RequestID}`)}
                      className="btn btn-outline"
                      style={{ padding: '0.7rem 1.5rem' }}
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