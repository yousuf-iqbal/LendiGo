import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import API from '../api/axios';
import { auth } from '../config/firebase';

export default function ChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [currentUserID, setCurrentUserID] = useState(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const currentUser = auth.currentUser;

  // Get socket URL
  const socketUrl = API.defaults.baseURL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const res = await API.get('/chat/conversations');
        setConversations(res.data || []);
        
        // Check if booking parameter in URL
        const bookingParam = searchParams.get('booking');
        if (bookingParam) {
          setSelectedBooking(parseInt(bookingParam));
        }
        
        // Fetch current user's profile to get UserID for message differentiation
        try {
          const profileRes = await API.get('/profile/me');
          const userID = profileRes.data?.user?.UserID;
          if (userID) {
            setCurrentUserID(userID);
          }
        } catch (err) {
          console.error('Error loading user profile:', err);
        }
      } catch (err) {
        console.error('Error loading conversations:', err);
        setError('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) loadConversations();
  }, [currentUser, searchParams]);

  // Initialize WebSocket
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (error) => console.error('Socket error:', error));

    socket.on('message:new', (message) => {
      if (selectedBooking && message.BookingID === selectedBooking) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    });

    return () => socket.disconnect();
  }, [socketUrl, selectedBooking]);

  // Load messages when booking is selected
  useEffect(() => {
    if (!selectedBooking) return;

    const loadMessages = async () => {
      try {
        const res = await API.get(`/chat/bookings/${selectedBooking}/messages`);
        setMessages(res.data || []);
        scrollToBottom();

        // Join room via WebSocket
        if (socketRef.current) {
          socketRef.current.emit('join_booking', selectedBooking);
        }
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Failed to load messages');
      }
    };

    loadMessages();
  }, [selectedBooking]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || !socketRef.current || !connected) return;

    setSending(true);
    socketRef.current.emit('send_message', { bookingID: selectedBooking, body: text }, (ack) => {
      if (ack?.ok) {
        setBody('');
        setError('');
      } else {
        setError(ack?.error || 'Failed to send message');
      }
      setSending(false);
    });
  };

  const currentConversation = conversations.find(c => c.BookingID === selectedBooking);

  return (
    <div style={styles.container}>
      {/* Sidebar - Conversations List */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>Messages</h2>
          <div style={styles.badge}>{connected ? 'Online' : 'Offline'}</div>
        </div>

        <div style={styles.conversationsList}>
          {loading ? (
            <div style={styles.empty}>Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div style={styles.empty}>No active conversations</div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.BookingID}
                onClick={() => setSelectedBooking(conv.BookingID)}
                style={{
                  ...styles.conversationItem,
                  ...(selectedBooking === conv.BookingID ? styles.conversationActive : {}),
                }}
              >
                <div style={styles.convAvatar}>
                  {conv.OtherUserPic ? (
                    <img src={conv.OtherUserPic} alt={conv.OtherUserName} style={styles.avatarImg} />
                  ) : (
                    <div style={styles.avatarPlaceholder}>{conv.OtherUserName?.[0]?.toUpperCase()}</div>
                  )}
                  {conv.UnreadCount > 0 && <div style={styles.unreadDot} />}
                </div>
                <div style={styles.convInfo}>
                  <div style={styles.convName}>{conv.OtherUserName}</div>
                  <div style={styles.convPreview}>{conv.Title}</div>
                  {conv.UnreadCount > 0 && <div style={styles.unreadBadge}>{conv.UnreadCount}</div>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div style={styles.chatArea}>
        {selectedBooking ? (
          <>
            {/* Chat Header */}
            <div style={styles.chatHeader}>
              <div>
                <h3 style={styles.chatTitle}>{currentConversation?.Title}</h3>
                <p style={styles.chatSub}>
                  {currentConversation?.OtherUserName} · Booking #{selectedBooking}
                </p>
              </div>
              <div style={styles.statusChip}>
                {currentConversation?.Status === 'completed' ? (
                  <span style={styles.statusCompleted}>Completed</span>
                ) : currentConversation?.Status === 'ongoing' ? (
                  <span style={styles.statusOngoing}>Ongoing</span>
                ) : (
                  <span style={styles.statusPending}>Pending</span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div style={styles.messagesArea}>
              {messages.length === 0 ? (
                <div style={styles.noMessages}>
                  <p style={styles.noMessagesText}>No messages yet</p>
                  <p style={styles.noMessagesSub}>Start the conversation</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isOwn = msg.SenderID === currentUserID;
                  return (
                    <div
                      key={msg.MessageID || idx}
                      style={{
                        ...styles.messageGroup,
                        justifyContent: isOwn ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {!isOwn && (
                        <div style={styles.msgAvatar}>
                          {currentConversation?.OtherUserPic ? (
                            <img
                              src={currentConversation.OtherUserPic}
                              alt={currentConversation.OtherUserName}
                              style={styles.msgAvatarImg}
                            />
                          ) : (
                            <div style={styles.msgAvatarPlaceholder}>
                              {currentConversation?.OtherUserName?.[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                      )}
                      <div style={{ ...styles.messageBubble, ...(isOwn ? styles.ownMessage : styles.otherMessage) }}>
                        <p style={styles.messageText}>{msg.Body}</p>
                        <p style={styles.messageTime}>
                          {new Date(msg.SentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} style={styles.inputArea}>
              {error && <div style={styles.errorMsg}>{error}</div>}
              <div style={styles.inputWrapper}>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Type your message..."
                  style={styles.textarea}
                  disabled={!connected || sending}
                />
                <button
                  type="submit"
                  disabled={!connected || sending || !body.trim()}
                  style={styles.sendBtn}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div style={styles.emptyState}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <h3 style={styles.emptyTitle}>No conversation selected</h3>
            <p style={styles.emptySub}>Select a conversation from the list to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    height: '100vh',
    background: 'linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%)',
    fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif",
  },

  // Sidebar
  sidebar: {
    background: '#FFFFFF',
    borderRight: '1px solid rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },

  sidebarHeader: {
    padding: '20px 16px',
    borderBottom: '1px solid rgba(0,0,0,0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sidebarTitle: {
    margin: 0,
    fontSize: '1.3rem',
    fontWeight: 800,
    color: '#1a1a1a',
  },

  badge: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#4ade80',
    background: 'rgba(74, 222, 128, 0.1)',
    padding: '4px 10px',
    borderRadius: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },

  conversationsList: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },

  conversationItem: {
    display: 'flex',
    gap: '12px',
    padding: '12px 12px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    borderLeft: '3px solid transparent',
    transition: 'all 0.2s',
    textAlign: 'left',
  },

  conversationActive: {
    background: 'rgba(139, 21, 56, 0.06)',
    borderLeftColor: '#8B1538',
  },

  convAvatar: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #8B1538 0%, #6B0F1A 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
  },

  avatarPlaceholder: {
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '0.9rem',
  },

  unreadDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    background: '#ef4444',
    borderRadius: '50%',
    border: '2px solid white',
  },

  convInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '4px',
    position: 'relative',
  },

  convName: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#1a1a1a',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  convPreview: {
    fontSize: '0.8rem',
    color: '#999',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  unreadBadge: {
    position: 'absolute',
    top: '50%',
    right: 0,
    transform: 'translateY(-50%)',
    background: '#ef4444',
    color: 'white',
    fontSize: '0.7rem',
    fontWeight: 800,
    width: 20,
    height: 20,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  empty: {
    padding: '32px 16px',
    textAlign: 'center',
    color: '#999',
    fontSize: '0.85rem',
  },

  // Chat Area
  chatArea: {
    display: 'flex',
    flexDirection: 'column',
    background: '#FFFFFF',
    overflow: 'hidden',
  },

  chatHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
  },

  chatTitle: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#1a1a1a',
  },

  chatSub: {
    margin: '4px 0 0',
    fontSize: '0.85rem',
    color: '#999',
  },

  statusChip: {
    display: 'flex',
    gap: '8px',
  },

  statusCompleted: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#16a34a',
    background: 'rgba(34, 197, 94, 0.1)',
    padding: '6px 12px',
    borderRadius: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },

  statusOngoing: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#f59e0b',
    background: 'rgba(245, 158, 11, 0.1)',
    padding: '6px 12px',
    borderRadius: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },

  statusPending: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#3b82f6',
    background: 'rgba(59, 130, 246, 0.1)',
    padding: '6px 12px',
    borderRadius: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },

  messagesArea: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 24px',
    gap: '12px',
    alignContent: 'flex-start',
  },

  messageGroup: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-end',
  },

  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #8B1538 0%, #6B0F1A 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  msgAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
  },

  msgAvatarPlaceholder: {
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '0.7rem',
  },

  messageBubble: {
    maxWidth: '60%',
    padding: '12px 16px',
    borderRadius: '12px',
    wordWrap: 'break-word',
  },

  ownMessage: {
    background: 'linear-gradient(135deg, #8B1538 0%, #6B0F1A 100%)',
    color: '#FFFFFF',
    borderBottomRightRadius: 4,
  },

  otherMessage: {
    background: 'rgba(0,0,0,0.06)',
    color: '#1a1a1a',
    borderBottomLeftRadius: 4,
  },

  messageText: {
    margin: 0,
    fontSize: '0.95rem',
    lineHeight: 1.4,
  },

  messageTime: {
    margin: '4px 0 0',
    fontSize: '0.75rem',
    opacity: 0.7,
  },

  noMessages: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },

  noMessagesText: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1a1a1a',
  },

  noMessagesSub: {
    margin: 0,
    fontSize: '0.85rem',
    color: '#999',
  },

  inputArea: {
    padding: '16px 24px',
    borderTop: '1px solid rgba(0,0,0,0.06)',
    background: '#FFFFFF',
  },

  errorMsg: {
    padding: '8px 12px',
    borderRadius: 8,
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#dc2626',
    fontSize: '0.85rem',
    marginBottom: '12px',
  },

  inputWrapper: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-end',
  },

  textarea: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: 10,
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    resize: 'none',
    maxHeight: '100px',
    outline: 'none',
    transition: 'all 0.2s',
    color: '#1a1a1a',
  },

  sendBtn: {
    width: 40,
    height: 40,
    border: 'none',
    background: 'linear-gradient(135deg, #8B1538 0%, #6B0F1A 100%)',
    color: '#FFFFFF',
    borderRadius: 10,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    flexShrink: 0,
  },

  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    color: '#999',
  },

  emptyTitle: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#1a1a1a',
  },

  emptySub: {
    margin: 0,
    fontSize: '0.9rem',
  },
};
