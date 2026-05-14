"use client";
import {useState} from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import StatusBadge from "@/components/ui/StatusBadge";
import {getAllProspects} from "@/utils/data";
import {formatINR,formatDate,PROSPECT_BADGE,PROSPECT_LABEL} from "@/utils/helpers";
import type {Prospect,ProspectStatus} from "@/types";
import {Users,Plus,Search,Phone,Mail,Calendar,Tag,TrendingUp} from "lucide-react";

const STAGES:ProspectStatus[]=["new","contacted","qualified","proposal","negotiation"];

export default function ProspectsPage() {
  const all=getAllProspects();
  const [search,setSearch]=useState(""); const [statusF,setStatusF]=useState("all"); const [view,setView]=useState<"grid"|"pipeline">("grid");
  const filtered=all.filter(p=>{const q=search.toLowerCase();return(!q||p.name.toLowerCase().includes(q)||p.company.toLowerCase().includes(q))&&(statusF==="all"||p.status===statusF);});
  const pipeline=all.filter(p=>!["won","lost"].includes(p.status)).reduce((s,p)=>s+p.value*(p.probability/100),0);
  const won=all.filter(p=>p.status==="won").reduce((s,p)=>s+p.value,0);
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar/>
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between mb-8">
            <div><h1 className="page-title flex items-center gap-3"><Users className="w-7 h-7 text-primary-600"/>Prospects & CRM</h1><p className="page-sub">Sales pipeline for industrial automation clients</p></div>
            <button className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>New Prospect</button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="stat-card"><p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total</p><p className="font-display font-bold text-2xl mt-1">{all.length}</p></div>
            <div className="stat-card"><p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Weighted Pipeline</p><p className="font-display font-bold text-2xl mt-1 text-primary-700">{formatINR(pipeline)}</p></div>
            <div className="stat-card border-emerald-200 bg-emerald-50"><p className="text-xs text-emerald-600 uppercase font-bold tracking-wider flex items-center gap-1"><TrendingUp className="w-3 h-3"/>Closed Won</p><p className="font-display font-bold text-2xl text-emerald-700 mt-1">{formatINR(won)}</p></div>
            <div className="stat-card"><p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Win Rate</p><p className="font-display font-bold text-2xl mt-1">{Math.round((all.filter(p=>p.status==="won").length/(all.filter(p=>["won","lost"].includes(p.status)).length||1))*100)}%</p></div>
          </div>
          <div className="card p-4 mb-5 flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input className="input pl-9" placeholder="Search by name, company…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <select className="select w-auto" value={statusF} onChange={e=>setStatusF(e.target.value)}>
              <option value="all">All Stages</option>
              {(Object.keys(PROSPECT_LABEL) as ProspectStatus[]).map(v=><option key={v} value={v}>{PROSPECT_LABEL[v]}</option>)}
            </select>
            <div className="flex border border-slate-200 rounded-xl overflow-hidden">
              {(["grid","pipeline"] as const).map(v=><button key={v} onClick={()=>setView(v)} className={`px-4 py-2 text-sm font-semibold capitalize transition-all ${view===v?"bg-primary-600 text-white":"bg-white text-slate-600 hover:bg-slate-50"}`}>{v}</button>)}
            </div>
          </div>
          {view==="pipeline"?(
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4" style={{minWidth:"900px"}}>
                {STAGES.map(stage=>{
                  const sp=all.filter(p=>p.status===stage);
                  return (
                    <div key={stage} className="flex-1 min-w-44">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-wider">{PROSPECT_LABEL[stage]}</span>
                        <span className="badge badge-gray">{sp.length}</span>
                      </div>
                      <div className="space-y-3">
                        {sp.map(p=>(
                          <div key={p.id} className="card p-3 cursor-pointer card-hover">
                            <p className="font-semibold text-slate-900 text-sm">{p.name}</p>
                            <p className="text-xs text-primary-600">{p.company}</p>
                            <p className="text-xs text-slate-500 mt-1">{formatINR(p.value)}</p>
                          </div>
                        ))}
                        {!sp.length&&<div className="border-2 border-dashed border-slate-200 rounded-xl h-14 flex items-center justify-center text-xs text-slate-300">Empty</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ):(
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map(p=>(
                <div key={p.id} className="card p-5 card-hover">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1"><div className="flex items-center gap-2 flex-wrap"><span className="font-display font-bold text-slate-900">{p.name}</span><StatusBadge label={PROSPECT_LABEL[p.status]} cls={PROSPECT_BADGE[p.status]}/></div><p className="text-sm text-primary-600 font-medium">{p.company}</p><p className="text-xs text-slate-500">{p.industry}</p></div>
                    <div className="text-right"><p className="font-display font-bold text-xl text-slate-900">{formatINR(p.value)}</p><p className="text-xs text-slate-500">{p.probability}% prob.</p></div>
                  </div>
                  <div className="progress-track h-1.5 mb-4"><div className={`progress-bar ${p.probability>=70?"bg-emerald-400":p.probability>=40?"bg-amber-400":"bg-red-400"}`} style={{width:`${p.probability}%`}}/></div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-3">
                    <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400"/><span className="truncate">{p.email}</span></div>
                    <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400"/>{p.phone}</div>
                    <div className="flex items-center gap-1.5"><Tag className="w-3 h-3 text-slate-400"/>Source: {p.source}</div>
                    <div className="flex items-center gap-1.5"><Users className="w-3 h-3 text-slate-400"/>{p.assignedTo.split(" ")[0]}</div>
                  </div>
                  {p.nextFollowUp&&<div className="flex items-center gap-1 text-xs text-primary-600 font-medium"><Calendar className="w-3 h-3"/>Follow-up: {formatDate(p.nextFollowUp)}</div>}
                  {p.tags.length>0&&<div className="flex flex-wrap gap-1 mt-3">{p.tags.slice(0,3).map(t=><span key={t} className="tag">{t}</span>)}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
