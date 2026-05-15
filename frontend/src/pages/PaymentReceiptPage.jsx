import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Back: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Check: () => <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 6-6"/></svg>,
  Phone: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
};

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

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
      <div className="spinner" />
    </div>
  );
  
  if (error && !booking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.maroon, background: 'transparent' }}>
      {error}
    </div>
  );
  
  if (!booking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted, background: 'transparent' }}>
      Booking not found
    </div>
  );

  const daysInclusive = Math.ceil((new Date(booking.EndDate) - new Date(booking.StartDate)) / (1000 * 60 * 60 * 24)) + 1;
  const dailyRate = parseFloat(booking.TotalPrice / daysInclusive);

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ marginBottom: '1.5rem', background: 'none', border: 'none', color: C.maroon, cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}
          onMouseEnter={e => e.currentTarget.style.color = C.saffron}
          onMouseLeave={e => e.currentTarget.style.color = C.maroon}
        >
          <Icons.Back /> Back
        </button>
        
        {success ? (
          <div style={{ background: C.warmWhite, borderRadius: '20px', padding: '3rem', textAlign: 'center', border: `1px solid ${C.border}`, boxShadow: '0 4px 20px rgba(128,0,32,0.08)' }}>
            <div style={{ width: 80, height: 80, margin: '0 auto 1rem', color: '#059669' }}><Icons.Check /></div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.5rem', fontWeight: 700, color: C.textDark, marginBottom: '0.5rem' }}>Payment Successful!</h1>
            <p style={{ color: C.textMuted, marginBottom: '2rem' }}>Your booking is confirmed.</p>
            <button onClick={() => navigate('/bookings')} className="btn btn-primary" style={{ padding: '1rem 2.5rem' }}>
              View My Bookings
            </button>
          </div>
        ) : (
          <>
            <div style={{ background: `linear-gradient(135deg, ${C.maroon} 0%, ${C.maroonDeep} 100%)`, borderRadius: '20px 20px 0 0', padding: '2rem', color: '#fff' }}>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Payment Receipt</h1>
              <p style={{ opacity: 0.8, margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Booking ID: #{booking.BookingID}</p>
            </div>

            <div style={{ background: C.warmWhite, borderRadius: '0 0 20px 20px', padding: '2rem', border: `1px solid ${C.border}`, borderTop: 'none', boxShadow: '0 4px 20px rgba(128,0,32,0.08)' }}>
              {/* Asset & Lender Info */}
              <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: `1px solid ${C.border}` }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 700, color: C.textDark, margin: '0 0 0.5rem 0' }}>{booking.AssetTitle}</h2>
                <p style={{ color: C.textMuted, fontSize: '0.9rem', margin: '0 0 1rem 0' }}>{booking.CategoryName}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ 
                    width: '44px', 
                    height: '44px', 
                    borderRadius: '50%', 
                    background: booking.LenderProfilePic ? `url(${booking.LenderProfilePic}) center/cover` : `linear-gradient(135deg, ${C.saffron}, ${C.maroon})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1rem'
                  }}>
                    {booking.LenderProfilePic ? '' : booking.LenderName?.[0]?.toUpperCase() || 'L'}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: C.textDark, margin: 0 }}>{booking.LenderName}</p>
                    {booking.LenderPhone && (
                      <p style={{ fontSize: '0.8rem', color: C.textFaint, margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icons.Phone /> {booking.LenderPhone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.25rem', fontWeight: 700, color: C.textDark, marginBottom: '1rem' }}>Booking Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.95rem' }}>
                  <div style={{ background: 'transparent', padding: '1rem', borderRadius: '12px' }}>
                    <strong style={{ color: C.textDark }}>Rental Period:</strong><br/>
                    {new Date(booking.StartDate).toLocaleDateString()} - {new Date(booking.EndDate).toLocaleDateString()}<br/>
                    <span style={{ color: C.textFaint, fontSize: '0.8rem' }}>({daysInclusive} day{daysInclusive > 1 ? 's' : ''})</span>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div style={{ background: 'transparent', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.25rem', fontWeight: 700, color: C.textDark, marginBottom: '1rem' }}>Price Breakdown</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: C.textMuted }}>Offered Price</span>
                  <span style={{ fontWeight: 500 }}>Rs. {dailyRate.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: C.textMuted }}>Number of Days</span>
                  <span style={{ fontWeight: 500 }}>{daysInclusive} day{daysInclusive > 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', borderTop: `2px solid ${C.border}`, marginTop: '1rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: C.textDark }}>Total Due</span>
                  <span style={{ fontWeight: 800, fontSize: '1.5rem', color: C.maroon }}>Rs. {parseFloat(booking.TotalPrice).toLocaleString()}</span>
                </div>
              </div>

              {/* Wallet Balance */}
              {wallet && (
                <div style={{ background: C.saffronPale, borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', border: `1px solid ${C.saffron}` }}>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: C.textDark }}>
                    <strong>Your Wallet Balance:</strong> Rs. {parseFloat(wallet.balance).toLocaleString()}
                  </p>
                  {parseFloat(wallet.balance) < parseFloat(booking.TotalPrice) && (
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: C.maroon }}>
                      ⚠️ Insufficient balance. Please top up your wallet.
                    </p>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div style={{ background: '#FEE2E2', color: C.maroon, padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', borderLeft: `4px solid ${C.maroon}` }}>
                  {error}
                </div>
              )}

              {/* Payment Button */}
              <button 
                onClick={handlePayment}
                disabled={processing || parseFloat(wallet?.balance || 0) < parseFloat(booking.TotalPrice)}
                className="btn btn-primary"
                style={{ 
                  width: '100%', 
                  padding: '1.25rem', 
                  fontSize: '1.1rem',
                  opacity: processing || parseFloat(wallet?.balance || 0) < parseFloat(booking.TotalPrice) ? 0.6 : 1,
                  cursor: processing || parseFloat(wallet?.balance || 0) < parseFloat(booking.TotalPrice) ? 'not-allowed' : 'pointer'
                }}
              >
                {processing ? 'Processing...' : `Pay Rs. ${parseFloat(booking.TotalPrice).toLocaleString()} from Wallet`}
              </button>

              <p style={{ textAlign: 'center', color: C.textFaint, fontSize: '0.8rem', marginTop: '1rem' }}>
                By proceeding, you agree to our Terms of Service.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}