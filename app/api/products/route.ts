/* Isoko — catalog API (Node runtime).
 * GET /api/products            -> all products + categories + stores
 * GET /api/products?cat=fashion -> filtered by category
 * GET /api/products?q=dress     -> full-text-ish search over title/category
 * GET /api/products?id=p1       -> a single product */
import { NextResponse } from "next/server";
import { byId, CATEGORIES, PRODUCTS, STORES } from "@/lib/data";

export const runtime = "nodejs";

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    const product = byId[id];
    if (!product) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ product });
  }

  const cat = searchParams.get("cat");
  const q = searchParams.get("q")?.toLowerCase();
  let products = PRODUCTS.slice();
  if (cat && cat !== "all") products = products.filter((p) => p.cat === cat);
  if (q) products = products.filter((p) => p.title.toLowerCase().includes(q) || p.cat.includes(q));

  return NextResponse.json({
    products,
    categories: CATEGORIES,
    stores: STORES,
    count: products.length,
  });
}
