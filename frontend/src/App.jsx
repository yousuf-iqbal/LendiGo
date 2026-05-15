import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MenuLauncher from './components/Menulauncher';
import { MapProvider } from './context/MapContext';
import MapSidebar from './components/MapSidebar';
import AuthPage from './pages/AuthPage';
import CompleteProfile from './pages/CompleteProfile';
import WalletDashboard from './pages/WalletDashboard';
import EditAssetPage from './pages/EditAssetPage';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import BrowsePage from './pages/BrowsePage';
import AvailableRequestsPage from './pages/AvailableRequestsPage';
import RequestDetailPage from './pages/RequestDetailPage';
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
import AdminMessagesPage from './pages/AdminMessagesPage';
import AdminDisputesPage from './pages/AdminDisputesPage';
import ReviewsPage from './pages/ReviewsPage';
import ChatPage from './pages/ChatPage';
import HelpCorner from './components/HelpCorner';
import GlobalBackground from './components/GlobalBackground';
import BlobCursor from './components/BlobCursor';
import './components/BlobCursor.css';

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

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const role = getStoredRole();

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MapProvider>
          <div className="App">
           <style>{`* { cursor: none !important; }`}</style>
  
 <BlobCursor

/> <MenuLauncher /> 
  
  <GlobalBackground />
            <Navbar />
            <div className="page-wrapper">
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/login" element={<Navigate to="/auth" replace />} />
                <Route path="/signup" element={<Navigate to="/auth" replace />} />
                <Route path="/complete-profile" element={<CompleteProfile />} />
                <Route path="/" element={<HomePage />} />
                <Route path="/browse" element={<BrowsePage />} />
                <Route path="/requests" element={<AvailableRequestsPage />} />
                <Route path="/requests/:id" element={<RequestDetailPage />} />
                <Route path="/my-offers" element={<ProtectedRoute><MyOffersPage /></ProtectedRoute>} />
                <Route path="/my-offers-made" element={<ProtectedRoute><MyOutgoingOffersPage /></ProtectedRoute>} />
                <Route path="/edit-request/:id" element={<ProtectedRoute><EditRequestPage /></ProtectedRoute>} />
                <Route path="/post-request" element={<ProtectedRoute><PostRequestPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/my-assets" element={<ProtectedRoute><MyAssetsPage /></ProtectedRoute>} />
                <Route path="/my-assets/add" element={<ProtectedRoute><AddAssetPage /></ProtectedRoute>} />
                <Route path="/my-assets/edit/:id" element={<ProtectedRoute><EditAssetPage /></ProtectedRoute>} />
                <Route path="/assets/:id" element={<AssetDetailPage />} />
                <Route path="/bookings" element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />
                <Route path="/bookings/:bookingId/payment" element={<ProtectedRoute><PaymentReceiptPage /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/wallet" element={<ProtectedRoute><WalletDashboard /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/reviews/:userID" element={<ProtectedRoute><ReviewsPage /></ProtectedRoute>} />
                <Route path="/reviews" element={<ProtectedRoute><ReviewsPage /></ProtectedRoute>} />
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/messages" element={<AdminRoute><AdminMessagesPage /></AdminRoute>} />
                <Route path="/admin/disputes" element={<AdminRoute><AdminDisputesPage /></AdminRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <HelpCorner />
            <MapSidebar />
          </div>
        </MapProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;