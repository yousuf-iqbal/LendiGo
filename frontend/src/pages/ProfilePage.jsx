/* ═══════════════════════════════════════════════════════════
   ProfilePage.jsx  — NEW
   Place at: frontend/src/pages/ProfilePage.jsx
   Replaces: existing ProfilePage.jsx
   API routes used: GET /profile/me, PUT /profile/me, POST /profile/avatar
   No extra deps needed.
═══════════════════════════════════════════════════════════ */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
//import FloatingBackground from '../components/FloatingBackground';

/* ── Design tokens ─────────────────────────── */
const C = {
  saffron:    '#F4A020',
  saffronPale:'#FFF0CC',
  maroon:     '#800020',
  maroonLight:'#B00030',
  maroonDeep: '#5C0018',
  brownLight: '#C4956A',
  cream:      '#FDF6EC',
  warmWhite:  '#FFF9F0',
  textDark:   '#2C1810',
  textMuted:  '#6B4C3B',
  textFaint:  '#A68070',
  border:     'rgba(128,0,32,0.12)',
  borderStrong:'rgba(128,0,32,0.25)',
};

/* ── Sub-components ────────────────────────── */
function InfoRow({ label, value, icon }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12,
      padding:'1rem 1.25rem',
      background:'rgba(253,246,236,0.7)',
      border:`1px solid ${C.border}`,
      borderRadius:12,
      transition:'all 0.25s ease',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = C.saffronPale; e.currentTarget.style.borderColor = 'rgba(244,160,32,0.35)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(253,246,236,0.7)'; e.currentTarget.style.borderColor = C.border; }}>
      <span style={{ fontSize:'1.1rem', flexShrink:0 }}>{icon}</span>
      <div>
        <p style={{ margin:0, fontSize:'0.72rem', fontWeight:700, color:C.textFaint, textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</p>
        <p style={{ margin:'2px 0 0', fontSize:'0.97rem', fontWeight:600, color:C.textDark }}>{value || <span style={{ color:C.textFaint, fontStyle:'italic', fontWeight:400 }}>Not set</span>}</p>
      </div>
    </div>
  );
}

function FloatField({ label, name, value, onChange, type='text', maxLength, placeholder }) {
  const [focused, setFocused] = useState(false);
  const active = focused || (value && String(value).length > 0);
  return (
    <div style={{ position:'relative', marginBottom:'1.1rem' }}>
      <div style={{
        position:'relative',
        background: focused ? 'rgba(244,160,32,0.06)' : C.warmWhite,
        border: `1.5px solid ${focused ? C.saffron : C.border}`,
        borderRadius:12,
        padding:'1rem 1rem 0.55rem',
        transition:'all 0.25s ease',
        boxShadow: focused ? '0 0 0 3px rgba(244,160,32,0.15)' : 'none',
      }}>
        <label style={{
          position:'absolute', left:'1rem',
          top: active ? '0.38rem' : '0.95rem',
          fontSize: active ? '0.68rem' : '0.93rem',
          fontWeight: active ? 700 : 500,
          color: focused ? C.saffronDark || '#E08800' : C.textFaint,
          letterSpacing: active ? '0.07em' : 'normal',
          textTransform: active ? 'uppercase' : 'none',
          transition:'all 0.2s ease',
          pointerEvents:'none',
        }}>{label}</label>
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          placeholder={focused ? placeholder : ''}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width:'100%', background:'transparent', border:'none', outline:'none',
            color:C.textDark, fontSize:'0.97rem', fontFamily:"'Outfit', sans-serif",
            paddingTop:'0.3rem',
          }}
        />
      </div>
    </div>
  );
}

/* ── Main ──────────────────────────────────── */
export default function ProfilePage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type:'', text:'' });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [form, setForm] = useState({
    fullName:'', phone:'', city:'', area:'', cnic:'',
  });

  useEffect(() => {
    setMounted(true);
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get('/profile/me');
      const u = res.data.user;
      setUser(u);
      setForm({
        fullName: u.FullName || '',
        phone:    u.Phone    || '',
        city:     u.City     || '',
        area:     u.Area     || '',
        cnic:     u.CNIC     || '',
      });
    } catch (err) {
      setMsg({ type:'error', text:'Failed to load profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setMsg({ type:'', text:'' });
    try {
      const res = await API.put('/profile/me', form);
      setUser(res.data.user);
      localStorage.setItem('udhaari_user', JSON.stringify({ ...user, ...form }));
      setEditing(false);
      setMsg({ type:'success', text:'Profile updated successfully!' });
      setTimeout(() => setMsg({ type:'', text:'' }), 3500);
    } catch (err) {
      setMsg({ type:'error', text: err.response?.data?.error || 'Failed to save changes.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('profilePic', file);
      const res = await API.post('/profile/avatar', fd, { headers:{ 'Content-Type':'multipart/form-data' } });
      setUser(u => ({ ...u, ProfilePic: res.data.profilePic }));
      setMsg({ type:'success', text:'Profile picture updated!' });
      setTimeout(() => setMsg({ type:'', text:'' }), 3000);
    } catch {
      setMsg({ type:'error', text:'Failed to upload image.' });
    } finally {
      setAvatarUploading(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:C.cream }}>
     {/*} <FloatingBackground variant="minimal" />*/}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16, position:'relative', zIndex:1 }}>
        <div style={{ width:44, height:44, border:`3px solid ${C.border}`, borderTopColor:C.saffron, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <p style={{ color:C.textMuted, fontFamily:"'Outfit', sans-serif" }}>Loading profile…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  const initials = user?.FullName?.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() || '?';
  const joinDate = user?.CreatedAt ? new Date(user.CreatedAt).toLocaleDateString('en-PK', { month:'long', year:'numeric' }) : '';

  return (
    <div style={{ background:C.cream, minHeight:'100vh', position:'relative', fontFamily:"'Outfit', system-ui, sans-serif" }}>
      {/*<FloatingBackground variant="minimal" />*/}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(244,160,32,0.4); } 50% { box-shadow: 0 0 0 12px rgba(244,160,32,0); } }
        .profile-avatar-wrap:hover .avatar-overlay { opacity: 1 !important; }
      `}</style>

      <div style={{ position:'relative', zIndex:1, maxWidth:1000, margin:'0 auto', padding:'2.5rem 1.5rem' }}>

        {/* ── Toast ─── */}
        {msg.text && (
          <div style={{
            position:'fixed', top:80, right:24, zIndex:100,
            padding:'0.85rem 1.5rem',
            background: msg.type === 'success' ? '#D1FAE5' : '#FEE2E2',
            border: `1px solid ${msg.type === 'success' ? '#6EE7B7' : '#FCA5A5'}`,
            color: msg.type === 'success' ? '#065F46' : '#991B1B',
            borderRadius:12,
            fontWeight:600, fontSize:'0.92rem',
            boxShadow:'0 4px 24px rgba(0,0,0,0.12)',
            animation:'fadeUp 0.4s ease both',
          }}>
            {msg.type === 'success' ? '✓ ' : '✕ '}{msg.text}
          </div>
        )}

        {/* ── Profile Header Card ── */}
        <div style={{
          background:C.warmWhite,
          border:`1px solid ${C.border}`,
          borderRadius:20,
          padding:'2.5rem',
          marginBottom:'1.5rem',
          boxShadow:'0 4px 24px rgba(128,0,32,0.08)',
          animation: mounted ? 'fadeUp 0.55s ease both' : 'none',
          display:'flex',
          gap:'2rem',
          flexWrap:'wrap',
          alignItems:'flex-start',
        }}>
          {/* Avatar */}
          <div className="profile-avatar-wrap" style={{ position:'relative', flexShrink:0 }}>
            <div style={{
              width:110, height:110, borderRadius:'50%',
              background: user?.ProfilePic ? undefined : `linear-gradient(135deg, ${C.saffron} 0%, ${C.maroon} 100%)`,
              backgroundImage: user?.ProfilePic ? `url(${user.ProfilePic})` : undefined,
              backgroundSize:'cover', backgroundPosition:'center',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#fff',
              fontFamily:'Cormorant Garamond, serif', fontSize:'2.2rem', fontWeight:700,
              border:`3px solid ${C.saffronPale || '#FFF0CC'}`,
              boxShadow:`0 0 0 4px rgba(244,160,32,0.25), 0 8px 32px rgba(128,0,32,0.20)`,
              cursor:'pointer',
              position:'relative',
              overflow:'hidden',
            }}
            onClick={() => fileRef.current?.click()}>
              {!user?.ProfilePic && initials}
              {/* Overlay */}
              <div className="avatar-overlay" style={{
                position:'absolute', inset:0,
                background:'rgba(44,24,16,0.55)',
                display:'flex', alignItems:'center', justifyContent:'center',
                opacity:0, transition:'opacity 0.25s ease',
                borderRadius:'50%',
              }}>
                {avatarUploading
                  ? <div style={{ width:24, height:24, border:'2px solid #fff', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
                  : <span style={{ fontSize:'1.5rem' }}>▲</span>
                }
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatarChange} />
            {/* Verified dot */}
            {user?.IsVerified && (
              <div style={{
                position:'absolute', bottom:4, right:4,
                width:24, height:24, borderRadius:'50%',
                background:'#059669', border:'3px solid #fff',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'0.6rem', color:'#fff', fontWeight:800,
              }}>✓</div>
            )}
          </div>

          {/* Name & meta */}
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'2rem', fontWeight:700, color:C.textDark, margin:0, letterSpacing:'-0.02em' }}>
                {user?.FullName || 'Your Name'}
              </h1>
              {user?.IsVerified && (
                <span style={{ padding:'3px 10px', borderRadius:999, background:'rgba(5,150,105,0.1)', color:'#047857', fontSize:'0.75rem', fontWeight:700, border:'1px solid rgba(5,150,105,0.2)' }}>
                  ✓ Verified
                </span>
              )}
              {user?.Role === 'admin' && (
                <span style={{ padding:'3px 10px', borderRadius:999, background:'rgba(244,160,32,0.15)', color:C.maroon, fontSize:'0.75rem', fontWeight:700, border:`1px solid rgba(244,160,32,0.35)` }}>
                  Admin
                </span>
              )}
            </div>
            <p style={{ color:C.textMuted, margin:'4px 0 0', fontSize:'0.95rem' }}>{user?.Email}</p>
            <p style={{ color:C.textFaint, margin:'2px 0 8px', fontSize:'0.85rem' }}>
              {user?.City && user?.Area ? `${user.Area}, ${user.City}` : user?.City || 'Location not set'}
              {joinDate && ` · Member since ${joinDate}`}
            </p>
            <p style={{ fontSize:'0.78rem', color:C.textFaint, fontStyle:'italic' }}>
              Click avatar to change photo
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display:'flex', flexDirection:'column', gap:8, flexShrink:0 }}>
            {editing ? (
              <>
                <button onClick={handleSave} disabled={saving} style={{
                  padding:'0.7rem 1.6rem', borderRadius:10, border:'none', cursor:'pointer',
                  background: saving ? '#9ca3af' : C.maroon, color:'#fff',
                  fontFamily:"'Outfit', sans-serif", fontWeight:700, fontSize:'0.9rem',
                  transition:'all 0.25s ease', boxShadow:'0 4px 16px rgba(128,0,32,0.28)',
                }}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button onClick={() => { setEditing(false); fetchProfile(); }} style={{
                  padding:'0.7rem 1.6rem', borderRadius:10, border:`1.5px solid ${C.border}`,
                  cursor:'pointer', background:'transparent', color:C.textMuted,
                  fontFamily:"'Outfit', sans-serif", fontWeight:600, fontSize:'0.9rem',
                }}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} style={{
                  padding:'0.7rem 1.6rem', borderRadius:10, border:'none', cursor:'pointer',
                  background:C.maroon, color:'#fff',
                  fontFamily:"'Outfit', sans-serif", fontWeight:700, fontSize:'0.9rem',
                  transition:'all 0.25s ease', boxShadow:'0 4px 16px rgba(128,0,32,0.25)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background=C.maroonLight; e.currentTarget.style.transform='translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background=C.maroon; e.currentTarget.style.transform='translateY(0)'; }}>
                  Edit Profile
                </button>
                <button onClick={() => navigate('/wallet')} style={{
                  padding:'0.7rem 1.6rem', borderRadius:10, border:`1.5px solid ${C.border}`,
                  cursor:'pointer', background:'transparent', color:C.textDark,
                  fontFamily:"'Outfit', sans-serif", fontWeight:600, fontSize:'0.9rem',
                  transition:'all 0.25s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=C.saffron; e.currentTarget.style.background='rgba(244,160,32,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background='transparent'; }}>
                  My Wallet
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Two column layout ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', flexWrap:'wrap' }}>

          {/* Left: Info / Edit Form */}
          <div style={{
            background:C.warmWhite,
            border:`1px solid ${C.border}`,
            borderRadius:20, padding:'2rem',
            boxShadow:'0 4px 24px rgba(128,0,32,0.07)',
            animation: mounted ? 'fadeUp 0.55s ease 0.08s both' : 'none',
          }}>
            <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.4rem', fontWeight:700, color:C.textDark, marginBottom:'1.4rem', paddingBottom:'0.8rem', borderBottom:`1px solid ${C.border}` }}>
              {editing ? 'Edit Details' : 'Profile Info'}
            </h2>

            {editing ? (
              <>
                <FloatField label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Your full name" />
                <FloatField label="Phone" name="phone" value={form.phone} onChange={handleChange} type="tel" maxLength={11} placeholder="03xxxxxxxxx" />
                <FloatField label="City" name="city" value={form.city} onChange={handleChange} placeholder="Lahore" />
                <FloatField label="Area (optional)" name="area" value={form.area} onChange={handleChange} placeholder="DHA Phase 5" />
                <FloatField label="CNIC" name="cnic" value={form.cnic} onChange={handleChange} type="text" maxLength={13} placeholder="13 digits, no dashes" />
              </>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <InfoRow icon="☎" label="Phone"  value={user?.Phone} />
                <InfoRow icon="◉" label="City"   value={user?.City} />
                <InfoRow icon="◆" label="Area"   value={user?.Area} />
                <InfoRow icon="■" label="CNIC"   value={user?.CNIC ? `${user.CNIC.slice(0,5)}-XXXXXXXX` : null} />
                <InfoRow icon="◈" label="Signup" value={user?.SignupMethod === 'google' ? 'Google' : 'Email'} />
              </div>
            )}
          </div>

          {/* Right: Quick Links */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
            {[
              { icon:'▪', label:'My Assets',          sub:'Items you have listed for lending',       path:'/my-assets',       color:C.saffron },
              { icon:'◦', label:'My Requests',        sub:'Borrow requests you have posted',         path:'/my-requests',     color:'#3B82F6' },
              { icon:'◊', label:'My Offers Received', sub:'Offers lenders made on your requests',    path:'/my-offers',       color:'#059669' },
              { icon:'◇', label:'My Offers Made',     sub:'Offers you have made to lend items',      path:'/my-offers-made',  color:C.maroon  },
              { icon:'◐', label:'My Bookings',        sub:'Active and past booking history',          path:'/bookings',        color:'#7C3AED' },
              { icon:'◈', label:'Dashboard',          sub:'Stats, earnings and activity',             path:'/dashboard',       color:C.brownLight },
              { icon:'★', label:'My Reviews',         sub:'Ratings and feedback from the community',  path:'/reviews',         color:C.saffron  },
            ].map((item, i) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display:'flex', alignItems:'center', gap:14,
                  padding:'1rem 1.25rem',
                  background:C.warmWhite,
                  border:`1px solid ${C.border}`,
                  borderRadius:14,
                  cursor:'pointer',
                  textAlign:'left',
                  transition:'all 0.25s ease',
                  animation: mounted ? `fadeUp 0.5s ease ${0.12 + i*0.06}s both` : 'none',
                  boxShadow:'0 2px 8px rgba(128,0,32,0.05)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 6px 24px rgba(128,0,32,0.12)'; e.currentTarget.style.borderColor='rgba(128,0,32,0.22)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 2px 8px rgba(128,0,32,0.05)'; e.currentTarget.style.borderColor=C.border; }}
              >
                <div style={{ width:44, height:44, borderRadius:12, background:`${item.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem', flexShrink:0 }}>
                  {item.icon}
                </div>
                <div>
                  <p style={{ margin:0, fontWeight:700, fontSize:'0.95rem', color:C.textDark }}>{item.label}</p>
                  <p style={{ margin:'2px 0 0', fontSize:'0.8rem', color:C.textFaint }}>{item.sub}</p>
                </div>
                <div style={{ marginLeft:'auto', color:C.textFaint, fontSize:'1rem' }}>→</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
