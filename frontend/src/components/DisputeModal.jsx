import { useState } from 'react';
import API from '../api/axios';

export default function DisputeModal({ bookingId, onClose, onSubmitSuccess }) {
  const [category, setCategory] = useState('complaint');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { value: 'complaint', label: 'Complaint' },
    { value: 'dispute', label: 'Dispute' },
    { value: 'damage', label: 'Damage Report' },
    { value: 'misrepresentation', label: 'Misrepresentation' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await API.post('/disputes', {
        bookingId: parseInt(bookingId),
        category,
        subject: subject.trim(),
        description: description.trim(),
      });
      setError('');
      setSubject('');
      setDescription('');
      onSubmitSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit dispute');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} style={styles.closeBtn}>×</button>

        <h3 style={styles.title}>Report Issue</h3>
        <p style={styles.subtitle}>Let us know about any concerns with this booking</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={styles.select}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief title for the issue"
              style={styles.input}
              maxLength={100}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed information about the issue..."
              style={styles.textarea}
              maxLength={1000}
            />
            <span style={styles.charCount}>{description.length}/1000</span>
          </div>

          {error && <div style={styles.errorMsg}>{error}</div>}

          <div style={styles.actions}>
            <button
              type="submit"
              disabled={submitting}
              style={styles.submitBtn}
            >
              {submitting ? 'Submitting...' : 'Submit Dispute'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelBtn}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '500px',
    width: '90%',
    position: 'relative',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  },
  closeBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'none',
    border: 'none',
    fontSize: '1.8rem',
    cursor: 'pointer',
    color: '#999',
  },
  title: {
    margin: '0 0 8px',
    fontSize: '1.3rem',
    fontWeight: 800,
    color: '#1a1a1a',
  },
  subtitle: {
    margin: '0 0 20px',
    fontSize: '0.9rem',
    color: '#666',
  },
  form: {
    display: 'grid',
    gap: '16px',
  },
  field: {
    display: 'grid',
    gap: '6px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#333',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    background: '#fff',
    cursor: 'pointer',
  },
  textarea: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    minHeight: '100px',
    resize: 'vertical',
  },
  charCount: {
    fontSize: '0.75rem',
    color: '#999',
    textAlign: 'right',
  },
  errorMsg: {
    background: '#fee2e2',
    color: '#dc2626',
    padding: '10px 12px',
    borderRadius: '6px',
    fontSize: '0.85rem',
  },
  actions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginTop: '20px',
  },
  submitBtn: {
    padding: '12px',
    background: 'linear-gradient(135deg, #8B1538 0%, #6B0F1A 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  cancelBtn: {
    padding: '12px',
    background: '#f3f4f6',
    color: '#333',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
