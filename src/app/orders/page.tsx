"use client";
import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StatusBadge from "@/components/ui/StatusBadge";
import { api } from "@/lib/interceptor";
import { formatINR, formatDate, ORDER_STATUS_BADGE, ORDER_STATUS_LABEL } from "@/utils/helpers";
import type { OrderStatus } from "@/types";
import { Package, Search, ChevronDown, ChevronUp, Truck, CheckCircle, Clock, MapPin, AlertCircle, Hash, Calendar, CreditCard, FileText, Shield, Loader2, Phone } from "lucide-react";
import Link from "next/link";

interface BackendOrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface BackendOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  mobile: string;
  orgAddress: { street: string; city: string; state: string; zip: string; country: string };
  shippingAddress: { street: string; city: string; state: string; zip: string; country: string };
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
  items: BackendOrderItem[];
}

type Step = "mobile" | "otp" | "orders";

export default function OrdersPage() {
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const mobileRegex = /^[6-9]\d{9}$/;

  const handleSendOtp = async () => {
    setError("");
    if (!mobileRegex.test(mobile)) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }

    setSendingOtp(true);
    try {
      const res = await api.post<any>("/api/orders/otp/send", { mobile });
      const token = res.data?.otpToken ?? res.data?.data?.otpToken;
      setOtpToken(token || "");
      setStep("otp");
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    if (otp.length < 6) return;

    setVerifying(true);
    try {
      const res = await api.post<any>("/api/orders/by-mobile", { mobile, otp });
      const data = res.data?.data ?? res.data;
      setOrders(data.orders ?? []);
      setStep("orders");
    } catch (e: any) {
      setError(e.response?.data?.message || "OTP verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleReset = () => {
    setStep("mobile");
    setMobile("");
    setOtp("");
    setOtpToken("");
    setError("");
    setOrders([]);
    setExpanded(null);
  };

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    return (!q || o.orderNumber.toLowerCase().includes(q) || o.customerCompany.toLowerCase().includes(q) || (o.poReference ?? "").toLowerCase().includes(q)) && (statusF === "all" || o.status === statusF);
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="bg-primary-700 py-10"><div className="max-w-5xl mx-auto px-4">
        <h1 className="font-display font-bold text-4xl text-white">My Orders</h1>
        <p className="text-primary-300 mt-1">Track deliveries and view order history</p>
      </div></div>
      <div className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
        {step === "mobile" && (
          <div className="card p-6 animate-fade-in max-w-md mx-auto">
            <h2 className="section-title flex items-center gap-2 mb-2">
              <Phone className="w-5 h-5 text-primary-600" />Enter Mobile Number
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              We will send a 6-digit OTP to verify your identity
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Mobile Number</label>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">+91</span>
                <input
                  className="input flex-1"
                  value={mobile}
                  onChange={e => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9876543210"
                  maxLength={10}
                  autoFocus
                />
              </div>
            </div>
            {error && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}
            <button
              onClick={handleSendOtp}
              disabled={sendingOtp || mobile.length < 10}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingOtp ? <><Loader2 className="w-4 h-4 animate-spin" />Sending OTP...</> : <><Shield className="w-4 h-4" />Send OTP</>}
            </button>
          </div>
        )}

        {step === "otp" && (
          <div className="card p-6 animate-fade-in max-w-md mx-auto">
            <h2 className="section-title flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-primary-600" />OTP Verification
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Enter the OTP sent to <span className="font-semibold text-slate-700">+91 {mobile}</span>
            </p>
            <div className="max-w-xs mx-auto mb-6">
              <input
                className="input text-center text-3xl font-mono tracking-widest py-4"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                autoFocus
              />
              <p className="text-xs text-slate-400 text-center mt-2">
                Enter the 6-digit OTP sent to your mobile
              </p>
            </div>
            {error && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setStep("mobile"); setOtp(""); setError(""); }} className="btn-outline flex-1">Back</button>
              <button onClick={handleVerifyOtp} disabled={verifying || otp.length < 6}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {verifying ? <><Loader2 className="w-4 h-4 animate-spin" />Verifying...</>
                  : <><CheckCircle className="w-4 h-4" />Verify & View Orders</>}
              </button>
            </div>
            <div className="text-center mt-4">
              <button onClick={handleSendOtp} disabled={sendingOtp}
                className="text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50">
                {sendingOtp ? "Sending..." : "Resend OTP"}
              </button>
            </div>
          </div>
        )}

        {step === "orders" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-slate-500">Orders for <span className="font-semibold text-slate-700">+91 {mobile}</span></p>
                <p className="text-lg font-bold text-slate-900">{orders.length} order{orders.length !== 1 ? "s" : ""} found</p>
              </div>
              <button onClick={handleReset} className="btn-outline btn-sm flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />Change Number
              </button>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-24">
                <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-display font-bold text-2xl text-slate-500">{orders.length === 0 ? "No orders found for this mobile number" : "No matching orders"}</p>
                {orders.length > 0 && <p className="text-sm text-slate-400 mt-2">Try adjusting your search or filters</p>}
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input className="input pl-11" placeholder="Search order number, company, PO reference…" value={search} onChange={e => setSearch(e.target.value)} /></div>
                  <select className="select w-auto min-w-44" value={statusF} onChange={e => setStatusF(e.target.value)}>
                    <option value="all">All Statuses</option>
                    {(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as OrderStatus[]).map(s => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
                  </select>
                </div>
                <div className="space-y-4">
                  {filtered.map(order => {
                    const isOpen = expanded === order.id;
                    return (
                      <div key={order.id} className={`card overflow-hidden transition-all ${isOpen ? "border-primary-300 shadow-card-lg" : ""}`}>
                        <div className="p-5">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="font-display font-bold text-slate-900 text-lg">{order.orderNumber}</span>
                                <StatusBadge label={ORDER_STATUS_LABEL[order.status]} cls={ORDER_STATUS_BADGE[order.status]} />
                              </div>
                              <div className="text-sm text-slate-500 mt-1 flex flex-wrap gap-4">
                                <span className="font-medium text-slate-700">{order.customerCompany}</span>
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(order.createdAt)}</span>
                                {order.poReference && <span className="flex items-center gap-1 font-mono text-xs"><Hash className="w-3 h-3" />PO: {order.poReference}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-display font-bold text-xl text-slate-900">{formatINR(order.totalAmount)}</p>
                                <p className="text-xs text-slate-400">{order.items.length} line item{order.items.length > 1 ? "s" : ""}</p>
                              </div>
                              <button onClick={() => setExpanded(isOpen ? null : order.id)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                                {isOpen ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                              </button>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {order.items.map(item => (
                              <span key={item.sku} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-mono">{item.productName.split(" ").slice(0, 3).join(" ")} ×{item.quantity}</span>
                            ))}
                          </div>
                        </div>
                        {isOpen && (
                          <div className="border-t border-slate-100 px-5 pb-5 animate-fade-in">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 text-sm mb-5">
                              <div><p className="text-xs text-slate-400 mb-1">Payment</p><p className="font-medium text-slate-800">{order.paymentMethod}</p></div>
                              <div><p className="text-xs text-slate-400 mb-1">Ship To</p><p className="font-medium text-slate-800">{order.shippingAddress.city}, {order.shippingAddress.state}</p></div>
                              <div><p className="text-xs text-slate-400 mb-1">Subtotal</p><p className="font-medium text-slate-800">{formatINR(order.subtotal)}</p></div>
                              <div><p className="text-xs text-slate-400 mb-1">GST</p><p className="font-medium text-slate-800">{formatINR(order.taxAmount)}</p></div>
                            </div>
                            <div className="overflow-x-auto rounded-xl border border-slate-100 mb-5">
                              <table className="w-full text-sm">
                                <thead><tr><th className="th">Product</th><th className="th">SKU</th><th className="th text-center">Qty</th><th className="th text-right">Unit</th><th className="th text-right">Total</th></tr></thead>
                                <tbody>
                                  {order.items.map(item => (
                                    <tr key={item.sku} className="tr">
                                      <td className="td font-medium text-slate-900">{item.productName}</td>
                                      <td className="td font-mono text-xs text-slate-400">{item.sku}</td>
                                      <td className="td text-center font-bold">{item.quantity}</td>
                                      <td className="td text-right">{formatINR(item.unitPrice)}</td>
                                      <td className="td text-right font-bold text-slate-900">{formatINR(item.totalPrice)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {order.trackingNumber && (
                              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                                <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                                <div><p className="text-xs text-blue-500 font-bold uppercase tracking-wider">Tracking Number</p><p className="font-mono font-bold text-blue-800 text-sm">{order.trackingNumber}</p></div>
                                {order.estimatedDelivery && <div className="ml-auto text-right"><p className="text-xs text-blue-500">Est. Delivery</p><p className="font-bold text-sm text-blue-800">{formatDate(order.estimatedDelivery)}</p></div>}
                              </div>
                            )}
                            {order.notes && (
                              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div><p className="text-xs text-amber-500 font-bold uppercase tracking-wider">Notes</p><p className="text-sm text-amber-800">{order.notes}</p></div>
                              </div>
                            )}
                            <div className="pt-3 border-t border-slate-100">
                              <Link href={`/admin/invoice?order=${order.id}`} className="btn-outline btn-sm flex items-center gap-1.5 w-fit"><FileText className="w-3.5 h-3.5" />Download Invoice</Link>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
