import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function MyOffersPage() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null); // offerId being processed
  const user = JSON.parse(localStorage.getItem('udhaari_user') || 'null');

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await API.get('/offers/incoming');
      setOffers(res.data);
    } catch (err) {
      console.error('Error fetching offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (offerId) => {
    if (!window.confirm('Accept this offer? This will create a booking and notify the lender to proceed to payment.')) return;
    setProcessing(offerId);
    try {
      const res = await API.patch(`/offers/${offerId}/accept`);
      alert('Offer accepted! The lender can now proceed to payment.');
      navigate(`/bookings/${res.data.bookingId}/payment`); // Redirect to payment receipt
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept offer');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (offerId) => {
    if (!window.confirm('Reject this offer?')) return;
    setProcessing(offerId);
    try {
      await API.patch(`/offers/${offerId}/reject`);
      fetchOffers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject offer');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' },
      accepted: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
      declined: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
      fulfilled: { background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' }
    };
    return (
      <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize', ...styles[status] }}>
        {status}
      </span>
    );
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
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1f2937', marginBottom: '0.5rem' }}>My Offers</h1>
            <p style={{ color: '#6b7280' }}>Review and manage offers received on your requests</p>
          </div>
          <button onClick={() => navigate('/my-requests')} style={{ padding: '0.75rem 1.5rem', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
            ← Back to My Requests
          </button>
        </div>

        {offers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📬</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>No offers yet</h3>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>When lenders make offers on your requests, they'll appear here.</p>
            <button onClick={() => navigate('/my-requests')} style={{ padding: '0.875rem 2rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>
              View My Requests
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {offers.map(offer => (
              <div key={offer.OfferID} style={{ background: '#fff', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: '250px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>{offer.RequestTitle}</h3>
                    <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.5 }}>{offer.RequestDescription?.length > 100 ? `${offer.RequestDescription.substring(0, 100)}...` : offer.RequestDescription}</p>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.9rem', color: '#6b7280' }}>
                      <span>📅 {new Date(offer.StartDate).toLocaleDateString()} - {new Date(offer.EndDate).toLocaleDateString()}</span>
                      <span>💰 Budget: Rs. {offer.MaxBudget?.toLocaleString() || 'Negotiable'}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>Offered Price</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>Rs. {parseFloat(offer.OfferedPrice).toLocaleString()}</p>
                    {getStatusBadge(offer.Status)}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: offer.LenderPic ? `url(${offer.LenderPic}) center/cover` : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: offer.LenderPic ? 'transparent' : '#fff', fontWeight: 600, fontSize: '1.1rem' }}>
                    {offer.LenderPic ? '' : offer.LenderName?.[0]?.toUpperCase() || 'L'}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: '#1f2937', margin: 0 }}>{offer.LenderName}</p>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>Lender • Offered {new Date(offer.CreatedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {offer.Message && (
                  <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', borderLeft: '4px solid #059669' }}>
                    <p style={{ fontStyle: 'italic', color: '#374151', margin: 0 }}>"{offer.Message}"</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
                  {offer.Status === 'pending' ? (
                    <>
                      <button 
                        onClick={() => handleAccept(offer.OfferID)} 
                        disabled={processing === offer.OfferID}
                        style={{ flex: 1, padding: '0.875rem', background: processing === offer.OfferID ? '#9ca3af' : '#059669', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: processing === offer.OfferID ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                      >
                        {processing === offer.OfferID ? 'Processing...' : '✓ Accept & Create Booking'}
                      </button>
                      <button 
                        onClick={() => handleReject(offer.OfferID)} 
                        disabled={processing === offer.OfferID}
                        style={{ flex: 1, padding: '0.875rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '12px', fontWeight: 600, cursor: processing === offer.OfferID ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                      >
                        ✗ Reject
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => navigate(`/requests/${offer.RequestID}`)}
                      style={{ padding: '0.875rem 1.5rem', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      View Request Details
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}