import { useState } from 'react';
import type { Product } from '../types';
import { formatPrice } from '../config';

interface Props {
  product: Product;
  onClick: () => void;
  onChat: () => void;
  onAddToCart: () => void;
  priority?: boolean;
  /** Show the "New" badge. Parent decides (e.g. only first 4). */
  showNew?: boolean;
  /** Show discount badge + slashed price — off on homepage, on in shop */
  showDiscount?: boolean;
}

export function ProductCard({
  product,
  onClick,
  onAddToCart,
  priority,
  showNew = false,
  showDiscount = false,
}: Props) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const hasVariants =
    !!product.variants && product.variants.suggested.length > 0;

  const images = [product.image_url, ...(product.image_urls ?? [])].filter(
    (u): u is string => !!u
  );

  const hasSecondImage = images.length > 1;

  const altText = `${product.name} — biomart`;

  const handleQuickAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasVariants) {
      onClick();
    } else {
      onAddToCart();
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!el.clientWidth) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIdx(idx);
  };

  // Only two badges exist: "New" (from showNew prop) and "Sold out" (from inStock)
  const showNewBadge = showNew;

  // Only treat as sold out when inStock is EXPLICITLY false
  const inStock =
    (product as any).inStock ?? (product as any).in_stock ?? true;

  // Discount only if showDiscount is on
  const hasDiscount =
    showDiscount &&
    product.compare_at_price != null &&
    product.compare_at_price > product.price;

  const discountPercent = hasDiscount
    ? Math.round(
        ((product.compare_at_price! - product.price) / product.compare_at_price!) * 100
      )
    : 0;

  return (
    <article className="group flex flex-col">
      <button
        onClick={onClick}
        className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-cream"
        aria-label={`View ${product.name}`}
      >
        {!imgLoaded && (
          <div className="absolute inset-0 animate-pulse bg-cream" />
        )}

        {/* DESKTOP: hover swap */}
        <div className="absolute inset-0 hidden md:block">
          {images[0] && (
            <img
              src={images[0]}
              alt={altText}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                hasSecondImage ? 'group-hover:opacity-0' : ''
              } ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          )}

          {hasSecondImage && (
            <img
              src={images[1]}
              alt={`${product.name} — alternate view`}
              loading="lazy"
              fetchPriority="low"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
        </div>

        {/* MOBILE: swipe carousel */}
        <div className="absolute inset-0 md:hidden">
          {images.length > 0 ? (
            <div
              onScroll={handleScroll}
              className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto"
            >
              {images.map((url, i) => (
                <div
                  key={i}
                  className="h-full w-full flex-shrink-0 snap-center"
                >
                  <img
                    src={url}
                    alt={i === 0 ? altText : `${product.name} — view ${i + 1}`}
                    loading={i === 0 && priority ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 && priority ? 'high' : 'auto'}
                    decoding="async"
                    onLoad={i === 0 ? () => setImgLoaded(true) : undefined}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-cream text-charcoal/40">
              <span className="text-[11px] uppercase tracking-[0.14em]">
                No image
              </span>
            </div>
          )}

          {hasSecondImage && (
            <div className="pointer-events-none absolute bottom-0 left-1/2 z-10 flex w-10 -translate-x-1/2">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`h-[3px] flex-1 transition-opacity duration-300 ${
                    i === activeIdx ? 'bg-cream' : 'bg-cream/30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Badges — ONLY "New" and discount */}
        <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col items-start gap-1.5 sm:left-3 sm:top-3">
          {showNewBadge && (
            <span className="bg-cream px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-charcoal sm:px-2.5 sm:text-[9.5px]">
              New
            </span>
          )}

          {hasDiscount && (
            <span className="bg-charcoal px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-cream sm:px-2.5 sm:text-[9.5px]">
              −{discountPercent}%
            </span>
          )}
        </div>

        {/* Sold out overlay — only when explicitly false */}
        {!inStock && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-cream/80">
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-charcoal">
              Sold out
            </span>
          </div>
        )}

        {inStock && (
          <div className="pointer-events-none absolute inset-0 z-10 hidden items-end justify-center pb-6 md:flex">
            <button
              onClick={handleQuickAction}
              className="pointer-events-auto translate-y-3 rounded-md bg-black px-6 py-3 text-[10.5px] font-bold uppercase tracking-[0.18em] text-white shadow-md opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-[#C66B4F]"
            >
              {hasVariants ? 'Choose options' : 'Add to bag'}
            </button>
          </div>
        )}
      </button>

      {/* Meta */}
      <button onClick={onClick} className="mt-2 text-left sm:mt-2.5">
        <h3 className="text-[11.5px] font-normal uppercase leading-[1.4] tracking-[0.08em] text-charcoal sm:text-[12px] sm:tracking-[0.09em]">
          {product.name}
        </h3>

        <div className="mt-0.5 flex items-baseline gap-2 sm:mt-1">
          <p className="font-numbers text-[11.5px] font-normal uppercase tracking-[0.06em] text-charcoal/55 sm:text-[12px]">
            {formatPrice(product.price)}
          </p>
          {hasDiscount && (
            <p className="font-numbers text-[10.5px] uppercase tracking-[0.06em] text-charcoal/35 line-through sm:text-[11px]">
              {formatPrice(product.compare_at_price!)}
            </p>
          )}
        </div>
      </button>
    </article>
  );
}
