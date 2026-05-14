import Link from "next/link";
import Image from "next/image";
import { Star, ShoppingCart, FileText, Package } from "lucide-react";
import type { Product } from "@/types";
import { formatINR, getDiscount } from "@/utils/helpers";

export default function ProductCard({ product }: { product: Product }) {
  const disc = product.originalPrice ? getDiscount(product.price, product.originalPrice) : null;
  return (
    <div className="card-hover flex flex-col overflow-hidden group">
      <div className="relative h-52 bg-slate-50 overflow-hidden">
        <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="300px"/>
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.badge && <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-primary-600 text-white shadow">{product.badge}</span>}
          {disc && <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-red-500 text-white">-{disc}%</span>}
        </div>
        {product.stock===0 && <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center"><span className="font-display font-bold text-slate-600 border-2 border-slate-300 px-4 py-2 rounded-xl">Out of Stock</span></div>}
        {product.stock>0 && product.stock<8 && <div className="absolute bottom-3 right-3"><span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500 text-white">Only {product.stock} left</span></div>}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{product.brand}</span>
          <span className="text-[10px] text-slate-400">{product.category}</span>
        </div>
        <h3 className="font-display font-bold text-slate-900 text-[17px] leading-tight mb-1 truncate-2">{product.name}</h3>
        <p className="font-mono text-[11px] text-slate-400 mb-2">PN: {product.partNumber}</p>
        <p className="text-xs text-slate-500 leading-relaxed truncate-2 mb-3 flex-1">{product.description}</p>
        <div className="flex items-center gap-1.5 mb-4">
          <div className="flex">{[...Array(5)].map((_,i)=><Star key={i} className={`w-3.5 h-3.5 ${i<Math.floor(product.rating)?"text-yellow-400 fill-yellow-400":"text-slate-200 fill-slate-200"}`}/>)}</div>
          <span className="text-xs text-slate-400">({product.reviews})</span>
        </div>
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold text-2xl text-slate-900">{formatINR(product.price)}</span>
            {product.originalPrice && <span className="text-sm text-slate-400 line-through">{formatINR(product.originalPrice)}</span>}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">+ GST 18%</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/shop/${product.id}`} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:border-primary-400 hover:text-primary-700 transition-all">
            <FileText className="w-3.5 h-3.5"/>Details
          </Link>
          <button disabled={product.stock===0} className="flex-1 btn-primary flex items-center justify-center gap-1.5 !py-2 !px-3 !text-xs !rounded-xl">
            <ShoppingCart className="w-3.5 h-3.5"/>Add
          </button>
        </div>
      </div>
    </div>
  );
}
