import { createContext, useState, useEffect, useContext } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import API from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Token refresh function
  const setupTokenRefresh = (firebaseUser) => {
    if (window.tokenRefreshInterval) {
      clearInterval(window.tokenRefreshInterval);
    }
    
    if (firebaseUser) {
      window.tokenRefreshInterval = setInterval(async () => {
        try {
          const freshToken = await firebaseUser.getIdToken(true);
          localStorage.setItem('token', freshToken);
          console.log('🔄 Token refreshed automatically');
        } catch (error) {
          console.error('Failed to refresh token:', error);
        }
      }, 50 * 60 * 1000); // 50 minutes
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        localStorage.setItem('token', token);
        
        // Setup auto token refresh
        setupTokenRefresh(firebaseUser);
        
        // Get user from backend
        try {
          const res = await API.post('/auth/login', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const userData = res.data.user;
          localStorage.setItem('udhaari_user', JSON.stringify(userData));
          setUser(userData);
        } catch (err) {
          console.error('Auth error:', err);
          setUser(null);
        }
      } else {
        if (window.tokenRefreshInterval) {
          clearInterval(window.tokenRefreshInterval);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('udhaari_user');
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (window.tokenRefreshInterval) {
        clearInterval(window.tokenRefreshInterval);
      }
    };
  }, []);

  const logout = async () => {
    const auth = getAuth();
    await auth.signOut();
    if (window.tokenRefreshInterval) {
      clearInterval(window.tokenRefreshInterval);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('udhaari_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
