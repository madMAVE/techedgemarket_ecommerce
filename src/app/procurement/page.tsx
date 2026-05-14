"use client";
import {useState} from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import StatusBadge from "@/components/ui/StatusBadge";
import {getAllProcurement} from "@/utils/data";
import {formatINR,formatDate,PROC_BADGE,PROC_LABEL} from "@/utils/helpers";
import type {ProcurementOrder,ProcurementStatus} from "@/types";
import {Truck,Plus,Search,ChevronDown,ChevronUp,Star,Calendar,FileText} from "lucide-react";

export default function ProcurementPage() {
  const pos=getAllProcurement();
  const [search,setSearch]=useState(""); const [statusF,setStatusF]=useState("all"); const [expanded,setExpanded]=useState<string|null>(null);
  const filtered=pos.filter(p=>{const q=search.toLowerCase();return(!q||p.poNumber.toLowerCase().includes(q)||p.supplier.name.toLowerCase().includes(q))&&(statusF==="all"||p.status===statusF);});
  const totalValue=pos.reduce((s,p)=>s+p.totalAmount,0);
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar/>
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between mb-8">
            <div><h1 className="page-title flex items-center gap-3"><Truck className="w-7 h-7 text-primary-600"/>Procurement</h1><p className="page-sub">Purchase orders & supplier management</p></div>
            <button className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>New PO</button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="stat-card"><p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total POs</p><p className="font-display font-bold text-2xl mt-1">{pos.length}</p></div>
            <div className="stat-card"><p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Value</p><p className="font-display font-bold text-2xl mt-1">{formatINR(totalValue)}</p></div>
            <div className="stat-card border-amber-200 bg-amber-50"><p className="text-xs text-amber-600 uppercase font-bold tracking-wider">Pending</p><p className="font-display font-bold text-2xl text-amber-700 mt-1">{pos.filter(p=>["submitted","approved","ordered"].includes(p.status)).length}</p></div>
            <div className="stat-card border-emerald-200 bg-emerald-50"><p className="text-xs text-emerald-600 uppercase font-bold tracking-wider">Received</p><p className="font-display font-bold text-2xl text-emerald-700 mt-1">{pos.filter(p=>p.status==="received").length}</p></div>
          </div>
          <div className="card p-4 mb-5 flex gap-3">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input className="input pl-9" placeholder="Search PO number or supplier…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <select className="select w-auto" value={statusF} onChange={e=>setStatusF(e.target.value)}>
              <option value="all">All Statuses</option>
              {(Object.keys(PROC_LABEL) as ProcurementStatus[]).map(v=><option key={v} value={v}>{PROC_LABEL[v]}</option>)}
            </select>
          </div>
          <div className="space-y-4">
            {filtered.map(po=>{
              const isOpen=expanded===po.id;
              return (
                <div key={po.id} className={`card overflow-hidden transition-all ${isOpen?"border-primary-300 shadow-card-lg":""}`}>
                  <div className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center gap-3 justify-between" onClick={()=>setExpanded(isOpen?null:po.id)}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-display font-bold text-slate-900 text-lg">{po.poNumber}</span>
                        <StatusBadge label={PROC_LABEL[po.status]} cls={PROC_BADGE[po.status]}/>
                      </div>
                      <div className="text-sm text-slate-500 mt-1 flex flex-wrap gap-3">
                        <span className="font-medium text-slate-700">{po.supplier.name}</span>
                        <span>·</span><span>Requested {formatDate(po.requestDate)}</span>
                        <span>·</span><span>By {po.requestedBy}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right"><p className="font-display font-bold text-xl text-slate-900">{formatINR(po.totalAmount)}</p><p className="text-xs text-slate-400">{po.items.length} items</p></div>
                      {isOpen?<ChevronUp className="w-5 h-5 text-slate-400"/>:<ChevronDown className="w-5 h-5 text-slate-400"/>}
                    </div>
                  </div>
                  {isOpen&&(
                    <div className="border-t border-slate-100 p-5 space-y-5 animate-fade-in">
                      <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div><p className="text-xs text-slate-400 mb-1">Supplier</p><p className="font-semibold">{po.supplier.name}</p></div>
                        <div><p className="text-xs text-slate-400 mb-1">Category</p><p className="font-medium">{po.supplier.category}</p></div>
                        <div><p className="text-xs text-slate-400 mb-1">Lead Time</p><p className="font-medium">{po.supplier.leadTimeDays} days</p></div>
                        <div><p className="text-xs text-slate-400 mb-1">Rating</p><div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400"/><span className="font-semibold">{po.supplier.rating}</span></div></div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm">
                        {[{l:"Requested",d:po.requestDate},{l:"Approved",d:po.approvedDate},{l:"Expected",d:po.expectedDate},{l:"Received",d:po.receivedDate}].map(({l,d})=>(
                          <div key={l} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-400"/>
                            <div><p className="text-[10px] text-slate-400 uppercase font-bold">{l}</p><p className="font-medium text-slate-800">{d?formatDate(d):"—"}</p></div>
                          </div>
                        ))}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr><th className="th">Product</th><th className="th">SKU / Part No.</th><th className="th text-center">Qty</th><th className="th text-right">Unit Cost</th><th className="th text-right">Total</th></tr></thead>
                          <tbody>
                            {po.items.map(item=>(
                              <tr key={item.sku} className="tr">
                                <td className="td font-medium">{item.productName}</td>
                                <td className="td"><p className="font-mono text-xs">{item.sku}</p><p className="font-mono text-xs text-slate-400">{item.partNumber}</p></td>
                                <td className="td text-center font-bold">{item.quantity}</td>
                                <td className="td text-right">{formatINR(item.unitCost)}</td>
                                <td className="td text-right font-bold text-slate-900">{formatINR(item.totalCost)}</td>
                              </tr>
                            ))}
                            <tr className="bg-primary-50"><td colSpan={4} className="td text-right font-bold">Total PO Value</td><td className="td text-right font-display font-bold text-lg text-primary-700">{formatINR(po.totalAmount)}</td></tr>
                          </tbody>
                        </table>
                      </div>
                      {po.notes&&<div className="flex gap-2 text-sm text-slate-600 bg-amber-50 border border-amber-100 rounded-xl p-3"><FileText className="w-4 h-4 text-amber-500 shrink-0"/>{po.notes}</div>}
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
