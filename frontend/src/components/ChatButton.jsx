import { useNavigate } from 'react-router-dom';

export default function ChatButton({ bookingId, userId, style }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.stopPropagation();
    if (bookingId) {
      navigate(`/messages?booking=${bookingId}`);
    } else if (userId) {
      navigate(`/messages?user=${userId}`);
    } else {
      navigate('/messages');
    }
  };

  return (
    <button
      onClick={handleClick}
      style={{
        ...defaultStyle,
        ...style,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <span>Message</span>
    </button>
  );
}

const defaultStyle = {
  padding: '10px 16px',
  background: 'linear-gradient(135deg, #8B1538 0%, #6B0F1A 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.9rem',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 0.2s',
};
