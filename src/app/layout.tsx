import type { Metadata } from "next";
import "./globals.css";
import { ProductProvider } from "@/context/ProductContext";
import { AdminAuthProvider } from "@/context/AdminAuthContext";

export const metadata: Metadata = {
  title: { default: "TechEdge Market", template: "%s | TechEdge Market" },
  description: "Industrial Automation, Electrical Switchgear, Machine Spare Parts & Engineering Services — 15 years of expertise.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <AdminAuthProvider>
          <ProductProvider>
            {children}
          </ProductProvider>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
