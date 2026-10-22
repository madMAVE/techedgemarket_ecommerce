export const COMPANY = {
  name: "Tech Edge Market",
  address: "22/A/2, Barrister P. Mitra Road, Kolkata – 700035",
  phone: "8981349687",
  email: "techedgehelpdesk@gmail.com",
  gstin: "19AAPFT6972K1Z5",
  pan: "AAPFT6972K",
  consignee: "Tech Edge Market, 22/A/2, Barrister P. Mitra Road, Kolkata – 700035, West Bengal, India · Ph: 8981349687 · techedgehelpdesk@gmail.com",
};

export const COLORS = {
  navy: "#2B3A52",
  slate: "#64748B",
  body: "#1F2937",
  labelBg: "#EEF1F6",
  border: "#DADDE1",
  badgeText: "#2E7D32",
  badgeBg: "#E8F5E9",
  badgeBorder: "#A5D6A7",
};

export function inr(n: number): string {
  const s = Math.round(n).toLocaleString("en-IN");
  return s;
}

export function numberToWords(n: number): string {
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  function two(x: number): string { return x < 20 ? ones[x] : tens[Math.floor(x/10)] + (x%10 ? " " + ones[x%10] : ""); }
  function three(x: number): string {
    const h = Math.floor(x/100), r = x%100;
    let out = "";
    if (h) out += ones[h] + " Hundred" + (r ? " " : "");
    if (r) out += two(r);
    return out;
  }
  if (n === 0) return "Zero";
  const cr = Math.floor(n/10000000); n %= 10000000;
  const la = Math.floor(n/100000); n %= 100000;
  const th = Math.floor(n/1000); n %= 1000;
  const parts: string[] = [];
  if (cr) parts.push(three(cr) + " Crore");
  if (la) parts.push(three(la) + " Lakh");
  if (th) parts.push(three(th) + " Thousand");
  if (n) parts.push(three(n));
  return parts.join(" ").trim();
}

export function formatDate(d: string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(d));
}

export function generateRefNo(prefix: string, seq: number): string {
  return `TEM/${prefix}/26-27/${String(seq).padStart(2, "0")}`;
}

export function termsToJson(terms: { label: string; value: string }[]): string {
  return JSON.stringify(Object.fromEntries(terms.map(t => [t.label, t.value])), null, 2);
}

export function applyTermsJson(
  prev: { label: string; value: string }[],
  raw: string,
  position: number,
): { terms: { label: string; value: string }[]; added: number; updated: number } {
  const parsed = JSON.parse(raw.trim());
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error('Paste a flat JSON object, e.g. { "Freight": "Included" }');
  }
  const nested = Object.entries(parsed).filter(([, v]) => v === null || typeof v === "object").map(([k]) => k);
  if (nested.length) throw new Error(`Nested values are not supported: ${nested.join(", ")}`);

  const next = prev.map(t => ({ ...t }));
  const inserts: { label: string; value: string }[] = [];
  let updated = 0;
  for (const [label, value] of Object.entries(parsed)) {
    if (!label.trim() || !String(value).trim()) continue;
    const idx = next.findIndex(t => t.label === label);
    if (idx >= 0) { next[idx].value = String(value); updated += 1; }
    else inserts.push({ label, value: String(value) });
  }
  const at = Math.min(Math.max(Math.floor(position) || 1, 1), next.length + 1) - 1;
  next.splice(at, 0, ...inserts);
  return { terms: next, added: inserts.length, updated };
}
