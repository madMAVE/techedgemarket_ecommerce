import fs from "fs";
import path from "path";
import ProductDetailClient from "./ProductDetailClient";

export function generateStaticParams() {
  const filePath = path.join(process.cwd(), "src/data/products.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const products = JSON.parse(raw) as { id: string }[];
  return products.map(p => ({ id: p.id }));
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetailClient id={id} />;
}
