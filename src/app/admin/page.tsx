import AdminSidebar from "@/components/layout/AdminSidebar";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import {getAnalytics,getAllOrders,getLowStock,getOpenServices} from "@/utils/data";
import {formatINR,formatCompact,formatDate,ORDER_STATUS_BADGE,ORDER_STATUS_LABEL} from "@/utils/helpers";
import {TrendingUp,ShoppingBag,Users,BarChart3,AlertTriangle,Wrench,ArrowRight,Package,CheckCircle} from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const {overview,categorySales,topProducts}=getAnalytics();
  const orders=getAllOrders();
  const lowStock=getLowStock();
  const openSvc=getOpenServices();
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar/>
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div><h1 className="font-display font-bold text-3xl text-slate-900">Operations Dashboard</h1><p className="text-slate-500 text-sm mt-0.5">Welcome back, Vikram · TechEdge Market</p></div>
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot"/><span className="text-emerald-700 text-sm font-semibold">All Systems Live</span></div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <StatCard title="Annual Revenue" value={formatCompact(overview.totalRevenue)} change={overview.revenueChange} icon={<TrendingUp className="w-5 h-5"/>} iconBg="bg-primary-50 text-primary-600"/>
            <StatCard title="Total Orders" value={overview.totalOrders.toLocaleString("en-IN")} change={overview.ordersChange} icon={<ShoppingBag className="w-5 h-5"/>} iconBg="bg-purple-50 text-purple-600"/>
            <StatCard title="Active Clients" value={overview.totalCustomers.toString()} change={overview.customersChange} icon={<Users className="w-5 h-5"/>} iconBg="bg-cyan-50 text-cyan-600"/>
            <StatCard title="Gross Margin" value={`${overview.grossMargin}%`} change={overview.marginChange} icon={<BarChart3 className="w-5 h-5"/>} iconBg="bg-emerald-50 text-emerald-600"/>
          </div>
          {(lowStock.length>0||openSvc.length>0)&&(
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {lowStock.length>0&&<div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl"><div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5 text-amber-600"/></div><div className="flex-1"><p className="font-bold text-amber-800 text-sm">{lowStock.length} SKUs Need Restocking</p><p className="text-amber-600 text-xs mt-0.5">Low stock or out of stock</p></div><Link href="/inventory" className="text-amber-600 hover:text-amber-800"><ArrowRight className="w-4 h-4"/></Link></div>}
              {openSvc.length>0&&<div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-2xl"><div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0"><Wrench className="w-5 h-5 text-red-600"/></div><div className="flex-1"><p className="font-bold text-red-800 text-sm">{openSvc.length} Service Tickets Open</p><p className="text-red-600 text-xs mt-0.5">Require engineer assignment</p></div><Link href="/admin/service-tickets" className="text-red-600 hover:text-red-800"><ArrowRight className="w-4 h-4"/></Link></div>}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 card overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between"><h2 className="section-title">Recent Orders</h2><Link href="/admin/orders" className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">Manage All<ArrowRight className="w-3.5 h-3.5"/></Link></div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr><th className="th">Order</th><th className="th">Customer</th><th className="th">Status</th><th className="th text-right">Amount</th></tr></thead>
                  <tbody>
                    {orders.map(o=>(
                      <tr key={o.id} className="tr">
                        <td className="td"><p className="font-mono text-xs font-bold text-primary-600">{o.orderNumber}</p><p className="text-xs text-slate-400">{formatDate(o.date)}</p></td>
                        <td className="td"><p className="font-medium text-slate-900 text-sm">{o.customer.name}</p><p className="text-xs text-slate-400 truncate max-w-[150px]">{o.customer.company}</p></td>
                        <td className="td"><StatusBadge label={ORDER_STATUS_LABEL[o.status]} cls={ORDER_STATUS_BADGE[o.status]}/></td>
                        <td className="td text-right font-display font-bold text-slate-900">{formatINR(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card p-6">
              <h2 className="section-title mb-5">Category Performance</h2>
              <div className="space-y-4">
                {categorySales.slice(0,6).map(c=>(
                  <div key={c.category}>
                    <div className="flex justify-between text-sm mb-1.5"><span className="font-medium text-slate-700 truncate">{c.category}</span><span className="text-emerald-600 font-bold ml-2 shrink-0">+{c.growth}%</span></div>
                    <div className="progress-track h-2"><div className="progress-bar bg-gradient-to-r from-primary-500 to-primary-400" style={{width:`${c.percentage}%`}}/></div>
                    <div className="flex justify-between mt-1"><span className="text-[10px] text-slate-400">{c.percentage}%</span><span className="text-[10px] text-slate-400">{formatCompact(c.sales)}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[{icon:<Package className="w-4 h-4"/>,l:"Inventory Value",v:"₹98.5L",c:"text-cyan-600",bg:"bg-cyan-50"},{icon:<ShoppingBag className="w-4 h-4"/>,l:"Pending POs",v:overview.pendingPOs.toString(),c:"text-amber-600",bg:"bg-amber-50"},{icon:<CheckCircle className="w-4 h-4"/>,l:"Pipeline Value",v:"₹1.42Cr",c:"text-emerald-600",bg:"bg-emerald-50"},{icon:<Users className="w-4 h-4"/>,l:"CSAT Score",v:"4.6/5",c:"text-purple-600",bg:"bg-purple-50"}].map(m=>(
              <div key={m.l} className="card p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center ${m.c} shrink-0`}>{m.icon}</div>
                <div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{m.l}</p><p className={`font-display font-bold text-xl ${m.c} mt-0.5`}>{m.v}</p></div>
              </div>
            ))}
          </div>
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-100"><h2 className="section-title">Top Products — FY 2024–25</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr><th className="th w-10">#</th><th className="th">Product</th><th className="th text-center">Units</th><th className="th text-right">Revenue</th><th className="th text-right">Growth</th></tr></thead>
                <tbody>
                  {topProducts.map((p,i)=>(
                    <tr key={p.id} className="tr">
                      <td className="td"><span className="w-7 h-7 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-xs font-black">{i+1}</span></td>
                      <td className="td font-medium text-slate-900 text-sm">{p.name}</td>
                      <td className="td text-center font-bold">{p.units.toLocaleString("en-IN")}</td>
                      <td className="td text-right font-display font-bold">{formatINR(p.revenue)}</td>
                      <td className="td text-right"><span className="text-emerald-600 font-bold">+{p.growth}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
