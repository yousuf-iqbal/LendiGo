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

const Icons = {
  Wallet: () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4h-4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4z"/><line x1="18" y1="12" x2="18" y2="12.01"/></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Empty: () => <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M21 12v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4h-4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4z"/></svg>,
};

export default function WalletDashboard() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [showPayModal, setShowPayModal] = useState(false);
  const [bookingID, setBookingID] = useState('');
  const [amount, setAmount] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const [balRes, transRes] = await Promise.all([
        API.get('/wallet/balance'),
        API.get('/wallet/transactions')
      ]);
      
      setBalance(parseFloat(balRes.data.balance));
      setTransactions(transRes.data.transactions || []);
    } catch (err) {
      setError('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    setPaying(true);
    setError('');
    try {
      const res = await API.post('/wallet/pay-booking', {
        bookingID: parseInt(bookingID),
        amount: parseFloat(amount)
      });
      
      setSuccessMsg('Payment Successful!');
      setShowPayModal(false);
      setBookingID('');
      setAmount('');
      fetchWalletData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed');
    } finally {
      setPaying(false);
    }
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
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.8rem', fontWeight: 700, color: C.textDark, letterSpacing: '-0.02em', margin: 0 }}>
              <span style={{ color: C.maroon }}>Wallet</span> & Payments
            </h1>
            <p style={{ color: C.textMuted, marginTop: '0.25rem' }}>Manage your funds and transactions</p>
          </div>
          <button onClick={() => setShowPayModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icons.Plus /> Make Payment
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div style={{ background: '#FEE2E2', color: C.maroon, padding: '1rem', borderRadius: '12px', marginBottom: '1rem', borderLeft: `4px solid ${C.maroon}` }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div style={{ background: '#D1FAE5', color: '#065F46', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', borderLeft: `4px solid #059669` }}>
            ✓ {successMsg}
          </div>
        )}

        {/* Balance Card */}
        <div style={{ 
          background: `linear-gradient(135deg, ${C.maroon} 0%, ${C.maroonDeep} 100%)`, 
          borderRadius: '24px', 
          padding: '2rem', 
          marginBottom: '2rem',
          boxShadow: '0 8px 32px rgba(128,0,32,0.25)'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            Available Balance
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '4rem', fontWeight: 800, color: C.saffron, margin: 0, textShadow: '0 0 20px rgba(244,160,32,0.3)' }}>
            Rs. {balance?.toFixed(2)}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* Transactions */}
        <div style={{ background: C.warmWhite, borderRadius: '20px', padding: '1.5rem', border: `1px solid ${C.border}` }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.35rem', fontWeight: 700, color: C.textDark, marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: `1px solid ${C.border}` }}>
            Transaction History
          </h3>
          
          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: C.textFaint }}>
              <div style={{ width: 64, height: 64, margin: '0 auto 1rem' }}><Icons.Empty /></div>
              <p>No transactions yet</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: C.textFaint, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${C.border}` }}>From</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: C.textFaint, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${C.border}` }}>Amount</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: C.textFaint, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${C.border}` }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.TransactionID} style={{ transition: 'background 0.2s' }}>
                      <td style={{ padding: '12px 16px', color: C.textDark, borderBottom: `1px solid ${C.border}` }}>{t.FromUser || 'System'}</td>
                      <td style={{ padding: '12px 16px', color: '#059669', fontWeight: 600, borderBottom: `1px solid ${C.border}` }}>
                        Rs. {parseFloat(t.Amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', color: C.textMuted, fontSize: '0.85rem', borderBottom: `1px solid ${C.border}` }}>
                        {new Date(t.CreatedAt).toLocaleDateString('en-PK')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPayModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
 backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }} onClick={() => setShowPayModal(false)}>
          <div style={{
            background: C.warmWhite,
            borderRadius: '24px',
            maxWidth: '480px',
            width: '100%',
            padding: '1.5rem',
            border: `1px solid ${C.border}`,
            boxShadow: '0 20px 40px rgba(128,0,32,0.2)',
            animation: 'scaleIn 0.3s ease',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 700, color: C.textDark, margin: 0 }}>Make Payment</h2>
              <button onClick={() => setShowPayModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted }}>
                <Icons.Close />
              </button>
            </div>
            <p style={{ color: C.textMuted, fontSize: '0.9rem', marginBottom: '1.5rem' }}>Enter booking details to pay</p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>Booking ID</label>
              <input
                type="number"
                placeholder="e.g., 101"
                value={bookingID}
                onChange={e => setBookingID(e.target.value)}
                className="field-input"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>Amount (Rs.)</label>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="field-input"
                style={{ width: '100%' }}
              />
            </div>

            {bookingID && amount && balance && (
              <div style={{ background: C.cream, borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ color: C.textMuted }}>Booking ID:</span>
                  <strong style={{ color: C.textDark }}>#{bookingID}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ color: C.textMuted }}>Amount:</span>
                  <strong style={{ color: C.maroon }}>Rs. {parseFloat(amount).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${C.border}` }}>
                  <span style={{ color: C.textMuted }}>Balance After:</span>
                  <strong style={{ color: '#059669' }}>Rs. {(balance - parseFloat(amount)).toFixed(2)}</strong>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowPayModal(false)} className="btn-outline" style={{ flex: 1, padding: '0.85rem' }}>
                Cancel
              </button>
              <button 
                onClick={handlePay}
                disabled={!bookingID || !amount || paying}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.85rem', opacity: (!bookingID || !amount || paying) ? 0.6 : 1 }}
              >
                {paying ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}