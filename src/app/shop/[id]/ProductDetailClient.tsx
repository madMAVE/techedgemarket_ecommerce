"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ImageSlider from "@/components/ui/ImageSlider";
import { useProducts } from "@/context/ProductContext";
import { formatINR, getDiscount } from "@/utils/helpers";
import {
  ChevronRight, Star, ShoppingCart, ArrowLeft,
  Package, Truck, ShieldCheck, FileText,
  CheckCircle2, AlertTriangle, XCircle,
  ChevronDown, ChevronUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200"><XCircle className="w-3.5 h-3.5"/>Out of Stock</span>;
  if (stock < 8)
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"><AlertTriangle className="w-3.5 h-3.5"/>Only {stock} left</span>;
  return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5"/>In Stock ({stock})</span>;
}

function SpecRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-3 px-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide sm:w-48 shrink-0">{k}</span>
      <span className="text-sm text-slate-800 mt-0.5 sm:mt-0">{v}</span>
    </div>
  );
}

function RelatedCard({ product }: { product: Product }) {
  const router = useRouter();
  const disc = product.originalPrice ? getDiscount(product.price, product.originalPrice) : null;
  return (
    <div
      onClick={() => router.push(`/shop/${product.id}`)}
      className="card-hover overflow-hidden cursor-pointer group"
    >
      <div className="relative h-44 bg-slate-50 overflow-hidden">
        <ImageSlider images={product.images?.length ? product.images : [product.image]} alt={product.name} sizes="300px" />
        {product.badge && <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-primary-600 text-white shadow">{product.badge}</span>}
        {disc && <span className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-red-500 text-white">-{disc}%</span>}
      </div>
      <div className="p-4">
        <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{product.brand}</span>
        <h3 className="font-display font-bold text-slate-900 text-sm leading-tight mt-1 truncate-2">{product.name}</h3>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="font-display font-bold text-lg text-slate-900">{formatINR(product.price)}</span>
          {product.originalPrice && <span className="text-xs text-slate-400 line-through">{formatINR(product.originalPrice)}</span>}
        </div>
      </div>
    </div>
  );
}

function RelatedProducts({ product, all }: { product: Product; all: Product[] }) {
  const related = all
    .filter(p => p.id !== product.id && (p.category === product.category || p.brand === product.brand))
    .slice(0, 4);
  if (!related.length) return null;
  return (
    <div className="mt-16">
      <h2 className="section-title mb-6">Related Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {related.map(p => <RelatedCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}

export default function ProductDetailClient({ id }: { id: string }) {
  const { products } = useProducts();
  const product = products.find(p => p.id === id);
  const [qty, setQty] = useState(1);
  const [openSpecs, setOpenSpecs] = useState(true);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-24">
            <Package className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="font-display font-bold text-2xl text-slate-600 mb-1">Product Not Found</p>
            <p className="text-slate-400 text-sm mb-6">The product you are looking for does not exist.</p>
            <Link href="/shop" className="btn-primary">
              <ArrowLeft className="w-4 h-4" />Back to Shop
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const disc = product.originalPrice ? getDiscount(product.price, product.originalPrice) : null;
  const images = product.images?.length ? product.images : [product.image];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-primary-700 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 text-primary-300 text-xs flex-wrap">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/shop" className="hover:text-white transition-colors">Products</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white font-medium truncate">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: Image gallery + Price/Actions/Trust */}
          <div>
            <div className="card overflow-hidden">
              <div className="relative h-80 sm:h-96 bg-slate-50">
                <ImageSlider images={images} alt={product.name} sizes="600px" />
              </div>
            </div>
            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-xl border-2 border-slate-200 overflow-hidden shrink-0 hover:border-primary-400 transition-colors">
                    <Image src={src} alt={`${product.name} thumb ${i + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Price */}
            <div className="mt-6 p-5 rounded-2xl bg-slate-50">
              <div className="flex items-baseline gap-3">
                <span className="font-display font-bold text-4xl text-slate-900">{formatINR(product.price)}</span>
                {product.originalPrice && <span className="text-lg text-slate-400 line-through">{formatINR(product.originalPrice)}</span>}
              </div>
              <p className="text-xs text-slate-400 mt-1">+ GST 18% · {product.leadTime ? `Lead time: ${product.leadTime}` : "Ships in 2-3 days"}</p>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-600 leading-relaxed mt-5">{product.description}</p>

            {/* Quantity + Actions */}
            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2.5 text-slate-600 hover:bg-slate-100 transition-colors font-bold">−</button>
                <span className="px-4 py-2 text-sm font-semibold text-slate-900 min-w-[3rem] text-center">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="px-3 py-2.5 text-slate-600 hover:bg-slate-100 transition-colors font-bold">+</button>
              </div>
              <button disabled={product.stock === 0} className="flex-1 bg-green-600 text-white font-semibold py-2.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Buy Now
              </button>
              <button disabled={product.stock === 0} className="flex-1 btn-primary flex items-center justify-center gap-2 !py-2.5 !rounded-xl">
                <ShoppingCart className="w-4 h-4" />Add to Cart
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 mt-8">
              {[
                { icon: Truck, label: "Fast Delivery", sub: product.leadTime || "2-3 days" },
                { icon: ShieldCheck, label: "Genuine OEM", sub: "Authorised dealer" },
                { icon: FileText, label: "GST Invoice", sub: "18% GST included" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <Icon className="w-5 h-5 text-primary-600 mb-1" />
                  <span className="text-[11px] font-bold text-slate-700">{label}</span>
                  <span className="text-[10px] text-slate-400">{sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Product info */}
          <div className="flex flex-col">
            {/* Brand + category */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-black text-primary-600 uppercase tracking-widest">{product.brand}</span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">{product.category}{product.subcategory ? ` → ${product.subcategory}` : ""}</span>
            </div>

            {/* Name */}
            <h1 className="font-display font-bold text-3xl text-slate-900 leading-tight">{product.name}</h1>
            <p className="font-mono text-xs text-slate-400 mt-1">PN: {product.partNumber} · SKU: {product.sku}</p>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex">{[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? "text-yellow-400 fill-yellow-400" : "text-slate-200 fill-slate-200"}`} />
              ))}</div>
              <span className="text-sm font-semibold text-slate-700">{product.rating}</span>
              <span className="text-xs text-slate-400">({product.reviews} reviews)</span>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <StockBadge stock={product.stock} />
              {product.badge && <span className="px-3 py-1 rounded-lg text-xs font-black uppercase bg-primary-600 text-white">{product.badge}</span>}
              {disc && <span className="px-3 py-1 rounded-lg text-xs font-black uppercase bg-red-500 text-white">-{disc}% OFF</span>}
            </div>

            {/* Specs section */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="mt-8 card overflow-hidden">
                <button
                  onClick={() => setOpenSpecs(!openSpecs)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <h2 className="section-title">Technical Specifications</h2>
                  {openSpecs ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>
                {openSpecs && (
                  <div className="border-t border-slate-100">
                    {Object.entries(product.specs).filter(([, v]) => v).map(([k, v]) => (
                      <SpecRow key={k} k={k} v={v as string} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        <RelatedProducts product={product} all={products} />
      </div>

      <Footer />
    </div>
  );
}
