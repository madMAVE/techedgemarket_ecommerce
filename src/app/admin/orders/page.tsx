"use client";
import { useState, useEffect, useCallback } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import StatusBadge from "@/components/ui/StatusBadge";
import { api } from "@/lib/interceptor";
import { formatINR, formatDate, ORDER_STATUS_BADGE, ORDER_STATUS_LABEL } from "@/utils/helpers";
import type { Order, OrderStatus } from "@/types";
import { CheckCircle, XCircle, Clock, Truck, Package, Search, FileText, ChevronDown, ChevronUp, RefreshCw, ArrowRight, MapPin, CreditCard, Hash, Calendar, AlertCircle, Pencil, X, Loader2 } from "lucide-react";
import Link from "next/link";

const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = { pending: ["confirmed", "cancelled"], confirmed: ["processing", "cancelled"], processing: ["shipped", "cancelled"], shipped: ["delivered"], delivered: ["refunded"], cancelled: [], refunded: [] };

const ACTION_STYLE: Record<OrderStatus, string> = {
  confirmed: "bg-emerald-600 hover:bg-emerald-700 text-white", processing: "bg-primary-600 hover:bg-primary-700 text-white",
  shipped: "bg-purple-600 hover:bg-purple-700 text-white", delivered: "bg-emerald-600 hover:bg-emerald-700 text-white",
  cancelled: "bg-red-600 hover:bg-red-700 text-white", refunded: "bg-slate-500 hover:bg-slate-600 text-white", pending: "bg-amber-500 text-white",
};
const ACTION_LABEL: Record<OrderStatus, string> = { confirmed: "✓ Accept", processing: "→ Processing", shipped: "🚚 Shipped", delivered: "✓ Delivered", cancelled: "✗ Cancel", refunded: "↩ Refund", pending: "Pending" };

interface BackendOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  mobile: string;
  orgAddress: { street: string; city: string; state: string; zip: string; country: string };
  shippingAddress: { street: string; city: string; state: string; zip: string; country: string };
  locationUrl: string | null;
  otpVerified: boolean;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: string;
  poReference: string | null;
  trackingNumber: string | null;
  estimatedDelivery: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: {
    id: string;
    orderId: string;
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

interface TrackingEntry {
  status: string;
  details: {
    id: string;
    orderId: string;
    status: string;
    location: string[];
    message: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}

interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface EditTrackingState {
  orderId: string;
  trackingId: string | null;
  status: string;
  message: string;
  locations: { state: string; city: string }[];
  stateId: string;
  cityId: string;
  states: { stateId: number; name: string }[];
  cities: { cityId: number; name: string }[];
  loading: boolean;
}

const TRACKING_STATUS_OPTIONS = [
  { value: "purchased", label: "Purchased" },
  { value: "dispatched", label: "Dispatched" },
  { value: "on_the_way", label: "On the way" },
  { value: "delivered", label: "Delivered" },
];

function mapOrder(b: BackendOrder): Order {
  return {
    id: b.id,
    orderNumber: b.orderNumber,
    date: b.createdAt,
    status: b.status,
    items: b.items.map((i) => ({ productId: i.productId, productName: i.productName, sku: i.sku, quantity: i.quantity, unitPrice: i.unitPrice, totalPrice: i.totalPrice })),
    subtotal: b.subtotal,
    tax: b.taxAmount,
    shipping: b.shippingAmount,
    total: b.totalAmount,
    customer: { id: b.customerId, name: b.customerName, email: b.customerEmail, company: b.customerCompany },
    shippingAddress: b.shippingAddress,
    paymentMethod: b.paymentMethod,
    poReference: b.poReference ?? undefined,
    trackingNumber: b.trackingNumber ?? undefined,
    estimatedDelivery: b.estimatedDelivery ?? undefined,
    trackingEvents: [],
    notes: b.notes ?? undefined,
  };
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [trackingMap, setTrackingMap] = useState<Record<string, TrackingEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [editModal, setEditModal] = useState<EditTrackingState | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<BackendResponse<{ items: BackendOrder[]; meta: { total: number } }>>("/api/orders");
      const mapped = res.data.data.items.map(mapOrder);
      setOrders(mapped);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load orders";
      showToast(message, false);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTracking = useCallback(async (orderId: string) => {
    try {
      const res = await api.get<BackendResponse<TrackingEntry[]>>(`/api/order-tracking/order/${orderId}`);
      setTrackingMap((prev) => ({ ...prev, [orderId]: res.data.data }));
    } catch {
      setTrackingMap((prev) => ({ ...prev, [orderId]: [] }));
    }
  }, []);

  const toggleExpand = useCallback(async (orderId: string) => {
    if (expanded === orderId) {
      setExpanded(null);
    } else {
      setExpanded(orderId);
      if (!trackingMap[orderId]) {
        await fetchTracking(orderId);
      }
    }
  }, [expanded, trackingMap, fetchTracking]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (id: string, s: OrderStatus) => {
    try {
      await api.patch(`/api/orders/${id}/status`, { status: s });
      setOrders((prev) => prev.map((o) => o.id !== id ? o : { ...o, status: s }));
      await fetchTracking(id);
      showToast(`Order updated to "${ORDER_STATUS_LABEL[s]}"`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update order";
      showToast(message, false);
    }
  };

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return (!q || o.orderNumber.toLowerCase().includes(q) || o.customer.company.toLowerCase().includes(q) || (o.poReference ?? "").toLowerCase().includes(q)) && (statusF === "all" || o.status === statusF);
  });
  const counts = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {} as Record<string, number>);

  const getTrackingStatusBadge = (orderId: string) => {
    const tracking = trackingMap[orderId];
    if (!tracking || tracking.length === 0) return null;
    const active = tracking.find((t) => t.details !== null);
    if (!active) return null;
    const label = active.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const colorMap: Record<string, string> = {
      purchased: "bg-blue-100 text-blue-700 border-blue-200",
      dispatched: "bg-amber-100 text-amber-700 border-amber-200",
      on_the_way: "bg-purple-100 text-purple-700 border-purple-200",
      delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${colorMap[active.status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {label}
      </span>
    );
  };

  const openEditModal = async (orderId: string, status: string, trackingId: string | null) => {
    try {
      const res = await api.get<BackendResponse<{ stateId: number; name: string }[]>>("/api/orders/locations/states");
      const states = Array.isArray(res.data.data) ? res.data.data : [];

      let existingLocations: { state: string; city: string }[] = [];
      if (trackingId) {
        const tracking = trackingMap[orderId];
        const entry = tracking?.find((t) => t.details?.id === trackingId);
        if (entry?.details?.location) {
          existingLocations = entry.details.location.map((loc) => {
            const parts = loc.split(", ");
            return { city: parts[0] ?? "", state: parts[1] ?? "" };
          });
        }
      }

      setEditModal({
        orderId,
        trackingId,
        status,
        message: trackingId ? (trackingMap[orderId]?.find((t) => t.details?.id === trackingId)?.details?.message ?? "") : "",
        locations: existingLocations,
        stateId: "",
        cityId: "",
        states,
        cities: [],
        loading: false,
      });
    } catch {
      showToast("Failed to load states", false);
    }
  };

  const loadCities = async (stateId: string) => {
    if (!editModal) return;
    try {
      const res = await api.get<BackendResponse<{ cityId: number; name: string }[]>>(`/api/orders/locations/cities`, { stateId: parseInt(stateId, 10) });
      const cities = Array.isArray(res.data.data) ? res.data.data : [];
      setEditModal((prev) => prev ? { ...prev, cities, cityId: "" } : null);
    } catch {
      showToast("Failed to load cities", false);
    }
  };

  const addLocation = () => {
    if (!editModal || !editModal.stateId) return;
    const state = editModal.states.find((s) => String(s.stateId) === editModal.stateId);
    const city = editModal.cities.find((c) => String(c.cityId) === editModal.cityId);
    if (!state) return;

    const newLocation = {
      state: state.name,
      city: city?.name ?? "",
    };

    setEditModal((prev) => prev ? {
      ...prev,
      locations: [...prev.locations, newLocation],
      stateId: "",
      cityId: "",
      cities: [],
    } : null);
  };

  const removeLocation = (index: number) => {
    setEditModal((prev) => prev ? {
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index),
    } : null);
  };

  const saveTracking = async () => {
    if (!editModal) return;
    setEditModal((prev) => prev ? { ...prev, loading: true } : null);

    const locationParts = editModal.locations.map((loc) => {
      return loc.city ? `${loc.city}, ${loc.state}` : loc.state;
    }).filter(Boolean);

    try {
      if (editModal.trackingId) {
        await api.patch(`/api/order-tracking/${editModal.trackingId}`, {
          status: editModal.status,
          message: editModal.message,
          location: locationParts,
        });
      } else {
        await api.post(`/api/order-tracking/${editModal.orderId}`, {
          status: editModal.status,
          message: editModal.message,
          location: locationParts,
        });
      }
      await fetchTracking(editModal.orderId);
      setEditModal(null);
      showToast("Tracking updated successfully");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update tracking";
      showToast(message, false);
      setEditModal((prev) => prev ? { ...prev, loading: false } : null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Loading orders...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        {toast && <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in ${toast.ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}><CheckCircle className="w-4 h-4" />{toast.msg}</div>}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between mb-8">
            <div><h1 className="page-title flex items-center gap-3"><Package className="w-7 h-7 text-primary-600" />Order Management</h1><p className="page-sub">Accept, process and track all customer orders</p></div>
            <div className="flex gap-3">
              <button onClick={fetchOrders} className="btn-gold flex items-center gap-2"><RefreshCw className="w-4 h-4" />Refresh</button>
              <Link href="/admin/invoice" className="btn-gold flex items-center gap-2"><FileText className="w-4 h-4" />Generate Invoice</Link>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
            {(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as OrderStatus[]).map((s) => (
              <button key={s} onClick={() => setStatusF(statusF === s ? "all" : s)} className={`card p-3 text-center transition-all hover:shadow-card-lg ${statusF === s ? "border-primary-400 bg-primary-50" : ""}`}>
                <p className="font-display font-bold text-2xl text-slate-900">{counts[s] || 0}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{ORDER_STATUS_LABEL[s]}</p>
              </button>
            ))}
          </div>
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input className="input pl-11" placeholder="Search order, company, PO reference…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <select className="select w-auto min-w-44" value={statusF} onChange={(e) => setStatusF(e.target.value)}>
              <option value="all">All Statuses</option>
              {(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as OrderStatus[]).map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          {filtered.length === 0 && (
            <div className="card p-12 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No orders found</p>
            </div>
          )}
          <div className="space-y-4">
            {filtered.map((order) => {
              const nextSt = STATUS_FLOW[order.status];
              const isOpen = expanded === order.id;
              return (
                <div key={order.id} className={`card overflow-hidden transition-all ${isOpen ? "border-primary-300 shadow-card-lg" : ""}`}>
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-bold text-primary-600">{order.orderNumber}</span>
                        <StatusBadge label={ORDER_STATUS_LABEL[order.status]} cls={ORDER_STATUS_BADGE[order.status]} />
                        {getTrackingStatusBadge(order.id)}
                        {order.status === "pending" && <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-dot" />Awaiting Acceptance</span>}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-1.5 text-sm text-slate-500">
                        <span className="font-semibold text-slate-800">{order.customer.company}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(order.date)}</span>
                        {order.poReference && <span className="flex items-center gap-1 font-mono text-xs"><Hash className="w-3 h-3" />PO: {order.poReference}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right"><p className="font-display font-bold text-2xl text-slate-900">{formatINR(order.total)}</p><p className="text-xs text-slate-400">{order.items.length} items</p></div>
                      <div className="flex gap-2">
                        {nextSt.slice(0, 2).map((ns) => <button key={ns} onClick={() => updateStatus(order.id, ns)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${ACTION_STYLE[ns]}`}>{ACTION_LABEL[ns]}</button>)}
                        <button onClick={() => toggleExpand(order.id)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="border-t border-slate-100 px-5 py-5 space-y-5 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[{ t: "Customer", c: <><p className="font-bold text-slate-900 text-sm">{order.customer.name}</p><p className="text-xs text-slate-500">{order.customer.company}</p><p className="text-xs text-slate-400 mt-1">{order.customer.email}</p></> },
                          { t: "Ship To", c: <p className="text-sm text-slate-700 flex items-start gap-1.5"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />{order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.zip}</p> },
                          { t: "Payment", c: <><p className="text-sm text-slate-700 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-slate-400" />{order.paymentMethod}</p>{order.notes && <p className="text-xs text-amber-600 mt-2 italic">📝 {order.notes}</p>}</> }
                        ].map(({ t, c }) => (
                          <div key={t} className="bg-slate-50 rounded-xl p-4 border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t}</p>{c}</div>
                        ))}
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="w-full text-sm">
                          <thead><tr><th className="th">Product</th><th className="th">SKU</th><th className="th text-center">Qty</th><th className="th text-right">Unit</th><th className="th text-right">Total</th></tr></thead>
                          <tbody>
                            {order.items.map((item) => (
                              <tr key={item.sku} className="tr">
                                <td className="td font-semibold text-slate-900">{item.productName}</td>
                                <td className="td font-mono text-xs text-slate-400">{item.sku}</td>
                                <td className="td text-center font-bold">{item.quantity}</td>
                                <td className="td text-right">{formatINR(item.unitPrice)}</td>
                                <td className="td text-right font-bold text-slate-900">{formatINR(item.totalPrice)}</td>
                              </tr>
                            ))}
                            <tr className="bg-slate-50"><td colSpan={4} className="td text-right font-bold text-slate-700">Subtotal</td><td className="td text-right font-bold">{formatINR(order.subtotal)}</td></tr>
                            <tr className="bg-slate-50"><td colSpan={4} className="td text-right font-bold text-slate-700">GST (18%)</td><td className="td text-right font-bold">{formatINR(order.tax)}</td></tr>
                            <tr className="bg-primary-50"><td colSpan={4} className="td text-right font-black text-primary-800">Grand Total</td><td className="td text-right font-display font-black text-xl text-primary-700">{formatINR(order.total)}</td></tr>
                          </tbody>
                        </table>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Order Tracking</p>
                        {!trackingMap[order.id] ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                          </div>
                        ) : (
                          <div className="flex items-start px-2">
                            {trackingMap[order.id].map((ev, i) => {
                              const hasDetails = !!ev.details;
                              const label = ev.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                              const icons = [Package, Truck, MapPin, CheckCircle];
                              const Icon = icons[i] ?? Package;
                              const isPending = !hasDetails;

                              const detailsIndices = trackingMap[order.id].reduce<number[]>((acc, t, idx) => {
                                if (t.details) acc.push(idx);
                                return acc;
                              }, []);
                              const currentIdx = detailsIndices.length > 0 ? detailsIndices[detailsIndices.length - 1] : -1;
                              const isCurrent = i === currentIdx && i !== 0;
                              const isDone = hasDetails && !isCurrent;

                              const formatDateTime = (dateStr: string) => {
                                const d = new Date(dateStr);
                                const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                                const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
                                return `${date}, ${time}`;
                              };

                              return (
                                <div key={ev.status} className="flex-1 flex flex-col items-center text-center relative group">
                                  <div className={`absolute top-[11px] left-[-50%] w-full h-[3px] z-0 ${i === 0 ? "hidden" : ""}`} style={isPending && trackingMap[order.id][i - 1]?.details ? { background: "linear-gradient(to right, #16a34a 50%, #e2e8f0 50%)" } : { background: trackingMap[order.id][i - 1]?.details ? "#16a34a" : "#e2e8f0" }} />
                                  <div className={`w-[26px] h-[26px] rounded-full border-[3px] flex items-center justify-center z-10 relative ${isDone ? "border-emerald-600 bg-emerald-600" : isCurrent ? "border-emerald-600 bg-white" : "border-slate-200 bg-white"}`}>
                                    {isDone && (
                                      <svg viewBox="0 0 24 24" fill="none" className="w-[14px] h-[14px]">
                                        <path d="M4 12l5 5L20 6" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    )}
                                    {isCurrent && <div className="w-[10px] h-[10px] rounded-full bg-emerald-600" />}
                                    {isPending && <Icon className="w-[12px] h-[12px] text-slate-300" />}
                                  </div>
                                  <p className={`mt-2.5 text-[13px] font-semibold inline-flex items-center gap-1 ${isPending ? "text-slate-400 font-medium" : "text-slate-800"}`}>
                                    {label}
                                    <button
                                      onClick={() => openEditModal(order.id, ev.status, isPending ? null : ev.details?.id ?? null)}
                                      className="w-4 h-4 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100"
                                    >
                                      <Pencil className="w-3 h-3 text-slate-400" />
                                    </button>
                                  </p>
                                  {hasDetails && ev.details && (
                                    <>
                                      <p className="mt-0.5 text-[12px] text-slate-400">
                                        {ev.status === "on_the_way" ? "Last updated " : ""}{formatDateTime(ev.details.createdAt)}
                                      </p>
                                      <p className="mt-0.5 text-[11px] text-[#9a9a9a] px-1">{ev.details.message}</p>
                                      {ev.details.location.length > 0 && (
                                        <div className="mt-1 flex flex-wrap gap-1 justify-center">
                                          {ev.details.location.map((loc, idx) => (
                                            <span key={idx} className="inline-flex items-center gap-0.5 text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                                              <MapPin className="w-2.5 h-2.5" />
                                              {loc}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  )}
                                  {isPending && <p className="mt-0.5 text-[11px] text-slate-300">Pending</p>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100">
                        <Link href={`/admin/invoice?order=${order.id}`} className="btn-gold btn-sm flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Generate Invoice</Link>
                        {nextSt.map((ns) => <button key={ns} onClick={() => updateStatus(order.id, ns)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${ACTION_STYLE[ns]}`}>{ACTION_LABEL[ns]}</button>)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setEditModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                Edit Tracking: {TRACKING_STATUS_OPTIONS.find((s) => s.value === editModal.status)?.label ?? editModal.status}
              </h3>
              <button onClick={() => setEditModal(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 font-medium">
                  {TRACKING_STATUS_OPTIONS.find((s) => s.value === editModal.status)?.label ?? editModal.status}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message</label>
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  maxLength={350}
                  placeholder="Add a status update..."
                  value={editModal.message}
                  onChange={(e) => setEditModal((prev) => prev ? { ...prev, message: e.target.value } : null)}
                />
                <p className="text-[10px] text-slate-400 mt-1 text-right">{editModal.message.length}/350</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Locations {editModal.status === "on_the_way" && <span className="text-xs text-slate-400 font-normal">(multiple allowed)</span>}
                </label>
                {editModal.locations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {editModal.locations.map((loc, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-sm text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {loc.city ? `${loc.city}, ${loc.state}` : loc.state}
                        <button onClick={() => removeLocation(idx)} className="ml-1 hover:bg-slate-200 rounded-full p-0.5 transition-colors">
                          <X className="w-3 h-3 text-slate-400" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <select
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={editModal.stateId}
                    onChange={(e) => {
                      setEditModal((prev) => prev ? { ...prev, stateId: e.target.value, cityId: "", cities: [] } : null);
                      if (e.target.value) loadCities(e.target.value);
                    }}
                  >
                    <option value="">Select state</option>
                    {editModal.states.map((s) => (
                      <option key={s.stateId} value={s.stateId}>{s.name}</option>
                    ))}
                  </select>
                  <select
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-300"
                    value={editModal.cityId}
                    onChange={(e) => setEditModal((prev) => prev ? { ...prev, cityId: e.target.value } : null)}
                    disabled={!editModal.stateId}
                  >
                    <option value="">Select city</option>
                    {editModal.cities.map((c) => (
                      <option key={c.cityId} value={c.cityId}>{c.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={addLocation}
                    disabled={!editModal.stateId}
                    className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setEditModal(null)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveTracking}
                disabled={editModal.loading || !editModal.message.trim()}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {editModal.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editModal.loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
