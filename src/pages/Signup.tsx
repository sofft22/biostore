import { useState, type FormEvent, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Input from "../components/Input";
import Button from "../components/Button";

export default function Signup() {
  const nav = useNavigate();
  const { refresh } = useAuth();
  const [storeName, setStoreName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await auth.signup({ storeName, whatsapp, email, password });
      await refresh();
      nav("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      {/* Ambient blobs */}
      <div className="auth-blobs" aria-hidden="true">
        <div className="auth-blob g" />
        <div className="auth-blob w" />
      </div>

      {/* Nav */}
      <nav className="auth-nav">
        <div className="auth-wrap auth-nav-inner">
          <Link to="/" className="auth-brand">
            <span className="auth-brand-mark">
              <svg viewBox="0 0 60 64" width="20" height="22" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round">
                <path d="M10 20H50L55 54Q55.4 58 51.5 58H8.5Q4.6 58 5 54Z" />
                <path d="M20 26V14A10 10 0 0 1 40 14V26" />
              </svg>
            </span>
            biomart
          </Link>
          <Link to="/login" className="auth-nav-link">
            Log in
          </Link>
        </div>
      </nav>

      <main className="auth-main">
        <div className={`auth-card ${mounted ? "in" : ""}`}>
          <span className="auth-eyebrow">For WhatsApp sellers</span>

          <h1 className="auth-title">
            Open your store.
          </h1>
          <p className="auth-lead">
            Free to start. Live in two minutes.
          </p>

          <form onSubmit={onSubmit} className="auth-form">
            <Input
              label="Store name"
              type="text"
              maxLength={60}
              placeholder="Adaeze's Closet"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
            />

            <Input
              label="WhatsApp number"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="08012345678"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              required
            />

            <Input
              label="Email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            <div className="auth-submit">
              <Button type="submit" full disabled={busy}>
                {busy ? "Creating store…" : "Create store"}
              </Button>
            </div>
          </form>

          <p className="auth-foot">
            Already have an account?{" "}
            <Link to="/login" className="auth-foot-link">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}