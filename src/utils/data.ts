import products from "@/data/products.json";
import orders from "@/data/orders.json";
import inventory from "@/data/inventory.json";
import procurement from "@/data/procurement.json";
import prospects from "@/data/prospects.json";
import services from "@/data/services.json";
import analytics from "@/data/analytics.json";
import type { Product, Order, InventoryItem, ProcurementOrder, Prospect, ServiceTicket } from "@/types";

export const getAllProducts   = () => products as Product[];
export const getProductById   = (id: string) => (products as Product[]).find(p => p.id === id);
export const getFeaturedProducts = () => (products as Product[]).filter(p => p.featured);
export const getProductsByCategory = (cat: string) => (products as Product[]).filter(p => p.category === cat);

export const getAllOrders   = () => orders as unknown as Order[];
export const getOrderById   = (id: string) => (orders as unknown as Order[]).find(o => o.id === id);

export const getAllInventory = () => inventory as InventoryItem[];
export const getLowStock    = () => (inventory as InventoryItem[]).filter(i => i.status !== "in_stock");

export const getAllProcurement = () => procurement as unknown as ProcurementOrder[];

export const getAllProspects = () => prospects as Prospect[];

export const getAllServices  = () => services as ServiceTicket[];
export const getOpenServices = () => (services as ServiceTicket[]).filter(s => s.status === "open" || s.status === "in_progress");

export const getAnalytics = () => analytics;
