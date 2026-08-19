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

type ApiResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Metric[];
};
type Metadata = { years: number[]; regions: string[] };
type Summary = { arrivals: number; receipts_usd: number | string; countries: number };
type TrendPoint = { year: number; arrivals: number };
type CountryYearMetric = { year: number; arrivals: number | null; receiptsUsd: string | null };
type CountryDetail = {
  code: string;
  name: string;
  region: string;
  source: string;
  metrics: CountryYearMetric[];
};
type CountryDetailResponse = { data?: { country: CountryDetail | null }; errors?: { message: string }[] };

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";
const GRAPHQL_URL = `${API_BASE_URL.replace(/\/api\/?$/, "")}/graphql/`;
const PAGE_SIZE = 25;

function compact(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function money(value: number) {
  return new Intl.NumberFormat("en", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal });
  if (!response.ok) throw new Error(`API request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

async function getCountryDetail(code: string, signal?: AbortSignal): Promise<CountryDetail> {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query CountryDetail($code: String!) {
          country(code: $code) {
            code
            name
            region
            source
            metrics { year arrivals receiptsUsd }
          }
        }
      `,
      variables: { code },
    }),
    signal,
  });
  if (!response.ok) throw new Error(`GraphQL request failed with ${response.status}`);
  const result = await response.json() as CountryDetailResponse;
  if (result.errors?.length || !result.data?.country) throw new Error(result.errors?.[0]?.message ?? "Country not found");
  return result.data.country;
}

function TrendChart({ values, labels }: { values: number[]; labels: string[] }) {
  const width = 760, height = 210;
  const max = Math.max(...values, 1);
  const xy = values.map((value, index) => ({ x: values.length === 1 ? width / 2 : (index / (values.length - 1)) * width, y: height - (value / max) * (height - 12) }));
  const points = xy.map(({ x, y }) => `${x},${y}`).join(" ");
  return <div className="chart-wrap" aria-label="Annual international tourism arrivals">
    {values.length === 0 ? <p className="empty-state">No trend data matches the selected filters.</p> : <svg viewBox={`0 0 ${width} ${height + 28}`} role="img">
      {[0, 1, 2, 3].map(line => <line key={line} x1="0" y1={line * 60 + 4} x2={width} y2={line * 60 + 4} className="grid-line" />)}
      <polyline points={points} fill="none" className="trend-line" />
      {xy.map((point, index) => <circle key={labels[index]} cx={point.x} cy={point.y} r="4" className="trend-dot" />)}
      {labels.map((label, index) => <text key={label} x={xy[index].x} y={height + 25} textAnchor="middle" className="axis-label">{label}</text>)}
    </svg>}
  </div>;
}

function CountryDetailPanel({ detail, code, status, onClose }: {
  detail: CountryDetail | null;
  code: string;
  status: "loading" | "ready" | "error";
  onClose: () => void;
}) {
  const values = detail?.metrics.map(item => item.arrivals ?? 0) ?? [];
  const labels = detail?.metrics.map(item => String(item.year)) ?? [];

  return <section className="country-detail" aria-live="polite">
    <div className="country-detail-heading">
      <div><p className="eyebrow">GRAPHQL DRILL-DOWN</p><h3>{detail?.name ?? code}</h3>{detail && <p>{detail.code} · {detail.region}</p>}</div>
      <button type="button" onClick={onClose} aria-label="Close country details">Close</button>
    </div>
    {status === "loading" && <p className="detail-message" role="status">Loading country history through GraphQL…</p>}
    {status === "error" && <p className="detail-message error-text">Country details could not be loaded.</p>}
    {status === "ready" && detail && <>
      <div className="detail-meta"><span>Loaded through GraphQL</span><span>{detail.source}</span><span>{detail.metrics.length} reporting years</span></div>
      <TrendChart values={values} labels={labels} />
      <div className="detail-years" aria-label={`${detail.name} annual tourism metrics`}>
        {detail.metrics.map(item => <article key={item.year}>
          <strong>{item.year}</strong>
          <span>{item.arrivals === null ? "Arrivals not reported" : `${item.arrivals.toLocaleString()} arrivals`}</span>
          <span>{item.receiptsUsd === null ? "Receipts not reported" : `${money(Number(item.receiptsUsd))} receipts`}</span>
        </article>)}
      </div>
    </>}
  </section>;
}

export default function App() {
  const [metadata, setMetadata] = useState<Metadata>({ years: [], regions: [] });
  const [metrics, setMetrics] = useState<ApiResponse>({ count: 0, next: null, previous: null, results: [] });
  const [summary, setSummary] = useState<Summary>({ arrivals: 0, receipts_usd: 0, countries: 0 });
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [year, setYear] = useState<number | null>(null);
  const [region, setRegion] = useState("All regions");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [countryDetail, setCountryDetail] = useState<CountryDetail | null>(null);
  const [detailStatus, setDetailStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    getJson<Metadata>("/metadata/")
      .then(data => {
        setMetadata(data);
        setYear(data.years[0] ?? null);
        setStatus(data.years.length === 0 ? "ready" : "loading");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [year, region, query]);

  useEffect(() => {
    if (year === null) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setStatus("loading");
      const filters = new URLSearchParams({ year: String(year) });
      const trendFilters = new URLSearchParams();
      if (region !== "All regions") {
        filters.set("region", region);
        trendFilters.set("region", region);
      }
      if (query.trim()) {
        filters.set("search", query.trim());
        trendFilters.set("search", query.trim());
      }
      const tableFilters = new URLSearchParams(filters);
      tableFilters.set("page", String(page));
      tableFilters.set("page_size", String(PAGE_SIZE));

      Promise.all([
        getJson<ApiResponse>(`/metrics/?${tableFilters}`, controller.signal),
        getJson<Summary>(`/summary/?${filters}`, controller.signal),
        getJson<TrendPoint[]>(`/trends/?${trendFilters}`, controller.signal),
      ]).then(([metricData, summaryData, trendData]) => {
        setMetrics(metricData);
        setSummary(summaryData);
        setTrend(trendData);
        setStatus("ready");
      }).catch(error => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
      });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [page, query, region, year]);

  useEffect(() => {
    if (!selectedCountryCode) {
      setCountryDetail(null);
      return;
    }
    const controller = new AbortController();
    setDetailStatus("loading");
    getCountryDetail(selectedCountryCode, controller.signal)
      .then(data => {
        setCountryDetail(data);
        setDetailStatus("ready");
      })
      .catch(error => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCountryDetail(null);
        setDetailStatus("error");
      });
    return () => controller.abort();
  }, [selectedCountryCode]);

  const trendValues = useMemo(() => trend.map(item => item.arrivals), [trend]);
  const trendLabels = useMemo(() => trend.map(item => String(item.year)), [trend]);
  const pageCount = Math.max(1, Math.ceil(metrics.count / PAGE_SIZE));

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">T</span><span>Tourism Lens</span></div>
      <nav aria-label="Primary navigation"><a className="nav-item active" href="#overview">Overview</a><a className="nav-item" href="#markets">Countries</a><a className="nav-item" href="#trend">Annual trends</a><a className="nav-item" href="#about">Data notes</a></nav>
      <div className="data-note" id="about"><strong>Public data</strong><p>World Bank indicators sourced from UN Tourism. Values depend on country reporting and may be incomplete.</p></div>
    </aside>
    <section className="content" id="overview">
      <header className="topbar"><div><p className="eyebrow">GLOBAL TOURISM PERFORMANCE</p><h1>International tourism overview</h1><p className="subtitle">Explore reported arrivals and receipts by country, region, and year.</p></div><span className="demo-badge">WORLD BANK DATA</span></header>
      {status === "error" && <section className="panel error-panel"><h2>API unavailable</h2><p>Start the Django API locally or configure <code>VITE_API_BASE_URL</code> for the deployed backend.</p></section>}
      {metadata.years.length === 0 && status !== "error" && <section className="panel"><h2>No tourism data available</h2><p>Import the World Bank dataset before using the dashboard.</p></section>}
      {metadata.years.length > 0 && <>
        <div className="filters" aria-label="Dashboard filters">
          <label>Reporting year<select value={year ?? ""} onChange={event => setYear(Number(event.target.value))}>{metadata.years.map(item => <option key={item}>{item}</option>)}</select></label>
          <label>Region<select value={region} onChange={event => setRegion(event.target.value)}><option>All regions</option>{metadata.regions.map(item => <option key={item}>{item}</option>)}</select></label>
          <button type="button" onClick={() => { setYear(metadata.years[0] ?? null); setRegion("All regions"); setQuery(""); }}>Reset filters</button>
        </div>
        {status === "loading" && <p className="loading-note" role="status">Updating tourism metrics…</p>}
        <section className="kpi-grid" aria-label="Key performance indicators" aria-busy={status === "loading"}>
          <article className="kpi-card"><p>Reported arrivals</p><strong>{compact(summary.arrivals)}</strong><span className="neutral">Across selected countries</span></article>
          <article className="kpi-card"><p>Tourism receipts</p><strong>{money(Number(summary.receipts_usd))}</strong><span className="neutral">Current US dollars</span></article>
          <article className="kpi-card"><p>Countries represented</p><strong>{summary.countries}</strong><span className="neutral">With at least one metric</span></article>
          <article className="kpi-card"><p>Reporting year</p><strong>{year}</strong><span className="neutral">Latest available varies by country</span></article>
        </section>
        <section className="panel" id="trend"><div className="panel-heading"><div><p className="eyebrow">ANNUAL SERIES</p><h2>Reported international arrivals</h2></div><div className="legend"><span />Arrivals</div></div><TrendChart values={trendValues} labels={trendLabels} /></section>
        <section className="panel" id="markets"><div className="panel-heading table-heading"><div><p className="eyebrow">COUNTRY COMPARISON</p><h2>Tourism performance</h2></div><label className="search-label"><span>Search countries</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by country or code" /></label></div>
          {selectedCountryCode && <CountryDetailPanel detail={countryDetail} code={selectedCountryCode} status={detailStatus} onClose={() => setSelectedCountryCode(null)} />}
          <div className="table-scroll"><table><thead><tr><th>Country</th><th>Region</th><th>Arrivals</th><th>Receipts</th></tr></thead><tbody>{metrics.results.map(item => <tr key={item.id}><td><button type="button" className="country-link" aria-label={`View details for ${item.country_name}`} onClick={() => setSelectedCountryCode(item.country_code)}>{item.country_name}</button> <small>{item.country_code}</small></td><td>{item.region}</td><td>{item.arrivals?.toLocaleString() ?? "Not reported"}</td><td>{item.receipts_usd ? money(Number(item.receipts_usd)) : "Not reported"}</td></tr>)}</tbody></table>{metrics.results.length === 0 && <p className="empty-state">No countries match the selected filters.</p>}</div>
          <div className="pagination" aria-label="Country results pagination">
            <button type="button" disabled={!metrics.previous || status === "loading"} onClick={() => setPage(current => Math.max(1, current - 1))}>Previous</button>
            <span>Page {page} of {pageCount} · {metrics.count} countries</span>
            <button type="button" disabled={!metrics.next || status === "loading"} onClick={() => setPage(current => current + 1)}>Next</button>
          </div>
        </section>
      </>}
      <footer>Tourism Lens · World Bank / UN Tourism · CC BY 4.0</footer>
    </section>
  </main>;
}
