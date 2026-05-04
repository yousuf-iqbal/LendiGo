import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function PaymentReceiptPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const user = JSON.parse(localStorage.getItem('udhaari_user') || 'null');

  useEffect(() => {
    fetchBookingDetails();
    fetchWallet();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const res = await API.get(`/bookings/${bookingId}`);
      setBooking(res.data);
    } catch (err) {
      console.error('Error fetching booking:', err);
      setError('Booking not found');
    }
  };

  const fetchWallet = async () => {
    try {
      const res = await API.get('/wallet');
      setWallet(res.data);
    } catch (err) {
      console.error('Error fetching wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!booking || !wallet) return;
    
    const totalDue = parseFloat(booking.TotalPrice);
    if (parseFloat(wallet.balance) < totalDue) {
      setError(`Insufficient balance. You need Rs. ${totalDue.toLocaleString()} but have Rs. ${parseFloat(wallet.balance).toLocaleString()}`);
      return;
    }

    setProcessing(true);
    setError('');

    try {
      await API.post('/wallet/pay-booking', {
        bookingID: booking.BookingID,
        amount: totalDue,
      });
      setSuccess(true);
      setTimeout(() => navigate('/bookings'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading receipt...</div>;
  if (error && !booking) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>{error}</div>;
  if (!booking) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Booking not found</div>;

  const days = Math.ceil((new Date(booking.EndDate) - new Date(booking.StartDate)) / (1000 * 60 * 60 * 24));
  const dailyRate = parseFloat(booking.OfferedPrice || booking.TotalPrice / days);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #fff 100%)', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem', background: 'none', border: 'none', color: '#059669', cursor: 'pointer', fontWeight: 500 }}>← Back</button>
        
        {success ? (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '3rem', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1f2937', marginBottom: '0.5rem' }}>Payment Successful!</h1>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Your booking is confirmed.</p>
            <button onClick={() => navigate('/bookings')} style={{ padding: '1rem 2.5rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>View My Bookings</button>
          </div>
        ) : (
          <>
            {/* Receipt Header */}
            <div style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', borderRadius: '16px 16px 0 0', padding: '2rem', color: '#fff' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Payment Receipt</h1>
              <p style={{ opacity: 0.9, margin: '0.5rem 0 0 0' }}>Booking ID: #{booking.BookingID}</p>
            </div>

            {/* Receipt Body */}
            <div style={{ background: '#fff', borderRadius: '0 0 16px 16px', padding: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              {/* Asset & Lender Info */}
              <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '2px solid #e5e7eb' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: '0 0 0.5rem 0' }}>{booking.AssetTitle}</h2>
                <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: '0 0 1rem 0' }}>{booking.CategoryName}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    background: booking.LenderProfilePic ? `url(${booking.LenderProfilePic}) center/cover` : '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: booking.LenderProfilePic ? 'transparent' : '#6b7280',
                    fontWeight: 600
                  }}>
                    {booking.LenderProfilePic ? '' : booking.LenderName?.[0]?.toUpperCase() || 'L'}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: '#1f2937', margin: 0 }}>{booking.LenderName}</p>
                    {booking.LenderPhone && <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>📞 {booking.LenderPhone}</p>}
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem' }}>Booking Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.95rem' }}>
                  <div>
                    <strong style={{ color: '#374151' }}>Rental Period:</strong><br/>
                    {new Date(booking.StartDate).toLocaleDateString()} - {new Date(booking.EndDate).toLocaleDateString()}<br/>
                    <span style={{ color: '#6b7280' }}>({days} day{days > 1 ? 's' : ''})</span>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem' }}>Price Breakdown</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#6b7280' }}>Offered Price</span>
                  <span style={{ fontWeight: 500 }}>Rs. {dailyRate.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '2px solid #e5e7eb', marginTop: '1rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Total Due</span>
                  <span style={{ fontWeight: 800, fontSize: '1.5rem', color: '#059669' }}>Rs. {parseFloat(booking.TotalPrice).toLocaleString()}</span>
                </div>
              </div>

              {/* Wallet Balance */}
              {wallet && (
                <div style={{ background: '#eff6ff', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', border: '1px solid #93c5fd' }}>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#1e40af' }}>
                    <strong>Your Wallet Balance:</strong> Rs. {parseFloat(wallet.balance).toLocaleString()}
                  </p>
                  {parseFloat(wallet.balance) < parseFloat(booking.TotalPrice) && (
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#dc2626' }}>
                      ⚠️ Insufficient balance. Please top up your wallet.
                    </p>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                  {error}
                </div>
              )}

              {/* Payment Button */}
              <button 
                onClick={handlePayment}
                disabled={processing || parseFloat(wallet?.balance || 0) < parseFloat(booking.TotalPrice)}
                style={{ 
                  width: '100%', 
                  padding: '1.25rem', 
                  background: processing || parseFloat(wallet?.balance || 0) < parseFloat(booking.TotalPrice) ? '#9ca3af' : '#059669', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontWeight: 700, 
                  fontSize: '1.1rem',
                  cursor: processing || parseFloat(wallet?.balance || 0) < parseFloat(booking.TotalPrice) ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                {processing ? 'Processing...' : `Pay Rs. ${parseFloat(booking.TotalPrice).toLocaleString()} from Wallet`}
              </button>

              <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.85rem', marginTop: '1rem' }}>
                By proceeding, you agree to our Terms of Service.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}