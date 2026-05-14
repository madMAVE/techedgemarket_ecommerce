"use client";
import { useState, useRef } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { getAllProducts } from "@/utils/data";
import { formatINR } from "@/utils/helpers";
import type { Product } from "@/types";
import {
  Calculator, Plus, Trash2, Printer, CheckCircle,
  Star, Users, Tag, ChevronDown, Search, FileText, Package
} from "lucide-react";

const VIP_TIERS = [
  { label: "Standard",        discount: 0,    minValue: 0,        badge: "—",        color: "text-iron-400",   bg: "bg-iron-100" },
  { label: "Silver Partner",  discount: 5,    minValue: 50000,    badge: "SILVER",   color: "text-iron-500",   bg: "bg-iron-200" },
  { label: "Gold Partner",    discount: 8,    minValue: 150000,   badge: "GOLD",     color: "text-gold-700",   bg: "bg-gold-100" },
  { label: "Platinum VIP",    discount: 12,   minValue: 500000,   badge: "PLATINUM", color: "text-cyan-700",   bg: "bg-cyan-100" },
  { label: "Diamond VIP",     discount: 15,   minValue: 1000000,  badge: "DIAMOND",  color: "text-purple-700", bg: "bg-purple-100" },
];

const CUSTOMERS = [
  { id: "c001", name: "Raj Mehta",          company: "Indopack Machines Pvt. Ltd.",  tier: 2, totalSpent: 2840000, gstin: "27AABCI1234B1Z5" },
  { id: "c002", name: "Priya Nair",         company: "GreenPower Electrical",         tier: 1, totalSpent: 680000,  gstin: "33AABCG5678D1Z8" },
  { id: "c003", name: "Sameer Kulkarni",    company: "AutoTek Manufacturing",         tier: 3, totalSpent: 8200000, gstin: "24AABCA9012F1Z2" },
  { id: "c004", name: "Meena Shah",         company: "Flexitron Automation",          tier: 1, totalSpent: 450000,  gstin: "07AABCF3456H1Z6" },
  { id: "c005", name: "Ravi Krishnamurthy", company: "Reliance Industries Ltd.",      tier: 4, totalSpent: 54000000,gstin: "27AABCR7890J1Z3" },
];

interface LineItem { product: Product; qty: number; overridePrice?: number; }

function numberToWords(n: number): string {
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  if (n === 0) return "Zero";
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? " " + ones[n%10] : "");
  if (n < 1000) return ones[Math.floor(n/100)] + " Hundred" + (n%100 ? " " + numberToWords(n%100) : "");
  if (n < 100000) return numberToWords(Math.floor(n/1000)) + " Thousand" + (n%1000 ? " " + numberToWords(n%1000) : "");
  if (n < 10000000) return numberToWords(Math.floor(n/100000)) + " Lakh" + (n%100000 ? " " + numberToWords(n%100000) : "");
  return numberToWords(Math.floor(n/10000000)) + " Crore" + (n%10000000 ? " " + numberToWords(n%10000000) : "");
}

export default function EstimationPage() {
  const allProducts = getAllProducts();
  const [custId, setCustId]     = useState(CUSTOMERS[2].id);
  const [items, setItems]       = useState<LineItem[]>([]);
  const [extraDisc, setExtraDisc] = useState(0);
  const [notes, setNotes]       = useState("");
  const [validDays, setValidDays] = useState(30);
  const [searchQ, setSearchQ]   = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [estNo]                 = useState(`TEM/EST/25-${String(Math.floor(Math.random() * 9000) + 1000)}`);
  const today                   = new Date().toISOString().split("T")[0];
  const validUntil              = new Date(Date.now() + validDays * 86400000).toISOString().split("T")[0];

  const customer    = CUSTOMERS.find(c => c.id === custId) || CUSTOMERS[0];
  const tier        = VIP_TIERS[customer.tier];
  const tierDisc    = tier.discount;
  const totalDisc   = Math.min(tierDisc + extraDisc, 30);

  const grossTotal  = items.reduce((s, i) => s + (i.overridePrice ?? i.product.price) * i.qty, 0);
  const discAmount  = grossTotal * (totalDisc / 100);
  const taxable     = grossTotal - discAmount;
  const gst         = taxable * 0.18;
  const grandTotal  = taxable + gst;

  const addItem = (product: Product) => {
    setItems(prev => {
      const ex = prev.find(i => i.product.id === product.id);
      if (ex) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });
    setShowPicker(false);
    setSearchQ("");
    setGenerated(false);
  };

  const filteredProds = allProducts.filter(p => {
    const q = searchQ.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.partNumber.toLowerCase().includes(q);
  });

  const handlePrint = () => {
    const el = document.getElementById("est-print");
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Estimation ${estNo}</title>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>@page{margin:0;size:A4}body{margin:0;padding:0}*{box-sizing:border-box}</style>
    </head><body>${el.outerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 600);
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#0a0f1e" }}>
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="border-b border-white/5 px-8 py-5 flex items-center justify-between" style={{ background: "rgba(15,23,42,0.7)" }}>
          <div>
            <h1 className="font-display font-bold text-2xl text-white tracking-wide flex items-center gap-3">
              <Calculator className="w-6 h-6 text-gold-400" /> Estimation & Quotation
            </h1>
            <p className="text-iron-500 text-sm mt-0.5">Generate price estimations with VIP partner discounts</p>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-screen-2xl mx-auto">

          {/* ─── LEFT: Builder ─── */}
          <div className="xl:col-span-2 space-y-6">

            {/* Customer select + VIP tier */}
            <div className="card-dark rounded-2xl p-6">
              <h3 className="section-title-dark mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-navy-400" />Customer & Tier</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="label-dark">Select Customer</label>
                  <select className="input-dark w-full rounded-xl mt-1" value={custId} onChange={e => { setCustId(e.target.value); setGenerated(false); }}>
                    {CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.company} — {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-dark">Additional Discount %</label>
                  <input type="number" min={0} max={20} className="input-dark w-full rounded-xl mt-1"
                    value={extraDisc} onChange={e => { setExtraDisc(Number(e.target.value)); setGenerated(false); }} />
                </div>
              </div>

              {/* VIP tier display */}
              <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-gold-400" />
                  <div>
                    <p className="font-bold text-white text-sm">{tier.label}</p>
                    <p className="text-xs text-iron-400">Total spent: ₹{(customer.totalSpent / 100000).toFixed(1)}L · GSTIN: {customer.gstin}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-black px-3 py-1.5 rounded-full border ${tier.color} ${tier.bg}`}>{tier.badge}</span>
                  <p className="text-sm font-bold text-gold-400 mt-1">{tierDisc}% base + {extraDisc}% extra = <span className="text-lg">{totalDisc}%</span> off</p>
                </div>
              </div>

              {/* VIP tier guide */}
              <div className="mt-4 grid grid-cols-5 gap-1.5">
                {VIP_TIERS.map((t, i) => (
                  <div key={t.label} className={`rounded-lg p-2 text-center border text-[10px] font-bold ${customer.tier === i ? "border-gold-400 bg-gold-500/10" : "border-white/5"}`}
                    style={{ background: customer.tier === i ? undefined : "rgba(255,255,255,0.02)" }}>
                    <p className={customer.tier === i ? "text-gold-400" : "text-iron-500"}>{t.label}</p>
                    <p className={customer.tier === i ? "text-white font-black" : "text-iron-600"}>{t.discount}% OFF</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Line items */}
            <div className="card-dark rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title-dark flex items-center gap-2"><Package className="w-5 h-5 text-navy-400" />Line Items</h3>
                <button onClick={() => setShowPicker(!showPicker)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-navy-600 hover:bg-navy-500 text-white font-bold text-sm transition-all">
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </div>

              {/* Product picker */}
              {showPicker && (
                <div className="mb-5 rounded-xl border overflow-hidden animate-fade-in" style={{ borderColor: "rgba(148,163,184,0.15)" }}>
                  <div className="p-3" style={{ background: "rgba(15,23,42,0.6)" }}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-iron-500" />
                      <input className="input-dark w-full rounded-lg pl-9 text-sm" placeholder="Search products…"
                        value={searchQ} onChange={e => setSearchQ(e.target.value)} autoFocus />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredProds.map(p => (
                      <button key={p.id} onClick={() => addItem(p)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-navy-500/10 transition-colors border-b border-white/5 last:border-0">
                        <div>
                          <p className="font-semibold text-iron-200 text-sm">{p.name}</p>
                          <p className="text-xs text-iron-500">{p.brand} · {p.partNumber}</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="font-bold text-white text-sm">{formatINR(p.price)}</p>
                          <p className="text-xs text-iron-500">{p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {items.length === 0 ? (
                <div className="text-center py-10 text-iron-600">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No products added yet. Click "Add Product" to begin.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr>
                      <th className="th-dark">Product</th>
                      <th className="th-dark text-center w-24">Qty</th>
                      <th className="th-dark text-right">Unit Price</th>
                      <th className="th-dark text-right">After Disc.</th>
                      <th className="th-dark text-right">Line Total</th>
                      <th className="th-dark w-10"></th>
                    </tr></thead>
                    <tbody>
                      {items.map((item, idx) => {
                        const base = item.overridePrice ?? item.product.price;
                        const discPrice = base * (1 - totalDisc / 100);
                        return (
                          <tr key={item.product.id} className="tr-dark">
                            <td className="td-dark">
                              <p className="font-semibold text-iron-200">{item.product.name}</p>
                              <p className="text-xs font-mono text-iron-500">{item.product.sku}</p>
                            </td>
                            <td className="td-dark">
                              <div className="flex items-center border border-white/10 rounded-lg overflow-hidden w-24 mx-auto">
                                <button onClick={() => { setItems(prev => prev.map((i,j) => j===idx ? {...i, qty:Math.max(1,i.qty-1)} : i)); setGenerated(false); }}
                                  className="w-7 h-7 flex items-center justify-center text-iron-400 hover:text-white hover:bg-white/10 transition-all text-base">−</button>
                                <span className="flex-1 text-center font-bold text-white text-sm">{item.qty}</span>
                                <button onClick={() => { setItems(prev => prev.map((i,j) => j===idx ? {...i, qty:i.qty+1} : i)); setGenerated(false); }}
                                  className="w-7 h-7 flex items-center justify-center text-iron-400 hover:text-white hover:bg-white/10 transition-all text-base">+</button>
                              </div>
                            </td>
                            <td className="td-dark text-right font-mono">{formatINR(base)}</td>
                            <td className="td-dark text-right">
                              <span className="text-emerald-400 font-bold">{formatINR(discPrice)}</span>
                              {totalDisc > 0 && <span className="text-[10px] text-iron-500 block">-{totalDisc}%</span>}
                            </td>
                            <td className="td-dark text-right font-display font-bold text-white">{formatINR(discPrice * item.qty)}</td>
                            <td className="td-dark">
                              <button onClick={() => { setItems(prev => prev.filter((_,j) => j!==idx)); setGenerated(false); }}
                                className="w-7 h-7 flex items-center justify-center text-iron-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Notes + validity */}
            <div className="card-dark rounded-2xl p-6 grid grid-cols-2 gap-4">
              <div>
                <label className="label-dark">Terms / Notes</label>
                <textarea className="input-dark w-full rounded-xl mt-1 resize-none" rows={3} value={notes}
                  onChange={e => { setNotes(e.target.value); setGenerated(false); }}
                  placeholder="Delivery terms, validity, special conditions…" />
              </div>
              <div>
                <label className="label-dark">Valid For (days)</label>
                <input type="number" min={1} max={90} className="input-dark w-full rounded-xl mt-1" value={validDays}
                  onChange={e => { setValidDays(Number(e.target.value)); setGenerated(false); }} />
                <p className="text-xs text-iron-500 mt-2">Quotation valid until: <span className="text-iron-300 font-semibold">{new Date(validUntil).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span></p>
              </div>
            </div>
          </div>

          {/* ─── RIGHT: Summary + Print ─── */}
          <div className="space-y-5">
            {/* Summary card */}
            <div className="card-dark rounded-2xl p-6 space-y-4">
              <h3 className="section-title-dark border-b border-white/5 pb-3">Quotation Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-iron-400">Gross Value</span><span className="font-bold text-iron-200">{formatINR(grossTotal)}</span></div>
                {totalDisc > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />Discount ({totalDisc}%)</span>
                    <span className="font-bold">− {formatINR(discAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between"><span className="text-iron-400">Taxable Amount</span><span className="font-bold text-iron-200">{formatINR(taxable)}</span></div>
                <div className="flex justify-between"><span className="text-iron-400">GST 18%</span><span className="font-bold text-iron-200">{formatINR(gst)}</span></div>
                <div className="flex justify-between pt-3 border-t border-white/8">
                  <span className="font-black text-white text-base">Grand Total</span>
                  <span className="font-display font-black text-2xl text-gold-400">{formatINR(grandTotal)}</span>
                </div>
              </div>

              {/* VIP savings callout */}
              {totalDisc > 0 && (
                <div className="rounded-xl p-3 text-center" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                  <p className="text-xs text-gold-400 font-bold uppercase tracking-wider">Customer Saves</p>
                  <p className="font-display font-black text-2xl text-gold-300 mt-0.5">{formatINR(discAmount)}</p>
                  <p className="text-xs text-iron-500 mt-0.5">{tier.label} discount applied</p>
                </div>
              )}

              <button onClick={() => { if(items.length > 0) setGenerated(true); }}
                disabled={items.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-iron-950 font-black text-sm transition-all disabled:opacity-40">
                <Calculator className="w-4 h-4" /> Generate Quotation
              </button>

              {generated && (
                <button onClick={handlePrint}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-navy-600 hover:bg-navy-500 text-white font-bold text-sm transition-all">
                  <Printer className="w-4 h-4" /> Print / Download PDF
                </button>
              )}
            </div>

            {/* Tier unlock guide */}
            <div className="card-dark rounded-2xl p-5">
              <h4 className="text-xs font-black text-iron-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-gold-400" />VIP Discount Tiers</h4>
              <div className="space-y-2">
                {VIP_TIERS.map((t, i) => (
                  <div key={t.label} className={`flex items-center justify-between p-2.5 rounded-lg ${customer.tier === i ? "bg-gold-500/10 border border-gold-500/30" : "border border-white/5"}`}
                    style={{ background: customer.tier === i ? undefined : "rgba(255,255,255,0.02)" }}>
                    <div>
                      <p className={`text-xs font-bold ${customer.tier === i ? "text-gold-400" : "text-iron-400"}`}>{t.label}</p>
                      <p className="text-[10px] text-iron-600">≥ ₹{(t.minValue/100000).toFixed(0)}L lifetime</p>
                    </div>
                    <span className={`text-sm font-black ${customer.tier === i ? "text-gold-300" : "text-iron-500"}`}>{t.discount}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hidden printable quotation */}
        {generated && items.length > 0 && (
          <div className="hidden">
            <div id="est-print" style={{ background:"white", color:"#1e293b", width:"794px", minHeight:"1123px", padding:"48px", fontFamily:"'Outfit',sans-serif", fontSize:"13px" }}>
              {/* Header */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", borderBottom:"3px solid #1340e1", paddingBottom:"20px", marginBottom:"20px" }}>
                <div>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:"24px", letterSpacing:"0.05em", marginBottom:"6px" }}>
                    Tech<span style={{ color:"#f59e0b" }}>Edge</span> Market Pvt. Ltd.
                  </div>
                  <div style={{ fontSize:"11px", color:"#475569", lineHeight:"1.7" }}>
                    <div>Plot 12, Hi-Tech City, Madhapur, Hyderabad – 500 081</div>
                    <div>Ph: +91-40-1234-5678 | sales@techedgemarket.in</div>
                    <div style={{ fontWeight:700 }}>GSTIN: 36AABCT1234Z1Z5</div>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ background:"#f59e0b", color:"#0a0f1e", padding:"6px 18px", borderRadius:"6px", fontWeight:800, fontSize:"18px", letterSpacing:"0.1em", marginBottom:"12px" }}>QUOTATION</div>
                  <table style={{ fontSize:"12px" }}>
                    <tbody>
                      {[["Quotation No.",estNo],["Date",new Date(today).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})],["Valid Until",new Date(validUntil).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})],["Customer Tier",tier.label]].map(([k,v])=>(
                        <tr key={k}><td style={{ color:"#64748b", paddingRight:"12px", paddingBottom:"4px" }}>{k}</td><td style={{ fontWeight:700 }}>{v}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* To */}
              <div style={{ border:"1px solid #e2e8f0", borderRadius:"8px", padding:"14px", marginBottom:"20px" }}>
                <div style={{ fontWeight:800, fontSize:"11px", textTransform:"uppercase", letterSpacing:"0.1em", color:"#1a56f5", marginBottom:"6px" }}>Quotation For</div>
                <div style={{ fontWeight:700, fontSize:"14px" }}>{customer.company}</div>
                <div style={{ fontSize:"12px", color:"#475569" }}>{customer.name} | GSTIN: {customer.gstin}</div>
                {totalDisc > 0 && (
                  <div style={{ marginTop:"8px", display:"inline-flex", alignItems:"center", gap:"6px", background:"#fef9c3", border:"1px solid #fde047", borderRadius:"6px", padding:"4px 10px", fontSize:"11px", fontWeight:700, color:"#854d0e" }}>
                    ⭐ {tier.label} — {totalDisc}% Special Discount Applied
                  </div>
                )}
              </div>

              {/* Items table */}
              <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:"16px", fontSize:"12px" }}>
                <thead>
                  <tr style={{ background:"#0f172a", color:"white" }}>
                    {["#","Description / Part No.","Qty","List Price","Disc.","Unit Price","Total"].map(h=>(
                      <th key={h} style={{ padding:"10px 12px", textAlign:h==="#"||h==="Qty"||h==="Disc."?"center":"left", fontSize:"10px", fontWeight:800, letterSpacing:"0.05em", textTransform:"uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const base = item.overridePrice ?? item.product.price;
                    const disc = base * (totalDisc / 100);
                    const net  = base - disc;
                    return (
                      <tr key={item.product.id} style={{ background: i%2===0?"#f8fafc":"white", borderBottom:"1px solid #e2e8f0" }}>
                        <td style={{ padding:"10px 12px", textAlign:"center", color:"#64748b" }}>{i+1}</td>
                        <td style={{ padding:"10px 12px" }}>
                          <div style={{ fontWeight:600 }}>{item.product.name}</div>
                          <div style={{ fontSize:"10px", color:"#94a3b8", fontFamily:"monospace" }}>SKU: {item.product.sku} | PN: {item.product.partNumber}</div>
                        </td>
                        <td style={{ padding:"10px 12px", textAlign:"center", fontWeight:700 }}>{item.qty}</td>
                        <td style={{ padding:"10px 12px" }}>₹{base.toLocaleString("en-IN")}</td>
                        <td style={{ padding:"10px 12px", textAlign:"center", color:"#16a34a", fontWeight:700 }}>{totalDisc}%</td>
                        <td style={{ padding:"10px 12px", fontWeight:700, color:"#1a56f5" }}>₹{Math.round(net).toLocaleString("en-IN")}</td>
                        <td style={{ padding:"10px 12px", fontWeight:700 }}>₹{Math.round(net*item.qty).toLocaleString("en-IN")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"16px" }}>
                <table style={{ fontSize:"12px", minWidth:"280px" }}>
                  <tbody>
                    {[
                      { l:"Gross Value", v: grossTotal },
                      { l:`Discount (${totalDisc}%)`, v: -discAmount },
                      { l:"Taxable Amount", v: taxable },
                      { l:"GST @ 18%", v: gst },
                    ].map(r=>(
                      <tr key={r.l}>
                        <td style={{ padding:"5px 12px", color:"#64748b", textAlign:"right" }}>{r.l}</td>
                        <td style={{ padding:"5px 12px", textAlign:"right", fontFamily:"monospace", color: r.v < 0 ? "#16a34a":"inherit" }}>
                          {r.v < 0 ? "− " : ""}₹{Math.abs(Math.round(r.v)).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background:"#1a56f5", color:"white" }}>
                      <td style={{ padding:"10px 12px", fontWeight:800, textAlign:"right" }}>Grand Total (INR)</td>
                      <td style={{ padding:"10px 12px", textAlign:"right", fontWeight:800, fontSize:"14px", fontFamily:"monospace" }}>₹{Math.round(grandTotal).toLocaleString("en-IN")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ background:"#f0f4ff", border:"1px solid #c7d7fe", borderRadius:"8px", padding:"10px 16px", marginBottom:"16px" }}>
                <span style={{ fontWeight:700, fontSize:"11px", color:"#1a56f5" }}>Amount in Words: </span>
                <span style={{ fontSize:"12px" }}>{numberToWords(Math.round(grandTotal))} Only</span>
              </div>

              {notes && (
                <div style={{ border:"1px solid #e2e8f0", borderRadius:"8px", padding:"12px", marginBottom:"16px" }}>
                  <div style={{ fontWeight:800, fontSize:"11px", textTransform:"uppercase", color:"#1a56f5", marginBottom:"6px" }}>Terms & Notes</div>
                  <p style={{ fontSize:"12px", color:"#475569", lineHeight:"1.7" }}>{notes}</p>
                </div>
              )}

              <div style={{ borderTop:"2px solid #e2e8f0", paddingTop:"14px", display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
                <div style={{ fontSize:"10px", color:"#94a3b8" }}>
                  <div>This quotation is valid until {new Date(validUntil).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}.</div>
                  <div>Prices subject to change. GST as applicable. E. & O.E.</div>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ width:"120px", borderBottom:"1px dashed #94a3b8", marginBottom:"4px" }} />
                  <div style={{ fontSize:"11px", fontWeight:700 }}>Authorised Signatory</div>
                  <div style={{ fontSize:"10px", color:"#64748b" }}>TechEdge Market Pvt. Ltd.</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
