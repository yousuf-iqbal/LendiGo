import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useRef } from 'react';
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

// Custom animated marker for new requests
const createAnimatedIcon = () => {
  return L.divIcon({
    html: `<div style="
      width: 20px;
      height: 20px;
      background: #800020;
      border-radius: 50%;
      border: 3px solid #F4A020;
      box-shadow: 0 0 0 0 rgba(128,0,32,0.7);
      animation: pulse-marker 1.5s infinite;
    "></div>`,
    iconSize: [20, 20],
    className: 'custom-marker'
  });
};

// Component to center map on marker
function MapCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
}

export default function MapView({ requests, onMarkerClick, highlightedRequestId }) {
  const navigate = useNavigate();
  const lahoreCenter = [31.5204, 74.3587];
  const mapRef = useRef(null);

  const handleMarkerClick = (request) => {
    if (onMarkerClick) {
      onMarkerClick(request);
    } else {
      navigate(`/requests/${request._id || request.id}`);
    }
  };

  return (
    <MapContainer
      center={lahoreCenter}
      zoom={12}
      style={{ height: '100%', width: '100%', borderRadius: '12px' }}
      ref={mapRef}
    >
      {/* English-only tile layer - no Urdu labels */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {requests.map((req) => {
        const lat = req.lat || req.Lat;
        const lng = req.lng || req.Lng;
        if (!lat || !lng) return null;
        
        const isHighlighted = highlightedRequestId === (req._id || req.id);
        const isNew = req.isNew;
        
        return (
          <Marker
            key={req._id || req.id}
            position={[lat, lng]}
            eventHandlers={{
              click: () => handleMarkerClick(req),
            }}
            icon={isNew ? createAnimatedIcon() : undefined}
          >
            <Popup>
              <div style={{ 
                fontFamily: "'Outfit', sans-serif", 
                padding: '4px 0',
                minWidth: '180px'
              }}>
                <strong style={{ 
                  fontFamily: "'Cormorant Garamond', serif", 
                  fontSize: '1rem', 
                  color: '#800020',
                  display: 'block',
                  marginBottom: '4px'
                }}>
                  {req.title || req.itemName}
                </strong>
                {req.area && (
                  <p style={{ fontSize: '0.75rem', color: '#6B4C3B', margin: '4px 0' }}>
                    📍 {req.area}
                  </p>
                )}
                {req.maxBudget && (
                  <p style={{ fontSize: '0.75rem', color: '#F4A020', fontWeight: 600, margin: '4px 0' }}>
                    Rs. {req.maxBudget.toLocaleString()}
                  </p>
                )}
                <button
                  onClick={() => handleMarkerClick(req)}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    background: '#800020',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
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
        );
      })}
      
      {highlightedRequestId && (() => {
        const req = requests.find(r => (r._id || r.id) === highlightedRequestId);
        if (req && req.lat && req.lng) {
          return <MapCenter center={[req.lat, req.lng]} />;
        }
        return null;
      })()}
    </MapContainer>
  );
}