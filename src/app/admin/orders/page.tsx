"use client";
import {useState} from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import StatusBadge from "@/components/ui/StatusBadge";
import {getAllOrders} from "@/utils/data";
import {formatINR,formatDate,ORDER_STATUS_BADGE,ORDER_STATUS_LABEL} from "@/utils/helpers";
import type {Order,OrderStatus} from "@/types";
import {CheckCircle,XCircle,Clock,Truck,Package,Search,FileText,ChevronDown,ChevronUp,RefreshCw,ArrowRight,MapPin,CreditCard,Hash,Calendar,AlertCircle} from "lucide-react";
import Link from "next/link";

const STATUS_FLOW:Record<OrderStatus,OrderStatus[]>={pending:["confirmed","cancelled"],confirmed:["processing","cancelled"],processing:["shipped","cancelled"],shipped:["delivered"],delivered:["refunded"],cancelled:[],refunded:[]};

const ACTION_STYLE:Record<OrderStatus,string>={
  confirmed:"bg-emerald-600 hover:bg-emerald-700 text-white",processing:"bg-primary-600 hover:bg-primary-700 text-white",
  shipped:"bg-purple-600 hover:bg-purple-700 text-white",delivered:"bg-emerald-600 hover:bg-emerald-700 text-white",
  cancelled:"bg-red-600 hover:bg-red-700 text-white",refunded:"bg-slate-500 hover:bg-slate-600 text-white",pending:"bg-amber-500 text-white",
};
const ACTION_LABEL:Record<OrderStatus,string>={confirmed:"✓ Accept",processing:"→ Processing",shipped:"🚚 Shipped",delivered:"✓ Delivered",cancelled:"✗ Cancel",refunded:"↩ Refund",pending:"Pending"};

export default function AdminOrdersPage() {
  const init=getAllOrders();
  const [orders,setOrders]=useState<Order[]>(init);
  const [search,setSearch]=useState(""); const [statusF,setStatusF]=useState("all"); const [expanded,setExpanded]=useState<string|null>(null);
  const [toast,setToast]=useState<{msg:string;ok:boolean}|null>(null);

  const showToast=(msg:string,ok=true)=>{setToast({msg,ok});setTimeout(()=>setToast(null),3000);};

  const updateStatus=(id:string,s:OrderStatus)=>{
    const now=new Date();
    setOrders(prev=>prev.map(o=>o.id!==id?o:{...o,status:s,trackingEvents:[{date:now.toISOString().split("T")[0],time:now.toTimeString().slice(0,5),status:s,location:"TechEdge HQ, Hyderabad",description:`Order ${ORDER_STATUS_LABEL[s]} by Admin`},...(o.trackingEvents||[])]}));
    showToast(`Order updated to "${ORDER_STATUS_LABEL[s]}"`);
  };

  const filtered=orders.filter(o=>{const q=search.toLowerCase();return(!q||o.orderNumber.toLowerCase().includes(q)||o.customer.company.toLowerCase().includes(q)||(o.poReference??"").toLowerCase().includes(q))&&(statusF==="all"||o.status===statusF);});
  const counts=orders.reduce((acc,o)=>{acc[o.status]=(acc[o.status]||0)+1;return acc;},{} as Record<string,number>);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar/>
      <main className="flex-1 p-8 overflow-auto">
        {toast&&<div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in ${toast.ok?"bg-emerald-600 text-white":"bg-red-600 text-white"}`}><CheckCircle className="w-4 h-4"/>{toast.msg}</div>}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between mb-8">
            <div><h1 className="page-title flex items-center gap-3"><Package className="w-7 h-7 text-primary-600"/>Order Management</h1><p className="page-sub">Accept, process and track all customer orders</p></div>
            <Link href="/admin/invoice" className="btn-gold flex items-center gap-2"><FileText className="w-4 h-4"/>Generate Invoice</Link>
          </div>
          {/* Status summary */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
            {(["pending","confirmed","processing","shipped","delivered","cancelled"] as OrderStatus[]).map(s=>(
              <button key={s} onClick={()=>setStatusF(statusF===s?"all":s)} className={`card p-3 text-center transition-all hover:shadow-card-lg ${statusF===s?"border-primary-400 bg-primary-50":""}`}>
                <p className="font-display font-bold text-2xl text-slate-900">{counts[s]||0}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{ORDER_STATUS_LABEL[s]}</p>
              </button>
            ))}
          </div>
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input className="input pl-11" placeholder="Search order, company, PO reference…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <select className="select w-auto min-w-44" value={statusF} onChange={e=>setStatusF(e.target.value)}>
              <option value="all">All Statuses</option>
              {(["pending","confirmed","processing","shipped","delivered","cancelled"] as OrderStatus[]).map(s=><option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <div className="space-y-4">
            {filtered.map(order=>{
              const nextSt=STATUS_FLOW[order.status]; const isOpen=expanded===order.id;
              return (
                <div key={order.id} className={`card overflow-hidden transition-all ${isOpen?"border-primary-300 shadow-card-lg":""}`}>
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-bold text-primary-600">{order.orderNumber}</span>
                        <StatusBadge label={ORDER_STATUS_LABEL[order.status]} cls={ORDER_STATUS_BADGE[order.status]}/>
                        {order.status==="pending"&&<span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-dot"/>Awaiting Acceptance</span>}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-1.5 text-sm text-slate-500">
                        <span className="font-semibold text-slate-800">{order.customer.company}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>{formatDate(order.date)}</span>
                        {order.poReference&&<span className="flex items-center gap-1 font-mono text-xs"><Hash className="w-3 h-3"/>PO: {order.poReference}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right"><p className="font-display font-bold text-2xl text-slate-900">{formatINR(order.total)}</p><p className="text-xs text-slate-400">{order.items.length} items</p></div>
                      <div className="flex gap-2">
                        {nextSt.slice(0,2).map(ns=><button key={ns} onClick={()=>updateStatus(order.id,ns)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${ACTION_STYLE[ns]}`}>{ACTION_LABEL[ns]}</button>)}
                        <button onClick={()=>setExpanded(isOpen?null:order.id)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
                          {isOpen?<ChevronUp className="w-4 h-4"/>:<ChevronDown className="w-4 h-4"/>}
                        </button>
                      </div>
                    </div>
                  </div>
                  {isOpen&&(
                    <div className="border-t border-slate-100 px-5 py-5 space-y-5 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[{t:"Customer",c:<><p className="font-bold text-slate-900 text-sm">{order.customer.name}</p><p className="text-xs text-slate-500">{order.customer.company}</p><p className="text-xs text-slate-400 mt-1">{order.customer.email}</p></>},
                          {t:"Ship To",c:<p className="text-sm text-slate-700 flex items-start gap-1.5"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400"/>{order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.zip}</p>},
                          {t:"Payment",c:<><p className="text-sm text-slate-700 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-slate-400"/>{order.paymentMethod}</p>{order.notes&&<p className="text-xs text-amber-600 mt-2 italic">📝 {order.notes}</p>}</>}
                        ].map(({t,c})=>(
                          <div key={t} className="bg-slate-50 rounded-xl p-4 border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t}</p>{c}</div>
                        ))}
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="w-full text-sm">
                          <thead><tr><th className="th">Product</th><th className="th">SKU</th><th className="th text-center">Qty</th><th className="th text-right">Unit</th><th className="th text-right">Total</th></tr></thead>
                          <tbody>
                            {order.items.map(item=>(
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
                      {order.trackingEvents.length>0&&(
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Order Timeline</p>
                          {order.trackingEvents.map((ev,i)=>(
                            <div key={i} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 text-xs ${i===0?"border-primary-500 bg-primary-50 text-primary-600":"border-slate-200 bg-white text-slate-400"}`}>{i===0?"●":"○"}</div>
                                {i<order.trackingEvents.length-1&&<div className="w-px flex-1 bg-slate-200 my-0.5"/>}
                              </div>
                              <div className="pb-3"><p className="font-semibold text-slate-800 text-sm">{ev.description}</p><p className="text-xs text-slate-400">{ev.location} · {formatDate(ev.date)} {ev.time}</p></div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100">
                        <Link href={`/admin/invoice?order=${order.id}`} className="btn-gold btn-sm flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/>Generate Invoice</Link>
                        {nextSt.map(ns=><button key={ns} onClick={()=>updateStatus(order.id,ns)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${ACTION_STYLE[ns]}`}>{ACTION_LABEL[ns]}</button>)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
