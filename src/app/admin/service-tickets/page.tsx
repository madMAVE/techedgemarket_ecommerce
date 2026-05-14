"use client";
import {useState} from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import StatusBadge from "@/components/ui/StatusBadge";
import {getAllServices} from "@/utils/data";
import {formatDate,SVC_STATUS_BADGE,SVC_STATUS_LABEL,SVC_PRIORITY_BADGE,SVC_PRIORITY_LABEL} from "@/utils/helpers";
import type {ServiceTicket,ServiceStatus,ServicePriority} from "@/types";
import {Wrench,Plus,Search,ChevronDown,ChevronUp,CheckCircle,AlertCircle,User,Calendar,Tag,Building2,X,Send} from "lucide-react";

const ENGINEERS=["Suresh Kumar (Field Engineer)","Pradeep Iyer (Service Engineer)","Anil Sharma (Electrical Engineer)","Deepak Rao (Applications Engineer)","Kavita Bhat (Safety Specialist)","Rahul Nair (Instrumentation Engineer)"];
const CATS=["PLC Programming","Drive Commissioning","Safety Systems","Preventive Maintenance","Power Quality","Spare Parts & Repair","Panel Installation","Calibration","Remote Support"];
const STATUS_FLOW:Record<ServiceStatus,ServiceStatus[]>={open:["in_progress","closed"],in_progress:["resolved","open"],resolved:["closed","open"],closed:["open"]};
const PRIORITY_BORDER:Record<ServicePriority,string>={critical:"border-l-red-500",high:"border-l-amber-500",medium:"border-l-primary-400",low:"border-l-slate-300"};
const STATUS_BTN:Record<ServiceStatus,string>={open:"bg-red-600 hover:bg-red-700 text-white",in_progress:"bg-amber-500 hover:bg-amber-600 text-white",resolved:"bg-emerald-600 hover:bg-emerald-700 text-white",closed:"bg-slate-500 hover:bg-slate-600 text-white"};

function Modal({onClose,onSave}:{onClose:()=>void;onSave:(t:ServiceTicket)=>void}) {
  const [f,setF]=useState({title:"",desc:"",priority:"medium" as ServicePriority,cat:"PLC Programming",customer:"",company:"",eng:"",hours:4});
  const set=(k:string,v:string|number)=>setF(p=>({...p,[k]:v}));
  const save=()=>{
    if(!f.title||!f.customer||!f.company)return;
    const now=new Date();
    onSave({id:`svc-${Date.now()}`,ticketNumber:`TEM-SVC-${Math.floor(Math.random()*9000)+1000}`,title:f.title,description:f.desc,status:"open",priority:f.priority,category:f.cat,customer:f.customer,company:f.company,assignedTo:f.eng,createdDate:now.toISOString().split("T")[0],updatedDate:now.toISOString().split("T")[0],estimatedHours:f.hours});
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="card w-full max-w-xl max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-slate-100"><h2 className="section-title">New Service Ticket</h2><button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-500"/></button></div>
        <div className="p-6 space-y-4">
          <div><label className="label">Issue Title *</label><input className="input" placeholder="Brief description of the issue…" value={f.title} onChange={e=>set("title",e.target.value)}/></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Customer Name *</label><input className="input" placeholder="Contact name" value={f.customer} onChange={e=>set("customer",e.target.value)}/></div>
            <div><label className="label">Company *</label><input className="input" placeholder="Company name" value={f.company} onChange={e=>set("company",e.target.value)}/></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Priority</label><select className="select" value={f.priority} onChange={e=>set("priority",e.target.value)}>{(["critical","high","medium","low"] as ServicePriority[]).map(p=><option key={p} value={p}>{SVC_PRIORITY_LABEL[p]}</option>)}</select></div>
            <div><label className="label">Category</label><select className="select" value={f.cat} onChange={e=>set("cat",e.target.value)}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
          </div>
          <div><label className="label">Assign Engineer</label><select className="select" value={f.eng} onChange={e=>set("eng",e.target.value)}><option value="">— Unassigned —</option>{ENGINEERS.map(e=><option key={e}>{e}</option>)}</select></div>
          <div><label className="label">Estimated Hours</label><input type="number" min={1} max={100} className="input" value={f.hours} onChange={e=>set("hours",Number(e.target.value))}/></div>
          <div><label className="label">Description</label><textarea className="input resize-none" rows={3} placeholder="Describe the issue, equipment, error codes…" value={f.desc} onChange={e=>set("desc",e.target.value)}/></div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="btn-outline flex-1">Cancel</button>
          <button onClick={save} disabled={!f.title||!f.customer||!f.company} className="flex-1 btn-primary flex items-center justify-center gap-2"><Send className="w-4 h-4"/>Create Ticket</button>
        </div>
      </div>
    </div>
  );
}

export default function ServiceTicketsPage() {
  const init=getAllServices() as ServiceTicket[];
  const [tickets,setTickets]=useState<ServiceTicket[]>(init);
  const [search,setSearch]=useState(""); const [statusF,setStatusF]=useState("all"); const [priorityF,setPriorityF]=useState("all");
  const [expanded,setExpanded]=useState<string|null>(null); const [showModal,setShowModal]=useState(false);
  const [toast,setToast]=useState<string|null>(null);
  const msg=(m:string)=>{setToast(m);setTimeout(()=>setToast(null),3000);};

  const updateStatus=(id:string,s:ServiceStatus)=>{const now=new Date().toISOString().split("T")[0];setTickets(p=>p.map(t=>t.id===id?{...t,status:s,updatedDate:now,resolvedDate:s==="resolved"?now:t.resolvedDate}:t));msg(`Updated to "${SVC_STATUS_LABEL[s]}"`);}
  const assignEng=(id:string,eng:string)=>{setTickets(p=>p.map(t=>t.id===id?{...t,assignedTo:eng}:t));msg(eng?`Assigned to ${eng.split("(")[0].trim()}`:"Unassigned");}
  const updateHours=(id:string,h:number)=>setTickets(p=>p.map(t=>t.id===id?{...t,actualHours:h}:t));
  const addTicket=(t:ServiceTicket)=>{setTickets(p=>[t,...p]);msg(`Ticket ${t.ticketNumber} created`);}

  const filtered=tickets.filter(t=>{const q=search.toLowerCase();return(!q||t.title.toLowerCase().includes(q)||t.company.toLowerCase().includes(q)||t.ticketNumber.toLowerCase().includes(q))&&(statusF==="all"||t.status===statusF)&&(priorityF==="all"||t.priority===priorityF);});
  const c={open:tickets.filter(t=>t.status==="open").length,ip:tickets.filter(t=>t.status==="in_progress").length,res:tickets.filter(t=>t.status==="resolved").length,cl:tickets.filter(t=>t.status==="closed").length};
  const critical=tickets.filter(t=>t.priority==="critical"&&t.status==="open").length;
  const unassigned=tickets.filter(t=>t.status==="open"&&!t.assignedTo).length;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar/>
      {showModal&&<Modal onClose={()=>setShowModal(false)} onSave={addTicket}/>}
      {toast&&<div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm shadow-lg animate-fade-in"><CheckCircle className="w-4 h-4"/>{toast}</div>}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between mb-8">
            <div><h1 className="page-title flex items-center gap-3"><Wrench className="w-7 h-7 text-primary-600"/>Service Tickets</h1><p className="page-sub">Create, assign and resolve field service & maintenance tickets</p></div>
            <button onClick={()=>setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>New Ticket</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[{l:"Open",v:c.open,c:"text-red-600",bc:"border-red-200 bg-red-50"},{l:"In Progress",v:c.ip,c:"text-amber-600",bc:"border-amber-200 bg-amber-50"},{l:"Resolved",v:c.res,c:"text-emerald-600",bc:"border-emerald-200 bg-emerald-50"},{l:"Closed",v:c.cl,c:"text-slate-500",bc:""}].map(s=>(
              <button key={s.l} onClick={()=>setStatusF(statusF===s.l.toLowerCase().replace(" ","_")?"all":s.l.toLowerCase().replace(" ","_"))} className={`card p-4 text-center transition-all hover:shadow-card-lg ${s.bc}`}>
                <p className={`font-display font-bold text-3xl ${s.c}`}>{s.v}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.l}</p>
              </button>
            ))}
          </div>
          {(critical>0||unassigned>0)&&<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            {critical>0&&<div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"><AlertCircle className="w-5 h-5 text-red-500 shrink-0"/><div><p className="font-bold text-red-800 text-sm">{critical} Critical ticket{critical>1?"s":""} open</p><p className="text-red-600 text-xs">Requires immediate attention</p></div></div>}
            {unassigned>0&&<div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl"><User className="w-5 h-5 text-amber-500 shrink-0"/><div><p className="font-bold text-amber-800 text-sm">{unassigned} ticket{unassigned>1?"s":""} unassigned</p><p className="text-amber-600 text-xs">Assign an engineer to begin work</p></div></div>}
          </div>}
          <div className="flex gap-3 flex-wrap mb-4">
            <div className="relative flex-1 min-w-52"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input className="input pl-11" placeholder="Search ticket, title, company…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <select className="select w-auto min-w-40" value={statusF} onChange={e=>setStatusF(e.target.value)}><option value="all">All Status</option>{(["open","in_progress","resolved","closed"] as ServiceStatus[]).map(s=><option key={s} value={s}>{SVC_STATUS_LABEL[s]}</option>)}</select>
            <select className="select w-auto min-w-40" value={priorityF} onChange={e=>setPriorityF(e.target.value)}><option value="all">All Priority</option>{(["critical","high","medium","low"] as ServicePriority[]).map(p=><option key={p} value={p}>{SVC_PRIORITY_LABEL[p]}</option>)}</select>
          </div>
          <div className="space-y-3">
            {filtered.map(t=>{
              const isOpen=expanded===t.id; const next=STATUS_FLOW[t.status];
              return (
                <div key={t.id} className={`card overflow-hidden border-l-4 ${PRIORITY_BORDER[t.priority]} transition-all ${isOpen?"border-primary-300 shadow-card-lg":""}`}>
                  <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between cursor-pointer" onClick={()=>setExpanded(isOpen?null:t.id)}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap"><span className="font-mono text-xs font-bold text-primary-600">{t.ticketNumber}</span><StatusBadge label={SVC_STATUS_LABEL[t.status]} cls={SVC_STATUS_BADGE[t.status]}/><StatusBadge label={SVC_PRIORITY_LABEL[t.priority]} cls={SVC_PRIORITY_BADGE[t.priority]}/>{t.status==="open"&&!t.assignedTo&&<span className="text-[10px] text-red-500 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-dot"/>Unassigned</span>}</div>
                      <p className="font-display font-bold text-slate-900 text-base mt-1">{t.title}</p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3"/>{t.company}</span>
                        <span className="flex items-center gap-1"><Tag className="w-3 h-3"/>{t.category}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>{formatDate(t.createdDate)}</span>
                        {t.assignedTo&&<span className="flex items-center gap-1 text-primary-600"><User className="w-3 h-3"/>{t.assignedTo.split("(")[0].trim()}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right"><p className="text-sm font-bold text-slate-700">{t.actualHours??"–"}/{t.estimatedHours}h</p><p className="text-[10px] text-slate-400">actual/est.</p></div>
                      {isOpen?<ChevronUp className="w-4 h-4 text-slate-400"/>:<ChevronDown className="w-4 h-4 text-slate-400"/>}
                    </div>
                  </div>
                  {isOpen&&(
                    <div className="border-t border-slate-100 px-5 py-5 space-y-5 animate-fade-in">
                      {t.description&&<div className="bg-slate-50 rounded-xl p-4 border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Issue Description</p><p className="text-sm text-slate-700 leading-relaxed">{t.description}</p></div>}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div><label className="label">Assign Engineer</label><select className="select w-full mt-1" value={t.assignedTo||""} onChange={e=>assignEng(t.id,e.target.value)}><option value="">— Unassigned —</option>{ENGINEERS.map(e=><option key={e}>{e}</option>)}</select></div>
                        <div><label className="label">Actual Hours</label><input type="number" min={0} step={0.5} className="input mt-1" value={t.actualHours??""} placeholder="Hours spent" onChange={e=>updateHours(t.id,Number(e.target.value))}/></div>
                        <div><label className="label">Update Status</label><div className="flex flex-col gap-2 mt-1">{next.map(ns=><button key={ns} onClick={()=>updateStatus(t.id,ns)} className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${STATUS_BTN[ns]}`}>→ {SVC_STATUS_LABEL[ns]}</button>)}</div></div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        {[{l:"Customer",v:t.customer},{l:"Resolved",v:t.resolvedDate?formatDate(t.resolvedDate):"Pending"},{l:"Est. Hours",v:`${t.estimatedHours}h`},{l:"Updated",v:formatDate(t.updatedDate)}].map(m=>(
                          <div key={m.l} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{m.l}</p><p className="text-slate-800 font-semibold text-xs">{m.v}</p></div>
                        ))}
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
