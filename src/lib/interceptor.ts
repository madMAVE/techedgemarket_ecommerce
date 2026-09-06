/**
 * TechEdge Market – API Interceptor
 * Central HTTP client with request/response middleware pipeline.
 * Swap static data utilities with these calls when backend is ready.
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestConfig {
  url: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  withCredentials?: boolean;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

type RequestInterceptor  = (cfg: RequestConfig) => RequestConfig | Promise<RequestConfig>;
type ResponseInterceptor = (res: ApiResponse) => ApiResponse | Promise<ApiResponse>;
type ErrorInterceptor    = (err: ApiError) => ApiError | Promise<ApiError> | never;

const store: { request: RequestInterceptor[]; response: ResponseInterceptor[]; error: ErrorInterceptor[] } = {
  request: [], response: [], error: [],
};

// ── Token ──────────────────────────────────────────────────────────────────────
const TOKEN_KEY = "techedge_auth_token";
let _token: string | null = null;

export const setAuthToken = (t: string | null) => {
  _token = t;
  if (typeof window !== "undefined") {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  }
};

export const getAuthToken = () => {
  if (!_token && typeof window !== "undefined") {
    _token = localStorage.getItem(TOKEN_KEY);
  }
  return _token;
};

export const clearAuthToken = () => {
  _token = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
};

// ── Built-in request interceptors ─────────────────────────────────────────────
store.request.push(
  (cfg) => { // auth
    const t = getAuthToken();
    if (t) cfg.headers = { ...cfg.headers, Authorization: `Bearer ${t}` };
    return cfg;
  },
  (cfg) => { // timestamp
    cfg.headers = { ...cfg.headers, "X-Request-Time": new Date().toISOString() };
    return cfg;
  }
);

// ── Built-in response interceptors ────────────────────────────────────────────
store.response.push((res) => {
  if (process.env.NODE_ENV === "development") {
    console.groupCollapsed(`[API] ${res.config.method ?? "GET"} ${res.config.url} → ${res.status}`);
    console.log("data:", res.data);
    console.groupEnd();
  }
  return res;
});

// ── Built-in error interceptors ───────────────────────────────────────────────
store.error.push(
  (err) => { if (err.status === 401) clearAuthToken(); return err; },
  (err) => { if (!err.message) err.message = "An unexpected error occurred."; return err; }
);

// ── Public interceptor registration ───────────────────────────────────────────
export const addRequestInterceptor  = (fn: RequestInterceptor)  => store.request.push(fn);
export const addResponseInterceptor = (fn: ResponseInterceptor) => store.response.push(fn);
export const addErrorInterceptor    = (fn: ErrorInterceptor)    => store.error.push(fn);

// ── Core client ───────────────────────────────────────────────────────────────
const API_BASE_URL = "http://localhost:7070";

const DEFAULTS: Partial<RequestConfig> = {
  method: "GET",
  timeout: 30_000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
};

function buildQS(params: Record<string, string | number | boolean>) {
  return new URLSearchParams(Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))).toString();
}

export async function apiClient<T = unknown>(config: RequestConfig): Promise<ApiResponse<T>> {
  let cfg: RequestConfig = { ...DEFAULTS, ...config, headers: { ...DEFAULTS.headers, ...config.headers } };
  for (const fn of store.request) cfg = await fn(cfg);

  let url = cfg.url.startsWith("http") ? cfg.url : `${API_BASE_URL}${cfg.url}`;
  if (cfg.params && Object.keys(cfg.params).length) url += `?${buildQS(cfg.params)}`;

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), cfg.timeout ?? 30_000);

  try {
    const opts: RequestInit = {
      method: cfg.method ?? "GET",
      headers: cfg.headers as HeadersInit,
      signal: controller.signal,
      credentials: "include",
    };
    if (cfg.body && cfg.method !== "GET" && cfg.method !== "DELETE") {
      opts.body = cfg.body instanceof FormData ? cfg.body : JSON.stringify(cfg.body);
      if (cfg.body instanceof FormData) {
        delete (opts.headers as Record<string, string>)["Content-Type"];
      }
    }

    const raw = await fetch(url, opts);
    clearTimeout(tid);

    const ct = raw.headers.get("content-type") ?? "";
    const data: T = ct.includes("application/json") ? await raw.json() : (await raw.text()) as unknown as T;

    const headers: Record<string, string> = {};
    raw.headers.forEach((v, k) => { headers[k] = v; });

    let res: ApiResponse<T> = { data, status: raw.status, statusText: raw.statusText, headers, config: cfg };

    if (!raw.ok) {
      let err: ApiError = { message: (data as {message?:string})?.message ?? `HTTP ${raw.status}`, status: raw.status, code: String(raw.status), details: data };
      for (const fn of store.error) err = await fn(err) as ApiError;
      throw err;
    }

    for (const fn of store.response) res = await fn(res) as ApiResponse<T>;
    return res;
  } catch (e) {
    clearTimeout(tid);
    if (e && typeof e === "object" && "status" in e) throw e;
    const isAbort = e instanceof Error && e.name === "AbortError";
    let err: ApiError = { message: isAbort ? "Request timed out." : e instanceof Error ? e.message : "Network error.", code: isAbort ? "TIMEOUT" : "NETWORK_ERROR" };
    for (const fn of store.error) err = await fn(err) as ApiError;
    throw err;
  }
}

// ── Convenience API ───────────────────────────────────────────────────────────
export const api = {
  get:    <T>(url: string, params?: RequestConfig["params"]) => apiClient<T>({ url, method: "GET", params }),
  post:   <T>(url: string, body: unknown) => apiClient<T>({ url, method: "POST", body }),
  put:    <T>(url: string, body: unknown) => apiClient<T>({ url, method: "PUT", body }),
  patch:  <T>(url: string, body: unknown) => apiClient<T>({ url, method: "PATCH", body }),
  delete: <T>(url: string) => apiClient<T>({ url, method: "DELETE" }),
};

export default api;
