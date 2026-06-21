"use client";
/* Isoko — Seller dashboard + Admin panel (with ML engine analytics). Ported from dashboards.jsx. */
import React, { useState } from "react";
import { Badge, Button, Icon, ProductImage, useReveal } from "./ui";
import {
  ADMIN_APPROVALS, ADMIN_KPI, catById, ML, PRODUCTS, rwf, SELLER_ORDERS, SELLER_SALES,
} from "@/lib/data";
import type { AdminApproval, Lang, SellerOrder, Translator } from "@/lib/types";

/* ---- tiny charts (data viz; simple lines/bars) ---- */
export function BarChart({ data, color = "var(--primary)", h = 120 }: { data: number[]; color?: string; h?: number }) {
  const max = Math.max(...data);
  return (
    <div className="bars" style={{ height: h }}>
      {data.map((v, i) => (
        <div className="bars__col" key={i}>
          <div className="bars__bar" style={{ height: (v / max) * 100 + "%", background: color, animationDelay: i * 40 + "ms" }}></div>
        </div>
      ))}
    </div>
  );
}
export function LineChart({ data, color = "var(--primary)", h = 140, fill = true }: { data: number[]; color?: string; h?: number; fill?: boolean }) {
  const max = Math.max(...data) * 1.1, min = Math.min(...data) * 0.9;
  const w = 100, n = data.length;
  const pts = data.map((v, i) => [(i / (n - 1)) * w, h - ((v - min) / (max - min)) * h]);
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = d + ` L${w} ${h} L0 ${h} Z`;
  return (
    <svg className="line" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height: h }}>
      {fill && <path d={area} fill={color} opacity="0.1" />}
      <path className="line__path" d={d} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => i === pts.length - 1 && <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={color} vectorEffect="non-scaling-stroke" />)}
    </svg>
  );
}
export function Donut({ value, label, color = "var(--primary)", size = 92 }: { value: number; label: string; color?: string; size?: number }) {
  const r = 40, c = 2 * Math.PI * r;
  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--line)" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} transform="rotate(-90 50 50)" className="donut__arc" />
      </svg>
      <div className="donut__c"><strong>{Math.round(value)}%</strong><span>{label}</span></div>
    </div>
  );
}

const STATUS_TONE: Record<string, string> = { Pending: "amber", Confirmed: "blue", Packed: "purple", Shipped: "teal", Delivered: "green", Cancelled: "red", Refunded: "neutral" };

/* ============================ SELLER ============================ */
export function Seller({ t, exit }: { t: Translator; lang: Lang; exit: () => void }) {
  const [tab, setTab] = useState("overview");
  const [orders, setOrders] = useState<SellerOrder[]>(SELLER_ORDERS);
  useReveal();
  const flow = ["Pending", "Confirmed", "Packed", "Shipped", "Delivered"];
  function advance(id: string) {
    setOrders((o) => o.map((x) => {
      if (x.id !== id) return x;
      const i = flow.indexOf(x.status);
      return { ...x, status: flow[Math.min(i + 1, flow.length - 1)] };
    }));
  }
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.status === "Pending").length;

  return (
    <div className="dash">
      <DashSidebar role="seller" t={t} tab={tab} setTab={setTab} exit={exit}
        items={[["overview", "grid", t("overview")], ["orders", "box", t("orders")], ["products", "tag", t("products")], ["earnings", "wallet", t("earnings")]]} />
      <main className="dash__main">
        <DashTop title="Kimironko Threads" sub={t("dashboard")} t={t} cta={[t("addProduct"), "plus"]} />
        {tab === "overview" && (
          <div className="dash__body">
            <div className="kpis">
              <Kpi icon="box" label={t("orders")} value={orders.length} delta="+12%" tone="primary" />
              <Kpi icon="wallet" label={t("revenue")} value={rwf(revenue)} delta="+8%" tone="teal" sub={t("thisWeek")} />
              <Kpi icon="bell" label={t("pending")} value={pending} tone="amber" badge={`${pending} ${t("newOrder")}`} />
              <Kpi icon="star" label="Store rating" value="4.8" delta="+0.1" tone="green" />
            </div>
            <div className="dash__cols">
              <Panel title={`${t("orders")} · 14 days`} className="reveal">
                <BarChart data={SELLER_SALES} />
                <div className="panel__foot"><span>Avg 72 / day</span><Badge tone="green" soft>+18% {t("thisWeek")}</Badge></div>
              </Panel>
              <Panel title={t("earnings")} className="reveal">
                <div className="wallet">
                  <div className="wallet__row"><span>{t("available")}</span><strong>{rwf(revenue * 0.62)}</strong></div>
                  <div className="wallet__row"><span>{t("pending")}</span><strong>{rwf(revenue * 0.38)}</strong></div>
                  <div className="wallet__bar"><span style={{ width: "62%" }}></span></div>
                  <Button full icon="wallet">{t("requestPayout")}</Button>
                  <small className="wallet__note">Payout to MTN MoMo · +250 78• ••• •••</small>
                </div>
              </Panel>
            </div>
            <Panel title={t("recentOrders")} className="reveal">
              <OrdersTable orders={orders.slice(0, 4)} advance={advance} t={t} />
            </Panel>
          </div>
        )}
        {tab === "orders" && (
          <div className="dash__body"><Panel title={t("orders")} className="reveal"><OrdersTable orders={orders} advance={advance} t={t} /></Panel></div>
        )}
        {tab === "products" && (
          <div className="dash__body"><Panel title={t("products")} className="reveal"><ProductsTable t={t} /></Panel></div>
        )}
        {tab === "earnings" && (
          <div className="dash__body">
            <div className="kpis">
              <Kpi icon="wallet" label={t("revenue")} value={rwf(revenue)} tone="primary" />
              <Kpi icon="check" label={t("available")} value={rwf(revenue * 0.62)} tone="green" />
              <Kpi icon="refresh" label={t("pending")} value={rwf(revenue * 0.38)} tone="amber" />
            </div>
            <Panel title={t("earnings")} className="reveal">
              <div className="wallet wallet--wide">
                <Button icon="wallet">{t("requestPayout")}</Button>
                <small className="wallet__note">Payouts processed within 24h to MoMo / Airtel / bank.</small>
              </div>
            </Panel>
          </div>
        )}
      </main>
    </div>
  );
}

function OrdersTable({ orders, advance, t }: { orders: SellerOrder[]; advance: (id: string) => void; t: Translator }) {
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr><th>Order</th><th>Buyer</th><th>Items</th><th>Total</th><th>Method</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td className="mono">{o.id}</td>
              <td>{o.buyer}<div className="tbl__sub">{o.when}</div></td>
              <td>{o.items}</td>
              <td className="tbl__num">{rwf(o.total)}</td>
              <td><span className="tbl__method">{o.method}</span></td>
              <td><Badge tone={STATUS_TONE[o.status]} soft>{o.status}</Badge></td>
              <td>{!["Delivered", "Cancelled", "Refunded"].includes(o.status) &&
                <button className="tbl__act" onClick={() => advance(o.id)}>{t("updateStatus")} <Icon name="chevR" size={13} /></button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function ProductsTable({ t }: { t: Translator }) {
  const mine = PRODUCTS.filter((p) => p.store === "s1" || p.store === "s5");
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {mine.map((p) => (
            <tr key={p.id}>
              <td><div className="tbl__prod"><div className="tbl__thumb"><ProductImage product={p} showLabel={false} /></div><div>{p.title}<div className="tbl__sub">{catById(p.cat)?.name}</div></div></div></td>
              <td className="tbl__num">{rwf(p.price)}</td>
              <td>{p.stock}</td>
              <td><Badge tone={p.stock > 6 ? "green" : "amber"} soft>{p.stock > 6 ? "Active" : "Low stock"}</Badge></td>
              <td><button className="tbl__act">Edit <Icon name="chevR" size={13} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============================ ADMIN ============================ */
export function Admin({ t, exit }: { t: Translator; lang: Lang; exit: () => void }) {
  const K = ADMIN_KPI, M = ML;
  const [tab, setTab] = useState("overview");
  const [approvals, setApprovals] = useState<AdminApproval[]>(ADMIN_APPROVALS);
  const [training, setTraining] = useState(false);
  useReveal();
  function resolve(id: string) { setApprovals((a) => a.filter((x) => x.id !== id)); }
  function retrain() { setTraining(true); setTimeout(() => setTraining(false), 2600); }

  return (
    <div className="dash">
      <DashSidebar role="admin" t={t} tab={tab} setTab={setTab} exit={exit}
        items={[["overview", "grid", t("overview")], ["ml", "sparkle", t("mlEngine")], ["sellers", "user", t("activeSellers")], ["orders", "box", t("orders")]]} />
      <main className="dash__main">
        <DashTop title="Isoko Admin" sub="Platform control" t={t} cta={null} />
        {(tab === "overview" || tab === "sellers" || tab === "orders") && (
          <div className="dash__body">
            <div className="kpis">
              <Kpi icon="trend" label={t("platformGmv")} value={rwf(K.gmv)} delta="+14%" tone="primary" sub={t("thisWeek")} />
              <Kpi icon="box" label={t("orders")} value={K.orders} delta="+9%" tone="teal" />
              <Kpi icon="user" label={t("activeBuyers")} value={K.buyers.toLocaleString()} delta="+22%" tone="blue" />
              <Kpi icon="tag" label={t("activeSellers")} value={K.sellers} delta="+6%" tone="amber" />
            </div>
            <div className="dash__cols">
              <Panel title={`${t("platformGmv")} · 14 days`} grow className="reveal">
                <LineChart data={K.gmvSeries} />
                <div className="panel__foot"><span>RWF millions</span><Badge tone="green" soft>+14% {t("thisWeek")}</Badge></div>
              </Panel>
              <Panel title={t("pendingApprovals")} className="reveal">
                <div className="approvals">
                  {approvals.length === 0 && <div className="approvals__empty"><Icon name="check" size={20} /> All caught up</div>}
                  {approvals.map((a) => (
                    <div className="approval" key={a.id}>
                      <div className="approval__logo">{a.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</div>
                      <div className="approval__info"><strong>{a.name}</strong><span><Icon name="pin" size={11} /> {a.city} · {a.when}</span></div>
                      <div className="approval__act">
                        <button className="mini mini--ok" onClick={() => resolve(a.id)}><Icon name="check" size={15} /></button>
                        <button className="mini mini--no" onClick={() => resolve(a.id)}><Icon name="close" size={15} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
            {/* ML summary teaser on overview */}
            <Panel title={t("mlEngine")} action={["View details", () => setTab("ml")]} className="reveal">
              <div className="mlmini">
                <MlStat label={t("clickRate")} value={M.ctr + "%"} target={`${t("target")} ${M.ctrTarget}%`} ok />
                <MlStat label={t("convLift")} value={"+" + M.lift + "%"} target={`${t("target")} ${M.liftTarget}%`} ok />
                <MlStat label={t("cacheHit")} value={M.cacheHit + "%"} target={`${t("target")} 70%`} ok />
                <MlStat label={t("latency")} value={M.p95 + "ms"} target="≤ 300ms" ok />
              </div>
            </Panel>
          </div>
        )}

        {tab === "ml" && (
          <div className="dash__body">
            <div className="mlhead reveal">
              <div>
                <h2>{t("mlEngine")}</h2>
                <p>Hybrid model · ALS + content-based · served on SageMaker Serverless</p>
              </div>
              <div className="mlhead__train">
                <div className="mlhead__status"><span className="dot dot--green"></span> {t("lastTrained")}: {M.lastTrain} · <span className="mono">{M.modelVersion}</span></div>
                <Button icon="refresh" onClick={retrain} disabled={training}>{training ? <span className="spin spin--dark"></span> : t("retrain")}</Button>
              </div>
            </div>
            {training && <div className="trainbar reveal"><span></span> Exporting events → training ALS → evaluating → promoting…</div>}
            <div className="kpis">
              <Kpi icon="bolt" label={t("clickRate")} value={M.ctr + "%"} delta={`${t("target")} ${M.ctrTarget}%`} tone="primary" />
              <Kpi icon="cart" label="Add-to-cart from recs" value={M.addToCart + "%"} delta={`${t("target")} ${M.atcTarget}%`} tone="teal" />
              <Kpi icon="trend" label={t("convLift")} value={"+" + M.lift + "%"} delta={`${t("target")} ${M.liftTarget}%`} tone="green" />
              <Kpi icon="wallet" label="AOV lift" value={"+" + M.aovLift + "%"} delta={`${t("target")} 5%`} tone="amber" />
            </div>
            <div className="dash__cols">
              <Panel title={`${t("clickRate")} · 10 weeks`} grow className="reveal">
                <LineChart data={M.ctrSeries} color="var(--primary)" />
                <div className="panel__foot"><span>Weekly CTR %</span><Badge tone="green" soft>Above {M.ctrTarget}% target</Badge></div>
              </Panel>
              <Panel title={t("abTest")} className="reveal">
                <div className="ab">
                  <div className="ab__row"><span>{t("control")} (20%)</span><div className="ab__track"><div className="ab__fill ab__fill--ctrl" style={{ width: (M.abControl / M.abTreatment) * 100 + "%" }}></div></div><strong>{M.abControl}%</strong></div>
                  <div className="ab__row"><span>{t("treatment")} (80%)</span><div className="ab__track"><div className="ab__fill" style={{ width: "100%" }}></div></div><strong>{M.abTreatment}%</strong></div>
                  <div className="ab__lift"><Icon name="trend" size={15} /> {((M.abTreatment / M.abControl - 1) * 100).toFixed(0)}% higher CTR with ML</div>
                </div>
              </Panel>
            </div>
            <div className="dash__cols dash__cols--3">
              <Panel title={t("precisionK")} className="reveal"><div className="centerstat"><Donut value={M.precision * 100} label="≥ 15%" color="var(--teal)" /><p>Offline relevance of top-10</p></div></Panel>
              <Panel title={t("coverage")} className="reveal"><div className="centerstat"><Donut value={M.coverage} label="≥ 40%" color="var(--blue)" /><p>Catalog appearing in recs</p></div></Panel>
              <Panel title={t("cacheHit")} className="reveal"><div className="centerstat"><Donut value={M.cacheHit} label="≥ 70%" color="var(--amber)" /><p>Served from Redis cache</p></div></Panel>
            </div>
            <Panel title="Serving health (SageMaker Serverless)" className="reveal">
              <div className="health">
                <HealthRow label="p95 latency" value={M.p95 + " ms"} ok note="≤ 300ms target" />
                <HealthRow label="Cached responses" value="38 ms" ok note="≤ 50ms" />
                <HealthRow label="Fallback (popularity)" value="Active" ok note="100% uptime guaranteed" />
                <HealthRow label="Nightly pipeline" value="Passed · 02:00 EAT" ok note="GitHub Actions" />
              </div>
            </Panel>
          </div>
        )}
      </main>
    </div>
  );
}

function MlStat({ label, value, target, ok }: { label: string; value: string; target: string; ok?: boolean }) {
  return <div className="mlstat"><span className="mlstat__l">{label}</span><strong>{value}</strong><span className={`mlstat__t ${ok ? "is-ok" : ""}`}><Icon name="check" size={11} /> {target}</span></div>;
}
function HealthRow({ label, value, ok, note }: { label: string; value: string; ok?: boolean; note: string }) {
  return <div className="hrow"><span className={`dot ${ok ? "dot--green" : "dot--amber"}`}></span><span className="hrow__l">{label}</span><strong>{value}</strong><span className="hrow__n">{note}</span></div>;
}

/* ---- shared dashboard chrome ---- */
function DashSidebar({
  role, t, tab, setTab, items, exit,
}: {
  role: "seller" | "admin"; t: Translator; tab: string; setTab: (id: string) => void;
  items: [string, string, string][]; exit: () => void;
}) {
  return (
    <aside className="dside">
      <div className="dside__top">
        <a className="hdr__logo"><span className="hdr__mark">i</span><span className="hdr__word">isoko</span></a>
        <span className="dside__role">{role === "seller" ? t("seller") : t("admin")}</span>
      </div>
      <nav className="dside__nav">
        {items.map(([id, icon, label]) => (
          <button key={id} className={tab === id ? "is-on" : ""} onClick={() => setTab(id)}><Icon name={icon} size={18} /> <span>{label}</span></button>
        ))}
      </nav>
      <button className="dside__exit" onClick={exit}><Icon name="chevL" size={16} /> {t("shop")}</button>
    </aside>
  );
}
function DashTop({ title, sub, cta, t }: { title: string; sub: string; cta: [string, string] | null; t: Translator }) {
  return (
    <header className="dtop">
      <div><div className="dtop__sub">{sub}</div><h1>{title}</h1></div>
      <div className="dtop__r">
        <button className="dtop__bell"><Icon name="bell" size={18} /><span></span></button>
        {cta && <Button icon={cta[1]}>{cta[0]}</Button>}
        <div className="dtop__av">A</div>
      </div>
    </header>
  );
}
function Kpi({
  icon, label, value, delta, sub, tone = "primary", badge,
}: {
  icon: string; label: string; value: React.ReactNode; delta?: string; sub?: string; tone?: string; badge?: string;
}) {
  return (
    <div className={`kpi kpi--${tone} reveal`}>
      <div className="kpi__top"><span className="kpi__ico"><Icon name={icon} size={18} /></span>{badge && <span className="kpi__badge">{badge}</span>}</div>
      <div className="kpi__val">{value}</div>
      <div className="kpi__lbl">{label}{sub && <span className="kpi__sub"> · {sub}</span>}</div>
      {delta && <div className="kpi__delta">{delta}</div>}
    </div>
  );
}
function Panel({
  title, action, children, className = "", grow,
}: {
  title: string; action?: [string, () => void]; children: React.ReactNode; className?: string; grow?: boolean;
}) {
  return (
    <section className={`panel ${grow ? "panel--grow" : ""} ${className}`}>
      <div className="panel__head"><h3>{title}</h3>{action && <button className="panel__action" onClick={action[1]}>{action[0]} <Icon name="chevR" size={14} /></button>}</div>
      {children}
    </section>
  );
}
