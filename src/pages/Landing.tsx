import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

/* ─── Icons ─── */
const I = {
  logoBag: (
    <svg viewBox="0 0 60 64" width="22" height="24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M10 20H50L55 54Q55.4 58 51.5 58H8.5Q4.6 58 5 54Z" />
      <path d="M20 26V14A10 10 0 0 1 40 14V26" />
    </svg>
  ),
  bag: <svg className="ic" viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>,
  jar: <svg className="ic" viewBox="0 0 24 24"><path d="M7 9h10v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9z"/><path d="M6 5.5h12V9H6z"/></svg>,
  hat: <svg className="ic" viewBox="0 0 24 24"><path d="M3 15h18"/><path d="M6 15c0-5 2-8 6-8s6 3 6 8"/></svg>,
  shoe: <svg className="ic" viewBox="0 0 24 24"><path d="M3 16c0-3 2-4 4-4l3 2 4-4 3 5c2 0 4 1 4 3v1H3v-3z"/></svg>,
  wave: <svg className="ic" viewBox="0 0 24 24"><path d="M3 9c3-5 6 5 9 0s6 5 9 0"/><path d="M3 15c3-5 6 5 9 0s6 5 9 0"/></svg>,
  bowl: <svg className="ic" viewBox="0 0 24 24"><path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M9 7c0-1.5 1-1.5 1-3"/><path d="M14 7c0-1.5 1-1.5 1-3"/></svg>,
  sliders: <svg className="ic" viewBox="0 0 24 24"><path d="M4 7h9M17 7h3M13 5v4M4 17h3M11 17h9M7 15v4"/></svg>,
  tag: <svg className="ic" viewBox="0 0 24 24"><path d="M3 12V4h8l9 9-8 8-9-9z"/><path d="M7.5 8.5h.01"/></svg>,
  grid: <svg className="ic" viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>,
  chat: <svg className="ic" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4V5z"/></svg>,
  bolt: <svg className="ic" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  x: <svg className="ic" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  tick: <svg className="ic" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>,
  arrow: <svg className="ic arw" viewBox="0 0 24 24" style={{ width: 16, height: 16 }}><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  arrowSm: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  dress: <svg className="ic" viewBox="0 0 24 24"><path d="M9 3h6l-1 4 3 14H7L10 7 9 3z"/></svg>,
  headset: <svg className="ic" viewBox="0 0 24 24"><path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="3" y="13" width="4" height="7" rx="1.5"/><rect x="17" y="13" width="4" height="7" rx="1.5"/></svg>,
};

const SIGNUP_URL = "/signup";
const WHATSAPP = "2348012345678";

/* ─── Images — bold, eye-catching, fast CDN ───
   Served via Unsplash CDN with explicit width + quality
   so payload stays small (~30-60kb each).
   Swap for your own /products/*.jpg anytime. */
const IMG = {
  // Phone grid
  tote:     "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=280&q=75&auto=format&fit=crop",
  sneakers: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=280&q=75&auto=format&fit=crop",
  shea:     "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=280&q=75&auto=format&fit=crop",
  hat:      "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=280&q=75&auto=format&fit=crop",
  // 3D product (bigger, hero quality)
  toteBig:  "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&q=80&auto=format&fit=crop",
};

/* ─── Hooks ─── */
function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let lenis: any;
    (async () => {
      try {
        const Lenis = (await import("lenis")).default;
        lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
        const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
        raf = requestAnimationFrame(loop);
      } catch {}
    })();
    return () => { cancelAnimationFrame(raf); lenis?.destroy?.(); };
  }, []);
}

function useReveal() {
  useEffect(() => {
    document.documentElement.classList.add("js");
    const items = document.querySelectorAll(".reveal");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!("IntersectionObserver" in window) || reduce) {
      items.forEach((e) => e.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    items.forEach((e, i) => {
      (e as HTMLElement).style.transitionDelay = `${(i % 4) * 70}ms`;
      io.observe(e);
    });
    return () => io.disconnect();
  }, []);
}

function useHideOnScroll() {
  const [state, setState] = useState<{ hidden: boolean; scrolled: boolean }>({
    hidden: false,
    scrolled: false,
  });
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      const diff = y - lastY;
      const atTop = y < 20;
      const shouldHide = !atTop && diff > 4 && y > 120;
      const shouldShow = diff < -4 || atTop;
      setState((prev) => {
        let hidden = prev.hidden;
        if (shouldHide) hidden = true;
        else if (shouldShow) hidden = false;
        return { hidden, scrolled: y > 8 };
      });
      lastY = y;
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return state;
}

function useProgress() {
  useEffect(() => {
    const el = document.createElement("div");
    el.className = "progress";
    document.body.appendChild(el);
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      el.style.setProperty("--p", String(max > 0 ? window.scrollY / max : 0));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); el.remove(); };
  }, []);
}

function useCursorGlow() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest(".btn") as HTMLElement | null;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      btn.style.setProperty("--mx", `${e.clientX - r.left}px`);
      btn.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
}

function useScrollRotate(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onScroll = () => {
      const stage = el.querySelector("[data-stage]") as HTMLElement | null;
      if (!stage || !stage.classList.contains("enter")) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, 1 - (r.top + r.height / 2) / (vh + r.height / 2)));
      const rotY = -14 - p * 12;
      const rotX = 5 + p * 7;
      stage.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${1 - p * 0.05})`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ref]);
}

function CountUp({ to, suffix = "", prefix = "", decimals = 0, duration = 1400 }: { to: number; suffix?: string; prefix?: string; decimals?: number; duration?: number }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setN(to); return; }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setN(to * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);
  const value = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toLocaleString();
  return <span ref={ref}>{prefix}{value}{suffix}</span>;
}

/* ══════════════════════════════════════════════════
   MAIN
   ══════════════════════════════════════════════════ */
export default function Landing() {
  const [billing, setBilling] = useState<"m" | "q">("m");
  const [morph, setMorph] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { hidden, scrolled } = useHideOnScroll();

  useSmoothScroll();
  useReveal();
  useProgress();
  useCursorGlow();

  const sceneRef = useRef<HTMLDivElement>(null);
  const cwrapRef = useRef<HTMLDivElement>(null);
  useScrollRotate(sceneRef);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    setMorph(true);
    const t = setTimeout(() => setMorph(false), 540);
    return () => clearTimeout(t);
  }, [billing]);

  const wa = (msg: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;

  const audience = [
    { icon: I.wave, label: "Hair sellers" },
    { icon: I.bag, label: "Fashion vendors" },
    { icon: I.jar, label: "Skincare brands" },
    { icon: I.bowl, label: "Food vendors" },
    { icon: I.shoe, label: "Shoe sellers" },
    { icon: I.dress, label: "Boutiques" },
    { icon: I.sliders, label: "Thrift stores" },
    { icon: I.hat, label: "Accessory shops" },
  ];

  return (
    <>
      {/* ═══════════ NAV ═══════════ */}
      <nav className={`nav ${hidden ? "hidden" : ""} ${scrolled ? "scrolled" : ""}`}>
        <div className="wrap nav-inner">
          <a href="#top" className="nav-brand">
            <span className="text-green">{I.logoBag}</span>
            biomart
          </a>

          <div className="nav-links">
            <a href="#how" className="nav-link">How it works</a>
            <a href="#features" className="nav-link">Features</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#faq" className="nav-link">Questions</a>
            <Link to={SIGNUP_URL} className="btn sm nav-cta-desktop">
              Create your store {I.arrow}
            </Link>
          </div>

          <Link to={SIGNUP_URL} className="nav-cta-mobile">
            Get started {I.arrowSm}
          </Link>
        </div>
      </nav>

      <main id="top" className="bg-bg text-ink relative">

        {/* ═══════════ HERO ═══════════ */}
        <header className="hero grain" id="hero">
          <div className="blob-wrap">
            <div className="blob g" />
            <div className="blob w" />
          </div>

        
                <h1 className="h-hero" style={{ marginTop: 32 }}>
                  Your bio link,<br />but it sells.
                </h1>

                <p className="lead-xl" style={{ marginTop: 28 }}>
                  perfect product catalog for your bio
                </p>

                <div style={{ marginTop: 36, display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
                  <Link to={SIGNUP_URL} className="btn">
                    Create your store {I.arrow}
                  </Link>
                  <a href="#how" className="link">See how it works</a>
                </div>

            
              <div className="scene" ref={sceneRef} role="img" aria-label="A phone showing a biomart catalogue">
                <div className={`stage ${mounted ? "enter" : ""}`} data-stage>
                  <div className="phone">
                    <div className="screen">
                      <div className="s-top">
                        <span className="text-green">{I.logoBag}</span>
                        <b>Adaeze's Closet</b>
                      </div>
                      <p className="s-sub">Bags, shoes and skincare · Lagos</p>
                      <div className="s-cats">
                        <span className="on">All</span><span>Bags</span><span>Skincare</span>
                      </div>
                      <div className="s-grid">
                        <div className="s-item">
                          <div className="s-ph">
                            <span className="s-tag">−26%</span>
                            <img src={IMG.tote} alt="Ankara tote" width="140" height="140" loading="eager" decoding="async" />
                          </div>
                          <b>Ankara tote bag</b><span>₦18,500</span>
                        </div>
                        <div className="s-item">
                          <div className="s-ph">
                            <img src={IMG.sneakers} alt="White sneakers" width="140" height="140" loading="lazy" decoding="async" />
                          </div>
                          <b>White sneakers</b><span>₦32,000</span>
                        </div>
                        <div className="s-item">
                          <div className="s-ph">
                            <img src={IMG.shea} alt="Shea body butter" width="140" height="140" loading="lazy" decoding="async" />
                          </div>
                          <b>Shea body butter</b><span>₦6,500</span>
                        </div>
                        <div className="s-item">
                          <div className="s-ph">
                            <img src={IMG.hat} alt="Straw sun hat" width="140" height="140" loading="lazy" decoding="async" />
                          </div>
                          <b>Straw sun hat</b><span>₦9,800</span>
                        </div>
                      </div>
                      <div className="s-btn">Order on WhatsApp</div>
                    </div>
                  </div>
                  <div className={`chip c-msg float ${mounted ? "enter" : ""}`}>
                    I'd like the tote bag × 2
                  </div>
                  <div className={`chip c-bank float ${mounted ? "enter" : ""}`}>
                    Loads in under a second<small>Even on 3G</small>
                  </div>
                </div>
              </div>
            </div>

            {/* THREE STATS — all relate to the app */}
            <div className="hero-stats reveal">
              <div>
                <div className="stat-num"><CountUp to={300} suffix="+" /></div>
                <div className="stat-label">Stores live</div>
              </div>
              <div>
                <div className="stat-num"><CountUp to={320} suffix="ms" /></div>
                <div className="stat-label">Avg load time</div>
              </div>
              <div>
                <div className="stat-num"><CountUp to={2} suffix=" min" /></div>
                <div className="stat-label">Setup time</div>
              </div>
            </div>
          </div>
        </header>

        {/* ═══════════ SERVE STRIP ═══════════ */}
        <div className="serve-strip">
          <div className="marquee-track">
            {[...audience, ...audience].map((a, i) => (
              <div key={i} className="serve-item">
                {a.icon}
                <span>{a.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════ WHY ═══════════ */}
        <section>
          <div className="wrap">
            <div className="sh reveal">
              <div>
                <span className="eyebrow">Why biomart</span>
                <h2 className="h-section" style={{ marginTop: 18 }}>
                  Stop selling<br />from your DMs.
                </h2>
              </div>
              <p className="lead-lg">
                Your inbox was never built for a catalogue. One link fixes it.
              </p>
            </div>
            <div className="ba">
              <div className="card no reveal">
                <h3>Without biomart</h3>
                <ul>
                  <li>{I.x}Price list screenshots in every chat</li>
                  <li>{I.x}"How much?" forty times a day</li>
                  <li>{I.x}Orders buried in your inbox</li>
                  <li>{I.x}No way to show what's sold out</li>
                </ul>
              </div>
              <div className="card yes reveal">
                <h3>With biomart</h3>
                <ul>
                  <li>{I.tick}One link with your full catalogue</li>
                  <li>{I.tick}Photos, sizes and prices together</li>
                  <li>{I.tick}Orders arrive pre-filled on WhatsApp</li>
                  <li>{I.tick}Mark sold out in one tap</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ HOW ═══════════ */}
        <section className="bg-soft" id="how">
          <div className="wrap">
            <div className="sh reveal">
              <div>
                <span className="eyebrow">How it works</span>
                <h2 className="h-section" style={{ marginTop: 18 }}>
                  Live in<br />two minutes.
                </h2>
              </div>
              <p className="lead-lg">
                No designer. No developer. No domain. Just three steps.
              </p>
            </div>
            <div className="steps">
              <div className="card step reveal">
                <span className="n">1</span>
                <h3>Add your products</h3>
                <p>Photo, name, price. Tap save.</p>
              </div>
              <div className="card step reveal">
                <span className="n">2</span>
                <h3>Share one link</h3>
                <p>Paste it in your Instagram or TikTok bio.</p>
              </div>
              <div className="card step reveal">
                <span className="n">3</span>
                <h3>Get orders</h3>
                <p>WhatsApp opens with the message already written.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ WHAT CUSTOMERS SEE ═══════════ */}
        <section>
          <div className="wrap two">
            <div className="reveal">
              <span className="eyebrow">What your customers see</span>
              <h2 className="h-section" style={{ marginTop: 18 }}>
                They browse.<br />They choose.<br />They message you.
              </h2>
              <p className="lead-lg" style={{ marginTop: 24 }}>
                Every product opens into a real detail page. The order writes itself.
              </p>
              <div className="pay">
                <div className="item">
                  <div className="iconbox">{I.chat}</div>
                  <div>
                    <h3>Prefilled WhatsApp orders</h3>
                    <p>Product, size and total already in the message.</p>
                  </div>
                </div>
                <div className="item">
                  <div className="iconbox">{I.sliders}</div>
                  <div>
                    <h3>Sizes and options</h3>
                    <p>Customers pick a variant, price updates live.</p>
                  </div>
                </div>
                <div className="item">
                  <div className="iconbox">{I.bolt}</div>
                  <div>
                    <h3>Loads in under a second</h3>
                    <p>Fast, even on 3G. No app, no account.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3D product page — taller now, nothing gets cut */}
            <div className="cwrap" ref={cwrapRef} aria-hidden="true">
              <div className="stack" data-stage>
                <div className="layer base">
                  <div className="photo">
                    <img
                      src={IMG.toteBig}
                      alt="Ankara tote bag"
                      width="600"
                      height="630"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <h3>Ankara tote bag</h3>
                  <div className="price"><b>₦20,500</b><s>₦27,000</s></div>
                  <div className="opts">
                    <span>Small</span>
                    <span className="on">Large +₦2,000</span>
                  </div>
                  <div className="spacer"></div>
                </div>

                <div className="layer f-cart">
                  <div className="row"><span>Ankara tote · Large</span><b>₦22,500</b></div>
                  <div className="row"><span>Quantity</span><b>× 2</b></div>
                  <div className="row total"><span>Total</span><b>₦45,000</b></div>
                </div>

                <div className="f-btn">
                  {I.chat} Order on WhatsApp
                </div>

                <div className="f-msg">
                  Hi! I'd like the Ankara tote bag (Large) × 2
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ FEATURES ═══════════ */}
        <section className="bg-soft" id="features">
          <div className="wrap">
            <div className="sh reveal">
              <div>
                <span className="eyebrow">Features</span>
                <h2 className="h-section" style={{ marginTop: 18 }}>
                  Everything<br />a catalogue needs.
                </h2>
              </div>
              <p className="lead-lg">
                Just the tools WhatsApp sellers actually use. Nothing extra.
              </p>
            </div>
            <div className="feat3">
              <div className="card reveal">
                <div className="iconbox">{I.sliders}</div>
                <h3>Sizes and options</h3>
                <p>Sizes, lengths, shades — priced automatically.</p>
              </div>
              <div className="card reveal">
                <div className="iconbox">{I.tag}</div>
                <h3>Discount tag</h3>
                <p>Cross out the old price. Customers see the saving.</p>
              </div>
              <div className="card reveal">
                <div className="iconbox">{I.grid}</div>
                <h3>Categories</h3>
                <p>Group your products. Customers find things fast.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ PRICING ═══════════ */}
        <section id="pricing">
          <div className="wrap">
            <div className="sh reveal">
              <div>
                <span className="eyebrow">Pricing</span>
                <h2 className="h-section" style={{ marginTop: 18 }}>
                  Start free.<br />Upgrade when you grow.
                </h2>
              </div>
              <p className="lead-lg">
                Pay monthly, or every 3 months and save. Cancel anytime.
              </p>
            </div>

            <div className="switch reveal" role="group" aria-label="Billing">
              <button type="button" aria-pressed={billing === "m"} onClick={() => setBilling("m")}>
                Monthly
              </button>
              <button type="button" aria-pressed={billing === "q"} onClick={() => setBilling("q")}>
                Every 3 months<small>Save up to ₦1,000</small>
              </button>
            </div>

            <div className="plans">
              <div className="plan reveal">
                <h3>Free</h3>
                <p className="desc">Try biomart.</p>
                <div className={`p ${morph ? "morph" : ""}`}>
                  <span>₦0</span>
                </div>
                <ul>
                  <li>5 products</li>
                  <li>1 photo each</li>
                  <li>WhatsApp orders</li>
                  <li className="no">Sizes and options</li>
                </ul>
                <Link to={SIGNUP_URL} className="btn line">Create your store</Link>
              </div>

              <div className="plan reveal">
                <h3>Starter</h3>
                <p className="desc">Just getting going.</p>
                <div className={`p ${morph ? "morph" : ""}`}>
                  <span>{billing === "m" ? "₦2,000" : "₦5,500"}</span>
                  <span className="per">{billing === "m" ? "/month" : "/3 months"}</span>
                </div>
                <ul>
                  <li>15 products</li>
                  <li>2 photos each</li>
                  <li>WhatsApp orders</li>
                  <li className="no">Sizes and options</li>
                </ul>
                <Link to={SIGNUP_URL} className="btn line">Get Starter</Link>
              </div>

              <div className="plan pop reveal">
                <span className="badge">24/7 customer support</span>
                <h3>Pro</h3>
                <p className="desc">Full catalogue.</p>
                <div className={`p ${morph ? "morph" : ""}`}>
                  <span>{billing === "m" ? "₦4,000" : "₦11,000"}</span>
                  <span className="per">{billing === "m" ? "/month" : "/3 months"}</span>
                </div>
                <ul>
                  <li>50 products</li>
                  <li>5 photos each</li>
                  <li>WhatsApp orders</li>
                  <li>Sizes and options</li>
                </ul>
                <Link to={SIGNUP_URL} className="btn">Get Pro</Link>
              </div>

              <div className="plan life reveal">
                <span className="badge alt">Founding seller</span>
                <h3>Lifetime</h3>
                <p className="desc">Pay once. Keep forever.</p>
                <div className="p">
                  <span>₦40,000</span><span className="per">once</span>
                </div>
                <ul>
                  <li>Unlimited products</li>
                  <li>10 photos each</li>
                  <li>WhatsApp orders</li>
                  <li>Sizes and options</li>
                </ul>
                <Link to={SIGNUP_URL} className="btn line">Get Lifetime</Link>
              </div>
            </div>

            <div className="custom reveal">
              <div>
                <h3>Need a full online store?</h3>
                <p>Cart, payments and your own domain. Quoted after a quick chat.</p>
              </div>
              <div className="from">From<b>₦100,000</b></div>
              <a
                href={wa("Hi biomart, I'd like a quote for a custom online store.")}
                className="btn line"
                target="_blank"
                rel="noopener"
              >
                Talk to us {I.arrow}
              </a>
            </div>
          </div>
        </section>

        {/* ═══════════ FAQ ═══════════ */}
        <section className="bg-soft" id="faq">
          <div className="wrap faqgrid">
            <div className="reveal">
              <span className="eyebrow">Questions</span>
              <h2 className="h-section" style={{ marginTop: 18 }}>
                Everything<br />you're wondering.
              </h2>
              <p className="lead-lg" style={{ marginTop: 24 }}>
                Can't find your answer?{" "}
                <a className="link" href={wa("Hi biomart, I have a question.")} target="_blank" rel="noopener">
                  Chat with us on WhatsApp
                </a>.
              </p>
            </div>
            <div className="reveal">
              <details><summary>Do my customers need an account?</summary><p>No. They open your link, browse, and message you on WhatsApp.</p></details>
              <details><summary>Do I need a website?</summary><p>No. Your biomart link is your store.</p></details>
              <details><summary>How do I get paid?</summary><p>Bank transfer, cash, POS. Whatever you already use.</p></details>
              <details><summary>Can I try it free?</summary><p>Yes. 5 products, 1 photo each. No card.</p></details>
              <details><summary>What is the Lifetime plan?</summary><p>₦40,000 once. Unlimited products forever. First 10 sellers.</p></details>
              <details><summary>Can I get a full online store?</summary><p>Yes. From ₦100,000. Cart, payments, your own domain.</p></details>
            </div>
          </div>
        </section>

        {/* ═══════════ FINAL PANEL ═══════════ */}
        <section className="final" id="start">
          <div className="wrap">
            <div className="panel reveal grain">
              <div className="blob-wrap">
                <div className="blob w" />
              </div>
              <div className="relative z-[2]">
                <h2 className="h-section" style={{ maxWidth: "11em", margin: "0 auto", color: "#fff" }}>
                  Open your store.
                </h2>
                <p className="lead-lg" style={{ color: "rgba(255,255,255,0.7)", margin: "24px auto 0" }}>
                  Free to start. Two minutes. Live before your next DM.
                </p>
                <div className="row">
                  <Link to={SIGNUP_URL} className="btn">
                    Start free {I.arrow}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer>
        <div className="wrap">
          <div className="fgrid">
            <div>
              <a href="#top" className="logo"><span className="text-green">{I.logoBag}</span>biomart</a>
              <p className="tag">Your bio link, but it sells.</p>
            </div>
            <div>
              <h4>Product</h4>
              <ul>
                <li><a href="#how">How it works</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4>Help</h4>
              <ul>
                <li><a href="#faq">Questions</a></li>
                <li><a href={wa("Hi biomart, I have a question.")} target="_blank" rel="noopener">Chat on WhatsApp</a></li>
                <li><Link to={SIGNUP_URL}>Create your store</Link></li>
              </ul>
            </div>
            <div>
              <h4>Legal</h4>
              <ul>
                <li><a href="#">Privacy</a></li>
                <li><a href="#">Terms</a></li>
                <li><a href="#">Refunds</a></li>
              </ul>
            </div>
          </div>
          <div className="fbot">
            <span>© 2026 biomart</span>
            <span>Made in Nigeria</span>
          </div>
        </div>
      </footer>
    </>
  );
}
