"use client";
import { useProducts } from "@/context/ProductContext";
import ProductCard from "@/components/ui/ProductCard";

export default function FeaturedProducts() {
  const { featuredProducts } = useProducts();
  const featured = featuredProducts.slice(0, 4);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {featured.map(p => <ProductCard key={p.id} product={p} />)}
      {featured.length === 0 && (
        <div className="col-span-4 text-center py-16 text-slate-400">
          <p className="font-display font-bold text-xl">No featured products yet</p>
          <p className="text-sm mt-1">Star products in the admin to feature them here</p>
        </div>
      )}
    </div>
  );
}
