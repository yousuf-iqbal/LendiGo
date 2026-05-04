import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function AvailableRequestsPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('udhaari_user') || 'null');

  // ── Available Requests State ──
  const [requests, setRequests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [errorAll, setErrorAll] = useState(null);
  const [search, setSearch] = useState('');

  // ── My Requests State ──
  const [myRequests, setMyRequests] = useState([]);
  const [loadingMy, setLoadingMy] = useState(true);
  const [expandedRequest, setExpandedRequest] = useState(null); // which request's offers are shown
  const [offersMap, setOffersMap] = useState({}); // { [requestId]: offer[] }
  const [loadingOffers, setLoadingOffers] = useState({}); // { [requestId]: bool }
  const [processingOffer, setProcessingOffer] = useState(null);

  // ── Active Section Tab ──
  const [activeSection, setActiveSection] = useState('available'); // 'available' | 'mine'

  useEffect(() => {
    fetchAllRequests();
    if (user) fetchMyRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, requests]);

  // ─────────────────────────────────────────────────────────────────────────
  // DATA FETCHING
  // ─────────────────────────────────────────────────────────────────────────

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
    if (offersMap[requestId]) return; // already loaded
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
    // Filter out the logged-in user's own requests from the available feed
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

  // ─────────────────────────────────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────────────────────────────────

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
      // Refresh offers and my requests
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
      // Refresh offers inline
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

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  const statusBadge = (status) => {
    const map = {
      open:      { bg: '#dbeafe', color: '#1e40af' },
      fulfilled: { bg: '#dcfce7', color: '#166534' },
      closed:    { bg: '#f3f4f6', color: '#374151' },
      expired:   { bg: '#fee2e2', color: '#991b1b' },
      pending:   { bg: '#fff7ed', color: '#c2410c' },
      accepted:  { bg: '#dcfce7', color: '#166534' },
      declined:  { bg: '#fee2e2', color: '#991b1b' },
    };
    const s = map[status] || map.open;
    return (
      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, textTransform: 'capitalize', background: s.bg, color: s.color }}>
        {status}
      </span>
    );
  };

  const avatar = (name, pic, size = 40) => (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: pic ? `url(${pic}) center/cover` : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: pic ? 'transparent' : '#fff', fontWeight: 700, fontSize: size * 0.38,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {pic ? '' : name?.[0]?.toUpperCase() || 'U'}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — MY REQUESTS SECTION
  // ─────────────────────────────────────────────────────────────────────────

  const renderMyRequests = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <p style={{ color: '#6b7280', margin: 0 }}>Requests you posted + offers you received</p>
        <button
          onClick={() => navigate('/post-request')}
          style={{ padding: '0.625rem 1.25rem', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 2px 8px rgba(5,150,105,0.3)' }}
        >
          + Post New Request
        </button>
      </div>

      {loadingMy ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading your requests...</div>
      ) : myRequests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📭</div>
          <h3 style={{ color: '#1f2937', fontWeight: 700, marginBottom: '0.5rem' }}>No requests posted yet</h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Post a request and lenders will make offers for you.</p>
          <button onClick={() => navigate('/post-request')} style={{ padding: '0.75rem 2rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>
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
              <div key={req.id} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                {/* Request Header Row */}
                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>{req.title}</h3>
                      {statusBadge(req.status)}
                    </div>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.35rem 0' }}>
                      {req.categoryName || 'Uncategorized'}{req.city ? ` • ${req.city}` : ''}{req.area ? `, ${req.area}` : ''}
                    </p>
                    <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: 0 }}>
                      📅 {new Date(req.startDate).toLocaleDateString()} – {new Date(req.endDate).toLocaleDateString()}
                      &nbsp;&nbsp;💰 Rs. {req.maxBudget?.toLocaleString() || 'Negotiable'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {/* Offer count badge */}
                    <button
                      onClick={() => toggleExpand(req.id)}
                      style={{ padding: '0.5rem 1rem', background: isExpanded ? '#059669' : '#f0fdf4', color: isExpanded ? '#fff' : '#059669', border: `1px solid ${isExpanded ? '#059669' : '#86efac'}`, borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.2s' }}
                    >
                      {isExpanded ? 'Hide Offers' : `${req.offerCount || 0} Offer${req.offerCount !== 1 ? 's' : ''} ▾`}
                    </button>
                    <button onClick={() => navigate(`/edit-request/${req.id}`)} style={{ padding: '0.5rem 1rem', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Edit</button>
                    {req.status === 'open' && (
                      <button onClick={() => handleCloseRequest(req.id)} style={{ padding: '0.5rem 1rem', background: '#fff7ed', color: '#c2410c', border: '1px solid #fdba74', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Close</button>
                    )}
                    <button onClick={() => handleDeleteRequest(req.id)} style={{ padding: '0.5rem 1rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Delete</button>
                  </div>
                </div>

                {/* Expanded Offers Panel */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #f3f4f6', background: '#fafafa', padding: '1.25rem 1.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#374151', marginBottom: '1rem' }}>
                      Offers Received
                    </h4>
                    {isLoadingOffers ? (
                      <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Loading offers...</p>
                    ) : offers.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: '0.9rem' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📬</div>
                        No offers yet. Share your request so lenders can find it!
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                        {offers.map(offer => (
                          <div key={offer.OfferID} style={{
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '1rem 1.25rem',
                            border: offer.Status === 'accepted' ? '2px solid #059669' : '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem'
                          }}>
                            {/* Lender Info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '200px' }}>
                              {avatar(offer.LenderName, offer.LenderPic, 42)}
                              <div>
                                <p style={{ fontWeight: 600, color: '#1f2937', margin: '0 0 0.2rem 0', fontSize: '0.95rem' }}>{offer.LenderName}</p>
                                {offer.Message && (
                                  <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 0.2rem 0', fontStyle: 'italic' }}>"{offer.Message.length > 80 ? offer.Message.substring(0, 80) + '...' : offer.Message}"</p>
                                )}
                                <p style={{ color: '#9ca3af', fontSize: '0.78rem', margin: 0 }}>
                                  {new Date(offer.CreatedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            {/* Price + Status + Actions */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                              <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', margin: 0 }}>Rs. {parseFloat(offer.OfferedPrice).toLocaleString()}</p>
                                <div style={{ marginTop: '0.25rem' }}>{statusBadge(offer.Status)}</div>
                              </div>

                              {offer.Status === 'pending' && req.status === 'open' && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button
                                    onClick={() => handleAcceptOffer(offer.OfferID, req.id)}
                                    disabled={processingOffer === offer.OfferID}
                                    style={{ padding: '0.5rem 1rem', background: processingOffer === offer.OfferID ? '#9ca3af' : '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: processingOffer === offer.OfferID ? 'not-allowed' : 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
                                  >
                                    {processingOffer === offer.OfferID ? 'Processing...' : '✓ Accept'}
                                  </button>
                                  <button
                                    onClick={() => handleRejectOffer(offer.OfferID, req.id)}
                                    disabled={processingOffer === offer.OfferID}
                                    style={{ padding: '0.5rem 1rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '8px', fontWeight: 600, cursor: processingOffer === offer.OfferID ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}
                                  >
                                    ✗ Reject
                                  </button>
                                </div>
                              )}

                              {offer.Status === 'accepted' && (
                                <span style={{ fontSize: '0.875rem', color: '#059669', fontWeight: 600 }}>✓ Accepted</span>
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

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — AVAILABLE REQUESTS SECTION
  // ─────────────────────────────────────────────────────────────────────────

  const renderAvailableRequests = () => (
    <div>
      {/* Search */}
      <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Search requests by title or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }}
          onFocus={(e) => { e.target.style.borderColor = '#059669'; e.target.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.1)'; }}
          onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
        />
      </div>

      {loadingAll ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTop: '4px solid #059669', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Loading requests...
        </div>
      ) : errorAll ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <p style={{ color: '#dc2626', marginBottom: '1.5rem' }}>{errorAll}</p>
          <button onClick={fetchAllRequests} style={{ padding: '0.75rem 2rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>Try Again</button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📭</div>
          <h3 style={{ color: '#1f2937', fontWeight: 700, marginBottom: '0.5rem' }}>No requests found</h3>
          <p style={{ color: '#6b7280' }}>{search ? 'Try different search terms.' : 'No open requests right now — check back soon!'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {filtered.map(req => (
            <div
              key={req.id || req.RequestID}
              style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', transition: 'all 0.25s', cursor: 'pointer' }}
              onClick={() => navigate(`/requests/${req.id || req.RequestID}`)}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.11)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {/* Title + Status */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1f2937', margin: 0, lineHeight: 1.3 }}>{req.title}</h3>
                  {statusBadge(req.status)}
                </div>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0, lineHeight: 1.55 }}>
                  {req.description?.length > 110 ? `${req.description.substring(0, 110)}...` : req.description}
                </p>
              </div>

              {/* Meta grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                <div>
                  <strong style={{ color: '#374151', display: 'block', marginBottom: '0.2rem' }}>Budget</strong>
                  <span style={{ color: '#059669', fontWeight: 700 }}>Rs. {req.maxBudget?.toLocaleString() || 'Negotiable'}</span>
                </div>
                <div>
                  <strong style={{ color: '#374151', display: 'block', marginBottom: '0.2rem' }}>Category</strong>
                  <span style={{ color: '#6b7280' }}>{req.categoryName || 'General'}</span>
                </div>
                <div>
                  <strong style={{ color: '#374151', display: 'block', marginBottom: '0.2rem' }}>Dates</strong>
                  <span style={{ color: '#6b7280' }}>
                    {req.startDate ? new Date(req.startDate).toLocaleDateString() : '—'} – {req.endDate ? new Date(req.endDate).toLocaleDateString() : '—'}
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#374151', display: 'block', marginBottom: '0.2rem' }}>Posted</strong>
                  <span style={{ color: '#6b7280' }}>{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '—'}</span>
                </div>
              </div>

              {/* Poster */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6', marginBottom: '1.25rem' }}>
                {avatar(req.requesterName, req.requesterPic, 38)}
                <div>
                  <span style={{ fontSize: '0.9rem', color: '#374151', fontWeight: 600, display: 'block' }}>{req.requesterName}</span>
                  <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Requester</span>
                </div>
              </div>

              {/* CTA Button — only if request is open */}
              {req.status === 'open' ? (
                <button
                  style={{ width: '100%', padding: '0.75rem', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem', boxShadow: '0 2px 8px rgba(5,150,105,0.2)', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 4px 12px rgba(5,150,105,0.35)'; }}
                  onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 2px 8px rgba(5,150,105,0.2)'; }}
                  onClick={(e) => { e.stopPropagation(); navigate(`/requests/${req.id || req.RequestID}`); }}
                >
                  Make an Offer →
                </button>
              ) : (
                <button
                  style={{ width: '100%', padding: '0.75rem', background: '#f3f4f6', color: '#9ca3af', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'not-allowed', fontSize: '0.95rem' }}
                  disabled
                >
                  Request Closed
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Page Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1f2937', margin: '0 0 0.25rem 0' }}>Requests</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>Browse open requests or manage your own</p>
        </div>

        {/* Section Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: '#fff', padding: '0.375rem', borderRadius: '12px', border: '1px solid #e5e7eb', width: 'fit-content' }}>
          <button
            onClick={() => setActiveSection('available')}
            style={{ padding: '0.625rem 1.5rem', background: activeSection === 'available' ? '#059669' : 'transparent', color: activeSection === 'available' ? '#fff' : '#6b7280', border: 'none', borderRadius: '9px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }}
          >
            Available Requests
          </button>
          {user && (
            <button
              onClick={() => setActiveSection('mine')}
              style={{ padding: '0.625rem 1.5rem', background: activeSection === 'mine' ? '#059669' : 'transparent', color: activeSection === 'mine' ? '#fff' : '#6b7280', border: 'none', borderRadius: '9px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              My Requests
              {myRequests.length > 0 && (
                <span style={{ background: activeSection === 'mine' ? 'rgba(255,255,255,0.3)' : '#059669', color: '#fff', borderRadius: '20px', padding: '1px 8px', fontSize: '0.78rem', fontWeight: 700 }}>
                  {myRequests.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Section Content */}
        {activeSection === 'available' ? renderAvailableRequests() : renderMyRequests()}
      </div>
    </div>
  );
}