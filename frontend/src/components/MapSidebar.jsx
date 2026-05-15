import { useState, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMap } from '../context/MapContext';

const MapView = lazy(() => import('./MapView'));

const C = {
  saffron: "#F4A020",
  saffronDark: "#E08800",
  maroon: "#800020",
  maroonL: "#B00030",
  maroonDeep: "#5C0018",
  cream: "#FDF6EC",
  warmWhite: "#FFF9F0",
  textDark: "#2C1810",
  textMuted: "#6B4C3B",
  textFaint: "#A68070",
  border: "rgba(128,0,32,0.12)",
};

export default function MapSidebar() {
  const { isMapOpen, toggleMap, closeMap, markers, requests, newRequestPulse, recentActivity } = useMap();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('map');
  const [highlightedRequest, setHighlightedRequest] = useState(null);
  
  const isHomePage = location.pathname === '/';

  const handleRequestClick = (requestId) => {
    closeMap();
    navigate(`/requests/${requestId}`);
  };

  const handleMarkerClick = (request) => {
    setActiveTab('activity');
    setHighlightedRequest(request._id || request.id);
    setTimeout(() => setHighlightedRequest(null), 3000);
  };

  return (
    <>
      {/* Toggle Button - Hide on homepage since HomeMapWidget handles it */}
      {!isHomePage && (
        <button
          onClick={toggleMap}
          style={{
            position: 'fixed',
            right: '24px',
            bottom: '100px',
            zIndex: 999,
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${C.maroon}, ${C.maroonDeep})`,
            border: `2px solid ${C.saffron}`,
            boxShadow: '0 4px 20px rgba(128,0,32,0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 28px rgba(244,160,32,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(128,0,32,0.3)';
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F4A020" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </button>
      )}

      {/* Sidebar Panel - only show if not on homepage and map is open */}
      {(isMapOpen && !isHomePage) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '420px',
            height: '100vh',
            background: C.warmWhite,
            boxShadow: '-4px 0 32px rgba(0,0,0,0.15)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            borderLeft: `1px solid ${C.border}`,
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '1rem 1.25rem',
            background: C.maroon,
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <h3 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '1.3rem',
              fontWeight: 700,
              margin: 0,
            }}>
              Lahore Activity Map
            </h3>
            <button
              onClick={closeMap}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '8px',
                padding: '6px',
                cursor: 'pointer',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '2px',
            padding: '0.75rem 1rem',
            background: C.cream,
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
          }}>
            <button
              onClick={() => setActiveTab('map')}
              style={{
                flex: 1,
                padding: '0.5rem',
                background: activeTab === 'map' ? C.maroon : 'transparent',
                color: activeTab === 'map' ? '#fff' : C.textMuted,
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Map View
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              style={{
                flex: 1,
                padding: '0.5rem',
                background: activeTab === 'activity' ? C.maroon : 'transparent',
                color: activeTab === 'activity' ? '#fff' : C.textMuted,
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Live Feed
              {newRequestPulse && (
                <span style={{
                  width: '8px',
                  height: '8px',
                  background: C.saffron,
                  borderRadius: '50%',
                  animation: 'pulse-dot 1s infinite',
                }} />
              )}
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
            {activeTab === 'map' ? (
              <Suspense fallback={
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="spinner" />
                  <p style={{ color: C.textMuted, marginTop: '1rem' }}>Loading map...</p>
                </div>
              }>
                <div style={{ height: '400px', borderRadius: '12px', overflow: 'hidden' }}>
                  <MapView
                    markers={markers}
                    onMarkerClick={handleMarkerClick}
                    highlightedRequestId={highlightedRequest}
                    showDensity
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.75rem', fontSize: '0.68rem' }}>
                  <span style={{ color: '#800020' }}>● {requests.length} requests</span>
                  <span style={{ color: '#1B6B3A' }}>● {markers.filter(m => m.markerType === 'asset').length} assets</span>
                  <span style={{ color: '#1E40AF' }}>● {markers.filter(m => m.markerType === 'offer').length} offers</span>
                </div>
                <p style={{ fontSize: '0.7rem', color: C.textFaint, textAlign: 'center', marginTop: '0.35rem' }}>
                  Orange glow = busier areas
                </p>
              </Suspense>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentActivity.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: C.textFaint }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p style={{ marginTop: '1rem' }}>No recent activity</p>
                  </div>
                ) : (
                  recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      onClick={() => handleRequestClick(activity.id)}
                      style={{
                        padding: '0.875rem',
                        background: activity.isNew ? C.saffronPale : C.cream,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        border: activity.isNew ? `1px solid ${C.saffron}` : `1px solid ${C.border}`,
                        transition: 'all 0.2s',
                        animation: activity.isNew ? 'pulse-card 0.6s ease-out' : 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.borderColor = C.maroon;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.borderColor = activity.isNew ? C.saffron : C.border;
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          background: activity.isNew ? C.saffron : '#9ca3af',
                          borderRadius: '50%',
                          animation: activity.isNew ? 'pulse-dot 1s infinite' : 'none',
                        }} />
                        <span style={{ fontSize: '0.7rem', color: C.textFaint }}>
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </span>
                        {activity.isNew && (
                          <span style={{ fontSize: '0.65rem', color: C.maroon, fontWeight: 700, marginLeft: 'auto' }}>
                            NEW
                          </span>
                        )}
                      </div>
                      <p style={{ fontWeight: 600, color: C.textDark, margin: 0, fontSize: '0.9rem' }}>
                        {activity.title}
                      </p>
                      {activity.area && (
                        <p style={{ fontSize: '0.75rem', color: C.textMuted, margin: '4px 0 0 0' }}>
                          📍 {activity.area}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '0.75rem 1rem',
            background: C.cream,
            borderTop: `1px solid ${C.border}`,
            fontSize: '0.7rem',
            color: C.textFaint,
            textAlign: 'center',
            flexShrink: 0,
          }}>
            Live updates from your community
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes pulse-marker {
          0% { box-shadow: 0 0 0 0 rgba(128,0,32,0.7); }
          70% { box-shadow: 0 0 0 15px rgba(128,0,32,0); }
          100% { box-shadow: 0 0 0 0 rgba(128,0,32,0); }
        }
        @keyframes pulse-dot {
          0% { box-shadow: 0 0 0 0 rgba(244,160,32,0.7); }
          70% { box-shadow: 0 0 0 8px rgba(244,160,32,0); }
          100% { box-shadow: 0 0 0 0 rgba(244,160,32,0); }
        }
        @keyframes pulse-card {
          0% { transform: scale(1); background: #FFF0CC; }
          50% { transform: scale(1.02); background: #FFE8B3; }
          100% { transform: scale(1); background: #FFF0CC; }
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid ${C.border};
          border-top-color: ${C.maroon};
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}