/* Isoko — mock data, catalog, currency. Ported from the design prototype's data.js. */
import type {
  AdminApproval,
  AdminKpi,
  Category,
  MlMetrics,
  Product,
  Review,
  SellerOrder,
  Store,
} from "./types";

/* ---- Currency ---- */
export function rwf(n: number): string {
  return "RWF " + Math.round(n).toLocaleString("en-US");
}

/* ---- Categories ---- */
export const CATEGORIES: Category[] = [
  { id: "fashion", name: "Fashion", rw: "Imyambaro", tint: "#7c3aed", glyph: "tshirt" },
  { id: "electronics", name: "Electronics", rw: "Ibikoresho", tint: "#2563eb", glyph: "device" },
  { id: "home", name: "Home & Living", rw: "Mu rugo", tint: "#0d9488", glyph: "home" },
  { id: "beauty", name: "Beauty", rw: "Ubwiza", tint: "#db2777", glyph: "drop" },
  { id: "accessories", name: "Accessories", rw: "Ibindi", tint: "#d97706", glyph: "bag" },
  { id: "phones", name: "Phones", rw: "Telefoni", tint: "#4f46e5", glyph: "phone" },
];

/* ---- Sellers / Stores ---- */
export const STORES: Store[] = [
  { id: "s1", name: "Kimironko Threads", rating: 4.8, reviews: 312, city: "Kigali", verified: true, joined: "2024" },
  { id: "s2", name: "Kigali Gadgets", rating: 4.6, reviews: 540, city: "Kigali", verified: true, joined: "2023" },
  { id: "s3", name: "Inzu Home Co.", rating: 4.9, reviews: 188, city: "Musanze", verified: true, joined: "2024" },
  { id: "s4", name: "Glow Beauty RW", rating: 4.7, reviews: 421, city: "Kigali", verified: true, joined: "2024" },
  { id: "s5", name: "Nyamirambo Style", rating: 4.5, reviews: 96, city: "Kigali", verified: false, joined: "2025" },
];

/* ---- Products ---- */
let _id = 0;
const P = (o: Partial<Product> & Pick<Product, "title" | "cat" | "store" | "price" | "tone" | "desc" | "variants">): Product =>
  Object.assign({ id: "p" + ++_id, rating: 4.6, reviews: 40, condition: "new", stock: 24 }, o) as Product;

export const PRODUCTS: Product[] = [
  P({ title: "Kitenge Wrap Dress", cat: "fashion", store: "s1", price: 18500, tone: 282, rating: 4.9, reviews: 124, tag: "Bestseller",
      desc: "Hand-finished Kitenge wrap dress in bold Ankara print. Lightweight cotton, made in Kigali. Adjustable waist tie.", variants: { Size: ["S", "M", "L", "XL"], Color: ["Indigo", "Amber", "Coral"] } }),
  P({ title: "Wireless Earbuds Pro", cat: "electronics", store: "s2", price: 32000, tone: 235, rating: 4.5, reviews: 210, tag: "Hot",
      desc: "True-wireless earbuds with active noise cancellation, 28h battery with case, USB-C fast charge. 1-year local warranty.", variants: { Color: ["Black", "White"] } }),
  P({ title: "Woven Sisal Basket", cat: "home", store: "s3", price: 12500, tone: 172, rating: 4.9, reviews: 88, tag: "Handmade",
      desc: "Traditional Agaseke-inspired sisal basket, hand-woven in Musanze. Perfect for storage or as a statement piece.", variants: { Size: ["Medium", "Large"] } }),
  P({ title: "Shea Glow Serum", cat: "beauty", store: "s4", price: 9800, tone: 330, rating: 4.7, reviews: 156,
      desc: "Brightening face serum with East-African shea and vitamin C. Lightweight, fragrance-free, 30ml.", variants: {} }),
  P({ title: "Leather Crossbody Bag", cat: "accessories", store: "s1", price: 24000, tone: 32, rating: 4.8, reviews: 73, tag: "New",
      desc: "Full-grain leather crossbody with adjustable strap and brass hardware. Ages beautifully.", variants: { Color: ["Tan", "Black", "Brown"] } }),
  P({ title: "Smartphone A54 128GB", cat: "phones", store: "s2", price: 245000, tone: 245, rating: 4.6, reviews: 302, tag: "Bestseller",
      desc: "6.4-inch AMOLED, 50MP triple camera, 5000mAh battery, dual SIM. Includes screen protector + case.", variants: { Storage: ["128GB", "256GB"], Color: ["Graphite", "Mint"] } }),
  P({ title: "Ankara Bomber Jacket", cat: "fashion", store: "s5", price: 27500, tone: 292, rating: 4.6, reviews: 41,
      desc: "Statement bomber with quilted lining and Ankara panel sleeves. Unisex fit.", variants: { Size: ["S", "M", "L", "XL"] } }),
  P({ title: "Bluetooth Speaker Mini", cat: "electronics", store: "s2", price: 16500, tone: 222, rating: 4.4, reviews: 97,
      desc: "Pocket-size speaker, IPX6 waterproof, 12h playtime, deep bass. Pairs in stereo.", variants: { Color: ["Charcoal", "Teal", "Red"] } }),
  P({ title: "Ceramic Coffee Set", cat: "home", store: "s3", price: 21000, tone: 162, rating: 4.8, reviews: 54, tag: "Handmade",
      desc: "Four-piece stoneware coffee set, reactive glaze. Microwave & dishwasher safe.", variants: {} }),
  P({ title: "Matte Lip Set (5)", cat: "beauty", store: "s4", price: 13500, tone: 340, rating: 4.7, reviews: 188, tag: "Hot",
      desc: "Five long-wear matte liquid lipsticks in warm everyday shades. Cruelty-free.", variants: {} }),
  P({ title: "Beaded Statement Necklace", cat: "accessories", store: "s5", price: 8500, tone: 22, rating: 4.5, reviews: 36,
      desc: "Hand-beaded brass and glass necklace. Adjustable length, lightweight.", variants: {} }),
  P({ title: "Smart Watch Active", cat: "electronics", store: "s2", price: 38000, tone: 250, rating: 4.5, reviews: 142, tag: "New",
      desc: "AMOLED fitness watch, heart-rate + SpO2, 100+ sport modes, 10-day battery. Calls via Bluetooth.", variants: { Color: ["Midnight", "Silver"] } }),
  P({ title: "Cotton Tunic Shirt", cat: "fashion", store: "s1", price: 14000, tone: 276, rating: 4.7, reviews: 68,
      desc: "Breathable cotton tunic with embroidered neckline. Everyday comfort.", variants: { Size: ["S", "M", "L", "XL"] } }),
  P({ title: "Woven Floor Mat", cat: "home", store: "s3", price: 17500, tone: 182, rating: 4.6, reviews: 29,
      desc: "Durable hand-woven floor mat, natural fibre, reversible pattern. 120×80cm.", variants: {} }),
  P({ title: "Hydrating Face Mist", cat: "beauty", store: "s4", price: 7200, tone: 320, rating: 4.6, reviews: 74,
      desc: "Rosewater + aloe facial mist. Sets makeup and refreshes skin. 100ml.", variants: {} }),
  P({ title: "Power Bank 20000mAh", cat: "electronics", store: "s2", price: 19500, tone: 228, rating: 4.7, reviews: 219, tag: "Bestseller",
      desc: "Fast-charge power bank, dual USB-C PD, charges a phone 4×. Slim aluminium body.", variants: { Color: ["Black", "Blue"] } }),
];

export const byId: Record<string, Product> = {};
PRODUCTS.forEach((p) => (byId[p.id] = p));

export const storeById = (id: string): Store | undefined => STORES.find((s) => s.id === id);
export const catById = (id: string): Category | undefined => CATEGORIES.find((c) => c.id === id);

/* ---- Reviews (sample) ---- */
export const REVIEWS: Review[] = [
  { name: "Amina U.", rating: 5, when: "2 weeks ago", text: "Exactly as pictured and delivery to Kigali was fast. Paid with MoMo, super smooth." },
  { name: "Kevin M.", rating: 4, when: "1 month ago", text: "Good quality for the price. Packaging could be better but the product works great." },
  { name: "Marie K.", rating: 5, when: "3 weeks ago", text: "Beautiful craftsmanship. The seller answered my WhatsApp questions quickly." },
];

/* ---- Seller dashboard data ---- */
export const SELLER_ORDERS: SellerOrder[] = [
  { id: "ISK-20481", buyer: "Amina Uwase", items: 2, total: 31000, status: "Pending", when: "Today, 09:14", method: "MTN MoMo" },
  { id: "ISK-20479", buyer: "Jean Bosco", items: 1, total: 18500, status: "Confirmed", when: "Today, 08:02", method: "Airtel Money" },
  { id: "ISK-20475", buyer: "Claudine M.", items: 3, total: 54000, status: "Packed", when: "Yesterday", method: "Card" },
  { id: "ISK-20470", buyer: "Eric N.", items: 1, total: 12500, status: "Shipped", when: "Yesterday", method: "MTN MoMo" },
  { id: "ISK-20461", buyer: "Diane I.", items: 2, total: 41500, status: "Delivered", when: "2 days ago", method: "MTN MoMo" },
  { id: "ISK-20455", buyer: "Patrick H.", items: 1, total: 9800, status: "Delivered", when: "3 days ago", method: "Airtel Money" },
];

export const SELLER_SALES: number[] = [42, 51, 38, 64, 72, 58, 81, 69, 90, 76, 95, 88, 102, 119]; // last 14 days orders

/* ---- Admin data ---- */
export const ADMIN_KPI: AdminKpi = {
  gmv: 18420000, orders: 487, buyers: 4820, sellers: 142,
  gmvSeries: [6.2, 7.1, 6.8, 8.4, 9.2, 8.8, 10.4, 11.1, 12.6, 13.9, 14.2, 16.0, 17.3, 18.4],
};
export const ADMIN_APPROVALS: AdminApproval[] = [
  { id: "s9", name: "Huye Crafts", city: "Huye", when: "1h ago" },
  { id: "s10", name: "Rubavu Electronics", city: "Rubavu", when: "4h ago" },
  { id: "s11", name: "Gisenyi Beauty Bar", city: "Rubavu", when: "Yesterday" },
];

/* ML engine metrics */
export const ML: MlMetrics = {
  ctr: 9.4, ctrTarget: 8, addToCart: 17.2, atcTarget: 15, lift: 11.8, liftTarget: 10,
  aovLift: 6.3, precision: 0.18, coverage: 46, p95: 214, cacheHit: 74,
  ctrSeries: [6.1, 6.8, 7.2, 7.0, 7.9, 8.4, 8.1, 8.8, 9.0, 9.4],
  abControl: 5.2, abTreatment: 9.4,
  lastTrain: "Today, 02:00 EAT", trainStatus: "passed", modelVersion: "v1.4",
};
