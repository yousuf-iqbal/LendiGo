import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const C = {
  maroon: "#800020",
  saffron: "#F4A020",
  maroonDeep: "#5C0018",
  cream: "#FDF6EC",
  textDark: "#2C1810",
  textMuted: "#6B4C3B",
};

// Custom marker icon
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Component to handle map bounds when expanded
function MapBounds({ requests, isExpanded }) {
  const map = useMap();
  
  useEffect(() => {
    if (isExpanded && requests.length > 0) {
      const validRequests = requests.filter(r => r.lat && r.lng);
      if (validRequests.length > 0) {
        const bounds = L.latLngBounds(validRequests.map(r => [r.lat, r.lng]));
        map.flyToBounds(bounds, { padding: [50, 50], duration: 0.6 });
      } else {
        map.setView([31.5204, 74.3587], 12);
      }
    }
  }, [isExpanded, requests, map]);
  
  return null;
}

export default function HomeMapWidget({ requests }) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const timeoutRef = useRef(null);
  const lahoreCenter = [31.5204, 74.3587];

  const validRequests = requests.filter(r => r.lat && r.lng);

  const handleMarkerClick = (requestId) => {
    navigate(`/requests/${requestId}`);
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovering(true);
    setTimeout(() => setIsExpanded(true), 100);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    timeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 400);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'fixed',
        bottom: '100px',
        right: '24px',
        zIndex: 998,
        transition: 'all 0.5s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
      }}
    >
      <div
        style={{
          width: isExpanded ? '550px' : '260px',
          height: isExpanded ? '550px' : '150px',
          borderRadius: isExpanded ? '20px' : '12px',
          overflow: 'hidden',
          boxShadow: isExpanded 
            ? '0 25px 50px rgba(0,0,0,0.3), 0 0 0 3px rgba(244,160,32,0.4)'
            : '0 4px 15px rgba(128,0,32,0.15), 0 0 0 1px rgba(244,160,32,0.25)',
          transition: 'all 0.5s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
          background: '#e8e4dc',
          cursor: 'pointer',
        }}
      >
        {/* Header */}
        {(isExpanded || isHovering) && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              background: `linear-gradient(135deg, ${C.maroon}, ${C.maroonDeep})`,
              color: '#fff',
              padding: isExpanded ? '12px 20px' : '6px 12px',
              zIndex: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: isExpanded ? '20px 20px 0 0' : '12px 12px 0 0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width={isExpanded ? "18" : "12"} height={isExpanded ? "18" : "12"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span style={{ fontSize: isExpanded ? '13px' : '9px', fontWeight: 600 }}>
                {isExpanded ? 'Active Requests Map' : `${validRequests.length} Nearby`}
              </span>
            </div>
            {isExpanded && (
              <span style={{ fontSize: '9px', opacity: 0.8, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '20px' }}>
                Hover out to minimize
              </span>
            )}
          </div>
        )}

        {/* Map Container - Single reliable tile layer */}
        <MapContainer
          key={isExpanded ? 'expanded' : 'collapsed'}
          center={lahoreCenter}
          zoom={12}
          style={{
            height: '100%',
            width: '100%',
            cursor: 'grab',
            background: '#c8e0e0',
          }}
          zoomControl={isExpanded}
          dragging={isExpanded}
          scrollWheelZoom={isExpanded}
          doubleClickZoom={isExpanded}
          touchZoom={isExpanded}
          attributionControl={false}
        >
          <MapBounds requests={validRequests} isExpanded={isExpanded} />
          
          {/* Single Tile Layer - Google Maps style (English labels) */}
          <TileLayer
            url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            maxZoom={20}
            attribution=""
          />
          
          {validRequests.map((req) => (
            <Marker
              key={req._id || req.id}
              position={[req.lat, req.lng]}
              icon={customIcon}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation();
                },
              }}
            >
              <Popup>
                <div style={{ 
                  fontFamily: "'Outfit', sans-serif", 
                  padding: '6px',
                  minWidth: '160px',
                  textAlign: 'center'
                }}>
                  <strong style={{ 
                    fontFamily: "'Cormorant Garamond', serif", 
                    fontSize: '0.9rem', 
                    color: C.maroon,
                    display: 'block',
                    marginBottom: '6px'
                  }}>
                    {req.title || req.itemName}
                  </strong>
                  {req.area && (
                    <p style={{ fontSize: '0.7rem', color: C.textMuted, margin: '4px 0' }}>
                      📍 {req.area}
                    </p>
                  )}
                  <button
                    onClick={() => handleMarkerClick(req._id || req.id)}
                    style={{
                      marginTop: '8px',
                      padding: '4px 12px',
                      background: C.maroon,
                      color: '#fff',
                      border: 'none',
                      borderRadius: '16px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    View Details →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Preview overlay when minimized */}
        {!isExpanded && !isHovering && validRequests.length > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(128,0,32,0.85)',
              color: '#fff',
              padding: '3px 6px',
              fontSize: '8px',
              textAlign: 'center',
              backdropFilter: 'blur(8px)',
              zIndex: 20,
              borderRadius: '0 0 12px 12px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span style={{ 
              width: '5px', 
              height: '5px', 
              background: C.saffron, 
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'pulse-dot 1.5s infinite'
            }} />
            {validRequests.length} active requests
          </div>
        )}
      </div>
    </div>
  );
}