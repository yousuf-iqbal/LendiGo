import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './BrowsePage.css';

const CATEGORIES = ['All', 'Electronics', 'Tools', 'Party Supplies', 'Vehicles', 'Sports'];

const getCategoryImage = (category) => {
  const images = {
    'Electronics': 'https://cdn-icons-png.flaticon.com/512/1055/1055685.png',
    'Tools': 'https://cdn-icons-png.flaticon.com/512/2963/2963308.png',
    'Party Supplies': 'https://cdn-icons-png.flaticon.com/512/2963/2963198.png',
    'Vehicles': 'https://cdn-icons-png.flaticon.com/512/2963/2963201.png',
    'Sports': 'https://cdn-icons-png.flaticon.com/512/2963/2963206.png',
  };
  return images[category] || 'https://cdn-icons-png.flaticon.com/512/1055/1055685.png';
};

export default function BrowsePage() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const user = JSON.parse(localStorage.getItem("udhaari_user") || "null");

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/assets');
      setAssets(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (assetId, currentStatus) => {
    const token = localStorage.getItem('token');
    const newStatus = currentStatus === 'available' ? 0 : 1;
    try {
      await axios.patch(`http://localhost:5000/api/assets/${assetId}`, 
        { isActive: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAssets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (assetId) => {
    if (!window.confirm('Remove this asset?')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5000/api/assets/${assetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAssets();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let out = assets;
    if (category !== 'All') out = out.filter(a => a.category === category);
    if (search.trim()) out = out.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));
    setFiltered(out);
  }, [search, category, assets]);

  if (loading) return <div className="browse"><div className="browse__inner">Loading...</div></div>;

  return (
    <div className="browse">
      <div className="browse__inner">
        <div className="browse__header">
          <div>
            <h1 className="browse__title">Browse Items</h1>
            <p className="browse__subtitle">Find what you need from your community</p>
          </div>
          <button className="browse__post-btn" onClick={() => navigate('/post-request')}>
            + Post Request
          </button>
        </div>

        <div className="browse__search-wrap">
          <svg className="browse__search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="browse__search"
            placeholder="Search anything..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="browse__cats">
          {CATEGORIES.map(c => (
            <button
              key={c}
              className={`browse__cat ${category === c ? 'browse__cat--active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="browse__empty">
            <p>No items found. Try a different search or category.</p>
          </div>
        ) : (
          <div className="browse__grid">
            {filtered.map((a) => {
              const isOwner = user && (user.UserID === a.owner_id || user.id === a.owner_id);
              
              return (
                <div key={a.asset_id} className="browse__card">
                  <div className="browse__card-img" onClick={() => navigate(`/assets/${a.asset_id}`)}>
                    <img src={getCategoryImage(a.category)} alt={a.name} />
                    <span className="browse__card-category-badge">{a.category}</span>
                  </div>
                  <div className="browse__card-body">
                    <h3 className="browse__card-name" onClick={() => navigate(`/assets/${a.asset_id}`)}>{a.name}</h3>
                    <div className="browse__card-foot">
                      <span className="browse__card-price">Rs {Number(a.price_per_day).toLocaleString()}<span className="browse__card-price-unit">/day</span></span>
                      <span className="browse__card-owner">by {a.owner_name || 'Owner'}</span>
                    </div>
                    {isOwner && (
                      <div className="browse__card-actions">
                        <button className="browse__card-btn browse__card-btn--toggle" onClick={() => handleToggle(a.asset_id, a.availability_status)}>
                          {a.availability_status === 'available' ? 'Mark Unavailable' : 'Mark Available'}
                        </button>
                        <button className="browse__card-btn browse__card-btn--delete" onClick={() => handleDelete(a.asset_id)}>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
