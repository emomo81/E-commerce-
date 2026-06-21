/* Isoko — recommendation logic.
 *
 * The PRD (v2.0) describes a hybrid ALS + content model served on SageMaker.
 * This implementation is a faithful local stand-in: it ranks the mock catalog
 * with the same blend the prototype used (category affinity → rating), tags each
 * result with a reason, and exposes a popularity-based fallback. The Node API
 * route in app/api/recommendations consumes getRecommendations(); the storefront
 * rails consume rankProducts() so they render server-side with no layout shift. */
import { PRODUCTS, byId } from "./data";
import type { Product, Recommendation, RecReasonKind } from "./types";

export interface RecOptions {
  /** product id to leave out of results (e.g. the current PDP product) */
  exclude?: string | null;
  /** bias results toward this category */
  cat?: string | null;
  /** number of results */
  n?: number;
  /** cycle of reason tags applied to results */
  reasons?: RecReasonKind[];
}

const DEFAULT_REASONS: RecReasonKind[] = ["collaborative", "content", "popularity"];

/** Rank catalog products for a recommendation strip. Mirrors the prototype recs(). */
export function rankProducts(opts: RecOptions = {}): { p: Product; reason: RecReasonKind }[] {
  let pool = PRODUCTS.slice();
  if (opts.exclude) pool = pool.filter((p) => p.id !== opts.exclude);
  if (opts.cat) {
    const cat = opts.cat;
    pool.sort((a, b) => Number(b.cat === cat) - Number(a.cat === cat) || b.rating - a.rating);
  } else {
    pool.sort((a, b) => b.rating - a.rating);
  }
  const reasons = opts.reasons || DEFAULT_REASONS;
  return pool.slice(0, opts.n || 8).map((p, i) => ({ p, reason: reasons[i % reasons.length] }));
}

/** Popularity fallback — top-rated, most-reviewed products (PRD ML-08 / ML-24). */
export function popularityFallback(n = 10, exclude?: string | null): Recommendation[] {
  return PRODUCTS.slice()
    .filter((p) => !exclude || p.id !== exclude)
    .sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
    .slice(0, n)
    .map((p) => ({ product_id: p.id, score: round(p.rating / 5), reason: "popularity" as const }));
}

/** Recommendation API result following the PRD Appendix D contract. */
export function getRecommendations(opts: RecOptions = {}): Recommendation[] {
  const ranked = rankProducts({ ...opts, n: opts.n || 10 });
  if (!ranked.length) return popularityFallback(opts.n || 10, opts.exclude);
  // Derive a 0..1 score from rating, lightly decaying by rank position.
  return ranked.map(({ p, reason }, i) => ({
    product_id: p.id,
    score: round((p.rating / 5) * (1 - i * 0.03)),
    reason,
  }));
}

/** Resolve recommendation ids back to products (skips unknown ids). */
export function hydrate(recs: Recommendation[]): { p: Product; reason: RecReasonKind }[] {
  return recs
    .map((r) => ({ p: byId[r.product_id], reason: r.reason }))
    .filter((x): x is { p: Product; reason: RecReasonKind } => Boolean(x.p));
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
