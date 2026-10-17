"use client";
import { useState, useRef } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { getAllProducts } from "@/utils/data";
import { FileSpreadsheet, Printer, Plus, Trash2, Search, Share2, X, Eye, Edit3 } from "lucide-react";
import { COMPANY, numberToWords, inr, formatDate, generateRefNo } from "@/utils/documents";
import type { DocLineItem, DocParty, DocSpec, DocTerm } from "@/types";
import ExcelJS from "exceljs";

const VIP_TIERS = [
  { label: "Standard", discount: 0, minValue: 0, badge: "—" },
  { label: "Silver Partner", discount: 5, minValue: 50000, badge: "SILVER" },
  { label: "Gold Partner", discount: 8, minValue: 150000, badge: "GOLD" },
  { label: "Platinum VIP", discount: 12, minValue: 500000, badge: "PLATINUM" },
  { label: "Diamond VIP", discount: 15, minValue: 1000000, badge: "DIAMOND" },
];

const DEFAULT_CUSTOMERS = [
  { id: "c001", name: "Raj Mehta", company: "Indopack Machines Pvt. Ltd.", tier: 2, totalSpent: 2840000, gstin: "27AABCI1234B1Z5", address: "Plot 45, MIDC Industrial Area, Pune – 411018", email: "raj@indopack.com" },
  { id: "c002", name: "Priya Nair", company: "GreenPower Electrical", tier: 1, totalSpent: 680000, gstin: "33AABCG5678D1Z8", address: "12 Anna Salai, Chennai – 600002", email: "priya@greenpower.in" },
  { id: "c003", name: "Sameer Kulkarni", company: "AutoTek Manufacturing", tier: 3, totalSpent: 8200000, gstin: "24AABCA9012F1Z2", address: "Sector 18, Gurgaon – 122015", email: "sameer@autotek.com" },
  { id: "c004", name: "Meena Shah", company: "Flexitron Automation", tier: 1, totalSpent: 450000, gstin: "07AABCF3456H1Z6", address: "GIDC Estate, Ahmedabad – 380015", email: "meena@flexitron.in" },
  { id: "c005", name: "Ravi Krishnamurthy", company: "Reliance Industries Ltd.", tier: 4, totalSpent: 54000000, gstin: "27AABCR7890J1Z3", address: "Navi Mumbai, Maharashtra – 400701", email: "ravi.k@ril.com" },
];

function QuotationPreview({ q }: { q: any }) {
  const subtotal = q.items.reduce((s: any, i: any) => s + i.unitPrice * i.qty, 0);
  const discAmount = subtotal * (q.totalDisc / 100);
  const taxable = subtotal - discAmount;
  const gstAmt = taxable * q.gstRate;
  const grand = taxable + gstAmt;
  const grandWords = numberToWords(Math.round(grand)) + " Rupees Only";
  const gstPct = Math.round(q.gstRate * 100);
  const logoUrl = typeof window !== "undefined" ? `${window.location.origin}/techedgemarket_ecommerce/logo/TEM-dark.png` : "";
  const bdr = "1px solid #000";
  const bdrLight = "1px solid #ccc";

  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "9px", color: "#000", lineHeight: "1.4", padding: "10mm 12mm", maxWidth: "210mm", margin: "0 auto", background: "white" }}>
      {/* Heading */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src={logoUrl} alt="TEM" style={{ height: "42px", width: "auto", objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "1px" }}>QUOTATION</div>
            <div style={{ fontSize: "8px", fontStyle: "italic", color: "#333" }}>(Subject to realization)</div>
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: "9px" }}>
          <table style={{ borderCollapse: "collapse", marginLeft: "auto" }}>
            <tbody>
              {[["Ref No.", q.refNo], ["Date", q.date ? formatDate(q.date) : ""], ["Valid Till", q.validTill ? formatDate(q.validTill) : ""]].map(([k, v]) => (
                <tr key={k}><td style={{ padding: "1px 8px 1px 0", fontSize: "8px", color: "#444", textAlign: "right" }}>{k}</td><td style={{ padding: "1px 0", fontWeight: 700, fontSize: "9px", textAlign: "right" }}>{v || "—"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main grid — two columns */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "0" }}>
        <tbody>
          <tr>
            {/* LEFT: Seller + Offer To */}
            <td style={{ width: "62%", verticalAlign: "top", border: bdr, padding: "6px 8px" }}>
              {/* Seller */}
              <div style={{ fontWeight: 800, fontSize: "10px", textTransform: "uppercase", marginBottom: "3px" }}>{COMPANY.name}</div>
              <div style={{ fontSize: "8.5px", lineHeight: "1.55", color: "#222" }}>
                <div>{COMPANY.address}</div>
                <div>Ph: {COMPANY.phone} · {COMPANY.email}</div>
                <div>GSTIN: <b>{COMPANY.gstin}</b> &nbsp; PAN: {COMPANY.pan}</div>
              </div>

              <div style={{ borderTop: bdrLight, marginTop: "6px", paddingTop: "5px" }}>
                <div style={{ fontSize: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px", color: "#444" }}>Offer To</div>
                <div style={{ fontWeight: 700, fontSize: "9.5px", textTransform: "uppercase" }}>{q.client?.name || "—"}</div>
                {q.client?.attention && <div style={{ fontSize: "8.5px", color: "#444" }}>{q.client.attention}</div>}
                {q.client?.address && <div style={{ fontSize: "8.5px", lineHeight: "1.5", color: "#222" }}>{q.client.address}</div>}
                {q.client?.gstin && <div style={{ fontSize: "8.5px" }}>GSTIN: <b>{q.client.gstin}</b></div>}
                {q.client?.email && <div style={{ fontSize: "8.5px" }}>Email: {q.client.email}</div>}
              </div>
            </td>

            {/* RIGHT: Subject */}
            <td style={{ width: "38%", verticalAlign: "top", border: bdr, borderLeft: "none", padding: "6px 8px" }}>
              <div style={{ fontSize: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px", color: "#444" }}>Subject</div>
              {q.subjectTitle && <div style={{ fontWeight: 700, fontSize: "9.5px", marginBottom: "4px" }}>{q.subjectTitle}</div>}
              {q.subjectBody && <div style={{ fontSize: "8.5px", lineHeight: "1.55", color: "#222", whiteSpace: "pre-line" }}>{q.subjectBody}</div>}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Technical Specifications (if any) */}
      {q.specs.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0", marginBottom: "0" }}>
          <thead>
            <tr>
              <th colSpan={3} style={{ border: bdr, padding: "3px 6px", fontSize: "8px", fontWeight: 700, textAlign: "left" }}>Technical Specifications</th>
            </tr>
          </thead>
          <tbody>
            {q.specs.map((s: any, i: number) => (
              <tr key={s.key}>
                <td style={{ border: bdr, padding: "3px 6px", width: "20px", textAlign: "center", fontSize: "8px" }}>{i + 1}</td>
                <td style={{ border: bdr, padding: "3px 6px", width: "180px", fontWeight: 600, fontSize: "8.5px" }}>{s.key}</td>
                <td style={{ border: bdr, padding: "3px 6px", fontSize: "8.5px" }}>{s.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Price Schedule table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0", border: bdr }}>
        <thead>
          <tr>
            {["Sl. No.", "Product Description", "Qty", "Unit", "Special Price (Rs.)"].map((h, i) => (
              <th key={h} style={{ borderRight: i < 4 ? bdr : "none", borderBottom: bdr, padding: "4px 6px", fontSize: "8px", fontWeight: 700, textAlign: i === 0 || i === 2 || i === 3 ? "center" : "left" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {q.items.map((item: any, i: number) => {
            const showDivider = q.items.length > 1 && i < q.items.length - 1;
            const cellBdr = { borderRight: bdr, borderBottom: showDivider ? bdr : "none" };
            return (
              <tr key={item.id}>
                <td style={{ ...cellBdr, padding: "6px 6px", textAlign: "center", fontSize: "8.5px" }}>{i + 1}</td>
                <td style={{ ...cellBdr, padding: "6px 8px", verticalAlign: "top" }}>
                  <div style={{ fontWeight: 700, fontSize: "9.5px" }}>{item.title}</div>
                  {item.subDetails && <div style={{ fontSize: "8px", color: "#444", marginTop: "1px" }}>{item.subDetails}</div>}
                  {item.tag && <span style={{ display: "inline-block", marginTop: "3px", fontSize: "7.5px", color: "#16a34a", border: "1px solid #86efac", background: "#f0fdf4", borderRadius: "2px", padding: "0 4px" }}>{item.tag}</span>}
                </td>
                <td style={{ ...cellBdr, padding: "6px 6px", textAlign: "center", fontWeight: 700, fontSize: "8.5px" }}>{item.qty}</td>
                <td style={{ ...cellBdr, padding: "6px 6px", textAlign: "center", fontSize: "8.5px" }}>{item.unit}</td>
                <td style={{ borderBottom: showDivider ? bdr : "none", padding: "6px 6px", textAlign: "right" }}>
                  <span style={{ fontWeight: 700, fontSize: "8.5px" }}>{inr(item.unitPrice)}/-</span>
                  {q.totalDisc > 0 && <span style={{ fontSize: "7.5px", color: "#666", display: "block" }}>+ GST @ {gstPct}%</span>}
                </td>
              </tr>
            );
          })}
          {/* Blank rows to fill table height */}
          {Array.from({ length: Math.max(0, 16 - q.items.length) }).map((_, i) => (
            <tr key={`blank-${i}`} style={{ height: "24px" }}>
              {["Sl. No.", "Product Description", "Qty", "Unit", "Special Price (Rs.)"].map((_, j) => (
                <td key={j} style={{ borderRight: j < 4 ? bdr : "none" }}></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      {q.items.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "4px" }}>
            <table style={{ borderCollapse: "collapse", minWidth: "260px" }}>
              <tbody>
                <tr><td style={{ padding: "3px 10px", fontSize: "8.5px", color: "#444" }}>Sub Total</td><td style={{ padding: "3px 10px", textAlign: "right", fontWeight: 600, fontSize: "8.5px" }}>{inr(subtotal)}/-</td></tr>
                {q.totalDisc > 0 && <tr><td style={{ padding: "3px 10px", fontSize: "8.5px", color: "#444" }}>Discount ({q.totalDisc}%)</td><td style={{ padding: "3px 10px", textAlign: "right", fontWeight: 600, fontSize: "8.5px", color: "#16a34a" }}>− {inr(discAmount)}/-</td></tr>}
                <tr><td style={{ padding: "3px 10px", fontSize: "8.5px", color: "#444" }}>Taxable Amount</td><td style={{ padding: "3px 10px", textAlign: "right", fontWeight: 600, fontSize: "8.5px" }}>{inr(taxable)}/-</td></tr>
                <tr><td style={{ padding: "3px 10px", fontSize: "8.5px", color: "#444" }}>GST @ {gstPct}%</td><td style={{ padding: "3px 10px", textAlign: "right", fontWeight: 600, fontSize: "8.5px" }}>{inr(gstAmt)}/-</td></tr>
                <tr><td style={{ padding: "6px 10px", background: "#222", color: "white", fontWeight: 700, fontSize: "10px" }}>Grand Total</td><td style={{ padding: "6px 10px", background: "#222", color: "white", textAlign: "right", fontWeight: 700, fontSize: "10px" }}>{inr(grand)}/-</td></tr>
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: "8.5px", marginBottom: "4px" }}>
            <span style={{ fontWeight: 700 }}>Amount in Words: </span><span style={{ fontWeight: 700, textTransform: "uppercase" }}>{grandWords}</span>
          </div>
        </>
      )}

      {/* Terms & Conditions */}
      {q.terms.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", border: bdr, marginBottom: "6px", marginTop: "6px" }}>
          <thead>
            <tr><th colSpan={2} style={{ border: bdr, padding: "3px 6px", fontSize: "8px", fontWeight: 700, textAlign: "left" }}>Terms & Conditions</th></tr>
          </thead>
          <tbody>
            {q.terms.map((t: any) => (
              <tr key={t.label}>
                <td style={{ border: bdr, width: "30%", fontWeight: 700, fontSize: "8px", padding: "4px 8px", verticalAlign: "top" }}>{t.label}</td>
                <td style={{ border: bdr, fontSize: "8px", padding: "4px 8px", verticalAlign: "top", lineHeight: "1.5" }}>{t.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Sign-off */}
      {q.signoff?.name && (
        <div style={{ marginTop: "12px", fontSize: "8.5px", color: "#222", lineHeight: "1.5" }}>
          <div style={{ fontStyle: "italic", color: "#444", marginBottom: "2px" }}>Thanks & Regards,</div>
          <div style={{ fontWeight: 700, fontSize: "10px" }}>{q.signoff.name}</div>
          <div style={{ fontWeight: 600 }}>{q.signoff.role}</div>
          {q.signoff.lines.map((l: string, i: number) => <div key={i}>{l}</div>)}
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: "10px", borderTop: bdrLight, paddingTop: "4px", textAlign: "center", fontSize: "7.5px", color: "#666" }}>
        <div><span style={{ fontWeight: 700, color: "#222" }}>{COMPANY.name}</span> · {COMPANY.address} · {COMPANY.phone} · {COMPANY.email} · GSTIN {COMPANY.gstin}</div>
        <div>This is a computer-generated quotation.</div>
      </div>
    </div>
  );
}

export default function QuotationPage() {
  const allProducts = getAllProducts();
  const [refNo, setRefNo] = useState(generateRefNo("QTN", Math.floor(Math.random() * 9000) + 1000));
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [validDays, setValidDays] = useState(30);
  const validTill = new Date(Date.now() + validDays * 86400000).toISOString().split("T")[0];

  const [custId, setCustId] = useState(DEFAULT_CUSTOMERS[2].id);
  const [client, setClient] = useState<DocParty>({ name: DEFAULT_CUSTOMERS[2].company, attention: `Attn: ${DEFAULT_CUSTOMERS[2].name}`, address: DEFAULT_CUSTOMERS[2].address, email: DEFAULT_CUSTOMERS[2].email, gstin: DEFAULT_CUSTOMERS[2].gstin });
  const customer = DEFAULT_CUSTOMERS.find(c => c.id === custId);
  const tier = VIP_TIERS[customer?.tier || 0];

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
  const [tierDisc, setTierDisc] = useState(tier.discount);
  const [extraDisc, setExtraDisc] = useState(0);
  const totalDisc = Math.min(tierDisc + extraDisc, 30);
  const gstRate = 0.18;

  const [searchQ, setSearchQ] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [editSpecIdx, setEditSpecIdx] = useState<number | null>(null);
  const [editSpec, setEditSpec] = useState<DocSpec>({ key: "", value: "" });
  const [editTermIdx, setEditTermIdx] = useState<number | null>(null);
  const [editTerm, setEditTerm] = useState<DocTerm>({ label: "", value: "" });
  const printRef = useRef<HTMLDivElement>(null);

  const q = { refNo, date, validTill, client, subjectTitle, subjectBody, items, specs, terms, signoff, tierDisc, extraDisc, totalDisc, gstRate, tierLabel: tier.label };

  const addItem = (product: any) => {
    setItems(prev => [...prev, { id: `item-${Date.now()}-${Math.random()}`, title: product.name, subDetails: `${product.description || ""} · Model: ${product.model || product.partNumber}`, model: product.model || product.partNumber, tag: "CE Certified & CPRI Tested", qty: 1, unit: "NOS.", unitPrice: product.price }]);
    setShowPicker(false); setSearchQ("");
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const updateItem = (id: string, field: string, value: any) => setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));

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
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${refNo.replace(/\//g, "_")}.xlsx`; a.click(); URL.revokeObjectURL(url);
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
        <div className="border-b border-slate-200 px-8 py-5 flex items-center justify-between bg-white">
          <div>
            <h1 className="page-title flex items-center gap-3"><FileSpreadsheet className="w-7 h-7 text-primary-600" /> Quotation Generator</h1>
            <p className="page-sub">Create professional quotations with VIP discounts</p>
          </div>
          <button onClick={() => setShowPicker(!showPicker)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Product</button>
        </div>

        <div className="flex max-w-screen-2xl mx-auto">
          {/* Left: Form */}
          <div className="w-[420px] shrink-0 p-6 space-y-5 overflow-y-auto" style={{ maxHeight: "calc(100vh - 80px)" }}>
            <div className="card rounded-xl p-5 space-y-4">
              <h3 className="section-title mb-3">Reference & Dates</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Ref No.</label><input className="input w-full rounded-lg mt-1 text-sm" value={refNo} onChange={e => setRefNo(e.target.value)} /></div>
                <div><label className="label">Date</label><input type="date" className="input w-full rounded-lg mt-1 text-sm" value={date} onChange={e => setDate(e.target.value)} /></div>
                <div><label className="label">Valid For (days)</label><input type="number" min={1} max={90} className="input w-full rounded-lg mt-1 text-sm" value={validDays} onChange={e => setValidDays(Number(e.target.value))} /></div>
              </div>
            </div>

            <div className="card rounded-xl p-5 space-y-4">
              <h3 className="section-title mb-3">Client</h3>
              <div><label className="label">Select Customer</label>
                <select className="input w-full rounded-lg mt-1 text-sm" value={custId} onChange={e => { setCustId(e.target.value); const c = DEFAULT_CUSTOMERS.find(x => x.id === e.target.value); if (c) { setClient({ name: c.company, attention: `Attn: ${c.name}`, address: c.address, email: c.email, gstin: c.gstin }); setTierDisc(VIP_TIERS[c.tier].discount); } }}>
                  {DEFAULT_CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.company} — {c.name}</option>)}
                </select>
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
              <div><label className="label">Discount %</label><input type="number" min={0} max={30} className="input w-full rounded-lg mt-1 text-sm" value={totalDisc} onChange={e => { const v = Number(e.target.value); setTierDisc(Math.min(v, 30)); setExtraDisc(0); }} /></div>
            </div>

            <div className="card rounded-xl p-5 space-y-4">
              <h3 className="section-title mb-3">Subject</h3>
              <input className="input w-full rounded-lg text-sm" value={subjectTitle} onChange={e => setSubjectTitle(e.target.value)} placeholder="Supply of {{ product name }}" />
              <textarea className="input w-full rounded-lg text-sm resize-none" rows={3} value={subjectBody} onChange={e => setSubjectBody(e.target.value)} placeholder="Dear Sir,..." />
            </div>

            <div className="card rounded-xl p-5 space-y-4">
              <h3 className="section-title mb-3">Line Items ({items.length})</h3>
              {showPicker && (
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
              {items.length === 0 ? (
                <div className="text-center py-8 text-slate-400"><p className="text-sm">No products added.</p></div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {items.map((item, idx) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 p-3 space-y-2 bg-slate-50">
                      <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-500">#{idx + 1}</span><button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></div>
                      <input className="input w-full rounded-lg text-sm" value={item.title} onChange={e => updateItem(item.id, "title", e.target.value)} placeholder="Product title" />
                      <div className="grid grid-cols-3 gap-2">
                        <input className="input w-full rounded-lg text-sm" type="number" value={item.qty} onChange={e => updateItem(item.id, "qty", Number(e.target.value))} placeholder="Qty" />
                        <input className="input w-full rounded-lg text-sm" type="number" value={item.unitPrice} onChange={e => updateItem(item.id, "unitPrice", Number(e.target.value))} placeholder="Price" />
                        <input className="input w-full rounded-lg text-sm" value={item.tag || ""} onChange={e => updateItem(item.id, "tag", e.target.value)} placeholder="Badge" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between"><h3 className="section-title mb-0">Technical Specs</h3><button onClick={() => { setEditSpecIdx(-1); setEditSpec({ key: "", value: "" }); }} className="text-xs text-primary-600 font-bold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button></div>
              {editSpecIdx !== null && (
                <div className="rounded-xl border border-primary-300 p-3 space-y-2 bg-primary-50">
                  <input className="input w-full rounded-lg text-sm" value={editSpec.key} onChange={e => setEditSpec(prev => ({ ...prev, key: e.target.value }))} placeholder="Spec key" />
                  <input className="input w-full rounded-lg text-sm" value={editSpec.value} onChange={e => setEditSpec(prev => ({ ...prev, value: e.target.value }))} placeholder="Spec value" />
                  <div className="flex gap-2"><button onClick={() => { if (editSpecIdx === -1) setSpecs(prev => [...prev, editSpec]); else setSpecs(prev => prev.map((s, i) => i === editSpecIdx ? editSpec : s)); setEditSpecIdx(null); }} className="px-3 py-1.5 rounded-lg bg-primary-600 text-white font-bold text-xs">Save</button><button onClick={() => setEditSpecIdx(null)} className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs">Cancel</button></div>
                </div>
              )}
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {specs.map((s, i) => (
                  <div key={s.key} className="flex items-center justify-between rounded-lg border border-slate-200 p-2 bg-white">
                    <div><p className="text-xs font-bold text-primary-700">{s.key}</p><p className="text-xs text-slate-500 truncate">{s.value}</p></div>
                    <div className="flex gap-1 ml-2"><button onClick={() => { setEditSpecIdx(i); setEditSpec(s); }} className="text-slate-400 hover:text-primary-600"><Edit3 className="w-3 h-3" /></button><button onClick={() => setSpecs(prev => prev.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between"><h3 className="section-title mb-0">Terms</h3><button onClick={() => { setEditTermIdx(-1); setEditTerm({ label: "", value: "" }); }} className="text-xs text-primary-600 font-bold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button></div>
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
