import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const MapContext = createContext();

let socket;
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function MapProvider({ children }) {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [newRequestPulse, setNewRequestPulse] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  const fetchMarkers = useCallback(async () => {
    try {
      const res = await fetch(`${SOCKET_URL}/api/map/markers`);
      const data = await res.json();
      setMarkers(data.filter((m) => m.lat && m.lng));
    } catch (err) {
      console.error('Failed to fetch map markers:', err);
    }
  }, []);

  useEffect(() => {
    socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log('Socket connected for map');
    });

    socket.on('new_request', (newReq) => {
      if (newReq.lat && newReq.lng) {
        setMarkers((prev) => {
          const id = newReq.id || newReq._id;
          if (prev.some((m) => (m.id || m._id) === id && m.markerType === 'request')) {
            return prev;
          }
          return [...prev, { ...newReq, markerType: 'request', isNew: true }];
        });
      }

      const id = newReq.id || newReq._id;
      setNewRequestPulse(id);
      setTimeout(() => setNewRequestPulse(null), 3000);

      setRecentActivity((prev) => [
        {
          id,
          title: newReq.title || newReq.itemName,
          area: newReq.area,
          markerType: 'request',
          timestamp: new Date(),
          isNew: true,
        },
        ...prev,
      ].slice(0, 15));

      setTimeout(() => {
        setMarkers((prev) => prev.map((m) =>
          (m.id === id || m._id === id) ? { ...m, isNew: false } : m
        ));
        setRecentActivity((prev) => prev.map((a) =>
          a.id === id ? { ...a, isNew: false } : a
        ));
      }, 3000);
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchMarkers();
    const interval = setInterval(fetchMarkers, 60000);
    return () => clearInterval(interval);
  }, [fetchMarkers]);

  const toggleMap = () => setIsMapOpen(!isMapOpen);
  const closeMap = () => setIsMapOpen(false);

  const requests = markers.filter((m) => m.markerType === 'request');

  return (
    <MapContext.Provider value={{
      isMapOpen,
      toggleMap,
      closeMap,
      markers,
      requests,
      newRequestPulse,
      recentActivity,
      setRecentActivity,
      refreshMap: fetchMarkers,
    }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
}
