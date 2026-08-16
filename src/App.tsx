import { useEffect, useMemo, useState } from "react";

type Metric = {
  id: number;
  country_code: string;
  country_name: string;
  region: string;
  year: number;
  arrivals: number | null;
  receipts_usd: string | null;
  source: string;
};

type ApiResponse = { count: number; results: Metric[] };

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

function compact(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function money(value: number) {
  return new Intl.NumberFormat("en", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function TrendChart({ values, labels }: { values: number[]; labels: string[] }) {
  const width = 760, height = 210;
  const max = Math.max(...values, 1);
  const xy = values.map((value, index) => ({ x: values.length === 1 ? width / 2 : (index / (values.length - 1)) * width, y: height - (value / max) * (height - 12) }));
  const points = xy.map(({ x, y }) => `${x},${y}`).join(" ");
  return <div className="chart-wrap" aria-label="Annual international tourism arrivals">
    <svg viewBox={`0 0 ${width} ${height + 28}`} role="img">
      {[0, 1, 2, 3].map(line => <line key={line} x1="0" y1={line * 60 + 4} x2={width} y2={line * 60 + 4} className="grid-line" />)}
      <polyline points={points} fill="none" className="trend-line" />
      {xy.map((point, index) => <circle key={labels[index]} cx={point.x} cy={point.y} r="4" className="trend-dot" />)}
      {labels.map((label, index) => <text key={label} x={xy[index].x} y={height + 25} textAnchor="middle" className="axis-label">{label}</text>)}
    </svg>
  </div>;
}

export default function App() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [year, setYear] = useState<number | null>(null);
  const [region, setRegion] = useState("All regions");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    fetch(`${API_BASE_URL}/metrics/?page_size=1000`)
      .then(response => { if (!response.ok) throw new Error("API request failed"); return response.json() as Promise<ApiResponse>; })
      .then(data => { setMetrics(data.results); setYear(Math.max(...data.results.map(item => item.year))); setStatus("ready"); })
      .catch(() => setStatus("error"));
  }, []);

  const years = useMemo(() => [...new Set(metrics.map(item => item.year))].sort((a, b) => b - a), [metrics]);
  const regions = useMemo(() => [...new Set(metrics.map(item => item.region))].sort(), [metrics]);
  const selected = useMemo(() => metrics.filter(item => item.year === year && (region === "All regions" || item.region === region) && item.country_name.toLowerCase().includes(query.toLowerCase())), [metrics, query, region, year]);
  const trend = useMemo(() => years.slice().reverse().map(trendYear => metrics.filter(item => item.year === trendYear && item.arrivals).reduce((sum, item) => sum + (item.arrivals ?? 0), 0)), [metrics, years]);
  const totalArrivals = selected.reduce((sum, item) => sum + (item.arrivals ?? 0), 0);
  const totalReceipts = selected.reduce((sum, item) => sum + Number(item.receipts_usd ?? 0), 0);

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">T</span><span>Tourism Lens</span></div>
      <nav aria-label="Primary navigation"><a className="nav-item active" href="#overview">Overview</a><a className="nav-item" href="#markets">Countries</a><a className="nav-item" href="#trend">Annual trends</a><a className="nav-item" href="#about">Data notes</a></nav>
      <div className="data-note" id="about"><strong>Public data</strong><p>World Bank indicators sourced from UN Tourism. Values depend on country reporting and may be incomplete.</p></div>
    </aside>
    <section className="content" id="overview">
      <header className="topbar"><div><p className="eyebrow">GLOBAL TOURISM PERFORMANCE</p><h1>International tourism overview</h1><p className="subtitle">Explore reported arrivals and receipts by country, region, and year.</p></div><span className="demo-badge">WORLD BANK DATA</span></header>
      {status === "loading" && <section className="panel"><p>Loading tourism metrics…</p></section>}
      {status === "error" && <section className="panel"><h2>API unavailable</h2><p>Start the Django API locally or configure <code>VITE_API_BASE_URL</code> for the deployed backend.</p></section>}
      {status === "ready" && <>
        <div className="filters" aria-label="Dashboard filters">
          <label>Reporting year<select value={year ?? ""} onChange={event => setYear(Number(event.target.value))}>{years.map(item => <option key={item}>{item}</option>)}</select></label>
          <label>Region<select value={region} onChange={event => setRegion(event.target.value)}><option>All regions</option>{regions.map(item => <option key={item}>{item}</option>)}</select></label>
          <button type="button" onClick={() => { setYear(years[0]); setRegion("All regions"); setQuery(""); }}>Reset filters</button>
        </div>
        <section className="kpi-grid" aria-label="Key performance indicators">
          <article className="kpi-card"><p>Reported arrivals</p><strong>{compact(totalArrivals)}</strong><span className="neutral">Across selected countries</span></article>
          <article className="kpi-card"><p>Tourism receipts</p><strong>{money(totalReceipts)}</strong><span className="neutral">Current US dollars</span></article>
          <article className="kpi-card"><p>Countries represented</p><strong>{selected.length}</strong><span className="neutral">With at least one metric</span></article>
          <article className="kpi-card"><p>Reporting year</p><strong>{year}</strong><span className="neutral">Latest available varies by country</span></article>
        </section>
        <section className="panel" id="trend"><div className="panel-heading"><div><p className="eyebrow">ANNUAL SERIES</p><h2>Reported international arrivals</h2></div><div className="legend"><span />Arrivals</div></div><TrendChart values={trend} labels={years.slice().reverse().map(String)} /></section>
        <section className="panel" id="markets"><div className="panel-heading table-heading"><div><p className="eyebrow">COUNTRY COMPARISON</p><h2>Tourism performance</h2></div><label className="search-label"><span>Search countries</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by country" /></label></div>
          <div className="table-scroll"><table><thead><tr><th>Country</th><th>Region</th><th>Arrivals</th><th>Receipts</th></tr></thead><tbody>{selected.map(item => <tr key={item.id}><td><strong>{item.country_name}</strong> <small>{item.country_code}</small></td><td>{item.region}</td><td>{item.arrivals?.toLocaleString() ?? "Not reported"}</td><td>{item.receipts_usd ? money(Number(item.receipts_usd)) : "Not reported"}</td></tr>)}</tbody></table>{selected.length === 0 && <p className="empty-state">No countries match the selected filters.</p>}</div>
        </section>
      </>}
      <footer>Tourism Lens · World Bank / UN Tourism · CC BY 4.0</footer>
    </section>
  </main>;
}
