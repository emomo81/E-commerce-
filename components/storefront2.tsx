"use client";
/* Isoko — product detail, cart, checkout, confirmation, footer. Ported from storefront2.jsx. */
import React, { useEffect, useState } from "react";
import { Badge, Button, Icon, ProductCard, ProductImage, Rail, Stars, useReveal } from "./ui";
import { rankProducts } from "@/lib/recommendations";
import { byId, catById, CATEGORIES, REVIEWS, rwf, storeById } from "@/lib/data";
import type { CartItem, Order, Product as ProductT, RecReasonKind, Translator } from "@/lib/types";
import type { AddToCart, Go, Route } from "./routing";

/* ============================ PRODUCT DETAIL ============================ */
export function Product({
  t, lang, go, addToCart, params,
}: {
  t: Translator; lang: string; go: Go; addToCart: AddToCart; params: Route;
}) {
  useReveal();
  const p = byId[params.id || ""] || byId.p1;
  const store = storeById(p.store);
  const cat = catById(p.cat);
  const variantKeys = Object.keys(p.variants || {});
  const [sel, setSel] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    variantKeys.forEach((k) => (o[k] = p.variants[k][0]));
    return o;
  });
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const lowStock = p.stock <= 6;
  useEffect(() => { window.scrollTo({ top: 0 }); }, [params.id]);

  return (
    <div className="screen">
      <div className="pdp">
        <button className="back reveal" onClick={() => go({ name: "category", cat: p.cat })}><Icon name="chevL" size={16} /> {t("back")}</button>
        <div className="pdp__main">
          {/* Gallery */}
          <div className="pdp__gallery reveal">
            <div className="pdp__hero"><ProductImage product={{ ...p, tone: p.tone + active * 8 }} imgIndex={active} ratio="4 / 5" rounded={20} showLabel={false} /></div>
            <div className="pdp__thumbs">
              {[0, 1, 2, 3].map((i) => (
                <button key={i} className={active === i ? "is-on" : ""} onClick={() => setActive(i)}>
                  <ProductImage product={{ ...p, tone: p.tone + i * 8 }} imgIndex={i} showLabel={false} />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="pdp__info reveal">
            <div className="pdp__crumb">{lang === "rw" ? cat?.rw : cat?.name}{p.tag && <Badge tone="primary" soft>{p.tag}</Badge>}</div>
            <h1 className="pdp__title">{p.title}</h1>
            <div className="pdp__rating">
              <Stars value={p.rating} size={16} showNum count={p.reviews} />
              <span className="pdp__dot">·</span>
              <a className="pdp__seller">{t("sellerInfo")} <strong>{store?.name}</strong>{store?.verified && <Icon name="shield" size={13} />}</a>
            </div>
            <div className="pdp__price">{rwf(p.price)}</div>

            {variantKeys.map((k) => (
              <div className="pdp__variant" key={k}>
                <span className="pdp__vlabel">{k}</span>
                <div className="pdp__opts">
                  {p.variants[k].map((o) => (
                    <button key={o} className={sel[k] === o ? "vopt is-on" : "vopt"} onClick={() => setSel({ ...sel, [k]: o })}>{o}</button>
                  ))}
                </div>
              </div>
            ))}

            <div className="pdp__stock">
              <span className={lowStock ? "stockdot stockdot--low" : "stockdot"}></span>
              {lowStock ? `${t("lowStock")} — ${p.stock} left` : t("inStock")}
              <span className="pdp__deliv"><Icon name="truck" size={15} /> {t("estDelivery")}</span>
            </div>

            <div className="pdp__buy">
              <div className="qty">
                <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease"><Icon name="minus" size={16} /></button>
                <span>{qty}</span>
                <button onClick={() => setQty(qty + 1)} aria-label="Increase"><Icon name="plus" size={16} /></button>
              </div>
              <Button size="lg" icon="cart" onClick={(e) => addToCart(p, e, qty, sel)}>{t("addToCart")}</Button>
              <Button size="lg" variant="dark" onClick={(e) => { addToCart(p, e, qty, sel); go({ name: "cart" }); }}>{t("buyNow")}</Button>
            </div>

            <div className="pdp__assure">
              <div><Icon name="shield" size={16} /> {t("secure")}</div>
              <div><Icon name="phone" size={16} /> MTN MoMo · Airtel · Card</div>
              <div><Icon name="refresh" size={16} /> Easy returns</div>
            </div>
          </div>
        </div>

        {/* Description + reviews */}
        <div className="pdp__detail reveal">
          <div className="pdp__desc">
            <h3>Description</h3>
            <p>{p.desc}</p>
            <div className="pdp__specs">
              <div><span>Condition</span><strong>{p.condition === "new" ? "Brand new" : "Used"}</strong></div>
              <div><span>Category</span><strong>{lang === "rw" ? cat?.rw : cat?.name}</strong></div>
              <div><span>Seller</span><strong>{store?.name}</strong></div>
              <div><span>Ships from</span><strong>{store?.city}</strong></div>
            </div>
          </div>
          <div className="pdp__reviews">
            <h3>{p.reviews} {t("reviews")} <Stars value={p.rating} size={14} showNum /></h3>
            {REVIEWS.map((r, i) => (
              <div className="review" key={i}>
                <div className="review__top">
                  <div className="review__av">{r.name[0]}</div>
                  <div><div className="review__name">{r.name}</div><Stars value={r.rating} size={12} /></div>
                  <span className="review__when">{r.when}</span>
                </div>
                <p>{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* You might also like (ML) */}
      <div className="recwrap">
        <Rail t={t} icon="sparkle" title={t("youMightLike")} sub={t("recSub")}>
          {rankProducts({ n: 8, exclude: p.id, cat: p.cat }).map(({ p: pr, reason }) => (
            <div className="rail__item" key={pr.id}><ProductCardLink product={pr} t={t} reason={reason} go={go} addToCart={addToCart} /></div>
          ))}
        </Rail>
      </div>
      <Footer t={t} />
    </div>
  );
}

/* ============================ CART ============================ */
export function Cart({
  t, go, cart, setQty, removeItem, addToCart,
}: {
  t: Translator; go: Go; cart: CartItem[];
  setQty: (key: string, q: number) => void;
  removeItem: (key: string) => void;
  addToCart: AddToCart;
}) {
  useReveal();
  const subtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
  const delivery = cart.length ? 1000 : 0;
  if (!cart.length) {
    return (
      <div className="screen">
        <div className="cartpage">
          <div className="empty empty--lg reveal">
            <div className="empty__ico"><Icon name="cart" size={36} /></div>
            <h2>{t("emptyCart")}</h2>
            <p>{t("emptyCartSub")}</p>
            <Button size="lg" iconRight="arrow" onClick={() => go({ name: "category" })}>{t("shopNow")}</Button>
          </div>
        </div>
        <div className="recwrap">
          <Rail t={t} icon="sparkle" title={t("recForYou")} sub={t("recSub")}>
            {rankProducts({ n: 8 }).map(({ p, reason }) => (
              <div className="rail__item" key={p.id}><ProductCardLink product={p} t={t} reason={reason} go={go} addToCart={addToCart} /></div>
            ))}
          </Rail>
        </div>
        <Footer t={t} />
      </div>
    );
  }
  return (
    <div className="screen">
      <div className="cartpage">
        <button className="back reveal" onClick={() => go({ name: "category" })}><Icon name="chevL" size={16} /> {t("continueShopping")}</button>
        <h1 className="cartpage__title reveal">{t("yourCart")} <span>{cart.length}</span></h1>
        <div className="cartpage__grid">
          <div className="cartlist">
            {cart.map((it) => {
              const p = byId[it.id];
              return (
                <div className="citem reveal" key={it.key}>
                  <div className="citem__img" onClick={() => go({ name: "product", id: it.id })}><ProductImage product={p} showLabel={false} /></div>
                  <div className="citem__body">
                    <div className="citem__top">
                      <div>
                        <h3 onClick={() => go({ name: "product", id: it.id })}>{p.title}</h3>
                        {it.variant && <div className="citem__var">{Object.entries(it.variant).map(([k, v]) => `${k}: ${v}`).join(" · ")}</div>}
                        <div className="citem__store">{storeById(p.store)?.name}</div>
                      </div>
                      <button className="citem__rm" onClick={() => removeItem(it.key)} aria-label={t("remove")}><Icon name="close" size={16} /></button>
                    </div>
                    <div className="citem__foot">
                      <div className="qty qty--sm">
                        <button onClick={() => setQty(it.key, it.qty - 1)}><Icon name="minus" size={14} /></button>
                        <span>{it.qty}</span>
                        <button onClick={() => setQty(it.key, it.qty + 1)}><Icon name="plus" size={14} /></button>
                      </div>
                      <div className="citem__price">{rwf(it.price * it.qty)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <aside className="summary reveal">
            <h3>{t("orderSummary")}</h3>
            <Row label={t("subtotal")} value={rwf(subtotal)} />
            <Row label={`${t("delivery")} · Kigali`} value={rwf(delivery)} />
            <div className="summary__div"></div>
            <Row label={t("total")} value={rwf(subtotal + delivery)} big />
            <Button size="lg" full iconRight="arrow" onClick={() => go({ name: "checkout" })}>{t("proceedCheckout")}</Button>
            <div className="summary__secure"><Icon name="lock" size={13} /> {t("secure")}</div>
          </aside>
        </div>
      </div>
      <div className="recwrap">
        <Rail t={t} icon="sparkle" title={t("alsoBought")} sub={t("recSub")}>
          {rankProducts({ n: 8, exclude: cart[0].id, reasons: ["collaborative", "popularity"] }).map(({ p, reason }) => (
            <div className="rail__item" key={p.id}><ProductCardLink product={p} t={t} reason={reason} go={go} addToCart={addToCart} /></div>
          ))}
        </Rail>
      </div>
      <Footer t={t} />
    </div>
  );
}

export function Row({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return <div className={`srow ${big ? "srow--big" : ""}`}><span>{label}</span><strong>{value}</strong></div>;
}

/* ============================ CHECKOUT ============================ */
export function Checkout({
  t, go, cart, placeOrder,
}: {
  t: Translator; go: Go; cart: CartItem[]; placeOrder: (pay: string) => void;
}) {
  useReveal();
  const [pay, setPay] = useState("momo");
  const [phase, setPhase] = useState<"form" | "processing">("form");
  const subtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
  const delivery = 1000;
  const provinces = ["Kigali City", "Northern", "Southern", "Eastern", "Western"];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setPhase("processing");
    setTimeout(() => placeOrder(pay), 2300);
  }

  useEffect(() => {
    if (!cart.length) go({ name: "category" });
  }, [cart.length, go]);
  if (!cart.length) return null;

  return (
    <div className="screen">
      <div className="checkout">
        <button className="back reveal" onClick={() => go({ name: "cart" })}><Icon name="chevL" size={16} /> {t("cart")}</button>
        <h1 className="checkout__title reveal">{t("checkout")}</h1>
        <form className="checkout__grid" onSubmit={submit}>
          <div className="checkout__left">
            {/* Address */}
            <section className="fcard reveal">
              <h3><span className="fcard__n">1</span> {t("deliveryAddress")}</h3>
              <div className="fgrid">
                <Field label={t("fullName")} ph="Amina Uwase" full />
                <Field label={t("phone")} ph="+250 7•• ••• •••" />
                <Field label={t("street")} ph="KG 11 Ave, near Kimironko market" full />
              </div>
            </section>
            {/* Zone */}
            <section className="fcard reveal">
              <h3><span className="fcard__n">2</span> {t("deliveryZone")}</h3>
              <div className="fgrid">
                <Field label={t("province")} select options={provinces} />
                <Field label={t("district")} select options={["Gasabo", "Kicukiro", "Nyarugenge"]} />
                <Field label={t("sector")} select options={["Kimironko", "Remera", "Kacyiru", "Gisozi"]} />
              </div>
            </section>
            {/* Payment */}
            <section className="fcard reveal">
              <h3><span className="fcard__n">3</span> {t("paymentMethod")}</h3>
              <div className="paylist">
                <PayOption id="momo" sel={pay} setSel={setPay} name="MTN Mobile Money" desc="USSD push to your phone" tone="#ffcc00" ink="#1a1a1a" mark="MoMo" />
                <PayOption id="airtel" sel={pay} setSel={setPay} name="Airtel Money" desc="Confirm with your PIN" tone="#e4002b" ink="#fff" mark="Airtel" />
                <PayOption id="card" sel={pay} setSel={setPay} name="Card / Bank (Flutterwave)" desc="Visa, Mastercard, bank transfer" tone="#1a1f71" ink="#fff" mark="Card" />
              </div>
              {(pay === "momo" || pay === "airtel") && (
                <div className="paynote reveal"><Icon name="phone" size={15} /> {t("momoPrompt")}</div>
              )}
            </section>
          </div>

          <aside className="summary summary--co reveal">
            <h3>{t("orderSummary")}</h3>
            <div className="summary__items">
              {cart.map((it) => {
                const p = byId[it.id];
                return (
                  <div className="sumitem" key={it.key}>
                    <div className="sumitem__img"><ProductImage product={p} showLabel={false} /><span className="sumitem__q">{it.qty}</span></div>
                    <span className="sumitem__name">{p.title}</span>
                    <span className="sumitem__p">{rwf(it.price * it.qty)}</span>
                  </div>
                );
              })}
            </div>
            <div className="summary__div"></div>
            <Row label={t("subtotal")} value={rwf(subtotal)} />
            <Row label={t("delivery")} value={rwf(delivery)} />
            <div className="summary__div"></div>
            <Row label={t("total")} value={rwf(subtotal + delivery)} big />
            <Button size="lg" full type="submit" icon={phase === "processing" ? undefined : "lock"} disabled={phase === "processing"}>
              {phase === "processing" ? <span className="spin"></span> : t("placeOrder")}
            </Button>
            <div className="summary__secure"><Icon name="shield" size={13} /> {t("secure")} · TLS encrypted</div>
          </aside>
        </form>
      </div>
    </div>
  );
}

export function Field({
  label, ph, full, select, options,
}: {
  label: string; ph?: string; full?: boolean; select?: boolean; options?: string[];
}) {
  return (
    <label className={`field ${full ? "field--full" : ""}`}>
      <span>{label}</span>
      {select ? (
        <div className="field__sel">
          <select defaultValue="">
            <option value="" disabled>Select…</option>
            {options?.map((o) => <option key={o}>{o}</option>)}
          </select>
          <Icon name="chevD" size={16} />
        </div>
      ) : <input placeholder={ph} />}
    </label>
  );
}

function PayOption({
  id, sel, setSel, name, desc, tone, ink, mark,
}: {
  id: string; sel: string; setSel: (id: string) => void;
  name: string; desc: string; tone: string; ink: string; mark: string;
}) {
  return (
    <button type="button" className={`payopt ${sel === id ? "is-on" : ""}`} onClick={() => setSel(id)}>
      <span className="payopt__mark" style={{ background: tone, color: ink }}>{mark}</span>
      <span className="payopt__txt"><strong>{name}</strong><small>{desc}</small></span>
      <span className="payopt__radio"><span></span></span>
    </button>
  );
}

/* ============================ CONFIRMATION ============================ */
export function Confirmation({
  t, go, addToCart, order,
}: {
  t: Translator; go: Go; addToCart: AddToCart; order: Order;
}) {
  useReveal();
  useEffect(() => { window.scrollTo({ top: 0 }); }, []);
  return (
    <div className="screen">
      <div className="confirm">
        <div className="confirm__card reveal">
          <div className="confirm__check"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" /><path d="M14 27l8 8 16-17" /></svg></div>
          <h1>{t("orderPlaced")}</h1>
          <p>{t("orderThanks")}</p>
          <div className="confirm__id"><span>{t("orderId")}</span><strong>{order.id}</strong></div>
          <div className="confirm__meta">
            <div><Icon name="wallet" size={16} /> {order.method}</div>
            <div><Icon name="truck" size={16} /> {t("estDelivery")}</div>
          </div>
          <div className="confirm__cta">
            <Button variant="dark" icon="truck" onClick={() => go({ name: "home" })}>{t("trackOrder")}</Button>
            <Button variant="ghost" onClick={() => go({ name: "category" })}>{t("keepShopping")}</Button>
          </div>
        </div>
      </div>
      <div className="recwrap">
        <Rail t={t} icon="sparkle" title={t("completeCollection")} sub={t("recSub")}>
          {rankProducts({ n: 8, reasons: ["collaborative", "content", "popularity"] }).map(({ p, reason }) => (
            <div className="rail__item" key={p.id}><ProductCardLink product={p} t={t} reason={reason} go={go} addToCart={addToCart} /></div>
          ))}
        </Rail>
      </div>
      <Footer t={t} />
    </div>
  );
}

/* ============================ FOOTER ============================ */
export function Footer({ t }: { t: Translator }) {
  return (
    <footer className="ftr">
      <div className="ftr__inner">
        <div className="ftr__brand">
          <a className="hdr__logo"><span className="hdr__mark">i</span><span className="hdr__word">isoko</span></a>
          <p>East Africa&apos;s marketplace for everything you love. Made in Kigali.</p>
          <div className="ftr__pay">
            <PayChip label="MTN MoMo" tone="#ffcc00" ink="#1a1a1a" />
            <PayChip label="Airtel Money" tone="#e4002b" ink="#fff" />
            <PayChip label="Card" tone="#1a1f71" ink="#fff" />
          </div>
        </div>
        <FtrCol title={t("categories")} links={CATEGORIES.map((c) => c.name)} />
        <FtrCol title="Company" links={["About Isoko", "Sell on Isoko", "Delivery zones", "Careers"]} />
        <FtrCol title="Support" links={["Help center", "Track order", "Returns", "Contact"]} />
      </div>
      <div className="ftr__bottom">
        <span>© 2026 Isoko Marketplace · Kigali, Rwanda</span>
        <span className="ftr__lang"><Icon name="globe" size={14} /> English · Kinyarwanda · RWF</span>
      </div>
    </footer>
  );
}
function FtrCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div className="ftr__col">
      <h4>{title}</h4>
      <ul>{links.map((l) => <li key={l}><a>{l}</a></li>)}</ul>
    </div>
  );
}

/* PayChip lives here too so footer + hero share it. */
export function PayChip({ label, tone, ink }: { label: string; tone: string; ink: string }) {
  return <span className="paychip" style={{ background: tone, color: ink }}>{label}</span>;
}

/* Small wrapper so rec rails open the PDP + add to cart consistently. */
function ProductCardLink({
  product, t, reason, go, addToCart,
}: {
  product: ProductT; t: Translator; reason?: RecReasonKind; go: Go; addToCart: AddToCart;
}) {
  return (
    <ProductCard
      product={product}
      t={t}
      reason={reason}
      onOpen={(pr) => go({ name: "product", id: pr.id })}
      onAdd={(pr, e) => addToCart(pr, e)}
    />
  );
}
