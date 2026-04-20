import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerError, setOfferError] = useState('');
  const [offerSuccess, setOfferSuccess] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('udhaari_user');
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequest(response.data);
      
      const userStr = localStorage.getItem('udhaari_user');
      if (userStr) {
        const currentUser = JSON.parse(userStr);
        const userId = currentUser.UserID || currentUser.id;
        setIsOwner(response.data.requesterId === userId);
      }
    } catch (err) {
      setError('Could not load request');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActionMsg('Request deleted! Redirecting...');
      setTimeout(() => navigate('/requests'), 2000);
    } catch (err) {
      setActionMsg(err.response?.data?.error || 'Could not delete request');
    }
  };

  const handleClose = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/requests/${id}/status`, 
        { status: 'closed' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActionMsg('Request closed');
      fetchRequest();
    } catch (err) {
      setActionMsg(err.response?.data?.error || 'Could not close request');
    }
  };

  const handleOpen = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/requests/${id}/status`, 
        { status: 'open' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActionMsg('Request reopened');
      fetchRequest();
    } catch (err) {
      setActionMsg(err.response?.data?.error || 'Could not reopen request');
    }
  };

  const handleMakeOffer = async () => {
    if (!offerPrice) {
      setOfferError('Please enter a price');
      return;
    }
    
    setOfferLoading(true);
    setOfferError('');
    setOfferSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/offers', {
        requestID: parseInt(id),
        offeredPrice: parseFloat(offerPrice),
        message: offerMessage || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOfferSuccess('Offer submitted successfully!');
      setOfferPrice('');
      setOfferMessage('');
    } catch (err) {
      setOfferError(err.response?.data?.error || 'Could not submit offer');
    } finally {
      setOfferLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '100px', textAlign: 'center' }}>Loading...</div>;
  }

  if (error || !request) {
    return <div style={{ padding: '100px', textAlign: 'center' }}>{error || 'Request not found'}</div>;
  }

  const startDate = request.startDate ? new Date(request.startDate).toLocaleDateString() : 'Not set';
  const endDate = request.endDate ? new Date(request.endDate).toLocaleDateString() : 'Not set';

  return (
    <div style={{ padding: '100px 24px', maxWidth: '800px', margin: '0 auto' }}>
      <button onClick={() => navigate('/requests')} style={{ marginBottom: '20px', padding: '8px 16px', cursor: 'pointer' }}>
        ← Back to Requests
      </button>
      
      {actionMsg && (
        <div style={{ padding: '10px', marginBottom: '20px', background: '#e0f0ff', borderRadius: '8px' }}>
          {actionMsg}
        </div>
      )}
      
      <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
          <h1 style={{ margin: 0 }}>{request.title}</h1>
          <span style={{
            padding: '4px 12px',
            borderRadius: '20px',
            background: request.status === 'open' ? '#e6f7ee' : '#fce8e8',
            color: request.status === 'open' ? '#15803d' : '#dc2626'
          }}>
            {request.status || 'open'}
          </span>
        </div>
        
        <p style={{ color: '#666', marginBottom: '16px' }}>{request.description}</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <strong>Category:</strong> {request.categoryName || 'Uncategorized'}
          </div>
          <div>
            <strong>Max Budget:</strong> {request.maxBudget ? `Rs ${request.maxBudget.toLocaleString()}` : 'Negotiable'}
          </div>
          <div>
            <strong>Dates:</strong> {startDate} → {endDate}
          </div>
          <div>
            <strong>Location:</strong> {request.city || 'Not specified'} {request.area ? `, ${request.area}` : ''}
          </div>
          <div>
            <strong>Requested by:</strong> {request.requesterName}
          </div>
        </div>
        
        {isOwner && request.status === 'open' && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button onClick={handleClose} style={{ padding: '8px 16px', background: '#f0f0f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Close Request
            </button>
            <button onClick={handleDelete} style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Delete Request
            </button>
          </div>
        )}
        
        {isOwner && request.status === 'closed' && (
          <div style={{ marginTop: '16px' }}>
            <button onClick={handleOpen} style={{ padding: '8px 16px', background: '#15803d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Reopen Request
            </button>
          </div>
        )}
      </div>
      
      {!isOwner && request.status === 'open' && (
        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '24px' }}>
          <h2>Make an Offer</h2>
          
          {offerError && <div style={{ color: 'red', marginBottom: '12px' }}>{offerError}</div>}
          {offerSuccess && <div style={{ color: 'green', marginBottom: '12px' }}>{offerSuccess}</div>}
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Your Price (Rs)</label>
            <input
              type="number"
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }}
              value={offerPrice}
              onChange={e => setOfferPrice(e.target.value)}
              placeholder="Enter amount"
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Message (optional)</label>
            <textarea
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px', minHeight: '80px' }}
              value={offerMessage}
              onChange={e => setOfferMessage(e.target.value)}
              placeholder="Tell the requester about your item..."
            />
          </div>
          
          <button 
            onClick={handleMakeOffer} 
            disabled={offerLoading}
            style={{ padding: '12px 24px', background: '#c8f230', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {offerLoading ? 'Submitting...' : 'Submit Offer'}
          </button>
        </div>
      )}
      
      {request.status === 'closed' && !isOwner && (
        <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '24px', background: '#f5f5f5', textAlign: 'center' }}>
          This request is closed and no longer accepting offers.
        </div>
      )}
    </div>
  );
}
