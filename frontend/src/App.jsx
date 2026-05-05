import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import AuthPage from './pages/AuthPage';
import CompleteProfile from './pages/CompleteProfile';
import WalletDashboard from './pages/WalletDashboard';
import EditAssetPage from './pages/EditAssetPage';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import BrowsePage from './pages/BrowsePage';
import AvailableRequestsPage from './pages/AvailableRequestsPage';
import RequestDetailPage from './pages/RequestDetailPage';
import MyRequestsPage from './pages/MyRequestsPage';
import MyOffersPage from './pages/MyOffersPage';
import MyOutgoingOffersPage from './pages/MyOutgoingOffersPage';
import EditRequestPage from './pages/EditRequestPage';
import ProfilePage from './pages/ProfilePage';
import HomePage from './pages/HomePage';
import PostRequestPage from './pages/PostRequestPage';
import AddAssetPage from './pages/AddAssetPage';
import MyAssetsPage from './pages/MyAssetsPage';
import AssetDetailPage from './pages/AssetDetailPage';
import MyBookingsPage from './pages/MyBookingsPage';
import PaymentReceiptPage from './pages/PaymentReceiptPage';
import AdminDashboard from './pages/AdminDashboard';
import HelpCorner from './components/HelpCorner';
import Aurora from './components/Aurora';  // ✅ ADD THIS IMPORT

import './App.css';

function getStoredRole() {
  try {
    const u = JSON.parse(localStorage.getItem('udhaari_user') || 'null');
    return u?.Role || u?.role || 'user';
  } catch {
    return 'user';
  }
}

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

  if (user || storedUser) return children;
  if (location.pathname === '/auth' || location.pathname === '/complete-profile') return children;

  return <Navigate to="/auth" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const storedUser = localStorage.getItem('udhaari_user');
  const role = getStoredRole();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080810', color: '#fff' }}>
        Loading...
      </div>
    );
  }

  if (!user && !storedUser) return <Navigate to="/auth" replace />;
  if (role !== 'admin') return <Navigate to="/" replace />;

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App" style={{ position: 'relative', minHeight: '100vh' }}>
          {/* ✅ Add Aurora Background here */}
          <Aurora
            colorStops={["#F4A020", "#800020", "#C4956A"]}  // Lendigo theme: saffron, maroon, brown
            amplitude={0.8}
            blend={0.6}
            speed={0.7}
          />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Navbar />
            <div className="page-wrapper">
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/login" element={<Navigate to="/auth" replace />} />
                <Route path="/signup" element={<Navigate to="/auth" replace />} />
                <Route path="/complete-profile" element={<CompleteProfile />} />

                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/browse" element={<BrowsePage />} />

                {/* Request Routes */}
                <Route path="/requests" element={<AvailableRequestsPage />} />
                <Route path="/requests/:id" element={<RequestDetailPage />} />
                <Route path="/my-requests" element={<ProtectedRoute><MyRequestsPage /></ProtectedRoute>} />
                <Route path="/my-offers" element={<ProtectedRoute><MyOffersPage /></ProtectedRoute>} />
                <Route path="/my-offers-made" element={<ProtectedRoute><MyOutgoingOffersPage /></ProtectedRoute>} />
                <Route path="/edit-request/:id" element={<ProtectedRoute><EditRequestPage /></ProtectedRoute>} />
                <Route path="/post-request" element={<ProtectedRoute><PostRequestPage /></ProtectedRoute>} />

                {/* Profile & Assets */}
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/my-assets" element={<ProtectedRoute><MyAssetsPage /></ProtectedRoute>} />
                <Route path="/my-assets/add" element={<ProtectedRoute><AddAssetPage /></ProtectedRoute>} />
                <Route path="/my-assets/edit/:id" element={<ProtectedRoute><EditAssetPage /></ProtectedRoute>} />
                <Route path="/assets/:id" element={<AssetDetailPage />} />

                {/* Bookings & Payments */}
                <Route path="/bookings" element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />
                <Route path="/bookings/:bookingId/payment" element={<ProtectedRoute><PaymentReceiptPage /></ProtectedRoute>} />

                {/* Dashboard & Wallet */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/wallet" element={<ProtectedRoute><WalletDashboard /></ProtectedRoute>} />

                {/* Admin — protected, admin-only */}
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <HelpCorner />
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}