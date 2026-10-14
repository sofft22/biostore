import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/DashboardLayout";

const PLANS = [
  { id: "free", name: "Free", price: "₦0", per: "forever", products: 5, photos: 1, sizes: false },
  { id: "starter", name: "Starter", price: "₦2,000", per: "/month", products: 15, photos: 2, sizes: false },
  { id: "pro", name: "Pro", price: "₦4,000", per: "/month", products: 50, photos: 5, sizes: true, badge: "24/7 customer support" },
  { id: "lifetime", name: "Lifetime", price: "₦40,000", per: "once", products: Infinity, photos: 10, sizes: true, badge: "Founding seller" },
];

export default function Plan() {
  const { products, limits, store } = useAuth();
  if (!store) return null;

  const currentPlan = limits?.planName?.toLowerCase() || "free";
  const productLimit = limits?.products ?? 5;
  const usage = productLimit < 100000 ? Math.min(100, (products.length / productLimit) * 100) : 0;

  return (
    <DashboardLayout>
      <section className="dash-head">
        <p className="dash-head-eyebrow">Plan</p>
        <h1 className="dash-title">
          Your <em>plan</em>.
        </h1>
        <p className="dash-head-lead">
          You're on the {limits?.planName || "Free"} plan.
        </p>
      </section>

      {/* Usage card */}
      <section className="dash-usage">
        <div className="dash-usage-head">
          <span>Products used</span>
          <b>
            {products.length}
            {productLimit < 100000 ? ` / ${productLimit}` : " / ∞"}
          </b>
        </div>
        <div className="dash-usage-bar">
          <div className="dash-usage-fill" style={{ width: `${usage}%` }} />
        </div>
        {usage >= 100 && (
          <p className="dash-usage-warn">
            You've hit your product limit. <Link to="/plan">Upgrade below</Link>.
          </p>
        )}
      </section>

      {/* Plans grid */}
      <section className="dash-plans">
        {PLANS.map((p) => {
          const isCurrent = currentPlan === p.id || (p.id === "free" && !limits);
          const isFeatured = p.id === "pro";
          return (
            <div
              key={p.id}
              className={`dash-plan ${isFeatured ? "featured" : ""} ${isCurrent ? "current" : ""}`}
            >
              {p.badge && <span className="dash-plan-badge">{p.badge}</span>}
              {isCurrent && !p.badge && <span className="dash-plan-badge current">Current plan</span>}

              <h3 className="dash-plan-title">{p.name}</h3>
              <div className="dash-plan-price">
                <b>{p.price}</b>
                <span>{p.per}</span>
              </div>
              <ul className="dash-plan-features">
                <li>{p.products === Infinity ? "Unlimited products" : `${p.products} products`}</li>
                <li>{p.photos} photo{p.photos > 1 ? "s" : ""} each</li>
                <li>WhatsApp orders</li>
                <li className={p.sizes ? "" : "no"}>
                  {p.sizes ? "Sizes and options" : "Sizes and options"}
                </li>
              </ul>
              <button
                className={`dash-plan-btn ${isFeatured ? "primary" : isCurrent ? "ghost" : ""}`}
                disabled={isCurrent}
              >
                {isCurrent ? "Current plan" : p.id === "lifetime" ? "Get Lifetime" : `Upgrade to ${p.name}`}
              </button>
            </div>
          );
        })}
      </section>

      <p className="dash-plan-foot">
        Need a custom online store with cart and payments?{" "}
        <a
          href="https://wa.me/2348012345678?text=Hi%20biomart%2C%20I'd%20like%20a%20quote%20for%20a%20custom%20online%20store."
          target="_blank"
          rel="noopener"
        >
          Talk to us on WhatsApp
        </a>.
      </p>
    </DashboardLayout>
  );
}