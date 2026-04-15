// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import CompleteProfile from './pages/CompleteProfile';
function HomePage() {
  // const { user } = useAuth(); // No longer needed
  
  return (
    <div style={{
      minHeight: '100vh', background: '#080810', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '1rem', fontFamily: 'system-ui',
    }}>
      <h1 style={{ color: '#8b5cf6', fontSize: '2.5rem', fontWeight: 800 }}>
        Welcome to Udhaari
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem' }}>
        Your account is active 🎉
      </p>
      <button onClick={() => {
        import('firebase/auth').then(({ getAuth, signOut }) => {
          signOut(getAuth());
          localStorage.removeItem('udhaari_user');
          localStorage.removeItem('udhaari_pending_profile');
          localStorage.removeItem('udhaari_pending_email');
          window.location.href = '/auth';
        });
      }} style={{
        padding: '0.75rem 2rem', background: '#8b5cf6',
        border: 'none', borderRadius: '12px', color: '#fff',
        fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem',
        marginTop: '1rem',
      }}>
        Logout
      </button>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  // ✅ Check localStorage directly as fallback
  const storedUser = localStorage.getItem('udhaari_user');
  
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#080810', color: '#fff'
      }}>
        Loading...
      </div>
    );
  }
  
  // ✅ Check both context user AND localStorage
  if (user || storedUser) {
    return children;
  }
  
  return <Navigate to="/auth" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/signup" element={<Navigate to="/auth" replace />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/" element={
            <ProtectedRoute><HomePage /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}