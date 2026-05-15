import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function MyOffersPage() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
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
    if (!window.confirm('Accept this offer? A booking will be created and you\'ll need to wait for the lender\'s confirmation before proceeding to payment.')) return;
    setProcessing(offerId);
    try {
      await API.patch(`/offers/${offerId}/accept`);
      alert('Offer accepted! A booking has been created. The lender will confirm it shortly. You\'ll be able to proceed to payment once confirmed.');
      fetchOffers();
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
      pending: { background: '#FFF3CD', color: '#856404', border: '1px solid #FFDF7E' },
      accepted: { background: '#D1FAE5', color: '#065F46', border: '1px solid #86efac' },
      declined: { background: '#FEE2E2', color: '#991B1B', border: '1px solid #fca5a5' },
      fulfilled: { background: '#DBEAFE', color: '#1E40AF', border: '1px solid #93C5FD' }
    };
    return (
      <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, textTransform: 'capitalize', ...styles[status] }}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.8rem', fontWeight: 700, color: C.textDark, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
              My Offers
            </h1>
            <p style={{ color: C.textMuted }}>Review and manage offers received on your requests</p>
          </div>
          <button onClick={() => navigate('/requests')} className="btn btn-outline">
            ← Back to My Requests
          </button>
        </div>

        {offers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: C.warmWhite, borderRadius: '16px', border: `1px solid ${C.border}` }}>
            <div style={{ width: 64, height: 64, margin: '0 auto 1rem', color: C.textFaint }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 700, color: C.textDark, marginBottom: '0.5rem' }}>
              No offers yet
            </h3>
            <p style={{ color: C.textMuted, marginBottom: '2rem' }}>When lenders make offers on your requests, they'll appear here.</p>
            <button onClick={() => navigate('/requests')} className="btn btn-primary">
              View My Requests
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {offers.map(offer => (
              <div
                key={offer.OfferID}
                className="card"
                style={{ padding: '1.75rem' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = C.saffron;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = C.border;
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: '250px' }}>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.35rem', fontWeight: 700, color: C.textDark, marginBottom: '0.5rem' }}>
                      {offer.RequestTitle}
                    </h3>
                    <p style={{ color: C.textMuted, fontSize: '0.9rem', lineHeight: 1.5 }}>
                      {offer.RequestDescription?.length > 100 ? `${offer.RequestDescription.substring(0, 100)}...` : offer.RequestDescription}
                    </p>
                    
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', marginBottom: '0.75rem', fontSize: '0.85rem', color: C.textDark, fontWeight: 600 }}>
                      <span>📅 Offered Dates:</span>
                      <span>{offer.OfferStartDate ? new Date(offer.OfferStartDate).toLocaleDateString() : offer.RequestStartDate ? new Date(offer.RequestStartDate).toLocaleDateString() : 'N/A'} - {offer.OfferEndDate ? new Date(offer.OfferEndDate).toLocaleDateString() : offer.RequestEndDate ? new Date(offer.RequestEndDate).toLocaleDateString() : 'N/A'}</span>
                    </div>

                    {offer.OfferStartDate && offer.RequestStartDate && (new Date(offer.OfferStartDate).toDateString() !== new Date(offer.RequestStartDate).toDateString() || new Date(offer.OfferEndDate).toDateString() !== new Date(offer.RequestEndDate).toDateString()) && (
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', fontSize: '0.8rem', color: C.textFaint }}>
                        <span>📋 Requested Dates:</span>
                        <span>{new Date(offer.RequestStartDate).toLocaleDateString()} - {new Date(offer.RequestEndDate).toLocaleDateString()}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.85rem', color: C.textMuted }}>
                      <span>💰 Budget: Rs. {offer.MaxBudget?.toLocaleString() || 'Negotiable'}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.75rem', color: C.textFaint, marginBottom: '0.25rem' }}>Offered Price</p>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 800, color: C.maroon }}>
                      Rs. {parseFloat(offer.OfferedPrice).toLocaleString()}
                    </p>
                    {getStatusBadge(offer.Status)}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.5rem', padding: '1rem', background: 'transparent', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                    background: offer.LenderPic ? `url(${offer.LenderPic}) center/cover` : `linear-gradient(135deg, ${C.saffron}, ${C.maroon})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: offer.LenderPic ? 'transparent' : '#fff', fontWeight: 700, fontSize: '1.1rem',
                  }}>
                    {offer.LenderPic ? '' : offer.LenderName?.[0]?.toUpperCase() || 'L'}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: C.textDark, margin: 0 }}>{offer.LenderName}</p>
                    <p style={{ fontSize: '0.8rem', color: C.textFaint, margin: 0 }}>Lender • Offered {new Date(offer.CreatedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {offer.Message && (
                  <div style={{ background: C.saffronPale, padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', borderLeft: `4px solid ${C.saffron}` }}>
                    <p style={{ fontStyle: 'italic', color: C.textDark, margin: 0, fontSize: '0.9rem' }}>"{offer.Message}"</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
                  {offer.Status === 'pending' ? (
                    <>
                      <button 
                        onClick={() => handleAccept(offer.OfferID)} 
                        disabled={processing === offer.OfferID}
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '0.75rem' }}
                      >
                        {processing === offer.OfferID ? 'Processing...' : '✓ Accept Offer'}
                      </button>
                      <button 
                        onClick={() => handleReject(offer.OfferID)} 
                        disabled={processing === offer.OfferID}
                        className="btn-outline"
                        style={{ flex: 1, padding: '0.75rem', background: '#FEF2F2', color: C.maroon, borderColor: '#FCA5A5' }}
                      >
                        ✗ Reject
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => navigate(`/requests/${offer.RequestID}`)}
                      className="btn btn-outline"
                    >
                      View Request Details
                    </button>
                  )}
                  <ChatButton bookingId={offer.BookingID} userId={offer.LenderID} />
                  <button
                    onClick={() => {
                      setSelectedOffer(offer);
                      setShowDisputeModal(true);
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      background: '#f3f4f6',
                      color: '#666',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.85rem',
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
          bookingId={selectedOffer?.BookingID}
          onClose={() => {
            setShowDisputeModal(false);
            setSelectedOffer(null);
          }}
          onSubmitSuccess={() => {
            setShowDisputeModal(false);
            setSelectedOffer(null);
          }}
        />
      )}
    </div>
  );
}