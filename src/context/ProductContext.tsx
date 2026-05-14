"use client";

/**
 * ProductContext
 * ──────────────────────────────────────────────────────────────
 * This is the SINGLE SOURCE OF TRUTH for products.
 *
 * Both the Shop and the Admin products page read from this context.
 * When admin adds / edits / deletes a product → shop updates instantly.
 *
 * HOW IT WORKS:
 * 1. ProductProvider wraps the whole app (in layout.tsx)
 * 2. useProducts() hook gives any component access to the list + actions
 * 3. Changes in admin automatically re-render the shop
 *
 * TO CONNECT A REAL BACKEND:
 * Replace the useState mutations with fetch() calls to your API.
 * Keep the same function signatures — no other file needs to change.
 * ──────────────────────────────────────────────────────────────
 */

import React, { createContext, useContext, useState, useCallback } from "react";
import type { Product, ProductCategory } from "@/types";
import productsData from "@/data/products.json";

// ── Types ──────────────────────────────────────────────────────

interface ProductContextValue {
  /** Full product list */
  products: Product[];

  /** Add a brand-new product */
  addProduct: (p: Product) => void;

  /** Replace an existing product by id */
  updateProduct: (p: Product) => void;

  /** Remove a product by id */
  deleteProduct: (id: string) => void;

  /** Toggle featured flag */
  toggleFeatured: (id: string) => void;

  /** Helper: get one product by id */
  getProductById: (id: string) => Product | undefined;

  /** Featured products only */
  featuredProducts: Product[];
}

// ── Create the context ─────────────────────────────────────────
const ProductContext = createContext<ProductContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────
export function ProductProvider({ children }: { children: React.ReactNode }) {
  // Seed from static JSON on first load
  const [products, setProducts] = useState<Product[]>(
    productsData as Product[]
  );

  // ── Actions ────────────────────────────────────────────────

  const addProduct = useCallback((p: Product) => {
    setProducts(prev => [p, ...prev]);
  }, []);

  const updateProduct = useCallback((p: Product) => {
    setProducts(prev => prev.map(x => x.id === p.id ? p : x));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(x => x.id !== id));
  }, []);

  const toggleFeatured = useCallback((id: string) => {
    setProducts(prev =>
      prev.map(x => x.id === id ? { ...x, featured: !x.featured } : x)
    );
  }, []);

  const getProductById = useCallback(
    (id: string) => products.find(p => p.id === id),
    [products]
  );

  const featuredProducts = products.filter(p => p.featured);

  return (
    <ProductContext.Provider value={{
      products, addProduct, updateProduct,
      deleteProduct, toggleFeatured,
      getProductById, featuredProducts,
    }}>
      {children}
    </ProductContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────
export function useProducts(): ProductContextValue {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error("useProducts must be used inside <ProductProvider>");
  return ctx;
}
