// ── Product ───────────────────────────────────────────────────────────────────
export type ProductCategory =
  | "Automation"
  | "Switchgear"
  | "Spare Parts"
  | "Drives & Motors"
  | "Sensors & Instrumentation"
  | "Cables & Wiring"
  | "Safety Systems"
  | "Control Panels";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  category: ProductCategory;
  subcategory?: string;
  brand: string;
  model: string;
  image: string;
  images?: string[];
  rating: number;
  reviews: number;
  stock: number;
  sku: string;
  partNumber: string;
  tags: string[];
  featured?: boolean;
  badge?: string;
  specs?: Record<string, string | undefined>;
  leadTime?: string;
}

// ── Cart ──────────────────────────────────────────────────────────────────────
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartTotals {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  itemCount: number;
}

// ── Order ─────────────────────────────────────────────────────────────────────
export type OrderStatus =
  | "pending" | "confirmed" | "processing"
  | "shipped"  | "delivered" | "cancelled" | "refunded";

export interface TrackingEvent {
  date: string;
  time: string;
  status: string;
  location: string;
  description: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  customer: { id: string; name: string; email: string; company: string };
  shippingAddress: Address;
  paymentMethod: string;
  poReference?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  trackingEvents: TrackingEvent[];
  notes?: string;
}

// ── Address ───────────────────────────────────────────────────────────────────
export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

// ── Customer ──────────────────────────────────────────────────────────────────
export type CustomerStatus = "active" | "inactive" | "vip";
export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  joinDate: string;
  status: CustomerStatus;
  industry: string;
}

// ── Inventory ─────────────────────────────────────────────────────────────────
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";
export interface InventoryItem {
  id: string;
  productId: string;
  sku: string;
  partNumber: string;
  productName: string;
  brand: string;
  category: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderPoint: number;
  maxStock: number;
  unitCost: number;
  totalValue: number;
  status: StockStatus;
  lastRestocked: string;
  supplier: string;
  location: string;
  leadTime: string;
}

// ── Procurement ───────────────────────────────────────────────────────────────
export type ProcurementStatus =
  | "draft" | "submitted" | "approved" | "ordered" | "received" | "cancelled";

export interface ProcurementItem {
  productId: string;
  productName: string;
  sku: string;
  partNumber: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  rating: number;
  leadTimeDays: number;
  category: string;
}

export interface ProcurementOrder {
  id: string;
  poNumber: string;
  supplier: Supplier;
  items: ProcurementItem[];
  status: ProcurementStatus;
  requestDate: string;
  approvedDate?: string;
  expectedDate?: string;
  receivedDate?: string;
  totalAmount: number;
  currency: string;
  requestedBy: string;
  notes?: string;
}

// ── Prospect ──────────────────────────────────────────────────────────────────
export type ProspectStatus =
  | "new" | "contacted" | "qualified" | "proposal"
  | "negotiation" | "won" | "lost";

export interface Prospect {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  industry: string;
  status: ProspectStatus;
  source: string;
  value: number;
  probability: number;
  createdDate: string;
  lastContact?: string;
  nextFollowUp?: string;
  notes?: string;
  assignedTo: string;
  tags: string[];
  requirements?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────
export type ServiceStatus = "open" | "in_progress" | "resolved" | "closed";
export type ServicePriority = "low" | "medium" | "high" | "critical";

export interface ServiceTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: ServiceStatus;
  priority: ServicePriority;
  category: string;
  customer: string;
  company: string;
  assignedTo: string;
  createdDate: string;
  updatedDate: string;
  resolvedDate?: string;
  estimatedHours: number;
  actualHours?: number;
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export interface MonthlySales {
  month: string;
  revenue: number;
  orders: number;
  customers: number;
  profit: number;
}

export interface CategorySales {
  category: string;
  sales: number;
  percentage: number;
  growth: number;
}
