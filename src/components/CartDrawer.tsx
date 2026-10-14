import { useCart } from "../context/CartContext";
import { useStoreContext } from "../context/StoreContext";
import { naira } from "../lib/format";
import { buildCartOrderLink } from "../lib/whatsapp";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: Props) {
  const { items, total, changeQty, remove, clear } = useCart();
  const { store } = useStoreContext();

  const sendOrder = () => {
    if (!store || !items.length) return;
    const url = buildCartOrderLink(store, items);
    window.open(url, "_blank");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[90] bg-charcoal/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-[100] w-full max-w-[440px] bg-cream flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top,0px)" }}
      >
        {/* Head */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-line">
          <h2 className="text-[17px] font-bold tracking-[-0.01em] text-charcoal">
            Bag
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 flex items-center justify-center text-muted hover:text-charcoal transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-4 h-4">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-6 py-24 text-center">
              <p className="text-[14px] text-muted">Your bag is empty.</p>
            </div>
          ) : (
            <div>
              {items.map((it, i) => (
                <div
                  key={it.key}
                  className="grid grid-cols-[64px_1fr_auto] gap-4 px-6 py-5 border-b border-line"
                >
                  <div className="w-16 h-20 bg-mat overflow-hidden rounded-sm">
                    {it.image ? (
                      <img
                        src={it.image}
                        alt={it.name}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-charcoal uppercase tracking-[0.06em] truncate">
                      {it.name}
                    </p>
                    {it.variant && (
                      <p className="mt-1 text-[11.5px] text-faint">
                        {it.variant}
                      </p>
                    )}
                    <p className="mt-2 text-[13px] font-bold text-charcoal">
                      {naira(it.unitPrice)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between gap-3">
                    <div className="inline-flex border border-line rounded-sm">
                      <button
                        onClick={() => changeQty(i, -1)}
                        className="w-7 h-7 flex items-center justify-center text-[15px] text-charcoal hover:bg-cream-dark/40"
                        aria-label="Decrease"
                      >
                        −
                      </button>
                      <span className="w-7 h-7 flex items-center justify-center text-[12px] font-semibold border-l border-r border-line">
                        {it.qty}
                      </span>
                      <button
                        onClick={() => changeQty(i, 1)}
                        className="w-7 h-7 flex items-center justify-center text-[15px] text-charcoal hover:bg-cream-dark/40"
                        aria-label="Increase"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => remove(i)}
                      className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-faint hover:text-terracotta transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {/* Clear all */}
              <div className="px-6 py-4">
                <button
                  onClick={clear}
                  className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-faint hover:text-terracotta transition-colors"
                >
                  Clear bag
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Foot */}
        {items.length > 0 && (
          <div className="border-t border-line px-6 py-5" style={{ paddingBottom: "calc(20px + env(safe-area-inset-bottom,0px))" }}>
            <div className="flex items-baseline justify-between mb-5">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-faint">
                Total
              </span>
              <span className="text-[20px] font-bold tracking-[-0.01em] text-charcoal">
                {naira(total)}
              </span>
            </div>

            <button
              onClick={sendOrder}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-full bg-wa text-[#053b18] text-[12px] font-bold uppercase tracking-[0.14em] hover:opacity-90 transition-opacity"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.48 3.106" />
              </svg>
              Send order on WhatsApp
            </button>
          </div>
        )}
      </aside>
    </>
  );
}