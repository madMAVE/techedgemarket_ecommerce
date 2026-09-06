"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/ui/ProductCard";
import Pagination from "@/components/ui/Pagination";
import { useProducts } from "@/context/ProductContext";
import { Search, SlidersHorizontal, X, Package, ChevronRight, Loader2 } from "lucide-react";

const CATS = ["All","Automation","Switchgear","Drives & Motors","Safety Systems","Sensors & Instrumentation","Cables & Wiring","Control Panels","Spare Parts"];
const BRANDS = ["All","Siemens","ABB","Schneider Electric","Omron","Allen-Bradley","Mitsubishi","SICK","Keyence","Pilz","Fluke","Rittal","Belden","Eaton"];
const SORTS = [
  {value:"createdAt-desc",label:"Newest",field:"createdAt",order:"desc" as const},
  {value:"price-asc",label:"Price: Low to High",field:"price",order:"asc" as const},
  {value:"price-desc",label:"Price: High to Low",field:"price",order:"desc" as const},
  {value:"rating-desc",label:"Top Rated",field:"rating",order:"desc" as const},
  {value:"name-asc",label:"Name A–Z",field:"name",order:"asc" as const},
];

const PAGE_SIZE = 12;
const DEBOUNCE_MS = 800;

export default function ShopPage() {
  const { products, loading, meta, fetchProducts } = useProducts();

  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [brand, setBrand] = useState("All");
  const [sort, setSort] = useState("createdAt-desc");
  const [inStock, setInStock] = useState(false);
  const [showF, setShowF] = useState(false);
  const [page, setPage] = useState(1);

  const searchRef = useRef<string>("");

  const triggerFetch = useCallback(() => {
    const s = SORTS.find(o => o.value === sort) ?? SORTS[0];
    fetchProducts({
      page,
      limit: PAGE_SIZE,
      keyword: searchRef.current || undefined,
      category: cat !== "All" ? cat : undefined,
      brand: brand !== "All" ? brand : undefined,
      sort: s.field,
      order: s.order,
    });
  }, [page, cat, brand, sort, fetchProducts]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchRef.current = search;
      setPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch when debounced search or filters change
  useEffect(() => {
    triggerFetch();
  }, [searchRef.current, cat, brand, sort, page, triggerFetch]);

  const displayProducts = useMemo(() => {
    if (inStock) return products.filter(x => x.stock > 0);
    return products;
  }, [products, inStock]);

  const handlePageChange = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setCat("All");
    setBrand("All");
    setInStock(false);
    setSearch("");
    searchRef.current = "";
    setSort("createdAt-desc");
    setPage(1);
  };

  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="bg-primary-700 py-10"><div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2 text-primary-300 text-xs mb-2">
          <span>Home</span><ChevronRight className="w-3 h-3" /><span className="text-white font-medium">Products</span>
        </div>
        <h1 className="font-display font-bold text-4xl text-white">Product Catalogue</h1>
        <p className="text-primary-300 mt-1">{meta?.total ?? 0} products · Industrial Automation · Switchgear · Drives · Safety · Instruments</p>
      </div></div>

      <div className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Search + sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input pl-11" placeholder="Search by name, brand, part number..."
              value={search} onChange={e => setSearch(e.target.value)} />
            {loading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-600 animate-spin" />
            )}
          </div>
          <select className="select w-auto min-w-44" value={cat} onChange={e => { setCat(e.target.value); setPage(1); }}>
            <option value="All">All Categories</option>
            {CATS.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="select w-auto min-w-44" value={brand} onChange={e => { setBrand(e.target.value); setPage(1); }}>
            <option value="All">All Brands</option>
            {BRANDS.filter(b => b !== "All").map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className="select w-auto min-w-44" value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>
            {SORTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={() => setShowF(!showF)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-semibold text-sm transition-all ${showF ? "bg-primary-600 text-white border-primary-600" : "bg-white border-slate-300 text-slate-700 hover:border-primary-400"}`}>
            <SlidersHorizontal className="w-4 h-4" />Filters
          </button>
        </div>

        {/* Filter panel */}
        {showF && (
          <div className="card p-6 mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Refine Results</h3>
              <button onClick={() => setShowF(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="label">Category</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CATS.map(c => (
                    <button key={c} onClick={() => { setCat(c); setPage(1); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${cat === c ? "bg-primary-600 text-white border-primary-600" : "border-slate-200 text-slate-600 hover:border-primary-300 bg-white"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Brand</label>
                <select className="select mt-2" value={brand} onChange={e => { setBrand(e.target.value); setPage(1); }}>
                  {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Availability</label>
                <label className="flex items-center gap-3 mt-3 cursor-pointer">
                  <input type="checkbox" checked={inStock} onChange={e => { setInStock(e.target.checked); setPage(1); }} className="w-4 h-4 accent-primary-600" />
                  <span className="text-sm text-slate-700">In Stock Only</span>
                </label>
                <button onClick={clearFilters}
                  className="mt-3 text-xs font-bold text-primary-600 hover:underline">Clear All</button>
              </div>
            </div>
          </div>
        )}

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {CATS.slice(0, 7).map(c => (
            <button key={c} onClick={() => { setCat(c); setPage(1); }}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold border transition-all shrink-0 ${cat === c ? "bg-slate-800 text-white border-slate-800" : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Active filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <span className="text-sm font-semibold text-slate-600">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />Searching...
              </span>
            ) : `${meta?.total ?? 0} products`}
          </span>
          {search && <span className="badge badge-blue">"{search}" <button onClick={() => { setSearch(""); searchRef.current = ""; setPage(1); }} className="ml-1">×</button></span>}
          {cat !== "All" && <span className="badge badge-blue">{cat} <button onClick={() => { setCat("All"); setPage(1); }} className="ml-1">×</button></span>}
          {brand !== "All" && <span className="badge badge-blue">{brand} <button onClick={() => { setBrand("All"); setPage(1); }} className="ml-1">×</button></span>}
          {inStock && <span className="badge badge-green">In Stock <button onClick={() => { setInStock(false); setPage(1); }} className="ml-1">×</button></span>}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-24 animate-pulse">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="font-display font-bold text-xl text-slate-500">Searching products...</p>
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-24 animate-fade-in">
            <Package className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="font-display font-bold text-2xl text-slate-600 mb-1">No Products Found</p>
            <p className="text-slate-400 text-sm">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
              {displayProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              total={meta?.total ?? 0}
              limit={PAGE_SIZE}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
