"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, Truck, Warehouse, Users, BarChart3, Wrench, Zap, ChevronRight, Bell, Settings, LogOut, Globe, FileText, Calculator, ClipboardList } from "lucide-react";

const LINKS = [
  { href:"/admin",                  label:"Dashboard",      icon:LayoutDashboard, section:"Overview" },
  { href:"/business",               label:"Analytics",      icon:BarChart3,       section:null },
  { href:"/admin/orders",           label:"Manage Orders",  icon:ShoppingBag,     section:"Orders & Finance" },
  { href:"/admin/invoice",          label:"Invoice",        icon:FileText,        section:null },
  { href:"/admin/estimation",       label:"Estimation",     icon:Calculator,      section:null },
  { href:"/admin/products",          label:"Products & SKU", icon:Package,         section:"Operations" },
  { href:"/shop",                   label:"Storefront",     icon:Package,         section:null },
  { href:"/inventory",              label:"Inventory",      icon:Warehouse,       section:null },
  { href:"/procurement",            label:"Procurement",    icon:Truck,           section:null },
  { href:"/prospects",              label:"Prospects",      icon:Users,           section:"Sales & Service" },
  { href:"/admin/service-tickets",  label:"Service Tickets",icon:ClipboardList,   section:null },
  { href:"/services",               label:"Services Page",  icon:Wrench,          section:null },
  { href:"/",                       label:"Public Site",    icon:Globe,           section:"Store" },
];

export default function AdminSidebar() {
  const path = usePathname();
  let lastSection = "";
  return (
    <aside className="sidebar w-60 min-h-screen flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-200">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-sm"><Zap className="w-4 h-4 text-white"/></div>
          <div>
            <div className="font-display font-bold text-[18px] text-slate-900 tracking-wider leading-none">Tech<span className="text-primary-600">Edge</span></div>
            <div className="text-[8px] text-slate-400 uppercase tracking-[0.2em] font-bold leading-none mt-0.5">Control Centre</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {LINKS.map(({ href, label, icon:Icon, section }) => {
          const active = path===href||(href!=="/"&&path.startsWith(href));
          const showSection = section && section!==lastSection;
          if (section) lastSection=section;
          return (
            <div key={href}>
              {showSection && <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.18em] px-3 pt-5 pb-2">{section}</p>}
              <Link href={href} className={`nav-link ${active?"nav-link-active":"nav-link-inactive"}`}>
                <Icon className="w-4 h-4 shrink-0"/>
                <span className="flex-1 font-medium text-sm">{label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 opacity-60"/>}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-3 border-t border-slate-200 pt-3 space-y-0.5">
        <button className="nav-link nav-link-inactive w-full text-sm"><Bell className="w-4 h-4"/><span className="flex-1">Notifications</span><span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">3</span></button>
        <button className="nav-link nav-link-inactive w-full text-sm"><Settings className="w-4 h-4"/><span>Settings</span></button>
        <button className="nav-link w-full text-sm text-red-500 hover:bg-red-50"><LogOut className="w-4 h-4"/><span>Sign Out</span></button>
      </div>

      {/* User */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center text-white text-xs font-black">VP</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-800 truncate">Vikram Patel</div>
            <div className="text-xs text-slate-400 truncate">General Manager</div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot shrink-0"/>
        </div>
      </div>
    </aside>
  );
}
