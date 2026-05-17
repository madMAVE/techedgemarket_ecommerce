import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin, Award, ShieldCheck, Clock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-800 text-slate-300 mt-auto">
      <div className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon:<Award className="w-5 h-5 text-yellow-400"/>, title:"15+ Years", desc:"Established 2009" },
            { icon:<ShieldCheck className="w-5 h-5 text-green-400"/>, title:"OEM Authorised", desc:"100% genuine products" },
            { icon:<Clock className="w-5 h-5 text-blue-400"/>, title:"4-Hour SLA", desc:"Critical breakdown" },
            { icon:<MapPin className="w-5 h-5 text-red-400"/>, title:"Pan-India", desc:"50+ cities served" },
          ].map(f=>(
            <div key={f.title} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">{f.icon}</div>
              <div><p className="text-white font-semibold text-sm">{f.title}</p><p className="text-slate-400 text-xs">{f.desc}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-4">
            <div className="bg-white rounded-lg p-1.5">
              <Image src="/techedgemarket_ecommerce/logo/TEM-dark.png" alt="TechEdge Market" width={160} height={45} className="h-8 w-auto object-contain" />
            </div>
          </Link>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">India's trusted B2B marketplace for industrial automation, switchgear, spare parts and engineering services.</p>
          <div className="space-y-2 text-sm">
            <a href="tel:+914012345678" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><Phone className="w-3.5 h-3.5 text-yellow-400"/>+91-40-1234-5678</a>
            <a href="mailto:sales@techedgemarket.in" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><Mail className="w-3.5 h-3.5 text-yellow-400"/>sales@techedgemarket.in</a>
            <div className="flex items-start gap-2 text-slate-400"><MapPin className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0"/>Hi-Tech City, Hyderabad – 500 081</div>
          </div>
        </div>
        {[
          { title:"Products", links:["Industrial PLCs","Electrical Switchgear","VFDs & Drives","Safety Systems","Sensors","Spare Parts","Cables & Wiring"], href:"/shop" },
          { title:"Services", links:["PLC Programming","Panel Design & Build","VFD Commissioning","Safety Audits","Power Quality","Preventive Maintenance","Breakdown Support"], href:"/services" },
        ].map(col=>(
          <div key={col.title}>
            <h4 className="font-display font-bold text-white text-lg mb-4 border-b border-slate-700 pb-2">{col.title}</h4>
            <ul className="space-y-2">{col.links.map(l=><li key={l}><Link href={col.href} className="text-sm text-slate-400 hover:text-yellow-400 transition-colors">{l}</Link></li>)}</ul>
          </div>
        ))}
        <div>
          <h4 className="font-display font-bold text-white text-lg mb-4 border-b border-slate-700 pb-2">Brands</h4>
          <div className="flex flex-wrap gap-2 mb-5">
            {["Siemens","ABB","Schneider","Allen-Bradley","Mitsubishi","Omron","SICK","Keyence","Pilz","Fluke","Rittal","Eaton"].map(b=>(
              <span key={b} className="text-[10px] text-slate-400 border border-slate-700 rounded px-2 py-0.5 hover:text-slate-200 transition-colors">{b}</span>
            ))}
          </div>
          <div className="p-3 bg-slate-700 rounded-xl text-xs">
            <p className="text-slate-300 font-bold mb-1">Business Hours</p>
            <p className="text-white">Mon–Fri: 9:00–18:30</p>
            <p className="text-slate-400">Sat: 10:00–14:00</p>
            <p className="text-green-400 font-medium mt-1">24×7 Emergency: +91-98765-43210</p>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-700 py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>© 2025 TechEdge Market Pvt. Ltd. All rights reserved.</span>
          <div className="flex gap-4"><a href="#" className="hover:text-slate-300">Privacy</a><a href="#" className="hover:text-slate-300">Terms</a><span>GST: 36AABCT1234Z1Z5</span></div>
        </div>
      </div>
    </footer>
  );
}
