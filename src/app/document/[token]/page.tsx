"use client";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Link2, Check, Loader2, Ban, FileSearch } from "lucide-react";
import { InvoicePreview, QuotationPreview, PoPreview } from "@/components/documents/previews";
import type { BackendDocumentType } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://techedgemarket-ecommerce-backend.vercel.app";

interface PublicDocument {
  id: string;
  type: BackendDocumentType;
  status: "DRAFT" | "ISSUED" | "CANCELLED";
  number: string;
  issueDate: string;
  partyName: string;
  payload?: Record<string, unknown>;
}

function buildPreviewProps(doc: PublicDocument): any {
  const p = (doc.payload ?? {}) as Record<string, any>;
  if (doc.type === "INVOICE") {
    const extra = (p.extra ?? {}) as Record<string, string>;
    return { ...p, ...extra, invoiceNo: p.invoiceNo || doc.number, showQr: false };
  }
  if (doc.type === "QUOTATION") {
    const totals = (p.totals ?? {}) as Record<string, number>;
    return {
      refNo: p.refNo || doc.number, date: p.date, validTill: p.validTill, client: p.client,
      subjectTitle: p.subjectTitle, subjectBody: p.subjectBody,
      items: p.items ?? [], specs: p.specs ?? [], terms: p.terms ?? [], signoff: p.signoff,
      totalDisc: totals.discountPct ?? 0, gstRate: totals.gstRate ?? 0.18, showQr: false,
    };
  }
  return { ...p, refNo: p.refNo || doc.number, showQr: false };
}

const TYPE_LABEL: Record<BackendDocumentType, string> = {
  INVOICE: "Invoice",
  QUOTATION: "Quotation",
  PURCHASE_ORDER: "Purchase Order",
};

export default function PublicDocumentPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const [state, setState] = useState<"loading" | "ready" | "cancelled" | "not_found">("loading");
  const [doc, setDoc] = useState<PublicDocument | null>(null);
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`${API_BASE}/api/public/documents/${encodeURIComponent(token)}`)
      .then(async res => {
        if (cancelled) return;
        if (res.status === 404) { setState("not_found"); return; }
        const body = await res.json();
        const data: PublicDocument = body.data ?? body;
        if (data.status === "CANCELLED") { setDoc(data); setState("cancelled"); return; }
        if (data.status === "DRAFT") { setState("not_found"); return; }
        setDoc(data);
        setState("ready");
      })
      .catch(() => { if (!cancelled) setState("not_found"); });
    return () => { cancelled = true; };
  }, [token]);

  const previewProps = useMemo(() => (doc && state === "ready" ? buildPreviewProps(doc) : null), [doc, state]);

  const handleDownload = () => {
    const el = printRef.current;
    if (!el || !doc) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>${TYPE_LABEL[doc.type]} ${doc.number}</title><style>@page{size:A4;margin:0}body{margin:0;padding:0}*{box-sizing:border-box}</style></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 600);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = doc ? `${TYPE_LABEL[doc.type]} ${doc.number} — Tech Edge Market` : "Tech Edge Market document";
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; } catch { /* user dismissed — fall through to copy */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard unavailable (e.g. insecure origin) */ }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-[#2B3A52] text-white print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold tracking-wide">Tech Edge Market</div>
            {doc && <div className="text-xs text-white/70">{TYPE_LABEL[doc.type]} {doc.number}</div>}
          </div>
          {state === "ready" && (
            <div className="flex items-center gap-2">
              <button onClick={handleDownload} className="flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-2 text-sm font-bold">
                <Download className="w-4 h-4" /> Download
              </button>
              <button onClick={handleShare} className="flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-2 text-sm font-bold">
                {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                {copied ? "Link copied" : "Share"}
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {state === "loading" && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Loading document…</p>
          </div>
        )}
        {state === "not_found" && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <FileSearch className="w-10 h-10 text-slate-400" />
            <h1 className="text-lg font-bold text-slate-800">Document not available</h1>
            <p className="text-sm text-slate-500 max-w-sm">This link is invalid, or the document has not been issued yet. Please contact Tech Edge Market if you need a copy.</p>
          </div>
        )}
        {state === "cancelled" && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <Ban className="w-10 h-10 text-red-500" />
            <h1 className="text-lg font-bold text-slate-800">This document has been cancelled</h1>
            {doc && <p className="text-sm text-slate-500">{TYPE_LABEL[doc.type]} {doc.number} for {doc.partyName}</p>}
          </div>
        )}
        {state === "ready" && doc && previewProps && (
          <div className="bg-white shadow-xl mx-auto" style={{ width: "210mm", maxWidth: "100%" }}>
            <div ref={printRef} className="overflow-x-auto">
              {doc.type === "INVOICE" && <InvoicePreview inv={previewProps} />}
              {doc.type === "QUOTATION" && <QuotationPreview q={previewProps} />}
              {doc.type === "PURCHASE_ORDER" && <PoPreview po={previewProps} />}
            </div>
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-slate-400 pb-8 print:hidden">
        This is a computer-generated document issued by Tech Edge Market.
      </footer>
    </div>
  );
}
