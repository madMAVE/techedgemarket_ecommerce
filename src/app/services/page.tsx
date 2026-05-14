"use client";
import {useState} from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StatusBadge from "@/components/ui/StatusBadge";
import AdminSidebar from "@/components/layout/AdminSidebar";
import {getAllServices} from "@/utils/data";
import {formatDate,SVC_STATUS_BADGE,SVC_STATUS_LABEL,SVC_PRIORITY_BADGE,SVC_PRIORITY_LABEL} from "@/utils/helpers";
import {Wrench,CheckCircle,Phone,ChevronRight,Zap,Plus,Search,AlertCircle} from "lucide-react";

const PUBLIC_SERVICES=[
  {icon:"💻",title:"PLC Programming & SCADA",items:["IEC 61131-3 logic design","HMI/SCADA development","TIA Portal, Studio 5000, GX Works","Remote monitoring setup"]},
  {icon:"🏭",title:"Panel Design & Build",items:["MCC & PDB fabrication","IS/IEC standards compliant","FAT & SAT support","Full as-built documentation"]},
  {icon:"⚙️",title:"Drive Commissioning",items:["ABB, Siemens, Allen-Bradley","Parameter configuration","Load & performance testing","On-site & remote support"]},
  {icon:"🛡️",title:"Safety System Services",items:["SIL assessment & validation","Safety PLC programming","Scanner & light curtain setup","CE marking support"]},
  {icon:"🔍",title:"Preventive Maintenance",items:["Annual AMC contracts","Thermal imaging surveys","Contact & relay inspection","Trip testing & reporting"]},
  {icon:"📊",title:"Power Quality Audit",items:["48hr power monitoring","Harmonic analysis reports","PFC & filter recommendations","Energy efficiency consulting"]},
];

export default function ServicesPage() {
  const tickets=getAllServices();
  const [showAdmin,setShowAdmin]=useState(false);
  const [search,setSearch]=useState("");
  const [statusF,setStatusF]=useState("all");

  const filtered=tickets.filter(t=>{
    const q=search.toLowerCase();
    return (!q||t.title.toLowerCase().includes(q)||t.company.toLowerCase().includes(q)||t.ticketNumber.toLowerCase().includes(q))&&(statusF==="all"||t.status===statusF);
  });

  if(showAdmin) return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar/>
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div><h1 className="page-title flex items-center gap-3"><Wrench className="w-7 h-7 text-primary-600"/>Service Tickets</h1><p className="page-sub">Field service & maintenance management</p></div>
            <div className="flex gap-3"><button onClick={()=>setShowAdmin(false)} className="btn-outline">← Public View</button><button className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>New Ticket</button></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[{l:"Total",v:tickets.length,cls:"text-slate-900"},{l:"Open",v:tickets.filter(t=>t.status==="open").length,cls:"text-red-600"},{l:"In Progress",v:tickets.filter(t=>t.status==="in_progress").length,cls:"text-amber-600"},{l:"Resolved",v:tickets.filter(t=>t.status==="resolved").length,cls:"text-emerald-600"}].map(m=>(
              <div key={m.l} className="stat-card text-center"><p className={`font-display font-bold text-3xl ${m.cls}`}>{m.v}</p><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{m.l}</p></div>
            ))}
          </div>
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input className="input pl-11" placeholder="Search tickets…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <select className="select w-auto" value={statusF} onChange={e=>setStatusF(e.target.value)}>
              <option value="all">All Status</option>
              {["open","in_progress","resolved","closed"].map(s=><option key={s} value={s}>{SVC_STATUS_LABEL[s as keyof typeof SVC_STATUS_LABEL]}</option>)}
            </select>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead><tr><th className="th">Ticket</th><th className="th">Title / Category</th><th className="th">Customer</th><th className="th">Priority</th><th className="th">Status</th><th className="th">Assigned To</th><th className="th text-center">Hours</th></tr></thead>
              <tbody>
                {filtered.map(t=>(
                  <tr key={t.id} className="tr">
                    <td className="td font-mono text-xs font-bold text-primary-600">{t.ticketNumber}</td>
                    <td className="td"><p className="font-medium text-slate-900 text-sm">{t.title}</p><p className="text-xs text-slate-400">{t.category}</p></td>
                    <td className="td"><p className="font-medium text-sm">{t.customer}</p><p className="text-xs text-slate-400">{t.company}</p></td>
                    <td className="td"><StatusBadge label={SVC_PRIORITY_LABEL[t.priority]} cls={SVC_PRIORITY_BADGE[t.priority]}/></td>
                    <td className="td"><StatusBadge label={SVC_STATUS_LABEL[t.status]} cls={SVC_STATUS_BADGE[t.status]}/></td>
                    <td className="td text-sm text-slate-600">{t.assignedTo||<span className="text-red-500 font-medium text-xs">Unassigned</span>}</td>
                    <td className="td text-center text-sm"><span className="font-bold">{t.actualHours??"–"}</span><span className="text-slate-400">/{t.estimatedHours}h</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar/>
      <div className="bg-primary-700 py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary-600 border border-primary-500 rounded-full px-4 py-1.5 mb-5"><Zap className="w-4 h-4 text-yellow-400"/><span className="text-primary-200 text-sm font-medium">4-Hour SLA · Pan-India Coverage</span></div>
          <h1 className="font-display font-bold text-5xl text-white mb-4">Engineering Services</h1>
          <p className="text-primary-300 text-lg max-w-2xl mx-auto">Certified engineers for automation, electrical and instrumentation work — from commissioning to long-term maintenance contracts.</p>
          <div className="flex gap-4 justify-center mt-8">
            <a href="tel:+914012345678" className="btn-gold btn-lg flex items-center gap-2"><Phone className="w-5 h-5"/>+91-40-1234-5678</a>
            <button onClick={()=>setShowAdmin(true)} className="bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-xl flex items-center gap-2 transition-all">Service Portal<ChevronRight className="w-4 h-4"/></button>
          </div>
        </div>
      </div>
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="font-display font-bold text-4xl text-slate-900 text-center mb-10">What We Offer</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PUBLIC_SERVICES.map(s=>(
            <div key={s.title} className="card p-6 hover:shadow-card-lg hover:border-primary-300 transition-all duration-200">
              <div className="text-4xl mb-4">{s.icon}</div>
              <h3 className="font-display font-bold text-xl text-slate-900 mb-3">{s.title}</h3>
              <ul className="space-y-1.5">{s.items.map(item=><li key={item} className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0"/>{item}</li>)}</ul>
              <button className="btn-outline w-full mt-5 btn-sm">Request Service</button>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-slate-50 py-14">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-display font-bold text-3xl text-slate-900 text-center mb-8">Service Level Agreement</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-primary-600 text-white"><th className="py-3 px-5 text-left font-bold">Priority</th><th className="py-3 px-5 text-left font-bold">Response Time</th><th className="py-3 px-5 text-left font-bold">Resolution Target</th><th className="py-3 px-5 text-left font-bold">Coverage</th></tr></thead>
              <tbody>
                {[["🔴 Critical","2 hours","8 hours","24×7"],["🟠 High","4 hours","Next business day","Mon–Sat"],["🟡 Medium","8 hours","3 business days","Mon–Fri"],["🟢 Low","1 business day","5 business days","Mon–Fri"]].map(([p,r,res,cov])=>(
                  <tr key={p} className="tr border-b border-slate-100"><td className="py-3 px-5 font-semibold">{p}</td><td className="py-3 px-5 text-primary-700 font-bold">{r}</td><td className="py-3 px-5">{res}</td><td className="py-3 px-5 text-slate-500">{cov}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <Footer/>
    </div>
  );
}
