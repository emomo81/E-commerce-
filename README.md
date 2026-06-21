# Isoko — East Africa Marketplace

A faithful implementation of the **Isoko** design handoff (`Isoko/index.html`) as a
**Next.js 16 (App Router) + TypeScript** app with **Node.js** API routes.

Isoko is a Rwanda/East-Africa marketplace with three apps in one, switchable from the
floating **"Demo view"** switcher (bottom-right):

- **Shop** — buyer storefront: Home (hero, categories, featured, ML "Recommended for you"
  rail, new arrivals, top sellers) → Category/Search → Product detail → Cart → Checkout
  (MTN MoMo / Airtel Money / Card) → Order confirmation. Bilingual **EN / Kinyarwanda**,
  prices in **RWF**.
- **Seller** — dashboard: KPIs, orders with status flow, earnings/payout, products, sales charts.
- **Admin** — platform KPIs, seller approvals, and the **ML recommendation engine** analytics
  view (CTR, A/B test, Precision@10 / Coverage / Cache-hit, SageMaker serving health).

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # production build
npm start        # serve the production build
```

Requires Node.js 20+ (developed on Node 24).

## Project structure

```
app/
  layout.tsx                  Root layout, next/font (Hanken Grotesk + JetBrains Mono)
  globals.css                 Design system + all component styles (ported verbatim)
  page.tsx                    Renders the client <App/>
  api/
    products/route.ts         Node route: catalog list / search / by-id
    recommendations/route.ts  Node route: recommendation engine (PRD Appendix D contract)
components/
  App.tsx                     Root: routing, cart, language, role switching, transitions
  ui.tsx                      Primitives: Icon, ProductImage, Stars, Button, Badge, ProductCard, Rail…
  storefront.tsx              Header, Home, Category
  storefront2.tsx             Product, Cart, Checkout, Confirmation, Footer
  dashboards.tsx              Seller + Admin (with ML analytics) and charts
  routing.ts                  Shared client route/types
lib/
  data.ts                     Mock catalog, stores, categories, seller/admin/ML data, RWF formatter
  i18n.ts                     English + Kinyarwanda strings
  recommendations.ts          Hybrid-style ranking + popularity fallback (shared by UI and API)
  types.ts                    Domain types
```

## About the data & ML

All data is mocked in `lib/data.ts` — no external database or accounts are needed to run.

The recommendation logic in `lib/recommendations.ts` is a local stand-in for the PRD's
hybrid ALS + content model served on AWS SageMaker. It powers the four recommendation
strips client-side (so they render with no layout shift) and is also exposed through the
Node route at **`/api/recommendations`**, which follows the PRD request/response contract
and degrades gracefully to a popularity-based fallback.

```bash
# Examples
curl "http://localhost:3000/api/products?cat=fashion"
curl "http://localhost:3000/api/recommendations?context=homepage&limit=10"
curl -X POST http://localhost:3000/api/recommendations \
  -H 'content-type: application/json' \
  -d '{"context":"pdp","product_id":"p6","limit":5}'
```

The original design handoff lives in the (git-ignored) `_extracted/` folder for reference.
