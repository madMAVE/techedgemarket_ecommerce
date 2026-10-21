"use client";
import { useCallback, useEffect, useState } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import StatusBadge from "@/components/ui/StatusBadge";
import Link from "next/link";
import { documentsApi, DOC_TYPE_LABEL, DOC_STATUS_LABEL, DOC_STATUS_BADGE, docTotalValue } from "@/lib/documents";
import { formatINR, formatDate } from "@/utils/helpers";
import type {
  BackendDocumentStatus,
  BackendDocumentType,
  CustomerAccount,
  DocumentRecord,
} from "@/types";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Building2,
  FileStack,
  Ban,
  Loader2,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

const TYPES: BackendDocumentType[] = ["INVOICE", "QUOTATION", "PURCHASE_ORDER"];
const STATUSES: BackendDocumentStatus[] = ["DRAFT", "ISSUED", "CANCELLED"];
const PAGE_SIZE = 20;

const DOC_NEW_LINK: Record<BackendDocumentType, string> = {
  INVOICE: "/admin/invoice",
  QUOTATION: "/admin/quotation",
  PURCHASE_ORDER: "/admin/purchase-orders",
};

const TYPE_BADGE: Record<BackendDocumentType, string> = {
  INVOICE: "bg-primary-100 text-primary-700 border-primary-200",
  QUOTATION: "bg-blue-100 text-blue-700 border-blue-200",
  PURCHASE_ORDER: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerAccount[]>([]);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [typeF, setTypeF] = useState<BackendDocumentType | "">("");
  const [statusF, setStatusF] = useState<BackendDocumentStatus | "">("");
  const [customerF, setCustomerF] = useState("");
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [fromF, setFromF] = useState("");
  const [toF, setToFF] = useState("");

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await documentsApi.list({
        type: typeF || undefined,
        status: statusF || undefined,
        customerId: customerF || undefined,
        q: qDebounced || undefined,
        from: fromF || undefined,
        to: toF || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setDocs(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to load documents", false);
    } finally {
      setLoading(false);
    }
  }, [typeF, statusF, customerF, qDebounced, fromF, toF, page]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  useEffect(() => {
    documentsApi.listCustomers().then(setCustomers).catch(() => setCustomers([]));
  }, []);

  const applyFilterChange = (next: () => void) => {
    next();
    setPage(1);
  };

  const runAction = async (doc: DocumentRecord, action: "issue" | "cancel") => {
    try {
      setBusyId(doc.id);
      const updated = action === "issue" ? await documentsApi.issue(doc.id) : await documentsApi.cancel(doc.id);
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, status: updated.status } : d)));
      showToast(`${doc.number} ${action === "issue" ? "issued" : "cancelled"}`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : `Failed to ${action} document`, false);
    } finally {
      setBusyId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">
        {toast && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in ${toast.ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
            {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="page-title flex items-center gap-3"><FileStack className="w-7 h-7 text-primary-600" />All Documents</h1>
              <p className="page-sub">Invoices, quotations and purchase orders — search, filter and manage lifecycle</p>
            </div>
            <div className="flex gap-3">
              <button onClick={fetchDocs} className="btn-gold flex items-center gap-2"><RefreshCw className="w-4 h-4" />Refresh</button>
              <Link href="/admin/invoice" className="btn-gold flex items-center gap-2"><Plus className="w-4 h-4" />New Document</Link>
            </div>
          </div>

          {/* Filters */}
          <div className="card p-4 mb-5 space-y-3">
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-52">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className="input pl-11"
                  placeholder="Search by document number or company…"
                  value={q}
                  onChange={(e) => applyFilterChange(() => setQ(e.target.value))}
                />
              </div>
              <select className="select w-auto min-w-36" value={typeF} onChange={(e) => applyFilterChange(() => setTypeF(e.target.value as BackendDocumentType | ""))}>
                <option value="">All Types</option>
                {TYPES.map((t) => <option key={t} value={t}>{DOC_TYPE_LABEL[t]}</option>)}
              </select>
              <select className="select w-auto min-w-32" value={statusF} onChange={(e) => applyFilterChange(() => setStatusF(e.target.value as BackendDocumentStatus | ""))}>
                <option value="">All Statuses</option>
                {STATUSES.map((s) => <option key={s} value={s}>{DOC_STATUS_LABEL[s]}</option>)}
              </select>
              <select className="select w-auto min-w-44" value={customerF} onChange={(e) => applyFilterChange(() => setCustomerF(e.target.value))}>
                <option value="">All Customers</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}
              </select>
            </div>
            <div className="flex gap-3 items-end flex-wrap">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">From</label>
                <input type="date" className="input" value={fromF} onChange={(e) => applyFilterChange(() => setFromF(e.target.value))} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">To</label>
                <input type="date" className="input" value={toF} onChange={(e) => applyFilterChange(() => setToFF(e.target.value))} />
              </div>
              {(typeF || statusF || customerF || q || fromF || toF) && (
                <button
                  onClick={() => applyFilterChange(() => { setTypeF(""); setStatusF(""); setCustomerF(""); setQ(""); setQDebounced(""); setFromF(""); setToFF(""); })}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100"
                >
                  Clear filters
                </button>
              )}
              <p className="ml-auto text-xs text-slate-400 font-semibold">{total} document{total === 1 ? "" : "s"}</p>
            </div>
          </div>

          {loading ? (
            <div className="card p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Loading documents…</p>
            </div>
          ) : docs.length === 0 ? (
            <div className="card p-12 text-center">
              <FileStack className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No documents match these filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {docs.map((doc) => {
                const isOpen = expanded === doc.id;
                const items = (doc.payload["items"] as { title: string; qty: number; unitPrice: number }[] | undefined) ?? [];
                return (
                  <div key={doc.id} className={`card overflow-hidden transition-all ${isOpen ? "border-primary-300 shadow-card-lg" : ""}`}>
                    <div className="p-4 flex items-center gap-3 justify-between">
                      <button onClick={() => setExpanded(isOpen ? null : doc.id)} className="flex items-center gap-4 flex-1 text-left">
                        <span className="font-mono font-bold text-primary-600">{doc.number}</span>
                        <StatusBadge label={DOC_TYPE_LABEL[doc.type]} cls={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${TYPE_BADGE[doc.type]}`} />
                        <StatusBadge label={DOC_STATUS_LABEL[doc.status]} cls={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${DOC_STATUS_BADGE[doc.status]}`} />
                        <span className="flex items-center gap-1.5 text-sm text-slate-700 font-semibold"><Building2 className="w-3.5 h-3.5 text-slate-400" />{doc.partyName}</span>
                        <span className="hidden sm:flex items-center gap-1 text-xs text-slate-400"><Calendar className="w-3 h-3" />{formatDate(doc.issueDate)}</span>
                      </button>
                      <div className="flex items-center gap-3 shrink-0">
                        <p className="font-display font-bold text-lg text-slate-900">{formatINR(docTotalValue(doc))}</p>
                        {doc.status === "DRAFT" && (
                          <>
                            <Link href={`${DOC_NEW_LINK[doc.type]}?id=${doc.id}`} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white">Open in creator</Link>
                            <button
                              onClick={() => runAction(doc, "issue")}
                              disabled={busyId === doc.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {busyId === doc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}Issue
                            </button>
                          </>
                        )}
                        {doc.status !== "CANCELLED" && (
                          <button
                            onClick={() => runAction(doc, "cancel")}
                            disabled={busyId === doc.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <Ban className="w-3 h-3" />Cancel
                          </button>
                        )}
                        <button onClick={() => setExpanded(isOpen ? null : doc.id)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="border-t border-slate-100 px-5 py-4 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Customer</p>
                            {doc.customer ? (
                              <>
                                <p className="text-sm font-bold text-slate-900">{doc.customer.company}</p>
                                {doc.customer.gstin && <p className="text-xs font-mono text-slate-500 mt-0.5">GSTIN: {doc.customer.gstin}</p>}
                                {(doc.customer.contacts ?? []).length > 0 && (
                                  <p className="text-xs text-slate-500 mt-1">
                                    {(doc.customer.contacts ?? []).map((c) => c.name).join(", ")}
                                  </p>
                                )}
                              </>
                            ) : (
                              <p className="text-sm text-slate-500">{doc.partyName}</p>
                            )}
                          </div>
                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Source</p>
                            <p className="text-sm text-slate-700">
                              {doc.order ? (
                                <Link href={`/admin/orders`} className="text-primary-600 font-bold hover:underline">Order {doc.order.orderNumber}</Link>
                              ) : (
                                "Manual entry"
                              )}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">Created {formatDate(doc.createdAt)}</p>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Public link (QR target)</p>
                            <p className="text-xs font-mono text-slate-500 break-all">/api/public/documents/{doc.publicToken}</p>
                          </div>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                          <table className="w-full text-sm">
                            <thead>
                              <tr>
                                <th className="th">Item</th>
                                <th className="th text-center">Qty</th>
                                <th className="th text-right">Unit price</th>
                                <th className="th text-right">Line total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((it, idx) => (
                                <tr key={idx} className="tr">
                                  <td className="td font-semibold text-slate-900">{it.title}</td>
                                  <td className="td text-center font-bold">{it.qty}</td>
                                  <td className="td text-right">{formatINR(it.unitPrice)}</td>
                                  <td className="td text-right font-bold text-slate-900">{formatINR(it.qty * it.unitPrice)}</td>
                                </tr>
                              ))}
                              <tr className="bg-primary-50">
                                <td colSpan={3} className="td text-right font-black text-primary-800">Document total</td>
                                <td className="td text-right font-display font-black text-primary-700">{formatINR(docTotalValue(doc))}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-sm font-semibold text-slate-500">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
