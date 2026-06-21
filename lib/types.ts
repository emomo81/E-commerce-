/* Isoko — shared domain types. */

export type Lang = "en" | "rw";
export type Role = "shop" | "seller" | "admin";

export interface Category {
  id: string;
  name: string;
  rw: string;
  tint: string;
  glyph: string;
}

export interface Store {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  city: string;
  verified: boolean;
  joined: string;
}

export interface Product {
  id: string;
  title: string;
  cat: string;
  store: string;
  price: number;
  tone: number;
  rating: number;
  reviews: number;
  condition: string;
  stock: number;
  tag?: string;
  desc: string;
  variants: Record<string, string[]>;
}

export interface Review {
  name: string;
  rating: number;
  when: string;
  text: string;
}

export interface SellerOrder {
  id: string;
  buyer: string;
  items: number;
  total: number;
  status: string;
  when: string;
  method: string;
}

export interface AdminKpi {
  gmv: number;
  orders: number;
  buyers: number;
  sellers: number;
  gmvSeries: number[];
}

export interface AdminApproval {
  id: string;
  name: string;
  city: string;
  when: string;
}

export interface MlMetrics {
  ctr: number;
  ctrTarget: number;
  addToCart: number;
  atcTarget: number;
  lift: number;
  liftTarget: number;
  aovLift: number;
  precision: number;
  coverage: number;
  p95: number;
  cacheHit: number;
  ctrSeries: number[];
  abControl: number;
  abTreatment: number;
  lastTrain: string;
  trainStatus: string;
  modelVersion: string;
}

/* Cart line item (built in the App shell). */
export interface CartItem {
  key: string;
  id: string;
  qty: number;
  price: number;
  variant: Record<string, string> | null;
}

/* Placed order summary. */
export interface Order {
  id: string;
  method: string;
}

export type RecReasonKind = "collaborative" | "content" | "popularity";

/* Recommendation API contract (PRD Appendix D). */
export interface Recommendation {
  product_id: string;
  score: number;
  reason: RecReasonKind;
}

export type Translator = (key: string) => string;
