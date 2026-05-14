"use client";
import { useState, useRef } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { getAllOrders, getAllProducts } from "@/utils/data";
import { formatINR, formatDate } from "@/utils/helpers";
import type { Order } from "@/types";
import {
  FileText, Printer, Download, CheckCircle, Search,
  Building2, MapPin, Phone, Mail, Zap, X, ChevronDown
} from "lucide-react";

const COMPANY = {
  name:    "TechEdge Market Pvt. Ltd.",
  address: "Plot 12, Hi-Tech City, Madhapur, Hyderabad – 500 081, Telangana, India",
  phone:   "+91-40-1234-5678",
  email:   "sales@techedgemarket.in",
  gstin:   "36AABCT1234Z1Z5",
  pan:     "AABCT1234Z",
  cin:     "U72200TG2009PTC063821",
  bank:    "HDFC Bank Ltd.",
  account: "50200012345678",
  ifsc:    "HDFC0001234",
  branch:  "Hi-Tech City, Hyderabad",
};

function InvoicePreview({ order, invoiceNo, invoiceDate }: { order: Order; invoiceNo: string; invoiceDate: string }) {
  const subtotal = order.items.reduce((s, i) => s + i.totalPrice, 0);
  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const total = subtotal + cgst + sgst + (order.shipping || 0);
  const inWords = numberToWords(Math.round(total));

  return (
    <div id="invoice-print" className="bg-white text-gray-900 font-body" style={{ width: "794px", minHeight: "1123px", padding: "48px", fontFamily: "'Outfit', sans-serif", fontSize: "13px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #1340e1", paddingBottom: "20px", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <div style={{ width: "36px", height: "36px", background: "#1a56f5", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "22px", letterSpacing: "0.05em" }}>
                Tech<span style={{ color: "#f59e0b" }}>Edge</span> Market
              </div>
              <div style={{ fontSize: "9px", color: "#64748b", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>Est. 2009 · Hyderabad</div>
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "#475569", lineHeight: "1.6" }}>
            <div>{COMPANY.address}</div>
            <div>Ph: {COMPANY.phone} | {COMPANY.email}</div>
            <div style={{ fontWeight: 700, marginTop: "4px" }}>GSTIN: {COMPANY.gstin} | PAN: {COMPANY.pan}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ background: "#1a56f5", color: "white", padding: "6px 18px", borderRadius: "6px", fontWeight: 800, fontSize: "18px", letterSpacing: "0.1em", marginBottom: "12px" }}>
            TAX INVOICE
          </div>
          <table style={{ fontSize: "12px", textAlign: "left" }}>
            <tbody>
              <tr><td style={{ color: "#64748b", paddingRight: "12px", paddingBottom: "4px" }}>Invoice No.</td><td style={{ fontWeight: 700 }}>{invoiceNo}</td></tr>
              <tr><td style={{ color: "#64748b", paddingRight: "12px", paddingBottom: "4px" }}>Invoice Date</td><td style={{ fontWeight: 700 }}>{formatDate(invoiceDate)}</td></tr>
              <tr><td style={{ color: "#64748b", paddingRight: "12px", paddingBottom: "4px" }}>Order No.</td><td style={{ fontWeight: 700 }}>{order.orderNumber}</td></tr>
              {order.poReference && <tr><td style={{ color: "#64748b", paddingRight: "12px" }}>PO Ref.</td><td style={{ fontWeight: 700 }}>{order.poReference}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill To / Ship To */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
        {[
          { title: "Bill To", content: [order.customer.company, order.customer.name, order.shippingAddress.street, `${order.shippingAddress.city}, ${order.shippingAddress.state} – ${order.shippingAddress.zip}`, order.customer.email] },
          { title: "Ship To", content: [order.customer.company, order.shippingAddress.street, `${order.shippingAddress.city}, ${order.shippingAddress.state} – ${order.shippingAddress.zip}`, `Payment: ${order.paymentMethod}`] },
        ].map(({ title, content }) => (
          <div key={title} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px" }}>
            <div style={{ fontWeight: 800, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#1a56f5", marginBottom: "8px", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>{title}</div>
            {content.map((line, i) => <div key={i} style={{ fontSize: "12px", color: i === 0 ? "#1e293b" : "#475569", fontWeight: i === 0 ? 700 : 400, lineHeight: "1.7" }}>{line}</div>)}
          </div>
        ))}
      </div>

      {/* Items table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px", fontSize: "12px" }}>
        <thead>
          <tr style={{ background: "#0f172a", color: "white" }}>
            {["#","Description","HSN Code","Qty","Unit Rate","Taxable Amt","CGST 9%","SGST 9%","Total"].map(h => (
              <th key={h} style={{ padding: "10px 12px", textAlign: h === "#" || h === "Qty" ? "center" : h.includes("Total") || h.includes("Amt") || h.includes("Rate") || h.includes("GST") ? "right" : "left", fontSize: "10px", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={item.sku} style={{ background: i % 2 === 0 ? "#f8fafc" : "white", borderBottom: "1px solid #e2e8f0" }}>
              <td style={{ padding: "10px 12px", textAlign: "center", color: "#64748b" }}>{i + 1}</td>
              <td style={{ padding: "10px 12px" }}>
                <div style={{ fontWeight: 600, color: "#1e293b" }}>{item.productName}</div>
                <div style={{ fontSize: "10px", color: "#94a3b8", fontFamily: "monospace" }}>SKU: {item.sku}</div>
              </td>
              <td style={{ padding: "10px 12px", textAlign: "center", color: "#64748b", fontFamily: "monospace" }}>8537</td>
              <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700 }}>{item.quantity}</td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>₹{item.unitPrice.toLocaleString("en-IN")}</td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>₹{item.totalPrice.toLocaleString("en-IN")}</td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>₹{(item.totalPrice * 0.09).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>₹{(item.totalPrice * 0.09).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>₹{(item.totalPrice * 1.18).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
        <table style={{ fontSize: "12px", minWidth: "260px" }}>
          <tbody>
            {[
              { label: "Taxable Amount", val: subtotal },
              { label: "CGST @ 9%", val: cgst },
              { label: "SGST @ 9%", val: sgst },
              ...(order.shipping ? [{ label: "Freight Charges", val: order.shipping }] : []),
            ].map(r => (
              <tr key={r.label}>
                <td style={{ padding: "5px 12px", color: "#64748b", textAlign: "right" }}>{r.label}</td>
                <td style={{ padding: "5px 12px", textAlign: "right", fontFamily: "monospace" }}>₹{r.val.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
              </tr>
            ))}
            <tr style={{ background: "#1a56f5", color: "white" }}>
              <td style={{ padding: "10px 12px", fontWeight: 800, textAlign: "right", fontSize: "13px" }}>Grand Total</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, fontSize: "14px", fontFamily: "monospace" }}>₹{Math.round(total).toLocaleString("en-IN")}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Amount in words */}
      <div style={{ background: "#f0f4ff", border: "1px solid #c7d7fe", borderRadius: "8px", padding: "10px 16px", marginBottom: "20px" }}>
        <span style={{ fontWeight: 700, fontSize: "11px", color: "#1a56f5" }}>Amount in Words: </span>
        <span style={{ fontSize: "12px", color: "#1e293b" }}>{inWords} Only</span>
      </div>

      {/* Bank details + T&C */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
        <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px" }}>
          <div style={{ fontWeight: 800, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#1a56f5", marginBottom: "8px" }}>Bank Details</div>
          {[["Bank", COMPANY.bank], ["A/C No.", COMPANY.account], ["IFSC", COMPANY.ifsc], ["Branch", COMPANY.branch]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: "8px", fontSize: "11px", marginBottom: "3px" }}>
              <span style={{ color: "#64748b", minWidth: "56px" }}>{k}:</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px" }}>
          <div style={{ fontWeight: 800, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#1a56f5", marginBottom: "8px" }}>Terms & Conditions</div>
          <ul style={{ fontSize: "10px", color: "#64748b", lineHeight: "1.8", paddingLeft: "14px" }}>
            <li>Payment due within 30 days of invoice date.</li>
            <li>Goods once sold are not returnable unless defective.</li>
            <li>All disputes subject to Hyderabad jurisdiction.</li>
            <li>E. & O.E. — Errors and Omissions Excepted.</li>
          </ul>
        </div>
      </div>

      {/* Signature */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "2px solid #e2e8f0", paddingTop: "16px" }}>
        <div style={{ fontSize: "10px", color: "#94a3b8" }}>
          <div>This is a computer-generated invoice and does not require a physical signature.</div>
          <div>CIN: {COMPANY.cin}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "120px", borderBottom: "1px dashed #94a3b8", marginBottom: "4px" }} />
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#1e293b" }}>Authorised Signatory</div>
          <div style={{ fontSize: "10px", color: "#64748b" }}>TechEdge Market Pvt. Ltd.</div>
        </div>
      </div>
    </div>
  );
}

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

export default function InvoicePage() {
  const orders = getAllOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || "");
  const [invoiceNo, setInvoiceNo] = useState(`TEM/INV/25-${String(orders.length + 1).padStart(4, "0")}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [generated, setGenerated] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const selectedOrder = orders.find(o => o.id === selectedOrderId) || orders[0];

  const handlePrint = () => {
    const content = document.getElementById("invoice-print");
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head>
        <title>Invoice ${invoiceNo}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          @page { margin: 0; size: A4; }
          body { margin: 0; padding: 0; }
          * { box-sizing: border-box; }
        </style>
      </head><body>${content.outerHTML}</body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 600);
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#0a0f1e" }}>
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-white/5 px-8 py-5 flex items-center justify-between" style={{ background: "rgba(15,23,42,0.7)" }}>
          <div>
            <h1 className="font-display font-bold text-2xl text-white tracking-wide flex items-center gap-3">
              <FileText className="w-6 h-6 text-gold-400" /> Invoice Generator
            </h1>
            <p className="text-iron-500 text-sm mt-0.5">Generate GST-compliant tax invoices for orders</p>
          </div>
        </div>

        <div className="p-8 flex gap-8 max-w-screen-2xl mx-auto">
          {/* Left: Controls */}
          <div className="w-72 shrink-0 space-y-5">
            <div className="card-dark rounded-2xl p-5 space-y-4">
              <h3 className="font-display font-bold text-white text-lg border-b border-white/5 pb-3">Invoice Settings</h3>

              <div>
                <label className="label-dark">Select Order</label>
                <select className="input-dark w-full rounded-xl mt-1" value={selectedOrderId} onChange={e => { setSelectedOrderId(e.target.value); setGenerated(false); }}>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>{o.orderNumber} — {o.customer.company}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-dark">Invoice Number</label>
                <input className="input-dark w-full rounded-xl mt-1" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
              </div>

              <div>
                <label className="label-dark">Invoice Date</label>
                <input type="date" className="input-dark w-full rounded-xl mt-1" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
              </div>

              <button onClick={() => setGenerated(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-iron-950 font-black text-sm transition-all">
                <FileText className="w-4 h-4" /> Generate Invoice
              </button>

              {generated && (
                <>
                  <button onClick={handlePrint}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-navy-600 hover:bg-navy-500 text-white font-bold text-sm transition-all">
                    <Printer className="w-4 h-4" /> Print / Download PDF
                  </button>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 text-xs font-bold">Invoice Ready</span>
                  </div>
                </>
              )}
            </div>

            {/* Order summary */}
            {selectedOrder && (
              <div className="card-dark rounded-2xl p-5 space-y-2.5 text-sm">
                <h4 className="font-bold text-white border-b border-white/5 pb-2">Order Summary</h4>
                <div className="flex justify-between"><span className="text-iron-400">Order No.</span><span className="font-mono text-navy-400 font-bold">{selectedOrder.orderNumber}</span></div>
                <div className="flex justify-between"><span className="text-iron-400">Customer</span><span className="text-iron-200 font-medium text-right max-w-[140px] truncate">{selectedOrder.customer.company}</span></div>
                <div className="flex justify-between"><span className="text-iron-400">Items</span><span className="text-white font-bold">{selectedOrder.items.length}</span></div>
                <div className="flex justify-between border-t border-white/5 pt-2"><span className="text-iron-400">Total (incl. GST)</span><span className="text-gold-400 font-display font-bold text-base">{formatINR(selectedOrder.total)}</span></div>
              </div>
            )}
          </div>

          {/* Right: Invoice Preview */}
          <div className="flex-1">
            {!generated ? (
              <div className="flex flex-col items-center justify-center h-96 text-iron-500">
                <FileText className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-display font-bold text-xl text-iron-400">Select an order and click Generate Invoice</p>
                <p className="text-sm mt-1">A print-ready GST invoice will appear here</p>
              </div>
            ) : (
              <div className="bg-iron-200 rounded-2xl p-6 overflow-auto">
                <div ref={printRef} className="shadow-2xl mx-auto" style={{ width: "794px" }}>
                  <InvoicePreview order={selectedOrder} invoiceNo={invoiceNo} invoiceDate={invoiceDate} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
