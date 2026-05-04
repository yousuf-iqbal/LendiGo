import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function BrowsePage() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortBy, setSortBy] = useState('recent');
  const user = JSON.parse(localStorage.getItem("udhaari_user") || "null");

  useEffect(() => {
    fetchCategories();
    fetchAssets();
  }, []);

  useEffect(() => {
    filterAndSortAssets();
  }, [category, minPrice, maxPrice, sortBy, search, assets]);

  const fetchCategories = async () => {
    try {
      const res = await API.get('/requests/categories');
      setCategories(['All', ...res.data.map(c => c.name)]);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories(['All', 'Electronics', 'Vehicles', 'Furniture', 'Sports Equipment', 'Cameras & Photography', 'Tools & Equipment', 'Books & Media', 'Musical Instruments', 'Outdoor & Garden', 'Toys & Games', 'Fashion & Clothing', 'Home Appliances', 'Party Supplies', 'Office Supplies']);
    }
  };

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await API.get('/assets');
      setAssets(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortAssets = () => {
    let out = assets;
    
    // Filter by category
    if (category !== 'All') out = out.filter(a => a.category === category);
    
    // Filter by search
    if (search.trim()) out = out.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));
    
    // Filter by price range
    out = out.filter(a => a.price_per_day >= minPrice && a.price_per_day <= maxPrice);
    
    // Sort
    if (sortBy === 'price-low') out.sort((a, b) => a.price_per_day - b.price_per_day);
    else if (sortBy === 'price-high') out.sort((a, b) => b.price_per_day - a.price_per_day);
    else if (sortBy === 'popular') out.sort((a, b) => (b.booking_count || 0) - (a.booking_count || 0));
    else out.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    
    setFiltered(out);
  };

  const handleToggle = async (assetId, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 0 : 1;
    try {
      await API.patch(`/assets/${assetId}`, { isActive: newStatus });
      fetchAssets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (assetId) => {
    if (!window.confirm('Remove this asset?')) return;
    try {
      await API.delete(`/assets/${assetId}`);
      fetchAssets();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1f2937' }}>Browse Items</h1>
            <p style={{ color: '#6b7280' }}>Find what you need from your community</p>
          </div>
          <button 
            onClick={() => navigate('/post-request')}
            style={{ padding: '0.75rem 1.5rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
          >
            + Post Request
          </button>
        </div>

        {/* Search */}
        <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
          />
        </div>

        {/* Category Capsules */}
        <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', overflowX: 'auto' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: '0.5rem 1rem',
                background: category === cat ? '#059669' : '#f3f4f6',
                color: category === cat ? '#fff' : '#374151',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: category === cat ? 600 : 400,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>
              Price Range: Rs. {minPrice} - Rs. {maxPrice}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <input
                type="number"
                placeholder="Min Price"
                value={minPrice}
                onChange={(e) => setMinPrice(parseInt(e.target.value) || 0)}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
              />
              <input
                type="number"
                placeholder="Max Price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value) || 10000)}
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="10000"
              step="100"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              style={{ width: '100%', cursor: 'pointer', accentColor: '#059669' }}
            />
          </div>
        </div>

        {/* Assets Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            No items found. Try adjusting filters.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {filtered.map(a => {
              const isOwner = user && (user.UserID === a.owner_id || user.id === a.owner_id);
              return (
                <div key={a.asset_id} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'; }}>
                  
                  <div onClick={() => navigate(`/assets/${a.asset_id}`)} style={{ height: '200px', background: a.primary_image ? `url(${a.primary_image})` : '#f3f4f6', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                    {!a.primary_image && (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '3rem' }}>📦</div>
                    )}
                    <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(5, 150, 105, 0.9)', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>{a.category}</div>
                  </div>
                  
                  <div style={{ padding: '1rem' }}>
                    <h3 onClick={() => navigate(`/assets/${a.asset_id}`)} style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem', cursor: 'pointer' }}>{a.name}</h3>
                    <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{a.location}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>Rs. {a.price_per_day}/day</span>
                      <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{a.booking_count || 0} bookings</span>
                    </div>
                   
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