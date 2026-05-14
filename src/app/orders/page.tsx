"use client";
import {useState} from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StatusBadge from "@/components/ui/StatusBadge";
import {getAllOrders} from "@/utils/data";
import {formatINR,formatDate,ORDER_STATUS_BADGE,ORDER_STATUS_LABEL} from "@/utils/helpers";
import type {Order,OrderStatus} from "@/types";
import {Package,Search,ChevronDown,ChevronUp,Truck,CheckCircle,Clock,MapPin,AlertCircle,Hash,Calendar,CreditCard,FileText} from "lucide-react";
import Link from "next/link";

const TRACK_ICON:Record<string,React.ReactNode>={
  delivered:<CheckCircle className="w-4 h-4 text-emerald-500"/>,
  out_for_delivery:<Truck className="w-4 h-4 text-blue-500"/>,
  shipped:<Package className="w-4 h-4 text-purple-500"/>,
  in_transit:<Truck className="w-4 h-4 text-indigo-400"/>,
  processing:<Clock className="w-4 h-4 text-amber-500"/>,
  confirmed:<CheckCircle className="w-4 h-4 text-blue-400"/>,
};

export default function OrdersPage() {
  const orders=getAllOrders();
  const [search,setSearch]=useState("");
  const [statusF,setStatusF]=useState("all");
  const [expanded,setExpanded]=useState<string|null>(null);

  const filtered=orders.filter(o=>{
    const q=search.toLowerCase();
    return (!q||o.orderNumber.toLowerCase().includes(q)||o.customer.company.toLowerCase().includes(q)||(o.poReference??"").toLowerCase().includes(q))&&(statusF==="all"||o.status===statusF);
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar/>
      <div className="bg-primary-700 py-10"><div className="max-w-5xl mx-auto px-4">
        <h1 className="font-display font-bold text-4xl text-white">My Orders</h1>
        <p className="text-primary-300 mt-1">Track deliveries and view order history</p>
      </div></div>
      <div className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input className="input pl-11" placeholder="Search order number, company, PO reference…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <select className="select w-auto min-w-44" value={statusF} onChange={e=>setStatusF(e.target.value)}>
            <option value="all">All Statuses</option>
            {(["pending","confirmed","processing","shipped","delivered","cancelled"] as OrderStatus[]).map(s=><option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
          </select>
        </div>
        {filtered.length===0?(
          <div className="text-center py-24"><Package className="w-12 h-12 mx-auto mb-3 text-slate-300"/><p className="font-display font-bold text-2xl text-slate-500">No orders found</p></div>
        ):(
          <div className="space-y-4">
            {filtered.map(order=>{
              const isOpen=expanded===order.id;
              return (
                <div key={order.id} className={`card overflow-hidden transition-all ${isOpen?"border-primary-300 shadow-card-lg":""}`}>
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-display font-bold text-slate-900 text-lg">{order.orderNumber}</span>
                          <StatusBadge label={ORDER_STATUS_LABEL[order.status]} cls={ORDER_STATUS_BADGE[order.status]}/>
                        </div>
                        <div className="text-sm text-slate-500 mt-1 flex flex-wrap gap-4">
                          <span className="font-medium text-slate-700">{order.customer.company}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>{formatDate(order.date)}</span>
                          {order.poReference&&<span className="flex items-center gap-1 font-mono text-xs"><Hash className="w-3 h-3"/>PO: {order.poReference}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-display font-bold text-xl text-slate-900">{formatINR(order.total)}</p>
                          <p className="text-xs text-slate-400">{order.items.length} line item{order.items.length>1?"s":""}</p>
                        </div>
                        <button onClick={()=>setExpanded(isOpen?null:order.id)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                          {isOpen?<ChevronUp className="w-5 h-5 text-slate-500"/>:<ChevronDown className="w-5 h-5 text-slate-500"/>}
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {order.items.map(item=>(
                        <span key={item.sku} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-mono">{item.productName.split(" ").slice(0,3).join(" ")} ×{item.quantity}</span>
                      ))}
                    </div>
                  </div>
                  {isOpen&&(
                    <div className="border-t border-slate-100 px-5 pb-5 animate-fade-in">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 text-sm mb-5">
                        <div><p className="text-xs text-slate-400 mb-1">Payment</p><p className="font-medium text-slate-800">{order.paymentMethod}</p></div>
                        <div><p className="text-xs text-slate-400 mb-1">Ship To</p><p className="font-medium text-slate-800">{order.shippingAddress.city}, {order.shippingAddress.state}</p></div>
                        <div><p className="text-xs text-slate-400 mb-1">Subtotal</p><p className="font-medium text-slate-800">{formatINR(order.subtotal)}</p></div>
                        <div><p className="text-xs text-slate-400 mb-1">GST</p><p className="font-medium text-slate-800">{formatINR(order.tax)}</p></div>
                      </div>
                      {/* Items table */}
                      <div className="overflow-x-auto rounded-xl border border-slate-100 mb-5">
                        <table className="w-full text-sm">
                          <thead><tr><th className="th">Product</th><th className="th">SKU</th><th className="th text-center">Qty</th><th className="th text-right">Unit</th><th className="th text-right">Total</th></tr></thead>
                          <tbody>
                            {order.items.map(item=>(
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
                      {/* Tracking */}
                      {order.trackingNumber&&(
                        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                          <Truck className="w-4 h-4 text-blue-600 shrink-0"/>
                          <div><p className="text-xs text-blue-500 font-bold uppercase tracking-wider">Tracking Number</p><p className="font-mono font-bold text-blue-800 text-sm">{order.trackingNumber}</p></div>
                          {order.estimatedDelivery&&<div className="ml-auto text-right"><p className="text-xs text-blue-500">Est. Delivery</p><p className="font-bold text-sm text-blue-800">{formatDate(order.estimatedDelivery)}</p></div>}
                        </div>
                      )}
                      {order.trackingEvents.length>0&&(
                        <div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Order Timeline</p>
                          {order.trackingEvents.map((ev,i)=>(
                            <div key={i} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${i===0?"border-primary-500 bg-primary-50":"border-slate-200 bg-white"}`}>
                                  {TRACK_ICON[ev.status]||<MapPin className="w-3.5 h-3.5 text-slate-400"/>}
                                </div>
                                {i<order.trackingEvents.length-1&&<div className="w-px flex-1 bg-slate-200 my-1"/>}
                              </div>
                              <div className="pb-4">
                                <p className="font-semibold text-slate-800 text-sm">{ev.description}</p>
                                <p className="text-xs text-slate-500">{ev.location} · {formatDate(ev.date)} {ev.time}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="pt-3 border-t border-slate-100">
                        <Link href={`/admin/invoice?order=${order.id}`} className="btn-outline btn-sm flex items-center gap-1.5 w-fit"><FileText className="w-3.5 h-3.5"/>Download Invoice</Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer/>
    </div>
  );
}
