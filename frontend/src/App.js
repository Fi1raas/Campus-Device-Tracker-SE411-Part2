import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "./assets/logo.png";

const api = process.env.REACT_APP_ASSET_API || "http://localhost:8080/assets";
const pageSize = 3;

async function request(path = "", options = {}) {
  const response = await fetch(api + path, options);
  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(details.message || (response.status === 404 ? "Device not found." : "The server could not process the request."));
  }
  return response.status === 204 ? null : response.json();
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={styles.app}>
        <nav style={styles.navbar}>
          <div style={styles.brand}><img src={logo} alt="" style={styles.logoImg} /><strong>Campus Device Tracker</strong></div>
          <div>
            <Link to="/" style={styles.navLink}>Home</Link>
            <Link to="/add" style={styles.navLink}>Add Asset</Link>
            <Link to="/about" style={styles.navLink}>About</Link>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add" element={<DeviceForm key="add" />} />
          <Route path="/edit/:id" element={<Edit />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function Home() {
  const [term, setTerm] = useState("");
  const [id, setId] = useState("");
  const [lookup, setLookup] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [match, setMatch] = useState(null);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    setLoading(true);
    setError("");
    setMatch(null);
    const query = new URLSearchParams({ page, size: pageSize, q: term });
    const load = async () => {
      try {
        const result = await request("?" + query, options);
        if (controller.signal.aborted) return;
        setData(result);
        if (!lookup && page >= result.totalPages && page > 0) {
          setPage(Math.max(0, result.totalPages - 1));
          return;
        }
        if (lookup) {
          const device = await request("/" + encodeURIComponent(lookup), options);
          if (!controller.signal.aborted) setMatch(device);
        }
      } catch (e) {
        if (!controller.signal.aborted) setError(e.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [page, term, lookup, revision]);

  async function remove(deviceId) {
    setError("");
    setDeleting(true);
    try {
      await request("/" + deviceId, { method: "DELETE" });
      if (lookup) { setLookup(""); setId(""); }
      setRevision(v => v + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  }

  const assets = lookup ? (match ? [match] : []) : data?.items || [];
  return (
    <main style={styles.page}>
      <h1 style={styles.title}>University IT Assets</h1>
      <p style={styles.subtitle}>Track and manage university computing equipment</p>
      <div style={styles.statsGrid}>
        <StatCard label="TOTAL ASSETS" value={data?.inventoryTotal} color="#111827" />
        <StatCard label="AVAILABLE" value={data?.available} color="#15803d" />
        <StatCard label="IN USE" value={data?.inUse} color="#b91c1c" />
      </div>
      <div style={{ ...styles.toolbar, flexWrap: "wrap", gap: 12 }}>
        <input aria-label="Search by name or status" placeholder="Search by name or status" value={term}
          onChange={e => { setTerm(e.target.value); setLookup(""); setId(""); setPage(0); }} style={styles.searchInput} />
        <form style={{ display: "flex", gap: 8 }} onSubmit={e => { e.preventDefault(); setLookup(id.trim()); setRevision(v => v + 1); }}>
          <input aria-label="Device ID" placeholder="Device ID" type="text" inputMode="numeric" pattern="[0-9]+" required
            value={id} onChange={e => setId(e.target.value)} style={{ ...styles.searchInput, width: 120 }} />
          <button type="submit" style={styles.editButton}>Find by ID</button>
          {lookup && <button type="button" style={styles.editButton} onClick={() => { setLookup(""); setId(""); }}>Back to list</button>}
        </form>
        <Link to="/add" style={styles.addButton}>Add Device</Link>
      </div>
      {error && <p role="alert">{error}</p>}
      {loading ? <p role="status">Loading devices…</p> : (
        <div style={styles.tableCard}>
          <div style={styles.tableHeader}><span>DEVICE</span><span>STATUS</span><span>ACTIONS</span></div>
          {!assets.length && !error && <p style={{ padding: "0 20px" }}>No matching devices.</p>}
          {assets.map(asset => (
            <div key={asset.id} style={styles.tableRow}>
              <div><strong>{asset.name}</strong><p style={styles.assetId}>ID: {asset.id}</p></div>
              <div><span style={{ ...styles.badge, background: asset.status === "Available" ? "#dcfce7" : "#fee2e2" }}>{asset.status}</span></div>
              <div><Link to={"/edit/" + asset.id} style={styles.editButton}>Edit</Link>
                <button disabled={deleting} onClick={() => remove(asset.id)} style={styles.deleteButton}>Delete</button></div>
            </div>
          ))}
        </div>
      )}
      {!lookup && data && <nav aria-label="Pagination" style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 18 }}>
        <button disabled={loading || page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
        <span>Page {data.totalPages ? page + 1 : 0} of {data.totalPages} | {data.totalElements} matching devices</span>
        <button disabled={loading || page + 1 >= data.totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
      </nav>}
    </main>
  );
}

function StatCard({ label, value, color }) {
  return <div style={styles.statCard}><p style={styles.statLabel}>{label}</p><h2 style={{ ...styles.statValue, color }}>{value ?? "—"}</h2></div>;
}

function Edit() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    request("/" + encodeURIComponent(id), { signal: controller.signal })
      .then(asset => { if (!controller.signal.aborted) setResult({ id, asset }); })
      .catch(error => { if (!controller.signal.aborted) setResult({ id, error: error.message }); });
    return () => controller.abort();
  }, [id]);
  if (!result || result.id !== id) return <main style={styles.page}><p role="status">Loading device…</p></main>;
  if (result.error) return <main style={styles.page}><p role="alert">{result.error}</p><Link to="/">Back to Home</Link></main>;
  return <DeviceForm key={id} asset={result.asset} />;
}

function DeviceForm({ asset }) {
  const [name, setName] = useState(asset?.name || "");
  const [status, setStatus] = useState(asset?.status || "Available");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  async function submit(event) {
    event.preventDefault();
    if (!name.trim()) { setError("Enter a device name."); return; }
    setError("");
    setSaving(true);
    try {
      await request(asset ? "/" + asset.id : "", {
        method: asset ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), status })
      });
      navigate("/");
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }
  return <main style={styles.page}>
    <h1 style={styles.title}>{asset ? "Edit Device" : "Add New Device"}</h1>
    <form onSubmit={submit} style={styles.formCard}>
      <label htmlFor="name" style={styles.label}>Device Name</label>
      <input id="name" required maxLength={100} value={name} onChange={e => setName(e.target.value)} style={styles.formInput} />
      <label htmlFor="status" style={styles.label}>Status</label>
      <select id="status" value={status} onChange={e => setStatus(e.target.value)} style={styles.formInput}>
        <option>Available</option><option>In Use</option>
      </select>
      {error && <p role="alert">{error}</p>}
      <button disabled={saving} type="submit" style={asset ? styles.updateButton : styles.submitButton}>{saving ? "Saving…" : asset ? "Update Device" : "Add Device"}</button>
    </form>
  </main>;
}

function About() {
  return <main style={styles.page}><h1 style={styles.title}>About</h1>
    <div style={styles.formCard}><p>Firas Alwashmi - 221211353</p></div>
  </main>;
}

const styles = {
  app: {
    fontFamily: "Arial, sans-serif",
    background: "#f1f5f9",
    minHeight: "100vh",
    color: "#0f172a"
  },
  navbar: {
    background: "#0f172a",
    color: "white",
    height: "72px",
    padding: "0 45px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "18px"
  },
  logo: {
    background: "#3b82f6",
    padding: "8px",
    borderRadius: "8px"
  },
  navLink: {
    color: "#cbd5e1",
    textDecoration: "none",
    marginLeft: "35px",
    fontWeight: "500"
  },
  page: {
    padding: "55px 45px"
  },
  title: {
    margin: "0 0 12px 0",
    fontSize: "30px"
  },
  subtitle: {
    color: "#64748b",
    marginBottom: "35px"
  },
  statsGrid: {
    display: "flex",
    gap: "20px",
    marginBottom: "35px"
  },
  statCard: {
    background: "white",
    width: "290px",
    padding: "22px 25px",
    borderRadius: "14px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
  },
  statLabel: {
    color: "#94a3b8",
    fontWeight: "bold",
    fontSize: "13px",
    letterSpacing: "1px"
  },
  logoImg: {
    width: "100px",
    height: "100px",
    objectFit: "contain"
  },
  statValue: {
    fontSize: "32px",
    margin: "8px 0 0"
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    marginBottom: "20px"
  },
  searchInput: {
    width: "420px",
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "16px",
    outline: "none"
  },
  addButton: {
    background: "#3b82f6",
    color: "white",
    textDecoration: "none",
    padding: "14px 22px",
    borderRadius: "10px",
    marginLeft: "10px",
    fontWeight: "bold"
  },
  tableCard: {
    background: "white",
    maxWidth: "1050px",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1.3fr 1.5fr",
    background: "#f8fafc",
    padding: "16px 20px",
    fontWeight: "bold",
    color: "#64748b",
    fontSize: "14px"
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1.3fr 1.5fr",
    padding: "18px 20px",
    borderTop: "1px solid #e5e7eb",
    alignItems: "center"
  },
  assetId: {
    margin: "5px 0 0",
    color: "#94a3b8",
    fontSize: "14px"
  },
  badge: {
    padding: "7px 14px",
    borderRadius: "20px",
    fontWeight: "bold",
    fontSize: "14px"
  },
  editButton: {
    border: "1px solid #3b82f6",
    color: "#2563eb",
    padding: "8px 16px",
    borderRadius: "8px",
    textDecoration: "none",
    marginRight: "10px"
  },
  deleteButton: {
    border: "1px solid #ef4444",
    color: "#dc2626",
    background: "white",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px"
  },
  formCard: {
    background: "white",
    padding: "25px",
    borderRadius: "14px",
    maxWidth: "450px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "bold",
    color: "#334155"
  },
  formInput: {
    width: "100%",
    padding: "13px",
    marginBottom: "18px",
    borderRadius: "9px",
    border: "1px solid #cbd5e1",
    boxSizing: "border-box",
    fontSize: "15px"
  },
  submitButton: {
    width: "100%",
    padding: "13px",
    background: "#22c55e",
    color: "white",
    border: "none",
    borderRadius: "9px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  updateButton: {
    width: "100%",
    padding: "13px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "9px",
    fontWeight: "bold",
    cursor: "pointer"
  }
};


