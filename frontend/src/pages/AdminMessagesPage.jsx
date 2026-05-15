import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const C = {
  saffron: "#F4A020", maroon: "#800020", cream: "#FDF6EC", 
  textDark: "#2C1810", textMuted: "#6B4C3B", border: "rgba(128,0,32,0.12)"
};

export default function AdminMessagesPage() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await API.get('/admin/messages/conversations');
      setConversations(res.data || []);
    } catch (err) {
      setError('Failed to load conversations. This feature requires backend implementation.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (bookingId) => {
    try {
      const res = await API.get(`/admin/messages/bookings/${bookingId}`);
      setMessages(res.data || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedBooking(conversation.BookingID);
    fetchMessages(conversation.BookingID);
  };

  return (
    <div style={{ minHeight: '100vh', background: C.cream, padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <button onClick={() => navigate('/admin')} style={{ marginBottom: '1.5rem', background: 'none', border: 'none', color: C.maroon, cursor: 'pointer', fontWeight: 600 }}>
          ← Back to Admin Dashboard
        </button>

        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: C.textDark, marginBottom: '2rem' }}>
          All Messages & Conversations
        </h1>

        {error && (
          <div style={{ 
            background: '#FEE2E2', 
            color: C.maroon, 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem',
            borderLeft: `4px solid ${C.maroon}`
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
            {/* Conversations List */}
            <div style={{ 
              background: '#fff',
              borderRadius: '12px',
              border: `1px solid ${C.border}`,
              maxHeight: '600px',
              overflowY: 'auto'
            }}>
              {conversations.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: C.textMuted }}>
                  No conversations yet
                </div>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.BookingID}
                    onClick={() => handleSelectConversation(conv)}
                    style={{
                      padding: '1rem',
                      borderBottom: `1px solid ${C.border}`,
                      cursor: 'pointer',
                      background: selectedBooking === conv.BookingID ? '#f9f9f9' : '#fff',
                      borderLeft: selectedBooking === conv.BookingID ? `4px solid ${C.maroon}` : '4px solid transparent'
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: 600, color: C.textDark }}>
                      Booking #{conv.BookingID}
                    </p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: C.textMuted }}>
                      {conv.User1Name} ↔ {conv.User2Name}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Messages Display */}
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              border: `1px solid ${C.border}`,
              padding: '1.5rem',
              minHeight: '600px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {!selectedBooking ? (
                <div style={{ textAlign: 'center', color: C.textMuted, marginTop: '2rem' }}>
                  Select a conversation to view messages
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: C.textMuted, marginTop: '2rem' }}>
                  No messages in this conversation
                </div>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {messages.map(msg => (
                    <div key={msg.MessageID} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: `1px solid ${C.border}` }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', color: C.maroon }}>
                        {msg.SenderName} • {new Date(msg.SentAt).toLocaleString()}
                      </p>
                      <p style={{ margin: '0.5rem 0 0', color: C.textDark }}>
                        {msg.Body}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
