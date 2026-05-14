"use client";
import {useState} from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {getAllProducts} from "@/utils/data";
import {formatINR,calcCart} from "@/utils/helpers";
import {ShoppingCart,Trash2,Plus,Minus,ArrowRight,Truck,AlertCircle} from "lucide-react";

const DEMO=[{id:"p001",qty:2},{id:"p008",qty:3},{id:"p006",qty:1}];

export default function CartPage() {
  const all=getAllProducts();
  const [items,setItems]=useState(()=>DEMO.map(i=>({product:all.find(p=>p.id===i.id)!,qty:i.qty})).filter(i=>i.product));
  const totals=calcCart(items.map(i=>({product:i.product,quantity:i.qty})));
  const update=(idx:number,d:number)=>setItems(p=>p.map((i,j)=>j===idx?{...i,qty:Math.max(1,i.qty+d)}:i));
  const remove=(idx:number)=>setItems(p=>p.filter((_,j)=>j!==idx));
  if(!items.length) return (
    <div className="min-h-screen flex flex-col"><Navbar/>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-24">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center"><ShoppingCart className="w-10 h-10 text-slate-400"/></div>
        <h2 className="font-display font-bold text-3xl text-slate-800">Your cart is empty</h2>
        <Link href="/shop" className="btn-primary mt-2">Browse Products</Link>
      </div><Footer/></div>
  );
  return (
    <div className="min-h-screen flex flex-col bg-slate-50"><Navbar cartCount={totals.count}/>
      <div className="bg-primary-700 py-8"><div className="max-w-6xl mx-auto px-4">
        <h1 className="font-display font-bold text-3xl text-white">Shopping Cart</h1>
        <p className="text-primary-300 mt-1">{items.length} item{items.length>1?"s":""} · GST added at checkout</p>
      </div></div>
      <div className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {totals.subtotal<50000&&<div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4"><Truck className="w-5 h-5 text-blue-600 shrink-0"/><p className="text-sm text-blue-800">Add <strong>{formatINR(50000-totals.subtotal)}</strong> more for free shipping!</p></div>}
            {items.map((item,idx)=>(
              <div key={idx} className="card p-5 flex gap-5">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-50 shrink-0"><Image src={item.product.image} alt={item.product.name} fill className="object-cover" sizes="96px"/></div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div><p className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{item.product.brand}</p><h3 className="font-display font-bold text-slate-900 text-lg leading-tight">{item.product.name}</h3><p className="text-xs font-mono text-slate-400 mt-0.5">SKU: {item.product.sku}</p></div>
                    <button onClick={()=>remove(idx)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                      <button onClick={()=>update(idx,-1)} className="w-9 h-9 flex items-center justify-center hover:bg-slate-50 transition-colors"><Minus className="w-3.5 h-3.5"/></button>
                      <span className="w-10 text-center font-bold text-slate-900">{item.qty}</span>
                      <button onClick={()=>update(idx,1)} className="w-9 h-9 flex items-center justify-center hover:bg-slate-50 transition-colors"><Plus className="w-3.5 h-3.5"/></button>
                    </div>
                    <div className="text-right"><p className="font-display font-bold text-xl text-slate-900">{formatINR(item.product.price*item.qty)}</p><p className="text-xs text-slate-400">{formatINR(item.product.price)} each + GST</p></div>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4"><AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"/><p className="text-sm text-amber-800">Prices exclude GST (18%). For bulk orders contact our sales team for special pricing.</p></div>
          </div>
          <div className="space-y-4">
            <div className="card p-6">
              <h2 className="section-title mb-5">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-semibold">{formatINR(totals.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">GST (18%)</span><span className="font-semibold">{formatINR(totals.tax)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Shipping</span><span className={totals.shipping===0?"text-emerald-600 font-bold":"font-semibold"}>{totals.shipping===0?"FREE":formatINR(totals.shipping)}</span></div>
                <div className="divider pt-3 flex justify-between font-bold text-lg"><span>Total</span><span className="text-primary-700">{formatINR(totals.total)}</span></div>
              </div>
              <Link href="/checkout" className="btn-primary w-full mt-6 flex items-center justify-center gap-2 !py-3.5">Proceed to Checkout <ArrowRight className="w-4 h-4"/></Link>
              <Link href="/shop" className="btn-ghost w-full mt-2 text-center block text-sm">Continue Shopping</Link>
            </div>
            <div className="card p-5 space-y-3">
              {[["🔒","Secure Checkout","SSL encrypted, GST-compliant"],["📄","Tax Invoice","Auto-generated on order"],["🔄","7-Day Returns","On defective items"]].map(([icon,t,d])=>(
                <div key={t as string} className="flex items-center gap-3"><span className="text-2xl">{icon}</span><div><p className="text-sm font-bold text-slate-800">{t as string}</p><p className="text-xs text-slate-500">{d as string}</p></div></div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}
