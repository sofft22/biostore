import { useState, useRef, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { formatPrice } from '../config';
import type { Product } from '../types';

interface Props {
  product: Product;
  products: Product[];
  onClose: () => void;
  onAddToCart: (
    qty: number,
    variant?: string,
    variantPriceDelta?: number,
    opts?: { silent?: boolean }
  ) => void;
  onOpenProduct: (p: Product) => void;
}

const CREAM = '#FBF9F5';
const CREAM_DARK = '#EDE8E0';
const CHARCOAL = '#1A1A1A';
const BRAND_GREEN = '#0F7A4A';
const MUTED = 'rgba(26,26,26,0.5)';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ProductModal({
  product,
  products,
  onClose,
  onAddToCart,
  onOpenProduct,
}: Props) {
  const { settings } = useSettings();
  const [qty, setQty] = useState(1);
  const [selectedVariantLabel, setSelectedVariantLabel] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [mainImgLoaded, setMainImgLoaded] = useState(false);
  const [addedFlash, setAddedFlash] = useState(false);
  const [copied, setCopied] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const modalScrollRef = useRef<HTMLDivElement | null>(null);

  const images = [product.image_url, ...(product.image_urls ?? [])].slice(0, 3);
  const currentImage = images[activeImage] ?? product.image_url;

  const mainAlt = `${product.name} — biomart`;

  const variants = product.variants?.suggested ?? [];
  const hasVariants = variants.length > 0;

  const selectedVariant = variants.find((v) => v.label === selectedVariantLabel);
  const priceDelta = selectedVariant?.priceDelta ?? 0;
  const displayPrice = product.price + priceDelta;
  const displayCompare =
    product.compare_at_price != null ? product.compare_at_price + priceDelta : null;

  const canAdd = !hasVariants || selectedVariantLabel !== null;

  const pairs = useMemo(() => {
    if (!products || products.length === 0) return [];
    const others = products.filter((p) => p.id !== product.id);
    const same = shuffle(
      others.filter((p) => p.category_id === product.category_id)
    );
    const rest = shuffle(
      others.filter((p) => p.category_id !== product.category_id)
    );
    const pick: Product[] = [];
    for (const p of same.slice(0, 2)) pick.push(p);
    for (const p of rest) {
      if (pick.length >= 4) break;
      pick.push(p);
    }
    if (pick.length < 4) {
      for (const p of same.slice(2)) {
        if (pick.length >= 4) break;
        pick.push(p);
      }
    }
    return shuffle(pick);
  }, [products, product.id, product.category_id]);

  const goToImage = (i: number) => {
    if (i === activeImage) return;
    setMainImgLoaded(false);
    setActiveImage(i);
  };

  const handleImageTap = () => {
    if (images.length <= 1) return;
    const next = (activeImage + 1) % images.length;
    goToImage(next);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX < 0 && activeImage < images.length - 1) goToImage(activeImage + 1);
      else if (deltaX > 0 && activeImage > 0) goToImage(activeImage - 1);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const openWa = (message: string) => {
    window.open(
      `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  };

  const handleAdd = () => {
    if (!canAdd) return;
    onAddToCart(qty, selectedVariantLabel ?? undefined, priceDelta, { silent: true });
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 1400);
  };

  const handleQuickBuy = () => {
    if (!canAdd) return;
    onAddToCart(qty, selectedVariantLabel ?? undefined, priceDelta, { silent: false });
    onClose();
  };

  const handleAskUs = () => {
    const variant = selectedVariantLabel ? ` (${selectedVariantLabel})` : '';
    openWa(
      `Hi, I have a question about:\n\n• ${product.name}${variant}\n\nMy question is: ____`
    );
  };

  const handleShareWhatsApp = () => {
    const url = window.location.href;
    const text = `Check out ${product.name}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${text} — ${url}`)}`,
      '_blank'
    );
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt('Copy this link:', window.location.href);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        ref={modalScrollRef}
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-full flex-col overflow-y-auto sm:h-auto sm:max-h-[92vh] sm:max-w-5xl"
        style={{ backgroundColor: CREAM, color: CHARCOAL }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-[10px] transition-colors duration-300"
          style={{ backgroundColor: CREAM, color: CHARCOAL }}
          onMouseEnter={(e) => (e.currentTarget.style.color = BRAND_GREEN)}
          onMouseLeave={(e) => (e.currentTarget.style.color = CHARCOAL)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="h-[16px] w-[16px]"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* ── TOP ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div style={{ backgroundColor: CREAM }}>
            <button
              onClick={handleImageTap}
              className="relative block aspect-[4/5] w-full overflow-hidden"
              style={{ touchAction: 'pan-y', backgroundColor: CREAM }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              aria-label="Next image"
            >
              {!mainImgLoaded && (
                <div
                  className="absolute inset-0 animate-pulse"
                  style={{ backgroundColor: CREAM_DARK }}
                />
              )}
              {currentImage && (
                <img
                  key={currentImage}
                  src={currentImage}
                  alt={mainAlt}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  onLoad={() => setMainImgLoaded(true)}
                  draggable={false}
                  className={`h-full w-full object-contain transition-opacity duration-500 ${
                    mainImgLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              )}

              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 sm:hidden">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === activeImage
                          ? 'w-5 bg-charcoal'
                          : 'w-1.5 bg-charcoal/30'
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>

            {images.length > 1 && (
              <div className="hidden gap-2 p-3 sm:flex">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => goToImage(i)}
                    className="aspect-square w-16 overflow-hidden rounded-[8px] transition-colors"
                    style={{
                      border:
                        i === activeImage
                          ? `1px solid ${CHARCOAL}`
                          : `1px solid ${CREAM_DARK}`,
                    }}
                    aria-label={`View image ${i + 1} of ${images.length}`}
                  >
                    <img
                      src={src}
                      alt={`${product.name} — thumbnail ${i + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info column */}
          <div className="p-6 sm:p-12" style={{ backgroundColor: CREAM }}>
            <h2
              className="text-[15px] font-normal uppercase leading-[1.4] tracking-[0.12em] sm:text-[16px] sm:tracking-[0.14em]"
              style={{ color: CHARCOAL }}
            >
              {product.name}
            </h2>

            <div className="mt-4 flex items-baseline gap-3 sm:mt-5 sm:gap-4">
              <p
                className="font-numbers text-[22px] sm:text-[26px]"
                style={{ color: CHARCOAL }}
              >
                {formatPrice(displayPrice)}
              </p>
              {displayCompare && (
                <p
                  className="text-[13.5px] line-through sm:text-[14.5px]"
                  style={{ color: MUTED }}
                >
                  {formatPrice(displayCompare)}
                </p>
              )}
            </div>

            {product.description && (
              <p
                className="mt-6 text-[14px] leading-[1.75] sm:mt-7 sm:text-[14.5px]"
                style={{ color: 'rgba(26,26,26,0.7)' }}
              >
                {product.description}
              </p>
            )}

            {hasVariants && product.in_stock && (
              <div className="mt-8">
                <p
                  className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: MUTED }}
                >
                  Choose {selectedVariantLabel ? '' : '· required'}
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {variants.map((v) => {
                    const active = selectedVariantLabel === v.label;
                    return (
                      <button
                        key={v.label}
                        onClick={() => setSelectedVariantLabel(v.label)}
                        className="rounded-[8px] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors duration-300"
                        style={{
                          border: `1px solid ${active ? CHARCOAL : CREAM_DARK}`,
                          backgroundColor: active ? CHARCOAL : 'transparent',
                          color: active ? CREAM : CHARCOAL,
                        }}
                      >
                        {v.label}
                        {v.priceDelta > 0 && (
                          <span
                            className="ml-2 font-numbers"
                            style={{
                              color: active ? CREAM : BRAND_GREEN,
                            }}
                          >
                            +{formatPrice(v.priceDelta)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {product.in_stock && (
              <>
                {/* Qty */}
                <div className="mt-8 flex items-center gap-4">
                  <span
                    className="text-[10.5px] font-bold uppercase tracking-[0.2em]"
                    style={{ color: MUTED }}
                  >
                    Qty
                  </span>
                  <div
                    className="inline-flex items-stretch overflow-hidden rounded-[8px]"
                    style={{ border: `1px solid ${CREAM_DARK}` }}
                  >
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="flex h-10 w-10 items-center justify-center transition-colors duration-200"
                      style={{ color: CHARCOAL }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = CREAM_DARK)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = 'transparent')
                      }
                    >
                      −
                    </button>
                    <span
                      className="flex h-10 w-10 items-center justify-center font-numbers text-[14px]"
                      style={{
                        color: CHARCOAL,
                        borderLeft: `1px solid ${CREAM_DARK}`,
                        borderRight: `1px solid ${CREAM_DARK}`,
                      }}
                    >
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty(qty + 1)}
                      className="flex h-10 w-10 items-center justify-center transition-colors duration-200"
                      style={{ color: CHARCOAL }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = CREAM_DARK)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = 'transparent')
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Buttons — Add to bag (dark) + Order (brand green) */}
                <div className="mt-8 grid grid-cols-2 gap-3">
                  <button
                    onClick={handleAdd}
                    disabled={!canAdd}
                    className="w-full rounded-[10px] py-4 text-[10.5px] font-bold uppercase tracking-[0.2em] transition-colors duration-300"
                    style={{
                      backgroundColor: canAdd
                        ? addedFlash
                          ? BRAND_GREEN
                          : CHARCOAL
                        : 'rgba(26,26,26,0.3)',
                      color: CREAM,
                      cursor: canAdd ? 'pointer' : 'not-allowed',
                    }}
                    onMouseEnter={(e) => {
                      if (canAdd && !addedFlash)
                        e.currentTarget.style.backgroundColor = BRAND_GREEN;
                    }}
                    onMouseLeave={(e) => {
                      if (canAdd && !addedFlash)
                        e.currentTarget.style.backgroundColor = CHARCOAL;
                    }}
                  >
                    {addedFlash ? 'Added ✓' : 'Add to bag'}
                  </button>

                  <button
                    onClick={handleQuickBuy}
                    disabled={!canAdd}
                    className="flex w-full items-center justify-center gap-2 rounded-[10px] py-4 text-[10.5px] font-bold uppercase tracking-[0.2em] transition-all duration-300"
                    style={{
                      backgroundColor: canAdd ? BRAND_GREEN : 'rgba(15,122,74,0.3)',
                      color: '#fff',
                      cursor: canAdd ? 'pointer' : 'not-allowed',
                    }}
                    onMouseEnter={(e) => {
                      if (canAdd)
                        e.currentTarget.style.backgroundColor = '#0A5D38';
                    }}
                    onMouseLeave={(e) => {
                      if (canAdd)
                        e.currentTarget.style.backgroundColor = BRAND_GREEN;
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.48 3.106" />
                    </svg>
                    Order
                  </button>
                </div>

                {!canAdd && (
                  <p
                    className="mt-3 text-center text-[10.5px] font-bold uppercase tracking-[0.16em]"
                    style={{ color: MUTED }}
                  >
                    Choose an option first
                  </p>
                )}

                {/* Ask us */}
                <div className="mt-5 flex items-center justify-center">
                  <button
                    onClick={handleAskUs}
                    className="text-[10.5px] font-bold uppercase tracking-[0.18em] underline-offset-4 transition-colors duration-300"
                    style={{ color: MUTED }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = BRAND_GREEN;
                      e.currentTarget.style.textDecoration = 'underline';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = MUTED;
                      e.currentTarget.style.textDecoration = 'none';
                    }}
                  >
                    Ask us a question
                  </button>
                </div>

                {/* Share */}
                <div
                  className="mt-9 flex items-center gap-4 pt-7"
                  style={{ borderTop: `1px solid ${CREAM_DARK}` }}
                >
                  <span
                    className="text-[10.5px] font-bold uppercase tracking-[0.2em]"
                    style={{ color: MUTED }}
                  >
                    Share
                  </span>

                  <button
                    onClick={handleShareWhatsApp}
                    aria-label="Share on WhatsApp"
                    className="flex h-9 w-9 items-center justify-center rounded-[8px] transition-colors duration-300"
                    style={{ border: `1px solid ${CREAM_DARK}`, color: CHARCOAL }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = BRAND_GREEN;
                      e.currentTarget.style.color = BRAND_GREEN;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = CREAM_DARK;
                      e.currentTarget.style.color = CHARCOAL;
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.48 3.106" />
                    </svg>
                  </button>

                  <button
                    onClick={handleCopyLink}
                    aria-label="Copy link"
                    className="flex h-9 w-9 items-center justify-center rounded-[8px] transition-colors duration-300"
                    style={{ border: `1px solid ${CREAM_DARK}`, color: CHARCOAL }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = BRAND_GREEN;
                      e.currentTarget.style.color = BRAND_GREEN;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = CREAM_DARK;
                      e.currentTarget.style.color = CHARCOAL;
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                      <rect x="9" y="9" width="11" height="11" rx="2" />
                      <path d="M5 15V5a2 2 0 0 1 2-2h10" strokeLinecap="round" />
                    </svg>
                  </button>

                  <span
                    className="text-[10.5px] font-bold uppercase tracking-[0.2em] transition-opacity duration-300"
                    style={{
                      color: BRAND_GREEN,
                      opacity: copied ? 1 : 0,
                    }}
                  >
                    Copied
                  </span>
                </div>
              </>
            )}

            {!product.in_stock && (
              <p
                className="mt-6 rounded-[10px] py-4 text-center text-[10.5px] font-bold uppercase tracking-[0.2em]"
                style={{
                  border: `1px solid ${CREAM_DARK}`,
                  backgroundColor: CREAM,
                  color: MUTED,
                }}
              >
                Sold out
              </p>
            )}
          </div>
        </div>

        {/* ── COMPLETE THE LOOK ── */}
        {pairs.length > 0 && (
          <div
            className="px-6 py-14 sm:px-12 sm:py-20"
            style={{
              borderTop: `1px solid ${CREAM_DARK}`,
              backgroundColor: CREAM,
            }}
          >
            <h3
              className="font-serif text-[22px] leading-tight tracking-[-0.01em] sm:text-[28px]"
              style={{ color: CHARCOAL }}
            >
              Complete the look
            </h3>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
              {pairs.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActiveImage(0);
                    setSelectedVariantLabel(null);
                    setMainImgLoaded(false);
                    onOpenProduct(p);
                    modalScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group text-left"
                >
                  <div
                    className="aspect-[4/5] overflow-hidden"
                    style={{ backgroundColor: CREAM }}
                  >
                    {p.image_url && (
                      <img
                        src={p.image_url}
                        alt={`${p.name} — biomart`}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    )}
                  </div>
                  <p
                    className="mt-3 line-clamp-1 text-[11px] font-normal uppercase tracking-[0.1em] sm:text-[12px]"
                    style={{ color: CHARCOAL }}
                  >
                    {p.name}
                  </p>
                  <p
                    className="mt-1 font-numbers text-[12px] sm:text-[13px]"
                    style={{ color: MUTED }}
                  >
                    {formatPrice(p.price)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductModal;
