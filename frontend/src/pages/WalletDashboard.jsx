import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
        fetch('/api/wallet/balance', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/wallet/transactions', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      
      if (balRes.ok) {
        const balData = await balRes.json();
        setBalance(parseFloat(balData.balance));
      }
      if (transRes.ok) {
        const transData = await transRes.json();
        setTransactions(transData.transactions);
      }
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
    const res = await fetch('/api/wallet/pay-booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        bookingID: parseInt(bookingID),
        amount: parseFloat(amount)
      })
    });
    
    const data = await res.json();
    if (res.ok) {
      setSuccessMsg('Payment Successful!');
      setShowPayModal(false);
      setBookingID('');
      setAmount('');
      fetchWalletData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      setError(data.error || 'Payment failed');
    }
  } catch (err) {
    setError('Network error');
  } finally {
    setPaying(false);
  }
};

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading Wallet...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          <span style={styles.titlePurple}>Wallet</span> & Payments
        </h1>
        <button style={styles.payBtn} onClick={() => setShowPayModal(true)}>
          + Make Payment
        </button>
      </div>

      {/* Messages */}
      {error && <div style={styles.error}>{error}</div>}
      {successMsg && <div style={styles.success}>{successMsg}</div>}

      {/* Balance Card */}
      <div style={styles.balanceCard}>
        <div style={styles.balanceLabel}>Available Balance</div>
        <div style={styles.balanceAmount}>Rs. {balance?.toFixed(2)}</div>
        <div style={styles.balanceFooter}>
          <span style={styles.lastUpdated}>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Transactions */}
      <div style={styles.transactionsCard}>
        <h3 style={styles.cardTitle}>Transaction History</h3>
        {transactions.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📭</div>
            <p style={styles.emptyText}>No transactions yet</p>
          </div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>From</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.TransactionID} style={styles.tr}>
                    <td style={styles.td}>{t.FromUser || 'System'}</td>
                    <td style={{...styles.td, color: '#4ade80', fontWeight: 600}}>
                      Rs. {parseFloat(t.Amount).toFixed(2)}
                    </td>
                    <td style={styles.td}>
                      {new Date(t.CreatedAt).toLocaleDateString('en-PK')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPayModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPayModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={() => setShowPayModal(false)}>×</button>
            
            <div style={styles.modalHeader}>
              <div style={styles.modalIcon}>💳</div>
              <h2 style={styles.modalTitle}>Make Payment</h2>
              <p style={styles.modalSubtitle}>Enter booking details to pay</p>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Booking ID</label>
                <input
                  style={styles.input}
                  type="number"
                  placeholder="e.g., 101"
                  value={bookingID}
                  onChange={e => setBookingID(e.target.value)}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Amount (Rs.)</label>
                <input
                  style={styles.input}
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>

              {bookingID && amount && (
                <div style={styles.previewBox}>
                  <div style={styles.previewRow}>
                    <span>Booking ID:</span>
                    <strong>#{bookingID}</strong>
                  </div>
                  <div style={styles.previewRow}>
                    <span>Amount:</span>
                    <strong style={{color: '#f87171'}}>Rs. {parseFloat(amount).toFixed(2)}</strong>
                  </div>
                  <div style={styles.previewRow}>
                    <span>Balance After:</span>
                    <strong style={{color: '#4ade80'}}>Rs. {(balance - parseFloat(amount)).toFixed(2)}</strong>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button 
                style={styles.cancelBtn} 
                onClick={() => setShowPayModal(false)}
              >
                Cancel
              </button>
              <button 
                style={{
                  ...styles.payConfirmBtn,
                  opacity: (!bookingID || !amount || paying) ? 0.5 : 1
                }}
                onClick={handlePay}
                disabled={!bookingID || !amount || paying}
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

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
    padding: '40px 20px',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  loading: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f0f1a',
    color: '#fff',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid rgba(139, 92, 246, 0.2)',
    borderTopColor: '#8b5cf6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: '16px',
  },
  loadingText: {
    color: '#a78bfa',
    fontSize: '1rem',
    fontWeight: 500,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    maxWidth: '900px',
    margin: '0 auto 32px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 800,
    color: '#fff',
    margin: 0,
  },
  titlePurple: {
    background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  payBtn: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)',
    transition: 'all 0.2s',
  },
  balanceCard: {
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.05) 100%)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '20px',
    padding: '32px',
    textAlign: 'center',
    marginBottom: '24px',
    maxWidth: '900px',
    margin: '0 auto 24px',
    backdropFilter: 'blur(10px)',
  },
  balanceLabel: {
    color: '#a78bfa',
    fontSize: '0.85rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '12px',
  },
  balanceAmount: {
    fontSize: '3.5rem',
    fontWeight: 800,
    color: '#4ade80',
    margin: '8px 0',
    textShadow: '0 0 40px rgba(74, 222, 128, 0.3)',
  },
  balanceFooter: {
    marginTop: '12px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(139, 92, 246, 0.2)',
  },
  lastUpdated: {
    color: '#6b7280',
    fontSize: '0.85rem',
  },
  transactionsCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '28px',
    maxWidth: '900px',
    margin: '0 auto',
    backdropFilter: 'blur(10px)',
  },
  cardTitle: {
    color: '#fff',
    fontSize: '1.25rem',
    fontWeight: 700,
    margin: '0 0 20px',
    textAlign: 'center',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 20px',
    color: '#6b7280',
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '12px',
    opacity: 0.5,
  },
  emptyText: {
    fontSize: '1rem',
    margin: 0,
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '14px 16px',
    color: '#a78bfa',
    fontSize: '0.8rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '2px solid rgba(139, 92, 246, 0.3)',
  },
  tr: {
    transition: 'background 0.2s',
  },
  td: {
    padding: '16px',
    color: '#e5e7eb',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    fontSize: '0.95rem',
  },
  error: {
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
    padding: '14px 20px',
    borderRadius: '12px',
    marginBottom: '20px',
    maxWidth: '900px',
    margin: '0 auto 20px',
  },
  success: {
    background: 'rgba(74, 222, 128, 0.15)',
    border: '1px solid rgba(74, 222, 128, 0.3)',
    color: '#86efac',
    padding: '14px 20px',
    borderRadius: '12px',
    marginBottom: '20px',
    maxWidth: '900px',
    margin: '0 auto 20px',
    animation: 'slideIn 0.3s ease',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '24px',
    padding: '32px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(139, 92, 246, 0.2)',
    position: 'relative',
    animation: 'modalSlideIn 0.3s ease',
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    color: '#fff',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },
  modalHeader: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  modalIcon: {
    fontSize: '3rem',
    marginBottom: '12px',
  },
  modalTitle: {
    color: '#fff',
    fontSize: '1.75rem',
    fontWeight: 700,
    margin: '0 0 8px',
  },
  modalSubtitle: {
    color: '#9ca3af',
    fontSize: '0.9rem',
    margin: 0,
  },
  modalBody: {
    marginBottom: '24px',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    color: '#a78bfa',
    fontSize: '0.85rem',
    fontWeight: 600,
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
  },
  previewBox: {
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '20px',
  },
  previewRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    color: '#d1d5db',
    fontSize: '0.9rem',
  },
  modalFooter: {
    display: 'flex',
    gap: '12px',
  },
  cancelBtn: {
    flex: 1,
    padding: '14px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  payConfirmBtn: {
    flex: 1,
    padding: '14px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
    transition: 'all 0.2s',
  },
};

// Add CSS animations
const styleEl = document.createElement('style');
styleEl.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes modalSlideIn {
    from { opacity: 0; transform: scale(0.95) translateY(-20px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
`;
document.head.appendChild(styleEl);