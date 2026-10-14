import { useState, type FormEvent, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Input from "../components/Input";
import Button from "../components/Button";

export default function Login() {
  const nav = useNavigate();
  const { refresh } = useAuth();
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
      await auth.login(email, password);
      await refresh();
      nav("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-blobs" aria-hidden="true">
        <div className="auth-blob g" />
        <div className="auth-blob w" />
      </div>

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
          <Link to="/signup" className="auth-nav-link">
            Sign up
          </Link>
        </div>
      </nav>

      <main className="auth-main">
        <div className={`auth-card ${mounted ? "in" : ""}`}>
          <span className="auth-eyebrow">Welcome back</span>

          <h1 className="auth-title">
            Log in to your store.
          </h1>
          <p className="auth-lead">
            Pick up right where you left off.
          </p>

          <form onSubmit={onSubmit} className="auth-form">
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
              autoComplete="current-password"
              placeholder="Your password"
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
                {busy ? "Logging in…" : "Log in"}
              </Button>
            </div>
          </form>

          <p className="auth-foot">
            New to biomart?{" "}
            <Link to="/signup" className="auth-foot-link">
              Create a store
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}