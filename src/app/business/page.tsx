import AdminSidebar from "@/components/layout/AdminSidebar";
import StatCard from "@/components/ui/StatCard";
import {getAnalytics} from "@/utils/data";
import {formatINR,formatCompact,formatPercent} from "@/utils/helpers";
import {BarChart3,TrendingUp,Users,ShoppingBag,Target,Wrench,Award} from "lucide-react";

export default function BusinessPage() {
  const {overview,monthlySales,categorySales,topProducts,serviceMetrics}=getAnalytics();
  const maxR=Math.max(...monthlySales.map(m=>m.revenue));
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar/>
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8"><h1 className="page-title flex items-center gap-3"><BarChart3 className="w-7 h-7 text-primary-600"/>Business Intelligence</h1><p className="page-sub">TechEdge Market Pvt. Ltd. · FY 2024–25 Performance Report</p></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <StatCard title="Total Revenue" value={formatCompact(overview.totalRevenue)} change={overview.revenueChange} icon={<TrendingUp className="w-5 h-5"/>} iconBg="bg-primary-50 text-primary-600"/>
            <StatCard title="Gross Profit" value={formatCompact(overview.totalRevenue*overview.grossMargin/100)} change={overview.marginChange} icon={<Award className="w-5 h-5"/>} iconBg="bg-emerald-50 text-emerald-600"/>
            <StatCard title="Avg. Order Value" value={formatINR(overview.avgOrderValue)} change={overview.aovChange} icon={<ShoppingBag className="w-5 h-5"/>} iconBg="bg-purple-50 text-purple-600"/>
            <StatCard title="Total Customers" value={overview.totalCustomers.toString()} change={overview.customersChange} icon={<Users className="w-5 h-5"/>} iconBg="bg-cyan-50 text-cyan-600"/>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
            <div className="lg:col-span-3 card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="section-title">Monthly Revenue</h2>
                <div className="flex items-center gap-4 text-xs"><span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary-500 inline-block"/>Revenue</span><span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-200 inline-block"/>Profit</span></div>
              </div>
              <div className="flex items-end gap-1.5 h-48 mb-3">
                {monthlySales.map(m=>{
                  const rH=(m.revenue/maxR)*180; const pH=(m.profit/maxR)*180;
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center group cursor-default">
                      <div className="relative w-full flex flex-col-reverse items-center gap-0.5" style={{height:"180px"}}>
                        <div className="w-full rounded-t-sm bg-emerald-100 border border-emerald-200" style={{height:`${pH}px`}}/>
                        <div className="w-full rounded-t-md bg-primary-500 group-hover:bg-primary-600 transition-colors relative" style={{height:`${rH}px`}}>
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">{formatCompact(m.revenue)}</div>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold mt-1">{m.month}</span>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                {[{l:"Total Revenue",v:formatCompact(overview.totalRevenue)},{l:"Total Orders",v:overview.totalOrders.toLocaleString("en-IN")},{l:"Gross Margin",v:`${overview.grossMargin}%`}].map(s=>(
                  <div key={s.l} className="text-center"><p className="font-display font-bold text-xl text-slate-900">{s.v}</p><p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">{s.l}</p></div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2 card p-6">
              <h2 className="section-title mb-6">Category Breakdown</h2>
              <div className="space-y-4">
                {categorySales.map(c=>(
                  <div key={c.category}>
                    <div className="flex justify-between items-center mb-1.5"><span className="text-sm font-semibold text-slate-700 truncate">{c.category}</span><div className="flex items-center gap-2 ml-2 shrink-0"><span className="text-xs font-bold text-emerald-600">+{c.growth}%</span><span className="text-xs text-slate-400">{c.percentage}%</span></div></div>
                    <div className="progress-track h-2"><div className="progress-bar bg-gradient-to-r from-primary-500 to-primary-400" style={{width:`${c.percentage}%`}}/></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="card p-6">
              <h2 className="section-title mb-5 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-primary-600"/>Order Metrics</h2>
              <div className="space-y-3">
                {[{l:"Total Orders",v:overview.totalOrders.toLocaleString("en-IN"),ch:overview.ordersChange},{l:"Avg. Order Value",v:formatINR(overview.avgOrderValue),ch:overview.aovChange},{l:"Gross Margin",v:`${overview.grossMargin}%`,ch:overview.marginChange},{l:"Open Tickets",v:overview.openServiceTickets.toString(),ch:overview.serviceChange}].map(r=>(
                  <div key={r.l} className="flex justify-between items-center py-2.5 border-b border-slate-50">
                    <span className="text-sm text-slate-600">{r.l}</span>
                    <div className="flex items-center gap-2"><span className="font-display font-bold text-slate-900">{r.v}</span><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${r.ch>=0?"bg-emerald-50 text-emerald-700":"bg-red-50 text-red-700"}`}>{formatPercent(r.ch)}</span></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-6">
              <h2 className="section-title mb-5 flex items-center gap-2"><Users className="w-5 h-5 text-primary-600"/>Customer Metrics</h2>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[{l:"Total",v:overview.totalCustomers},{l:"New (FY)",v:287},{l:"Returning",v:647},{l:"VIP/Enterprise",v:42}].map(m=>(
                  <div key={m.l} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100"><p className="font-display font-bold text-2xl text-slate-900">{m.v}</p><p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">{m.l}</p></div>
                ))}
              </div>
              {[{l:"Avg. LTV",v:"₹4,85,200"},{l:"Churn Rate",v:"3.2%"},{l:"CSAT Score",v:"4.6/5.0"}].map(m=>(
                <div key={m.l} className="flex justify-between text-sm py-2 border-b border-slate-50"><span className="text-slate-500">{m.l}</span><span className="font-bold text-slate-900">{m.v}</span></div>
              ))}
            </div>
            <div className="card p-6">
              <h2 className="section-title mb-5 flex items-center gap-2"><Wrench className="w-5 h-5 text-primary-600"/>Service Performance</h2>
              <div className="space-y-3 mb-5">
                {[{l:"Total",v:serviceMetrics.totalTickets,pct:100,c:"bg-slate-300"},{l:"Resolved",v:serviceMetrics.resolved,pct:Math.round(serviceMetrics.resolved/serviceMetrics.totalTickets*100),c:"bg-emerald-400"},{l:"In Progress",v:serviceMetrics.inProgress,pct:Math.round(serviceMetrics.inProgress/serviceMetrics.totalTickets*100),c:"bg-amber-400"},{l:"Open",v:serviceMetrics.open,pct:Math.round(serviceMetrics.open/serviceMetrics.totalTickets*100),c:"bg-red-400"}].map(m=>(
                  <div key={m.l}><div className="flex justify-between text-sm mb-1"><span className="text-slate-500">{m.l}</span><span className="font-bold text-slate-900">{m.v}</span></div><div className="progress-track h-1.5"><div className={`progress-bar ${m.c}`} style={{width:`${m.pct}%`}}/></div></div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                {[{l:"Avg Resolution",v:`${serviceMetrics.avgResolutionHours}h`},{l:"CSAT Score",v:`${serviceMetrics.customerSatisfaction}/5`}].map(m=>(
                  <div key={m.l} className="bg-slate-50 rounded-xl p-3 text-center"><p className="font-display font-bold text-xl text-primary-600">{m.v}</p><p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">{m.l}</p></div>
                ))}
              </div>
            </div>
          </div>
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2"><Target className="w-5 h-5 text-primary-600"/><h2 className="section-title">Top 5 Revenue Drivers</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr><th className="th w-10">#</th><th className="th">Product</th><th className="th text-center">Units</th><th className="th text-right">Revenue</th><th className="th text-right">Growth</th><th className="th w-32">Share</th></tr></thead>
                <tbody>
                  {topProducts.map((p,i)=>{
                    const total=topProducts.reduce((s,x)=>s+x.revenue,0);
                    const share=Math.round(p.revenue/total*100);
                    return (
                      <tr key={p.id} className="tr">
                        <td className="td"><span className="w-7 h-7 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-xs font-black">{i+1}</span></td>
                        <td className="td font-medium text-slate-900 text-sm">{p.name}</td>
                        <td className="td text-center font-bold">{p.units.toLocaleString("en-IN")}</td>
                        <td className="td text-right font-display font-bold text-slate-900">{formatINR(p.revenue)}</td>
                        <td className="td text-right"><span className="text-emerald-600 font-bold">+{p.growth}%</span></td>
                        <td className="td"><div className="flex items-center gap-2"><div className="flex-1 progress-track h-1.5"><div className="progress-bar bg-primary-400" style={{width:`${share}%`}}/></div><span className="text-xs text-slate-400">{share}%</span></div></td>
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
