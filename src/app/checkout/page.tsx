"use client";
import {useState} from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {formatINR} from "@/utils/helpers";
import {CheckCircle,CreditCard,Landmark,Building2,ChevronRight,Lock,Package,Truck} from "lucide-react";

const ITEMS=[{name:"Siemens SIMATIC S7-1200 PLC",qty:2,price:970,sku:"SIE-S7-1200"},{name:"Allen-Bradley PowerFlex 525 VFD",qty:3,price:2625,sku:"AB-PF525"},{name:"Sick S300 Safety Scanner",qty:1,price:2100,sku:"SICK-S300"}];
const sub=ITEMS.reduce((s,i)=>s+i.price,0); const gst=sub*0.18; const total=sub+gst;
type Step=0|1|2;
export default function CheckoutPage() {
  const [step,setStep]=useState<Step>(0); const [done,setDone]=useState(false);
  const [form,setForm]=useState({company:"",gst:"",name:"",email:"",phone:"",address:"",city:"",state:"",zip:"",po:"",notes:"",pay:"bank"});
  const set=(k:string,v:string)=>setForm(f=>({...f,[k]:v}));
  if(done) return (
    <div className="min-h-screen flex flex-col"><Navbar/>
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-10 h-10 text-green-600"/></div>
          <h2 className="font-display font-bold text-3xl text-slate-900 mb-2">Order Confirmed!</h2>
          <p className="text-slate-500 mb-2">Order <strong>TEM-2025-00148</strong> has been placed successfully.</p>
          <p className="text-slate-400 text-sm mb-8">You will receive a confirmation email with GST invoice and delivery details.</p>
          <div className="flex gap-3 justify-center"><Link href="/orders" className="btn-primary">Track My Order</Link><Link href="/shop" className="btn-outline">Continue Shopping</Link></div>
        </div>
      </div><Footer/></div>
  );
  const steps=["Shipping","Payment","Review"];
  return (
    <div className="min-h-screen flex flex-col bg-slate-50"><Navbar/>
      <div className="bg-primary-700 py-8"><div className="max-w-6xl mx-auto px-4"><h1 className="font-display font-bold text-3xl text-white">Checkout</h1></div></div>
      <div className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="flex items-center gap-3 mb-8">
          {steps.map((s,i)=>(
            <div key={s} className="flex items-center gap-3">
              <button onClick={()=>i<step?setStep(i as Step):undefined} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${i===step?"bg-primary-600 text-white":i<step?"bg-green-100 text-green-700":"bg-slate-100 text-slate-400"}`}>
                {i<step?<CheckCircle className="w-4 h-4"/>:<span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs">{i+1}</span>}{s}
              </button>
              {i<steps.length-1&&<ChevronRight className="w-4 h-4 text-slate-300"/>}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            {step===0&&(
              <div className="card p-6 animate-fade-in">
                <h2 className="section-title mb-5 flex items-center gap-2"><Truck className="w-5 h-5 text-primary-600"/>Delivery Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2"><label className="label">Company Name *</label><input className="input" value={form.company} onChange={e=>set("company",e.target.value)} placeholder="Indopack Machines Pvt. Ltd."/></div>
                  <div><label className="label">GSTIN</label><input className="input" value={form.gst} onChange={e=>set("gst",e.target.value)} placeholder="36AABCT1234Z1Z5"/></div>
                  <div><label className="label">PO Reference</label><input className="input" value={form.po} onChange={e=>set("po",e.target.value)} placeholder="Your PO number"/></div>
                  <div><label className="label">Contact Name *</label><input className="input" value={form.name} onChange={e=>set("name",e.target.value)}/></div>
                  <div><label className="label">Phone *</label><input className="input" value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+91-"/></div>
                  <div className="sm:col-span-2"><label className="label">Email *</label><input className="input" value={form.email} onChange={e=>set("email",e.target.value)}/></div>
                  <div className="sm:col-span-2"><label className="label">Delivery Address *</label><textarea className="input resize-none" rows={2} value={form.address} onChange={e=>set("address",e.target.value)}/></div>
                  <div><label className="label">City *</label><input className="input" value={form.city} onChange={e=>set("city",e.target.value)}/></div>
                  <div><label className="label">State *</label><input className="input" value={form.state} onChange={e=>set("state",e.target.value)}/></div>
                  <div><label className="label">PIN Code *</label><input className="input" value={form.zip} onChange={e=>set("zip",e.target.value)}/></div>
                  <div><label className="label">Country</label><input className="input bg-slate-50" value="India" readOnly/></div>
                </div>
                <button onClick={()=>setStep(1)} className="btn-primary mt-6 flex items-center gap-2">Continue to Payment<ChevronRight className="w-4 h-4"/></button>
              </div>
            )}
            {step===1&&(
              <div className="card p-6 animate-fade-in">
                <h2 className="section-title mb-5 flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary-600"/>Payment Method</h2>
                <div className="space-y-3">
                  {[{id:"bank",icon:<Landmark className="w-5 h-5"/>,title:"Bank Transfer (NEFT/RTGS)",desc:"Standard B2B payment. We send bank details with proforma invoice."},{id:"lc",icon:<Building2 className="w-5 h-5"/>,title:"Letter of Credit (LC)",desc:"For large orders. Submit LC copy after order confirmation."},{id:"card",icon:<CreditCard className="w-5 h-5"/>,title:"Credit / Debit Card",desc:"Instant payment. 1.8% processing fee applies."}].map(opt=>(
                    <label key={opt.id} className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${form.pay===opt.id?"border-primary-500 bg-primary-50":"border-slate-200 hover:border-slate-300 bg-white"}`}>
                      <input type="radio" name="pay" value={opt.id} checked={form.pay===opt.id} onChange={()=>set("pay",opt.id)} className="mt-1 accent-primary-600"/>
                      <span className={form.pay===opt.id?"text-primary-600":"text-slate-400"}>{opt.icon}</span>
                      <div><p className="font-semibold text-slate-900 text-sm">{opt.title}</p><p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p></div>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3 mt-6"><button onClick={()=>setStep(0)} className="btn-outline">Back</button><button onClick={()=>setStep(2)} className="btn-primary flex items-center gap-2">Review Order<ChevronRight className="w-4 h-4"/></button></div>
              </div>
            )}
            {step===2&&(
              <div className="card p-6 animate-fade-in space-y-5">
                <h2 className="section-title flex items-center gap-2"><Package className="w-5 h-5 text-primary-600"/>Review & Confirm</h2>
                <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-2">
                  <div className="flex justify-between"><span className="text-slate-500">Deliver to:</span><span className="font-medium text-right">{form.company||"—"}<br/>{form.city}, {form.state}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Payment:</span><span className="font-medium">{form.pay==="bank"?"Bank Transfer":form.pay==="lc"?"Letter of Credit":"Card"}</span></div>
                  {form.po&&<div className="flex justify-between"><span className="text-slate-500">PO Ref:</span><span className="font-mono font-medium">{form.po}</span></div>}
                </div>
                {ITEMS.map(i=>(
                  <div key={i.sku} className="flex items-center justify-between py-2 border-b border-slate-100">
                    <div><p className="text-sm font-medium text-slate-900">{i.name}</p><p className="text-xs text-slate-400 font-mono">{i.sku} × {i.qty}</p></div>
                    <span className="font-semibold text-slate-900">{formatINR(i.price)}</span>
                  </div>
                ))}
                <div className="flex items-start gap-2 bg-amber-50 rounded-xl p-3 text-xs text-amber-800 border border-amber-200"><Lock className="w-3.5 h-3.5 shrink-0 mt-0.5"/>By placing this order you agree to TechEdge Market's Terms of Sale. GST invoice generated on dispatch.</div>
                <div className="flex gap-3"><button onClick={()=>setStep(1)} className="btn-outline">Back</button><button onClick={()=>setDone(true)} className="btn-primary flex-1 flex items-center justify-center gap-2"><Lock className="w-4 h-4"/>Place Order — {formatINR(total)}</button></div>
              </div>
            )}
          </div>
          <div className="card p-5 h-fit sticky top-24">
            <h3 className="section-title mb-4">Order Summary</h3>
            <div className="space-y-2 mb-4">{ITEMS.map(i=><div key={i.sku} className="flex justify-between text-sm"><span className="text-slate-600 truncate mr-2">{i.name.split(" ").slice(0,3).join(" ")}…</span><span className="font-medium shrink-0">{formatINR(i.price)}</span></div>)}</div>
            <div className="divider pt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatINR(sub)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">GST (18%)</span><span>{formatINR(gst)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Shipping</span><span className="text-emerald-600 font-semibold">FREE</span></div>
              <div className="flex justify-between font-bold text-base border-t border-slate-100 pt-2 mt-1"><span>Total</span><span className="text-primary-700">{formatINR(total)}</span></div>
            </div>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}
