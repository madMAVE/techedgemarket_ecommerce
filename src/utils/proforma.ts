const SKIP = new Set([
  "pvt", "private", "ltd", "limited", "llp", "inc", "co", "corp", "corporation",
  "company", "industries", "india", "the", "and", "solutions", "technologies", "technology",
]);

export function partyInitials(name: string): string {
  const words = name
    .split(/[^A-Za-z0-9]+/)
    .filter((w) => w && !SKIP.has(w.toLowerCase()));
  if (words.length >= 2) return words.map((w) => w[0].toUpperCase()).join("").slice(0, 3);
  const single = words[0] ?? name.replace(/[^A-Za-z0-9]/g, "");
  return single.toUpperCase().slice(0, 3) || "NA";
}

export function fiscalYear(): string {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const year = ist.getUTCFullYear();
  const start = ist.getUTCMonth() >= 3 ? year : year - 1;
  return `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
}

// Proforma invoices are print-only (not stored documents), so the number is
// derived client-side in the same shape the backend uses for saved docs.
export function proformaNumber(partyName: string, seq: number): string {
  if (!partyName.trim()) return "";
  return `TEM/${partyInitials(partyName)}/PINV/${fiscalYear()}/${String(seq).padStart(2, "0")}`;
}
