"use client";
import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AdminSidebar from "@/components/layout/AdminSidebar";
import api from "@/lib/interceptor";
import { documentsApi } from "@/lib/documents";
import type { DocCreatePayload } from "@/lib/documents";
import { getAllProducts } from "@/utils/data";
import { FileText, Printer, Plus, Trash2, Search, Share2, X, Eye, FileSpreadsheet, Edit3, Copy, Save, Loader2, CheckCircle } from "lucide-react";
import { COMPANY, numberToWords, inr, formatDate } from "@/utils/documents";
import { InvoicePreview, SignatoryBox, SignatoryImageField, publicDocumentUrl } from "@/components/documents/previews";
import { proformaNumber } from "@/utils/proforma";
import type { CustomerAccount, DocLineItem, DocParty, DocTerm, Order } from "@/types";
import ExcelJS from "exceljs";

interface BackendOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  mobile: string;
  shippingAddress: { street: string; city: string; state: string; zip: string; country: string };
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  poReference: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: { id: string; productId: string; productName: string; sku: string; quantity: number; unitPrice: number; totalPrice: number }[];
}

function mapOrder(b: BackendOrder): Order {
  return {
    id: b.id,
    orderNumber: b.orderNumber,
    date: b.createdAt,
    status: b.status as Order["status"],
    items: b.items.map((i) => ({ productId: i.productId, productName: i.productName, sku: i.sku, quantity: i.quantity, unitPrice: i.unitPrice, totalPrice: i.totalPrice })),
    subtotal: b.subtotal,
    tax: b.taxAmount,
    shipping: b.shippingAmount,
    total: b.totalAmount,
    customer: { id: b.customerId, name: b.customerName, email: b.customerEmail, company: b.customerCompany },
    shippingAddress: b.shippingAddress,
    paymentMethod: b.paymentMethod,
    poReference: b.poReference ?? undefined,
    trackingEvents: [],
    notes: b.notes ?? undefined,
  };
}

const DEFAULT_TERMS: DocTerm[] = [
  { label: "Payment Terms", value: "Payment due within 30 days of invoice date." },
  { label: "Warranty", value: "Goods once sold are not returnable unless defective." },
  { label: "Jurisdiction", value: "All disputes subject to Kolkata jurisdiction." },
  { label: "Note", value: "E. & O.E. — Errors and Omissions Excepted." },
];


function ProformaInvoicePreview({ inv }: { inv: any }) {
  const subtotal = inv.items.reduce((s: any, i: any) => s + i.unitPrice * i.qty, 0);
  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const freight = inv.freight || 0;
  const total = subtotal + cgst + sgst + freight;
  const totalWords = numberToWords(Math.round(total));
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
            <div style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "1px" }}>PROFORMA INVOICE</div>
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: "9px" }}>
          <table style={{ borderCollapse: "collapse", marginLeft: "auto" }}>
            <tbody>
              {[["Proforma No.", inv.pinvNo || ""], ["Date", inv.date ? formatDate(inv.date) : ""], ["Order No.", inv.orderNo || ""]].map(([k, v]) => (
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
            {/* LEFT: Seller + Buyer */}
            <td style={{ width: "50%", verticalAlign: "top", border: bdr, padding: "6px 8px" }}>
              <div style={{ fontWeight: 800, fontSize: "10px", textTransform: "uppercase", marginBottom: "3px" }}>{COMPANY.name}</div>
              <div style={{ fontSize: "8.5px", lineHeight: "1.55", color: "#222" }}>
                <div>{COMPANY.address}</div>
                <div>GSTIN: <b>{COMPANY.gstin}</b></div>
                <div>PAN: {COMPANY.pan}</div>
                <div>State: West Bengal &nbsp; Code: 19</div>
              </div>

              <div style={{ borderTop: bdrLight, marginTop: "6px", paddingTop: "5px" }}>
                <div style={{ fontSize: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px", color: "#444" }}>Bill To</div>
                <div style={{ fontWeight: 700, fontSize: "9.5px", textTransform: "uppercase" }}>{inv.billTo?.name || "—"}</div>
                {inv.billTo?.address && <div style={{ fontSize: "8.5px", lineHeight: "1.5", color: "#222" }}>{inv.billTo.address}</div>}
                {inv.billTo?.gstin && <div style={{ fontSize: "8.5px" }}>GSTIN: <b>{inv.billTo.gstin}</b></div>}
                {inv.billTo?.state && <div style={{ fontSize: "8.5px" }}>State: {inv.billTo.state} &nbsp; Code: {inv.billTo.stateCode || "—"}</div>}
              </div>
            </td>

            {/* RIGHT: Payment & Reference */}
            <td style={{ width: "50%", verticalAlign: "top", border: bdr, borderLeft: "none", padding: "0" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {[
                    ["Payment Method", inv.paymentMethod || ""],
                    ["PO Reference", inv.poReference || ""],
                    ["Freight", freight > 0 ? inr(freight) : "—"],
                  ].map(([k, v], i) => (
                    <tr key={i}>
                      <td style={{ border: bdrLight, padding: "4px 5px", width: "50%", fontSize: "8px", color: "#444" }}>{k}</td>
                      <td style={{ border: bdrLight, padding: "4px 5px", width: "50%", fontWeight: 700, fontSize: "9px" }}>{v || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Line-item table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0", border: bdr }}>
        <thead>
          <tr>
            {["Sl. No.", "Description of Goods", "HSN/SAC", "Qty", "Rate", "Per", "Amount"].map((h, i) => (
              <th key={h} style={{ borderRight: i < 6 ? bdr : "none", borderBottom: bdr, padding: "4px 6px", fontSize: "8px", fontWeight: 700, textAlign: i === 0 || i === 3 ? "center" : i >= 4 ? "right" : "left" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(() => {
            const isInterState = inv.billTo?.state && inv.billTo.state.toLowerCase() !== "west bengal";
            const totalTaxable = subtotal;
            const totalIGST = isInterState ? totalTaxable * 0.18 : 0;
            const totalCGST = isInterState ? 0 : totalTaxable * 0.09;
            const totalSGST = isInterState ? 0 : totalTaxable * 0.09;
            const taxRows = isInterState ? 1 : 2;
            const totalRows = inv.items.length + taxRows;
            const blankCount = Math.max(0, 14 - totalRows);

            return (
              <>
                {inv.items.map((item: any, i: number) => {
                  const taxable = item.unitPrice * item.qty;
                  const showDivider = i < inv.items.length - 1 || blankCount > 0 || taxRows > 0;
                  const cellBdr = { borderRight: bdr, borderBottom: showDivider ? bdr : "none" };
                  return (
                    <tr key={item.id}>
                      <td style={{ ...cellBdr, padding: "6px 6px", textAlign: "center", fontSize: "8.5px" }}>{i + 1}</td>
                      <td style={{ ...cellBdr, padding: "6px 8px", verticalAlign: "top" }}>
                        <div style={{ fontWeight: 700, fontSize: "10.5px" }}>{item.title}</div>
                        {item.subDetails && <div style={{ fontSize: "8.5px", color: "#333", marginTop: "2px", lineHeight: "1.4" }}>{item.subDetails}</div>}
                        {item.model && <div style={{ fontSize: "8px", color: "#444", marginTop: "1px" }}>Model: {item.model}</div>}
                      </td>
                      <td style={{ ...cellBdr, padding: "6px 6px", textAlign: "center", fontSize: "8.5px" }}>{item.hsn || "8537"}</td>
                      <td style={{ ...cellBdr, padding: "6px 6px", textAlign: "center", fontSize: "8.5px" }}>{item.qty}</td>
                      <td style={{ ...cellBdr, padding: "6px 6px", textAlign: "right", fontSize: "8.5px" }}>{inr(item.unitPrice)}</td>
                      <td style={{ ...cellBdr, padding: "6px 6px", textAlign: "center", fontSize: "8.5px" }}>{item.per || "NOS"}</td>
                      <td style={{ borderBottom: showDivider ? bdr : "none", padding: "6px 6px", textAlign: "right", fontWeight: 700, fontSize: "8.5px" }}>{inr(taxable)}</td>
                    </tr>
                  );
                })}
                {Array.from({ length: blankCount }).map((_, i) => (
                  <tr key={`blank-${i}`} style={{ height: "28px" }}>
                    {["Sl. No.", "Description of Goods", "HSN/SAC", "Qty", "Rate", "Per", "Amount"].map((_, j) => (
                      <td key={j} style={{ borderRight: j < 6 ? bdr : "none" }}></td>
                    ))}
                  </tr>
                ))}
                {isInterState ? (
                  <tr>
                    <td style={{ borderRight: bdr, borderBottom: bdr }}></td>
                    <td style={{ borderRight: bdr, borderBottom: bdr, padding: "6px 8px", fontSize: "9px", fontStyle: "italic", fontWeight: 600 }}>Integrated GST (IGST) @ 18%</td>
                    <td style={{ borderRight: bdr, borderBottom: bdr }}></td>
                    <td style={{ borderRight: bdr, borderBottom: bdr }}></td>
                    <td style={{ borderRight: bdr, borderBottom: bdr, padding: "6px 6px", textAlign: "right", fontSize: "8.5px" }}>18</td>
                    <td style={{ borderRight: bdr, borderBottom: bdr, padding: "6px 6px", textAlign: "center", fontSize: "8.5px" }}>%</td>
                      <td style={{ borderBottom: bdr, padding: "6px 6px", textAlign: "right", fontWeight: 700, fontSize: "8.5px" }}>{inr(totalIGST)}</td>
                    </tr>
                  ) : (
                  <>
                    <tr>
                      <td style={{ borderRight: bdr, borderBottom: bdr }}></td>
                      <td style={{ borderRight: bdr, borderBottom: bdr, padding: "6px 8px", fontSize: "9px", fontStyle: "italic", fontWeight: 600 }}>Central GST (CGST) @ 9%</td>
                      <td style={{ borderRight: bdr, borderBottom: bdr }}></td>
                      <td style={{ borderRight: bdr, borderBottom: bdr }}></td>
                      <td style={{ borderRight: bdr, borderBottom: bdr, padding: "6px 6px", textAlign: "right", fontSize: "8.5px" }}>9</td>
                      <td style={{ borderRight: bdr, borderBottom: bdr, padding: "6px 6px", textAlign: "center", fontSize: "8.5px" }}>%</td>
                      <td style={{ borderBottom: bdr, padding: "6px 6px", textAlign: "right", fontWeight: 700, fontSize: "8.5px" }}>{inr(totalCGST)}</td>
                    </tr>
                    <tr>
                      <td style={{ borderRight: bdr, borderBottom: bdr }}></td>
                      <td style={{ borderRight: bdr, borderBottom: bdr, padding: "6px 8px", fontSize: "9px", fontStyle: "italic", fontWeight: 600 }}>State GST (SGST) @ 9%</td>
                      <td style={{ borderRight: bdr, borderBottom: bdr }}></td>
                      <td style={{ borderRight: bdr, borderBottom: bdr }}></td>
                      <td style={{ borderRight: bdr, borderBottom: bdr, padding: "6px 6px", textAlign: "right", fontSize: "8.5px" }}>9</td>
                      <td style={{ borderRight: bdr, borderBottom: bdr, padding: "6px 6px", textAlign: "center", fontSize: "8.5px" }}>%</td>
                      <td style={{ borderBottom: bdr, padding: "6px 6px", textAlign: "right", fontWeight: 700, fontSize: "8.5px" }}>{inr(totalSGST)}</td>
                    </tr>
                  </>
                )}
                <tr>
                  <td colSpan={3} style={{ borderTop: bdr, borderRight: bdr, padding: "5px 8px", fontWeight: 700, fontSize: "9px" }}>Total</td>
                  <td style={{ borderTop: bdr, borderRight: bdr, padding: "5px 6px", textAlign: "center", fontWeight: 700, fontSize: "8.5px" }}>{inv.items.reduce((s: number, item: any) => s + item.qty, 0)}</td>
                  <td style={{ borderTop: bdr, borderRight: bdr }}></td>
                  <td style={{ borderTop: bdr, borderRight: bdr }}></td>
                  <td style={{ borderTop: bdr, padding: "5px 6px", textAlign: "right", fontWeight: 800, fontSize: "10px" }}>₹{inr(Math.round(total))}</td>
                </tr>
              </>
            );
          })()}
        </tbody>
      </table>

      {/* Amount in words */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "4px", marginBottom: "4px" }}>
        <div style={{ fontSize: "8.5px" }}><span style={{ fontWeight: 700 }}>Amount Chargeable (in words): </span><span style={{ fontWeight: 700, textTransform: "uppercase" }}>Rupees {totalWords} Only</span></div>
        <div style={{ fontSize: "8px", fontStyle: "italic" }}>E. & O.E</div>
      </div>

      {/* Bank */}
      <div style={{ marginTop: "10px" }}>
        <div style={{ fontSize: "8.5px", fontWeight: 700, marginBottom: "3px" }}>Company's Bank Details</div>
        <div style={{ fontSize: "8.5px", lineHeight: "1.6" }}>
          <div><span style={{ color: "#444" }}>Bank:</span> HDFC Bank Ltd.</div>
          <div><span style={{ color: "#444" }}>A/C No:</span> 50200012345678</div>
          <div><span style={{ color: "#444" }}>Branch:</span> Kolkata &nbsp; <span style={{ color: "#444" }}>IFSC:</span> HDFC0001234</div>
        </div>
      </div>

      {/* Signatory */}
      <SignatoryBox url={inv.signatoryImage} />
      <div style={{ marginTop: "10px", textAlign: "right" }}>
        <div style={{ fontSize: "8.5px", fontWeight: 700 }}>{COMPANY.name}</div>
        <div style={{ fontSize: "8.5px", fontWeight: 600, marginTop: "2px" }}>Authorised Signatory</div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: "10px", borderTop: bdrLight, paddingTop: "4px", textAlign: "center", fontSize: "7.5px", color: "#666" }}>
        This is a Computer Generated Proforma Invoice
      </div>
    </div>
  );
}

function InvoicePageInner() {
  const searchParams = useSearchParams();
  const allProducts = getAllProducts();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [docId, setDocId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [pinvSeq, setPinvSeq] = useState(1);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [orderNo, setOrderNo] = useState("");
  const [poReference, setPoReference] = useState("");
  const [referenceDate, setReferenceDate] = useState("");
  const [buyersOrderDate, setBuyersOrderDate] = useState("");
  const [dispatchedThrough, setDispatchedThrough] = useState("");
  const [destination, setDestination] = useState("");
  const [freight, setFreight] = useState(0);
  const [billTo, setBillTo] = useState<DocParty>({ name: "", address: "", email: "", gstin: "", state: "", stateCode: "" });
  const [customers, setCustomers] = useState<CustomerAccount[]>([]);
  const [custId, setCustId] = useState("");
  const [shipTo, setShipTo] = useState<DocParty>({ name: "", address: "", state: "", stateCode: "" });
  const [paymentMethod, setPaymentMethod] = useState("Online");
  const [items, setItems] = useState<DocLineItem[]>([]);
  const [terms, setTerms] = useState<DocTerm[]>(DEFAULT_TERMS);
  const [searchQ, setSearchQ] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [sameAsBillTo, setSameAsBillTo] = useState(true);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualItem, setManualItem] = useState<DocLineItem>({ id: "", title: "", subDetails: "", model: "", hsn: "", per: "NOS", qty: 1, unitPrice: 0 });
  const [ewayBillNo, setEwayBillNo] = useState("");
  const [ewayBillDate, setEwayBillDate] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [transporterName, setTransporterName] = useState("");
  const [distance, setDistance] = useState("");
  const [irn, setIrn] = useState("");
  const [showQr, setShowQr] = useState(true);
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [ackNo, setAckNo] = useState("");
  const [ackDate, setAckDate] = useState("");
  const [signatoryImage, setSignatoryImage] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const proformaPrintRef = useRef<HTMLDivElement>(null);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000); };

  useEffect(() => {
    api.get<{ success: boolean; data: { items: BackendOrder[] } }>("/api/orders")
      .then(res => setOrders(res.data.data.items.map(mapOrder)))
      .catch(() => showToast("Failed to load orders", false))
      .finally(() => setOrdersLoading(false));
  }, []);

  useEffect(() => {
    documentsApi.listCustomers().then(setCustomers).catch(() => setCustomers([]));
  }, []);

  const selectCustomer = (id: string) => {
    setCustId(id);
    const c = customers.find(x => x.id === id);
    if (!c) return;
    const primary = (c.contacts ?? []).find(p => p.isPrimary) ?? (c.contacts ?? [])[0];
    const addr = [c.address, c.city].filter(Boolean).join(", ");
    const state = c.state ?? "";
    const stateCode = c.stateCode ?? "";
    const party: DocParty = {
      name: c.company,
      attention: primary ? `Attn: ${primary.name}${primary.role ? ` — ${primary.role}` : ""}` : "",
      mobile: c.mobile ?? undefined,
      email: c.email ?? "",
      address: addr,
      city: c.city ?? undefined,
      gstin: c.gstin ?? "",
      state,
      stateCode,
    };
    setBillTo(party);
    if (sameAsBillTo) setShipTo({ name: c.company, address: addr, state, stateCode });
  };

  const applyParty = (p: Record<string, string | undefined>) => {
    const addr = [p.address, p.city, p.state, p.stateCode].filter(Boolean).join(", ");
    setBillTo({ name: p.name ?? "", attention: p.attention, mobile: p.mobile, email: p.email, address: addr, gstin: p.gstin ?? "", state: p.state ?? "", stateCode: p.stateCode ?? "" });
    setShipTo({ name: p.name ?? "", address: addr, state: p.state ?? "", stateCode: p.stateCode ?? "" });
  };

  const loadFromOrder = useCallback(async (orderId: string) => {
    try {
      const prefill = await documentsApi.fromOrder(orderId);
      if (prefill.alreadyDocumented) {
        showToast(`Order already has ${prefill.alreadyDocumented.number} (${prefill.alreadyDocumented.status}) — edit it from All Documents`, false);
        setDocId(prefill.alreadyDocumented.id);
        setInvoiceNo(prefill.alreadyDocumented.number);
      }
      setOrderNo(prefill.orderNumber);
      setPoReference(prefill.poReference ?? "");
      setPaymentMethod(prefill.paymentMethod || "Online");
      applyParty(prefill.party);
      setItems(prefill.lineItems.map((li, i) => ({ id: `item-${i}-${li.productId}`, title: li.title, subDetails: "", model: li.model, hsn: li.hsn, per: "NOS", qty: li.qty, unitPrice: li.unitPrice })));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load order", false);
    }
  }, []);

  const loadDraft = useCallback(async (id: string) => {
    try {
      const doc = await documentsApi.get(id);
      const p = doc.payload as Record<string, unknown>;
      const party = (p["party"] ?? {}) as Record<string, string | undefined>;
      setDocId(doc.id);
      setInvoiceNo(doc.number);
      setDate(doc.issueDate.slice(0, 10));
      setOrderNo(String(p["orderNo"] ?? ""));
      setPoReference(String(p["poReference"] ?? ""));
      const extra = (p["extra"] ?? {}) as Record<string, string>;
      setPublicToken(doc.publicToken);
      setReferenceDate(extra["referenceDate"] ?? ""); setBuyersOrderDate(extra["buyersOrderDate"] ?? "");
      setDispatchedThrough(extra["dispatchedThrough"] ?? ""); setDestination(extra["destination"] ?? "");
      setShowQr(extra["showQr"] !== "false");
      setFreight(Number(p["freight"] ?? 0));
      setPaymentMethod(String(p["paymentMethod"] ?? "Online"));
      applyParty(party);
      const shipTo = (p["shipTo"] ?? null) as Record<string, string | undefined> | null;
      if (shipTo?.name) setShipTo({ name: shipTo.name ?? "", address: shipTo.address ?? "", state: shipTo.state ?? "", stateCode: shipTo.stateCode ?? "" });
      setItems(((p["items"] ?? []) as DocLineItem[]).map((it, i) => ({ ...it, id: it.id ?? `item-${i}` })));
      if (Array.isArray(p["terms"])) setTerms(p["terms"] as DocTerm[]);
      setEwayBillNo(extra["ewayBillNo"] ?? ""); setEwayBillDate(extra["ewayBillDate"] ?? "");
      setVehicleNo(extra["vehicleNo"] ?? ""); setTransporterName(extra["transporterName"] ?? ""); setDistance(extra["distance"] ?? "");
      setIrn(extra["irn"] ?? ""); setAckNo(extra["ackNo"] ?? ""); setAckDate(extra["ackDate"] ?? "");
      setSignatoryImage(extra["signatoryImage"] || null);
      showToast(`Loaded draft ${doc.number}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load draft", false);
    }
  }, []);

  useEffect(() => {
    const orderParam = searchParams.get("order");
    const idParam = searchParams.get("id");
    if (orderParam) { setSelectedOrderId(orderParam); loadFromOrder(orderParam); }
    else if (idParam) loadDraft(idParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, loadFromOrder, loadDraft]);

  const addItem = (product: any) => {
    setItems(prev => [...prev, { id: `item-${Date.now()}-${Math.random()}`, title: product.name, subDetails: product.description || "", model: product.sku || product.partNumber, hsn: "", per: "NOS", qty: 1, unitPrice: product.price }]);
    setShowPicker(false); setSearchQ("");
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const updateItem = (id: string, field: string, value: any) => setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));

  const filteredProds = allProducts.filter(p => {
    const q = searchQ.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.partNumber.toLowerCase().includes(q);
  });

  const buildCreatePayload = (): DocCreatePayload => {
    const sub = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
    const isInterState = !!billTo.state && billTo.state.toLowerCase() !== "west bengal";
    const cgst = isInterState ? 0 : sub * 0.09;
    const sgst = isInterState ? 0 : sub * 0.09;
    const igst = isInterState ? sub * 0.18 : 0;
    const total = Math.round(sub + cgst + sgst + igst + freight);
    return {
      type: "INVOICE",
      issueDate: date,
      partyName: billTo.name,
      orderId: selectedOrderId || undefined,
      party: { name: billTo.name, attention: billTo.attention, mobile: billTo.mobile, email: billTo.email, address: billTo.address, city: billTo.city, state: billTo.state, stateCode: billTo.stateCode, gstin: billTo.gstin },
      payload: {
        billTo, shipTo, items, terms, party: { name: billTo.name, attention: billTo.attention, mobile: billTo.mobile, email: billTo.email, address: billTo.address, city: billTo.city, state: billTo.state, stateCode: billTo.stateCode, gstin: billTo.gstin },
        totals: { subtotal: sub, cgst, sgst, igst, freight, total },
        invoiceNo, orderNo, poReference, freight, paymentMethod, pinvNo,
        extra: { ewayBillNo, ewayBillDate, vehicleNo, transporterName, distance, irn, ackNo, ackDate, referenceDate, buyersOrderDate, dispatchedThrough, destination, showQr: showQr ? "true" : "false", signatoryImage: signatoryImage ?? "" },
      },
    };
  };

  const handleSave = async () => {
    if (!billTo.name.trim()) { showToast("Bill To company name is required", false); return; }
    if (items.length === 0) { showToast("Add at least one line item", false); return; }
    setSaving(true);
    try {
      const payload = buildCreatePayload();
      const doc = docId ? await documentsApi.updateDraft(docId, payload.payload) : await documentsApi.create(payload);
      setDocId(doc.id);
      setPublicToken(doc.publicToken);
      setInvoiceNo(doc.number);
      showToast(`Saved as ${doc.number} (${doc.status})`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save invoice", false);
    } finally {
      setSaving(false);
    }
  };

  const pinvNo = proformaNumber(billTo.name, pinvSeq);
  const inv = { invoiceNo, pinvNo, date, orderNo, poReference, referenceDate, buyersOrderDate, dispatchedThrough, destination, billTo, shipTo, items, terms, freight, paymentMethod, ewayBillNo, ewayBillDate, vehicleNo, transporterName, distance, irn, ackNo, ackDate, signatoryImage, showQr, publicUrl: publicToken ? publicDocumentUrl(publicToken) : undefined };

  const handlePrint = () => {
    const el = printRef.current; if (!el) return;
    const w = window.open("", "_blank"); if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Invoice ${invoiceNo}</title><style>@page{size:A4;margin:0}body{margin:0;padding:0}*{box-sizing:border-box}</style></head><body>${el.innerHTML}</body></html>`);
    w.document.close(); setTimeout(() => w.print(), 600);
  };

  const handlePrintProforma = () => {
    const el = proformaPrintRef.current; if (!el) return;
    const w = window.open("", "_blank"); if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Proforma Invoice ${pinvNo}</title><style>@page{size:A4;margin:0}body{margin:0;padding:0}*{box-sizing:border-box}</style></head><body>${el.innerHTML}</body></html>`);
    w.document.close(); setTimeout(() => w.print(), 600);
  };

  const handleExportXLSX = async () => {
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;
    const total = subtotal + cgst + sgst + freight;
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Invoice", { properties: { tabColor: { argb: "2B3A52" } } });
    ws.mergeCells("A1:I1"); ws.getCell("A1").value = "TAX INVOICE"; ws.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF2B3A52" } };
    ws.mergeCells("A2:I2"); ws.getCell("A2").value = `Invoice No: ${invoiceNo} | Date: ${date ? formatDate(date) : ""}`; ws.getCell("A2").font = { size: 10, color: { argb: "FF64748B" } };
    ws.mergeCells("A3:I3"); ws.getCell("A3").value = `Bill To: ${billTo.name} | Order: ${orderNo}`; ws.getCell("A3").font = { size: 10, color: { argb: "FF64748B" } };
    ws.addRow([]);
    const headerRow = ws.addRow({ sl: "SL", title: "Description", hsn: "HSN", qty: "Qty", unitPrice: "Unit Rate", taxable: "Taxable Amt", cgst: "CGST 9%", sgst: "SGST 9%", total: "Total" });
    headerRow.eachCell(cell => { cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9 }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2B3A52" } }; });
    items.forEach((item, i) => { const taxable = item.unitPrice * item.qty; ws.addRow({ sl: i + 1, title: item.title, hsn: "8537", qty: item.qty, unitPrice: item.unitPrice, taxable, cgst: taxable * 0.09, sgst: taxable * 0.09, total: taxable * 1.18 }); });
    ws.addRow([]);
    ws.addRow({ sl: "", title: "Taxable Amount", hsn: "", qty: "", unitPrice: "", taxable: subtotal, cgst: "", sgst: "", total: "" });
    ws.addRow({ sl: "", title: "CGST @ 9%", hsn: "", qty: "", unitPrice: "", taxable: cgst, cgst: "", sgst: "", total: "" });
    ws.addRow({ sl: "", title: "SGST @ 9%", hsn: "", qty: "", unitPrice: "", taxable: sgst, cgst: "", sgst: "", total: "" });
    if (freight > 0) ws.addRow({ sl: "", title: "Freight", hsn: "", qty: "", unitPrice: "", taxable: freight, cgst: "", sgst: "", total: "" });
    ws.addRow({ sl: "", title: "Grand Total", hsn: "", qty: "", unitPrice: "", taxable: "", cgst: "", sgst: "", total: Math.round(total) });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${invoiceNo.replace(/[^a-zA-Z0-9-]/g, "_")}.xlsx`; a.click(); URL.revokeObjectURL(url);
  };

  const handleShareEmail = () => {
    if (!shareEmail) return;
    const params = new URLSearchParams({ to: shareEmail, subject: `Tax Invoice ${invoiceNo} from Tech Edge Market`, body: `Dear Sir,\n\nPlease find attached the Tax Invoice ${invoiceNo}.\n\nBest regards,\nTech Edge Market` });
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
            <h1 className="page-title flex items-center gap-3"><FileText className="w-7 h-7 text-primary-600" /> Invoice Generator</h1>
            <p className="page-sub">Generate GST-compliant tax invoices</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-outline flex items-center gap-2 border-primary-300 text-primary-700 hover:bg-primary-50 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {docId ? "Update Draft" : "Save Document"}
            </button>
            <button onClick={() => setShowPicker(!showPicker)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Item</button>
          </div>
        </div>

        <div className="flex max-w-screen-2xl mx-auto">
          {/* Left: Form */}
          <div className="w-[420px] shrink-0 p-6 space-y-5 overflow-y-auto" style={{ maxHeight: "calc(100vh - 80px)" }}>
            <div className="card rounded-xl p-5 space-y-4">
              <h3 className="section-title mb-3">Load from Order</h3>
              <div><label className="label">Select Order</label>
                <select className="input w-full rounded-lg mt-1 text-sm" value={selectedOrderId} onChange={e => { setSelectedOrderId(e.target.value); if (e.target.value) loadFromOrder(e.target.value); }}>
                  <option value="">— Choose an order —</option>
                  {ordersLoading && <option disabled>Loading orders…</option>}
                  {orders.map(o => <option key={o.id} value={o.id}>{o.orderNumber} — {o.customer?.company || o.customer?.name}</option>)}
                </select>
                {selectedOrder && <p className="text-xs text-slate-500 mt-2">Items and buyer details prefilled from the website order. Save will link the invoice to this order.</p>}
              </div>
            </div>

            <div className="card rounded-xl p-5 space-y-4">
              <h3 className="section-title mb-3">Invoice Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Invoice No.</label><input className="input w-full rounded-lg mt-1 text-sm" value={invoiceNo} readOnly placeholder="Assigned on save" title="The backend assigns the number when the document is saved" /></div>
                <div><label className="label">Invoice Date</label><input type="date" className="input w-full rounded-lg mt-1 text-sm" value={date} onChange={e => setDate(e.target.value)} /></div>
                <div><label className="label">Order No.</label><input className="input w-full rounded-lg mt-1 text-sm" value={orderNo} onChange={e => setOrderNo(e.target.value)} /></div>
                <div><label className="label">PO Reference</label><input className="input w-full rounded-lg mt-1 text-sm" value={poReference} onChange={e => setPoReference(e.target.value)} placeholder="Optional" /></div>
                <div><label className="label">Reference Date</label><input type="date" className="input w-full rounded-lg mt-1 text-sm" value={referenceDate} onChange={e => setReferenceDate(e.target.value)} /></div>
                <div><label className="label">Buyer's Order Date</label><input type="date" className="input w-full rounded-lg mt-1 text-sm" value={buyersOrderDate} onChange={e => setBuyersOrderDate(e.target.value)} /></div>
                <div><label className="label">Dispatched Through</label><input className="input w-full rounded-lg mt-1 text-sm" value={dispatchedThrough} onChange={e => setDispatchedThrough(e.target.value)} placeholder="e.g. By Road" /></div>
                <div><label className="label">Destination</label><input className="input w-full rounded-lg mt-1 text-sm" value={destination} onChange={e => setDestination(e.target.value)} placeholder="City / Place" /></div>
                <div><label className="label">Freight</label><input type="number" className="input w-full rounded-lg mt-1 text-sm" value={freight} onChange={e => setFreight(Number(e.target.value))} /></div>
                <div><label className="label">Payment Method</label><input className="input w-full rounded-lg mt-1 text-sm" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} /></div>
              </div>
            </div>

            <div className="card rounded-xl p-5 space-y-4">
              <h3 className="section-title mb-3">E-Way Bill Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">E-Way Bill No.</label><input className="input w-full rounded-lg mt-1 text-sm" value={ewayBillNo} onChange={e => setEwayBillNo(e.target.value)} placeholder="Optional" /></div>
                <div><label className="label">E-Way Bill Date</label><input type="date" className="input w-full rounded-lg mt-1 text-sm" value={ewayBillDate} onChange={e => setEwayBillDate(e.target.value)} /></div>
                <div><label className="label">Vehicle No.</label><input className="input w-full rounded-lg mt-1 text-sm" value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} placeholder="e.g. WB01AB1234" /></div>
                <div><label className="label">Transporter Name</label><input className="input w-full rounded-lg mt-1 text-sm" value={transporterName} onChange={e => setTransporterName(e.target.value)} placeholder="Optional" /></div>
                <div><label className="label">Distance (km)</label><input type="number" className="input w-full rounded-lg mt-1 text-sm" value={distance} onChange={e => setDistance(e.target.value)} placeholder="Optional" /></div>
              </div>
            </div>

            <div className="card rounded-xl p-5 space-y-4">
              <h3 className="section-title mb-3">e-Invoice Details</h3>
              <div className="space-y-2">
                <div><label className="label">IRN</label><input className="input w-full rounded-lg mt-1 text-sm" value={irn} onChange={e => setIrn(e.target.value)} placeholder="Optional" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="label">Ack No.</label><input className="input w-full rounded-lg mt-1 text-sm" value={ackNo} onChange={e => setAckNo(e.target.value)} placeholder="Optional" /></div>
                  <div><label className="label">Ack Date</label><input type="date" className="input w-full rounded-lg mt-1 text-sm" value={ackDate} onChange={e => setAckDate(e.target.value)} /></div>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none pt-1">
                  <input type="checkbox" checked={showQr} onChange={e => setShowQr(e.target.checked)} className="w-4 h-4 accent-primary-600" />
                  Include QR code (public view link) on the invoice
                </label>
              </div>
            </div>

            <div className="card rounded-xl p-5 space-y-4">
              <h3 className="section-title mb-3">Bill To</h3>
              <div><label className="label">Select Customer</label>
                <select className="input w-full rounded-lg mt-1 text-sm" value={custId} onChange={e => selectCustomer(e.target.value)}>
                  <option value="">— Manual entry (new company) —</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.company}{c.gstin ? ` — ${c.gstin}` : ""}</option>)}
                </select>
                {customers.length === 0 && <p className="text-xs text-slate-400 mt-1">No customer accounts yet — fill the fields below and saving will create one.</p>}
              </div>
              <div className="space-y-2">
                <input className="input w-full rounded-lg text-sm" value={billTo.name} onChange={e => setBillTo(prev => ({ ...prev, name: e.target.value }))} placeholder="Company / Name" />
                <textarea className="input w-full rounded-lg text-sm resize-none" rows={2} value={billTo.address || ""} onChange={e => setBillTo(prev => ({ ...prev, address: e.target.value }))} placeholder="Address" />
                <div className="grid grid-cols-2 gap-2">
                  <input className="input w-full rounded-lg text-sm" value={billTo.gstin || ""} onChange={e => setBillTo(prev => ({ ...prev, gstin: e.target.value }))} placeholder="GSTIN" />
                  <input className="input w-full rounded-lg text-sm" value={billTo.state || ""} onChange={e => setBillTo(prev => ({ ...prev, state: e.target.value }))} placeholder="State" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className="input w-full rounded-lg text-sm" value={billTo.stateCode || ""} onChange={e => setBillTo(prev => ({ ...prev, stateCode: e.target.value }))} placeholder="State Code" />
                </div>
              </div>
            </div>

            <div className="card rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="section-title mb-0">Ship To</h3>
                <button onClick={() => { setSameAsBillTo(!sameAsBillTo); if (!sameAsBillTo) { setShipTo({ name: billTo.name, address: billTo.address, state: billTo.state, stateCode: billTo.stateCode }); } }} className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${sameAsBillTo ? "bg-primary-50 border-primary-300 text-primary-700" : "border-slate-300 text-slate-500"}`}>
                  <Copy className="w-3.5 h-3.5" /> {sameAsBillTo ? "Same as Bill To" : "Different"}
                </button>
              </div>
              {!sameAsBillTo && (
                <div className="space-y-2">
                  <input className="input w-full rounded-lg text-sm" value={shipTo.name} onChange={e => setShipTo(prev => ({ ...prev, name: e.target.value }))} placeholder="Company / Name" />
                  <textarea className="input w-full rounded-lg text-sm resize-none" rows={2} value={shipTo.address || ""} onChange={e => setShipTo(prev => ({ ...prev, address: e.target.value }))} placeholder="Address" />
                  <div className="grid grid-cols-2 gap-2">
                    <input className="input w-full rounded-lg text-sm" value={shipTo.state || ""} onChange={e => setShipTo(prev => ({ ...prev, state: e.target.value }))} placeholder="State" />
                    <input className="input w-full rounded-lg text-sm" value={shipTo.stateCode || ""} onChange={e => setShipTo(prev => ({ ...prev, stateCode: e.target.value }))} placeholder="State Code" />
                  </div>
                </div>
              )}
              {sameAsBillTo && (
                <div className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3">
                  <p className="font-semibold text-slate-700">{billTo.name || "—"}</p>
                  <p className="text-xs">{billTo.address || "—"}</p>
                  {billTo.gstin && <p className="text-xs">GSTIN: {billTo.gstin}</p>}
                  {billTo.state && <p className="text-xs">State: {billTo.state} ({billTo.stateCode})</p>}
                </div>
              )}
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
                  <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-500">New Item</span><button onClick={() => { setItems(prev => [...prev, { id: `item-${Date.now()}-${Math.random()}`, title: "", subDetails: "", model: "", hsn: "", per: "NOS", qty: 1, unitPrice: 0 }]); }} className="text-xs text-primary-600 font-bold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button></div>
                  <input className="input w-full rounded-lg text-sm font-semibold" value={manualItem.title} onChange={e => setManualItem(prev => ({ ...prev, title: e.target.value }))} placeholder="Product name" />
                  <textarea className="input w-full rounded-lg text-sm resize-none" rows={2} value={manualItem.subDetails || ""} onChange={e => setManualItem(prev => ({ ...prev, subDetails: e.target.value }))} placeholder="Description" />
                  <div className="grid grid-cols-3 gap-2">
                    <input className="input w-full rounded-lg text-sm" value={manualItem.hsn || ""} onChange={e => setManualItem(prev => ({ ...prev, hsn: e.target.value }))} placeholder="HSN/SAC" />
                    <input className="input w-full rounded-lg text-sm" type="number" value={manualItem.qty} onChange={e => setManualItem(prev => ({ ...prev, qty: Number(e.target.value) }))} placeholder="Qty" />
                    <input className="input w-full rounded-lg text-sm" value={manualItem.per || ""} onChange={e => setManualItem(prev => ({ ...prev, per: e.target.value }))} placeholder="Per (e.g. NOS)" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input className="input w-full rounded-lg text-sm" type="number" value={manualItem.unitPrice} onChange={e => setManualItem(prev => ({ ...prev, unitPrice: Number(e.target.value) }))} placeholder="Rate" />
                    <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">₹{inr(manualItem.unitPrice * manualItem.qty)}</div>
                  </div>
                  <button onClick={() => { if (manualItem.title) { setItems(prev => [...prev, { ...manualItem, id: `item-${Date.now()}-${Math.random()}` }]); setManualItem({ id: "", title: "", subDetails: "", model: "", hsn: "", per: "NOS", qty: 1, unitPrice: 0 }); } }} className="w-full py-2 rounded-lg bg-primary-600 text-white font-bold text-sm hover:bg-primary-700">Add to Invoice</button>
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
                        <input className="input w-full rounded-lg text-sm" value={item.hsn || ""} onChange={e => updateItem(item.id, "hsn", e.target.value)} placeholder="HSN/SAC" />
                        <input className="input w-full rounded-lg text-sm" type="number" value={item.qty} onChange={e => updateItem(item.id, "qty", Number(e.target.value))} placeholder="Qty" />
                        <input className="input w-full rounded-lg text-sm" value={item.per || ""} onChange={e => updateItem(item.id, "per", e.target.value)} placeholder="Per" />
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
              <h3 className="section-title mb-3">Terms</h3>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {terms.map((t, i) => (
                  <div key={t.label} className="flex items-center justify-between rounded-lg border border-slate-200 p-2 bg-white">
                    <div><p className="text-xs font-bold text-primary-700">{t.label}</p><p className="text-xs text-slate-500 truncate">{t.value}</p></div>
                    <button onClick={() => setTerms(prev => prev.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500 ml-2"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card rounded-xl p-5 space-y-3">
              <h3 className="section-title mb-3">Authorised Signatory</h3>
              <SignatoryImageField value={signatoryImage} onChange={setSignatoryImage} />
            </div>

            <div className="card rounded-xl p-5 space-y-3">
              <h3 className="section-title mb-3">Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handlePrint} className="btn-primary flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> Print / PDF</button>
                <button onClick={handleExportXLSX} className="btn-outline flex items-center justify-center gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"><FileSpreadsheet className="w-4 h-4" /> Export XLSX</button>
                <button onClick={() => setShowShareModal(true)} className="col-span-2 btn-primary flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 border-amber-500"><Share2 className="w-4 h-4" /> Share via Email</button>
              </div>
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <label className="label mb-0">Proforma No.</label>
                    <input className="input w-40 rounded-lg text-sm" value={pinvNo} readOnly placeholder="Fill Bill To name" />
                    <button onClick={() => setPinvSeq((s) => s + 1)} className="text-xs font-bold text-primary-600 border border-primary-200 rounded-lg px-2 py-1">Next</button>
                  </div>
                </div>
                <button onClick={handlePrintProforma} className="w-full btn-outline flex items-center justify-center gap-2 border-primary-300 text-primary-700 hover:bg-primary-50"><Printer className="w-4 h-4" /> Print Proforma</button>
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
                <div ref={printRef}><InvoicePreview inv={inv} /></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Hidden proforma print area */}
      <div className="hidden"><div ref={proformaPrintRef}><ProformaInvoicePreview inv={inv} /></div></div>

      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Share2 className="w-5 h-5 text-amber-500" /> Share Invoice</h2><button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button></div>
            <div><label className="label">Recipient Email</label><input className="input w-full rounded-lg mt-1 text-sm" value={shareEmail} onChange={e => setShareEmail(e.target.value)} placeholder="customer@example.com" /></div>
            <div className="rounded-lg p-3 text-sm bg-slate-50 border border-slate-200">
              <p className="text-slate-500">Invoice: <span className="text-slate-900 font-bold">{invoiceNo}</span></p>
              <p className="text-slate-500">Bill To: <span className="text-slate-900 font-bold">{billTo.name || "—"}</span></p>
              <p className="text-slate-500 mt-2">The email page will open with this invoice attached.</p>
            </div>
            <div className="flex gap-3"><button onClick={() => setShowShareModal(false)} className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-600 font-bold text-sm">Cancel</button><button onClick={handleShareEmail} disabled={!shareEmail} className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm disabled:opacity-40">Open Email</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen bg-slate-50"><AdminSidebar /><main className="flex-1 p-8 text-slate-500">Loading invoice…</main></div>}>
      <InvoicePageInner />
    </Suspense>
  );
}
