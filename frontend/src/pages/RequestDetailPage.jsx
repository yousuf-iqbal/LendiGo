import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerForm, setOfferForm] = useState({ offeredPrice: '', message: '', assetId: '', startDate: '', endDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('udhaari_user') || 'null');

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/requests/${id}`);
      setRequest(res.data);
    } catch (err) {
      setError('Request not found');
    } finally {
      setLoading(false);
    }
  };

  const handleMakeOffer = async (e) => {
    e.preventDefault();
    if (!offerForm.offeredPrice || parseFloat(offerForm.offeredPrice) <= 0) {
      setError('Please enter a valid offer price');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await API.post('/offers', {
        requestId: parseInt(id, 10),
        assetId: offerForm.assetId || null,
        offeredPrice: parseFloat(offerForm.offeredPrice),
        message: offerForm.message?.trim(),
        startDate: offerForm.startDate || null,
        endDate: offerForm.endDate || null,
      });
      setShowOfferForm(false);
      setOfferForm({ offeredPrice: '', message: '', assetId: '', startDate: '', endDate: '' });
      alert('Offer submitted successfully! The requester will review it in My Requests.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit offer');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (error || !request) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>{error || 'Request not found'}</div>;

  // ✅ Casing-safe requester check (handles both camelCase and PascalCase)
  const currentUserId = user?.UserID ?? user?.id ?? user?.userId ?? user?.userID;
  const requestOwnerId = request.RequesterID ?? request.requesterId;
  const isRequester = user && currentUserId && requestOwnerId && Number(currentUserId) === Number(requestOwnerId);
  const isPending = request.Status === 'open' || request.status === 'open';

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <button onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem', background: 'none', border: 'none', color: '#059669', cursor: 'pointer', fontWeight: 500 }}>← Back</button>

        {/* Request Details Card */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1f2937', marginBottom: '0.5rem' }}>{request.Title || request.title}</h1>
              <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '1rem' }}>{request.Description || request.description}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
                <div><strong style={{ color: '#374151' }}>Dates:</strong><br/>{request.StartDate ? new Date(request.StartDate).toLocaleDateString() : request.startDate ? new Date(request.startDate).toLocaleDateString() : 'N/A'} - {request.EndDate ? new Date(request.EndDate).toLocaleDateString() : request.endDate ? new Date(request.endDate).toLocaleDateString() : 'N/A'}</div>
                <div><strong style={{ color: '#374151' }}>Budget:</strong><br/>Rs. {(request.MaxBudget || request.maxBudget)?.toLocaleString() || 'Negotiable'}</div>
                <div><strong style={{ color: '#374151' }}>Location:</strong><br/>{request.City || request.city}{(request.Area || request.area) ? `, ${request.Area || request.area}` : ''}</div>
                <div><strong style={{ color: '#374151' }}>Posted by:</strong><br/>{request.RequesterName || request.requesterName}</div>
              </div>
            </div>
            <span style={{ padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, background: isPending ? '#dcfce7' : '#f3f4f6', color: isPending ? '#166534' : '#374151' }}>
              {request.Status || request.status}
            </span>
          </div>

          {/* Requester-only notice */}
          {isRequester && (
            <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', borderLeft: '4px solid #059669' }}>
              <p style={{ color: '#166534', margin: 0, fontWeight: 500 }}>
                ✓ This is your request. Manage offers and status from the <strong>My Requests</strong> tab.
              </p>
            </div>
          )}

          {/* Make Offer Form - ONLY for non-requesters when request is open */}
          {!isRequester && isPending && (
            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
              {!showOfferForm ? (
                <button onClick={() => setShowOfferForm(true)} style={{ padding: '0.75rem 1.5rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  + Make an Offer
                </button>
              ) : (
                <form onSubmit={handleMakeOffer} style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem' }}>Submit Your Offer</h3>
                  {error && <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>}
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <input type="number" placeholder="Your Price (Rs)" value={offerForm.offeredPrice} onChange={e => setOfferForm({...offerForm, offeredPrice: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }} required />
                    <input type="text" placeholder="Asset Name (Optional)" value={offerForm.assetId} onChange={e => setOfferForm({...offerForm, assetId: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.25rem', display: 'block', fontWeight: 500 }}>Start Date</label>
                      <input type="date" value={offerForm.startDate} onChange={e => setOfferForm({...offerForm, startDate: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.25rem', display: 'block', fontWeight: 500 }}>End Date</label>
                      <input type="date" value={offerForm.endDate} onChange={e => setOfferForm({...offerForm, endDate: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                    </div>
                  </div>

                  <textarea placeholder="Message to requester..." rows="3" value={offerForm.message} onChange={e => setOfferForm({...offerForm, message: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '1rem' }} />
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button type="submit" disabled={submitting} style={{ flex: 1, padding: '0.75rem', background: submitting ? '#9ca3af' : '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}>Submit Offer</button>
                    <button type="button" onClick={() => setShowOfferForm(false)} style={{ flex: 1, padding: '0.75rem', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* If request is closed or user is requester, show helpful message instead of offer form */}
          {(!isPending || isRequester) && !showOfferForm && (
            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb', textAlign: 'center', color: '#6b7280' }}>
              <p>{isPending ? 'You cannot make an offer on your own request.' : 'This request is no longer open for offers.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}