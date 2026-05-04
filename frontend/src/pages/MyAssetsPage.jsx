import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function MyAssetsPage() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("udhaari_user") || "null");

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      // Fetch ALL user's assets (both active and inactive)
      const res = await API.get('/assets/my');
      const userAssets = res.data.filter(a => a.owner_id === (user?.UserID || user?.id));
      setAssets(userAssets);
    } catch (err) {
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (assetId, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 0 : 1;
    try {
      await API.patch(`/assets/${assetId}`, { isActive: newStatus });
      fetchAssets(); // Refresh the list
    } catch (err) {
      console.error('Error toggling asset:', err);
    }
  };

 const handleDelete = async (assetId) => {
  if (!window.confirm('Delete this asset permanently?')) return;
  try {
    await API.delete(`/assets/${assetId}`);
    fetchAssets(); // Refresh list on success
  } catch (err) {
    // ✅ Show the friendly error message from backend
    alert(err.response?.data?.error || 'Failed to delete asset.');
  }
};

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1f2937' }}>My Assets</h1>
          <button 
            onClick={() => navigate('/my-assets/add')}
            style={{ padding: '0.75rem 1.5rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
          >
            + Add Asset
          </button>
        </div>

        {assets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            You haven't listed any assets yet.
            <button 
              onClick={() => navigate('/my-assets/add')}
              style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              List Your First Asset
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {assets.map(a => (
              <div key={a.asset_id} style={{ 
                background: '#fff', 
                borderRadius: '12px', 
                overflow: 'hidden', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                opacity: a.availability_status === 'unavailable' ? 0.7 : 1
              }}>
                <div 
                  onClick={() => navigate(`/assets/${a.asset_id}`)}
                  style={{ 
                    height: '200px', 
                    background: a.primary_image ? `url(${a.primary_image})` : '#f3f4f6',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  {!a.primary_image && (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '3rem' }}>📦</div>
                  )}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: a.availability_status === 'available' ? 'rgba(5, 150, 105, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                    color: '#fff',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {a.availability_status === 'available' ? 'Available' : 'Unavailable'}
                  </div>
                </div>
                
                <div style={{ padding: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>{a.name}</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{a.location}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>Rs. {a.price_per_day}/day</span>
                  </div>
                  
                  {/* Owner Controls */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button 
                      onClick={() => navigate(`/my-assets/edit/${a.asset_id}`)}
                      style={{ flex: 1, padding: '0.5rem', background: '#dbeafe', color: '#1e40af', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleToggle(a.asset_id, a.availability_status)}
                      style={{ 
                        flex: 1, 
                        padding: '0.5rem', 
                        background: a.availability_status === 'available' ? '#fee2e2' : '#dcfce7', 
                        color: a.availability_status === 'available' ? '#dc2626' : '#16a34a', 
                        border: 'none', 
                        borderRadius: '6px', 
                        cursor: 'pointer' 
                      }}
                    >
                      {a.availability_status === 'available' ? 'Mark Unavailable' : 'Mark Available'}
                    </button>
                    <button 
                      onClick={() => handleDelete(a.asset_id)}
                      style={{ flex: 1, padding: '0.5rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}