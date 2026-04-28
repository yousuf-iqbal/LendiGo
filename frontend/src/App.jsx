// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Your pages
import AuthPage from './pages/AuthPage';
import CompleteProfile from './pages/CompleteProfile';
import WalletDashboard from './pages/WalletDashboard';

// Friend's pages (keep these imports)
import Navbar from './components/Navbar';
import BrowsePage from './pages/BrowsePage';
import RequestBoardPage from './pages/RequestBoardPage';
import RequestDetailPage from './pages/RequestDetailPage';
import MyRequestsPage from './pages/MyRequestsPage';
import EditRequestPage from './pages/EditRequestPage';
import ProfilePage from './pages/ProfilePage';
import HomePage from './pages/HomePage';
import PostRequestPage from './pages/PostRequestPage';
import AddAssetPage from './pages/AddAssetPage';
import MyAssetsPage from './pages/MyAssetsPage';
import AssetDetailPage from './pages/AssetDetailPage';
import MyBookingsPage from './pages/MyBookingsPage';
import HelpCorner from './components/HelpCorner';

import './App.css';

// ✅ LOOP-PROOF ProtectedRoute
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const storedUser = localStorage.getItem('udhaari_user');

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080810', color: '#fff' }}>
        Loading...
      </div>
    );
  }

  // Allow access if authenticated OR if we have stored user data
  if (user || storedUser) return children;

  // ✅ CRITICAL: Don't redirect if already on auth pages
  if (location.pathname === '/auth' || location.pathname === '/complete-profile') return children;

  return <Navigate to="/auth" replace />;
}

function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div style={{ minHeight: '100vh', background: '#080810', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', fontFamily: 'system-ui' }}>
      <h1 style={{ color: '#8b5cf6', fontSize: '2.5rem', fontWeight: 800 }}>Welcome, {user?.fullName || user?.FullName}!</h1>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem' }}>Your account is active 🎉</p>
      <button onClick={logout} style={{ padding: '0.75rem 2rem', background: '#8b5cf6', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem', marginTop: '1rem' }}>Logout</button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Navbar />
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            <Route path="/signup" element={<Navigate to="/auth" replace />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            
            {/* Friend's Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/requests" element={<RequestBoardPage />} />
            <Route path="/requests/:id" element={<RequestDetailPage />} />
            <Route path="/my-requests" element={<MyRequestsPage />} />
            <Route path="/edit-request/:id" element={<EditRequestPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/create-request" element={<PostRequestPage />} />
            <Route path="/requests/new" element={<PostRequestPage />} />
            <Route path="/post-request" element={<PostRequestPage />} />
            <Route path="/my-assets" element={<MyAssetsPage />} />
            <Route path="/my-assets/add" element={<AddAssetPage />} />
            <Route path="/assets/:id" element={<AssetDetailPage />} />
            <Route path="/bookings" element={<MyBookingsPage />} />
            
            {/* Your Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><WalletDashboard /></ProtectedRoute>} />
            
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
          <HelpCorner />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}