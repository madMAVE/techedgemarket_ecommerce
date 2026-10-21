"use client";
import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { documentsApi } from "@/lib/documents";
import { getAllProducts } from "@/utils/data";
import { FileSpreadsheet, Printer, Plus, Trash2, Search, Share2, X, Eye, Edit3, Save, Loader2, CheckCircle } from "lucide-react";
import { COMPANY, inr, formatDate } from "@/utils/documents";
import { QuotationPreview, publicDocumentUrl } from "@/components/documents/previews";
import type { CustomerAccount } from "@/types";
import type { DocLineItem, DocParty, DocSpec, DocTerm } from "@/types";
import ExcelJS from "exceljs";


function QuotationPageInner() {
  const searchParams = useSearchParams();
  const allProducts = getAllProducts();
  const [refNo, setRefNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [validDays, setValidDays] = useState(30);
  const validTill = new Date(Date.now() + validDays * 86400000).toISOString().split("T")[0];

  const [docId, setDocId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [customers, setCustomers] = useState<CustomerAccount[]>([]);
  const [custId, setCustId] = useState("");
  const [client, setClient] = useState<DocParty>({ name: "", attention: "", address: "", email: "", gstin: "" });

  const [items, setItems] = useState<DocLineItem[]>([]);
  const [specs, setSpecs] = useState<DocSpec[]>([]);
  const [terms, setTerms] = useState<DocTerm[]>([
    { label: "GST", value: "18% extra on actuals" },
    { label: "Warranty Period", value: "2 Years from the date of Invoice" },
    { label: "Freight", value: "Included" },
    { label: "Unloading Scope", value: "Your Scope" },
    { label: "Offer Validity", value: `Till ${formatDate(validTill)}` },
    { label: "Payment Terms", value: "50% Advance against PO + 50% Advance on material ready" },
    { label: "Delivery Lead Time", value: "8 – 10 days from the date of payment / PO. Door Delivery" },
    { label: "Order to be placed on", value: `${COMPANY.name}, Kolkata` },
    { label: "Installation Requirements", value: "Provision & laying of input and output cable along with suitable glands, lugs & accessories that may be required as per site conditions is in your scope. Handling equipment & labour required for unloading of the material during delivery to be arranged by you at your cost." },
  ]);
  const [signoff, setSignoff] = useState({ name: "Pradipan Das", role: "Sales Manager", lines: ["Kolkata", COMPANY.email, COMPANY.phone] });
  const [subjectTitle, setSubjectTitle] = useState("");
  const [subjectBody, setSubjectBody] = useState("Dear Sir,\nWith reference to your requirement, we are pleased to offer as detailed below. We assure you of our best service at all times.");
  const [totalDisc, setTotalDisc] = useState(0);
  const [showQr, setShowQr] = useState(true);
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const gstRate = 0.18;

  const [searchQ, setSearchQ] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualItem, setManualItem] = useState<DocLineItem>({ id: "", title: "", subDetails: "", model: "", tag: "", qty: 1, unit: "NOS.", unitPrice: 0 });
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [specsJson, setSpecsJson] = useState("");
  const [specsError, setSpecsError] = useState("");
  const [editTermIdx, setEditTermIdx] = useState<number | null>(null);
  const [editTerm, setEditTerm] = useState<DocTerm>({ label: "", value: "" });
  const printRef = useRef<HTMLDivElement>(null);

  const q = { refNo, date, validTill, client, subjectTitle, subjectBody, items, specs, terms, signoff, totalDisc, gstRate, showQr, publicUrl: publicToken ? publicDocumentUrl(publicToken) : undefined };

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000); };

  const specsToJson = (list: DocSpec[]) => JSON.stringify(Object.fromEntries(list.map(s => [s.key, s.value])), null, 2);

  const applySpecsJson = (raw: string) => {
    setSpecsJson(raw);
    if (!raw.trim()) { setSpecs([]); setSpecsError(""); return; }
    try {
      const parsed = JSON.parse(raw.trim());
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error();
      setSpecs(Object.entries(parsed).map(([key, value]) => ({ key, value: String(value) })));
      setSpecsError("");
    } catch {
      setSpecsError("Invalid JSON — paste a flat object, e.g. { \"CPU\": \"1214C\" }");
    }
  };

  useEffect(() => {
    documentsApi.listCustomers().then(setCustomers).catch(() => setCustomers([]));
  }, []);

  const selectCustomer = (id: string) => {
    setCustId(id);
    const c = customers.find(x => x.id === id);
    if (!c) return;
    const primary = (c.contacts ?? []).find(p => p.isPrimary) ?? (c.contacts ?? [])[0];
    setClient({
      name: c.company,
      attention: primary ? `Attn: ${primary.name}${primary.role ? ` — ${primary.role}` : ""}` : "",
      address: [c.address, c.city].filter(Boolean).join(", "),
      email: c.email ?? "",
      gstin: c.gstin ?? "",
      state: c.state ?? "",
      stateCode: c.stateCode ?? "",
    });
  };

  const loadDraft = useCallback(async (id: string) => {
    try {
      const doc = await documentsApi.get(id);
      const p = doc.payload as Record<string, unknown>;
      setDocId(doc.id);
      setPublicToken(doc.publicToken);
      if (typeof p["showQr"] === "boolean") setShowQr(p["showQr"]);
      setRefNo(doc.number);
      setDate(doc.issueDate.slice(0, 10));
      setClient((p["client"] ?? { name: doc.partyName }) as DocParty);
      setSubjectTitle(String(p["subjectTitle"] ?? ""));
      setSubjectBody(String(p["subjectBody"] ?? ""));
      setItems(((p["items"] ?? []) as DocLineItem[]).map((it, i) => ({ ...it, id: it.id ?? `item-${i}` })));
      if (Array.isArray(p["specs"])) { const loaded = p["specs"] as DocSpec[]; setSpecs(loaded); setSpecsJson(specsToJson(loaded)); }
      if (Array.isArray(p["terms"])) setTerms(p["terms"] as DocTerm[]);
      if (p["signoff"]) setSignoff(p["signoff"] as { name: string; role: string; lines: string[] });
      const totals = (p["totals"] ?? {}) as { discountPct?: number };
      if (typeof totals.discountPct === "number") setTotalDisc(totals.discountPct);
      showToast(`Loaded draft ${doc.number}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load draft", false);
    }
  }, []);

  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam) loadDraft(idParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, loadDraft]);

  const handleSave = async () => {
    if (!client.name.trim()) { showToast("Client company name is required", false); return; }
    if (specsError) { showToast(specsError, false); return; }
    if (items.length === 0) { showToast("Add at least one line item", false); return; }
    setSaving(true);
    try {
      const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
      const discAmount = subtotal * (totalDisc / 100);
      const taxable = subtotal - discAmount;
      const gstAmt = taxable * gstRate;
      const payload: Record<string, unknown> = {
        refNo, date, validTill, client, subjectTitle, subjectBody, items, specs, terms, signoff, showQr,
        totals: { subtotal, discountPct: totalDisc, discAmount, taxable, gstRate, gstAmt, grand: Math.round(taxable + gstAmt) },
      };
      const doc = docId
        ? await documentsApi.updateDraft(docId, payload)
        : await documentsApi.create({
            type: "QUOTATION",
            issueDate: date,
            partyName: client.name,
            party: { name: client.name, attention: client.attention, mobile: client.mobile, email: client.email, address: client.address, state: client.state, stateCode: client.stateCode, gstin: client.gstin },
            payload,
          });
      setDocId(doc.id);
      setPublicToken(doc.publicToken);
      setRefNo(doc.number);
      showToast(`Saved as ${doc.number} (${doc.status})`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save quotation", false);
    } finally {
      setSaving(false);
    }
  };

  const addItem = (product: any) => {
    setItems(prev => [...prev, { id: `item-${Date.now()}-${Math.random()}`, title: product.name, subDetails: `${product.description || ""} · Model: ${product.model || product.partNumber}`, model: product.model || product.partNumber, tag: "CE Certified & CPRI Tested", qty: 1, unit: "NOS.", unitPrice: product.price }]);
    setShowPicker(false); setSearchQ("");
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const updateItem = (id: string, field: string, value: any) => setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));

  const warranty = terms.find(t => t.label === "Warranty Period")?.value ?? "";
  const leadTime = terms.find(t => t.label === "Delivery Lead Time")?.value ?? "";

  const setTermValue = (label: string, value: string) => setTerms(prev => {
    const idx = prev.findIndex(t => t.label === label);
    if (idx === -1) return value.trim() ? [...prev, { label, value }] : prev;
    return prev.map((t, i) => i === idx ? { ...t, value } : t);
  });

  const filteredProds = allProducts.filter(p => {
    const query = searchQ.toLowerCase();
    return !query || p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query) || p.partNumber.toLowerCase().includes(query);
  });

  const handlePrint = () => {
    const el = printRef.current; if (!el) return;
    const w = window.open("", "_blank"); if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Quotation ${refNo}</title><style>@page{size:A4;margin:0}body{margin:0;padding:0}*{box-sizing:border-box}</style></head><body>${el.innerHTML}</body></html>`);
    w.document.close(); setTimeout(() => w.print(), 600);
  };

  const handleExportXLSX = async () => {
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
    const discAmount = subtotal * (totalDisc / 100);
    const taxable = subtotal - discAmount;
    const gstAmt = taxable * gstRate;
    const grand = taxable + gstAmt;
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Quotation", { properties: { tabColor: { argb: "2B3A52" } } });
    ws.mergeCells("A1:E1"); ws.getCell("A1").value = "QUOTATION"; ws.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF2B3A52" } };
    ws.mergeCells("A2:E2"); ws.getCell("A2").value = `Ref No: ${refNo} | Date: ${date ? formatDate(date) : ""} | Valid Till: ${validTill ? formatDate(validTill) : ""}`; ws.getCell("A2").font = { size: 10, color: { argb: "FF64748B" } };
    ws.mergeCells("A3:E3"); ws.getCell("A3").value = `Client: ${client.name} | GSTIN: ${client.gstin || ""}`; ws.getCell("A3").font = { size: 10, color: { argb: "FF64748B" } };
    ws.addRow([]);
    const headerRow = ws.addRow({ sl: "SL", title: "Product Description", qty: "Qty", unit: "Unit", unitPrice: "Special Price (Rs.)" });
    headerRow.eachCell(cell => { cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9 }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2B3A52" } }; });
    items.forEach((item, i) => { ws.addRow({ sl: i + 1, title: item.title, qty: item.qty, unit: item.unit, unitPrice: item.unitPrice }); });
    ws.addRow([]);
    ws.addRow({ sl: "", title: "Sub Total", qty: "", unit: "", unitPrice: subtotal });
    if (totalDisc > 0) ws.addRow({ sl: "", title: `Discount (${totalDisc}%)`, qty: "", unit: "", unitPrice: -discAmount });
    ws.addRow({ sl: "", title: "Taxable Amount", qty: "", unit: "", unitPrice: taxable });
    ws.addRow({ sl: "", title: `GST @ ${Math.round(gstRate * 100)}%`, qty: "", unit: "", unitPrice: gstAmt });
    ws.addRow({ sl: "", title: "Grand Total", qty: "", unit: "", unitPrice: grand });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${refNo.replace(/[^a-zA-Z0-9-]/g, "_")}.xlsx`; a.click(); URL.revokeObjectURL(url);
  };

  const handleShareEmail = () => {
    if (!shareEmail) return;
    const params = new URLSearchParams({ to: shareEmail, subject: `Quotation ${refNo} from Tech Edge Market`, body: `Dear Sir,\n\nPlease find attached the Quotation ${refNo}.\n\nBest regards,\n${signoff.name}\n${signoff.role}` });
    window.open(`/admin/emails?${params.toString()}`, "_blank");
    setShowShareModal(false); setShareEmail("");
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {toast && <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold ${toast.ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>{toast.ok ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}{toast.msg}</div>}
        <div className="border-b border-slate-200 px-8 py-5 flex items-center justify-between bg-white">
          <div>
            <h1 className="page-title flex items-center gap-3"><FileSpreadsheet className="w-7 h-7 text-primary-600" /> Quotation Generator</h1>
            <p className="page-sub">Create professional quotations with VIP discounts</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-outline flex items-center gap-2 border-primary-300 text-primary-700 hover:bg-primary-50 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {docId ? "Update Draft" : "Save Document"}
            </button>
            <button onClick={() => { setManualEntry(false); setShowPicker(!showPicker); }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Product</button>
          </div>
        </div>

        <div className="flex max-w-screen-2xl mx-auto">
          {/* Left: Form */}
          <div className="w-[420px] shrink-0 p-6 space-y-5 overflow-y-auto" style={{ maxHeight: "calc(100vh - 80px)" }}>
            <div className="card rounded-xl p-5 space-y-4">
              <h3 className="section-title mb-3">Reference & Dates</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Ref No.</label><input className="input w-full rounded-lg mt-1 text-sm" value={refNo} readOnly placeholder="Assigned on save" /></div>
                <div><label className="label">Date</label><input type="date" className="input w-full rounded-lg mt-1 text-sm" value={date} onChange={e => setDate(e.target.value)} /></div>
                <div><label className="label">Valid For (days)</label><input type="number" min={1} max={90} className="input w-full rounded-lg mt-1 text-sm" value={validDays} onChange={e => setValidDays(Number(e.target.value))} /></div>
              </div>
            </div>

            <div className="card rounded-xl p-5 space-y-4">
              <h3 className="section-title mb-3">Client</h3>
              <div><label className="label">Select Customer</label>
                <select className="input w-full rounded-lg mt-1 text-sm" value={custId} onChange={e => selectCustomer(e.target.value)}>
                  <option value="">— Manual entry (new company) —</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.company}{c.gstin ? ` — ${c.gstin}` : ""}</option>)}
                </select>
                {customers.length === 0 && <p className="text-xs text-slate-400 mt-1">No customer accounts yet — fill the fields below and saving will create one.</p>}
              </div>
              <div className="space-y-2">
                <input className="input w-full rounded-lg text-sm" value={client.name} onChange={e => setClient(prev => ({ ...prev, name: e.target.value }))} placeholder="Company name" />
                <input className="input w-full rounded-lg text-sm" value={client.attention || ""} onChange={e => setClient(prev => ({ ...prev, attention: e.target.value }))} placeholder="Attention" />
                <textarea className="input w-full rounded-lg text-sm resize-none" rows={2} value={client.address || ""} onChange={e => setClient(prev => ({ ...prev, address: e.target.value }))} placeholder="Address" />
                <div className="grid grid-cols-2 gap-2">
                  <input className="input w-full rounded-lg text-sm" value={client.email || ""} onChange={e => setClient(prev => ({ ...prev, email: e.target.value }))} placeholder="Email" />
                  <input className="input w-full rounded-lg text-sm" value={client.gstin || ""} onChange={e => setClient(prev => ({ ...prev, gstin: e.target.value }))} placeholder="GSTIN" />
                </div>
              </div>
              <div><label className="label">Discount %</label><input type="number" min={0} max={30} className="input w-full rounded-lg mt-1 text-sm" value={totalDisc} onChange={e => setTotalDisc(Math.min(Math.max(Number(e.target.value), 0), 30))} /></div>
            </div>

            <div className="card rounded-xl p-5 space-y-4">
              <h3 className="section-title mb-3">Subject</h3>
              <input className="input w-full rounded-lg text-sm" value={subjectTitle} onChange={e => setSubjectTitle(e.target.value)} placeholder="Supply of {{ product name }}" />
              <textarea className="input w-full rounded-lg text-sm resize-none" rows={3} value={subjectBody} onChange={e => setSubjectBody(e.target.value)} placeholder="Dear Sir,..." />
            </div>

            <div className="card rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="section-title mb-0">Line Items ({items.length})</h3>
                <div className="flex gap-2">
                  <button onClick={() => { setManualEntry(false); setShowPicker(!showPicker); }} className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${!manualEntry && showPicker ? "bg-primary-50 border-primary-300 text-primary-700" : "border-slate-300 text-slate-500"}`}>
                    <Search className="w-3.5 h-3.5" /> Product List
                  </button>
                  <button onClick={() => { setManualEntry(true); setShowPicker(false); }} className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${manualEntry ? "bg-primary-50 border-primary-300 text-primary-700" : "border-slate-300 text-slate-500"}`}>
                    <Edit3 className="w-3.5 h-3.5" /> Manual Entry
                  </button>
                </div>
              </div>

              {/* Product List mode */}
              {!manualEntry && showPicker && (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="p-3 bg-slate-50"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input className="input w-full rounded-lg pl-9 text-sm" placeholder="Search products…" value={searchQ} onChange={e => setSearchQ(e.target.value)} autoFocus /></div></div>
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

              {/* Manual Entry mode */}
              {manualEntry && (
                <div className="rounded-xl border border-slate-200 p-3 space-y-2 bg-slate-50">
                  <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-500">New Item</span><button onClick={() => { setItems(prev => [...prev, { id: `item-${Date.now()}-${Math.random()}`, title: "", subDetails: "", model: "", tag: "", qty: 1, unit: "NOS.", unitPrice: 0 }]); }} className="text-xs text-primary-600 font-bold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button></div>
                  <input className="input w-full rounded-lg text-sm font-semibold" value={manualItem.title} onChange={e => setManualItem(prev => ({ ...prev, title: e.target.value }))} placeholder="Product name" />
                  <textarea className="input w-full rounded-lg text-sm resize-none" rows={2} value={manualItem.subDetails || ""} onChange={e => setManualItem(prev => ({ ...prev, subDetails: e.target.value }))} placeholder="Description" />
                  <div className="grid grid-cols-3 gap-2">
                    <input className="input w-full rounded-lg text-sm" type="number" value={manualItem.qty} onChange={e => setManualItem(prev => ({ ...prev, qty: Number(e.target.value) }))} placeholder="Qty" />
                    <input className="input w-full rounded-lg text-sm" value={manualItem.unit || ""} onChange={e => setManualItem(prev => ({ ...prev, unit: e.target.value }))} placeholder="Unit (e.g. NOS.)" />
                    <input className="input w-full rounded-lg text-sm" value={manualItem.tag || ""} onChange={e => setManualItem(prev => ({ ...prev, tag: e.target.value }))} placeholder="Badge" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input className="input w-full rounded-lg text-sm" type="number" value={manualItem.unitPrice} onChange={e => setManualItem(prev => ({ ...prev, unitPrice: Number(e.target.value) }))} placeholder="Rate" />
                    <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">₹{inr(manualItem.unitPrice * manualItem.qty)}</div>
                  </div>
                  <button onClick={() => { if (manualItem.title) { setItems(prev => [...prev, { ...manualItem, id: `item-${Date.now()}-${Math.random()}` }]); setManualItem({ id: "", title: "", subDetails: "", model: "", tag: "", qty: 1, unit: "NOS.", unitPrice: 0 }); } }} className="w-full py-2 rounded-lg bg-primary-600 text-white font-bold text-sm hover:bg-primary-700">Add to Quotation</button>
                </div>
              )}

              {items.length === 0 ? (
                <div className="text-center py-8 text-slate-400"><p className="text-sm">No items. Use Product List or Manual Entry to add.</p></div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {items.map((item, idx) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 p-3 space-y-2 bg-slate-50">
                      <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-500">#{idx + 1}</span><button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></div>
                      <input className="input w-full rounded-lg text-sm font-semibold" value={item.title} onChange={e => updateItem(item.id, "title", e.target.value)} placeholder="Product name" />
                      <textarea className="input w-full rounded-lg text-sm resize-none" rows={1} value={item.subDetails || ""} onChange={e => updateItem(item.id, "subDetails", e.target.value)} placeholder="Description" />
                      <div className="grid grid-cols-3 gap-2">
                        <input className="input w-full rounded-lg text-sm" type="number" value={item.qty} onChange={e => updateItem(item.id, "qty", Number(e.target.value))} placeholder="Qty" />
                        <input className="input w-full rounded-lg text-sm" value={item.unit || ""} onChange={e => updateItem(item.id, "unit", e.target.value)} placeholder="Unit" />
                        <input className="input w-full rounded-lg text-sm" value={item.tag || ""} onChange={e => updateItem(item.id, "tag", e.target.value)} placeholder="Badge" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input className="input w-full rounded-lg text-sm" type="number" value={item.unitPrice} onChange={e => updateItem(item.id, "unitPrice", Number(e.target.value))} placeholder="Rate" />
                        <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">₹{inr(item.unitPrice * item.qty)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card rounded-xl p-5 space-y-4">
              <h3 className="section-title mb-0">Technical Specs</h3>
              <div>
                <label className="label">JSON Specs</label>
                <textarea className="input w-full rounded-lg mt-1 resize-none font-mono text-sm" rows={8}
                  placeholder={`{\n  "CPU": "1214C",\n  "Supply": "24 VDC",\n  "Power": "11 kW"\n}`}
                  value={specsJson} onChange={e => applySpecsJson(e.target.value)} />
                <p className="text-xs text-slate-400 mt-1.5">Paste a flat JSON object. Nested objects and arrays are not supported.</p>
                {specsError && <p className="text-xs text-red-600 mt-1 font-semibold">{specsError}</p>}
              </div>
            </div>

            <div className="card rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between"><h3 className="section-title mb-0">Terms</h3><button onClick={() => { setEditTermIdx(-1); setEditTerm({ label: "", value: "" }); }} className="text-xs text-primary-600 font-bold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button></div>
              <div className="space-y-3">
                <div>
                  <label className="label">Warranty Period</label>
                  <input className="input w-full rounded-lg mt-1 text-sm" value={warranty} onChange={e => setTermValue("Warranty Period", e.target.value)} placeholder="e.g. 2 Years from the date of Invoice" />
                </div>
                <div>
                  <label className="label">Delivery Lead Time</label>
                  <input className="input w-full rounded-lg mt-1 text-sm" value={leadTime} onChange={e => setTermValue("Delivery Lead Time", e.target.value)} placeholder="e.g. 8 – 10 days from the date of payment / PO" />
                </div>
              </div>
              {editTermIdx !== null && (
                <div className="rounded-xl border border-primary-300 p-3 space-y-2 bg-primary-50">
                  <input className="input w-full rounded-lg text-sm" value={editTerm.label} onChange={e => setEditTerm(prev => ({ ...prev, label: e.target.value }))} placeholder="Label" />
                  <input className="input w-full rounded-lg text-sm" value={editTerm.value} onChange={e => setEditTerm(prev => ({ ...prev, value: e.target.value }))} placeholder="Value" />
                  <div className="flex gap-2"><button onClick={() => { if (editTermIdx === -1) setTerms(prev => [...prev, editTerm]); else setTerms(prev => prev.map((t, i) => i === editTermIdx ? editTerm : t)); setEditTermIdx(null); }} className="px-3 py-1.5 rounded-lg bg-primary-600 text-white font-bold text-xs">Save</button><button onClick={() => setEditTermIdx(null)} className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs">Cancel</button></div>
                </div>
              )}
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {terms.map((t, i) => (
                  <div key={t.label} className="flex items-center justify-between rounded-lg border border-slate-200 p-2 bg-white">
                    <div><p className="text-xs font-bold text-primary-700">{t.label}</p><p className="text-xs text-slate-500 truncate">{t.value}</p></div>
                    <div className="flex gap-1 ml-2"><button onClick={() => { setEditTermIdx(i); setEditTerm(t); }} className="text-slate-400 hover:text-primary-600"><Edit3 className="w-3 h-3" /></button><button onClick={() => setTerms(prev => prev.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card rounded-xl p-5 space-y-4">
              <h3 className="section-title mb-3">Sign-off</h3>
              <input className="input w-full rounded-lg text-sm" value={signoff.name} onChange={e => setSignoff(prev => ({ ...prev, name: e.target.value }))} placeholder="Name" />
              <input className="input w-full rounded-lg text-sm" value={signoff.role} onChange={e => setSignoff(prev => ({ ...prev, role: e.target.value }))} placeholder="Role" />
              <input className="input w-full rounded-lg text-sm" value={signoff.lines[0]} onChange={e => setSignoff(prev => ({ ...prev, lines: [e.target.value, prev.lines[1], prev.lines[2]] }))} placeholder="Location" />
            </div>

            <div className="card rounded-xl p-5 space-y-3">
              <h3 className="section-title mb-3">Actions</h3>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                <input type="checkbox" checked={showQr} onChange={e => setShowQr(e.target.checked)} className="w-4 h-4 accent-primary-600" />
                Include QR code (public view link) on the document
              </label>
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
                <div ref={printRef}><QuotationPreview q={q} /></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Share2 className="w-5 h-5 text-amber-500" /> Share Quotation</h2><button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div>
            <div><label className="label">Recipient Email</label><input className="input w-full rounded-lg mt-1 text-sm" value={shareEmail} onChange={e => setShareEmail(e.target.value)} placeholder="client@example.com" /></div>
            <div className="rounded-lg p-3 text-sm bg-slate-50 border border-slate-200">
              <p className="text-slate-500">Document: <span className="text-slate-900 font-bold">{refNo}</span></p>
              <p className="text-slate-500">Client: <span className="text-slate-900 font-bold">{client.name}</span></p>
              <p className="text-slate-500 mt-2">The email page will open with this quotation attached.</p>
            </div>
            <div className="flex gap-3"><button onClick={() => setShowShareModal(false)} className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-600 font-bold text-sm">Cancel</button><button onClick={handleShareEmail} disabled={!shareEmail} className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm disabled:opacity-40">Open Email</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuotationPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen bg-slate-50"><AdminSidebar /><main className="flex-1 p-8 text-slate-500">Loading quotation…</main></div>}>
      <QuotationPageInner />
    </Suspense>
  );
}
