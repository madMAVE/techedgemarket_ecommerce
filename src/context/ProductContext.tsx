"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import type { Product, ProductCategory } from "@/types";
import { api } from "@/lib/interceptor";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface FetchParams {
  page?: number;
  limit?: number;
  keyword?: string;
  category?: string;
  brand?: string;
  sort?: string;
  order?: "asc" | "desc";
}

interface ProductContextValue {
  products: Product[];
  loading: boolean;
  meta: PaginationMeta | null;
  fetchProducts: (params?: FetchParams) => Promise<void>;
  addProduct: (p: Product) => Promise<void>;
  updateProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleFeatured: (id: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  featuredProducts: Product[];
}

const ProductContext = createContext<ProductContextValue | null>(null);

function mapProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    description: p.description || "",
    price: p.price,
    originalPrice: p.originalPrice || null,
    category: (p.category || "Automation") as unknown as ProductCategory,
    subcategory: p.subcategory,
    brand: p.brand?.name || p.brand || p.brandName || "Unknown",
    brandLogo: p.brand?.logo || p.brandLogo,
    model: p.model || "",
    image: p.image || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
    images: p.images || [],
    rating: p.rating || 4.5,
    reviews: p.reviewCount || p.reviews || 0,
    stock: p.stock || 0,
    sku: p.sku || "",
    partNumber: p.partNumber || "",
    keywords: p.keywords || [],
    featured: p.featured || false,
    badge: p.badge,
    specs: p.specs || {},
    leadTime: p.leadTime,
    isActive: p.isActive ?? true,
  };
}

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const currentParams = useRef<FetchParams>({});

  const fetchFeatured = useCallback(async () => {
    try {
      const res = await api.get<any>("/api/products", { limit: "100" });
      const data = res.data?.data ?? res.data;
      const items = data?.items || [];
      const mapped = items.map(mapProduct).filter((p: Product) => p.featured);
      setFeaturedProducts(mapped);
    } catch {
      setFeaturedProducts([]);
    }
  }, []);

  const fetchProducts = useCallback(async (params?: FetchParams) => {
    try {
      setLoading(true);
      const qp = {
        page: String(params?.page ?? currentParams.current.page ?? 1),
        limit: String(params?.limit ?? currentParams.current.limit ?? 20),
        ...(params?.keyword && { keyword: params.keyword }),
        ...(params?.category && { category: params.category }),
        ...(params?.brand && { brand: params.brand }),
        ...(params?.sort && { sort: params.sort }),
        ...(params?.order && { order: params.order }),
      };
      currentParams.current = { ...currentParams.current, ...params };
      const res = await api.get<any>("/api/products", qp);
      const data = res.data?.data ?? res.data;
      const items = data?.items || [];
      const mapped = items.map(mapProduct);
      setProducts(mapped);
      if (data?.meta) setMeta(data.meta);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchProducts(currentParams.current);
  }, [fetchProducts]);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  const addProduct = useCallback(async (p: Product) => {
    try {
      const res = await api.post<any>("/api/products", {
        name: p.name,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice,
        category: p.category,
        subcategory: p.subcategory,
        brand: p.brand,
        model: p.model,
        partNumber: p.partNumber,
        stock: p.stock,
        leadTime: p.leadTime,
        keywords: p.keywords,
        featured: p.featured,
        badge: p.badge,
        specs: p.specs,
        image: p.image,
        images: p.images,
        isActive: p.isActive ?? true,
      });
      const newProduct = { ...p, id: res.data?.id || p.id, sku: res.data?.sku || p.sku };
      setProducts(prev => [newProduct, ...prev]);
      refetch();
    } catch (err) {
      console.error("Failed to add product:", err);
      throw err;
    }
  }, [refetch]);

  const updateProduct = useCallback(async (p: Product) => {
    try {
      await api.put(`/api/products/${p.id}`, {
        name: p.name,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice,
        category: p.category,
        subcategory: p.subcategory,
        brand: p.brand,
        model: p.model,
        partNumber: p.partNumber,
        stock: p.stock,
        leadTime: p.leadTime,
        keywords: p.keywords,
        featured: p.featured,
        badge: p.badge,
        specs: p.specs,
        image: p.image,
        images: p.images,
        isActive: p.isActive ?? true,
      });
      setProducts(prev => prev.map(x => x.id === p.id ? p : x));
      refetch();
    } catch (err) {
      console.error("Failed to update product:", err);
      throw err;
    }
  }, [refetch]);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/products/${id}`);
      setProducts(prev => prev.filter(x => x.id !== id));
      refetch();
    } catch (err) {
      console.error("Failed to delete product:", err);
      throw err;
    }
  }, [refetch]);

  const toggleFeatured = useCallback(async (id: string) => {
    try {
      await api.patch(`/api/products/${id}/featured`, {});
      setProducts(prev =>
        prev.map(x => x.id === id ? { ...x, featured: !x.featured } : x)
      );
      refetch();
    } catch (err) {
      console.error("Failed to toggle featured:", err);
      throw err;
    }
  }, [refetch]);

  const getProductById = useCallback(
    (id: string) => products.find(p => p.id === id),
    [products]
  );

  return (
    <ProductContext.Provider value={{
      products, loading, meta, fetchProducts, addProduct, updateProduct,
      deleteProduct, toggleFeatured, getProductById, featuredProducts,
    }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts(): ProductContextValue {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error("useProducts must be used inside <ProductProvider>");
  return ctx;
}
