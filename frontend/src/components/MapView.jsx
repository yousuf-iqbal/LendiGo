import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LAHORE_CENTER } from '../data/lahoreAreas';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TYPE_COLORS = {
  request: { fill: '#800020', stroke: '#F4A020' },
  asset: { fill: '#1B6B3A', stroke: '#4ADE80' },
  offer: { fill: '#1E40AF', stroke: '#93C5FD' },
};

function createTypeIcon(type, isNew) {
  const colors = TYPE_COLORS[type] || TYPE_COLORS.request;
  return L.divIcon({
    html: `<div style="
      width: ${isNew ? 22 : 18}px;
      height: ${isNew ? 22 : 18}px;
      background: ${colors.fill};
      border-radius: 50%;
      border: 3px solid ${colors.stroke};
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      ${isNew ? 'animation: pulse-marker 1.5s infinite;' : ''}
    "></div>`,
    iconSize: [isNew ? 22 : 18, isNew ? 22 : 18],
    className: 'custom-marker',
  });
}

function MapCenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom || 13);
  }, [center, zoom, map]);
  return null;
}

function DensityLayer({ markers }) {
  const map = useMap();
  const layerRef = useRef(null);

  const heatPoints = useMemo(() => {
    const buckets = {};
    markers.forEach((m) => {
      const lat = m.lat || m.Lat;
      const lng = m.lng || m.Lng;
      if (!lat || !lng) return;
      const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
      buckets[key] = (buckets[key] || 0) + 1;
    });
    return Object.entries(buckets).map(([key, count]) => {
      const [lat, lng] = key.split(',').map(Number);
      return { lat, lng, count };
    });
  }, [markers]);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    const group = L.layerGroup();
    heatPoints.forEach(({ lat, lng, count }) => {
      const radius = Math.min(28, 10 + count * 6);
      const opacity = Math.min(0.45, 0.12 + count * 0.08);
      L.circle([lat, lng], {
        radius: radius * 35,
        fillColor: '#F4A020',
        fillOpacity: opacity,
        color: '#800020',
        weight: 1,
        opacity: 0.35,
      }).addTo(group);
    });
    group.addTo(map);
    layerRef.current = group;
    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [heatPoints, map]);

  return null;
}

function FitBounds({ markers }) {
  const map = useMap();
  useEffect(() => {
    const points = markers
      .map((m) => {
        const lat = m.lat || m.Lat;
        const lng = m.lng || m.Lng;
        return lat && lng ? [lat, lng] : null;
      })
      .filter(Boolean);
    if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 14 });
    } else if (points.length === 1) {
      map.setView(points[0], 14);
    }
  }, [markers, map]);
  return null;
}

export default function MapView({
  markers = [],
  requests,
  onMarkerClick,
  highlightedRequestId,
  showDensity = true,
}) {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const items = markers.length ? markers : (requests || []);

  const handleMarkerClick = (item) => {
    if (onMarkerClick) {
      onMarkerClick(item);
      return;
    }
    const type = item.markerType || 'request';
    if (type === 'asset') navigate(`/assets/${item.id || item._id}`);
    else navigate(`/requests/${item.id || item._id}`);
  };

  const typeLabel = (type) => {
    if (type === 'asset') return 'Available asset';
    if (type === 'offer') return 'Active offer';
    return 'Open request';
  };

  return (
    <MapContainer
      center={LAHORE_CENTER}
      zoom={12}
      style={{ height: '100%', width: '100%', borderRadius: '12px' }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; OSM &copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />

      {showDensity && <DensityLayer markers={items} />}
      <FitBounds markers={items} />

      {items.map((item) => {
        const lat = item.lat || item.Lat;
        const lng = item.lng || item.Lng;
        if (!lat || !lng) return null;

        const id = item.id || item._id;
        const type = item.markerType || 'request';
        const isHighlighted = highlightedRequestId === id;
        const isNew = item.isNew;

        return (
          <Marker
            key={`${type}-${id}`}
            position={[lat, lng]}
            zIndexOffset={isHighlighted ? 1000 : type === 'request' ? 300 : 200}
            eventHandlers={{ click: () => handleMarkerClick(item) }}
            icon={createTypeIcon(type, isNew)}
          >
            <Popup>
              <div style={{
                fontFamily: "'Outfit', sans-serif",
                padding: '4px 0',
                minWidth: '200px',
              }}>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: TYPE_COLORS[type]?.fill || '#800020',
                }}>
                  {typeLabel(type)}
                </span>
                <strong style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '1rem',
                  color: '#800020',
                  display: 'block',
                  margin: '4px 0',
                }}>
                  {item.title || item.itemName}
                </strong>
                {item.area && (
                  <p style={{ fontSize: '0.75rem', color: '#6B4C3B', margin: '4px 0' }}>
                    📍 {item.area}
                  </p>
                )}
                {(item.maxBudget || item.pricePerDay || item.offeredPrice) && (
                  <p style={{ fontSize: '0.75rem', color: '#F4A020', fontWeight: 600, margin: '4px 0' }}>
                    Rs. {(item.maxBudget || item.pricePerDay || item.offeredPrice).toLocaleString()}
                    {item.pricePerDay ? '/day' : ''}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => handleMarkerClick(item)}
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
                    width: '100%',
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
        const item = items.find((r) => (r.id || r._id) === highlightedRequestId);
        if (item?.lat && item?.lng) {
          return <MapCenter center={[item.lat, item.lng]} zoom={15} />;
        }
        return null;
      })()}
    </MapContainer>
  );
}
