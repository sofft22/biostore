import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import DashboardLayout from "../components/DashboardLayout";
import { naira } from "../lib/format";
import type { Product } from "../types";

/* ─────────────────────────────────────────────
   Mock stats — swap for real API when ready.
   Shape stays the same, only the source changes.
   ───────────────────────────────────────────── */
type Daily = { date: string; count: number };
type Stat = {
  todayViews: number;
  yesterdayViews: number;
  totalViews: number;
  daily: Daily[];
  topProducts: { id: string; name: string; image_url?: string; views: number }[];
};

function useStoreStats(products: Product[]): Stat {
  // Real: fetch('/api/stats').then(r => r.json())
  // Mock: derives believable numbers from what we already have
  const baseViews = 1240 + products.length * 24;

  const daily: Daily[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
    (d, i) => ({
      date: d,
      count: [32, 41, 38, 52, 61, 78, 47][i] + products.length * 3,
    })
  );

  const top = products.slice(0, 5).map((p, i) => ({
    id: p.id,
    name: p.name,
    image_url: p.image_url,
    views: 340 - i * 55 + Math.round(p.price % 40),
  }));

  return {
    todayViews: daily[daily.length - 1].count,
    yesterdayViews: daily[daily.length - 2].count,
    totalViews: baseViews,
    daily,
    topProducts: top,
  };
}

/* ─────────────────────────────────────────────
   Tiny SVG line chart — no deps
   ───────────────────────────────────────────── */
function ViewsChart({ data }: { data: Daily[] }) {
  const W = 640;
  const H = 180;
  const PAD = 20;
  const max = Math.max(...data.map((d) => d.count), 1);

  const points = data.map((d, i) => {
    const x = PAD + (i * (W - PAD * 2)) / (data.length - 1);
    const y = H - PAD - (d.count / max) * (H - PAD * 2);
    return { x, y, d };
  });

  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area =
    `${PAD},${H - PAD} ` +
    line +
    ` ${W - PAD},${H - PAD}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="views-chart"
      preserveAspectRatio="none"
      aria-label="Views over the last 7 days"
    >
      <defs>
        <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--green)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--green)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* baseline */}
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--line)" strokeWidth="1" />

      {/* area */}
      <polygon points={area} fill="url(#area)" />

      {/* line */}
      <polyline
        points={line}
        fill="none"
        stroke="var(--green)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="var(--green)" />
      ))}

      {/* labels */}
      {points.map((p, i) => (
        <text
          key={i}
          x={p.x}
          y={H - 4}
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill="var(--faint)"
          fontFamily="var(--font)"
        >
          {p.d.date}
        </text>
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Page
   ───────────────────────────────────────────── */
export default function Overview() {
  const { user, store, products, limits, loading } = useAuth();
  const toast = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const stats = useStoreStats(products);

  if (loading) {
    return (
      <div className="dash-shell dash-loading">
        <div className="dash-spinner" />
      </div>
    );
  }
  if (!user || !store) return null;

  const planName = limits?.planName || "Free";
  const productCap = limits?.products ?? 5;
  const usage = productCap < 100000 ? Math.min(100, (products.length / productCap) * 100) : 0;

  const delta = stats.yesterdayViews > 0
    ? Math.round(((stats.todayViews - stats.yesterdayViews) / stats.yesterdayViews) * 100)
    : 0;

  const copyLink = () => {
    navigator.clipboard.writeText(location.origin + "/store/" + store.slug);
    toast.show("Link copied");
  };

  return (
    <DashboardLayout>
      <section className="dash-head">
        <p className="dash-head-eyebrow">Overview</p>
        <h1 className="dash-title">
          Hey, <em>{store.name || "there"}</em>.
        </h1>
      </section>

      {/* ── Stat cards ── */}
      <section className="ov-stats">
        <div className="ov-stat">
          <p className="ov-stat-label">Views today</p>
          <p className="ov-stat-value">{stats.todayViews.toLocaleString()}</p>
          <p className={`ov-stat-delta ${delta >= 0 ? "up" : "down"}`}>
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}% vs yesterday
          </p>
        </div>

        <div className="ov-stat">
          <p className="ov-stat-label">Views all-time</p>
          <p className="ov-stat-value">{stats.totalViews.toLocaleString()}</p>
          <p className="ov-stat-hint">Since you opened your store</p>
        </div>

        <div className="ov-stat">
          <p className="ov-stat-label">Products live</p>
          <p className="ov-stat-value">
            {products.length}
            <span className="ov-stat-cap">
              {productCap < 100000 ? ` / ${productCap}` : " / ∞"}
            </span>
          </p>
          <div className="ov-usage">
            <div className="ov-usage-fill" style={{ width: `${usage}%` }} />
          </div>
        </div>

        <div className="ov-stat">
          <p className="ov-stat-label">Plan</p>
          <p className="ov-stat-value">{planName}</p>
          <Link to="/plan" className="ov-stat-link">
            Manage plan
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </Link>
        </div>
      </section>

      {/* ── Views chart ── */}
      <section className={`ov-panel ${mounted ? "in" : ""}`}>
        <div className="ov-panel-head">
          <div>
            <h2 className="dash-section-title">Store views</h2>
            <p className="ov-panel-sub">Last 7 days</p>
          </div>
          <p className="ov-panel-total">
            <b>{stats.daily.reduce((a, d) => a + d.count, 0).toLocaleString()}</b>
            <span>this week</span>
          </p>
        </div>
        <div className="ov-chart-wrap">
          <ViewsChart data={stats.daily} />
        </div>
      </section>

      {/* ── Store link ── */}
      <section className="dash-link-card">
        <div className="dash-link-info">
          <p className="dash-link-label">Your store link</p>
          <p className="dash-link-url">
            {location.host}/store/<b>{store.slug}</b>
          </p>
        </div>
        <div className="dash-link-actions">
          <button onClick={copyLink} className="dash-btn dash-btn-line">
            Copy
          </button>
          <a
            href={`/store/${store.slug}`}
            target="_blank"
            rel="noopener"
            className="dash-btn dash-btn-dark"
          >
            View store
          </a>
        </div>
      </section>

      {/* ── Top products ── */}
      <section className="ov-panel">
        <div className="ov-panel-head">
          <div>
            <h2 className="dash-section-title">Top products</h2>
            <p className="ov-panel-sub">Most viewed this week</p>
          </div>
          <Link to="/dashboard/products" className="ov-panel-link">
            All products
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </Link>
        </div>

        {stats.topProducts.length === 0 ? (
          <div className="ov-empty">
            <p>No products yet.</p>
            <Link to="/dashboard/product" className="dash-btn dash-btn-dark">
              + Add your first product
            </Link>
          </div>
        ) : (
          <ul className="ov-top">
            {stats.topProducts.map((p, i) => (
              <li key={p.id}>
                <Link to={`/dashboard/product/${p.id}`} className="ov-top-row">
                  <span className="ov-top-rank">{i + 1}</span>
                  <div className="ov-top-thumb">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} loading="lazy" decoding="async" />
                    ) : (
                      <span className="ov-top-initial">{p.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="ov-top-info">
                    <p className="ov-top-name">{p.name}</p>
                    <p className="ov-top-meta">{naira(p.views)} views</p>
                  </div>
                  <svg className="ov-top-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Quick actions ── */}
      <section className="ov-quick">
        <Link to="/dashboard/product" className="ov-quick-btn">
          <span className="ov-quick-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          </span>
          <span>
            <b>Add product</b>
            <small>New item to your catalogue</small>
          </span>
        </Link>

        <a
          href={`https://wa.me/?text=${encodeURIComponent("Check out my store: " + location.origin + "/store/" + store.slug)}`}
          target="_blank"
          rel="noopener"
          className="ov-quick-btn"
        >
          <span className="ov-quick-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16v11H9l-5 4V5z"/></svg>
          </span>
          <span>
            <b>Share on WhatsApp</b>
            <small>Send your store link</small>
          </span>
        </a>

        <Link to="/settings" className="ov-quick-btn">
          <span className="ov-quick-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M5 5l1.5 1.5M17.5 17.5L19 19M3 12h2M19 12h2M5 19l1.5-1.5M17.5 6.5L19 5"/></svg>
          </span>
          <span>
            <b>Store settings</b>
            <small>Name, WhatsApp, link</small>
          </span>
        </Link>
      </section>
    </DashboardLayout>
  );
}