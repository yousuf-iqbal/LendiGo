import { useCallback, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../api/axios';

const C = { saffron:'#F4A020', saffronPale:'#FFF0CC', maroon:'#800020', maroonL:'#B00030', cream:'#FDF6EC', warmWhite:'#FFF9F0', textDark:'#2C1810', textMuted:'#6B4C3B', textFaint:'#A68070', border:'rgba(128,0,32,0.12)', borderS:'rgba(128,0,32,0.25)' };

export default function BrowsePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortBy, setSortBy] = useState('recent');

  const fetchCategories = async () => {
    try {
      const res = await API.get('/requests/categories');
      setCategories(['All', ...res.data.map(c => c.name)]);
    } catch { setCategories(['All','Electronics','Vehicles','Furniture','Sports Equipment','Cameras','Tools','Books','Musical Instruments','Outdoor','Toys','Fashion','Appliances','Party Supplies']); }
  };

  const fetchAssets = async () => {
    setLoading(true);
    try { const res = await API.get('/assets'); setAssets(res.data); setFiltered(res.data); }
    catch { /* silent */ } finally { setLoading(false); }
  };

  const filterAndSortAssets = useCallback(() => {
    let out = assets;
    if (category !== 'All') out = out.filter(a => a.category === category);
    if (search.trim()) out = out.filter(a => a.name?.toLowerCase().includes(search.toLowerCase()));
    out = out.filter(a => a.price_per_day >= minPrice && a.price_per_day <= maxPrice);
    if (sortBy === 'price-low') out.sort((a,b) => a.price_per_day - b.price_per_day);
    else if (sortBy === 'price-high') out.sort((a,b) => b.price_per_day - a.price_per_day);
    else out.sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));
    setFiltered(out);
  }, [assets, category, maxPrice, minPrice, search, sortBy]);

  useEffect(() => { fetchCategories(); fetchAssets(); }, []);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    if (categoryParam) setCategory(categoryParam);
  }, [location.search]);
  useEffect(() => { filterAndSortAssets(); }, [filterAndSortAssets]);

  if (loading) return (
    <div style={{ minHeight:'100vh', background:C.cream, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div style={{ width:44, height:44, border:`3px solid ${C.border}`, borderTopColor:C.saffron, borderRadius:'50%', animation:'spin 0.8s linear infinite', zIndex:1 }} />
      <p style={{ color:C.textMuted, fontFamily:"'Outfit',sans-serif", zIndex:1 }}>Loading listings…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  return (
    <div style={{ background:'transparent', minHeight:'100vh', position:'relative', fontFamily:"'Outfit',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Outfit:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
        .asset-card{transition:all 0.28s ease;} .asset-card:hover{transform:translateY(-5px);box-shadow:0 12px 36px rgba(128,0,32,0.14) !important;}
        .cat-chip{transition:all 0.2s ease;cursor:pointer;} .cat-chip:hover{transform:translateY(-1px);}
        @keyframes spin{to{transform:rotate(360deg);}}
      `}</style>

      <div style={{ position:'relative', zIndex:1, maxWidth:1400, margin:'0 auto', padding:'2rem 1.5rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2rem', animation:'fadeUp 0.5s ease both' }}>
          <div>
            <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'2.6rem', fontWeight:700, color:C.textDark, letterSpacing:'-0.02em', margin:0 }}>Browse Listings</h1>
            <p style={{ color:C.textMuted, marginTop:4 }}>Find what you need from your community</p>
          </div>
          <button onClick={() => navigate('/post-request')} style={{ padding:'0.75rem 1.5rem', background:C.maroon, color:'#fff', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
            + Post Request
          </button>
        </div>

        <div style={{ background:C.warmWhite, border:`1px solid ${C.border}`, borderRadius:14, padding:'1rem 1.25rem', marginBottom:'1.25rem', animation:'fadeUp 0.5s ease 0.05s both' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Search assets by name..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{ flex:1, padding:'0.75rem 0', borderRadius:10, border:'none', background:'transparent', fontFamily:"'Outfit',sans-serif", fontSize:'0.95rem', color:C.textDark, outline:'none' }} />
          </div>
        </div>

        <div style={{ background:C.warmWhite, border:`1px solid ${C.border}`, borderRadius:14, padding:'1rem 1.25rem', marginBottom:'1.25rem', display:'flex', gap:'0.5rem', flexWrap:'wrap', animation:'fadeUp 0.5s ease 0.1s both' }}>
          {categories.map(cat => (
            <button key={cat} className="cat-chip" onClick={() => setCategory(cat)}
              style={{ padding:'0.5rem 1rem', background: category===cat ? C.maroon : 'rgba(128,0,32,0.05)', color: category===cat ? '#fff' : C.textMuted, border:`1px solid ${category===cat ? C.maroon : C.border}`, borderRadius:999, fontWeight: category===cat ? 700 : 500, fontSize:'0.85rem', whiteSpace:'nowrap' }}>
              {cat}
            </button>
          ))}
        </div>

        <div style={{ background:C.warmWhite, border:`1px solid ${C.border}`, borderRadius:14, padding:'1.25rem', marginBottom:'2rem', animation:'fadeUp 0.5s ease 0.15s both' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1rem', marginBottom:'1rem' }}>
            <div>
              <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, color:C.textFaint, textTransform:'uppercase', marginBottom:'0.4rem' }}>Sort By</label>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                style={{ width:'100%', padding:'0.7rem 0.9rem', borderRadius:10, border:`1.5px solid ${C.border}`, background:C.cream, fontFamily:"'Outfit',sans-serif", color:C.textDark, outline:'none' }}>
                <option value="recent">Most Recent</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, color:C.textFaint, textTransform:'uppercase', marginBottom:'0.4rem' }}>Min Price (Rs.)</label>
              <input type="number" value={minPrice} onChange={e=>setMinPrice(parseInt(e.target.value)||0)}
                style={{ width:'100%', padding:'0.7rem 0.9rem', borderRadius:10, border:`1.5px solid ${C.border}`, background:C.cream, fontFamily:"'Outfit',sans-serif", color:C.textDark, outline:'none' }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, color:C.textFaint, textTransform:'uppercase', marginBottom:'0.4rem' }}>Max Price (Rs.)</label>
              <input type="number" value={maxPrice} onChange={e=>setMaxPrice(parseInt(e.target.value)||10000)}
                style={{ width:'100%', padding:'0.7rem 0.9rem', borderRadius:10, border:`1.5px solid ${C.border}`, background:C.cream, fontFamily:"'Outfit',sans-serif", color:C.textDark, outline:'none' }} />
            </div>
          </div>
          <input type="range" min="0" max="10000" step="100" value={maxPrice} onChange={e=>setMaxPrice(parseInt(e.target.value))}
            style={{ width:'100%', cursor:'pointer', accentColor:C.maroon }} />
          <p style={{ fontSize:'0.82rem', color:C.textMuted, marginTop:'0.4rem' }}>Rs. {minPrice.toLocaleString()} — Rs. {maxPrice.toLocaleString()}</p>
        </div>

        <p style={{ fontSize:'0.85rem', color:C.textFaint, marginBottom:'1rem', fontWeight:600 }}>{filtered.length} listing{filtered.length !== 1 ? 's' : ''} found</p>

        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'5rem 2rem', background:C.warmWhite, borderRadius:16, border:`1px solid ${C.border}` }}>
            <div style={{ width:64, height:64, margin:'0 auto 1rem', color:C.textFaint }}><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
            <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'1.5rem', color:C.textDark, marginBottom:'0.5rem' }}>No listings found</h3>
            <p style={{ color:C.textMuted }}>Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1.5rem' }}>
            {filtered.map((a, idx) => (
              <div key={a.asset_id} className="asset-card"
                style={{ background:C.warmWhite, borderRadius:16, overflow:'hidden', border:`1px solid ${C.border}`, cursor:'pointer', animation:`fadeUp 0.5s ease ${idx*0.04}s both` }}
                onClick={() => navigate(`/assets/${a.asset_id}`)}>
                <div style={{ height:200, background: a.primary_image ? `url(${a.primary_image}) center/cover` : `linear-gradient(135deg,${C.saffronPale},${C.cream})`, position:'relative' }}>
                  <div style={{ position:'absolute', top:10, right:10, background:C.maroon, color:'#fff', padding:'3px 12px', borderRadius:999, fontSize:'0.72rem', fontWeight:700 }}>{a.category}</div>
                </div>
                <div style={{ padding:'1.1rem 1.25rem' }}>
                  <h3 style={{ fontSize:'1.05rem', fontWeight:700, color:C.textDark, marginBottom:'0.3rem' }}>{a.name}</h3>
                  <p style={{ color:C.textMuted, fontSize:'0.85rem', marginBottom:'0.75rem', display:'flex', alignItems:'center', gap:4 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {a.location || a.city || 'Location not set'}
                  </p>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'1.3rem', fontWeight:700, color:C.maroon }}>Rs. {Number(a.price_per_day).toLocaleString()}<span style={{ fontSize:'0.8rem', color:C.textFaint, fontWeight:500 }}>/day</span></span>
                    <span style={{ fontSize:'0.78rem', color:C.textFaint }}>{a.booking_count||0} rentals</span>
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
