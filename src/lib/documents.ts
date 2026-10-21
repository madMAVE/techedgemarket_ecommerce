import api from "@/lib/interceptor";
import type {
  BackendDocumentStatus,
  BackendDocumentType,
  CustomerAccount,
  DocumentRecord,
  DocumentsListResult,
} from "@/types";

export interface DocApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface DocCreatePayload {
  type: BackendDocumentType;
  issueDate: string;
  partyName?: string;
  party: Record<string, string | undefined>;
  orderId?: string;
  payload: Record<string, unknown>;
  contacts?: Record<string, string | boolean | undefined>[];
}

export interface FromOrderPrefill {
  orderId: string;
  orderNumber: string;
  alreadyDocumented: { id: string; number: string; status: BackendDocumentStatus } | null;
  party: Record<string, string | undefined>;
  lineItems: { productId: string; title: string; model: string; hsn: string; qty: number; unitPrice: number }[];
  totalsSnapshot: Record<string, number>;
  poReference: string | null;
  paymentMethod: string;
}

export interface DocListFilters {
  type?: BackendDocumentType;
  status?: BackendDocumentStatus;
  customerId?: string;
  q?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export const documentsApi = {
  list: async (filters: DocListFilters = {}): Promise<DocumentsListResult> => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== "")
    ) as Record<string, string | number | boolean>;
    const res = await api.get<DocApiResponse<DocumentsListResult>>("/api/admin/documents", params);
    return res.data.data;
  },
  get: async (id: string): Promise<DocumentRecord> => {
    const res = await api.get<DocApiResponse<DocumentRecord>>(`/api/admin/documents/${id}`);
    return res.data.data;
  },
  create: async (body: DocCreatePayload): Promise<DocumentRecord> => {
    const res = await api.post<DocApiResponse<DocumentRecord>>("/api/admin/documents", body);
    return res.data.data;
  },
  updateDraft: async (id: string, payload: Record<string, unknown>): Promise<DocumentRecord> => {
    const res = await api.patch<DocApiResponse<DocumentRecord>>(`/api/admin/documents/${id}`, { payload });
    return res.data.data;
  },
  issue: async (id: string): Promise<DocumentRecord> => {
    const res = await api.post<DocApiResponse<DocumentRecord>>(`/api/admin/documents/${id}/issue`, {});
    return res.data.data;
  },
  cancel: async (id: string): Promise<DocumentRecord> => {
    const res = await api.post<DocApiResponse<DocumentRecord>>(`/api/admin/documents/${id}/cancel`, {});
    return res.data.data;
  },
  fromOrder: async (orderId: string): Promise<FromOrderPrefill> => {
    const res = await api.get<DocApiResponse<FromOrderPrefill>>(`/api/admin/documents/from-order/${orderId}`);
    return res.data.data;
  },
  listCustomers: async (): Promise<CustomerAccount[]> => {
    const res = await api.get<DocApiResponse<CustomerAccount[]>>("/api/admin/customers");
    return res.data.data;
  },
};

export const DOC_TYPE_LABEL: Record<BackendDocumentType, string> = {
  INVOICE: "Invoice",
  QUOTATION: "Quotation",
  PURCHASE_ORDER: "Purchase Order",
};

export const DOC_STATUS_LABEL: Record<BackendDocumentStatus, string> = {
  DRAFT: "Draft",
  ISSUED: "Issued",
  CANCELLED: "Cancelled",
};

export const DOC_STATUS_BADGE: Record<BackendDocumentStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  ISSUED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

export function docTotalValue(doc: DocumentRecord): number {
  const totals = doc.payload["totals"] as { total?: number; grand?: number; totalAmount?: number } | undefined;
  if (!totals) return 0;
  return totals.total ?? totals.grand ?? totals.totalAmount ?? 0;
}
