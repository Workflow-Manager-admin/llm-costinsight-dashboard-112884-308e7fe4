import React, { useState, useEffect } from "react";
import "./App.css";

// ========== THEME COLORS ==========
// primary:   #012446
// secondary: #1565c0
// accent:    #ff9800

// Mock/sample data for demonstration. In production, fetch from backend API.
const WEEK_REF = "2024-06-24";
const COSTS = {
  weeklyTotal: 7345.53,
  lastWeeklyTotal: 6850.25,
  breakdown: [
    {
      provider: "OpenAI",
      services: [
        { name: "GPT-4", cost: 2050.29, last: 1870.2 },
        { name: "GPT-3.5", cost: 860.11, last: 780.6 },
      ],
    },
    {
      provider: "Anthropic",
      services: [
        { name: "Claude 3", cost: 3305.13, last: 3200.32 },
        { name: "Claude 2", cost: 200.24, last: 210.2 },
      ],
    },
    {
      provider: "Azure OpenAI",
      services: [
        { name: "GPT-4", cost: 930.53, last: 789.18 },
      ],
    },
  ],
};
const PROVIDER_COLORS = {
  OpenAI: "#1565c0",
  Anthropic: "#ff9800",
  "Azure OpenAI": "#29b6f6"
};

// ======================== COMPONENTS ========================

// PUBLIC_INTERFACE
function SummaryCards({
  total,
  percentInfra,
  weekChange,
  isUp,
  accent,
  secondary,
}) {
  return (
    <section className="summary-cards">
      <div className="card card-total">
        <div className="label">Weekly LLM Spend</div>
        <div className="value">${total.toLocaleString()}</div>
      </div>
      <div className="card card-infra" style={{ borderColor: secondary }}>
        <div className="label">Infrastructure %</div>
        <div className="value">{percentInfra}%</div>
      </div>
      <div className="card card-change" style={{ borderColor: accent }}>
        <div className="label">Week Change</div>
        <div className={`value ${isUp ? "up" : "down"}`}>
          {isUp ? "▲" : "▼"} {weekChange}%
        </div>
      </div>
    </section>
  );
}

// PUBLIC_INTERFACE
function TableBreakdown({ breakdown }) {
  // Compute flat rows
  let rows = [];
  for (const p of breakdown) {
    for (const s of p.services) {
      rows.push({
        provider: p.provider,
        service: s.name,
        cost: s.cost,
      });
    }
  }
  // Sort descending by cost
  rows = rows.sort((a, b) => b.cost - a.cost);
  return (
    <section className="card table-card">
      <div className="table-title">By Provider &amp; Service</div>
      <div className="breakdown-table-wrap">
        <table className="breakdown-table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Service</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.provider}-${r.service}`}>
                <td>
                  <span
                    className="provider-dot"
                    style={{
                      background: PROVIDER_COLORS[r.provider] || "#444",
                    }}
                  />
                  {r.provider}
                </td>
                <td>{r.service}</td>
                <td className="cost">
                  ${r.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// PUBLIC_INTERFACE
function BarChart({ data, accent, secondary }) {
  // data: [{ label, value, prevValue, color }]
  const max = Math.max(...data.map(d => Math.max(d.value, d.prevValue)));
  return (
    <div className="card chart-card">
      <div className="chart-title">Weekly Change by Provider</div>
      <div className="chart-bar-wrap">
        {data.map((d, idx) => (
          <div key={d.label} className="chart-bar-group">
            <span className="bar-label">{d.label}</span>
            <div className="bars">
              <div
                className="bar bar-prev"
                style={{
                  height: `${(d.prevValue / max) * 100}%`,
                  background: secondary,
                  opacity: 0.4,
                }}
                title={`Last week: $${d.prevValue.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}`}
              />
              <div
                className="bar bar-current"
                style={{
                  height: `${(d.value / max) * 100}%`,
                  background: d.color,
                  boxShadow: d.value > d.prevValue ? `0 0 0 2px ${accent}` : undefined,
                }}
                title={`This week: $${d.value.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="chart-legend">
        <span className="dot now" style={{ background: accent }} /> This Week
        <span className="dot prev" style={{ background: secondary, opacity: 0.4, marginLeft: 16 }} /> Last Week
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function DonutChart({ breakdown, accent, secondary }) {
  // Calculate provider total
  const providerTotals = breakdown.map(p => ({
    provider: p.provider,
    total: p.services.reduce((t, s) => t + s.cost, 0),
    color: PROVIDER_COLORS[p.provider] || accent,
  }));
  const overall = providerTotals.reduce((t, p) => t + p.total, 0);
  let start = 0;
  // Pie as svg donut
  return (
    <div className="card donut-card">
      <div className="chart-title">Provider Share</div>
      <svg width="110" height="110" viewBox="0 0 110 110">
        {providerTotals.map((p, idx) => {
          const len = 2 * Math.PI * 48;
          const frac = p.total / overall;
          const stroke = frac * len;
          const dasharray = `${stroke} ${len - stroke}`;
          const circle = (
            <circle
              key={p.provider}
              cx="55"
              cy="55"
              r="48"
              fill="none"
              stroke={p.color}
              strokeWidth="12"
              strokeDasharray={dasharray}
              strokeDashoffset={-start * len}
              style={{
                transition: "stroke-dasharray 0.6s, stroke-dashoffset 0.6s",
              }}
            />
          );
          start += frac;
          return circle;
        })}
      </svg>
      <div className="donut-legend">
        {providerTotals.map((p) => (
          <div className="leg-row" key={p.provider}>
            <span className="donut-dot" style={{ background: p.color }}></span>
            {p.provider}
            <span className="donut-num">
              {Math.round((p.total / overall) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function ContributorsHighlight({ breakdown, accent }) {
  // Flat list by service, sort by highest cost
  let all = [];
  for (const p of breakdown) {
    for (const s of p.services) {
      all.push({
        provider: p.provider,
        service: s.name,
        cost: s.cost,
      });
    }
  }
  all = all.sort((a, b) => b.cost - a.cost).slice(0, 3);
  return (
    <div className="card highlight-card">
      <div className="highlight-title">Top Contributors</div>
      <ul>
        {all.map((row, idx) => (
          <li key={idx}>
            <span
              className="provider-dot"
              style={{
                background: PROVIDER_COLORS[row.provider] || accent,
              }}
            />
            <span className="highlight-name">
              {row.provider} - {row.service}
            </span>
            <span className="highlight-cost">
              ${row.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ======================== MAIN APP ========================

function App() {
  // Theme: dark as default
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  const toggleTheme = () =>
    setTheme((t) => (t === "light" ? "dark" : "light"));

  // Calculate summary values
  const totalThis = COSTS.weeklyTotal;
  const totalLast = COSTS.lastWeeklyTotal;
  const weekChange = (
    ((totalThis - totalLast) / totalLast) *
    100
  ).toFixed(1);
  const isUp = weekChange >= 0;

  // For demo set infra as sum of non-AI base (mocked as 13%)
  const percentInfra = 13;

  // For bar chart, provider totals
  const providerData = COSTS.breakdown.map((p) => ({
    label: p.provider,
    value: p.services.reduce((t, s) => t + s.cost, 0),
    prevValue: p.services.reduce((t, s, idx) => t + (p.services[idx]?.last || 0), 0),
    color: PROVIDER_COLORS[p.provider] || "#888",
  }));

  // Branding colors
  const accent = "#ff9800";
  const primary = "#012446";
  const secondary = "#1565c0";

  return (
    <div className="dashboard-root">
      <header className="dashboard-header">
        <h1 className="brand-title">
          <span style={{ color: accent }}>LLM</span>{" "}
          <span style={{ color: primary }}>Cost Insight</span>
        </h1>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </header>
      <main className="dashboard-main">
        <SummaryCards
          total={totalThis}
          percentInfra={percentInfra}
          weekChange={Math.abs(weekChange)}
          isUp={isUp}
          accent={accent}
          secondary={secondary}
        />

        <div className="dashboard-visuals">
          <div className="charts-block">
            <BarChart
              data={providerData}
              accent={accent}
              secondary={secondary}
            />
            <DonutChart
              breakdown={COSTS.breakdown}
              accent={accent}
              secondary={secondary}
            />
          </div>
          <div className="side-highlights">
            <ContributorsHighlight breakdown={COSTS.breakdown} accent={accent} />
          </div>
        </div>

        <TableBreakdown breakdown={COSTS.breakdown} />
      </main>
      <footer className="dashboard-footer">
        <span>LLM Cost Dashboard &copy; 2024</span>
        <span className="footer-spacer" />
        <a
          href="https://github.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          View Source
        </a>
      </footer>
    </div>
  );
}

export default App;
