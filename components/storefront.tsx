"use client";
/* Isoko — buyer storefront screens (header, home, category). Ported from storefront.jsx. */
import React, { useEffect, useState } from "react";
import { Button, CatGlyph, Icon, ProductCard, ProductImage, Rail, Stars, useReveal } from "./ui";
import { Footer, PayChip } from "./storefront2";
import { rankProducts } from "@/lib/recommendations";
import { catById, CATEGORIES, PRODUCTS, rwf, STORES } from "@/lib/data";
import type { Lang, Role, Translator } from "@/lib/types";
import type { AddToCart, Go, Route, RouteName } from "./routing";

/* ============================ HEADER ============================ */
export function Header({
  t, lang, setLang, cartCount, go, screen, role, setRole, cartPulse,
}: {
  t: Translator;
  lang: Lang;
  setLang: (l: Lang) => void;
  cartCount: number;
  go: Go;
  screen: RouteName;
  role: Role;
  setRole: (r: Role) => void;
  cartPulse: boolean;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  return (
    <header className="hdr">
      <div className="hdr__bar">
        <button className="hdr__menu" onClick={() => setOpen(!open)} aria-label="Menu"><Icon name={open ? "close" : "menu"} /></button>
        <a className="hdr__logo" onClick={() => go({ name: "home" })}>
          <span className="hdr__mark">i</span><span className="hdr__word">isoko</span>
        </a>
        <form className="hdr__search" onSubmit={(e) => { e.preventDefault(); go({ name: "category", q }); }}>
          <Icon name="search" size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPh")} aria-label="Search" />
        </form>
        <div className="hdr__actions">
          <div className="lang" role="group" aria-label="Language">
            <button className={lang === "en" ? "is-on" : ""} onClick={() => setLang("en")}>EN</button>
            <button className={lang === "rw" ? "is-on" : ""} onClick={() => setLang("rw")}>RW</button>
          </div>
          <button className="hdr__icon" aria-label="Account"><Icon name="user" /></button>
          <button className="hdr__icon hdr__cart" onClick={() => go({ name: "cart" })} aria-label={t("cart")}>
            <Icon name="cart" />
            {cartCount > 0 && <span className={`hdr__count ${cartPulse ? "is-pulse" : ""}`}>{cartCount}</span>}
          </button>
        </div>
      </div>
      <nav className={`hdr__nav ${open ? "is-open" : ""}`}>
        <a className={screen === "home" ? "is-on" : ""} onClick={() => { go({ name: "home" }); setOpen(false); }}>{t("home")}</a>
        {CATEGORIES.map((c) => (
          <a key={c.id} onClick={() => { go({ name: "category", cat: c.id }); setOpen(false); }}>{lang === "rw" ? c.rw : c.name}</a>
        ))}
        <div className="hdr__roles">
          <span className="hdr__rolesLbl">View as</span>
          {(["shop", "seller", "admin"] as Role[]).map((r) => (
            <button key={r} className={role === r ? "is-on" : ""} onClick={() => { setRole(r); setOpen(false); }}>{t(r)}</button>
          ))}
        </div>
      </nav>
    </header>
  );
}

/* ============================ HOME ============================ */
export function Home({
  t, lang, go, addToCart,
}: {
  t: Translator; lang: Lang; go: Go; addToCart: AddToCart;
}) {
  useReveal();
  const featured = PRODUCTS.filter((p) => p.tag).slice(0, 8);
  const newArr = PRODUCTS.slice().reverse().slice(0, 8);
  return (
    <div className="screen">
      {/* Hero */}
      <section className="hero">
        <div className="hero__glow"></div>
        <div className="hero__inner">
          <div className="hero__copy">
            <span className="hero__eyebrow reveal"><Icon name="sparkle" size={14} /> {t("heroEyebrow")}</span>
            <h1 className="hero__title reveal">{t("heroTitle").split("\n").map((l, i) => <span key={i}>{l}<br /></span>)}</h1>
            <p className="hero__sub reveal">{t("heroSub")}</p>
            <div className="hero__cta reveal">
              <Button size="lg" iconRight="arrow" onClick={() => go({ name: "category" })}>{t("shopNow")}</Button>
              <Button size="lg" variant="ghost" onClick={() => go({ name: "category" })}>{t("becomeSeller")}</Button>
            </div>
            <div className="hero__pay reveal">
              <PayChip label="MTN MoMo" tone="#ffcc00" ink="#1a1a1a" />
              <PayChip label="Airtel Money" tone="#e4002b" ink="#fff" />
              <PayChip label="Visa · Card" tone="#1a1f71" ink="#fff" />
            </div>
          </div>
          <div className="hero__art reveal">
            <div className="hero__card hero__card--a"><ProductImage product={PRODUCTS[0]} showLabel={false} /></div>
            <div className="hero__card hero__card--b"><ProductImage product={PRODUCTS[5]} showLabel={false} /></div>
            <div className="hero__card hero__card--c"><ProductImage product={PRODUCTS[2]} showLabel={false} /></div>
            <div className="hero__stat reveal">
              <strong>4,800+</strong><span>shoppers in Kigali</span>
            </div>
          </div>
        </div>
        <div className="hero__trust">
          <Trust icon="truck" title={t("estDelivery")} />
          <Trust icon="shield" title={t("secure")} />
          <Trust icon="phone" title="SMS & WhatsApp updates" />
          <Trust icon="refresh" title="Easy returns" />
        </div>
      </section>

      {/* Categories */}
      <section className="sec reveal">
        <SecHead title={t("shopByCat")} />
        <div className="catgrid">
          {CATEGORIES.map((c, i) => (
            <button key={c.id} className="catcard" style={{ "--tint": c.tint, "--i": i } as React.CSSProperties} onClick={() => go({ name: "category", cat: c.id })}>
              <span className="catcard__ico" style={{ color: c.tint }}><CatGlyph glyph={c.glyph} /></span>
              <span className="catcard__name">{lang === "rw" ? c.rw : c.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="sec reveal">
        <SecHead title={t("featured")} action={t("viewAll")} onAction={() => go({ name: "category" })} />
        <div className="pgrid">
          {featured.map((p) => <ProductCard key={p.id} product={p} t={t} onOpen={(pr) => go({ name: "product", id: pr.id })} onAdd={(pr, e) => addToCart(pr, e)} />)}
        </div>
      </section>

      {/* Recommended for you (ML) */}
      <div className="recwrap">
        <Rail t={t} icon="sparkle" title={t("recForYou")} sub={t("recSub")}>
          {rankProducts({ n: 8 }).map(({ p, reason }) => (
            <div className="rail__item" key={p.id}><ProductCard product={p} t={t} reason={reason} onOpen={(pr) => go({ name: "product", id: pr.id })} onAdd={(pr, e) => addToCart(pr, e)} /></div>
          ))}
        </Rail>
      </div>

      {/* New arrivals */}
      <section className="sec reveal">
        <SecHead title={t("newArrivals")} action={t("viewAll")} onAction={() => go({ name: "category" })} />
        <div className="pgrid">
          {newArr.map((p) => <ProductCard key={p.id} product={p} t={t} onOpen={(pr) => go({ name: "product", id: pr.id })} onAdd={(pr, e) => addToCart(pr, e)} />)}
        </div>
      </section>

      {/* Top sellers */}
      <section className="sec reveal">
        <SecHead title={t("topSellers")} />
        <div className="sellergrid">
          {STORES.slice(0, 4).map((s) => (
            <div className="sellercard" key={s.id}>
              <div className="sellercard__logo">{s.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</div>
              <div className="sellercard__info">
                <div className="sellercard__name">{s.name}{s.verified && <Icon name="shield" size={13} className="sellercard__v" />}</div>
                <div className="sellercard__meta"><Stars value={s.rating} size={12} showNum count={s.reviews} /></div>
                <div className="sellercard__city"><Icon name="pin" size={12} /> {s.city}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer t={t} />
    </div>
  );
}

function Trust({ icon, title }: { icon: string; title: string }) {
  return <div className="trust"><Icon name={icon} size={18} /><span>{title}</span></div>;
}
export function SecHead({
  title, action, onAction, sub,
}: {
  title: string; action?: string; onAction?: () => void; sub?: string;
}) {
  return (
    <div className="sechead">
      <div><h2 className="sechead__title">{title}</h2>{sub && <p className="sechead__sub">{sub}</p>}</div>
      {action && <button className="sechead__action" onClick={onAction}>{action} <Icon name="chevR" size={15} /></button>}
    </div>
  );
}

/* ============================ CATEGORY / SEARCH ============================ */
export function Category({
  t, lang, go, addToCart, params,
}: {
  t: Translator; lang: Lang; go: Go; addToCart: AddToCart; params: Route;
}) {
  useReveal();
  const [cat, setCat] = useState(params.cat || "all");
  const [sort, setSort] = useState("relevance");
  const [maxP, setMaxP] = useState(260000);
  const [showFilter, setShowFilter] = useState(false);
  useEffect(() => { setCat(params.cat || "all"); }, [params.cat]);

  let list = PRODUCTS.filter((p) => (cat === "all" || p.cat === cat) && p.price <= maxP);
  if (params.q) {
    const q = params.q.toLowerCase();
    list = list.filter((p) => p.title.toLowerCase().includes(q) || p.cat.includes(q));
  }
  list = list.slice().sort((a, b) => {
    if (sort === "priceLow") return a.price - b.price;
    if (sort === "priceHigh") return b.price - a.price;
    if (sort === "bestRated") return b.rating - a.rating;
    if (sort === "newest") return b.id.localeCompare(a.id);
    return b.reviews - a.reviews;
  });
  const catName = cat === "all" ? t("categories") : (lang === "rw" ? catById(cat)?.rw : catById(cat)?.name);

  return (
    <div className="screen">
      <div className="cat">
        <div className="cat__top reveal">
          <button className="back" onClick={() => go({ name: "home" })}><Icon name="chevL" size={16} /> {t("back")}</button>
          <h1 className="cat__title">{params.q ? `“${params.q}”` : catName}</h1>
          <span className="cat__count">{list.length} {t("results")}</span>
        </div>

        <div className="cat__chips reveal">
          <button className={cat === "all" ? "chip is-on" : "chip"} onClick={() => setCat("all")}>{t("categories")}</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} className={cat === c.id ? "chip is-on" : "chip"} onClick={() => setCat(c.id)}>{lang === "rw" ? c.rw : c.name}</button>
          ))}
        </div>

        <div className="cat__bar reveal">
          <button className="filterbtn" onClick={() => setShowFilter(!showFilter)}><Icon name="filter" size={16} /> {t("filters")}</button>
          <label className="sort">
            <span>{t("sortBy")}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="relevance">{t("relevance")}</option>
              <option value="priceLow">{t("priceLow")}</option>
              <option value="priceHigh">{t("priceHigh")}</option>
              <option value="newest">{t("newest")}</option>
              <option value="bestRated">{t("bestRated")}</option>
            </select>
          </label>
        </div>

        {showFilter && (
          <div className="cat__filter reveal">
            <label>{t("priceRange")}: <strong>{rwf(maxP)}</strong></label>
            <input type="range" min="5000" max="260000" step="2500" value={maxP} onChange={(e) => setMaxP(+e.target.value)} />
          </div>
        )}

        <div className="pgrid pgrid--cat">
          {list.map((p, i) => (
            <div className="reveal" style={{ "--i": i % 8 } as React.CSSProperties} key={p.id}>
              <ProductCard product={p} t={t} onOpen={(pr) => go({ name: "product", id: pr.id })} onAdd={(pr, e) => addToCart(pr, e)} />
            </div>
          ))}
        </div>
        {list.length === 0 && <div className="empty"><Icon name="search" size={32} /><p>No products match. Try the recommendations below.</p></div>}
      </div>

      <div className="recwrap">
        <Rail t={t} icon="sparkle" title={t("recForYou")} sub={t("recSub")}>
          {rankProducts({ n: 8, cat: cat !== "all" ? cat : null }).map(({ p, reason }) => (
            <div className="rail__item" key={p.id}><ProductCard product={p} t={t} reason={reason} onOpen={(pr) => go({ name: "product", id: pr.id })} onAdd={(pr, e) => addToCart(pr, e)} /></div>
          ))}
        </Rail>
      </div>
      <Footer t={t} />
    </div>
  );
}
