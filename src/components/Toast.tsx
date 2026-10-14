import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

interface ToastState {
  show: (msg: string) => void;
}

const Ctx = createContext<ToastState | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState("");
  const [visible, setVisible] = useState(false);

  const show = useCallback((m: string) => {
    setMsg(m);
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(t);
  }, [visible, msg]);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div
        className={`fixed left-1/2 bottom-8 -translate-x-1/2 z-[200] px-6 py-3.5 rounded-full bg-charcoal text-cream font-bold text-[13px] shadow-2xl transition-all duration-300 ${
          visible
            ? "translate-y-0 opacity-100"
            : "translate-y-[140%] opacity-0 pointer-events-none"
        }`}
        role="status"
        aria-live="polite"
      >
        {msg}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}