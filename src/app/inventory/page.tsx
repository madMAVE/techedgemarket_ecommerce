"use client";
import {useState} from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import StatusBadge from "@/components/ui/StatusBadge";
import {getAllInventory} from "@/utils/data";
import {formatINR,STOCK_BADGE,STOCK_LABEL} from "@/utils/helpers";
import {Warehouse,Search,AlertTriangle,Download} from "lucide-react";

export default function InventoryPage() {
  const all=getAllInventory();
  const [search,setSearch]=useState(""); const [statusF,setStatusF]=useState("all"); const [catF,setCatF]=useState("all");
  const cats=Array.from(new Set(all.map(i=>i.category)));
  const filtered=all.filter(i=>{
    const q=search.toLowerCase();
    return (!q||i.productName.toLowerCase().includes(q)||i.sku.toLowerCase().includes(q)||i.partNumber.toLowerCase().includes(q))&&(statusF==="all"||i.status===statusF)&&(catF==="all"||i.category===catF);
  });
  const totalValue=all.reduce((s,i)=>s+i.totalValue,0);
  const low=all.filter(i=>i.status==="low_stock").length;
  const out=all.filter(i=>i.status==="out_of_stock").length;
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar/>
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between mb-8">
            <div><h1 className="page-title flex items-center gap-3"><Warehouse className="w-7 h-7 text-primary-600"/>Inventory</h1><p className="page-sub">Real-time stock levels across all warehouses</p></div>
            <button className="btn-outline flex items-center gap-2"><Download className="w-4 h-4"/>Export</button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="stat-card"><p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total SKUs</p><p className="font-display font-bold text-2xl text-slate-900 mt-1">{all.length}</p></div>
            <div className="stat-card"><p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Value</p><p className="font-display font-bold text-2xl text-slate-900 mt-1">{formatINR(totalValue)}</p></div>
            <div className={`stat-card ${low>0?"border-amber-300 bg-amber-50":""}`}><p className="text-xs text-amber-600 uppercase font-bold tracking-wider flex items-center gap-1"><AlertTriangle className="w-3 h-3"/>Low Stock</p><p className="font-display font-bold text-2xl text-amber-700 mt-1">{low}</p></div>
            <div className={`stat-card ${out>0?"border-red-300 bg-red-50":""}`}><p className="text-xs text-red-600 uppercase font-bold tracking-wider">Out of Stock</p><p className="font-display font-bold text-2xl text-red-700 mt-1">{out}</p></div>
          </div>
          {(low>0||out>0)&&<div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6"><AlertTriangle className="w-5 h-5 text-amber-600 shrink-0"/><p className="text-sm text-amber-800 font-medium">{out} item(s) out of stock and {low} below reorder point. Consider raising purchase orders.</p></div>}
          <div className="card p-4 mb-5 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input className="input pl-9" placeholder="Search SKU, part number, name…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <select className="select w-auto" value={statusF} onChange={e=>setStatusF(e.target.value)}><option value="all">All Status</option><option value="in_stock">In Stock</option><option value="low_stock">Low Stock</option><option value="out_of_stock">Out of Stock</option></select>
            <select className="select w-auto" value={catF} onChange={e=>setCatF(e.target.value)}><option value="all">All Categories</option>{cats.map(c=><option key={c}>{c}</option>)}</select>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr><th className="th">Product / SKU</th><th className="th">Brand</th><th className="th text-center">Current</th><th className="th text-center">Reserved</th><th className="th text-center">Available</th><th className="th text-center">Reorder Pt.</th><th className="th">Status</th><th className="th text-right">Value</th><th className="th">Location</th></tr></thead>
                <tbody>
                  {filtered.map(item=>{
                    const pct=Math.min(100,(item.availableStock/item.maxStock)*100);
                    return (
                      <tr key={item.id} className={`tr ${item.status!=="in_stock"?"bg-amber-50/40":""}`}>
                        <td className="td"><p className="font-medium text-slate-900 text-sm">{item.productName}</p><p className="text-xs font-mono text-slate-400">{item.sku}</p><p className="text-xs font-mono text-slate-400">PN: {item.partNumber}</p></td>
                        <td className="td text-sm font-medium">{item.brand}</td>
                        <td className="td text-center font-bold">{item.currentStock}</td>
                        <td className="td text-center text-amber-600 font-semibold">{item.reservedStock}</td>
                        <td className="td text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold text-slate-900">{item.availableStock}</span>
                            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${pct>50?"bg-emerald-400":pct>20?"bg-amber-400":"bg-red-400"}`} style={{width:`${pct}%`}}/></div>
                          </div>
                        </td>
                        <td className="td text-center text-slate-500">{item.reorderPoint}</td>
                        <td className="td"><StatusBadge label={STOCK_LABEL[item.status]} cls={STOCK_BADGE[item.status]}/></td>
                        <td className="td text-right font-bold">{formatINR(item.totalValue)}</td>
                        <td className="td text-xs font-mono text-slate-500">{item.location}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
