import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const C = {
  saffron: "#F4A020", maroon: "#800020", cream: "#FDF6EC", 
  textDark: "#2C1810", textMuted: "#6B4C3B", border: "rgba(128,0,32,0.12)"
};

const STATUSES = {
  open: { bg: '#FEE2E2', color: '#991B1B', label: 'Open' },
  in_review: { bg: '#FEF3C7', color: '#92400E', label: 'In Review' },
  resolved: { bg: '#DBEAFE', color: '#0C4A6E', label: 'Resolved' },
  closed: { bg: '#E5E7EB', color: '#4B5563', label: 'Closed' }
};

export default function AdminDisputesPage() {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const res = await API.get('/admin/disputes');
      setDisputes(res.data || []);
    } catch (err) {
      setError('Failed to load disputes. This feature requires backend implementation.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDispute = (dispute) => {
    setSelectedDispute(dispute);
    setStatusUpdate(dispute.Status || 'open');
    setNotes(dispute.AdminNotes || '');
  };

  const handleUpdateDispute = async () => {
    if (!selectedDispute) return;

    try {
      await API.put(`/admin/disputes/${selectedDispute.DisputeID}`, {
        status: statusUpdate,
        adminNotes: notes
      });
      setSuccess('Dispute updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchDisputes();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update dispute');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.cream, padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <button onClick={() => navigate('/admin')} style={{ marginBottom: '1.5rem', background: 'none', border: 'none', color: C.maroon, cursor: 'pointer', fontWeight: 600 }}>
          ← Back to Admin Dashboard
        </button>

        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: C.textDark, marginBottom: '2rem' }}>
          Reported Disputes & Complaints
        </h1>

        {error && (
          <div style={{ 
            background: '#FEE2E2', 
            color: C.maroon, 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem',
            borderLeft: `4px solid ${C.maroon}`
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ 
            background: '#D1FAE5', 
            color: '#065F46', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem',
            borderLeft: '4px solid #10B981'
          }}>
            {success}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Loading disputes...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
            {/* Disputes List */}
            <div style={{ 
              background: '#fff',
              borderRadius: '12px',
              border: `1px solid ${C.border}`,
              maxHeight: '600px',
              overflowY: 'auto'
            }}>
              {disputes.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: C.textMuted }}>
                  No disputes reported
                </div>
              ) : (
                disputes.map(dispute => (
                  <div
                    key={dispute.DisputeID}
                    onClick={() => handleSelectDispute(dispute)}
                    style={{
                      padding: '1rem',
                      borderBottom: `1px solid ${C.border}`,
                      cursor: 'pointer',
                      background: selectedDispute?.DisputeID === dispute.DisputeID ? '#f9f9f9' : '#fff',
                      borderLeft: selectedDispute?.DisputeID === dispute.DisputeID ? `4px solid ${C.maroon}` : '4px solid transparent'
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: 600, color: C.textDark, fontSize: '0.9rem' }}>
                      {dispute.Subject}
                    </p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: C.textMuted }}>
                      Booking #{dispute.BookingID}
                    </p>
                    <div style={{ 
                      marginTop: '0.5rem',
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      ...STATUSES[dispute.Status || 'open']
                    }}>
                      {STATUSES[dispute.Status || 'open'].label}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Dispute Details */}
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              border: `1px solid ${C.border}`,
              padding: '2rem',
              minHeight: '600px'
            }}>
              {!selectedDispute ? (
                <div style={{ textAlign: 'center', color: C.textMuted, marginTop: '2rem' }}>
                  Select a dispute to view details
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: `2px solid ${C.border}` }}>
                    <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.3rem', color: C.textDark }}>
                      {selectedDispute.Subject}
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: C.textMuted }}>
                      Booking #{selectedDispute.BookingID} • Category: <strong>{selectedDispute.Category}</strong>
                    </p>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: C.textMuted }}>
                      Reported by: <strong>{selectedDispute.ReporterName}</strong>
                    </p>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Description
                    </label>
                    <p style={{ margin: 0, padding: '1rem', background: C.cream, borderRadius: '8px', color: C.textDark, lineHeight: '1.6' }}>
                      {selectedDispute.Description}
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Update Status
                      </label>
                      <select 
                        value={statusUpdate}
                        onChange={e => setStatusUpdate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          border: `1.5px solid ${C.border}`,
                          fontSize: '0.95rem',
                          fontFamily: "'Outfit', sans-serif"
                        }}
                      >
                        <option value="open">Open</option>
                        <option value="in_review">In Review</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Current Status
                      </label>
                      <div style={{
                        padding: '0.75rem',
                        borderRadius: '8px',
                        ...STATUSES[selectedDispute.Status || 'open']
                      }}>
                        {STATUSES[selectedDispute.Status || 'open'].label}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Admin Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Add resolution notes, evidence, or resolution summary..."
                      style={{
                        width: '100%',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: `1.5px solid ${C.border}`,
                        fontFamily: "'Outfit', sans-serif",
                        minHeight: '120px',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <button
                    onClick={handleUpdateDispute}
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      background: `linear-gradient(135deg, ${C.maroon}, #6B0F1A)`,
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.95rem'
                    }}
                  >
                    Update Dispute
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
