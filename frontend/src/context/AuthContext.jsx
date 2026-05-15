// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
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
          await firebaseUser.reload();
          if (!auth.currentUser?.emailVerified) {
            setUser(null); // Not verified yet
          } else {
            try {
              const res = await API.post('/auth/login');
              setUser(res.data.user);
              localStorage.setItem('udhaari_user', JSON.stringify(res.data.user));
            } catch (err) {
              // If backend says profile not found (404), keep Firebase auth alive
              // Don't set user=null here to avoid redirect loops
              if (err.response?.status !== 404) {
                setUser(null);
                localStorage.removeItem('udhaari_user');
                localStorage.removeItem('token');
              }
            }
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
        localStorage.removeItem('udhaari_user');
        localStorage.removeItem('token');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('token');
    localStorage.removeItem('udhaari_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, fbUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);