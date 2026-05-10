import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
//import FloatingBackground from '../components/FloatingBackground';

const C = { saffron:'#F4A020', saffronPale:'#FFF0CC', maroon:'#800020', maroonL:'#B00030', cream:'#FDF6EC', warmWhite:'#FFF9F0', textDark:'#2C1810', textMuted:'#6B4C3B', textFaint:'#A68070', border:'rgba(128,0,32,0.12)' };

const Icons = {
  Package: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 7l-8-4-8 4M20 12l-8 4-8-4M12 3v18"/></svg>,
  Plus: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Edit: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  Trash: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  ToggleOn: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="5" width="22" height="14" rx="7" ry="7"/><circle cx="16" cy="12" r="3"/></svg>,
  ToggleOff: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="5" width="22" height="14" rx="7" ry="7"/><circle cx="8" cy="12" r="3"/></svg>,
  MapPin: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
};

export default function MyAssetsPage() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('udhaari_user') || 'null');

  useEffect(() => { fetchAssets(); }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await API.get('/assets/my');
      setAssets(res.data.filter(a => a.owner_id === (user?.UserID || user?.id)));
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const handleToggle = async (assetId, currentStatus) => {
    try { await API.patch(`/assets/${assetId}`, { isActive: currentStatus === 'available' ? 0 : 1 }); fetchAssets(); }
    catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (assetId) => {
    if (!window.confirm('Delete this asset permanently?')) return;
    try { await API.delete(`/assets/${assetId}`); fetchAssets(); }
    catch (err) { alert(err.response?.data?.error || 'Failed to delete asset.'); }
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:C.cream, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
     {/*} <FloatingBackground variant="minimal" />*/}
      <div style={{ width:44, height:44, border:`3px solid ${C.border}`, borderTopColor:C.saffron, borderRadius:'50%', animation:'spin 0.8s linear infinite', zIndex:1 }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  return (
    <div style={{ background:C.cream, minHeight:'100vh', position:'relative', fontFamily:"'Outfit',system-ui,sans-serif" }}>
     {/*} <FloatingBackground variant="minimal" />*/}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700&family=Outfit:wght@400;500;600;700;800&display=swap');@keyframes fadeUp{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}}.asset-card{transition:all 0.25s ease;}.asset-card:hover{transform:translateY(-4px);box-shadow:0 10px 32px rgba(128,0,32,0.13) !important;}`}</style>
      <div style={{ position:'relative', zIndex:1, maxWidth:1200, margin:'0 auto', padding:'2rem 1.5rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2rem', animation:'fadeUp 0.5s ease both' }}>
          <div>
            <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'2.6rem', fontWeight:700, color:C.textDark, letterSpacing:'-0.02em', margin:0 }}>My Assets</h1>
            <p style={{ color:C.textMuted, marginTop:4 }}>{assets.length} listing{assets.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => navigate('/my-assets/add')} style={{ padding:'0.75rem 1.5rem', background:C.maroon, color:'#fff', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
            <Icons.Plus /> Add Asset
          </button>
        </div>

        {assets.length === 0 ? (
          <div style={{ textAlign:'center', padding:'5rem 2rem', background:C.warmWhite, borderRadius:16, border:`1px solid ${C.border}`, animation:'fadeUp 0.5s ease 0.05s both' }}>
            <div style={{ width:64, height:64, margin:'0 auto 1rem', color:C.textFaint }}><Icons.Package /></div>
            <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'1.5rem', color:C.textDark, marginBottom:'0.5rem' }}>No assets listed yet</h3>
            <p style={{ color:C.textMuted, marginBottom:'1.5rem' }}>List your first item and start earning from things you own.</p>
            <button onClick={() => navigate('/my-assets/add')} style={{ padding:'0.75rem 2rem', background:C.maroon, color:'#fff', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer' }}>List Your First Asset</button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1.5rem' }}>
            {assets.map((a, i) => (
              <div key={a.asset_id} className="asset-card" style={{ background:C.warmWhite, borderRadius:16, overflow:'hidden', border:`1px solid ${C.border}`, opacity: a.availability_status === 'unavailable' ? 0.75 : 1, animation:`fadeUp 0.5s ease ${i*0.05}s both` }}>
                <div onClick={() => navigate(`/assets/${a.asset_id}`)} style={{ height:200, background: a.primary_image ? `url(${a.primary_image}) center/cover` : `linear-gradient(135deg,${C.saffronPale},${C.cream})`, cursor:'pointer', position:'relative' }}>
                  <div style={{ position:'absolute', top:10, right:10, background: a.availability_status==='available' ? C.maroon : '#6B7280', color:'#fff', padding:'3px 12px', borderRadius:999, fontSize:'0.72rem', fontWeight:700 }}>
                    {a.availability_status === 'available' ? 'Available' : 'Unavailable'}
                  </div>
                </div>
                <div style={{ padding:'1.1rem 1.25rem' }}>
                  <h3 style={{ fontSize:'1.05rem', fontWeight:700, color:C.textDark, marginBottom:'0.3rem' }}>{a.name}</h3>
                  <p style={{ color:C.textMuted, fontSize:'0.85rem', marginBottom:'0.75rem', display:'flex', alignItems:'center', gap:4 }}><Icons.MapPin /> {a.location}</p>
                  <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'1.3rem', fontWeight:700, color:C.maroon, marginBottom:'0.875rem' }}>Rs. {Number(a.price_per_day).toLocaleString()}<span style={{ fontSize:'0.8rem', color:C.textFaint, fontWeight:500 }}>/day</span></p>
                  <div style={{ display:'flex', gap:'0.5rem' }}>
                    <button onClick={() => navigate(`/my-assets/edit/${a.asset_id}`)} style={{ flex:1, padding:'0.5rem', background:'rgba(59,130,246,0.1)', color:'#1D4ED8', border:'1px solid rgba(59,130,246,0.25)', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.82rem', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}><Icons.Edit /> Edit</button>
                    <button onClick={() => handleToggle(a.asset_id, a.availability_status)} style={{ flex:1, padding:'0.5rem', background: a.availability_status==='available' ? 'rgba(239,68,68,0.08)' : 'rgba(5,150,105,0.08)', color: a.availability_status==='available' ? '#DC2626' : '#059669', border:`1px solid ${a.availability_status==='available' ? 'rgba(239,68,68,0.25)' : 'rgba(5,150,105,0.25)'}`, borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.82rem', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                      {a.availability_status==='available' ? <Icons.ToggleOff /> : <Icons.ToggleOn />}
                      {a.availability_status==='available' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => handleDelete(a.asset_id)} style={{ flex:1, padding:'0.5rem', background:'rgba(239,68,68,0.08)', color:'#DC2626', border:'1px solid rgba(239,68,68,0.25)', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.82rem', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}><Icons.Trash /> Delete</button>
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