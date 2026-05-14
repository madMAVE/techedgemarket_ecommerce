import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { OrderStatus, StockStatus, ProcurementStatus, ProspectStatus, ServiceStatus, ServicePriority } from "@/types";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const formatDate = (d: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));

export const formatCompact = (n: number) => {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)}Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000)      return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${n}`;
};

export const formatPercent = (v: number, d = 1) => `${v >= 0 ? "+" : ""}${v.toFixed(d)}%`;
export const round2 = (n: number) => Math.round(n * 100) / 100;
export const getDiscount = (p: number, o: number) => Math.round((1 - p / o) * 100);
export const getInitials = (n: string) => n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
export const truncate = (s: string, n: number) => s.length <= n ? s : s.slice(0, n).trimEnd() + "…";

export const TAX = 0.18;
export const FREE_SHIP = 50000;
export const SHIP_COST = 850;

export function calcCart(items: { product: { price: number }; quantity: number }[]) {
  const sub  = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const ship = sub >= FREE_SHIP ? 0 : SHIP_COST;
  const tax  = round2(sub * TAX);
  return { subtotal: round2(sub), shipping: round2(ship), tax, total: round2(sub + ship + tax), count: items.reduce((s, i) => s + i.quantity, 0) };
}

export function numberToWords(n: number): string {
  const o = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const t = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  if (n===0) return "Zero";
  if (n<20) return o[n];
  if (n<100) return t[Math.floor(n/10)]+(n%10?" "+o[n%10]:"");
  if (n<1000) return o[Math.floor(n/100)]+" Hundred"+(n%100?" "+numberToWords(n%100):"");
  if (n<100000) return numberToWords(Math.floor(n/1000))+" Thousand"+(n%1000?" "+numberToWords(n%1000):"");
  if (n<10000000) return numberToWords(Math.floor(n/100000))+" Lakh"+(n%100000?" "+numberToWords(n%100000):"");
  return numberToWords(Math.floor(n/10000000))+" Crore"+(n%10000000?" "+numberToWords(n%10000000):"");
}

/* ── Order ── */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending:"Pending", confirmed:"Confirmed", processing:"Processing",
  shipped:"Shipped", delivered:"Delivered", cancelled:"Cancelled", refunded:"Refunded",
};
export const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  pending:   "badge badge-amber",
  confirmed: "badge badge-blue",
  processing:"badge badge-blue",
  shipped:   "badge badge-purple",
  delivered: "badge badge-green",
  cancelled: "badge badge-red",
  refunded:  "badge badge-gray",
};

/* ── Stock ── */
export const STOCK_LABEL: Record<StockStatus, string> = {
  in_stock:"In Stock", low_stock:"Low Stock", out_of_stock:"Out of Stock",
};
export const STOCK_BADGE: Record<StockStatus, string> = {
  in_stock:"badge badge-green", low_stock:"badge badge-amber", out_of_stock:"badge badge-red",
};

/* ── Procurement ── */
export const PROC_LABEL: Record<ProcurementStatus, string> = {
  draft:"Draft", submitted:"Submitted", approved:"Approved", ordered:"Ordered", received:"Received", cancelled:"Cancelled",
};
export const PROC_BADGE: Record<ProcurementStatus, string> = {
  draft:"badge badge-gray", submitted:"badge badge-amber", approved:"badge badge-blue",
  ordered:"badge badge-cyan", received:"badge badge-green", cancelled:"badge badge-red",
};

/* ── Prospect ── */
export const PROSPECT_LABEL: Record<ProspectStatus, string> = {
  new:"New", contacted:"Contacted", qualified:"Qualified", proposal:"Proposal",
  negotiation:"Negotiation", won:"Won ✓", lost:"Lost",
};
export const PROSPECT_BADGE: Record<ProspectStatus, string> = {
  new:"badge badge-blue", contacted:"badge badge-cyan", qualified:"badge badge-purple",
  proposal:"badge badge-amber", negotiation:"badge badge-gold", won:"badge badge-green", lost:"badge badge-red",
};

/* ── Service ── */
export const SVC_STATUS_LABEL: Record<ServiceStatus, string> = {
  open:"Open", in_progress:"In Progress", resolved:"Resolved", closed:"Closed",
};
export const SVC_STATUS_BADGE: Record<ServiceStatus, string> = {
  open:"badge badge-red", in_progress:"badge badge-amber", resolved:"badge badge-green", closed:"badge badge-gray",
};
export const SVC_PRIORITY_LABEL: Record<ServicePriority, string> = {
  low:"Low", medium:"Medium", high:"High", critical:"Critical ⚠",
};
export const SVC_PRIORITY_BADGE: Record<ServicePriority, string> = {
  low:"badge badge-gray", medium:"badge badge-blue", high:"badge badge-amber", critical:"badge badge-red",
};
