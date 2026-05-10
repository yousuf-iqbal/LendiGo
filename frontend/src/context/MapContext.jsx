import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const MapContext = createContext();

// Socket connection
let socket;
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function MapProvider({ children }) {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [newRequestPulse, setNewRequestPulse] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  // Initialize socket connection
  useEffect(() => {
    socket = io(SOCKET_URL);
    
    socket.on('connect', () => {
      console.log('🔌 Socket connected');
    });
    
    socket.on('new_request', (newReq) => {
      console.log('📡 New request received:', newReq);
      
      // Add to requests if it has location
      if (newReq.lat && newReq.lng) {
        setRequests(prev => [...prev, { ...newReq, isNew: true }]);
      }
      
      // Trigger pulse effect
      setNewRequestPulse(newReq._id || newReq.id);
      setTimeout(() => setNewRequestPulse(null), 3000);
      
      // Add to recent activity
      setRecentActivity(prev => [
        { 
          id: newReq._id || newReq.id, 
          title: newReq.title || newReq.itemName,
          area: newReq.area,
          timestamp: new Date(),
          isNew: true 
        },
        ...prev
      ].slice(0, 10));
      
      // Remove isNew flag after 3 seconds
      setTimeout(() => {
        setRequests(prev => prev.map(r => 
          (r._id === newReq._id || r.id === newReq.id) ? { ...r, isNew: false } : r
        ));
        setRecentActivity(prev => prev.map(a => 
          a.id === (newReq._id || newReq.id) ? { ...a, isNew: false } : a
        ));
      }, 3000);
    });
    
    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  // Fetch existing requests with locations
  useEffect(() => {
    const fetchRequestsWithLocation = async () => {
      try {
        const res = await fetch(`${SOCKET_URL}/api/requests?hasLocation=true`);
        const data = await res.json();
        setRequests(data.filter(r => r.lat && r.lng));
      } catch (err) {
        console.error('Failed to fetch requests with location:', err);
      }
    };
    fetchRequestsWithLocation();
  }, []);

  const toggleMap = () => setIsMapOpen(!isMapOpen);
  const closeMap = () => setIsMapOpen(false);

  return (
    <MapContext.Provider value={{
      isMapOpen,
      toggleMap,
      closeMap,
      requests,
      newRequestPulse,
      recentActivity,
      setRecentActivity
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