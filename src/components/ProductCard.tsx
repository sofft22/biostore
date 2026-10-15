import { useState } from "react";
import type { Product } from "../types";
import { naira } from "../lib/format";

interface Props {
  product: Product;
  priority?: boolean;
  showDiscount?: boolean;
  onClick?: () => void;
  onChat?: () => void;
  onAddToCart?: () => void;
}

/** Capitalize first letter of each word */
function titleCase(s: string): string {
  return s.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}

export function ProductCard({
  product,
  priority = false,
  showDiscount = false,
  onClick,
}: Props) {
  const [loaded, setLoaded] = useState(false);

  const img = (product.images && product.images[0]) || product.image_url || "";
  const hasDiscount =
    showDiscount &&
    product.compare_at_price != null &&
    product.compare_at_price > product.price;

  const discountPct = hasDiscount
    ? Math.round(
        ((product.compare_at_price! - product.price) / product.compare_at_price!) * 100
      )
    : 0;

  const badge = product.badge?.trim();

  // FIXED: only show "Sold out" when inStock is EXPLICITLY false.
  // Handles both camelCase (inStock) and snake_case (in_stock) safely.
  const inStock =
    (product as any).inStock ??
    (product as any).in_stock ??
    true;

  return (
    <div className="pc">
      <button
        type="button"
        className="pc-media"
        onClick={onClick}
        aria-label={`View ${product.name}`}
      >
        {!loaded && img && <div className="pc-skeleton" />}
        {img ? (
          <img
            src={img}
            alt={product.name}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={`pc-img ${loaded ? "is-loaded" : ""}`}
          />
        ) : (
          <div className="pc-no-image">No image</div>
        )}

        {(hasDiscount || badge) && (
          <div className="pc-badges">
            {hasDiscount && (
              <span className="pc-badge pc-badge-green">−{discountPct}%</span>
            )}
            {badge && (
              <span className="pc-badge pc-badge-dark">{titleCase(badge)}</span>
            )}
          </div>
        )}

        {!inStock && (
          <div className="pc-sold-out">
            <span>Sold out</span>
          </div>
        )}
      </button>

      <div className="pc-meta">
        <p className="pc-name">{titleCase(product.name)}</p>
        <div className="pc-price-row">
          <span className="pc-price">{naira(product.price)}</span>
          {hasDiscount && (
            <span className="pc-price-old">
              {naira(product.compare_at_price!)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
