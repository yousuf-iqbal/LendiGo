import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const RESOURCES = {
  users: {
    label: "Users",
    endpoint: "/admin/users",
    id: "UserID",
    columns: ["UserID", "FullName", "Email", "Role", "IsVerified", "IsBanned", "City"],
    fields: ["fullName", "phone", "city", "area", "cnic", "role", "isVerified", "isBanned"],
    createFields: ["fullName", "email", "phone", "city", "area", "cnic", "role", "isVerified"],
  },
  assets: {
    label: "Assets",
    endpoint: "/admin/assets",
    id: "AssetID",
    columns: ["AssetID", "Title", "OwnerName", "CategoryName", "PricePerDay", "City", "IsActive"],
    fields: ["title", "description", "pricePerDay", "city", "area", "isActive"],
  },
  requests: {
    label: "Requests",
    endpoint: "/admin/requests",
    id: "RequestID",
    columns: ["RequestID", "Title", "RequesterName", "CategoryName", "Status", "MaxBudget", "City"],
    fields: ["title", "status"],
  },
  offers: {
    label: "Offers",
    endpoint: "/admin/offers",
    id: "OfferID",
    columns: ["OfferID", "RequestTitle", "LenderName", "OfferedPrice", "Status", "CreatedAt"],
    fields: ["status"],
  },
  bookings: {
    label: "Bookings",
    endpoint: "/admin/bookings",
    id: "BookingID",
    columns: ["BookingID", "Title", "RenterName", "LenderName", "Status", "IsPaid", "TotalPrice"],
    fields: ["status", "isPaid"],
  },
  categories: {
    label: "Categories",
    endpoint: "/admin/categories",
    id: "CategoryID",
    columns: ["CategoryID", "Name", "Description"],
    fields: ["name", "description"],
    createFields: ["name", "description"],
  },
  wallets: {
    label: "Wallets",
    endpoint: "/admin/wallets",
    id: "UserID",
    columns: ["UserID", "FullName", "Balance", "TotalTopUps", "TotalLoans", "PendingRequests"],
    fields: [],
    readOnly: true,
  },
  reviews: {
    label: "Reviews",
    endpoint: "/admin/reviews",
    id: "ReviewID",
    columns: ["ReviewID", "ReviewerName", "RevieweeName", "AssetTitle", "Rating", "Comment"],
    fields: [],
  },
  transactions: {
    label: "Transactions",
    endpoint: "/admin/transactions",
    id: "TransactionID",
    columns: ["TransactionID", "FromUser", "ToUser", "Amount", "Type", "BookingID", "CreatedAt"],
    fields: [],
    readOnly: true,
  },
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [active, setActive] = useState("users");
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);
  const [editor, setEditor] = useState(null);
  const [saving, setSaving] = useState(false);

  const config = RESOURCES[active];

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    loadRows();
  }, [active]);

  const loadSummary = async () => {
    try {
      const res = await API.get("/admin/summary");
      setSummary(res.data);
    } catch (err) {
      alert(err.response?.data?.error || "Admin summary failed");
    }
  };

  const loadRows = async () => {
    setLoading(true);
    try {
      const res = await API.get(config.endpoint);
      setRows(res.data || []);
    } catch (err) {
      alert(err.response?.data?.error || `Could not load ${config.label}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleBan = async (user) => {
    setActionLoading(user.UserID);
    try {
      await API.patch(`/admin/users/${user.UserID}/toggle-ban`);
      await loadRows();
    } catch (err) {
      alert(err.response?.data?.error || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleVerify = async (user) => {
    setActionLoading(user.UserID);
    try {
      await API.patch(`/admin/users/${user.UserID}/toggle-verify`);
      await loadRows();
    } catch (err) {
      alert(err.response?.data?.error || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleAssetActive = async (asset) => {
    setActionLoading(asset.AssetID);
    try {
      await API.patch(`/admin/assets/${asset.AssetID}/toggle-active`);
      await loadRows();
    } catch (err) {
      alert(err.response?.data?.error || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return "#6b7280";
    const str = String(status).toLowerCase();
    if (str.includes("completed") || str.includes("verified")) return "#16a34a";
    if (str.includes("pending") || str.includes("open")) return "#f59e0b";
    if (str.includes("ongoing") || str.includes("confirmed")) return "#3b82f6";
    if (str.includes("cancelled") || str.includes("banned") || str.includes("declined")) return "#ef4444";
    return "#6b7280";
  };

  const filteredRows = useMemo(() => {
    let result = rows;

    // Apply status-based filter
    if (filter !== "all") {
      if (active === "users") {
        result = result.filter(r => {
          if (filter === "banned") return r.IsBanned;
          if (filter === "verified") return r.IsVerified;
          if (filter === "admin") return r.Role === "admin";
          return true;
        });
      } else if (active === "assets") {
        result = result.filter(r => {
          if (filter === "active") return r.IsActive;
          if (filter === "inactive") return !r.IsActive;
          return true;
        });
      } else if (active === "bookings") {
        result = result.filter(r => filter === "all" || r.Status === filter);
      }
    }

    // Apply search filter
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(row => Object.values(row).some(value => String(value ?? "").toLowerCase().includes(term)));
    }

    return result;
  }, [rows, search, filter, active]);

  const openEditor = (row = null) => {
    const fields = row ? config.fields : (config.createFields || config.fields);
    const form = {};
    fields.forEach(field => {
      const pascal = field[0].toUpperCase() + field.slice(1);
      form[field] = row?.[field] ?? row?.[pascal] ?? "";
    });
    setEditor({ row, form, fields });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editor.row) {
        await API.put(`${config.endpoint}/${editor.row[config.id]}`, editor.form);
      } else {
        await API.post(config.endpoint, editor.form);
      }
      setEditor(null);
      await Promise.all([loadRows(), loadSummary()]);
    } catch (err) {
      alert(err.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete ${config.label.slice(0, -1).toLowerCase()} #${row[config.id]}?`)) return;
    try {
      await API.delete(`${config.endpoint}/${row[config.id]}`);
      await Promise.all([loadRows(), loadSummary()]);
    } catch (err) {
      alert(err.response?.data?.error || "Delete failed");
    }
  };

  const renderValue = (value) => {
    if (value === true) return "Yes";
    if (value === false) return "No";
    if (value === null || value === undefined || value === "") return "-";
    if (String(value).includes("T") && !Number.isNaN(Date.parse(value))) {
      return new Date(value).toLocaleString();
    }
    return String(value);
  };

  return (
    <div style={styles.page}>
      <div style={styles.inner}>
        <div style={styles.header} className="animate-fade-up">
          <div>
            <p style={styles.kicker}>Admin</p>
            <h1 style={styles.title}>Control Center</h1>
            <p style={styles.subtitle}>Manage users, marketplace content, bookings, reviews, and money movement.</p>
          </div>
          <button onClick={() => Promise.all([loadRows(), loadSummary()])} style={styles.refresh}>Refresh</button>
        </div>

        {summary && (
          <div style={styles.summaryGrid}>
            {Object.entries(summary).map(([key, value]) => (
              <div key={key} style={styles.summaryCard} className="animate-fade-up">
                <p style={styles.summaryLabel}>{key}</p>
                <p style={styles.summaryValue}>{Number(value || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

        <div style={styles.shell}>
          <aside style={styles.sidebar}>
            {Object.entries(RESOURCES).map(([key, item]) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                style={active === key ? styles.navActive : styles.navButton}
              >
                {item.label}
              </button>
            ))}
            <div style={{ borderTop: "1px solid #e5e7eb", marginTop: "0.5rem", paddingTop: "0.5rem" }}>
              <button
                onClick={() => navigate("/admin/messages")}
                style={{ ...styles.navButton, background: "transparent", color: "#94a3b8", display: "block", width: "100%" }}
              >
                💬 Messages
              </button>
              <button
                onClick={() => navigate("/admin/disputes")}
                style={{ ...styles.navButton, background: "transparent", color: "#94a3b8", display: "block", width: "100%" }}
              >
                ⚠️ Disputes
              </button>
            </div>
          </aside>

          <main style={styles.main}>
            <div style={styles.toolbar}>
              <div>
                <h2 style={styles.sectionTitle}>{config.label}{filter !== "all" && " (filtered)"}</h2>
                <p style={styles.count}>{filteredRows.length} records</p>
              </div>
              <div style={styles.toolbarActions}>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search records..."
                  style={styles.search}
                />
                {(active === "users" || active === "assets" || active === "bookings") && (
                  <select value={filter} onChange={e => setFilter(e.target.value)} style={styles.select}>
                    <option value="all">All</option>
                    {active === "users" && (
                      <>
                        <option value="verified">Verified</option>
                        <option value="banned">Banned</option>
                        <option value="admin">Admins</option>
                      </>
                    )}
                    {active === "assets" && (
                      <>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </>
                    )}
                    {active === "bookings" && (
                      <>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </>
                    )}
                  </select>
                )}
                {config.createFields && <button onClick={() => openEditor()} style={styles.primary}>New</button>}
              </div>
            </div>

            {loading ? (
              <div style={styles.loading}>Loading...</div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {config.columns.map(column => <th key={column} style={styles.th}>{column}</th>)}
                      {!config.readOnly && <th style={styles.th}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map(row => (
                      <tr key={row[config.id]} style={styles.tr}>
                        {config.columns.map(column => (
                          <td key={column} style={{...styles.td, color: getStatusColor(row[column])}}>{renderValue(row[column])}</td>
                        ))}
                        {!config.readOnly && (
                          <td style={styles.td}>
                            <div style={styles.rowActions}>
                              {active === "users" && (
                                <>
                                  <button onClick={() => toggleBan(row)} disabled={actionLoading === row.UserID} style={styles.smallDanger}>
                                    {actionLoading === row.UserID ? "..." : (row.IsBanned ? "Unban" : "Ban")}
                                  </button>
                                  <button onClick={() => toggleVerify(row)} disabled={actionLoading === row.UserID} style={styles.small}>
                                    {actionLoading === row.UserID ? "..." : (row.IsVerified ? "Unverify" : "Verify")}
                                  </button>
                                </>
                              )}
                              {active === "assets" && (
                                <button onClick={() => toggleAssetActive(row)} disabled={actionLoading === row.AssetID} style={styles.smallSuccess}>
                                  {actionLoading === row.AssetID ? "..." : (row.IsActive ? "Deactivate" : "Activate")}
                                </button>
                              )}
                              {config.fields.length > 0 && <button onClick={() => openEditor(row)} style={styles.small}>Edit</button>}
                              <button onClick={() => remove(row)} style={styles.smallDanger}>Delete</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        </div>
      </div>

      {editor && (
        <div style={styles.overlay}>
          <form onSubmit={save} style={styles.modal} className="animate-scale-in">
            <button type="button" onClick={() => setEditor(null)} style={styles.close}>×</button>
            <p style={styles.kicker}>{editor.row ? "Edit" : "Create"}</p>
            <h2 style={styles.modalTitle}>{config.label.slice(0, -1)}</h2>

            {editor.fields.map(field => (
              <label key={field} style={styles.field}>
                <span style={styles.fieldLabel}>{field}</span>
                {typeof editor.form[field] === "boolean" || field.toLowerCase().startsWith("is") ? (
                  <select
                    value={String(editor.form[field])}
                    onChange={e => setEditor(prev => ({ ...prev, form: { ...prev.form, [field]: e.target.value === "true" } }))}
                    style={styles.input}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                ) : field === "role" ? (
                  <select
                    value={editor.form[field] || "user"}
                    onChange={e => setEditor(prev => ({ ...prev, form: { ...prev.form, [field]: e.target.value } }))}
                    style={styles.input}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                ) : field === "status" ? (
                  <input
                    value={editor.form[field]}
                    onChange={e => setEditor(prev => ({ ...prev, form: { ...prev.form, [field]: e.target.value } }))}
                    placeholder="pending / confirmed / open / closed ..."
                    style={styles.input}
                  />
                ) : (
                  <input
                    value={editor.form[field]}
                    onChange={e => setEditor(prev => ({ ...prev, form: { ...prev.form, [field]: e.target.value } }))}
                    style={styles.input}
                  />
                )}
              </label>
            ))}

            <button type="submit" disabled={saving} style={styles.primaryWide}>
              {saving ? "Saving..." : "Save"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1a1f35 100%)", color: "#e5e7eb", padding: "2rem" },
  inner: { maxWidth: 1500, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", gap: "1rem" },
  kicker: { margin: 0, color: "#f4a020", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em" },
  title: { margin: "0.25rem 0", color: "#fff", fontSize: "3rem", fontWeight: 950 },
  subtitle: { margin: 0, color: "#94a3b8" },
  refresh: { padding: "0.75rem 1.25rem", background: "linear-gradient(135deg, #8B1538 0%, #6B0F1A 100%)", color: "#e5e7eb", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 800 },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1.5rem" },
  summaryCard: { background: "#111827", border: "1px solid #253047", borderRadius: 14, padding: "1.25rem" },
  summaryLabel: { margin: 0, color: "#94a3b8", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 900 },
  summaryValue: { margin: "0.35rem 0 0", color: "#fff", fontSize: "1.8rem", fontWeight: 950 },
  shell: { display: "grid", gridTemplateColumns: "220px 1fr", gap: "1rem", alignItems: "start" },
  sidebar: { background: "#111827", border: "1px solid #253047", borderRadius: 14, padding: "0.75rem", display: "grid", gap: "0.4rem", position: "sticky", top: 90 },
  navButton: { padding: "0.8rem 1rem", background: "transparent", color: "#94a3b8", border: "none", borderRadius: 10, textAlign: "left", cursor: "pointer", fontWeight: 800 },
  navActive: { padding: "0.8rem 1rem", background: "linear-gradient(135deg, #8B1538 0%, #6B0F1A 100%)", color: "#fff", border: "none", borderRadius: 10, textAlign: "left", cursor: "pointer", fontWeight: 900 },
  main: { background: "#fff", color: "#111827", borderRadius: 14, overflow: "hidden" },
  toolbar: { padding: "1rem", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" },
  sectionTitle: { margin: 0, fontSize: "1.4rem", fontWeight: 900 },
  count: { margin: "0.25rem 0 0", color: "#6b7280" },
  toolbarActions: { display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" },
  search: { padding: "0.75rem 1rem", border: "1px solid #d1d5db", borderRadius: 10, minWidth: 240 },
  select: { padding: "0.75rem 1rem", border: "1px solid #d1d5db", borderRadius: 10, background: "#fff", color: "#111827" },
  primary: { padding: "0.75rem 1rem", background: "linear-gradient(135deg, #8B1538 0%, #6B0F1A 100%)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 900, cursor: "pointer" },
  loading: { padding: "3rem", textAlign: "center", color: "#6b7280" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "0.85rem 1rem", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b7280", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #f3f4f6" },
  td: { padding: "0.85rem 1rem", fontSize: "0.9rem", color: "#111827", maxWidth: 260, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  rowActions: { display: "flex", gap: "0.5rem" },
  small: { padding: "0.45rem 0.7rem", background: "#eff6ff", color: "#1e40af", border: "1px solid #93c5fd", borderRadius: 8, cursor: "pointer", fontWeight: 800 },
  smallDanger: { padding: "0.45rem 0.7rem", background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 8, cursor: "pointer", fontWeight: 800 },
  smallSuccess: { padding: "0.45rem 0.7rem", background: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac", borderRadius: 8, cursor: "pointer", fontWeight: 800 },
  overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" },
  modal: { width: "min(520px, 100%)", background: "#fff", color: "#111827", borderRadius: 16, padding: "2rem", position: "relative", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" },
  close: { position: "absolute", top: 14, right: 14, width: 34, height: 34, border: "1px solid #e5e7eb", background: "#f9fafb", borderRadius: 8, fontSize: "1.3rem", cursor: "pointer" },
  modalTitle: { margin: "0.25rem 0 1.25rem", color: "#111827" },
  field: { display: "block", marginBottom: "1rem" },
  fieldLabel: { display: "block", marginBottom: "0.4rem", color: "#6b7280", fontWeight: 800, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.06em" },
  input: { width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: 10 },
  primaryWide: { width: "100%", padding: "0.9rem", background: "linear-gradient(135deg, #8B1538 0%, #6B0F1A 100%)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 900, cursor: "pointer", marginTop: "0.5rem" },
};
