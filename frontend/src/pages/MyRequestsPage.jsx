import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

// This page still exists as a standalone route /my-requests
// It redirects users to the Requests page with the My Requests tab active,
// OR you can keep it as a full standalone page — both work.
// This version is a full standalone page with inline offer management.

export default function MyRequestsPage() {
  const navigate = useNavigate();
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [offersMap, setOffersMap] = useState({});
  const [loadingOffers, setLoadingOffers] = useState({});
  const [processingOffer, setProcessingOffer] = useState(null);
  const user = JSON.parse(localStorage.getItem('udhaari_user') || 'null');

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    setLoading(true);
    try {
      const res = await API.get('/requests/my');
      setMyRequests(res.data);
    } catch (err) {
      console.error('Error fetching my requests:', err);
    } finally {
      setLoading(false);
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

  const handleDelete = async (requestId) => {
    if (!window.confirm('Delete this request permanently?')) return;
    try {
      await API.delete(`/requests/${requestId}`);
      fetchMyRequests();
      if (expandedRequest === requestId) setExpandedRequest(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete request');
    }
  };

  const handleClose = async (requestId) => {
    if (!window.confirm('Close this request?')) return;
    try {
      await API.patch(`/requests/${requestId}/status`, { status: 'closed' });
      fetchMyRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to close request');
    }
  };

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
    }}>
      {pic ? '' : name?.[0]?.toUpperCase() || 'U'}
    </div>
  );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTop: '4px solid #059669', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Loading your requests...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1f2937', margin: '0 0 0.25rem 0' }}>My Requests</h1>
            <p style={{ color: '#6b7280', margin: 0 }}>Manage your requests and review incoming offers</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/requests')}
              style={{ padding: '0.625rem 1.25rem', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
            >
              ← Browse Requests
            </button>
            <button
              onClick={() => navigate('/post-request')}
              style={{ padding: '0.625rem 1.25rem', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', boxShadow: '0 2px 8px rgba(5,150,105,0.3)' }}
            >
              + Post New Request
            </button>
          </div>
        </div>

        {/* Empty State */}
        {myRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>No requests yet</h3>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Post a request and lenders in your area will make offers.</p>
            <button onClick={() => navigate('/post-request')} style={{ padding: '0.75rem 2rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>
              Post Your First Request
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {myRequests.map(req => {
              // ✅ Fields come back lowercase from the fixed query
              const isExpanded = expandedRequest === req.id;
              const offers = offersMap[req.id] || [];
              const isLoadingOffers = loadingOffers[req.id];

              return (
                <div key={req.id} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>

                  {/* Request Row */}
                  <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>{req.title}</h3>
                        {statusBadge(req.status)}
                      </div>
                      <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>
                        {req.categoryName || 'Uncategorized'}{req.city ? ` • ${req.city}` : ''}
                      </p>
                      <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: 0 }}>
                        📅 {new Date(req.startDate).toLocaleDateString()} – {new Date(req.endDate).toLocaleDateString()}
                        &nbsp;&nbsp;💰 Rs. {req.maxBudget?.toLocaleString() || 'Negotiable'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => toggleExpand(req.id)}
                        style={{ padding: '0.5rem 1rem', background: isExpanded ? '#059669' : '#f0fdf4', color: isExpanded ? '#fff' : '#059669', border: `1px solid ${isExpanded ? '#059669' : '#86efac'}`, borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.2s' }}
                      >
                        {isExpanded ? 'Hide Offers' : `${req.offerCount || 0} Offer${req.offerCount !== 1 ? 's' : ''} ▾`}
                      </button>
                      <button onClick={() => navigate(`/edit-request/${req.id}`)} style={{ padding: '0.5rem 1rem', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                        Edit
                      </button>
                      {req.status === 'open' && (
                        <button onClick={() => handleClose(req.id)} style={{ padding: '0.5rem 1rem', background: '#fff7ed', color: '#c2410c', border: '1px solid #fdba74', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                          Close
                        </button>
                      )}
                      <button onClick={() => handleDelete(req.id)} style={{ padding: '0.5rem 1rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Offers Panel */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid #f3f4f6', background: '#fafafa', padding: '1.25rem 1.5rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#374151', marginBottom: '1rem' }}>Offers Received</h4>

                      {isLoadingOffers ? (
                        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Loading offers...</p>
                      ) : offers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📬</div>
                          No offers yet for this request.
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
                              {/* Lender */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '180px' }}>
                                {avatar(offer.LenderName, offer.LenderPic, 42)}
                                <div>
                                  <p style={{ fontWeight: 600, color: '#1f2937', margin: '0 0 0.2rem 0', fontSize: '0.95rem' }}>{offer.LenderName}</p>
                                  {offer.Message && (
                                    <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 0.15rem 0', fontStyle: 'italic' }}>
                                      "{offer.Message.length > 80 ? offer.Message.substring(0, 80) + '...' : offer.Message}"
                                    </p>
                                  )}
                                  <p style={{ color: '#9ca3af', fontSize: '0.78rem', margin: 0 }}>{new Date(offer.CreatedAt).toLocaleDateString()}</p>
                                </div>
                              </div>

                              {/* Price + Actions */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ textAlign: 'right' }}>
                                  <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669', margin: '0 0 0.25rem 0' }}>Rs. {parseFloat(offer.OfferedPrice).toLocaleString()}</p>
                                  {statusBadge(offer.Status)}
                                </div>

                                {offer.Status === 'pending' && req.status === 'open' && (
                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                      onClick={() => handleAcceptOffer(offer.OfferID, req.id)}
                                      disabled={processingOffer === offer.OfferID}
                                      style={{ padding: '0.5rem 1rem', background: processingOffer === offer.OfferID ? '#9ca3af' : '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: processingOffer === offer.OfferID ? 'not-allowed' : 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
                                    >
                                      {processingOffer === offer.OfferID ? '...' : '✓ Accept'}
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
    </div>
  );
}