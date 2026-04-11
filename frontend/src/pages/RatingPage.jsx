import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function RatingPage() {
  const { bookingID, revieweeID } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) return setError('Please select a star rating.');
    setError('');
    setLoading(true);
    try {
      await API.post('/ratings', {
        bookingID: parseInt(bookingID),
        revieweeID: parseInt(revieweeID),
        rating,
        comment,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit rating.');
    } finally {
      setLoading(false);
    }
  };

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  if (submitted) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ ...styles.icon, background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>★</div>
          <h2 style={styles.title}>Thank You!</h2>
          <p style={styles.sub}>Your review has been submitted successfully.</p>
          <button style={styles.btn} onClick={() => navigate('/profile')}>Go to Profile</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.headerAccent} />
          <h1 style={styles.heading}>Rate Your Experience</h1>
          <p style={styles.subheading}>Booking #{bookingID}</p>
        </div>

        <div style={styles.starsSection}>
          <p style={styles.label}>How was your experience?</p>
          <div style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                style={{
                  ...styles.star,
                  color: star <= (hovered || rating) ? '#f59e0b' : '#d1d5db',
                  transform: star <= (hovered || rating) ? 'scale(1.2)' : 'scale(1)',
                }}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)}
              >
                ★
              </button>
            ))}
          </div>
          {(hovered || rating) > 0 && (
            <p style={styles.ratingLabel}>{labels[hovered || rating]}</p>
          )}
        </div>

        <div style={styles.commentSection}>
          <p style={styles.label}>
            Leave a comment <span style={styles.optional}>(optional)</span>
          </p>
          <textarea
            style={styles.textarea}
            placeholder="Share your experience with other users..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={500}
          />
          <p style={styles.charCount}>{comment.length}/500</p>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={() => navigate(-1)}>Cancel</button>
          <button
            style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: "'Segoe UI', sans-serif" },
  card: { background: '#fff', borderRadius: '1.5rem', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', width: '100%', maxWidth: '480px', overflow: 'hidden' },
  header: { background: 'linear-gradient(135deg, #1e293b, #334155)', padding: '2rem', position: 'relative', overflow: 'hidden' },
  headerAccent: { position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(245,158,11,0.2)' },
  heading: { color: '#fff', fontSize: '1.6rem', fontWeight: '700', margin: '0 0 0.25rem 0' },
  subheading: { color: '#94a3b8', fontSize: '0.9rem', margin: 0 },
  starsSection: { padding: '2rem 2rem 1rem', textAlign: 'center' },
  label: { fontSize: '0.95rem', fontWeight: '600', color: '#374151', marginBottom: '1rem', textAlign: 'left' },
  optional: { fontWeight: '400', color: '#9ca3af', fontSize: '0.85rem' },
  stars: { display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' },
  star: { fontSize: '3rem', background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.15s, color 0.15s', padding: '0', lineHeight: 1 },
  ratingLabel: { fontSize: '1rem', fontWeight: '600', color: '#f59e0b', margin: 0, minHeight: '1.5rem' },
  commentSection: { padding: '0 2rem 1rem' },
  textarea: { width: '100%', border: '2px solid #e5e7eb', borderRadius: '0.75rem', padding: '0.875rem', fontSize: '0.95rem', color: '#374151', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  charCount: { textAlign: 'right', fontSize: '0.8rem', color: '#9ca3af', margin: '0.25rem 0 0' },
  error: { color: '#ef4444', fontSize: '0.875rem', margin: '0 2rem', padding: '0.75rem', background: '#fef2f2', borderRadius: '0.5rem', textAlign: 'center' },
  actions: { display: 'flex', gap: '1rem', padding: '1.5rem 2rem 2rem' },
  btn: { flex: 1, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: '0.75rem', padding: '0.875rem', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
  cancelBtn: { flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '0.75rem', padding: '0.875rem', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
  icon: { width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', color: '#fff', margin: '2rem auto 1rem' },
  title: { fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', textAlign: 'center', margin: '0 0 0.5rem' },
  sub: { color: '#64748b', textAlign: 'center', margin: '0 0 1.5rem', padding: '0 1rem' },
};