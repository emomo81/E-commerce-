/* Isoko — client-side route shape shared across storefront screens. */
import type { CartItem, Lang, Order, Role, Translator } from "@/lib/types";

export type RouteName = "home" | "category" | "product" | "cart" | "checkout" | "confirm";

export interface Route {
  name: RouteName;
  id?: string;
  cat?: string;
  q?: string;
}

export type Go = (r: Route) => void;
export type AddToCart = (
  p: { id: string; price: number; title: string },
  e?: React.MouseEvent | null,
  qty?: number,
  variant?: Record<string, string> | null,
) => void;

export interface ScreenProps {
  t: Translator;
  lang: Lang;
  go: Go;
  addToCart: AddToCart;
}

export type { CartItem, Lang, Order, Role, Translator };
