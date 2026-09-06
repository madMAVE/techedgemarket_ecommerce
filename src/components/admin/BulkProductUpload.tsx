"use client";

import { useState, useCallback } from "react";
import ExcelJS from "exceljs";
import type { Product, ProductCategory } from "@/types";
import { api } from "@/lib/interceptor";
import { Upload, Download, FileText, AlertCircle, CheckCircle, X, Plus, Trash2 } from "lucide-react";

const CATEGORIES: ProductCategory[] = [
  "Automation","Switchgear","Drives & Motors","Safety Systems",
  "Sensors & Instrumentation","Cables & Wiring","Control Panels","Spare Parts",
  "HMI & PLC","Data Loggers","Timers & Counters","Temperature Controllers",
  "Panel Meters","Process Indicators","Power Controllers","Temperature Scanners",
];
const BRANDS = [
  "Siemens","ABB","Schneider Electric","Omron","Allen-Bradley",
  "Mitsubishi","SICK","Keyence","Pilz","Fluke","Rittal",
  "Belden","Eaton","Endress+Hauser","Balluff","TechEdge OEM",
  "Cautoni-Swastik","Swastik",
];
const LEAD_TIMES = [
  "1–2 days","2–3 days","3–5 days","5–7 days",
  "7–10 days","10–14 days","14–21 days","21–30 days",
];

function genID() { return "p"+Date.now().toString().slice(-7)+Math.random().toString(36).slice(2,5); }

function normalizeHeader(raw: string): string {
  return raw.replace(/^"|"$/g, "").trim().toLowerCase();
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '\\' && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i += 2;
      } else if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        current += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        result.push(current.trim());
        current = "";
        i++;
      } else {
        current += ch;
        i++;
      }
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '\\' && i + 1 < text.length && text[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(current.trim());
        current = "";
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && i + 1 < text.length && text[i + 1] === '\n') {
          i++;
        }
        row.push(current.trim());
        if (row.some(cell => cell.length > 0)) {
          rows.push(row);
        }
        row = [];
        current = "";
      } else {
        current += ch;
      }
    }
  }
  row.push(current.trim());
  if (row.some(cell => cell.length > 0)) {
    rows.push(row);
  }
  return rows;
}

function findCell(rowValues: any[], headerRowValues: any[], headerName: string): any {
  const idx = headerRowValues.findIndex((v: any) =>
    normalizeHeader(String(v ?? "")) === headerName.toLowerCase()
  );
  return idx > -1 ? rowValues[idx] : null;
}

interface ParsedProduct {
  row: number;
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  category: string;
  subcategory: string;
  brand: string;
  model: string;
  partNumber: string;
  stock: string;
  leadTime: string;
  keywords: string;
  featured: string;
  badge: string;
  image: string;
  images: string[];
  specs: Record<string, any> | null;
  isActive: string;
  errors: string[];
}

interface BulkUploadModalProps {
  onImport: (products: Product[]) => Promise<void>;
  onClose: () => void;
}

export default function BulkUploadModal({ onImport, onClose }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedProduct[]>([]);
  const [step, setStep] = useState<"upload"|"preview"|"result">("upload");
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [removedRows, setRemovedRows] = useState<Set<number>>(new Set());

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setProcessing(true);

    const workbook = new ExcelJS.Workbook();
    let worksheet: ExcelJS.Worksheet | undefined;

    if (selectedFile.name.endsWith(".csv")) {
      const text = new TextDecoder().decode(await selectedFile.arrayBuffer());
      const rows = parseCSV(text);
      if (rows.length === 0) {
        alert("CSV file is empty");
        setProcessing(false);
        return;
      }
      worksheet = workbook.addWorksheet("Products");
      for (const row of rows) {
        worksheet.addRow(row);
      }
    } else {
      const buffer = await selectedFile.arrayBuffer();
      await (workbook.xlsx as any).read(buffer);
      worksheet = workbook.getWorksheet(1);
    }

    if (!worksheet) {
      alert("No worksheet found in file");
      setProcessing(false);
      return;
    }

    const rows: ParsedProduct[] = [];
    let rowNum = 0;

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      rowNum = rowNumber;

      const rowValues = row.values as any[];
      const headerRow = worksheet!.getRow(1);
      const headerValues = headerRow.values as any[];

      const getCell = (header: string) => findCell(rowValues, headerValues, header);

      const name = String(getCell("name") || getCell("product name") || "").trim();
      const description = String(getCell("description") || "").trim();
      const price = String(getCell("price") || "").trim();
      const originalPrice = String(getCell("originalPrice") || getCell("original price") || "").trim();
      const category = String(getCell("category") || "").trim();
      const subcategory = String(getCell("subcategory") || "").trim();
      const brand = String(getCell("brand") || getCell("brandId") || getCell("brand id") || "").trim();
      const model = String(getCell("model") || "").trim();
      const partNumber = String(getCell("partNumber") || getCell("part number") || "").trim();
      const stock = String(getCell("stock") || "0").trim();
      const leadTime = String(getCell("leadTime") || getCell("lead time") || "3–5 days").trim();
      const keywords = String(getCell("keywords") || getCell("tags") || "").trim();
      const featured = String(getCell("featured") || "false").trim();
      const badge = String(getCell("badge") || "").trim();
      const image = String(getCell("image") || "").trim();
      const isActive = String(getCell("isActive") || getCell("is active") || "true").trim();

      let images: string[] = [];
      try {
        const rawImages = getCell("images");
        if (rawImages) {
          const parsed = JSON.parse(String(rawImages));
          if (Array.isArray(parsed)) images = parsed;
        }
      } catch {
        images = [];
      }

      let specs: Record<string, any> | null = null;
      try {
        const rawSpecs = getCell("specs");
        if (rawSpecs) {
          const parsed = JSON.parse(String(rawSpecs));
          if (typeof parsed === "object" && parsed !== null) specs = parsed;
        }
      } catch {
        specs = null;
      }

      const errors: string[] = [];
      if (!name) errors.push("Product Name is required");
      if (!price || isNaN(Number(price))) errors.push("Valid Price is required");
      if (!description) errors.push("Description is required");
      if (originalPrice && isNaN(Number(originalPrice))) errors.push("Valid Original Price is required");
      if (!brand) errors.push("Brand is required");
      if (!category) errors.push("Category is required");
      if (category && !CATEGORIES.includes(category as ProductCategory)) {
        errors.push(`Invalid category: ${category}`);
      }
      if (brand && !BRANDS.includes(brand)) {
        errors.push(`Invalid brand: ${brand}`);
      }

      rows.push({
        row: rowNumber,
        name, description, price, originalPrice,
        category, subcategory, brand, model, partNumber,
        stock, leadTime, keywords, featured, badge,
        image, images, specs, isActive,
        errors,
      });
    });

    setParsed(rows);
    setProcessing(false);
    setStep("preview");
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".csv"))) {
      await handleFileSelect(droppedFile);
    } else {
      alert("Please upload an .xlsx or .csv file");
    }
  }, [handleFileSelect]);

  const handleInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const handleImport = async () => {
    const validRows = parsed.filter(r => r.errors.length === 0 && !removedRows.has(r.row));
    const products: Product[] = validRows.map(r => ({
      id: genID(),
      name: r.name,
      description: r.description,
      price: parseFloat(r.price) || 0,
      originalPrice: r.originalPrice ? parseFloat(r.originalPrice) : null,
      category: r.category as ProductCategory,
      subcategory: r.subcategory || undefined,
      brand: r.brand,
      model: r.model,
      partNumber: r.partNumber,
      image: r.image || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
      images: r.images.length > 0 ? r.images : undefined,
      rating: 4.5,
      reviews: 0,
      stock: parseInt(r.stock) || 0,
      leadTime: r.leadTime || "3–5 days",
      keywords: r.keywords.split(",").map(t => t.trim()).filter(Boolean),
      featured: r.featured.toLowerCase() === "true" || r.featured === "1",
      badge: r.badge || undefined,
      specs: r.specs || {},
      isActive: r.isActive.toLowerCase() === "true" || r.isActive === "1",
    }));

    setImporting(true);
    try {
      await onImport(products);
      setResult({
        success: products.length,
        errors: parsed.filter(r => r.errors.length > 0).length,
      });
      setStep("result");
    } catch (err: any) {
      // Error already shown via toast in parent — stay on preview
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Products", {
      properties: { tabColor: { argb: "3B82F6" } },
    });

    const headers = [
      "Product Name", "Description", "Price", "Original Price",
      "Category", "Brand", "Model", "Part Number",
      "Stock", "Lead Time", "Keywords", "Featured", "Badge",
    ];

    worksheet.columns = headers.map(h => ({
      header: h,
      key: h.toLowerCase().replace(/ /g, "_"),
      width: h === "Description" ? 40 : h === "Product Name" ? 30 : 20,
    }));

    // Add sample row
    worksheet.addRow({
      product_name: "Siemens PLC S7-1200",
      description: "Compact CPU for automation tasks",
      price: 12500,
      original_price: 15000,
      category: "Automation",
      brand: "Siemens",
      model: "S7-1200",
      part_number: "6ES7211-1AE40-0XB0",
      stock: 50,
      lead_time: "2-3 days",
      keywords: "plc, siemens, automation",
      featured: "false",
      badge: "New Arrival",
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "3B82F6" },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product-template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsed.filter(r => r.errors.length === 0 && !removedRows.has(r.row)).length;
  const errorCount = parsed.filter(r => r.errors.length > 0 && !removedRows.has(r.row)).length;

  const handleRemoveRow = (rowNum: number) => {
    setRemovedRows(prev => {
      const next = new Set(prev);
      next.add(rowNum);
      return next;
    });
  };

  const handleRestoreRow = (rowNum: number) => {
    setRemovedRows(prev => {
      const next = new Set(prev);
      next.delete(rowNum);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center p-4 pt-8 bg-slate-900/50 backdrop-blur-sm overflow-y-auto"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card w-full max-w-4xl animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6 text-primary-600" />
            <div>
              <h2 className="font-display font-bold text-xl text-slate-900">Bulk Upload Products</h2>
              <p className="text-xs text-slate-400 mt-0.5">Import products from Excel (.xlsx) or CSV file — images can be added later</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">

          {step === "upload" && (
            <div className="space-y-6">
              {/* Upload Area */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                  dragOver
                    ? "border-primary-500 bg-primary-50"
                    : "border-slate-300 hover:border-primary-400 hover:bg-slate-50"
                } ${processing ? "opacity-50 pointer-events-none" : ""}`}
              >
                <Upload className={`w-12 h-12 mx-auto mb-4 ${dragOver ? "text-primary-600" : "text-slate-400"}`} />
                <p className="font-semibold text-slate-700 text-lg mb-2">
                  {processing ? "Processing file..." : "Drag & drop your Excel/CSV file here"}
                </p>
                <p className="text-sm text-slate-500 mb-4">or</p>
                <label className="btn-primary inline-flex items-center gap-2 cursor-pointer">
                  <FileText className="w-4 h-4" />
                  Browse Files
                  <input
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={processing}
                  />
                </label>
                <p className="text-xs text-slate-400 mt-4">Supports .xlsx and .csv files</p>
              </div>

              {/* Download Template */}
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-primary-800 text-sm">Need a template?</p>
                  <p className="text-xs text-primary-600 mt-0.5">Download our pre-formatted Excel template with sample data</p>
                </div>
                <button onClick={downloadTemplate} className="btn-outline flex items-center gap-2 text-sm">
                  <Download className="w-4 h-4" />Download Template
                </button>
              </div>

              {/* Instructions */}
              <div className="card p-4 bg-slate-50">
                <p className="font-semibold text-slate-800 text-sm mb-3">Instructions</p>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span><strong>Required fields:</strong> Product Name, Price, Part Number, Brand, Category</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span><strong>Category:</strong> Must be one of: {CATEGORIES.join(", ")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span><strong>Brand:</strong> Must be one of: {BRANDS.slice(0, 5).join(", ")}...</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span><strong>Featured:</strong> Use "true" or "false"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span><strong>Keywords:</strong> Comma-separated (e.g., "plc, siemens, automation")</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                    <span><strong>Images:</strong> Products will have placeholder images — you can attach real images later</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800">{validCount} valid</span>
                </div>
                {errorCount > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-semibold text-red-800">{errorCount} with errors</span>
                  </div>
                )}
                <button onClick={() => { setStep("upload"); setRemovedRows(new Set()); }} className="text-sm text-primary-600 hover:text-primary-700 font-medium ml-auto">
                  ← Upload different file
                </button>
              </div>

              {/* Preview Table */}
              <div className="card overflow-hidden max-h-[50vh] overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="th">Row</th>
                      <th className="th">Product Name</th>
                      <th className="th">Brand</th>
                      <th className="th">Category</th>
                      <th className="th">Price</th>
                      <th className="th">Stock</th>
                      <th className="th">Status</th>
                      <th className="th w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((row) => {
                      const isRemoved = removedRows.has(row.row);
                      return (
                        <tr key={row.row} className={`tr border-b border-slate-50 ${isRemoved ? "opacity-40 line-through bg-slate-100" : row.errors.length > 0 ? "bg-red-50/50" : ""}`}>
                          <td className="td font-mono text-xs">{row.row}</td>
                          <td className="td text-sm font-medium">{row.name || <span className="text-red-500 italic">missing</span>}</td>
                          <td className="td text-sm">{row.brand}</td>
                          <td className="td text-sm">{row.category}</td>
                          <td className="td text-sm font-semibold">₹{row.price}</td>
                          <td className="td text-sm">{row.stock || "0"}</td>
                          <td className="td">
                            {isRemoved ? (
                              <span className="badge bg-slate-200 text-slate-500 text-xs">Removed</span>
                            ) : row.errors.length === 0 ? (
                              <span className="badge badge-green text-xs">Valid</span>
                            ) : (
                              <div className="group relative">
                                <span className="badge badge-red text-xs cursor-help">{row.errors.length} error{row.errors.length > 1 ? "s" : ""}</span>
                                <div className="hidden group-hover:block absolute left-0 bottom-full mb-2 bg-slate-900 text-white text-xs rounded-lg p-2 w-64 z-10">
                                  {row.errors.map((err, i) => (
                                    <p key={i} className="mb-1 last:mb-0">• {err}</p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="td text-center">
                            {isRemoved ? (
                              <button
                                onClick={() => handleRestoreRow(row.row)}
                                className="p-1.5 rounded-lg hover:bg-emerald-100 text-slate-400 hover:text-emerald-600 transition-colors"
                                title="Restore"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRemoveRow(row.row)}
                                className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
                                title="Remove"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setStep("upload"); setRemovedRows(new Set()); }} className="btn-outline flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={validCount === 0 || importing}
                  className={`btn-primary flex-1 flex items-center justify-center gap-2 ${(validCount === 0 || importing) ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {importing ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Import {validCount} Product{validCount !== 1 ? "s" : ""}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === "result" && result && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-display font-bold text-2xl text-slate-900 mb-2">Import Complete!</h3>
              <p className="text-slate-600 mb-6">
                <span className="font-semibold text-emerald-600">{result.success} products</span> added successfully
                {result.errors > 0 && (
                  <span> • <span className="font-semibold text-red-600">{result.errors} skipped</span> due to errors</span>
                )}
              </p>
              <button onClick={onClose} className="btn-primary">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
