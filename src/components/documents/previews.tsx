"use client";
import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { COMPANY, numberToWords, inr, formatDate } from "@/utils/documents";

const A4_HEIGHT_PX = (297 / 25.4) * 96;
const MAX_TIGHTNESS = 2; // 0 = full text, 1 = 2-line descriptions, 2 = 1-line + tight rows

export function publicDocumentUrl(token: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/techedgemarket_ecommerce/document/${token}`;
}

function QrBlock({ url, size, caption }: { url?: string; size: number; caption: string }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: "8px", fontWeight: 700, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{caption}</div>
      {url ? (
        <div style={{ display: "inline-block", padding: "4px", border: "1px solid #ccc", background: "#fff" }}>
          <QRCodeSVG value={url} size={size} />
        </div>
      ) : (
        <div style={{ width: `${size + 8}px`, height: `${size + 8}px`, border: "1px solid #ccc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "7px", color: "#999", background: "#fafafa" }}>QR Code</div>
      )}
    </div>
  );
}

export function InvoicePreview({ inv }: { inv: any }) {
  const subtotal = inv.items.reduce((s: any, i: any) => s + i.unitPrice * i.qty, 0);
  const isInterState = inv.billTo?.state && inv.billTo.state.toLowerCase() !== "west bengal";
  const cgst = isInterState ? 0 : subtotal * 0.09;
  const sgst = isInterState ? 0 : subtotal * 0.09;
  const igst = isInterState ? subtotal * 0.18 : 0;
  const freight = inv.freight || 0;
  const total = subtotal + cgst + sgst + igst + freight;
  const totalWords = numberToWords(Math.round(total));
  const taxWords = numberToWords(Math.round(cgst + sgst + igst + freight));
  const logoUrl = typeof window !== "undefined" ? `${window.location.origin}/techedgemarket_ecommerce/logo/TEM-dark.png` : "";
  const bdr = "1px solid #000";
  const bdrLight = "1px solid #ccc";

  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "9px", color: "#000", lineHeight: "1.4", padding: "10mm 12mm", maxWidth: "210mm", margin: "0 auto", background: "white" }}>
      {/* A. Heading / QR area */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src={logoUrl} alt="TEM" style={{ height: "42px", width: "auto", objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "1px" }}>Tax Invoice</div>
            <div style={{ fontSize: "8px", fontStyle: "italic", color: "#333" }}>(ORIGINAL FOR RECIPIENT)</div>
          </div>
        </div>
        {inv.showQr && <QrBlock url={inv.publicUrl} size={62} caption="Scan to view" />}
      </div>

      {/* B. Main grid — two columns */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "0" }}>
        <tbody>
          <tr>
            {/* LEFT: Seller + Consignee + Buyer */}
            <td style={{ width: "50%", verticalAlign: "top", border: bdr, padding: "0" }}>
              {/* Seller */}
              <div style={{ padding: "6px 8px" }}>
                <div style={{ fontWeight: 800, fontSize: "10px", textTransform: "uppercase", marginBottom: "3px" }}>{COMPANY.name}</div>
                <div style={{ fontSize: "8.5px", lineHeight: "1.55", color: "#222" }}>
                  <div>{COMPANY.address}</div>
                  <div>GSTIN: <b>{COMPANY.gstin}</b></div>
                  <div>PAN: {COMPANY.pan}</div>
                  <div>State: West Bengal &nbsp; Code: 19</div>
                </div>
              </div>

              <div style={{ borderTop: bdr, padding: "6px 8px" }}>
                <div style={{ fontSize: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px", color: "#444" }}>Consignee (Ship to)</div>
                <div style={{ fontWeight: 700, fontSize: "9.5px", textTransform: "uppercase" }}>{inv.shipTo?.name || inv.billTo?.name || "—"}</div>
                {inv.shipTo?.address && <div style={{ fontSize: "8.5px", lineHeight: "1.5", color: "#222" }}>{inv.shipTo.address}</div>}
                {inv.shipTo?.gstin && <div style={{ fontSize: "8.5px" }}>GSTIN: <b>{inv.shipTo.gstin}</b></div>}
                {inv.shipTo?.state && <div style={{ fontSize: "8.5px" }}>State: {inv.shipTo.state} &nbsp; Code: {inv.shipTo.stateCode || "—"}</div>}
              </div>

              <div style={{ borderTop: bdr, padding: "6px 8px" }}>
                <div style={{ fontSize: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px", color: "#444" }}>Buyer (Bill to)</div>
                <div style={{ fontWeight: 700, fontSize: "9.5px", textTransform: "uppercase" }}>{inv.billTo?.name || "—"}</div>
                {inv.billTo?.address && <div style={{ fontSize: "8.5px", lineHeight: "1.5", color: "#222" }}>{inv.billTo.address}</div>}
                {inv.billTo?.gstin && <div style={{ fontSize: "8.5px" }}>GSTIN: <b>{inv.billTo.gstin}</b></div>}
                {inv.billTo?.state && <div style={{ fontSize: "8.5px" }}>State: {inv.billTo.state} &nbsp; Code: {inv.billTo.stateCode || "—"}</div>}
              </div>
            </td>

            {/* RIGHT: Invoice metadata */}
            <td style={{ width: "50%", verticalAlign: "top", border: bdr, borderLeft: "none", padding: "0" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {[
                    ["Invoice No.", inv.invoiceNo, "e-Way Bill No.", inv.ewayBillNo || ""],
                    ["Invoice Date", inv.date ? formatDate(inv.date) : "", "e-Way Bill Date", inv.ewayBillDate ? formatDate(inv.ewayBillDate) : ""],
                    ["Reference No.", inv.poReference || "", "Reference Date", inv.referenceDate || ""],
                    ["Buyer's Order No.", inv.orderNo || "", "Buyer's Order Date", inv.buyersOrderDate || ""],
                    ["Mode/Terms of Payment", inv.paymentMethod || "", "Dispatched through", inv.dispatchedThrough || ""],
                    ["Destination", inv.destination || "", "", ""],
                  ].map(([k1, v1, k2, v2], i) => (
                    <tr key={i}>
                      <td style={{ border: bdrLight, padding: "6px 5px", width: "25%", fontSize: "7.5px", color: "#444" }}>{k1}</td>
                      <td style={{ border: bdrLight, padding: "6px 5px", width: "25%", fontWeight: 700, fontSize: "8.5px" }}>{v1 || "—"}</td>
                      <td style={{ border: bdrLight, padding: "6px 5px", width: "25%", fontSize: "7.5px", color: "#444" }}>{k2}</td>
                      <td style={{ border: bdrLight, padding: "6px 5px", width: "25%", fontWeight: 700, fontSize: "8.5px" }}>{v2 || (k2 ? "—" : "")}</td>
                    </tr>
                  ))}
                  {inv.irn && (
                    <tr>
                      <td style={{ border: bdrLight, padding: "6px 5px", width: "25%", fontSize: "7.5px", color: "#444" }}>IRN</td>
                      <td colSpan={3} style={{ border: bdrLight, padding: "6px 5px", fontWeight: 700, fontSize: "7px", wordBreak: "break-all" }}>{inv.irn}</td>
                    </tr>
                  )}
                  {(inv.ackNo || inv.ackDate) && (
                    <tr>
                      <td style={{ border: bdrLight, padding: "6px 5px", width: "25%", fontSize: "7.5px", color: "#444" }}>Ack. No.</td>
                      <td style={{ border: bdrLight, padding: "6px 5px", width: "25%", fontWeight: 700, fontSize: "8.5px" }}>{inv.ackNo || "—"}</td>
                      <td style={{ border: bdrLight, padding: "6px 5px", width: "25%", fontSize: "7.5px", color: "#444" }}>Ack. Date</td>
                      <td style={{ border: bdrLight, padding: "6px 5px", width: "25%", fontWeight: 700, fontSize: "8.5px" }}>{inv.ackDate ? formatDate(inv.ackDate) : "—"}</td>
                    </tr>
                  )}
                  {/* Vehicle & Transporter extra row */}
                  {(inv.vehicleNo || inv.transporterName || inv.distance) && (
                    <tr>
                      <td style={{ border: bdrLight, padding: "3px 5px", width: "25%", fontSize: "7.5px", color: "#444" }}>Vehicle No.</td>
                      <td style={{ border: bdrLight, padding: "3px 5px", width: "25%", fontWeight: 700, fontSize: "8.5px" }}>{inv.vehicleNo || "—"}</td>
                      <td style={{ border: bdrLight, padding: "3px 5px", width: "25%", fontSize: "7.5px", color: "#444" }}>Transporter</td>
                      <td style={{ border: bdrLight, padding: "3px 5px", width: "25%", fontWeight: 700, fontSize: "8.5px" }}>{inv.transporterName || "—"}{inv.distance ? ` (${inv.distance} km)` : ""}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* C. Goods / line-item table */}
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
                {/* Blank rows */}
                {Array.from({ length: blankCount }).map((_, i) => (
                  <tr key={`blank-${i}`} style={{ height: "28px" }}>
                    {["Sl. No.", "Description of Goods", "HSN/SAC", "Qty", "Rate", "Per", "Amount"].map((_, j) => (
                      <td key={j} style={{ borderRight: j < 6 ? bdr : "none" }}></td>
                    ))}
                  </tr>
                ))}
                {/* Tax row(s) */}
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
                {/* Total row */}
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

      {/* D. Amount in words */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "4px", marginBottom: "4px" }}>
        <div style={{ fontSize: "8.5px" }}><span style={{ fontWeight: 700 }}>Amount Chargeable (in words): </span><span style={{ fontWeight: 700, textTransform: "uppercase" }}>Rupees {totalWords} Only</span></div>
        <div style={{ fontSize: "8px", fontStyle: "italic" }}>E. & O.E</div>
      </div>

      {/* E. HSN/SAC tax summary */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4px" }}>
        <thead>
          <tr>
            {isInterState
              ? ["HSN/SAC", "Taxable Value", "IGST Rate", "IGST Amount", "Total Tax Amount"].map(h => (
                  <th key={h} style={{ border: bdr, padding: "3px 6px", fontSize: "7.5px", fontWeight: 700, textAlign: "left" }}>{h}</th>
                ))
              : ["HSN/SAC", "Taxable Value", "CGST Rate", "CGST Amount", "SGST Rate", "SGST Amount", "Total Tax Amount"].map(h => (
                  <th key={h} style={{ border: bdr, padding: "3px 6px", fontSize: "7.5px", fontWeight: 700, textAlign: "left" }}>{h}</th>
                ))
            }
          </tr>
        </thead>
        <tbody>
          {isInterState ? (
            <>
              <tr>
                <td style={{ border: bdr, padding: "3px 6px", fontSize: "8.5px" }}>8537</td>
                <td style={{ border: bdr, padding: "3px 6px", textAlign: "right", fontSize: "8.5px" }}>{inr(subtotal)}</td>
                <td style={{ border: bdr, padding: "3px 6px", textAlign: "right", fontSize: "8.5px" }}>18%</td>
                <td style={{ border: bdr, padding: "3px 6px", textAlign: "right", fontSize: "8.5px" }}>{inr(igst)}</td>
                <td style={{ border: bdr, padding: "3px 6px", textAlign: "right", fontWeight: 700, fontSize: "8.5px" }}>{inr(igst)}</td>
              </tr>
              <tr>
                <td style={{ border: bdr, padding: "3px 6px", fontWeight: 700, fontSize: "8.5px" }}>Total</td>
                <td style={{ border: bdr, padding: "3px 6px", textAlign: "right", fontWeight: 700, fontSize: "8.5px" }}>{inr(subtotal)}</td>
                <td style={{ border: bdr }}></td>
                <td style={{ border: bdr, padding: "3px 6px", textAlign: "right", fontWeight: 700, fontSize: "8.5px" }}>{inr(igst)}</td>
                <td style={{ border: bdr, padding: "3px 6px", textAlign: "right", fontWeight: 700, fontSize: "8.5px" }}>{inr(igst)}</td>
              </tr>
            </>
          ) : (
            <>
              <tr>
                <td style={{ border: bdr, padding: "3px 6px", fontSize: "8.5px" }}>8537</td>
                <td style={{ border: bdr, padding: "3px 6px", textAlign: "right", fontSize: "8.5px" }}>{inr(subtotal)}</td>
                <td style={{ border: bdr, padding: "3px 6px", textAlign: "right", fontSize: "8.5px" }}>9%</td>
                <td style={{ border: bdr, padding: "3px 6px", textAlign: "right", fontSize: "8.5px" }}>{inr(cgst)}</td>
                <td style={{ border: bdr, padding: "3px 6px", textAlign: "right", fontSize: "8.5px" }}>9%</td>
                <td style={{ border: bdr, padding: "3px 6px", textAlign: "right", fontSize: "8.5px" }}>{inr(sgst)}</td>
                <td style={{ border: bdr, padding: "3px 6px", textAlign: "right", fontWeight: 700, fontSize: "8.5px" }}>{inr(cgst + sgst)}</td>
              </tr>
              <tr>
                <td style={{ border: bdr, padding: "3px 6px", fontWeight: 700, fontSize: "8.5px" }}>Total</td>
                <td style={{ border: bdr, padding: "3px 6px", textAlign: "right", fontWeight: 700, fontSize: "8.5px" }}>{inr(subtotal)}</td>
                <td style={{ border: bdr }}></td>
                <td style={{ border: bdr, padding: "3px 6px", textAlign: "right", fontWeight: 700, fontSize: "8.5px" }}>{inr(cgst)}</td>
                <td style={{ border: bdr }}></td>
                <td style={{ border: bdr, padding: "3px 6px", textAlign: "right", fontWeight: 700, fontSize: "8.5px" }}>{inr(sgst)}</td>
                <td style={{ border: bdr, padding: "3px 6px", textAlign: "right", fontWeight: 700, fontSize: "8.5px" }}>{inr(cgst + sgst)}</td>
              </tr>
            </>
          )}
        </tbody>
      </table>

      {/* F. Tax amount in words + payment notice */}
      <div style={{ fontSize: "8.5px", marginBottom: "4px" }}>
        <span style={{ fontWeight: 700 }}>Tax Amount (in words): </span><span style={{ fontWeight: 700, textTransform: "uppercase" }}>Rupees {taxWords} Only</span>
      </div>

      <div style={{ border: bdr, padding: "5px 8px", marginBottom: "4px", fontSize: "7.5px", lineHeight: "1.5", color: "#222" }}>
        <i>Our company accepts electronic payment only. Please make payment through NEFT/RTGS/IMPS to the bank account details mentioned below. Cash payments are not accepted.</i>
      </div>
      <div style={{ border: bdr, padding: "5px 8px", marginBottom: "6px", fontSize: "7.5px", lineHeight: "1.5", color: "#222" }}>
        <i>Our employees are not authorized to receive cash or cheques on behalf of the company. Please ensure all payments are made directly to our bank account.</i>
      </div>

      {/* G. Declaration + Bank + Signature */}
      <div style={{ display: "flex", gap: "14px", marginTop: "6px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "8.5px", fontWeight: 700, marginBottom: "2px" }}>Declaration</div>
          <div style={{ fontSize: "8px", lineHeight: "1.5", color: "#222" }}>
            We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "8.5px", fontWeight: 700, marginBottom: "3px" }}>Company's Bank Details</div>
          <div style={{ fontSize: "8.5px", lineHeight: "1.6" }}>
            <div><span style={{ color: "#444" }}>Bank:</span> HDFC Bank Ltd.</div>
            <div><span style={{ color: "#444" }}>A/C No:</span> 50200012345678</div>
            <div><span style={{ color: "#444" }}>Branch:</span> Kolkata &nbsp; <span style={{ color: "#444" }}>IFSC:</span> HDFC0001234</div>
          </div>
            <div style={{ marginTop: "10px", textAlign: "right" }}>
              <div style={{ fontSize: "8.5px", fontWeight: 700 }}>{COMPANY.name}</div>
              <div style={{ fontSize: "8.5px", fontWeight: 600, marginTop: "2px" }}>Authorised Signatory</div>
            </div>
        </div>
      </div>

      {/* H. Footer */}
      <div style={{ marginTop: "10px", borderTop: bdrLight, paddingTop: "4px", textAlign: "center", fontSize: "7.5px", color: "#666" }}>
        This is a Computer Generated Invoice
      </div>
    </div>
  );
}

export function QuotationPreview({ q }: { q: any }) {
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

  // The specifications table grows with content, so the price schedule gives way by
  // exactly that much: one filler row absorbs whatever height the page has left. Once
  // the filler is exhausted, product rows tighten until the page fits again.
  const rootRef = useRef<HTMLDivElement>(null);
  const fillerRef = useRef<HTMLTableRowElement>(null);
  const [fillerPx, setFillerPx] = useState(0);
  const [tightness, setTightness] = useState(0);

  useEffect(() => { setTightness(0); }, [q.items, q.specs, q.terms]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => {
      const filler = fillerRef.current;
      if (!filler) return;
      const used = root.getBoundingClientRect().height - filler.getBoundingClientRect().height;
      const slack = A4_HEIGHT_PX - used;
      if (slack >= 0) { setFillerPx(Math.round(slack)); return; }
      setFillerPx(0);
      setTightness(t => (t < MAX_TIGHTNESS ? t + 1 : t));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const cellPad = tightness >= 2 ? "2px 5px" : "3px 8px";
  const descStyle: React.CSSProperties = tightness > 0
    ? { fontSize: "8px", color: "#444", marginTop: "1px", lineHeight: "1.25", display: "-webkit-box", WebkitLineClamp: tightness === 1 ? 2 : 1, WebkitBoxOrient: "vertical", overflow: "hidden" }
    : { fontSize: "8px", color: "#444", marginTop: "1px", lineHeight: "1.3" };

  return (
    <div ref={rootRef} style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "9px", color: "#000", lineHeight: "1.4", padding: "10mm 12mm", maxWidth: "210mm", margin: "0 auto", background: "white" }}>
      {/* Heading */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src={logoUrl} alt="TEM" style={{ height: "42px", width: "auto", objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "1px" }}>QUOTATION</div>
            <div style={{ fontSize: "8px", fontStyle: "italic", color: "#333" }}>(Subject to realization)</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div style={{ textAlign: "right", fontSize: "9px" }}>
            <table style={{ borderCollapse: "collapse", marginLeft: "auto" }}>
              <tbody>
                {[["Ref No.", q.refNo], ["Date", q.date ? formatDate(q.date) : ""], ["Valid Till", q.validTill ? formatDate(q.validTill) : ""]].map(([k, v]) => (
                  <tr key={k}><td style={{ padding: "1px 8px 1px 0", fontSize: "8px", color: "#444", textAlign: "right" }}>{k}</td><td style={{ padding: "1px 0", fontWeight: 700, fontSize: "9px", textAlign: "right" }}>{v || "—"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          {q.showQr && <QrBlock url={q.publicUrl} size={52} caption="Scan" />}
        </div>
      </div>

      {/* Main grid — two columns */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "0" }}>
        <tbody>
          <tr>
            {/* LEFT: Seller + Offer To */}
            <td style={{ width: "50%", verticalAlign: "top", border: bdr, padding: "6px 8px" }}>
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
            <td style={{ width: "50%", verticalAlign: "top", border: bdr, borderLeft: "none", padding: "6px 8px" }}>
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
              <th colSpan={3} style={{ border: bdr, padding: "3px 6px", fontSize: "11px", fontWeight: 700, textAlign: "left" }}>Technical Specifications</th>
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
            const showDivider = i < q.items.length - 1 || fillerPx > 0;
            const cellBdr = { borderRight: bdr, borderBottom: showDivider ? bdr : "none" };
            return (
              <tr key={item.id}>
                <td style={{ ...cellBdr, padding: cellPad, textAlign: "center", fontSize: "8.5px" }}>{i + 1}</td>
                <td style={{ ...cellBdr, padding: cellPad, verticalAlign: "top" }}>
                  <div style={{ fontWeight: 700, fontSize: "9.5px", lineHeight: "1.3" }}>{item.title}</div>
                  {item.subDetails && <div style={descStyle}>{item.subDetails}</div>}
                  {item.tag && tightness < 2 && <span style={{ display: "inline-block", marginTop: "2px", fontSize: "7.5px", color: "#16a34a", border: "1px solid #86efac", background: "#f0fdf4", borderRadius: "2px", padding: "0 4px" }}>{item.tag}</span>}
                </td>
                <td style={{ ...cellBdr, padding: cellPad, textAlign: "center", fontWeight: 700, fontSize: "8.5px" }}>{item.qty}</td>
                <td style={{ ...cellBdr, padding: cellPad, textAlign: "center", fontSize: "8.5px" }}>{item.unit}</td>
                <td style={{ borderBottom: showDivider ? bdr : "none", padding: cellPad, textAlign: "right" }}>
                  <span style={{ fontWeight: 700, fontSize: "8.5px" }}>{inr(item.unitPrice)}/-</span>
                  {q.totalDisc > 0 && <span style={{ fontSize: "7.5px", color: "#666", display: "block" }}>+ GST @ {gstPct}%</span>}
                </td>
              </tr>
            );
          })}
          {/* Single filler row: shrinks as the specifications table above grows */}
          {q.items.length > 0 && (
            <tr ref={fillerRef} style={{ height: `${fillerPx}px` }}>
              {["Sl. No.", "Product Description", "Qty", "Unit", "Special Price (Rs.)"].map((_, j) => (
                <td key={j} style={{ borderRight: j < 4 ? bdr : "none", fontSize: 0, lineHeight: 0 }}></td>
              ))}
            </tr>
          )}
        </tbody>
        {q.items.length > 0 && (
          <tfoot>
            {(() => {
              const rowBdr = { borderRight: bdr, borderBottom: bdr };
              const topBdr = { borderTop: bdr };
              const totals = [
                ["Sub Total", subtotal, undefined],
                ...(q.totalDisc > 0 ? [[`Discount (${q.totalDisc}%)`, -discAmount, "#16a34a"] as [string, number, string | undefined]] : []),
                ["Taxable Amount", taxable, undefined],
                [`GST @ ${gstPct}%`, gstAmt, undefined],
              ] as [string, number, string | undefined][];
              return (
                <>
                  {totals.map(([label, amt, color], i) => (
                    <tr key={label}>
                      <td colSpan={4} style={{ ...rowBdr, padding: "3px 8px", fontSize: "8.5px", color: "#444", ...(i === 0 ? topBdr : null) }}>{label}</td>
                      <td style={{ borderBottom: bdr, padding: "3px 8px", textAlign: "right", fontWeight: 600, fontSize: "8.5px", color, ...(i === 0 ? topBdr : null) }}>{inr(amt)}/-</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={4} style={{ borderRight: bdr, padding: "4px 8px", fontWeight: 800, fontSize: "9.5px" }}>Grand Total</td>
                    <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: 800, fontSize: "9.5px" }}>{inr(grand)}/-</td>
                  </tr>
                </>
              );
            })()}
          </tfoot>
        )}
      </table>

      {q.items.length > 0 && (
        <div style={{ fontSize: "8.5px", marginBottom: "4px", marginTop: "4px" }}>
          <span style={{ fontWeight: 700 }}>Amount in Words: </span><span style={{ fontWeight: 700, textTransform: "uppercase" }}>{grandWords}</span>
        </div>
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

export function PoPreview({ po }: { po: any }) {
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
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
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
          {po.showQr && <QrBlock url={po.publicUrl} size={52} caption="Scan" />}
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
