import { useState } from 'react';
import API from '../api/axios';

export default function ReviewModal({ booking, role, onClose, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const otherName = role === 'borrower' ? booking.lender_name : booking.borrower_name;

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await API.post('/reviews', {
        bookingID: booking.booking_id || booking.BookingID,
        rating,
        comment,
      });
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <form onSubmit={submit} style={styles.modal} className="animate-scale-in">
        <button type="button" onClick={onClose} style={styles.close}>×</button>
        <p style={styles.kicker}>Review</p>
        <h2 style={styles.title}>{otherName || 'Your booking partner'}</h2>
        <p style={styles.subtitle}>{booking.asset_name || booking.AssetTitle || 'Booking experience'}</p>

        <div style={styles.stars}>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              style={{
                ...styles.star,
                color: star <= rating ? '#f59e0b' : '#d1d5db',
              }}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
            >★
              ★
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Share a helpful note about the experience..."
          rows={4}
          style={styles.textarea}
          maxLength={500}
        />

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.actions}>
          <button type="button" onClick={onClose} style={styles.cancel}>Cancel</button>
          <button type="submit" disabled={submitting} style={styles.submit}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background: 'rgba(15,23,42,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  modal: {
    width: 'min(460px, 100%)',
    background: '#fff',
    borderRadius: 16,
    padding: '2rem',
    position: 'relative',
    boxShadow: '0 24px 60px rgba(15,23,42,0.22)',
  },
  close: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    border: '1px solid #e5e7eb',
    background: '#f9fafb',
    borderRadius: 8,
    fontSize: '1.3rem',
    cursor: 'pointer',
  },
  kicker: { margin: 0, color: '#059669', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.75rem' },
  title: { margin: '0.3rem 0 0.25rem', color: '#111827' },
  subtitle: { margin: 0, color: '#6b7280' },
  stars: { display: 'flex', gap: '0.25rem', margin: '1.5rem 0' },
  star: { background: 'transparent', border: 'none', fontSize: '2.2rem', cursor: 'pointer', lineHeight: 1 },
  textarea: {
    width: '100%',
    padding: '0.9rem',
    border: '1px solid #d1d5db',
    borderRadius: 10,
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  error: { marginTop: '1rem', padding: '0.75rem', color: '#b91c1c', background: '#fee2e2', borderRadius: 8 },
  actions: { display: 'flex', gap: '0.75rem', marginTop: '1.25rem' },
  cancel: { flex: 1, padding: '0.85rem', border: 'none', borderRadius: 10, background: '#f3f4f6', fontWeight: 800, cursor: 'pointer' },
  submit: { flex: 1, padding: '0.85rem', border: 'none', borderRadius: 10, background: '#059669', color: '#fff', fontWeight: 800, cursor: 'pointer' },
};
