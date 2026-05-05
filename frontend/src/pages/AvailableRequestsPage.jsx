import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

// Lendigo Theme Colors
const C = {
  saffron: "#F4A020",
  saffronDark: "#E08800",
  saffronPale: "#FFF0CC",
  maroon: "#800020",
  maroonL: "#B00030",
  maroonDeep: "#5C0018",
  brownLight: "#C4956A",
  cream: "#FDF6EC",
  warmWhite: "#FFF9F0",
  textDark: "#2C1810",
  textMuted: "#6B4C3B",
  textFaint: "#A68070",
  border: "rgba(128,0,32,0.12)",
  borderS: "rgba(128,0,32,0.25)",
};

export default function AvailableRequestsPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('udhaari_user') || 'null');

  const [requests, setRequests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [errorAll, setErrorAll] = useState(null);
  const [search, setSearch] = useState('');

  const [myRequests, setMyRequests] = useState([]);
  const [loadingMy, setLoadingMy] = useState(true);
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [offersMap, setOffersMap] = useState({});
  const [loadingOffers, setLoadingOffers] = useState({});
  const [processingOffer, setProcessingOffer] = useState(null);

  const [activeSection, setActiveSection] = useState('available');

  useEffect(() => {
    fetchAllRequests();
    if (user) fetchMyRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, requests]);

  const fetchAllRequests = async () => {
    setLoadingAll(true);
    setErrorAll(null);
    try {
      const res = await API.get('/requests');
      setRequests(res.data);
      setFiltered(res.data);
    } catch (err) {
      setErrorAll('Failed to load requests. Please try again.');
    } finally {
      setLoadingAll(false);
    }
  };

  const fetchMyRequests = async () => {
    setLoadingMy(true);
    try {
      const res = await API.get('/requests/my');
      setMyRequests(res.data);
    } catch (err) {
      console.error('Error fetching my requests:', err);
    } finally {
      setLoadingMy(false);
    }
  };

  const fetchOffersForRequest = async (requestId) => {
    if (offersMap[requestId]) return;
    setLoadingOffers(prev => ({ ...prev, [requestId]: true }));
    try {
      const res = await API.get(`/offers/request/${requestId}`);
      setOffersMap(prev => ({ ...prev, [requestId]: res.data }));
    } catch (err) {
      console.error('Error fetching offers:', err);
    } finally {
      setLoadingOffers(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const applyFilters = () => {
    let out = requests;
    if (user) {
      const myId = user.UserID || user.id;
      out = out.filter(r => r.requesterId !== myId);
    }
    if (search.trim()) {
      out = out.filter(r =>
        r.title?.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(out);
  };

  const toggleExpand = (requestId) => {
    if (expandedRequest === requestId) {
      setExpandedRequest(null);
    } else {
      setExpandedRequest(requestId);
      fetchOffersForRequest(requestId);
    }
  };

  const handleAcceptOffer = async (offerId, requestId) => {
    if (!window.confirm('Accept this offer? A booking will be created and the lender will be notified to pay.')) return;
    setProcessingOffer(offerId);
    try {
      const res = await API.patch(`/offers/${offerId}/accept`);
      setOffersMap(prev => ({ ...prev, [requestId]: undefined }));
      fetchOffersForRequest(requestId);
      fetchMyRequests();
      navigate(`/bookings/${res.data.bookingId}/payment`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept offer');
    } finally {
      setProcessingOffer(null);
    }
  };

  const handleRejectOffer = async (offerId, requestId) => {
    if (!window.confirm('Reject this offer?')) return;
    setProcessingOffer(offerId);
    try {
      await API.patch(`/offers/${offerId}/reject`);
      setOffersMap(prev => ({ ...prev, [requestId]: undefined }));
      fetchOffersForRequest(requestId);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject offer');
    } finally {
      setProcessingOffer(null);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Delete this request permanently?')) return;
    try {
      await API.delete(`/requests/${requestId}`);
      fetchMyRequests();
      if (expandedRequest === requestId) setExpandedRequest(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete request');
    }
  };

  const handleCloseRequest = async (requestId) => {
    if (!window.confirm('Close this request? It will no longer be visible to lenders.')) return;
    try {
      await API.patch(`/requests/${requestId}/status`, { status: 'closed' });
      fetchMyRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to close request');
    }
  };

  // FIXED navigation - directly using navigate
  const goToRequest = (requestId) => {
    if (requestId) {
      navigate(`/requests/${requestId}`);
    }
  };

  const statusBadge = (status) => {
    const map = {
      open:      { bg: '#D1FAE5', color: '#059669' },
      fulfilled: { bg: '#D1FAE5', color: '#059669' },
      closed:    { bg: '#F3F4F6', color: '#6B7280' },
      expired:   { bg: '#FEE2E2', color: '#991B1B' },
      pending:   { bg: '#FFF3CD', color: '#856404' },
      accepted:  { bg: '#D1FAE5', color: '#059669' },
      declined:  { bg: '#FEE2E2', color: '#991B1B' },
    };
    const s = map[status] || map.open;
    return (
      <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, textTransform: 'capitalize', background: s.bg, color: s.color }}>
        {status}
      </span>
    );
  };

  const avatar = (name, pic, size = 40) => (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: pic ? `url(${pic}) center/cover` : `linear-gradient(135deg, ${C.saffron}, ${C.maroon})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: pic ? 'transparent' : '#fff', fontWeight: 700, fontSize: size * 0.38,
    }}>
      {pic ? '' : name?.[0]?.toUpperCase() || 'U'}
    </div>
  );

  const renderMyRequests = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <p style={{ color: C.textMuted, margin: 0 }}>Requests you posted + offers you received</p>
        <button 
          onClick={() => navigate('/post-request')} 
          style={{ padding: '0.75rem 1.5rem', background: C.maroon, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
        >
          + Post New Request
        </button>
      </div>

      {loadingMy ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ width: '40px', height: '40px', border: `3px solid ${C.border}`, borderTopColor: C.saffron, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: C.textMuted }}>Loading your requests...</p>
        </div>
      ) : myRequests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: C.warmWhite, borderRadius: '16px', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 700, color: C.textDark, marginBottom: '0.5rem' }}>No requests posted yet</h3>
          <p style={{ color: C.textMuted, marginBottom: '1.5rem' }}>Post a request and lenders will make offers for you.</p>
          <button onClick={() => navigate('/post-request')} style={{ padding: '0.75rem 2rem', background: C.maroon, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
            Post Your First Request
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {myRequests.map(req => {
            const isExpanded = expandedRequest === req.id;
            const offers = offersMap[req.id] || [];
            const isLoadingOffers = loadingOffers[req.id];

            return (
              <div key={req.id} style={{ background: C.warmWhite, borderRadius: '16px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 700, color: C.textDark, margin: 0 }}>{req.title}</h3>
                      {statusBadge(req.status)}
                    </div>
                    <p style={{ color: C.textMuted, fontSize: '0.875rem', margin: '0 0 0.35rem 0' }}>
                      {req.categoryName || 'Uncategorized'}{req.city ? ` • ${req.city}` : ''}{req.area ? `, ${req.area}` : ''}
                    </p>
                    <p style={{ color: C.textFaint, fontSize: '0.8rem', margin: 0 }}>
                      📅 {new Date(req.startDate).toLocaleDateString()} – {new Date(req.endDate).toLocaleDateString()}
                      &nbsp;&nbsp;💰 Rs. {req.maxBudget?.toLocaleString() || 'Negotiable'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => toggleExpand(req.id)}
                      style={{ padding: '0.5rem 1rem', background: isExpanded ? C.maroon : 'transparent', color: isExpanded ? '#fff' : C.textMuted, border: `1px solid ${C.border}`, borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
                    >
                      {isExpanded ? 'Hide Offers' : `${req.offerCount || 0} Offer${req.offerCount !== 1 ? 's' : ''} ▾`}
                    </button>
                    <button onClick={() => navigate(`/edit-request/${req.id}`)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', color: C.textMuted }}>Edit</button>
                    {req.status === 'open' && (
                      <button onClick={() => handleCloseRequest(req.id)} style={{ padding: '0.5rem 1rem', background: '#FFF3CD', color: '#856404', border: '1px solid #FFDF7E', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Close</button>
                    )}
                    <button onClick={() => handleDeleteRequest(req.id)} style={{ padding: '0.5rem 1rem', background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Delete</button>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: `1px solid ${C.border}`, background: C.cream, padding: '1.25rem 1.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: C.textDark, marginBottom: '1rem' }}>Offers Received</h4>
                    {isLoadingOffers ? (
                      <p style={{ color: C.textMuted, fontSize: '0.9rem' }}>Loading offers...</p>
                    ) : offers.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: C.textFaint, fontSize: '0.9rem' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📬</div>
                        No offers yet. Share your request so lenders can find it!
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                        {offers.map(offer => (
                          <div key={offer.OfferID} style={{
                            background: C.warmWhite,
                            borderRadius: '12px',
                            padding: '1rem 1.25rem',
                            border: offer.Status === 'accepted' ? `2px solid ${C.maroon}` : `1px solid ${C.border}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '200px' }}>
                              {avatar(offer.LenderName, offer.LenderPic, 42)}
                              <div>
                                <p style={{ fontWeight: 600, color: C.textDark, margin: '0 0 0.2rem 0', fontSize: '0.95rem' }}>{offer.LenderName}</p>
                                {offer.Message && (
                                  <p style={{ color: C.textMuted, fontSize: '0.85rem', margin: '0 0 0.2rem 0', fontStyle: 'italic' }}>"{offer.Message.length > 80 ? offer.Message.substring(0, 80) + '...' : offer.Message}"</p>
                                )}
                                <p style={{ color: C.textFaint, fontSize: '0.78rem', margin: 0 }}>
                                  {new Date(offer.CreatedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                              <div style={{ textAlign: 'right' }}>
                                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 800, color: C.maroon, margin: 0 }}>Rs. {parseFloat(offer.OfferedPrice).toLocaleString()}</p>
                                <div style={{ marginTop: '0.25rem' }}>{statusBadge(offer.Status)}</div>
                              </div>

                              {offer.Status === 'pending' && req.status === 'open' && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button 
                                    onClick={() => handleAcceptOffer(offer.OfferID, req.id)} 
                                    disabled={processingOffer === offer.OfferID}
                                    style={{ padding: '0.5rem 1rem', background: processingOffer === offer.OfferID ? '#9ca3af' : C.maroon, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: processingOffer === offer.OfferID ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}
                                  >
                                    {processingOffer === offer.OfferID ? 'Processing...' : '✓ Accept'}
                                  </button>
                                  <button 
                                    onClick={() => handleRejectOffer(offer.OfferID, req.id)} 
                                    disabled={processingOffer === offer.OfferID}
                                    style={{ padding: '0.5rem 1rem', background: '#FEF2F2', color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
                                  >
                                    ✗ Reject
                                  </button>
                                </div>
                              )}

                              {offer.Status === 'accepted' && (
                                <span style={{ fontSize: '0.875rem', color: C.maroon, fontWeight: 600 }}>✓ Accepted</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderAvailableRequests = () => (
    <div>
      {/* Search Bar */}
      <div style={{ background: C.warmWhite, padding: '1rem', borderRadius: '12px', border: `1px solid ${C.border}`, marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Search requests by title or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: `1px solid ${C.border}`, background: C.cream, fontSize: '0.95rem', outline: 'none' }}
        />
      </div>

      {loadingAll ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ width: '40px', height: '40px', border: `3px solid ${C.border}`, borderTopColor: C.saffron, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: C.textMuted }}>Loading requests...</p>
        </div>
      ) : errorAll ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: C.warmWhite, borderRadius: '16px', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <p style={{ color: C.maroon, marginBottom: '1.5rem' }}>{errorAll}</p>
          <button onClick={fetchAllRequests} style={{ padding: '0.75rem 2rem', background: C.maroon, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Try Again</button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: C.warmWhite, borderRadius: '16px', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 700, color: C.textDark, marginBottom: '0.5rem' }}>No requests found</h3>
          <p style={{ color: C.textMuted }}>{search ? 'Try different search terms.' : 'No open requests right now — check back soon!'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {filtered.map(req => {
            const requestId = req.id || req.RequestID;
            return (
              <div
                key={requestId}
                style={{
                  background: C.warmWhite,
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: `1px solid ${C.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.28s ease',
                }}
                onClick={() => {
                  console.log('Clicked request ID:', requestId);
                  navigate(`/requests/${requestId}`);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = C.saffron;
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(128,0,32,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: '1.15rem', fontWeight: 700, color: C.textDark, margin: 0, lineHeight: 1.3 }}>{req.title}</h3>
                    {statusBadge(req.status)}
                  </div>
                  <p style={{ color: C.textMuted, fontSize: '0.9rem', margin: 0, lineHeight: 1.55 }}>
                    {req.description?.length > 110 ? `${req.description.substring(0, 110)}...` : req.description}
                  </p>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem', padding: '0.75rem', background: C.cream, borderRadius: '12px' }}>
                  <div>
                    <strong style={{ color: C.textDark, display: 'block', marginBottom: '0.2rem', fontSize: '0.7rem' }}>BUDGET</strong>
                    <span style={{ color: C.maroon, fontWeight: 700 }}>Rs. {req.maxBudget?.toLocaleString() || 'Negotiable'}</span>
                  </div>
                  <div>
                    <strong style={{ color: C.textDark, display: 'block', marginBottom: '0.2rem', fontSize: '0.7rem' }}>CATEGORY</strong>
                    <span style={{ color: C.textMuted }}>{req.categoryName || 'General'}</span>
                  </div>
                  <div>
                    <strong style={{ color: C.textDark, display: 'block', marginBottom: '0.2rem', fontSize: '0.7rem' }}>DATES</strong>
                    <span style={{ color: C.textMuted, fontSize: '0.85rem' }}>
                      {req.startDate ? new Date(req.startDate).toLocaleDateString() : '—'} – {req.endDate ? new Date(req.endDate).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: C.textDark, display: 'block', marginBottom: '0.2rem', fontSize: '0.7rem' }}>POSTED</strong>
                    <span style={{ color: C.textMuted, fontSize: '0.85rem' }}>{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '—'}</span>
                  </div>
                </div>

                {/* Requester */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '0.5rem', borderTop: `1px solid ${C.border}`, marginBottom: '1rem' }}>
                  {avatar(req.requesterName, req.requesterPic, 36)}
                  <div>
                    <span style={{ fontSize: '0.85rem', color: C.textDark, fontWeight: 600 }}>{req.requesterName}</span>
                    <span style={{ fontSize: '0.7rem', color: C.textFaint, display: 'block' }}>Requester</span>
                  </div>
                </div>

                {/* Button */}
                <button
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: C.maroon,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s',
                  }}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    navigate(`/requests/${requestId}`);
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = C.maroonL; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = C.maroon; }}
                >
                  Make an Offer →
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.cream, padding: '2rem 1rem' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: '2.8rem', fontWeight: 700, color: C.textDark, letterSpacing: '-0.02em', margin: '0 0 0.25rem 0' }}>Requests</h1>
          <p style={{ color: C.textMuted, margin: 0 }}>Browse open requests or manage your own</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: C.warmWhite, padding: '0.375rem', borderRadius: '12px', border: `1px solid ${C.border}`, width: 'fit-content' }}>
          <button
            onClick={() => setActiveSection('available')}
            style={{
              padding: '0.65rem 1.5rem',
              background: activeSection === 'available' ? C.maroon : 'transparent',
              color: activeSection === 'available' ? '#fff' : C.textMuted,
              border: 'none',
              borderRadius: '9px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s',
            }}
          >
            Available Requests
          </button>
          {user && (
            <button
              onClick={() => setActiveSection('mine')}
              style={{
                padding: '0.65rem 1.5rem',
                background: activeSection === 'mine' ? C.maroon : 'transparent',
                color: activeSection === 'mine' ? '#fff' : C.textMuted,
                border: 'none',
                borderRadius: '9px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              My Requests
              {myRequests.length > 0 && (
                <span style={{ background: activeSection === 'mine' ? 'rgba(255,255,255,0.3)' : C.maroon, color: '#fff', borderRadius: '20px', padding: '1px 8px', fontSize: '0.78rem', fontWeight: 700 }}>
                  {myRequests.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Content */}
        {activeSection === 'available' ? renderAvailableRequests() : renderMyRequests()}
      </div>
    </div>
  );
}