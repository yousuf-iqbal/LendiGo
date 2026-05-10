import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
//import FloatingBackground from '../components/FloatingBackground';

const C = { saffron:'#F4A020', saffronPale:'#FFF0CC', maroon:'#800020', maroonL:'#B00030', cream:'#FDF6EC', warmWhite:'#FFF9F0', textDark:'#2C1810', textMuted:'#6B4C3B', textFaint:'#A68070', border:'rgba(128,0,32,0.12)' };

const Icons = {
  Send: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Lightbulb: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/><path d="M12 2a10 10 0 0 0-7.07 17.07L7 21h10l2.07-1.93A10 10 0 0 0 12 2z"/></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
};

function FloatField({ label, type='text', value, onChange, placeholder, min, required, children }) {
  const [focused, setFocused] = useState(false);
  const active = focused || (value && String(value).length > 0);
  return (
    <div style={{ position:'relative', marginBottom:'1.1rem' }}>
      <div style={{ position:'relative', background: focused ? 'rgba(244,160,32,0.06)' : C.warmWhite, border:`1.5px solid ${focused ? C.saffron : C.border}`, borderRadius:12, padding:'1rem 1rem 0.55rem', transition:'all 0.25s ease', boxShadow: focused ? '0 0 0 3px rgba(244,160,32,0.15)' : 'none' }}>
        <label style={{ position:'absolute', left:'1rem', top: active ? '0.38rem' : '0.95rem', fontSize: active ? '0.68rem' : '0.93rem', fontWeight: active ? 700 : 500, color: focused ? '#E08800' : C.textFaint, letterSpacing: active ? '0.07em' : 'normal', textTransform: active ? 'uppercase' : 'none', transition:'all 0.2s ease', pointerEvents:'none' }}>{label}</label>
        {children || <input type={type} value={value} onChange={onChange} min={min} required={required} placeholder={focused ? placeholder : ''} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} style={{ width:'100%', background:'transparent', border:'none', outline:'none', color:C.textDark, fontSize:'0.97rem', fontFamily:"'Outfit',sans-serif", paddingTop:'0.3rem' }} />}
      </div>
    </div>
  );
}

export default function PostRequestPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ title:'', description:'', categoryId:'', startDate:'', endDate:'', maxBudget:'', city:'', area:'' });

  useEffect(() => {
    API.get('/requests/categories').then(r => setCategories(r.data)).catch(() => setCategories([{id:1,name:'Electronics'},{id:2,name:'Tools'},{id:3,name:'Cameras'},{id:4,name:'Vehicles'},{id:5,name:'Sports'},{id:6,name:'Books'},{id:7,name:'Furniture'}]));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.startDate || !form.endDate) { setError('Start and end dates are required'); return; }
    if (new Date(form.endDate) < new Date(form.startDate)) { setError('End date must be after start date'); return; }
    setLoading(true); setError('');
    try {
      await API.post('/requests', { title:form.title.trim(), description:form.description.trim(), categoryId: form.categoryId ? parseInt(form.categoryId) : null, startDate:form.startDate, endDate:form.endDate, maxBudget: form.maxBudget ? parseFloat(form.maxBudget) : null, city:form.city.trim(), area:form.area.trim() });
      setSuccess('Request posted successfully!');
      setTimeout(() => navigate('/my-requests'), 1500);
    } catch (err) { setError(err.response?.data?.error || 'Failed to post request'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ background:C.cream, minHeight:'100vh', position:'relative', fontFamily:"'Outfit',system-ui,sans-serif" }}>
     {/*} <FloatingBackground variant="minimal" />*/}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Outfit:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
      `}</style>

      <div style={{ position:'relative', zIndex:1, maxWidth:960, margin:'0 auto', padding:'2rem 1.5rem' }}>
        <button onClick={() => navigate('/requests')} style={{ background:'none', border:'none', color:C.textMuted, cursor:'pointer', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:6, fontWeight:500, fontSize:'0.95rem' }}>
          ← Back to Requests
        </button>

        <div style={{ marginBottom:'2.5rem', animation:'fadeUp 0.5s ease both' }}>
          <p style={{ color:C.saffron, fontSize:'0.82rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'0.4rem' }}>Community Board</p>
          <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'2.8rem', fontWeight:700, color:C.textDark, letterSpacing:'-0.02em', margin:0 }}>Post a <em style={{ color:C.maroon, fontStyle:'italic' }}>Request</em></h1>
          <p style={{ color:C.textMuted, marginTop:'0.6rem', fontSize:'1rem', lineHeight:1.6 }}>Tell your community what you need. Someone nearby might have it.</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'2rem', alignItems:'start' }}>
          <div style={{ background:C.warmWhite, border:`1px solid ${C.border}`, borderRadius:20, padding:'2rem', animation:'fadeUp 0.5s ease 0.08s both' }}>
            {error && <div style={{ background:'#FEE2E2', color:'#991B1B', border:'1px solid #FCA5A5', padding:'0.85rem 1rem', borderRadius:10, marginBottom:'1.25rem', fontSize:'0.88rem', fontWeight:600 }}>⚠ {error}</div>}
            {success && <div style={{ background:'#D1FAE5', color:'#065F46', border:'1px solid #6EE7B7', padding:'0.85rem 1rem', borderRadius:10, marginBottom:'1.25rem', fontSize:'0.88rem', fontWeight:600, display:'flex', alignItems:'center', gap:8 }}><Icons.Check /> {success}</div>}

            <form onSubmit={handleSubmit}>
              <FloatField label="What do you need? *" value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g., DSLR Camera for wedding shoot" />

              <div style={{ marginBottom:'1.1rem' }}>
                <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, color:C.textFaint, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'0.4rem' }}>Description</label>
                <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={4} placeholder="Tell them why you need it, when, any special requirements…"
                  style={{ width:'100%', padding:'0.85rem 1rem', borderRadius:12, border:`1.5px solid ${C.border}`, background:C.cream, fontFamily:"'Outfit',sans-serif", fontSize:'0.95rem', color:C.textDark, outline:'none', resize:'vertical' }}
                  onFocus={e=>{e.target.style.borderColor=C.saffron;e.target.style.boxShadow='0 0 0 3px rgba(244,160,32,0.15)';}}
                  onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow='none';}} />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div style={{ marginBottom:'1.1rem' }}>
                  <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, color:C.textFaint, textTransform:'uppercase', marginBottom:'0.4rem' }}>Category</label>
                  <select value={form.categoryId} onChange={e=>set('categoryId',e.target.value)}
                    style={{ width:'100%', padding:'0.85rem 1rem', borderRadius:12, border:`1.5px solid ${C.border}`, background:C.cream, fontFamily:"'Outfit',sans-serif", fontSize:'0.95rem', color:C.textDark, outline:'none' }}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <FloatField label="Max Budget (Rs)" type="number" value={form.maxBudget} onChange={e=>set('maxBudget',e.target.value)} placeholder="Negotiable" />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <FloatField label="Start Date *" type="date" value={form.startDate} onChange={e=>set('startDate',e.target.value)} min={new Date().toISOString().split('T')[0]} />
                <FloatField label="End Date *" type="date" value={form.endDate} onChange={e=>set('endDate',e.target.value)} min={form.startDate || new Date().toISOString().split('T')[0]} />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <FloatField label="City" value={form.city} onChange={e=>set('city',e.target.value)} placeholder="Lahore" />
                <FloatField label="Area (optional)" value={form.area} onChange={e=>set('area',e.target.value)} placeholder="DHA Phase 5" />
              </div>

              <button type="submit" disabled={loading}
                style={{ width:'100%', padding:'1rem', background: loading ? '#9ca3af' : C.maroon, color:'#fff', border:'none', borderRadius:12, fontWeight:700, fontSize:'1rem', cursor: loading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {loading ? 'Posting…' : <><Icons.Send /> Post Request</>}
              </button>
            </form>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem', animation:'fadeUp 0.5s ease 0.12s both' }}>
            <div style={{ background:C.warmWhite, border:`1px solid ${C.border}`, borderRadius:16, padding:'1.5rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1rem' }}>
                <div style={{ width:32, height:32, borderRadius:8, background:`${C.saffron}15`, display:'flex', alignItems:'center', justifyContent:'center', color:C.saffron }}><Icons.Lightbulb /></div>
                <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'1.2rem', fontWeight:700, color:C.textDark, margin:0 }}>Pro Tips</h3>
              </div>
              {['Be specific about what you need','Mention exact dates for better matches','Set a realistic budget','Add your area for local lending','Clear descriptions get faster responses'].map((tip,i) => (
                <div key={i} style={{ display:'flex', gap:10, marginBottom:'0.75rem', alignItems:'flex-start' }}>
                  <span style={{ color:C.saffron, fontWeight:700 }}>→</span>
                  <p style={{ margin:0, fontSize:'0.88rem', color:C.textMuted }}>{tip}</p>
                </div>
              ))}
            </div>
            <div style={{ background:`linear-gradient(135deg,${C.saffronPale},#FFF9EC)`, border:'1px solid rgba(244,160,32,0.30)', borderRadius:16, padding:'1.5rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'0.6rem' }}>
                <div style={{ width:32, height:32, borderRadius:8, background:`${C.saffron}15`, display:'flex', alignItems:'center', justifyContent:'center', color:C.saffronDark }}><Icons.Lightbulb /></div>
                <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:'1.2rem', fontWeight:700, color:C.maroon, margin:0 }}>Did you know?</h3>
              </div>
              <p style={{ color:C.textMuted, lineHeight:1.65, margin:0, fontSize:'0.92rem' }}>Most requests get responses within 24 hours. Your community is here to help!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}