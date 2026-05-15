import { useState, useEffect, useRef } from 'react';
import API from '../api/axios';

export default function OfferStack() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const containerRef = useRef(null);
  const touchStartRef = useRef(0);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await API.get('/offers');
      setOffers(res.data || []);
    } catch (err) {
      console.error('Error fetching offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    const offer = offers[currentIndex];
    try {
      await API.patch(`/offers/${offer.OfferID}`, { status: 'accepted' });
      moveToNextCard('accept');
    } catch (err) {
      console.error('Error accepting offer:', err);
    }
  };

  const handleDecline = () => {
    moveToNextCard('decline');
  };

  const moveToNextCard = (direction) => {
    setSwipeDirection(direction);
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSwipeDirection(null);
    }, 300);
  };

  const handleMouseDown = (e) => {
    touchStartRef.current = e.clientX;
  };

  const handleMouseUp = (e) => {
    const diff = e.clientX - touchStartRef.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleAccept();
      } else {
        handleDecline();
      }
    }
  };

  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const diff = e.changedTouches[0].clientX - touchStartRef.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleAccept();
      } else {
        handleDecline();
      }
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading offers...</div>;
  }

  if (currentIndex >= offers.length) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>✨</div>
          <h2 style={styles.emptyTitle}>All Caught Up</h2>
          <p style={styles.emptyText}>You have reviewed all available offers</p>
          <button onClick={() => window.location.reload()} style={styles.refreshBtn}>
            Refresh Offers
          </button>
        </div>
      </div>
    );
  }

  const offer = offers[currentIndex];
  const nextOffer = offers[currentIndex + 1];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Offers</h1>
        <p style={styles.counter}>{currentIndex + 1} of {offers.length}</p>
      </div>

      <div style={styles.stackContainer} ref={containerRef}>
        {/* Next card (background) */}
        {nextOffer && (
          <div style={{...styles.card, ...styles.cardBackground}}>
            <div style={styles.cardContent}>
              <h3 style={styles.offerTitle}>{nextOffer.RequestTitle}</h3>
              <p style={styles.offerDetail}>{nextOffer.LenderName}</p>
            </div>
          </div>
        )}

        {/* Current card (front) */}
        <div
          style={{
            ...styles.card,
            ...styles.cardFront,
            transform: swipeDirection === 'accept' 
              ? 'translateX(200%) rotate(15deg)' 
              : swipeDirection === 'decline'
              ? 'translateX(-200%) rotate(-15deg)'
              : 'translateX(0) rotate(0)',
            opacity: swipeDirection ? 0 : 1,
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s'
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div style={styles.cardContent}>
            <div style={styles.cardHeader}>
              <h3 style={styles.offerTitle}>{offer.RequestTitle}</h3>
              <span style={styles.badge}>{offer.Status}</span>
            </div>

            <div style={styles.offerDetails}>
              <div style={styles.detailRow}>
                <span style={styles.label}>From:</span>
                <span style={styles.value}>{offer.LenderName}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.label}>Price:</span>
                <span style={styles.priceValue}>Rs {Number(offer.OfferedPrice).toLocaleString()}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.label}>Asset:</span>
                <span style={styles.value}>{offer.AssetTitle || 'N/A'}</span>
              </div>
            </div>

            {offer.Message && (
              <div style={styles.messageBox}>
                <p style={styles.messageText}>{offer.Message}</p>
              </div>
            )}

            <div style={styles.swipeHint}>Swipe left to decline, right to accept</div>
          </div>
        </div>
      </div>

      <div style={styles.actions}>
        <button onClick={handleDecline} style={styles.declineBtn}>
          <span style={styles.btnIcon}>✕</span>
          <span>Decline</span>
        </button>
        <button onClick={handleAccept} style={styles.acceptBtn}>
          <span style={styles.btnIcon}>✓</span>
          <span>Accept</span>
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .pulse { animation: pulse 2s infinite; }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    padding: '80px 24px',
    maxWidth: '500px',
    margin: '0 auto',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 900,
    margin: '0 0 8px',
    color: '#1a1a1a',
  },
  counter: {
    margin: 0,
    color: '#999',
    fontSize: '0.9rem',
  },
  stackContainer: {
    flex: 1,
    position: 'relative',
    height: '500px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    perspective: '1000px',
    marginBottom: '32px',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    background: '#fff',
    border: '1px solid #e5e7eb',
    cursor: 'grab',
    userSelect: 'none',
  },
  cardFront: {
    zIndex: 10,
  },
  cardBackground: {
    transform: 'scale(0.95) translateY(20px)',
    opacity: 0.7,
    zIndex: 5,
  },
  cardContent: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
    marginBottom: '20px',
  },
  offerTitle: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#1a1a1a',
    flex: 1,
  },
  badge: {
    background: '#f0fdf4',
    color: '#16a34a',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    marginLeft: '12px',
  },
  offerDetails: {
    display: 'grid',
    gap: '16px',
    marginBottom: '20px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    background: '#f9f9f9',
    borderRadius: '8px',
  },
  label: {
    fontSize: '0.85rem',
    color: '#999',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#1a1a1a',
  },
  priceValue: {
    fontSize: '1.1rem',
    fontWeight: 800,
    color: '#8B1538',
  },
  messageBox: {
    background: '#fafafa',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
  },
  messageText: {
    margin: 0,
    fontSize: '0.9rem',
    color: '#666',
    lineHeight: 1.4,
  },
  swipeHint: {
    textAlign: 'center',
    fontSize: '0.8rem',
    color: '#bbb',
    fontStyle: 'italic',
  },
  actions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '32px',
  },
  declineBtn: {
    padding: '16px',
    background: '#fee2e2',
    color: '#dc2626',
    border: '2px solid #fca5a5',
    borderRadius: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  acceptBtn: {
    padding: '16px',
    background: 'linear-gradient(135deg, #8B1538 0%, #6B0F1A 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  btnIcon: {
    fontSize: '1.2rem',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '16px',
  },
  emptyTitle: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 800,
    marginBottom: '8px',
  },
  emptyText: {
    margin: 0,
    color: '#999',
    marginBottom: '24px',
  },
  refreshBtn: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #8B1538 0%, #6B0F1A 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  loading: {
    padding: '100px 24px',
    textAlign: 'center',
    color: '#666',
  },
};
