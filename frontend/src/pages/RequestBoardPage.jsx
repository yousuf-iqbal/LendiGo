import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './RequestBoardPage.css';

export default function RequestBoardPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    axios.get('http://localhost:5000/api/requests', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => setRequests(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = requests.filter(r =>
    (r.Title || r.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.Description || r.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const urgencyColor = (u) => {
    if (!u) return { bg: '#f0f9d8', color: '#4a7c00' };
    const low = u.toLowerCase();
    if (low === 'high')   return { bg: '#fff0f0', color: '#c0392b' };
    if (low === 'medium') return { bg: '#fff8e8', color: '#b8750a' };
    return                       { bg: '#f0f9d8', color: '#4a7c00' };
  };

  return (
    <div className="rboard">
      <div className="rboard__inner">

        <header className="rboard__header">
          <div>
            <p className="rboard__eyebrow">Community board</p>
            <h1 className="rboard__title">Requests</h1>
          </div>
          <button className="rboard__post-btn" onClick={() => navigate('/post-request')}>
            Post a Request
          </button>
        </header>

        <div className="rboard__search-wrap">
          <svg className="rboard__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="rboard__search"
            placeholder="Search requests..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="rboard__skeletons">
            {[...Array(4)].map((_,i) => <div key={i} className="rboard__skeleton" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rboard__empty">
            <p>No requests yet. Be the first to post one.</p>
            <button className="rboard__post-btn" onClick={() => navigate('/post-request')}>Post a Request</button>
          </div>
        ) : (
          <div className="rboard__list">
            {filtered.map((r, i) => {
              const id       = r.RequestID || r.id;
              const title    = r.Title || r.title || 'Untitled';
              const desc     = r.Description || r.description || '';
              const urgency  = r.Urgency || r.urgency || '';
              const name     = r.RequesterName || r.requester_name || '';
              const date     = r.CreatedAt || r.created_at;
              const uc       = urgencyColor(urgency);

              return (
                <div
                  key={id}
                  className="rboard__card"
                  style={{ animationDelay: `${i * 0.06}s` }}
                  onClick={() => navigate(`/requests/${id}`)}
                >
                  <div className="rboard__card-left">
                    <div className="rboard__card-initial">{title.charAt(0)}</div>
                  </div>
                  <div className="rboard__card-body">
                    <div className="rboard__card-top">
                      <h3 className="rboard__card-title">{title}</h3>
                      {urgency && (
                        <span className="rboard__card-badge" style={{ background: uc.bg, color: uc.color }}>
                          {urgency}
                        </span>
                      )}
                    </div>
                    {desc && <p className="rboard__card-desc">{desc.slice(0, 120)}{desc.length > 120 ? '...' : ''}</p>}
                    <div className="rboard__card-foot">
                      {name && <span className="rboard__card-author">by {name}</span>}
                      {date && (
                        <span className="rboard__card-date">
                          {new Date(date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="rboard__card-arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
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
