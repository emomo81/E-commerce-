/* Isoko — recommendation API (Node runtime).
 *
 * Mirrors the PRD v2.0 contract (Appendix D). When RECS_URL is set, this route
 * calls the Azure recommender (Container Apps / Azure ML) and, on any error or
 * timeout (> 3s, PRD ML-24), silently falls back to the local engine. When
 * RECS_URL is unset it just serves the local hybrid stand-in — so the four
 * recommendation strips always render, with or without a deployed model.
 *
 * Env:
 *   RECS_URL  — e.g. https://<app>.azurecontainerapps.io/recommend
 *   RECS_KEY  — optional Bearer key (needed for Azure ML Managed Endpoint)
 *
 * POST /api/recommendations
 *   body: { user_id?, session_id?, context, product_id?, limit? }
 *   ctx:  "homepage" | "pdp" | "cart" | "post_purchase"
 * GET  /api/recommendations?context=homepage&limit=10  (convenience) */
import { NextResponse } from "next/server";
import { getRecommendations, popularityFallback } from "@/lib/recommendations";
import { byId } from "@/lib/data";
import type { RecReasonKind } from "@/lib/types";

export const runtime = "nodejs";

type Context = "homepage" | "pdp" | "cart" | "post_purchase";

interface RecRequest {
  user_id?: string | null;
  session_id?: string | null;
  context?: Context;
  product_id?: string | null;
  limit?: number;
}

function buildResponse(body: RecRequest) {
  const limit = clampLimit(body.limit);
  const context = body.context || "homepage";

  // Per-context blend, matching how the storefront strips request recs.
  let reasons: RecReasonKind[] | undefined;
  let cat: string | null = null;
  if (context === "cart") reasons = ["collaborative", "popularity"];
  if (context === "post_purchase") reasons = ["collaborative", "content", "popularity"];
  // PDP: bias toward similar products in the same category.
  if (context === "pdp" && body.product_id) cat = byId[body.product_id]?.cat ?? null;

  try {
    const recommendations = getRecommendations({
      exclude: body.product_id || null,
      cat,
      n: limit,
      reasons,
    });
    return {
      recommendations,
      model_version: "v1.4-local",
      served_from: "model",
    };
  } catch {
    // Graceful degradation (PRD ML-24): fall back to popularity.
    return {
      recommendations: popularityFallback(limit, body.product_id || null),
      model_version: "fallback",
      served_from: "fallback",
    };
  }
}

function clampLimit(n: unknown): number {
  const v = typeof n === "number" ? n : 10;
  return Math.max(1, Math.min(10, Math.floor(v)));
}

/* Call the Azure recommender. The deployed model is keyed by product *name*,
 * so we send the catalog title for the given product_id. Throws on any
 * non-2xx / timeout so the caller can fall back. */
async function fromAzure(body: RecRequest) {
  const url = process.env.RECS_URL;
  if (!url) throw new Error("RECS_URL not set");
  const itemName = body.product_id ? byId[body.product_id]?.title ?? body.product_id : "";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.RECS_KEY ? { Authorization: `Bearer ${process.env.RECS_KEY}` } : {}),
    },
    body: JSON.stringify({ item_name: itemName, top_n: clampLimit(body.limit) }),
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`recs upstream ${res.status}`);
  const data = await res.json();
  const recs = Array.isArray(data) ? data : data.recommendations;
  if (!Array.isArray(recs) || recs.length === 0) throw new Error("recs upstream: empty/unknown item");
  return recs;
}

export async function POST(req: Request) {
  let body: RecRequest = {};
  try {
    body = (await req.json()) as RecRequest;
  } catch {
    /* empty / invalid body -> defaults */
  }

  // Prefer the deployed Azure model when configured; fall back to local.
  if (process.env.RECS_URL) {
    try {
      const recommendations = await fromAzure(body);
      return NextResponse.json({ recommendations, model_version: "azure", served_from: "azure" });
    } catch (err) {
      console.warn("[recommendations] Azure upstream failed, using local fallback:", err);
    }
  }
  return NextResponse.json(buildResponse(body));
}

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  return NextResponse.json(
    buildResponse({
      context: (searchParams.get("context") as Context) || "homepage",
      product_id: searchParams.get("product_id"),
      limit: Number(searchParams.get("limit")) || 10,
    }),
  );
}
