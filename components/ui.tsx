"use client";
/* Isoko — shared UI primitives. Ported from the prototype's ui.jsx. */
import React, { useEffect, useRef, useState } from "react";
import { rwf, storeById } from "@/lib/data";
import type { Product, RecReasonKind, Translator } from "@/lib/types";

/* ----------------------------- Icons ----------------------------- */
const ICON_PATHS: Record<string, string> = {
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3",
  cart: "M3 4h2l2.4 12.4a1 1 0 001 .8h9.7a1 1 0 001-.8L21 8H7M9 21a1 1 0 100-2 1 1 0 000 2zM18 21a1 1 0 100-2 1 1 0 000 2z",
  heart: "M19.5 5.5a5 5 0 00-7.1 0l-.4.4-.4-.4a5 5 0 10-7.1 7.1l7.5 7.5 7.5-7.5a5 5 0 000-7.1z",
  star: "M12 3l2.6 5.5 6 .9-4.3 4.2 1 6L12 17.8 6.7 19.6l1-6L3.4 9.4l6-.9L12 3z",
  user: "M20 21a8 8 0 10-16 0M12 11a4 4 0 100-8 4 4 0 000 8z",
  menu: "M3 6h18M3 12h18M3 18h18",
  close: "M18 6L6 18M6 6l12 12",
  chevR: "M9 6l6 6-6 6", chevL: "M15 6l-6 6 6 6", chevD: "M6 9l6 6 6-6",
  arrow: "M5 12h14M13 6l6 6-6 6",
  check: "M20 6L9 17l-5-5",
  plus: "M12 5v14M5 12h14", minus: "M5 12h14",
  shield: "M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z",
  truck: "M3 7h11v8H3zM14 10h4l3 3v2h-7M7 19a2 2 0 100-4 2 2 0 000 4zM18 19a2 2 0 100-4 2 2 0 000 4z",
  bolt: "M13 2L3 14h7l-1 8 10-12h-7l1-8z",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z",
  bell: "M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0",
  box: "M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8",
  chart: "M3 3v18h18M7 14l3-3 3 3 5-6",
  wallet: "M3 7h16a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM3 7l2-3h12l2 3M17 13h.01",
  grid: "M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z",
  tag: "M20.6 13.4L12 22l-9-9V4h9l8.6 8.6a1 1 0 010 1.4zM7.5 7.5h.01",
  globe: "M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-6-3.5-9s1-6.5 3.5-9z",
  pkg: "M16 3l5 3v12l-9 4-9-4V6l5-3M3 6l9 4 9-4M12 10v10",
  refresh: "M21 12a9 9 0 11-3-6.7M21 4v5h-5",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z",
  pin: "M12 21s-6-5.7-6-10a6 6 0 1112 0c0 4.3-6 10-6 10zM12 11a2 2 0 100-4 2 2 0 000 4z",
  lock: "M5 11h14v9H5zM8 11V7a4 4 0 018 0v4",
  filter: "M3 5h18l-7 8v6l-4-2v-4L3 5z",
  trend: "M3 17l6-6 4 4 8-8M21 7v5h-5",
};

export function Icon({
  name, size = 20, stroke = 2, className = "", style,
}: {
  name: string; size?: number; stroke?: number; className?: string; style?: React.CSSProperties;
}) {
  const p = ICON_PATHS[name] || "";
  const fill = name === "star" ? "currentColor" : "none";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true">
      {p.split("M").filter(Boolean).map((d, i) => <path key={i} d={"M" + d} />)}
    </svg>
  );
}

/* Category glyphs (simple line marks) */
export function CatGlyph({ glyph, size = 22 }: { glyph: string; size?: number }) {
  const map: Record<string, string> = {
    tshirt: "M8 4l-4 3 2 3 2-1v9h8V9l2 1 2-3-4-3-2 2H10L8 4z",
    device: "M4 5h16v10H4zM2 19h20M9 19l.5-2h5l.5 2",
    home: "M4 11l8-7 8 7M6 10v9h12v-9",
    drop: "M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z",
    bag: "M6 8h12l1 12H5L6 8zM9 8V6a3 3 0 016 0v2",
    phone: "M7 3h10v18H7zM10 19h4",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {(map[glyph] || map.bag).split("M").filter(Boolean).map((d, i) => <path key={i} d={"M" + d} />)}
    </svg>
  );
}

/* ------------------------- Product image ------------------------- */
/* Real product-photo keywords per product id (drives LoremFlickr image search). */
const PRODUCT_IMG_TAGS: Record<string, string> = {
  p1: "ankara,dress",
  p2: "earbuds",
  p3: "wicker,basket",
  p4: "serum,skincare",
  p5: "leather,handbag",
  p6: "smartphone",
  p7: "bomber,jacket",
  p8: "bluetooth,speaker",
  p9: "ceramic,coffee,mug",
  p10: "lipstick,makeup",
  p11: "beaded,necklace",
  p12: "smartwatch",
  p13: "linen,shirt",
  p14: "rug,carpet",
  p15: "facial,mist,spray",
  p16: "powerbank,charger",
};

export function ProductImage({
  product, ratio = "1 / 1", rounded = 16, showLabel = true, imgIndex = 0,
}: {
  product: Product; ratio?: string; rounded?: number; showLabel?: boolean; imgIndex?: number;
}) {
  const h = product.tone || 270;
  const bg = `linear-gradient(145deg, hsl(${h} 42% 92%), hsl(${(h + 28) % 360} 38% 86%))`;
  const blob = `hsl(${h} 55% 78%)`;
  const blob2 = `hsl(${(h + 30) % 360} 60% 82%)`;
  const [failed, setFailed] = useState(false);
  const tags = PRODUCT_IMG_TAGS[product.id] || product.cat || "product";
  const lock = (parseInt((product.id || "p0").replace(/\D/g, ""), 10) || 1) * 10 + imgIndex;
  const src = `https://loremflickr.com/640/640/${tags}?lock=${lock}`;
  return (
    <div className="prod-img" style={{ aspectRatio: ratio, background: bg, borderRadius: rounded }}>
      <div className="prod-img__blob" style={{ background: blob, top: "-18%", right: "-12%" }}></div>
      <div className="prod-img__blob" style={{ background: blob2, bottom: "-22%", left: "-10%", width: "55%", height: "55%" }}></div>
      <svg className="prod-img__stripes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={i} x1={i * 13 - 20} y1="0" x2={i * 13 + 20} y2="100" stroke={`hsl(${h} 45% 70%)`} strokeWidth="0.5" opacity="0.35" />
        ))}
      </svg>
      <div className="prod-img__name" style={{ color: `hsl(${h} 50% 26%)` }}>{product.title}</div>
      {showLabel && <div className="prod-img__tag">product photo</div>}
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="prod-img__photo" src={src} alt={product.title} onError={() => setFailed(true)} />
      )}
    </div>
  );
}

/* ----------------------------- Bits ----------------------------- */
export function Stars({
  value, size = 14, showNum = false, count,
}: {
  value: number; size?: number; showNum?: boolean; count?: number;
}) {
  return (
    <span className="stars" style={{ "--s": size + "px" } as React.CSSProperties}>
      <span className="stars__row" aria-label={value + " stars"}>
        <span className="stars__fill" style={{ width: (value / 5) * 100 + "%" }}>
          {[0, 1, 2, 3, 4].map((i) => <Icon key={i} name="star" size={size} />)}
        </span>
        {[0, 1, 2, 3, 4].map((i) => <Icon key={i} name="star" size={size} className="stars__bg" />)}
      </span>
      {showNum && <span className="stars__num">{value.toFixed(1)}{count != null && <span className="stars__cnt"> ({count})</span>}</span>}
    </span>
  );
}

export function Button({
  children, variant = "primary", size = "md", full, icon, iconRight, className = "", ...rest
}: {
  children?: React.ReactNode; variant?: string; size?: string; full?: boolean;
  icon?: string; iconRight?: string; className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`btn btn--${variant} btn--${size} ${full ? "btn--full" : ""} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={size === "sm" ? 16 : 18} />}
      {children && <span>{children}</span>}
      {iconRight && <Icon name={iconRight} size={size === "sm" ? 16 : 18} />}
    </button>
  );
}

export function Badge({
  children, tone = "neutral", soft, className = "",
}: {
  children: React.ReactNode; tone?: string; soft?: boolean; className?: string;
}) {
  return <span className={`badge badge--${tone} ${soft ? "badge--soft" : ""} ${className}`}>{children}</span>;
}

/* Recommendation reason chip */
export function RecReason({ reason }: { reason: RecReasonKind }) {
  const map: Record<RecReasonKind, { label: string; tone: string }> = {
    collaborative: { label: "People like you bought this", tone: "primary" },
    content: { label: "Similar to what you viewed", tone: "teal" },
    popularity: { label: "Popular right now", tone: "amber" },
  };
  const r = map[reason] || map.popularity;
  return (
    <span className={`rec-reason rec-reason--${r.tone}`}>
      <Icon name="sparkle" size={11} /> {r.label}
    </span>
  );
}

/* ------------------------- Product card ------------------------- */
export function ProductCard({
  product, t, onOpen, onAdd, reason, compact,
}: {
  product: Product;
  t: Translator;
  onOpen: (p: Product) => void;
  onAdd?: (p: Product, e: React.MouseEvent) => void;
  reason?: RecReasonKind;
  compact?: boolean;
}) {
  const store = storeById(product.store);
  const [adding, setAdding] = useState(false);
  const lowStock = product.stock <= 6;
  function add(e: React.MouseEvent) {
    e.stopPropagation();
    setAdding(true);
    onAdd && onAdd(product, e);
    setTimeout(() => setAdding(false), 1100);
  }
  return (
    <article className={`pcard ${compact ? "pcard--compact" : ""}`} onClick={() => onOpen(product)} tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen(product)}>
      <div className="pcard__media">
        <ProductImage product={product} showLabel={false} />
        {product.tag && <span className="pcard__tag">{product.tag}</span>}
        <button className="pcard__fav" onClick={(e) => e.stopPropagation()} aria-label="Save"><Icon name="heart" size={16} /></button>
      </div>
      <div className="pcard__body">
        {reason && <RecReason reason={reason} />}
        <h3 className="pcard__title">{product.title}</h3>
        <div className="pcard__meta">
          <Stars value={product.rating} size={12} />
          <span className="pcard__rev">({product.reviews})</span>
        </div>
        <div className="pcard__store">{store?.name}{store?.verified && <Icon name="shield" size={12} className="pcard__verif" />}</div>
        <div className="pcard__foot">
          <div className="pcard__price">{rwf(product.price)}
            {lowStock && <span className="pcard__low">{t("lowStock")}</span>}
          </div>
          <button className={`pcard__add ${adding ? "is-added" : ""}`} onClick={add} aria-label={t("addToCart")}>
            <Icon name={adding ? "check" : "plus"} size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}

/* Horizontal scroll rail for recommendation strips */
export function Rail({
  title, sub, icon, children,
}: {
  title: React.ReactNode; sub?: string; icon?: string; children: React.ReactNode; t?: Translator;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current && ref.current.scrollBy({ left: dir * 320, behavior: "smooth" });
  return (
    <section className="rail reveal">
      <div className="rail__head">
        <div className="rail__titles">
          <h2 className="rail__title">{icon && <span className="rail__icon"><Icon name={icon} size={18} /></span>}{title}</h2>
          {sub && <span className="rail__sub">{sub}</span>}
        </div>
        <div className="rail__nav">
          <button onClick={() => scroll(-1)} aria-label="Previous"><Icon name="chevL" size={18} /></button>
          <button onClick={() => scroll(1)} aria-label="Next"><Icon name="chevR" size={18} /></button>
        </div>
      </div>
      <div className="rail__track" ref={ref}>{children}</div>
    </section>
  );
}

/* Reveal-on-scroll wrapper */
export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal:not(.is-in)");
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  });
}
