"use client";
import { useState, useRef } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { getAllProducts, getAllProcurement } from "@/utils/data";
import { FileText, Printer, Plus, Trash2, Search, Share2, X, Eye, Edit3, FileSpreadsheet } from "lucide-react";
import { COMPANY, numberToWords, inr, formatDate, generateRefNo } from "@/utils/documents";
import type { DocLineItem, DocParty, DocTerm } from "@/types";
import ExcelJS from "exceljs";

const DEFAULT_TERMS: DocTerm[] = [
  { label: "GST", value: "18% extra on actuals" },
  { label: "Warranty Period", value: "2 Years from the date of Invoice" },
  { label: "Freight", value: "Included" },
  { label: "Unloading Scope", value: "Buyer's Scope" },
  { label: "Payment Terms", value: "100% Advance along with Purchase Order" },
  { label: "Delivery Lead Time", value: "8 – 10 days from the date of payment / PO. Door Delivery" },
  { label: "Order to be placed on", value: COMPANY.name },
  { label: "Consignee / Delivery Address", value: COMPANY.consignee },
  { label: "Installation Requirements", value: "Cabling, glands, lugs & accessories – Buyer's Scope. Unloading equipment & labour – Buyer's Scope." },
];

const DEFAULT_DECLARATION = "We hereby place this Purchase Order against your offer Ref. No. {{ offer ref }} dated {{ offer date }}. Kindly arrange supply as per the terms stated herein and confirm the delivery schedule upon receipt of this order.";

function PoPreview({ po }: { po: any }) {
  const totalAmount = po.items.reduce((s: any, i: any) => s + i.unitPrice * i.qty, 0);
  const amountWords = numberToWords(totalAmount);
  const logoUrl = typeof window !== "undefined" ? `${window.location.origin}/techedgemarket_ecommerce/logo/TEM-dark.png` : "";

  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: "10.5px", color: "#1F2937", lineHeight: "1.5", padding: "14mm 13mm", maxWidth: "210mm", margin: "0 auto", background: "white" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2.25pt solid #2B3A52", paddingBottom: "12px", marginBottom: "16px" }}>
        <div style={{ maxWidth: "58%" }}>
          <img src={logoUrl} alt="Tech Edge Market" style={{ height: "50px", width: "auto", objectFit: "contain", marginBottom: "4px" }} />
          <div style={{ fontSize: "8pt", color: "#64748B", lineHeight: "1.6" }}>
            <div>{COMPANY.address}</div>
            <div>Ph: {COMPANY.phone} · {COMPANY.email}</div>
            <div style={{ fontWeight: 700 }}>GSTIN: {COMPANY.gstin} · PAN: {COMPANY.pan}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "13pt", fontWeight: 700, color: "#2B3A52", letterSpacing: "2px", marginBottom: "10px" }}>PURCHASE ORDER</div>
          <table style={{ borderCollapse: "collapse", marginLeft: "auto", fontSize: "10px" }}>
            <tbody>
              {[["Ref No.", po.refNo], ["Date", po.date ? formatDate(po.date) : ""], ["Supplier Offer Ref.", po.supplierOfferRef], ["Supplier Offer Date", po.supplierOfferDate ? formatDate(po.supplierOfferDate) : ""]].map(([k, v]) => (
                <tr key={k}><td style={{ padding: "1.5px 10px 1.5px 0", color: "#64748B", textAlign: "right" }}>{k}</td><td style={{ padding: "1.5px 0", fontWeight: 700, color: "#2B3A52", textAlign: "right" }}>{v}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "flex", gap: "14px", marginBottom: "20px" }}>
        <div style={{ flex: 1, border: "1px solid #DADDE1", borderRadius: "6px", overflow: "hidden" }}>
          <div style={{ background: "#2B3A52", color: "white", fontSize: "8pt", fontWeight: 600, letterSpacing: "1.5px", padding: "6px 13px", textTransform: "uppercase" }}>ORDER TO</div>
          <div style={{ padding: "11px 13px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#2B3A52" }}>{po.supplier?.name || "—"}</div>
            {po.supplier?.attention && <div style={{ fontSize: "11px", color: "#64748B", marginBottom: "4px" }}>{po.supplier.attention}</div>}
            {po.supplier?.mobile && <div style={{ fontSize: "9pt", color: "#475569" }}>Mobile: {po.supplier.mobile}</div>}
            {po.supplier?.email && <div style={{ fontSize: "9pt", color: "#475569" }}>Email: {po.supplier.email}</div>}
          </div>
        </div>
        <div style={{ flex: 1, border: "1px solid #DADDE1", borderRadius: "6px", overflow: "hidden" }}>
          <div style={{ background: "#2B3A52", color: "white", fontSize: "8pt", fontWeight: 600, letterSpacing: "1.5px", padding: "6px 13px", textTransform: "uppercase" }}>SUBJECT</div>
          <div style={{ padding: "11px 13px" }}>
            <div style={{ fontSize: "10.5pt", fontWeight: 700, color: "#2B3A52" }}>{po.subject || "—"}</div>
            <div style={{ marginTop: "6px", fontSize: "9pt", color: "#475569", lineHeight: "1.6" }}>{po.openingText}</div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: "10pt", fontWeight: 700, color: "#2B3A52", letterSpacing: "1.5px", textTransform: "uppercase", borderLeft: "4px solid #2B3A52", paddingLeft: "9px", marginBottom: "10px" }}>ORDER DETAILS / SCOPE OF SUPPLY</div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "12px" }}>
        <thead><tr>{["SL", "Product Description", "Model", "Qty", "Unit", "Unit Price (Rs.)", "Amount (Rs.)"].map((h, i) => (<th key={h} style={{ background: "#2B3A52", color: "white", fontSize: "8pt", fontWeight: 600, padding: "8px 10px", textAlign: i === 0 || i >= 3 ? "center" : "left" }}>{h}</th>))}</tr></thead>
        <tbody>
          {po.items.map((item: any, i: number) => {
            const amt = item.unitPrice * item.qty;
            return (
              <tr key={item.id} style={{ borderBottom: "1px solid #DADDE1" }}>
                <td style={{ padding: "10px", textAlign: "center", color: "#64748B" }}>{i + 1}</td>
                <td style={{ padding: "10px", verticalAlign: "top" }}>
                  <div style={{ fontWeight: 700, color: "#2B3A52", fontSize: "11px" }}>{item.title}</div>
                  {item.subDetails && <div style={{ color: "#64748B", fontSize: "8pt", marginTop: "2px" }}>{item.subDetails}</div>}
                  {item.tag && <span style={{ display: "inline-block", marginTop: "4px", fontSize: "8.5pt", color: "#2E7D32", border: "1px solid #A5D6A7", background: "#E8F5E9", borderRadius: "3px", padding: "1px 6px" }}>{item.tag}</span>}
                </td>
                <td style={{ padding: "10px", fontSize: "9pt", color: "#475569" }}>{item.model || "—"}</td>
                <td style={{ padding: "10px", textAlign: "center", fontWeight: 700 }}>{item.qty}</td>
                <td style={{ padding: "10px", textAlign: "center", fontSize: "9pt" }}>{item.unit}</td>
                <td style={{ padding: "10px", textAlign: "right", fontWeight: 700 }}>{inr(item.unitPrice)}/-</td>
                <td style={{ padding: "10px", textAlign: "right" }}><div style={{ fontWeight: 700 }}>{inr(amt)}</div><div style={{ fontSize: "8pt", color: "#64748B" }}>+ 18% GST</div></td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {po.items.length > 0 && (
        <div style={{ textAlign: "right", marginBottom: "16px", fontSize: "10pt" }}>
          <span style={{ color: "#64748B", fontStyle: "italic" }}>Amount in Words: </span>
          <span style={{ fontWeight: 700, color: "#2B3A52" }}>Rupees {amountWords} Only + 18% GST</span>
        </div>
      )}

      <div style={{ pageBreakBefore: "always" }} />

      <div style={{ fontSize: "10pt", fontWeight: 700, color: "#2B3A52", letterSpacing: "1.5px", textTransform: "uppercase", borderLeft: "4px solid #2B3A52", paddingLeft: "9px", marginBottom: "10px" }}>TERMS & CONDITIONS</div>

      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #DADDE1", marginBottom: "20px" }}>
        <tbody>
          {po.terms.map((t: any) => (
            <tr key={t.label} style={{ borderBottom: "1px solid #DADDE1" }}>
              <td style={{ width: "30%", fontWeight: 700, color: "#2B3A52", fontSize: "8.5pt", background: "#EEF1F6", padding: "6px 10px", verticalAlign: "top" }}>{t.label}</td>
              <td style={{ fontSize: "8.5pt", padding: "6px 10px", verticalAlign: "top" }}>{t.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ fontSize: "10pt", fontWeight: 700, color: "#2B3A52", letterSpacing: "1.5px", textTransform: "uppercase", borderLeft: "4px solid #2B3A52", paddingLeft: "9px", marginBottom: "8px" }}>DECLARATION</div>
      <p style={{ fontSize: "9pt", color: "#475569", lineHeight: "1.7" }}>{po.declaration}</p>

      <div style={{ marginTop: "22px", borderTop: "1px solid #DADDE1", paddingTop: "8px", textAlign: "center", fontSize: "6.5pt", color: "#64748B", lineHeight: "1.5" }}>
        <div><span style={{ color: "#2B3A52", fontWeight: 700 }}>{COMPANY.name}</span> · {COMPANY.address} · {COMPANY.phone} · {COMPANY.email} · GSTIN {COMPANY.gstin}</div>
        <div>This is a computer-generated purchase order.</div>
      </div>
    </div>
  );
}

export default function PurchaseOrderPage() {
  const allProducts = getAllProducts();
  const allPOs = getAllProcurement();
  const [refNo, setRefNo] = useState(generateRefNo("PO", allPOs.length + 1));
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [supplierOfferRef, setSupplierOfferRef] = useState("");
  const [supplierOfferDate, setSupplierOfferDate] = useState("");
  const [supplier, setSupplier] = useState<DocParty>({ name: "", attention: "", mobile: "", email: "" });
  const [subject, setSubject] = useState("");
  const [openingText, setOpeningText] = useState("");
  const [items, setItems] = useState<DocLineItem[]>([]);
  const [terms, setTerms] = useState<DocTerm[]>(DEFAULT_TERMS);
  const [declaration, setDeclaration] = useState(DEFAULT_DECLARATION);
  const [searchQ, setSearchQ] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [editTermIdx, setEditTermIdx] = useState<number | null>(null);
  const [editTerm, setEditTerm] = useState<DocTerm>({ label: "", value: "" });
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const po = { refNo, date, supplierOfferRef, supplierOfferDate, supplier, subject, openingText, items, terms, declaration };

  const addItem = (product: any) => {
    setItems(prev => [...prev, { id: `item-${Date.now()}-${Math.random()}`, title: product.name, subDetails: product.description || "", model: product.model || product.partNumber || "", tag: "CE Certified & CPRI Tested", qty: 1, unit: "NOS.", unitPrice: product.price }]);
    setShowPicker(false); setSearchQ("");
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const updateItem = (id: string, field: string, value: any) => setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));

  const filteredProds = allProducts.filter(p => {
    const q = searchQ.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.partNumber.toLowerCase().includes(q);
  });

  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>PO ${refNo}</title><style>@page{size:A4;margin:0}body{margin:0;padding:0}*{box-sizing:border-box}</style></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 600);
  };

  const handleExportXLSX = async () => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Purchase Order", { properties: { tabColor: { argb: "2B3A52" } } });
    ws.columns = [{ key: "sl", width: 6 }, { key: "title", width: 40 }, { key: "model", width: 20 }, { key: "qty", width: 8 }, { key: "unit", width: 8 }, { key: "unitPrice", width: 16 }, { key: "amount", width: 16 }];
    ws.mergeCells("A1:G1"); ws.getCell("A1").value = "PURCHASE ORDER"; ws.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF2B3A52" } };
    ws.mergeCells("A2:G2"); ws.getCell("A2").value = `Ref No: ${refNo} | Date: ${date ? formatDate(date) : ""}`; ws.getCell("A2").font = { size: 10, color: { argb: "FF64748B" } };
    ws.mergeCells("A3:G3"); ws.getCell("A3").value = `Supplier: ${supplier.name} | Offer Ref: ${supplierOfferRef}`; ws.getCell("A3").font = { size: 10, color: { argb: "FF64748B" } };
    ws.addRow([]);
    const headerRow = ws.addRow({ sl: "SL", title: "Product Description", model: "Model", qty: "Qty", unit: "Unit", unitPrice: "Unit Price (Rs.)", amount: "Amount (Rs.)" });
    headerRow.eachCell(cell => { cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9 }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2B3A52" } }; });
    items.forEach((item, i) => { ws.addRow({ sl: i + 1, title: item.title, model: item.model || "", qty: item.qty, unit: item.unit, unitPrice: item.unitPrice, amount: item.unitPrice * item.qty }); });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${refNo.replace(/\//g, "_")}.xlsx`; a.click(); URL.revokeObjectURL(url);
  };

  const handleShareEmail = () => {
    if (!shareEmail) return;
    const params = new URLSearchParams({ to: shareEmail, subject: `Purchase Order ${refNo} from Tech Edge Market`, body: `Dear Sir,\n\nPlease find attached the Purchase Order ${refNo}.\n\nBest regards,\nTech Edge Market` });
    window.open(`/admin/emails?${params.toString()}`, "_blank");
    setShowShareModal(false); setShareEmail("");
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="border-b border-slate-200 px-8 py-5 flex items-center justify-between bg-white">
          <div>
            <h1 className="page-title flex items-center gap-3"><FileText className="w-7 h-7 text-primary-600" /> Purchase Order Generator</h1>
            <p className="page-sub">Create professionally formatted purchase orders</p>
          </div>
          <button onClick={() => setShowPicker(!showPicker)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Product</button>
        </div>

        <div className="flex max-w-screen-2xl mx-auto">
          {/* Left: Form */}
          <div className="w-[420px] shrink-0 p-6 space-y-5 overflow-y-auto" style={{ maxHeight: "calc(100vh - 80px)" }}>
            <div className="card rounded-xl p-5 space-y-4">
              <h3 className="section-title mb-3">PO Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Ref No.</label><input className="input w-full rounded-lg mt-1 text-sm" value={refNo} onChange={e => setRefNo(e.target.value)} /></div>
                <div><label className="label">PO Date</label><input type="date" className="input w-full rounded-lg mt-1 text-sm" value={date} onChange={e => setDate(e.target.value)} /></div>
                <div><label className="label">Supplier Offer Ref.</label><input className="input w-full rounded-lg mt-1 text-sm" value={supplierOfferRef} onChange={e => setSupplierOfferRef(e.target.value)} placeholder="e.g. AEPL/TEM/PCE/26-27/01R" /></div>
                <div><label className="label">Supplier Offer Date</label><input type="date" className="input w-full rounded-lg mt-1 text-sm" value={supplierOfferDate} onChange={e => setSupplierOfferDate(e.target.value)} /></div>
              </div>
            </div>

            <div className="card rounded-xl p-5 space-y-4">
              <h3 className="section-title mb-3">Supplier Details</h3>
              <div className="space-y-3">
                <div><label className="label">Company Name</label><input className="input w-full rounded-lg mt-1 text-sm" value={supplier.name} onChange={e => setSupplier(prev => ({ ...prev, name: e.target.value }))} placeholder="M/s Supplier Name Pvt Ltd" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Attention</label><input className="input w-full rounded-lg mt-1 text-sm" value={supplier.attention} onChange={e => setSupplier(prev => ({ ...prev, attention: e.target.value }))} placeholder="Name — Designation" /></div>
                  <div><label className="label">Mobile</label><input className="input w-full rounded-lg mt-1 text-sm" value={supplier.mobile} onChange={e => setSupplier(prev => ({ ...prev, mobile: e.target.value }))} placeholder="+91 XXXXX XXXXX" /></div>
                </div>
                <div><label className="label">Email</label><input className="input w-full rounded-lg mt-1 text-sm" value={supplier.email} onChange={e => setSupplier(prev => ({ ...prev, email: e.target.value }))} placeholder="name@supplier.com" /></div>
              </div>
            </div>

            <div className="card rounded-xl p-5 space-y-4">
              <h3 className="section-title mb-3">Subject</h3>
              <div><label className="label">Subject Line</label><input className="input w-full rounded-lg mt-1 text-sm" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Purchase Order for {{ product short name }}" /></div>
              <div><label className="label">Opening Text</label><textarea className="input w-full rounded-lg mt-1 text-sm resize-none" rows={3} value={openingText} onChange={e => setOpeningText(e.target.value)} placeholder="Dear Sir, With reference to your offer..." /></div>
            </div>

            <div className="card rounded-xl p-5 space-y-4">
              <h3 className="section-title mb-3">Line Items ({items.length})</h3>
              {showPicker && (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="p-3 bg-slate-50">
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input className="input w-full rounded-lg pl-9 text-sm" placeholder="Search products…" value={searchQ} onChange={e => setSearchQ(e.target.value)} autoFocus /></div>
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {filteredProds.map(p => (
                      <button key={p.id} onClick={() => addItem(p)} className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                        <div><p className="font-semibold text-slate-800 text-sm">{p.name}</p><p className="text-xs text-slate-500">{p.brand} · {p.partNumber}</p></div>
                        <p className="font-bold text-slate-900 text-sm ml-4">{inr(p.price)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {items.length === 0 ? (
                <div className="text-center py-8 text-slate-400"><p className="text-sm">No products added. Click "Add Product" to begin.</p></div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {items.map((item, idx) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 p-3 space-y-2 bg-slate-50">
                      <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-500">#{idx + 1}</span><button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></div>
                      <input className="input w-full rounded-lg text-sm" value={item.title} onChange={e => updateItem(item.id, "title", e.target.value)} placeholder="Product title" />
                      <div className="grid grid-cols-3 gap-2">
                        <input className="input w-full rounded-lg text-sm" value={item.model || ""} onChange={e => updateItem(item.id, "model", e.target.value)} placeholder="Model" />
                        <input className="input w-full rounded-lg text-sm" type="number" value={item.qty} onChange={e => updateItem(item.id, "qty", Number(e.target.value))} placeholder="Qty" />
                        <input className="input w-full rounded-lg text-sm" type="number" value={item.unitPrice} onChange={e => updateItem(item.id, "unitPrice", Number(e.target.value))} placeholder="Price" />
                      </div>
                      <input className="input w-full rounded-lg text-sm" value={item.tag || ""} onChange={e => updateItem(item.id, "tag", e.target.value)} placeholder="Badge text (optional)" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between"><h3 className="section-title mb-0">Terms & Conditions</h3><button onClick={() => { setEditTermIdx(-1); setEditTerm({ label: "", value: "" }); }} className="text-xs text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button></div>
              {editTermIdx !== null && (
                <div className="rounded-xl border border-primary-300 p-3 space-y-2 bg-primary-50">
                  <input className="input w-full rounded-lg text-sm" value={editTerm.label} onChange={e => setEditTerm(prev => ({ ...prev, label: e.target.value }))} placeholder="Term label" />
                  <textarea className="input w-full rounded-lg text-sm resize-none" rows={2} value={editTerm.value} onChange={e => setEditTerm(prev => ({ ...prev, value: e.target.value }))} placeholder="Term value" />
                  <div className="flex gap-2"><button onClick={() => { if (editTermIdx === -1) setTerms(prev => [...prev, editTerm]); else setTerms(prev => prev.map((t, i) => i === editTermIdx ? editTerm : t)); setEditTermIdx(null); }} className="px-3 py-1.5 rounded-lg bg-primary-600 text-white font-bold text-xs">Save</button><button onClick={() => setEditTermIdx(null)} className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs">Cancel</button></div>
                </div>
              )}
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {terms.map((t, i) => (
                  <div key={t.label} className="flex items-start justify-between rounded-lg border border-slate-200 p-2.5 bg-white">
                    <div className="flex-1 min-w-0"><p className="text-xs font-bold text-primary-700">{t.label}</p><p className="text-xs text-slate-500 truncate">{t.value}</p></div>
                    <div className="flex gap-1 ml-2"><button onClick={() => { setEditTermIdx(i); setEditTerm(t); }} className="text-slate-400 hover:text-primary-600"><Edit3 className="w-3 h-3" /></button><button onClick={() => setTerms(prev => prev.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card rounded-xl p-5 space-y-4">
              <h3 className="section-title mb-3">Declaration</h3>
              <textarea className="input w-full rounded-lg text-sm resize-none" rows={4} value={declaration} onChange={e => setDeclaration(e.target.value)} />
            </div>

            <div className="card rounded-xl p-5 space-y-3">
              <h3 className="section-title mb-3">Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handlePrint} className="btn-primary flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> Print / PDF</button>
                <button onClick={handleExportXLSX} className="btn-outline flex items-center justify-center gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"><FileSpreadsheet className="w-4 h-4" /> Export XLSX</button>
                <button onClick={() => setShowShareModal(true)} className="col-span-2 btn-primary flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 border-amber-500"><Share2 className="w-4 h-4" /> Share via Email</button>
              </div>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="w-px bg-slate-200 shrink-0" />

          {/* Right: Live Preview */}
          <div className="flex-1 p-6 overflow-auto" style={{ maxHeight: "calc(100vh - 80px)" }}>
            <div className="flex items-center gap-2 mb-4"><Eye className="w-4 h-4 text-slate-400" /><span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Live Preview — A4</span></div>
            <div className="flex justify-center overflow-auto" style={{ maxHeight: "calc(100vh - 160px)" }}>
              <div className="bg-white shadow-2xl" style={{ width: "210mm", minHeight: "297mm" }}>
                <div ref={printRef}><PoPreview po={po} /></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Share2 className="w-5 h-5 text-amber-500" /> Share Purchase Order</h2><button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div>
            <div><label className="label">Recipient Email</label><input className="input w-full rounded-lg mt-1 text-sm" value={shareEmail} onChange={e => setShareEmail(e.target.value)} placeholder="supplier@example.com" /></div>
            <div className="rounded-lg p-3 text-sm bg-slate-50 border border-slate-200">
              <p className="text-slate-500">Document: <span className="text-slate-900 font-bold">{refNo}</span></p>
              <p className="text-slate-500">Supplier: <span className="text-slate-900 font-bold">{supplier.name || "—"}</span></p>
              <p className="text-slate-500 mt-2">The email page will open with this PO attached and pre-filled details.</p>
            </div>
            <div className="flex gap-3"><button onClick={() => setShowShareModal(false)} className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-600 font-bold text-sm">Cancel</button><button onClick={handleShareEmail} disabled={!shareEmail} className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm disabled:opacity-40">Open Email</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
