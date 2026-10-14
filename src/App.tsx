import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { StoreProvider } from "./context/StoreContext";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./components/Toast";

import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Plan from "./pages/Plan";
import ProductEdit from "./pages/ProductEdit";
import Storefront from "./pages/Storefront";
import Admin from "./pages/Admin";

function StorefrontRoute() {
  const { slug } = useParams<{ slug: string }>();
  const safeSlug = slug || "";
  return (
    <StoreProvider slug={safeSlug}>
      <CartProvider slug={safeSlug}>
        <Storefront />
      </CartProvider>
    </StoreProvider>
  );
}

function NotFound() {
  return (
    <div className="nf-shell">
      <div className="nf-blob" aria-hidden="true" />

      <div className="nf-inner">
        <span className="nf-eyebrow">404</span>

        <h1 className="nf-title">
          Page not <em>found</em>.
        </h1>

        <p className="nf-lead">
          That link doesn't exist anymore. Try heading back to the homepage.
        </p>

        <div className="nf-actions">
          <a href="/" className="nf-btn nf-btn-dark">
            Back to home
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="15"
              height="15"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
          <a href="/login" className="nf-btn nf-btn-line">
            Log in
          </a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />

            {/* Dashboard */}
            <Route path="/dashboard" element={<Overview />} />
            <Route path="/dashboard/products" element={<Dashboard />} />
            <Route path="/dashboard/product" element={<ProductEdit />} />
            <Route path="/dashboard/product/:id" element={<ProductEdit />} />

            <Route path="/settings" element={<Settings />} />
            <Route path="/plan" element={<Plan />} />

            {/* Storefront (public per-seller) */}
            <Route path="/store/:slug" element={<StorefrontRoute />} />

            {/* Admin */}
            <Route path="/admin" element={<Admin />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}