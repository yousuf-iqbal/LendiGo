import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
//import FloatingBackground from '../components/FloatingBackground';

const C = { saffron:'#F4A020', saffronPale:'#FFF0CC', maroon:'#800020', maroonL:'#B00030', cream:'#FDF6EC', warmWhite:'#FFF9F0', textDark:'#2C1810', textMuted:'#6B4C3B', textFaint:'#A68070', border:'rgba(128,0,32,0.12)' };

const STATUS_BADGE = {
  pending:   { bg:'#FFF3CD', color:'#856404', border:'#FFDF7E' },
  confirmed: { bg:'#D1FAE5', color:'#065F46', border:'#6EE7B7' },
  ongoing:   { bg:'#DBEAFE', color:'#1E40AF', border:'#93C5FD' },
  returned:  { bg:'#FEF3C7', color:'#92400E', border:'#FDE68A' },
  completed: { bg:'#D1FAE5', color:'#065F46', border:'#6EE7B7' },
  cancelled: { bg:'#FEE2E2', color:'#991B1B', border:'#FCA5A5' },
};

function Badge({ status }) {
  const s = STATUS_BADGE[status] || STATUS_BADGE.pending;
  return <span style={{ padding:'5px 14px', borderRadius:999, fontSize:'0.75rem', fontWeight:700, textTransform:'capitalize', background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>{status}</span>;
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('borrower');
  const [processing, setProcessing] = useState(null);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('udhaari_user') || 'null');

  useEffect(() => { fetchBookings(); }, [role]);

  const fetchBookings = async () => {
    setLoading(true);
    try { const r = await API.get(`/bookings/my?role=${role}`); setBookings(r.data || []); }
    catch (err) { alert(err.response?.data?.error || 'Could not load bookings'); }
    finally { setLoading(false); }
  };

  const act = async (bookingId, fn) => {
    setProcessing(bookingId);
    try { await fn(); fetchBookings(); } catch (err) { alert(err.response?.data?.error || 'Action failed'); }
    finally { setProcessing(null); }
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:C.cream, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
     {/*} <FloatingBackground variant="minimal" />*/}
      <div style={{ width:44, height:44, border:`3px solid ${C.border}`, borderTopColor:C.saffron, borderRadius:'50%', animation:'spin 0.8s linear infinite', zIndex:1 }} />
      <p style={{ color:C.textMuted, zIndex:1, fontFamily:"'Outfit',sans-serif" }}>Loading bookings…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  return (
    <div style={{ background:C.cream, minHeight:'100vh', position:'relative', fontFamily:"'Outfit',system-ui,sans-serif" }}>
     {/*} <FloatingBackground variant="minimal" />*/}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Outfit:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}}
        @keyframes spin{to{transform:rotate(360deg);}}
        .booking-card{transition:box-shadow 0.25s ease,transform 0.25s ease;} .booking-card:hover{box-shadow:0 8px 32px rgba(128,0,32,0.12) !important;transform:translateY(-2px);}
      `}</style>

      <div style={{ position:'relative', zIndex:1, maxWidth:1100, margin:'0 auto', padding:'2rem 1.5rem' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem', animation:'fadeUp 0.5s ease both' }}>
          <div>
            <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'2.6rem', fontWeight:700, color:C.textDark, letterSpacing:'-0.02em', margin:0 }}>My Bookings</h1>
            <p style={{ color:C.textMuted, marginTop:4 }}>Track rentals, payments and status all in one place.</p>
          </div>
          <button onClick={fetchBookings} style={{ padding:'0.65rem 1.25rem', background:C.warmWhite, border:`1.5px solid ${C.border}`, borderRadius:10, fontWeight:600, cursor:'pointer', color:C.textMuted, fontFamily:"'Outfit',sans-serif", transition:'all 0.2s' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.saffron;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;}}>
            ↻ Refresh
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, background:'rgba(128,0,32,0.06)', padding:4, borderRadius:12, width:'fit-content', marginBottom:'2rem', animation:'fadeUp 0.5s ease 0.05s both' }}>
          {['borrower','lender'].map(r => (
            <button key={r} onClick={() => setRole(r)}
              style={{ padding:'0.65rem 1.5rem', background: role===r ? C.maroon : 'transparent', color: role===r ? '#fff' : C.textMuted, border:'none', borderRadius:9, cursor:'pointer', fontWeight:700, fontFamily:"'Outfit',sans-serif", fontSize:'0.9rem', transition:'all 0.2s' }}>
              {r === 'borrower' ? 'Items I Requested' : 'Requests for My Items'}
            </button>
          ))}
        </div>

        {bookings.length === 0 ? (
          <div style={{ textAlign:'center', padding:'5rem 2rem', background:C.warmWhite, borderRadius:16, border:`1px solid ${C.border}`, animation:'fadeUp 0.5s ease 0.1s both' }}>
            <div style={{ fontSize:'3.5rem', marginBottom:'1rem' }}>📭</div>
            <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'1.5rem', color:C.textDark, marginBottom:'0.5rem' }}>No bookings found</h3>
            <p style={{ color:C.textMuted, marginBottom:'1.5rem' }}>{role === 'borrower' ? 'Browse items and send your first booking request.' : 'Incoming booking requests will appear here.'}</p>
            {role === 'borrower' && <button onClick={() => navigate('/browse')} style={{ padding:'0.75rem 2rem', background:C.maroon, color:'#fff', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>Browse Items</button>}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {bookings.map((b, idx) => {
              const status = String(b.status || b.Status || 'pending').toLowerCase();
              const bookingId = b.booking_id || b.BookingID;
              const assetId = b.asset_id || b.AssetID;
              return (
                <div key={bookingId} className="booking-card"
                  style={{ background:C.warmWhite, border:`1px solid ${C.border}`, borderRadius:16, padding:'1.5rem', boxShadow:'0 2px 12px rgba(128,0,32,0.07)', animation:`fadeUp 0.5s ease ${idx*0.05}s both` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem', marginBottom:'1rem', flexWrap:'wrap' }}>
                    <div>
                      <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'1.3rem', fontWeight:700, color:C.textDark, margin:'0 0 4px' }}>{b.asset_name || b.AssetTitle || b.RequestTitle || 'Booking'}</h3>
                      <p style={{ color:C.textMuted, fontSize:'0.85rem', margin:0 }}>
                        {new Date(b.start_date || b.StartDate).toLocaleDateString()} → {new Date(b.end_date || b.EndDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge status={status} />
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'0.75rem', background:C.cream, borderRadius:12, padding:'0.875rem 1rem', marginBottom:'1rem' }}>
                    <div>
                      <p style={{ margin:0, fontSize:'0.7rem', fontWeight:700, color:C.textFaint, textTransform:'uppercase', letterSpacing:'0.07em' }}>Total</p>
                      <p style={{ margin:'3px 0 0', fontFamily:'Cormorant Garamond,serif', fontSize:'1.2rem', fontWeight:700, color:C.maroon }}>Rs. {Number(b.total_price || b.TotalPrice || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p style={{ margin:0, fontSize:'0.7rem', fontWeight:700, color:C.textFaint, textTransform:'uppercase', letterSpacing:'0.07em' }}>{role === 'borrower' ? 'Lender' : 'Borrower'}</p>
                      <p style={{ margin:'3px 0 0', fontWeight:600, color:C.textDark }}>{role === 'borrower' ? b.lender_name : b.borrower_name}</p>
                    </div>
                    <div>
                      <p style={{ margin:0, fontSize:'0.7rem', fontWeight:700, color:C.textFaint, textTransform:'uppercase', letterSpacing:'0.07em' }}>Payment</p>
                      <p style={{ margin:'3px 0 0', fontWeight:600, color: b.is_paid ? '#059669' : C.textMuted }}>{b.is_paid ? '✓ Paid' : 'Unpaid'}</p>
                    </div>
                  </div>

                  <div style={{ display:'flex', flexWrap:'wrap', gap:'0.6rem', paddingTop:'0.75rem', borderTop:`1px solid ${C.border}` }}>
                    {role === 'lender' && status === 'pending' && (
                      <>
                        <Btn disabled={processing===bookingId} onClick={() => act(bookingId, () => API.patch(`/bookings/${bookingId}/accept`))} variant="primary">Accept</Btn>
                        <Btn disabled={processing===bookingId} onClick={() => act(bookingId, () => API.patch(`/bookings/${bookingId}/reject`))} variant="danger">Reject</Btn>
                      </>
                    )}
                    {role === 'borrower' && status === 'pending' && (
                      <Btn disabled={processing===bookingId} onClick={() => act(bookingId, () => API.patch(`/bookings/${bookingId}/status`, {status:'cancelled'}))} variant="danger">Cancel</Btn>
                    )}
                    {role === 'borrower' && status === 'confirmed' && !b.is_paid && (
                      <Btn onClick={() => navigate(`/bookings/${bookingId}/payment`)} variant="primary">Pay Now</Btn>
                    )}
                    {role === 'lender' && ['confirmed','ongoing','returned'].includes(status) && (
                      <Btn disabled={processing===bookingId} onClick={() => act(bookingId, () => API.patch(`/bookings/${bookingId}/status`, {status:'completed'}))} variant="primary">Mark Completed</Btn>
                    )}
                    {assetId && <Btn onClick={() => navigate(`/assets/${assetId}`)} variant="ghost">View Asset</Btn>}
                    <Btn onClick={() => navigate(`/bookings/${bookingId}/payment`)} variant="outline">Receipt</Btn>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Btn({ children, onClick, variant='ghost', disabled }) {
  const styles = {
    primary: { background:'#800020', color:'#fff', border:'none', boxShadow:'0 2px 8px rgba(128,0,32,0.25)' },
    danger:  { background:'#FEE2E2', color:'#991B1B', border:'1px solid #FCA5A5' },
    outline: { background:'transparent', color:'#800020', border:'1.5px solid rgba(128,0,32,0.30)' },
    ghost:   { background:'rgba(128,0,32,0.06)', color:'#2C1810', border:'none' },
  };
  const s = styles[variant];
  return (
    <button disabled={disabled} onClick={onClick}
      style={{ padding:'0.55rem 1rem', borderRadius:9, cursor:disabled?'not-allowed':'pointer', fontWeight:700, fontFamily:"'Outfit',sans-serif", fontSize:'0.85rem', transition:'all 0.2s', opacity:disabled?0.6:1, ...s }}
      onMouseEnter={e=>{ if(!disabled) e.currentTarget.style.transform='translateY(-1px)'; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; }}>
      {children}
    </button>
  );
}
