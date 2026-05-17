"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { ShoppingCart, Menu, X, Phone, Award } from "lucide-react";

const NAV = [
  { label:"Products",  href:"/shop" },
  { label:"Services",  href:"/services" },
  { label:"Orders",    href:"/orders" },
  { label:"About",     href:"/#about" },
  { label:"Contact",   href:"/#contact" },
];

export default function Navbar({ cartCount=0 }: { cartCount?: number }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Top strip */}
      <div className="bg-primary-700 text-white text-xs py-1.5">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-yellow-300 font-bold"><Award className="w-3 h-3"/>15+ Years of Industrial Expertise</span>
            <span className="hidden sm:flex items-center gap-1.5 text-primary-200"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-dot"/>OEM Authorised Distributor</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-primary-200">
            <a href="tel:+914012345678" className="flex items-center gap-1 hover:text-white transition-colors"><Phone className="w-3 h-3"/>+91-40-1234-5678</a>
            <span className="opacity-40">|</span>
            <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
            <Link href="/business" className="hover:text-white transition-colors">Analytics</Link>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16 gap-8">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image src="/techedgemarket_ecommerce/logo/TEM-dark.png" alt="TechEdge Market" width={180} height={50} className="h-10 w-auto object-contain" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1 flex-1">
            {NAV.map(n => (
              <Link key={n.href} href={n.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${path===n.href||(n.href!=="/"&&path.startsWith(n.href))?"text-primary-700 bg-primary-50 font-semibold":"text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>
                {n.label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/cart" className="relative p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-all">
              <ShoppingCart className="w-5 h-5"/>
              {cartCount>0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">{cartCount}</span>}
            </Link>
            <Link href="/shop" className="hidden sm:flex btn-primary items-center gap-1.5 !py-2 !text-sm">Get a Quote</Link>
            <button className="md:hidden p-2 text-slate-600" onClick={()=>setOpen(!open)}>
              {open?<X className="w-5 h-5"/>:<Menu className="w-5 h-5"/>}
            </button>
          </div>
        </div>

        {/* Mobile */}
        {open && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1 animate-fade-in">
            {NAV.map(n=>(
              <Link key={n.href} href={n.href} onClick={()=>setOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50">{n.label}</Link>
            ))}
            <div className="border-t border-slate-100 pt-2 mt-2">
              <Link href="/admin" onClick={()=>setOpen(false)} className="block px-4 py-2 text-xs text-slate-400 hover:text-slate-600">Admin Panel</Link>
              <Link href="/business" onClick={()=>setOpen(false)} className="block px-4 py-2 text-xs text-slate-400 hover:text-slate-600">Analytics</Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
