"use client";

import { useState, useMemo } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { useProducts } from "@/context/ProductContext";
import { formatINR } from "@/utils/helpers";
import type { Product, ProductCategory } from "@/types";
import {
  Plus, Search, Edit3, Trash2, X, Save,
  Package, CheckCircle, AlertCircle, Copy,
  Star, Eye, EyeOff,
} from "lucide-react";

const CATEGORIES: ProductCategory[] = [
  "Automation","Switchgear","Drives & Motors","Safety Systems",
  "Sensors & Instrumentation","Cables & Wiring","Control Panels","Spare Parts",
];
const BRANDS = [
  "Siemens","ABB","Schneider Electric","Omron","Allen-Bradley",
  "Mitsubishi","SICK","Keyence","Pilz","Fluke","Rittal",
  "Belden","Eaton","Endress+Hauser","Balluff","TechEdge OEM",
];
const LEAD_TIMES = [
  "1–2 days","2–3 days","3–5 days","5–7 days",
  "7–10 days","10–14 days","14–21 days","21–30 days",
];

function genSKU(brand: string, cat: string, model: string) {
  const b = brand.replace(/[^a-zA-Z]/g,"").slice(0,3).toUpperCase();
  const c = cat.replace(/[^a-zA-Z]/g,"").slice(0,3).toUpperCase();
  const m = model.replace(/[^a-zA-Z0-9]/g,"").slice(0,6).toUpperCase();
  return `${b}-${c}-${m||Math.floor(Math.random()*900+100)}`;
}
function genID() { return "p"+Date.now().toString().slice(-7); }

type Form = {
  name:string; description:string; price:string; originalPrice:string;
  category:ProductCategory; brand:string; model:string;
  partNumber:string; stock:string; leadTime:string;
  tags:string; featured:boolean; badge:string;
};
const EMPTY: Form = {
  name:"",description:"",price:"",originalPrice:"",
  category:"Automation",brand:"Siemens",model:"",
  partNumber:"",stock:"",leadTime:"3–5 days",
  tags:"",featured:false,badge:"",
};
function formToProduct(f: Form, existingId?: string): Product {
  return {
    id: existingId ?? genID(),
    name: f.name.trim(), description: f.description.trim(),
    price: parseFloat(f.price)||0,
    originalPrice: f.originalPrice ? parseFloat(f.originalPrice) : null,
    category: f.category, brand: f.brand, model: f.model.trim(),
    partNumber: f.partNumber.trim(),
    sku: genSKU(f.brand, f.category, f.model),
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
    rating: 4.5, reviews: 0,
    stock: parseInt(f.stock)||0, leadTime: f.leadTime,
    tags: f.tags.split(",").map(t=>t.trim()).filter(Boolean),
    featured: f.featured, badge: f.badge.trim()||undefined, specs:{},
  };
}
function productToForm(p: Product): Form {
  return {
    name:p.name, description:p.description,
    price:String(p.price), originalPrice:p.originalPrice?String(p.originalPrice):"",
    category:p.category, brand:p.brand, model:p.model, partNumber:p.partNumber,
    stock:String(p.stock), leadTime:p.leadTime??"3–5 days",
    tags:p.tags.join(", "), featured:p.featured??false, badge:p.badge??"",
  };
}

/* ── Toast ─────────────────────────────────────────────────── */
function Toast({ msg, ok }: { msg:string; ok:boolean }) {
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg font-semibold text-sm animate-fade-in ${ok?"bg-emerald-600":"bg-red-600"} text-white`}>
      {ok?<CheckCircle className="w-4 h-4 shrink-0"/>:<AlertCircle className="w-4 h-4 shrink-0"/>}
      {msg}
    </div>
  );
}

/* ── Add / Edit Modal ──────────────────────────────────────── */
function ProductModal({ initial, onSave, onClose }: {
  initial:Product|null; onSave:(p:Product)=>void; onClose:()=>void;
}) {
  const [form, setForm] = useState<Form>(initial ? productToForm(initial) : EMPTY);
  const set = (k: keyof Form, v: string|boolean) => setForm(p=>({...p,[k]:v}));
  const previewSKU = genSKU(form.brand, form.category, form.model);
  const discPct = form.price && form.originalPrice &&
    parseFloat(form.originalPrice) > parseFloat(form.price)
    ? Math.round((1 - parseFloat(form.price)/parseFloat(form.originalPrice))*100) : null;

  const handleSave = () => {
    if (!form.name.trim())       { alert("Product name is required"); return; }
    if (!form.price)             { alert("Price is required"); return; }
    if (!form.partNumber.trim()) { alert("Part number is required"); return; }
    onSave(formToProduct(form, initial?.id));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center p-4 pt-8 bg-slate-900/50 backdrop-blur-sm overflow-y-auto"
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="card w-full max-w-2xl animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="font-display font-bold text-xl text-slate-900">{initial?"Edit Product":"Add New Product"}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{initial?`Editing: ${initial.name}`:"New product will appear in shop instantly"}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><X className="w-5 h-5"/></button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-6 max-h-[72vh] overflow-y-auto">

          {/* Basic */}
          <section>
            <p className="eyebrow mb-3">Basic Information</p>
            <div className="space-y-4">
              <div>
                <label className="label">Product Name <span className="text-red-500 font-normal normal-case">*</span></label>
                <input className="input mt-1" placeholder="e.g. Siemens SIMATIC S7-1500 PLC"
                  value={form.name} onChange={e=>set("name",e.target.value)}/>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input mt-1 resize-none" rows={3}
                  placeholder="Key features, applications, compatibility…"
                  value={form.description} onChange={e=>set("description",e.target.value)}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Brand <span className="text-red-500 font-normal normal-case">*</span></label>
                  <select className="select mt-1" value={form.brand} onChange={e=>set("brand",e.target.value)}>
                    {BRANDS.map(b=><option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Category <span className="text-red-500 font-normal normal-case">*</span></label>
                  <select className="select mt-1" value={form.category} onChange={e=>set("category",e.target.value as ProductCategory)}>
                    {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Model Number</label>
                  <input className="input mt-1 font-mono" placeholder="e.g. 6ES7515-2AM02"
                    value={form.model} onChange={e=>set("model",e.target.value)}/>
                </div>
                <div>
                  <label className="label">Part Number <span className="text-red-500 font-normal normal-case">*</span></label>
                  <input className="input mt-1 font-mono" placeholder="Manufacturer part number"
                    value={form.partNumber} onChange={e=>set("partNumber",e.target.value)}/>
                </div>
              </div>
            </div>
          </section>

          {/* SKU preview */}
          <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
            <p className="eyebrow mb-2">Auto-Generated SKU</p>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono font-bold text-2xl text-primary-800">{previewSKU}</p>
                <p className="text-xs text-primary-500 mt-0.5">
                  <strong>{form.brand.slice(0,3).toUpperCase()}</strong>{" + "}
                  <strong>{form.category.slice(0,3).toUpperCase()}</strong>{" + "}
                  <strong>{form.model.slice(0,6).toUpperCase()||"###"}</strong>
                </p>
              </div>
              <button onClick={()=>navigator.clipboard.writeText(previewSKU)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-100 hover:bg-primary-200 text-primary-700 text-xs font-bold transition-all shrink-0">
                <Copy className="w-3.5 h-3.5"/>Copy
              </button>
            </div>
          </div>

          {/* Pricing */}
          <section>
            <p className="eyebrow mb-3">Pricing</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Selling Price (₹) <span className="text-red-500 font-normal normal-case">*</span></label>
                <input type="number" min={0} className="input mt-1" placeholder="0.00"
                  value={form.price} onChange={e=>set("price",e.target.value)}/>
              </div>
              <div>
                <label className="label">Original / MRP (₹)</label>
                <input type="number" min={0} className="input mt-1" placeholder="Leave blank if no discount"
                  value={form.originalPrice} onChange={e=>set("originalPrice",e.target.value)}/>
              </div>
            </div>
            {discPct && (
              <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5"/>{discPct}% discount — sale badge shown automatically
              </p>
            )}
          </section>

          {/* Stock */}
          <section>
            <p className="eyebrow mb-3">Stock & Logistics</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Stock Quantity <span className="text-red-500 font-normal normal-case">*</span></label>
                <input type="number" min={0} className="input mt-1" placeholder="0"
                  value={form.stock} onChange={e=>set("stock",e.target.value)}/>
                {form.stock !== "" && (
                  <p className={`text-xs font-bold mt-1.5 ${parseInt(form.stock)===0?"text-red-500":parseInt(form.stock)<10?"text-amber-600":"text-emerald-600"}`}>
                    {parseInt(form.stock)===0
                      ?"⚠ Will show as Out of Stock in shop"
                      :parseInt(form.stock)<10
                      ?`⚠ Low stock — ${form.stock} units`
                      :`✓ In stock — ${form.stock} units`}
                  </p>
                )}
              </div>
              <div>
                <label className="label">Lead Time</label>
                <select className="select mt-1" value={form.leadTime} onChange={e=>set("leadTime",e.target.value)}>
                  {LEAD_TIMES.map(l=><option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Display */}
          <section>
            <p className="eyebrow mb-3">Shop Display</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Badge</label>
                <input className="input mt-1" placeholder="New, Sale, Bestseller, Premium…"
                  value={form.badge} onChange={e=>set("badge",e.target.value)}/>
              </div>
              <div>
                <label className="label">Tags (comma-separated)</label>
                <input className="input mt-1" placeholder="plc, siemens, automation"
                  value={form.tags} onChange={e=>set("tags",e.target.value)}/>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="font-semibold text-slate-800 text-sm">Feature on Homepage</p>
                <p className="text-xs text-slate-400 mt-0.5">Show in Featured Products section</p>
              </div>
              <button onClick={()=>set("featured",!form.featured)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0 ${form.featured?"bg-primary-600":"bg-slate-300"}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${form.featured?"left-6":"left-0.5"}`}/>
              </button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-5 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="btn-outline flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Save className="w-4 h-4"/>{initial?"Save Changes":"Add to Shop"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete Confirm ────────────────────────────────────────── */
function DeleteDialog({ product, onConfirm, onCancel }: {
  product:Product; onConfirm:()=>void; onCancel:()=>void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="card w-full max-w-sm p-6 animate-slide-up text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-red-600"/>
        </div>
        <h3 className="font-display font-bold text-xl text-slate-900 mb-2">Delete Product?</h3>
        <p className="text-sm text-slate-500 mb-3">You are about to remove:</p>
        <p className="font-semibold text-slate-800 text-sm">{product.name}</p>
        <p className="font-mono text-xs text-primary-600 mt-1 mb-4">{product.sku}</p>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 text-xs text-red-700 font-medium">
          ⚠ This product will be removed from the shop immediately.
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-outline flex-1">Cancel</button>
          <button onClick={onConfirm} className="btn-danger flex-1">Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ── Product Row ───────────────────────────────────────────── */
function ProductRow({ product, onEdit, onDelete, onToggleFeatured, onToggleStock }: {
  product:Product; onEdit:(p:Product)=>void; onDelete:(p:Product)=>void;
  onToggleFeatured:(id:string)=>void; onToggleStock:(id:string)=>void;
}) {
  const stockBadge = product.stock===0 ? "badge badge-red"
    : product.stock<10 ? "badge badge-amber" : "badge badge-green";
  const stockLabel = product.stock===0 ? "Out of Stock"
    : product.stock<10 ? `Low (${product.stock})` : `${product.stock} units`;

  return (
    <tr className="tr group border-b border-slate-50">
      <td className="td">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image} alt="" className="w-10 h-10 rounded-xl object-cover bg-slate-100 shrink-0"/>
          <div>
            <p className="font-semibold text-slate-900 text-sm leading-tight">{product.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-[10px] text-primary-600 bg-primary-50 border border-primary-100 px-1.5 py-0.5 rounded">{product.sku}</span>
              <button onClick={()=>navigator.clipboard.writeText(product.sku)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary-600 transition-all" title="Copy SKU">
                <Copy className="w-3 h-3"/>
              </button>
            </div>
          </div>
        </div>
      </td>
      <td className="td"><span className="font-mono text-xs text-slate-500">{product.partNumber}</span></td>
      <td className="td">
        <p className="text-sm font-semibold text-slate-800">{product.brand}</p>
        <p className="text-xs text-slate-400">{product.category}</p>
      </td>
      <td className="td">
        <p className="font-display font-bold text-slate-900 text-base">{formatINR(product.price)}</p>
        {product.originalPrice && <p className="text-xs text-slate-400 line-through">{formatINR(product.originalPrice)}</p>}
      </td>
      <td className="td"><span className={stockBadge}>{stockLabel}</span></td>
      <td className="td text-center">
        <button onClick={()=>onToggleFeatured(product.id)} title={product.featured?"Unfeature":"Feature on homepage"}
          className="transition-all hover:scale-110 active:scale-95">
          <Star className={`w-5 h-5 ${product.featured?"text-yellow-400 fill-yellow-400":"text-slate-200 hover:text-yellow-300"}`}/>
        </button>
      </td>
      <td className="td text-center">
        <button onClick={()=>onToggleStock(product.id)}
          className={`flex items-center gap-1 mx-auto text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${product.stock>0?"bg-emerald-50 text-emerald-700 hover:bg-emerald-100":"bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
          {product.stock>0?<Eye className="w-3.5 h-3.5"/>:<EyeOff className="w-3.5 h-3.5"/>}
          {product.stock>0?"Live":"Hidden"}
        </button>
      </td>
      <td className="td">
        <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
          <button onClick={()=>onEdit(product)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-primary-400 hover:text-primary-700 text-xs font-semibold transition-all">
            <Edit3 className="w-3.5 h-3.5"/>Edit
          </button>
          <button onClick={()=>onDelete(product)}
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200 transition-all">
            <Trash2 className="w-4 h-4"/>
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */
export default function AdminProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct, toggleFeatured } = useProducts();
  const [showModal, setShowModal]       = useState(false);
  const [editTarget, setEditTarget]     = useState<Product|null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product|null>(null);
  const [toast, setToast]               = useState<{msg:string;ok:boolean}|null>(null);
  const [search, setSearch]             = useState("");
  const [catFilter, setCatFilter]       = useState("All");
  const [brandFilter, setBrandFilter]   = useState("All");
  const [sortBy, setSortBy]             = useState("name");
  const [stockFilter, setStockFilter]   = useState("all");

  const showToast = (msg:string, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3000); };

  const filtered = useMemo(()=>{
    let list=[...products];
    if(search){const q=search.toLowerCase();list=list.filter(p=>p.name.toLowerCase().includes(q)||p.sku.toLowerCase().includes(q)||p.partNumber.toLowerCase().includes(q)||p.brand.toLowerCase().includes(q));}
    if(catFilter!=="All") list=list.filter(p=>p.category===catFilter);
    if(brandFilter!=="All") list=list.filter(p=>p.brand===brandFilter);
    if(stockFilter==="in")  list=list.filter(p=>p.stock>=10);
    if(stockFilter==="low") list=list.filter(p=>p.stock>0&&p.stock<10);
    if(stockFilter==="out") list=list.filter(p=>p.stock===0);
    if(sortBy==="name")       list.sort((a,b)=>a.name.localeCompare(b.name));
    if(sortBy==="price-asc")  list.sort((a,b)=>a.price-b.price);
    if(sortBy==="price-desc") list.sort((a,b)=>b.price-a.price);
    if(sortBy==="stock")      list.sort((a,b)=>a.stock-b.stock);
    if(sortBy==="newest")     list.reverse();
    return list;
  },[products,search,catFilter,brandFilter,sortBy,stockFilter]);

  const stats = useMemo(()=>({
    total:products.length,
    inStock:products.filter(p=>p.stock>=10).length,
    lowStock:products.filter(p=>p.stock>0&&p.stock<10).length,
    outOfStock:products.filter(p=>p.stock===0).length,
    featured:products.filter(p=>p.featured).length,
  }),[products]);

  const allBrands = ["All",...Array.from(new Set(products.map(p=>p.brand))).sort()];

  const handleSave = (p:Product) => {
    const isNew = !products.find(x=>x.id===p.id);
    if(isNew) addProduct(p); else updateProduct(p);
    showToast(isNew?"✓ Product added to shop!":"✓ Product updated!");
  };
  const handleDelete = () => {
    if(!deleteTarget) return;
    deleteProduct(deleteTarget.id);
    setDeleteTarget(null);
    showToast("Product removed from shop");
  };
  const handleToggleStock = (id:string) => {
    const p=products.find(x=>x.id===id);
    if(!p) return;
    updateProduct({...p, stock:p.stock>0?0:50});
    showToast(p.stock>0?"Product hidden from shop":"Product restored to shop");
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar/>
      {toast && <Toast msg={toast.msg} ok={toast.ok}/>}
      {showModal && <ProductModal initial={editTarget} onSave={handleSave} onClose={()=>{setShowModal(false);setEditTarget(null);}}/>}
      {deleteTarget && <DeleteDialog product={deleteTarget} onConfirm={handleDelete} onCancel={()=>setDeleteTarget(null)}/>}

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="page-title flex items-center gap-3"><Package className="w-7 h-7 text-primary-600"/>Product & SKU Manager</h1>
              <p className="page-sub">Add, edit, remove and feature products — changes sync to shop instantly</p>
            </div>
            <button onClick={()=>{setEditTarget(null);setShowModal(true);}} className="btn-primary flex items-center gap-2 !py-3 !px-6">
              <Plus className="w-5 h-5"/>Add New Product
            </button>
          </div>

          {/* Live sync banner */}
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse"/>
            <p className="text-sm text-emerald-800 font-medium">
              <strong>Live Sync Active</strong> — Add, edit, or delete here and changes appear instantly in the shop and homepage.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
            {[
              {label:"Total Products",value:stats.total,      color:"text-slate-900",   bg:"",                                  f:"all"},
              {label:"In Stock",      value:stats.inStock,    color:"text-emerald-700", bg:"bg-emerald-50 border-emerald-200",   f:"in"},
              {label:"Low Stock",     value:stats.lowStock,   color:"text-amber-700",   bg:"bg-amber-50 border-amber-200",       f:"low"},
              {label:"Out of Stock",  value:stats.outOfStock, color:"text-red-700",     bg:"bg-red-50 border-red-200",           f:"out"},
              {label:"Featured ★",    value:stats.featured,   color:"text-yellow-700",  bg:"bg-yellow-50 border-yellow-200",    f:"all"},
            ].map(s=>(
              <button key={s.label} onClick={()=>setStockFilter(s.f)}
                className={`stat-card text-center border transition-all hover:shadow-card-lg cursor-pointer ${s.bg} ${stockFilter===s.f&&s.f!=="all"?"ring-2 ring-primary-400":""}`}>
                <p className={`font-display font-bold text-3xl ${s.color}`}>{s.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{s.label}</p>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="card p-4 mb-5">
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <div className="relative flex-1 min-w-52">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                <input className="input pl-11" placeholder="Search name, SKU, part no., brand…"
                  value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <select className="select w-auto min-w-44" value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
                <option>All</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
              <select className="select w-auto min-w-40" value={brandFilter} onChange={e=>setBrandFilter(e.target.value)}>
                {allBrands.map(b=><option key={b}>{b}</option>)}
              </select>
              <select className="select w-auto min-w-44" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                <option value="name">Sort: Name A–Z</option>
                <option value="newest">Sort: Newest First</option>
                <option value="price-asc">Sort: Price Low–High</option>
                <option value="price-desc">Sort: Price High–Low</option>
                <option value="stock">Sort: Lowest Stock</option>
              </select>
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-3">
              <span className="text-sm text-slate-500 font-medium">{filtered.length} of {products.length} products</span>
              {search && <button onClick={()=>setSearch("")} className="badge badge-blue text-xs">{search} <X className="w-3 h-3 ml-1"/></button>}
              {catFilter!=="All" && <button onClick={()=>setCatFilter("All")} className="badge badge-blue text-xs">{catFilter} <X className="w-3 h-3 ml-1"/></button>}
              {brandFilter!=="All" && <button onClick={()=>setBrandFilter("All")} className="badge badge-blue text-xs">{brandFilter} <X className="w-3 h-3 ml-1"/></button>}
              {stockFilter!=="all" && <button onClick={()=>setStockFilter("all")} className="badge badge-amber text-xs">Clear stock filter <X className="w-3 h-3 ml-1"/></button>}
            </div>
          </div>

          {/* Table */}
          {filtered.length===0 ? (
            <div className="card py-24 text-center">
              <Package className="w-14 h-14 mx-auto mb-4 text-slate-200"/>
              <p className="font-display font-bold text-2xl text-slate-500 mb-2">No products found</p>
              <p className="text-slate-400 text-sm mb-6">Adjust filters or add a new product</p>
              <button onClick={()=>{setEditTarget(null);setShowModal(true);}} className="btn-primary mx-auto flex items-center gap-2 w-fit">
                <Plus className="w-4 h-4"/>Add First Product
              </button>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr>
                    <th className="th">Product / SKU</th>
                    <th className="th">Part Number</th>
                    <th className="th">Brand / Category</th>
                    <th className="th">Price</th>
                    <th className="th">Stock</th>
                    <th className="th text-center">Featured ★</th>
                    <th className="th text-center">Shop</th>
                    <th className="th">Actions</th>
                  </tr></thead>
                  <tbody>
                    {filtered.map(p=>(
                      <ProductRow key={p.id} product={p}
                        onEdit={p=>{setEditTarget(p);setShowModal(true);}}
                        onDelete={setDeleteTarget}
                        onToggleFeatured={toggleFeatured}
                        onToggleStock={handleToggleStock}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <p className="text-xs text-slate-400">Showing {filtered.length} of {products.length} products</p>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>Live sync active
                </p>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              {icon:"➕", title:"Add",    desc:"Click Add New Product to open the form. Product appears in /shop instantly."},
              {icon:"✏️", title:"Edit",   desc:"Click Edit to open a pre-filled form. Save to update the shop in real time."},
              {icon:"⭐", title:"Feature",desc:"Click the star to add/remove a product from the homepage Featured section."},
              {icon:"👁",  title:"Hide",  desc:"Toggle Shop button to hide without deleting (sets stock to 0)."},
            ].map(t=>(
              <div key={t.title} className="card p-4 flex items-start gap-3">
                <span className="text-2xl shrink-0">{t.icon}</span>
                <div><p className="font-bold text-slate-800 text-sm">{t.title}</p><p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{t.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
