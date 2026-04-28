// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import API from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [fbUser, setFbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFbUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Force reload to ensure emailVerified is fresh
          await firebaseUser.reload();
          
          // Try to login to backend to get profile
          const res = await API.post('/auth/login');
          setUser(res.data.user);
          
          // Keep localStorage in sync
          localStorage.setItem('udhaari_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.error("Auto-login failed:", err);
          
          // If profile not found (404), check for pending registration
          if (err.response?.status === 404) {
            const pending = localStorage.getItem('udhaari_pending_profile');
            if (pending) {
              try {
                const data = JSON.parse(pending);
                const form = new FormData();
                Object.entries(data).forEach(([k, v]) => { if (v) form.append(k, v); });
                await API.post('/auth/register', form);
                localStorage.removeItem('udhaari_pending_profile');
                
                // Retry login
                const loginRes = await API.post('/auth/login');
                setUser(loginRes.data.user);
              } catch {
                setUser(null);
              }
            } else {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
      } else {
        // ✅ CRITICAL: Firebase says no user. Clear stale storage and state.
        setUser(null);
        localStorage.removeItem('udhaari_user');
        localStorage.removeItem('token');
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, fbUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);