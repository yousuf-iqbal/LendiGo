import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import BrowsePage from './pages/BrowsePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import RequestBoardPage from './pages/RequestBoardPage';
import RequestDetailPage from './pages/RequestDetailPage';
import MyRequestsPage from './pages/MyRequestsPage';
import EditRequestPage from './pages/EditRequestPage';
import ProfilePage from './pages/ProfilePage';
import HomePage from './pages/HomePage';
import PostRequestPage from './pages/PostRequestPage';
// NEW IMPORTS
import AddAssetPage from './pages/AddAssetPage';
import MyAssetsPage from './pages/MyAssetsPage';
import AssetDetailPage from './pages/AssetDetailPage';
import MyBookingsPage from './pages/MyBookingsPage';
import HelpCorner from './components/HelpCorner';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/requests" element={<RequestBoardPage />} />
          <Route path="/requests/:id" element={<RequestDetailPage />} />
          <Route path="/my-requests" element={<MyRequestsPage />} />
          <Route path="/edit-request/:id" element={<EditRequestPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/create-request" element={<PostRequestPage />} />
          <Route path="/requests/new" element={<PostRequestPage />} />
          
          {/* NEW ROUTES */}
          <Route path="/my-assets" element={<MyAssetsPage />} />
          <Route path="/my-assets/add" element={<AddAssetPage />} />
          <Route path="/assets/:id" element={<AssetDetailPage />} />
          <Route path="/bookings" element={<MyBookingsPage />} />
       


                  <Route path="/post-request" element={<PostRequestPage />} />
        </Routes>
        <HelpCorner />
      </div>
    </Router>
  );
}

export default App;
