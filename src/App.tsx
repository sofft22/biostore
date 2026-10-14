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
      <div className="nf-inner">
        <span className="nf-eyebrow">404</span>
        <h1 className="nf-title">
          Page not <em>found</em>.
        </h1>
        <p className="nf-lead">That link doesn't exist anymore. Try heading back to the homepage.</p>
        <a href="/" className="btn" style={{ marginTop: 32 }}>Back to home</a>
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
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />

            <Route path="/dashboard" element={<Overview />} />
            <Route path="/dashboard/products" element={<Dashboard />} />
            <Route path="/dashboard/product" element={<ProductEdit />} />
            <Route path="/dashboard/product/:id" element={<ProductEdit />} />

           
            <Route path="/settings" element={<Settings />} />
            <Route path="/plan" element={<Plan />} />

            <Route path="/store/:slug" element={<StorefrontRoute />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
