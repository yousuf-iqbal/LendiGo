import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'fulfilled', label: 'Fulfilled' },
];

export default function BrowsePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Filter state — initialized from URL so links are shareable
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'open');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [minBudget, setMinBudget] = useState(searchParams.get('minBudget') || '');
  const [maxBudget, setMaxBudget] = useState(searchParams.get('maxBudget') || '');

  // Load filter dropdown options once
  useEffect(() => {
    axios.get('http://localhost:5000/api/requests/filters')
      .then(res => {
        setCategories(res.data.categories || []);
        setCities(res.data.cities || []);
      })
      .catch(() => {});
  }, []);

  // Fetch results (debounced)
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      if (category) params.category = category;
      if (city) params.city = city;
      if (minBudget) params.minBudget = minBudget;
      if (maxBudget) params.maxBudget = maxBudget;

      setSearchParams(params);

      const res = await axios.get('http://localhost:5000/api/requests', { params });
      setRequests(res.data);
      setTotal(res.data.length);
    } catch {
      setRequests([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, status, category, city, minBudget, maxBudget]);

  useEffect(() => {
    const timer = setTimeout(fetchRequests, 350);
    return () => clearTimeout(timer);
  }, [fetchRequests]);

  function clearFilters() {
    setSearch('');
    setStatus('open');
    setCategory('');
    setCity('');
    setMinBudget('');
    setMaxBudget('');
  }

  const hasActiveFilters = category || city || minBudget || maxBudget || status !== 'open';

  return (
    <div style={styles.page}>
      {/* Top search bar */}
      <div style={styles.topBar}>
        <div style={styles.topBarInner}>
          <div>
            <h1 style={styles.title}>Browse Requests</h1>
            <p style={styles.subtitle}>
              {loading ? 'Searching...' : `${total} request${total !== 1 ? 's' : ''} found`}
            </p>
          </div>
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              style={styles.searchInput}
              type="text"
              placeholder="Search by title or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button style={styles.clearBtn} onClick={() => setSearch('')}>✕</button>
            )}
          </div>
        </div>
      </div>

      <div style={styles.body}>
        {/* Filter Sidebar */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <span style={styles.sidebarTitle}>Filters</span>
            {hasActiveFilters && (
              <button style={styles.clearAllBtn} onClick={clearFilters}>Clear all</button>
            )}
          </div>

          {/* Status */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Status</label>
            <div style={styles.pillRow}>
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  style={{ ...styles.pill, ...(status === opt.value ? styles.pillActive : {}) }}
                  onClick={() => setStatus(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Category</label>
            <select style={styles.select} value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* City */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>City</label>
            <select style={styles.select} value={city} onChange={e => setCity(e.target.value)}>
              <option value="">All cities</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Budget range */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Max Budget (PKR)</label>
            <div style={styles.rangeRow}>
              <input
                style={styles.rangeInput}
                type="number"
                min="0"
                placeholder="Min"
                value={minBudget}
                onChange={e => setMinBudget(e.target.value)}
              />
              <span style={styles.rangeSep}>—</span>
              <input
                style={styles.rangeInput}
                type="number"
                min="0"
                placeholder="Max"
                value={maxBudget}
                onChange={e => setMaxBudget(e.target.value)}
              />
            </div>
          </div>
        </aside>

        {/* Results */}
        <main style={styles.main}>
          {loading ? (
            <div style={styles.emptyState}>
              <div style={styles.spinner} />
              <p>Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📭</div>
              <h3 style={styles.emptyTitle}>No requests found</h3>
              <p style={styles.emptyText}>Try adjusting your search or filters</p>
              {hasActiveFilters && (
                <button style={styles.clearAllBtnBig} onClick={clearFilters}>
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div style={styles.grid}>
              {requests.map(req => (
                <RequestCard
                  key={req.RequestID}
                  req={req}
                  onClick={() => navigate(`/requests/${req.RequestID}`)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function RequestCard({ req, onClick }) {
  const isOpen = req.Status === 'open';
  const isFulfilled = req.Status === 'fulfilled';

  const statusColor = isOpen
    ? { bg: '#dcfce7', color: '#16a34a' }
    : isFulfilled
    ? { bg: '#fef9c3', color: '#a16207' }
    : { bg: '#f3f4f6', color: '#6b7280' };

  // Format date range
  const formatDate = (d) => new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
  const dateRange = req.StartDate && req.EndDate
    ? `${formatDate(req.StartDate)} – ${formatDate(req.EndDate)}`
    : null;

  return (
    <div
      style={styles.card}
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={styles.cardTop}>
        <span style={{ ...styles.badge, backgroundColor: statusColor.bg, color: statusColor.color }}>
          {req.Status}
        </span>
        {req.CategoryName && (
          <span style={styles.categoryTag}>{req.CategoryName}</span>
        )}
      </div>

      <h3 style={styles.cardTitle}>{req.Title}</h3>

      {req.Description && (
        <p style={styles.cardDesc}>
          {req.Description.length > 100 ? req.Description.slice(0, 100) + '...' : req.Description}
        </p>
      )}

      <div style={styles.cardMeta}>
        {req.City && (
          <span style={styles.metaItem}>📍 {req.City}{req.Area ? `, ${req.Area}` : ''}</span>
        )}
        {dateRange && (
          <span style={styles.metaItem}>📅 {dateRange}</span>
        )}
        {req.MaxBudget && (
          <span style={styles.metaItem}>💰 PKR {Number(req.MaxBudget).toLocaleString()}</span>
        )}
        {req.OfferCount > 0 && (
          <span style={styles.metaItem}>🤝 {req.OfferCount} offer{req.OfferCount !== 1 ? 's' : ''}</span>
        )}
      </div>

      <div style={styles.cardFooter}>
        <span style={styles.requesterName}>by {req.RequesterName}</span>
        <span style={styles.viewBtn}>View →</span>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f8f9fb', fontFamily: "'Segoe UI', sans-serif" },
  topBar: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e7eb',
    padding: '16px 24px',
    position: 'sticky',
    top: 60,
    zIndex: 100,
  },
  topBarInner: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    flexWrap: 'wrap',
  },
  title: { margin: 0, fontSize: 20, fontWeight: 700, color: '#111' },
  subtitle: { margin: '2px 0 0', fontSize: 13, color: '#6b7280' },
  searchWrap: {
    flex: 1, minWidth: 240,
    display: 'flex', alignItems: 'center',
    backgroundColor: '#f3f4f6', borderRadius: 10, padding: '0 12px', gap: 8,
  },
  searchIcon: { fontSize: 15, color: '#9ca3af' },
  searchInput: {
    flex: 1, border: 'none', background: 'transparent',
    padding: '10px 0', fontSize: 14, outline: 'none', color: '#111',
  },
  clearBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 13 },
  body: {
    maxWidth: 1200, margin: '0 auto', padding: '24px',
    display: 'flex', gap: 24, alignItems: 'flex-start',
  },
  sidebar: {
    width: 230, flexShrink: 0,
    backgroundColor: '#fff', borderRadius: 14,
    border: '1px solid #e5e7eb', padding: 20,
    position: 'sticky', top: 130,
  },
  sidebarHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  sidebarTitle: { fontWeight: 700, fontSize: 15, color: '#111' },
  clearAllBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#ef4444', fontSize: 12, fontWeight: 600,
  },
  filterGroup: { marginBottom: 20 },
  filterLabel: {
    display: 'block', fontSize: 11, fontWeight: 700,
    color: '#6b7280', textTransform: 'uppercase',
    letterSpacing: '0.06em', marginBottom: 8,
  },
  pillRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  pill: {
    padding: '5px 10px', borderRadius: 20,
    border: '1.5px solid #e5e7eb', background: '#fff',
    fontSize: 12, cursor: 'pointer', color: '#374151', fontWeight: 500,
  },
  pillActive: { backgroundColor: '#2563eb', borderColor: '#2563eb', color: '#fff' },
  select: {
    width: '100%', padding: '8px 10px', borderRadius: 8,
    border: '1.5px solid #e5e7eb', fontSize: 13,
    color: '#111', backgroundColor: '#fff', outline: 'none', cursor: 'pointer',
  },
  rangeRow: { display: 'flex', alignItems: 'center', gap: 8 },
  rangeInput: {
    flex: 1, padding: '7px 10px', borderRadius: 8,
    border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none',
  },
  rangeSep: { color: '#9ca3af', fontSize: 13 },
  main: { flex: 1, minWidth: 0 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 16,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 14,
    border: '1px solid #e5e7eb', padding: 18,
    cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  cardTop: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  badge: {
    fontSize: 11, fontWeight: 700, padding: '3px 8px',
    borderRadius: 20, textTransform: 'capitalize',
  },
  categoryTag: {
    fontSize: 11, padding: '3px 8px', borderRadius: 20,
    backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: 600,
  },
  cardTitle: { margin: 0, fontSize: 15, fontWeight: 700, color: '#111', lineHeight: 1.4 },
  cardDesc: { margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.5 },
  cardMeta: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  metaItem: { fontSize: 12, color: '#6b7280' },
  cardFooter: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 4, paddingTop: 10, borderTop: '1px solid #f3f4f6',
  },
  requesterName: { fontSize: 12, color: '#9ca3af' },
  viewBtn: { fontSize: 13, color: '#2563eb', fontWeight: 600 },
  emptyState: { textAlign: 'center', padding: '80px 24px', color: '#6b7280' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: '#111', margin: '0 0 8px' },
  emptyText: { fontSize: 14, margin: 0 },
  clearAllBtnBig: {
    marginTop: 16, padding: '10px 20px',
    backgroundColor: '#2563eb', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  spinner: {
    width: 32, height: 32,
    border: '3px solid #e5e7eb', borderTop: '3px solid #2563eb',
    borderRadius: '50%', margin: '0 auto 16px',
    animation: 'spin 0.8s linear infinite',
  },
};
