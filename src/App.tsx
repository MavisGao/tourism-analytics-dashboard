import { useMemo, useState } from "react";

type Market = { name: string; region: string; visitors: number; spend: number; nights: number; change: number };

const markets: Market[] = [
  { name: "United States", region: "North America", visitors: 42180, spend: 38.6, nights: 2.8, change: 12.4 },
  { name: "Canada", region: "North America", visitors: 24320, spend: 19.2, nights: 3.1, change: 8.7 },
  { name: "United Kingdom", region: "Europe", visitors: 13940, spend: 14.8, nights: 4.2, change: 5.3 },
  { name: "Germany", region: "Europe", visitors: 9850, spend: 10.1, nights: 3.8, change: -1.9 },
];

const monthly = [58, 64, 61, 72, 78, 83, 96, 102, 91, 86, 74, 69];
const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function TrendChart() {
  const width = 760, height = 210, min = 45, max = 110;
  const xy = monthly.map((value, index) => ({ x: (index / 11) * width, y: height - ((value - min) / (max - min)) * height }));
  const points = xy.map(({ x, y }) => `${x},${y}`).join(" ");

  return <div className="chart-wrap" aria-label="Monthly visitor trend, demo data">
    <svg viewBox={`0 0 ${width} ${height + 28}`} role="img">
      {[0, 1, 2, 3].map(line => <line key={line} x1="0" y1={line * 60 + 4} x2={width} y2={line * 60 + 4} className="grid-line" />)}
      <defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#176b5b" stopOpacity="0.28" /><stop offset="100%" stopColor="#176b5b" stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,${height} ${points} ${width},${height}`} fill="url(#area)" />
      <polyline points={points} fill="none" className="trend-line" />
      {xy.map((point, index) => <circle key={labels[index]} cx={point.x} cy={point.y} r="4" className="trend-dot" />)}
      {labels.map((label, index) => <text key={label} x={(index / 11) * width} y={height + 25} textAnchor="middle" className="axis-label">{label}</text>)}
    </svg>
  </div>;
}

export default function App() {
  const [year, setYear] = useState("2026");
  const [region, setRegion] = useState("All regions");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => markets.filter(market =>
    (region === "All regions" || market.region === region) && market.name.toLowerCase().includes(query.toLowerCase())), [query, region]);

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">T</span><span>Tourism Lens</span></div>
      <nav aria-label="Primary navigation"><a className="nav-item active" href="#overview">Overview</a><a className="nav-item" href="#markets">Source markets</a><a className="nav-item" href="#trend">Visitor trends</a><a className="nav-item" href="#about">Data notes</a></nav>
      <div className="data-note" id="about"><strong>Portfolio build</strong><p>All values are labeled demo data while the data pipeline is being developed.</p></div>
    </aside>
    <section className="content" id="overview">
      <header className="topbar"><div><p className="eyebrow">DESTINATION PERFORMANCE</p><h1>Philadelphia tourism overview</h1><p className="subtitle">Explore visitor volume, economic contribution, and source-market performance.</p></div><span className="demo-badge">DEMO DATA</span></header>
      <div className="filters" aria-label="Dashboard filters">
        <label>Reporting year<select value={year} onChange={event => setYear(event.target.value)}><option>2026</option><option>2025</option></select></label>
        <label>Region<select value={region} onChange={event => setRegion(event.target.value)}><option>All regions</option><option>North America</option><option>Europe</option></select></label>
        <button type="button" onClick={() => { setYear("2026"); setRegion("All regions"); setQuery(""); }}>Reset filters</button>
      </div>
      <section className="kpi-grid" aria-label="Key performance indicators">
        <article className="kpi-card"><p>Total visitors</p><strong>1.24M</strong><span className="positive">+8.2% year over year</span></article>
        <article className="kpi-card"><p>Visitor spending</p><strong>$892M</strong><span className="positive">+6.4% year over year</span></article>
        <article className="kpi-card"><p>Average stay</p><strong>3.4 nights</strong><span className="positive">+0.2 nights</span></article>
        <article className="kpi-card"><p>Hotel occupancy</p><strong>74.6%</strong><span className="neutral">Peak: 86.1% in July</span></article>
      </section>
      <section className="panel" id="trend"><div className="panel-heading"><div><p className="eyebrow">SEASONALITY</p><h2>Monthly visitor volume</h2></div><div className="legend"><span />Visitors (thousands)</div></div><TrendChart /></section>
      <section className="panel" id="markets">
        <div className="panel-heading table-heading"><div><p className="eyebrow">MARKET MIX</p><h2>Leading source markets</h2></div><label className="search-label"><span>Search markets</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by country" /></label></div>
        <div className="table-scroll"><table><thead><tr><th>Market</th><th>Visitors</th><th>Spend</th><th>Avg. nights</th><th>YoY change</th></tr></thead><tbody>{filtered.map(market => <tr key={market.name}><td><strong>{market.name}</strong></td><td>{market.visitors.toLocaleString()}</td><td>${market.spend.toFixed(1)}M</td><td>{market.nights}</td><td className={market.change >= 0 ? "positive" : "negative"}>{market.change >= 0 ? "+" : ""}{market.change}%</td></tr>)}</tbody></table>{filtered.length === 0 && <p className="empty-state">No markets match “{query}”.</p>}</div>
      </section>
      <footer>Tourism Lens · Portfolio project · Sample data only</footer>
    </section>
  </main>;
}
