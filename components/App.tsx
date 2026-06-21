"use client";
/* Isoko — root app: routing, cart, language, transitions, role switching.
 * Ported from the prototype's app.jsx. */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./ui";
import { Header, Home, Category } from "./storefront";
import { Cart, Checkout, Confirmation, Product } from "./storefront2";
import { Admin, Seller } from "./dashboards";
import { I18N } from "@/lib/i18n";
import type { CartItem, Lang, Order, Role } from "@/lib/types";
import type { Route, RouteName } from "./routing";

const TRANS_ORDER: Record<string, number> = { home: 0, category: 1, product: 2, cart: 3, checkout: 4, confirm: 5, null: 0 };

export default function App() {
  const [lang, setLang] = useState<Lang>("en");
  const [role, setRole] = useState<Role>("shop");
  const [route, setRoute] = useState<Route>({ name: "home" });
  const [prevName, setPrevName] = useState<RouteName | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [cartPulse, setCartPulse] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  // Hydrate persisted state on the client only (avoids SSR/client mismatch).
  useEffect(() => {
    const savedLang = localStorage.getItem("isoko.lang") as Lang | null;
    if (savedLang) setLang(savedLang);
    try {
      const savedCart = JSON.parse(localStorage.getItem("isoko.cart") || "[]");
      if (Array.isArray(savedCart)) setCart(savedCart);
    } catch {
      /* ignore corrupt cart */
    }
  }, []);

  const t = useCallback((k: string) => (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k, [lang]);

  useEffect(() => { localStorage.setItem("isoko.lang", lang); }, [lang]);
  useEffect(() => { localStorage.setItem("isoko.cart", JSON.stringify(cart)); }, [cart]);

  const go = useCallback((r: Route) => {
    setRoute((cur) => { setPrevName(cur.name); return r; });
    if (stageRef.current) stageRef.current.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const cartCount = cart.reduce((s, it) => s + it.qty, 0);

  const flyTo = useCallback((e?: React.MouseEvent | null) => {
    // micro-interaction: ghost flies from button to cart icon
    const cartEl = document.querySelector(".hdr__cart");
    if (!e || !e.currentTarget || !cartEl) return;
    const a = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const b = cartEl.getBoundingClientRect();
    const dot = document.createElement("span");
    dot.className = "flydot";
    dot.style.left = a.left + a.width / 2 + "px";
    dot.style.top = a.top + a.height / 2 + "px";
    document.body.appendChild(dot);
    requestAnimationFrame(() => {
      dot.style.transform = `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${b.top + b.height / 2 - (a.top + a.height / 2)}px) scale(0.3)`;
      dot.style.opacity = "0";
    });
    setTimeout(() => dot.remove(), 750);
  }, []);

  const addToCart = useCallback(
    (p: { id: string; price: number; title: string }, e?: React.MouseEvent | null, qty = 1, variant: Record<string, string> | null = null) => {
      flyTo(e);
      const key = p.id + (variant ? ":" + Object.values(variant).join("-") : "");
      setCart((c) => {
        const ex = c.find((x) => x.key === key);
        if (ex) return c.map((x) => (x.key === key ? { ...x, qty: x.qty + qty } : x));
        return [...c, { key, id: p.id, qty, price: p.price, variant }];
      });
      setCartPulse(true);
      setTimeout(() => setCartPulse(false), 600);
      setToast(`${p.title} · ${t("added")}`);
      setTimeout(() => setToast(null), 2200);
    },
    [flyTo, t],
  );

  const setQty = useCallback(
    (key: string, q: number) =>
      setCart((c) => (q <= 0 ? c.filter((x) => x.key !== key) : c.map((x) => (x.key === key ? { ...x, qty: q } : x)))),
    [],
  );
  const removeItem = useCallback((key: string) => setCart((c) => c.filter((x) => x.key !== key)), []);

  const placeOrder = useCallback(
    (pay: string) => {
      const methodMap: Record<string, string> = { momo: "MTN MoMo", airtel: "Airtel Money", card: "Card · Flutterwave" };
      const id = "ISK-" + Math.floor(20000 + Math.random() * 9000);
      setOrder({ id, method: methodMap[pay] || "MTN MoMo" });
      setCart([]);
      go({ name: "confirm" });
    },
    [go],
  );

  const switchRole = useCallback((r: Role) => { setRole(r); if (r === "shop") go({ name: "home" }); }, [go]);

  // ----- render -----
  if (role === "seller") return (<><Seller t={t} lang={lang} exit={() => switchRole("shop")} /><RoleBar role={role} setRole={switchRole} t={t} /></>);
  if (role === "admin") return (<><Admin t={t} lang={lang} exit={() => switchRole("shop")} /><RoleBar role={role} setRole={switchRole} t={t} /></>);

  const dir = TRANS_ORDER[route.name] >= TRANS_ORDER[prevName ?? "null"] ? "fwd" : "back";
  let view: React.ReactNode = null;
  if (route.name === "home") view = <Home t={t} lang={lang} go={go} addToCart={addToCart} />;
  else if (route.name === "category") view = <Category t={t} lang={lang} go={go} addToCart={addToCart} params={route} />;
  else if (route.name === "product") view = <Product t={t} lang={lang} go={go} addToCart={addToCart} params={route} />;
  else if (route.name === "cart") view = <Cart t={t} go={go} cart={cart} setQty={setQty} removeItem={removeItem} addToCart={addToCart} />;
  else if (route.name === "checkout") view = <Checkout t={t} go={go} cart={cart} placeOrder={placeOrder} />;
  else if (route.name === "confirm") view = <Confirmation t={t} go={go} addToCart={addToCart} order={order || { id: "ISK-00000", method: "MTN MoMo" }} />;

  return (
    <div className="app">
      <Header t={t} lang={lang} setLang={setLang} cartCount={cartCount} go={go} screen={route.name} role={role} setRole={switchRole} cartPulse={cartPulse} />
      <div className="stage" ref={stageRef}>
        <div className={`pageanim pageanim--${dir}`} key={route.name + (route.id || "") + (route.cat || "") + (route.q || "")}>
          {view}
        </div>
      </div>
      {toast && <div className="toast"><span className="toast__ico"><Icon name="check" size={15} /></span>{toast}<button className="toast__cta" onClick={() => go({ name: "cart" })}>{t("yourCart")}</button></div>}
      <RoleBar role={role} setRole={switchRole} t={t} />
    </div>
  );
}

/* floating role switcher so reviewers can jump between the 3 apps */
function RoleBar({ role, setRole, t }: { role: Role; setRole: (r: Role) => void; t: (k: string) => string }) {
  const [open, setOpen] = useState(true);
  const opts: [Role, string, string][] = [["shop", "cart", t("shop")], ["seller", "tag", t("seller")], ["admin", "chart", t("admin")]];
  return (
    <div className={`rolebar ${open ? "" : "is-min"}`}>
      <button className="rolebar__toggle" onClick={() => setOpen(!open)} aria-label="Toggle view switcher">
        <Icon name={open ? "chevR" : "grid"} size={16} />
      </button>
      {open && (
        <div className="rolebar__opts">
          <span className="rolebar__lbl">Demo view</span>
          {opts.map(([r, ic, lbl]) => (
            <button key={r} className={role === r ? "is-on" : ""} onClick={() => setRole(r)}><Icon name={ic} size={15} /> {lbl}</button>
          ))}
        </div>
      )}
    </div>
  );
}
