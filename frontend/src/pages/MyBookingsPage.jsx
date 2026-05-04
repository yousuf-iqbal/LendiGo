import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("borrower");
  const [processing, setProcessing] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, [role]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await API.get(`/bookings/my?role=${role}`);
      setBookings(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (bookingId, newStatus) => {
    setProcessing(bookingId);
    try {
      await API.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.error || "Could not update status");
    } finally {
      setProcessing(null);
    }
  };

  const acceptBooking = async (bookingId) => {
    if (!window.confirm("Accept this booking? The borrower will be notified to proceed to payment.")) return;
    setProcessing(bookingId);
    try {
      const res = await API.patch(`/bookings/${bookingId}/accept`);
      fetchBookings();
      alert("Booking accepted! Borrower can now proceed to payment.");
    } catch (err) {
      alert(err.response?.data?.error || "Could not accept booking");
    } finally {
      setProcessing(null);
    }
  };

  const rejectBooking = async (bookingId) => {
    if (!window.confirm("Reject this booking? The borrower will be notified.")) return;
    setProcessing(bookingId);
    try {
      await API.patch(`/bookings/${bookingId}/reject`);
      fetchBookings();
      alert("Booking rejected.");
    } catch (err) {
      alert(err.response?.data?.error || "Could not reject booking");
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" },
      confirmed: { background: "#dcfce7", color: "#166534", border: "1px solid #86efac" },
      accepted: { background: "#dbeafe", color: "#1e40af", border: "1px solid #93c5fd" },
      approved: { background: "#dcfce7", color: "#166534", border: "1px solid #86efac" },
      rejected: { background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" },
      completed: { background: "#dcfce7", color: "#166534", border: "1px solid #86efac" },
      cancelled: { background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" },
      ongoing: { background: "#dbeafe", color: "#1e40af", border: "1px solid #93c5fd" }
    };
    const style = styles[status] || styles.pending;
    return (
      <span style={{
        padding: "6px 14px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: 600,
        textTransform: "capitalize",
        ...style
      }}>
        {status}
      </span>
    );
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTop: '4px solid #059669', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: '#6b7280' }}>Loading bookings...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1f2937', marginBottom: '2rem' }}>My Bookings</h1>
        
        {/* Role Toggle */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '2rem',
          background: '#fff',
          padding: '0.5rem',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          width: 'fit-content'
        }}>
          <button 
            onClick={() => setRole("borrower")} 
            style={{ 
              padding: '0.75rem 2rem', 
              background: role === "borrower" ? '#059669' : 'transparent', 
              color: role === "borrower" ? '#fff' : '#374151', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            Items I Requested
          </button>
          <button 
            onClick={() => setRole("lender")} 
            style={{ 
              padding: '0.75rem 2rem', 
              background: role === "lender" ? '#059669' : 'transparent', 
              color: role === "lender" ? '#fff' : '#374151', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            Requests for My Items
          </button>
        </div>

        {bookings.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem', 
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
            <p style={{ color: '#6b7280', fontSize: '1.1rem', marginBottom: '1.5rem' }}>No bookings found</p>
            {role === "borrower" && (
              <button 
                onClick={() => navigate("/browse")} 
                style={{ 
                  padding: '0.75rem 2rem', 
                  background: '#059669', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Browse Items
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {bookings.map((b) => (
              <div 
                key={b.booking_id} 
                style={{ 
                  background: '#fff', 
                  borderRadius: '12px', 
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1f2937' }}>{b.asset_name}</h3>
                  {getStatusBadge(b.status)}
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '1rem',
                  marginBottom: '1rem',
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <div>
                    <p style={{ margin: '0.25rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
                      <strong style={{ color: '#374151' }}>Dates:</strong> {new Date(b.start_date).toLocaleDateString()} to {new Date(b.end_date).toLocaleDateString()}
                    </p>
                    <p style={{ margin: '0.25rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
                      <strong style={{ color: '#374151' }}>Total:</strong> Rs {Number(b.total_price).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0.25rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
                      <strong style={{ color: '#374151' }}>{role === "borrower" ? 'Lender' : 'Borrower'}:</strong> {role === "borrower" ? b.lender_name : b.borrower_name}
                    </p>
                  </div>
                </div>

                {b.message && (
                  <div style={{ 
                    background: '#f0fdf4', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    fontStyle: 'italic',
                    marginBottom: '1rem',
                    borderLeft: '4px solid #059669'
                  }}>
                    "{b.message}"
                  </div>
                )}
                
                <div style={{ 
                  display: 'flex', 
                  gap: '0.75rem', 
                  marginTop: '1rem', 
                  paddingTop: '1rem', 
                  borderTop: '1px solid #e5e7eb',
                  flexWrap: 'wrap'
                }}>
                  {/* Lender Actions */}
                  {role === "lender" && b.status === "pending" && (
                    <>
                      <button 
                        onClick={() => acceptBooking(b.booking_id)} 
                        disabled={processing === b.booking_id}
                        style={{ 
                          padding: '0.625rem 1.5rem', 
                          background: processing === b.booking_id ? '#9ca3af' : '#059669', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '8px', 
                          cursor: processing === b.booking_id ? 'not-allowed' : 'pointer',
                          fontWeight: 600
                        }}
                      >
                        {processing === b.booking_id ? 'Processing...' : '✓ Accept Booking'}
                      </button>
                      <button 
                        onClick={() => rejectBooking(b.booking_id)} 
                        disabled={processing === b.booking_id}
                        style={{ 
                          padding: '0.625rem 1.5rem', 
                          background: 'transparent', 
                          border: '1px solid #dc2626', 
                          color: '#dc2626', 
                          borderRadius: '8px', 
                          cursor: processing === b.booking_id ? 'not-allowed' : 'pointer',
                          fontWeight: 600
                        }}
                      >
                        ✗ Reject
                      </button>
                    </>
                  )}
                  
                  {/* Borrower Actions */}
                  {role === "borrower" && b.status === "pending" && (
                    <button 
                      onClick={() => updateStatus(b.booking_id, "cancelled")} 
                      disabled={processing === b.booking_id}
                      style={{ 
                        padding: '0.625rem 1.5rem', 
                        background: 'transparent', 
                        border: '1px solid #dc2626', 
                        color: '#dc2626', 
                        borderRadius: '8px', 
                        cursor: processing === b.booking_id ? 'not-allowed' : 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Cancel Request
                    </button>
                  )}
                  
                  {/* Proceed to Payment - for borrower when booking is confirmed by lender */}
                  {role === "borrower" && b.status === "confirmed" && (
                    <button 
                      onClick={() => navigate(`/bookings/${b.booking_id}/payment`)}
                      style={{ 
                        padding: '0.625rem 1.5rem', 
                        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '8px', 
                        cursor: 'pointer',
                        fontWeight: 600,
                        boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
                      }}
                    >
                      💳 Proceed to Payment
                    </button>
                  )}
                  
                  {/* Lender: Mark Completed */}
                  {role === "lender" && b.status === "approved" && (
                    <button 
                      onClick={() => updateStatus(b.booking_id, "completed")} 
                      style={{ 
                        padding: '0.625rem 1.5rem', 
                        background: '#3b82f6', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '8px', 
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      ✓ Mark Completed
                    </button>
                  )}
                  
                  {/* View Asset */}
                  {(b.status === "completed" || b.status === "ongoing") && (
                    <button 
                      onClick={() => navigate(`/assets/${b.asset_id}`)}
                      style={{ 
                        padding: '0.625rem 1.5rem', 
                        background: '#f3f4f6', 
                        border: 'none', 
                        borderRadius: '8px', 
                        cursor: 'pointer',
                        fontWeight: 600,
                        color: '#374151'
                      }}
                    >
                      View Asset
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