import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, Rectangle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LAHORE_AREAS, LAHORE_CENTER, LAHORE_ZOOM, LAHORE_BOUNDS, findNearestArea, isWithinLahore } from '../data/lahoreAreas';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const pinIcon = L.divIcon({
  html: `<div style="
    width: 28px; height: 28px;
    background: linear-gradient(135deg, #800020, #5C0018);
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid #F4A020;
    box-shadow: 0 4px 12px rgba(128,0,32,0.4);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  className: 'location-pin',
});

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapBounds() {
  const map = useMap();
  useEffect(() => {
    map.setMaxBounds(LAHORE_BOUNDS);
    map.setMinZoom(11);
  }, [map]);
  return null;
}

function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], 14);
  }, [lat, lng, map]);
  return null;
}

const C = {
  maroon: '#800020',
  saffron: '#F4A020',
  textMuted: '#6B4C3B',
  textFaint: '#A68070',
  border: 'rgba(128,0,32,0.12)',
  warmWhite: '#FFF9F0',
};

export default function LocationPickerMap({
  area = '',
  lat = null,
  lng = null,
  onChange,
  height = 320,
  error = '',
}) {
  const [search, setSearch] = useState(area || '');
  const position = useMemo(() => {
    if (lat && lng) return [lat, lng];
    return null;
  }, [lat, lng]);

  const handlePick = (pickedLat, pickedLng) => {
    if (!isWithinLahore(pickedLat, pickedLng)) return;
    const nearest = findNearestArea(pickedLat, pickedLng);
    setSearch(nearest.name);
    onChange?.({
      area: nearest.name,
      lat: pickedLat,
      lng: pickedLng,
      city: 'Lahore',
    });
  };

  const handleAreaSelect = (e) => {
    const name = e.target.value;
    const found = LAHORE_AREAS.find((a) => a.name === name);
    if (!found) return;
    setSearch(name);
    onChange?.({
      area: found.name,
      lat: found.lat,
      lng: found.lng,
      city: 'Lahore',
    });
  };

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <label style={{
        display: 'block',
        fontSize: '0.72rem',
        fontWeight: 700,
        color: C.textFaint,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        marginBottom: '0.5rem',
      }}>
        Pick your area on the map *
      </label>

      <select
        value={search}
        onChange={handleAreaSelect}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          borderRadius: 10,
          border: `1.5px solid ${error ? '#FCA5A5' : C.border}`,
          marginBottom: '0.5rem',
          fontFamily: "'Outfit', sans-serif",
          fontSize: '0.9rem',
          background: C.warmWhite,
        }}
      >
        <option value="">Select a Lahore neighborhood…</option>
        {LAHORE_AREAS.map((a) => (
          <option key={a.name} value={a.name}>{a.name}</option>
        ))}
      </select>

      <div style={{
        height,
        borderRadius: 12,
        overflow: 'hidden',
        border: `2px solid ${error ? '#EF4444' : position ? C.saffron : C.border}`,
        boxShadow: position ? '0 4px 20px rgba(244,160,32,0.2)' : 'none',
      }}>
        <MapContainer
          center={position || LAHORE_CENTER}
          zoom={position ? 14 : LAHORE_ZOOM}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <Rectangle
            bounds={LAHORE_BOUNDS}
            pathOptions={{ color: C.maroon, weight: 1, fillOpacity: 0.02, dashArray: '6' }}
          />
          <MapBounds />
          <MapClickHandler onPick={handlePick} />
          {position && (
            <>
              <Marker position={position} icon={pinIcon} />
              <Recenter lat={position[0]} lng={position[1]} />
            </>
          )}
        </MapContainer>
      </div>

      <p style={{ fontSize: '0.75rem', color: C.textMuted, marginTop: '0.5rem', lineHeight: 1.5 }}>
        Tap the map or choose an area above. Your pin must be inside Lahore.
        {position && (
          <span style={{ display: 'block', marginTop: 4, color: C.maroon, fontWeight: 600 }}>
            📍 {search || area} — {position[0].toFixed(4)}, {position[1].toFixed(4)}
          </span>
        )}
      </p>
      {error && (
        <p style={{ fontSize: '0.78rem', color: '#991B1B', marginTop: '0.35rem', fontWeight: 600 }}>{error}</p>
      )}
    </div>
  );
}
