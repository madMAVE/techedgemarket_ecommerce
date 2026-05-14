"use client";
import { useState, useMemo } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/ui/ProductCard";
import { useProducts } from "@/context/ProductContext";
import { Search, SlidersHorizontal, X, Package, ChevronRight } from "lucide-react";

const CATS = ["All","Automation","Switchgear","Drives & Motors","Safety Systems","Sensors & Instrumentation","Cables & Wiring","Control Panels","Spare Parts"];
const BRANDS = ["All","Siemens","ABB","Schneider Electric","Omron","Allen-Bradley","Mitsubishi","SICK","Keyence","Pilz","Fluke","Rittal","Belden","Eaton"];
const SORTS = [
  {value:"default",label:"Default"},
  {value:"price-asc",label:"Price: Low to High"},
  {value:"price-desc",label:"Price: High to Low"},
  {value:"rating",label:"Top Rated"},
  {value:"name",label:"Name A–Z"},
];

export default function ShopPage() {
  // Get live product list from context (synced with admin)
  const { products } = useProducts();

  const [search,setSearch]=useState(""); const [cat,setCat]=useState("All");
  const [brand,setBrand]=useState("All"); const [sort,setSort]=useState("default");
  const [inStock,setInStock]=useState(false); const [showF,setShowF]=useState(false);

  const filtered = useMemo(()=>{
    let p=[...products];
    if(search){const q=search.toLowerCase();p=p.filter(x=>x.name.toLowerCase().includes(q)||x.brand.toLowerCase().includes(q)||x.partNumber.toLowerCase().includes(q));}
    if(cat!=="All") p=p.filter(x=>x.category===cat);
    if(brand!=="All") p=p.filter(x=>x.brand===brand);
    if(inStock) p=p.filter(x=>x.stock>0);
    if(sort==="price-asc") p.sort((a,b)=>a.price-b.price);
    else if(sort==="price-desc") p.sort((a,b)=>b.price-a.price);
    else if(sort==="rating") p.sort((a,b)=>b.rating-a.rating);
    else if(sort==="name") p.sort((a,b)=>a.name.localeCompare(b.name));
    return p;
  },[products,search,cat,brand,sort,inStock]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar/>
      <div className="bg-primary-700 py-10"><div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2 text-primary-300 text-xs mb-2">
          <span>Home</span><ChevronRight className="w-3 h-3"/><span className="text-white font-medium">Products</span>
        </div>
        <h1 className="font-display font-bold text-4xl text-white">Product Catalogue</h1>
        <p className="text-primary-300 mt-1">{products.length} products · Industrial Automation · Switchgear · Drives · Safety · Instruments</p>
      </div></div>

      <div className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Search + sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
            <input className="input pl-11" placeholder="Search by name, brand, part number..."
              value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select className="select w-auto min-w-44" value={sort} onChange={e=>setSort(e.target.value)}>
            {SORTS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={()=>setShowF(!showF)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-semibold text-sm transition-all ${showF?"bg-primary-600 text-white border-primary-600":"bg-white border-slate-300 text-slate-700 hover:border-primary-400"}`}>
            <SlidersHorizontal className="w-4 h-4"/>Filters
          </button>
        </div>

        {/* Filter panel */}
        {showF && (
          <div className="card p-6 mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Refine Results</h3>
              <button onClick={()=>setShowF(false)}><X className="w-4 h-4 text-slate-400"/></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="label">Category</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CATS.map(c=>(
                    <button key={c} onClick={()=>setCat(c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${cat===c?"bg-primary-600 text-white border-primary-600":"border-slate-200 text-slate-600 hover:border-primary-300 bg-white"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Brand</label>
                <select className="select mt-2" value={brand} onChange={e=>setBrand(e.target.value)}>
                  {BRANDS.map(b=><option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Availability</label>
                <label className="flex items-center gap-3 mt-3 cursor-pointer">
                  <input type="checkbox" checked={inStock} onChange={e=>setInStock(e.target.checked)} className="w-4 h-4 accent-primary-600"/>
                  <span className="text-sm text-slate-700">In Stock Only</span>
                </label>
                <button onClick={()=>{setCat("All");setBrand("All");setInStock(false);setSearch("");}}
                  className="mt-3 text-xs font-bold text-primary-600 hover:underline">Clear All</button>
              </div>
            </div>
          </div>
        )}

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {CATS.slice(0,7).map(c=>(
            <button key={c} onClick={()=>setCat(c)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold border transition-all shrink-0 ${cat===c?"bg-slate-800 text-white border-slate-800":"bg-white border-slate-200 text-slate-600 hover:border-slate-400"}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Active filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <span className="text-sm font-semibold text-slate-600">{filtered.length} products</span>
          {cat!=="All" && <span className="badge badge-blue">{cat} <button onClick={()=>setCat("All")} className="ml-1">×</button></span>}
          {brand!=="All" && <span className="badge badge-blue">{brand} <button onClick={()=>setBrand("All")} className="ml-1">×</button></span>}
          {inStock && <span className="badge badge-green">In Stock <button onClick={()=>setInStock(false)} className="ml-1">×</button></span>}
        </div>

        {/* Grid */}
        {filtered.length===0 ? (
          <div className="text-center py-24">
            <Package className="w-12 h-12 mx-auto mb-4 text-slate-300"/>
            <p className="font-display font-bold text-2xl text-slate-600 mb-1">No Products Found</p>
            <p className="text-slate-400 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(p=><ProductCard key={p.id} product={p}/>)}
          </div>
        )}
      </div>
      <Footer/>
    </div>
  );
}
