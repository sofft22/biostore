import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth } from "../lib/api";

const I = {
  logoBag: (
    <svg viewBox="0 0 60 64" width="20" height="22" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M10 20H50L55 54Q55.4 58 51.5 58H8.5Q4.6 58 5 54Z" />
      <path d="M20 26V14A10 10 0 0 1 40 14V26" />
    </svg>
  ),
  grid: (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  ),
  box: (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
      <path d="M3 7l9 4 9-4M12 11v10" />
    </svg>
  ),
  tag: (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12V4h8l9 9-8 8-9-9z" />
      <path d="M7.5 8.5h.01" />
    </svg>
  ),
  gear: (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  ),
  bolt: (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  logout: (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
  external: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4h6v6" />
      <path d="M20 4l-9 9" />
      <path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" />
    </svg>
  ),
};

const NAV = [
  { to: "/dashboard", label: "Overview", icon: I.grid, end: true },
  { to: "/dashboard/products", label: "Products", icon: I.box, end: true },
  { to: "/categories", label: "Categories", icon: I.tag, end: true },
  { to: "/settings", label: "Settings", icon: I.gear, end: false },
  { to: "/plan", label: "Plan", icon: I.bolt, end: true },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { store, refresh } = useAuth();
  const nav = useNavigate();

  async function onLogout() {
    try {
      await auth.logout();
    } catch {
      /* ignore */
    }
    await refresh();
    nav("/login");
  }

  return (
    <div className="dash-shell">
      <div className="dash-blobs" aria-hidden="true">
        <div className="dash-blob g" />
      </div>

      <header className="dash-topbar">
        <div className="dash-wrap dash-topbar-inner">
          <Link to="/dashboard" className="dash-brand">
            <span className="dash-brand-mark">{I.logoBag}</span>
            biomart
          </Link>

          <div className="dash-topbar-right">
            {store && (
              <a href={`/store/${store.slug}`} target="_blank" rel="noopener" className="dash-store-link">
                <span className="dash-store-dot" />
                <span className="dash-store-slug">/store/{store.slug}</span>
                {I.external}
              </a>
            )}
            <button onClick={onLogout} className="dash-logout" aria-label="Log out">
              {I.logout}
              <span className="dash-logout-label">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="dash-body">
        <div className="dash-wrap">
          <div className="dash-grid">
            <aside className="dash-aside">
              <nav className="dash-nav" aria-label="Dashboard">
                {NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `dash-nav-item ${isActive ? "active" : ""}`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </aside>

            <main className="dash-main">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
