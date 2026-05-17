import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FeaturedProducts from "@/components/ui/FeaturedProducts";
import { ArrowRight, CheckCircle, Star, Phone, ChevronRight, Zap, Shield, Truck, Headphones, Award, Cpu, Settings, Radio, Cable, ShieldCheck, Package, BarChart3 } from "lucide-react";

const CATS = [
  { name:"Industrial Automation",    desc:"PLCs, HMIs, SCADA, Motion Control",   icon:<Cpu className="w-6 h-6"/>,      href:"/shop?cat=Automation",               bg:"bg-blue-600" },
  { name:"Electrical Switchgear",    desc:"ACBs, MCCBs, Contactors, Relays",      icon:<Zap className="w-6 h-6"/>,      href:"/shop?cat=Switchgear",               bg:"bg-amber-500" },
  { name:"Drives & Motors",          desc:"VFDs, Servo Drives, Soft Starters",    icon:<Settings className="w-6 h-6"/>, href:"/shop?cat=Drives & Motors",          bg:"bg-emerald-600" },
  { name:"Safety Systems",           desc:"Safety PLCs, Scanners, Light Curtains",icon:<ShieldCheck className="w-6 h-6"/>,href:"/shop?cat=Safety Systems",         bg:"bg-red-500" },
  { name:"Sensors & Instruments",    desc:"Proximity, Flow Meters, Analysers",    icon:<Radio className="w-6 h-6"/>,    href:"/shop?cat=Sensors & Instrumentation",bg:"bg-purple-600" },
  { name:"Machine Spare Parts",      desc:"Encoders, Bearings, Seals, Gears",     icon:<Package className="w-6 h-6"/>, href:"/shop?cat=Spare Parts",              bg:"bg-cyan-600" },
  { name:"Control Panels",           desc:"MCC, PDB, Custom Panel Build",          icon:<BarChart3 className="w-6 h-6"/>,href:"/shop?cat=Control Panels",          bg:"bg-orange-500" },
  { name:"Cables & Wiring",          desc:"Industrial Ethernet, Power, Signal",   icon:<Cable className="w-6 h-6"/>,   href:"/shop?cat=Cables & Wiring",          bg:"bg-slate-500" },
];

const SERVICES = [
  { icon:"💻", title:"PLC Programming & SCADA",   desc:"Full-cycle automation from logic design to HMI/SCADA commissioning using TIA Portal, Studio 5000 & GX Works.", tags:["Siemens","Allen-Bradley","Mitsubishi"] },
  { icon:"🏭", title:"Panel Design & Build",        desc:"Custom MCC, PDB and control panels to IS/IEC standards with complete engineering documentation and FAT/SAT.", tags:["IEC 61439","IP55/65","FAT/SAT"] },
  { icon:"⚙️", title:"VFD Commissioning",           desc:"On-site drive commissioning, parameter configuration, load testing and operator training for all platforms.", tags:["ABB","Siemens","Allen-Bradley"] },
  { icon:"🛡️", title:"Safety System Services",      desc:"SIL assessment, safety PLC programming, functional safety validation per IEC 62061 and ISO 13849.", tags:["SIL2/3","PLd/e","CE Marking"] },
  { icon:"📊", title:"Power Quality Audit",         desc:"48-hour power monitoring, harmonic analysis, voltage unbalance reporting and PFC solutions.", tags:["IEC 61000","EN 50160","PFC"] },
  { icon:"🔧", title:"Preventive Maintenance",      desc:"Scheduled AMC contracts covering thermal imaging, contact inspection, trip testing and detailed reports.", tags:["Annual AMC","Thermal","Predictive"] },
];

const TESTIMONIALS = [
  { name:"Raj Mehta",           title:"Plant Head",          company:"Indopack Machines",        text:"TechEdge has been our exclusive automation partner for 6 years. Their engineers understand our processes deeply — they don't just supply parts, they solve problems. Delivery always on time.", rating:5 },
  { name:"Priya Nair",          title:"Sr. Electrical Engr", company:"GreenPower Electrical",    text:"Schneider Masterpact breakers arrived with full test certificates. Panel inspection was clean, no NCRs from our client's team. Technical support during commissioning was exemplary.", rating:5 },
  { name:"Sameer Kulkarni",     title:"VP – Manufacturing",  company:"AutoTek Manufacturing",    text:"We had an ABB drive failure at 11pm Friday before a critical run. TechEdge's engineer was on-site by 6am Saturday with a replacement unit already parametrised. Invaluable partnership.", rating:5 },
];

export default function HomePage() {
  // Featured products come from ProductContext via <FeaturedProducts/> component
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar/>

      {/* ── HERO ── */}
      <section className="hero-light relative overflow-hidden">
        <div className="absolute inset-0 hero-grid"/>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-primary-100 border border-primary-200 rounded-full px-4 py-1.5 mb-6">
              <Award className="w-4 h-4 text-primary-600"/>
              <span className="text-primary-700 text-sm font-semibold">Trusted by 300+ Indian enterprises since 2009</span>
            </div>
            <h1 className="font-display font-bold text-slate-900 leading-none mb-6" style={{fontSize:"clamp(2.8rem,5.5vw,4.5rem)"}}>
              Industrial <span className="text-primary-600">Automation</span><br/>
              & Electrical Experts
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              One-stop B2B marketplace for genuine OEM automation products, electrical switchgear, machine spare parts — backed by 15 years of field engineering expertise.
            </p>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-10">
              <Link href="/shop" className="btn-primary btn-lg flex items-center gap-2">Browse Products <ArrowRight className="w-5 h-5"/></Link>
              <Link href="/services" className="btn-outline btn-lg">Engineering Services</Link>
              <a href="tel:+914012345678" className="flex items-center gap-2 text-slate-500 hover:text-primary-600 text-sm font-medium py-3 transition-colors"><Phone className="w-4 h-4"/>+91-40-1234-5678</a>
            </div>
            <div className="flex flex-wrap gap-5 text-sm text-slate-500 justify-center lg:justify-start">
              {["OEM Authorised","GST Compliant","Pan-India Delivery","ISO 9001:2015","24×7 Support"].map(t=>(
                <span key={t} className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500"/>{t}</span>
              ))}
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:w-80 shrink-0">
            {[{n:"15+",l:"Years Expertise",s:"Est. 2009"},{n:"300+",l:"Enterprise Clients",s:"Pan-India"},{n:"16+",l:"OEM Brands",s:"Authorised"},{n:"₹4.87Cr",l:"Annual Revenue",s:"FY 2024–25"}].map(s=>(
              <div key={s.l} className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 text-center">
                <div className="font-display font-bold text-2xl text-primary-700">{s.n}</div>
                <div className="text-xs font-semibold text-slate-700 mt-0.5">{s.l}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{s.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand strip */}
      <div className="bg-white border-y border-slate-200 py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center gap-x-8 gap-y-2 justify-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorised For:</span>
          {["Siemens","ABB","Schneider","Allen-Bradley","Mitsubishi","Omron","SICK","Keyence","Pilz","Fluke","Rittal","Eaton"].map(b=>(
            <span key={b} className="text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors cursor-default">{b}</span>
          ))}
        </div>
      </div>

      {/* Categories */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-10">
            <p className="eyebrow mb-2">Product Range</p>
            <h2 className="font-display font-bold text-5xl text-slate-900 leading-none">Complete Industrial Solutions</h2>
            <p className="text-slate-500 mt-2 text-lg">Comprehensive range from leading global OEM manufacturers</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATS.map(cat=>(
              <Link key={cat.name} href={cat.href} className="card-hover p-6 group">
                <div className={`w-12 h-12 rounded-xl ${cat.bg} flex items-center justify-center text-white mb-4 shadow-sm group-hover:scale-105 transition-transform duration-300`}>{cat.icon}</div>
                <h3 className="font-display font-bold text-slate-900 text-[16px] leading-tight mb-1">{cat.name}</h3>
                <p className="text-xs text-slate-500">{cat.desc}</p>
                <div className="flex items-center gap-1 mt-3 text-primary-600 text-xs font-bold">Browse<ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"/></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="eyebrow mb-2">Popular This Month</p>
              <h2 className="font-display font-bold text-5xl text-slate-900 leading-none">Featured Products</h2>
            </div>
            <Link href="/shop" className="btn-ghost flex items-center gap-1 text-primary-600 hover:text-primary-700 font-bold">View All<ChevronRight className="w-4 h-4"/></Link>
          </div>
          <div className="relative">
            <FeaturedProducts />
          </div>
        </div>
      </section>

      {/* Why TechEdge */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="eyebrow mb-2">Why Choose Us</p>
            <h2 className="font-display font-bold text-5xl text-slate-900 leading-none">Built on Trust. Backed by Experience.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon:<Award className="w-6 h-6"/>, title:"Genuine OEM Only", desc:"Sourced directly from manufacturer or authorised distributor. Full traceability, certificates and documentation.", bg:"bg-primary-50 text-primary-600" },
              { icon:<Truck className="w-6 h-6"/>, title:"Fast Pan-India", desc:"Same-day dispatch for in-stock items. Dedicated freight for heavy switchgear. Real-time tracking.", bg:"bg-emerald-50 text-emerald-600" },
              { icon:<Shield className="w-6 h-6"/>, title:"Warranty & AMC", desc:"Full manufacturer warranty. Extended AMC contracts with priority SLA for critical equipment.", bg:"bg-amber-50 text-amber-600" },
              { icon:<Headphones className="w-6 h-6"/>, title:"Expert Engineers", desc:"Application engineers with decades of field experience. Pre-sales, commissioning and 24×7 support.", bg:"bg-purple-50 text-purple-600" },
            ].map(f=>(
              <div key={f.title} className="card p-7 hover:shadow-card-lg transition-shadow">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${f.bg}`}>{f.icon}</div>
                <h3 className="font-display font-bold text-xl text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-white py-20" id="services">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
            <div className="lg:col-span-2 lg:sticky top-24">
              <p className="eyebrow mb-3">Engineering Services</p>
              <h2 className="font-display font-bold text-5xl text-slate-900 leading-none mb-5">We Don't Just Sell.<br/>We <span className="text-primary-600">Solve.</span></h2>
              <p className="text-slate-500 text-lg leading-relaxed mb-6">Certified engineers deliver end-to-end automation, electrical and instrumentation services across India.</p>
              {["IEC/IS Standards compliant","Certified field engineers","Comprehensive documentation","On-site & remote support"].map(p=>(
                <div key={p} className="flex items-center gap-2.5 text-sm text-slate-600 mb-2"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0"/>{p}</div>
              ))}
              <Link href="/services" className="btn-primary flex items-center gap-2 mt-6 w-fit">All Services<ArrowRight className="w-4 h-4"/></Link>
            </div>
            <div className="lg:col-span-3 space-y-4">
              {SERVICES.map(s=>(
                <div key={s.title} className="card p-6 hover:border-primary-300 hover:shadow-card-lg transition-all duration-200 group">
                  <div className="flex gap-4">
                    <div className="text-3xl">{s.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-xl text-slate-900 mb-1">{s.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed mb-3">{s.desc}</p>
                      <div className="flex flex-wrap gap-2">{s.tags.map(t=><span key={t} className="tag">{t}</span>)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="bg-primary-700 py-14">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[11px] font-black text-primary-300 uppercase tracking-[0.2em] mb-6">Industries We Serve</p>
          <div className="flex flex-wrap justify-center gap-3">
            {["Automotive & EV","Steel & Metals","Oil & Gas","Cement & Mining","Pharmaceuticals","Food & Beverage","Water Treatment","Power & Energy","Textiles","Semiconductor"].map(ind=>(
              <span key={ind} className="px-4 py-2 rounded-xl border border-primary-500 text-primary-200 text-sm font-medium hover:bg-primary-600 hover:text-white transition-all cursor-default">{ind}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-50 py-20" id="about">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="eyebrow mb-2">Client Testimonials</p>
            <h2 className="font-display font-bold text-5xl text-slate-900 leading-none">What India's Industries Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t=>(
              <div key={t.name} className="card p-8 flex flex-col hover:shadow-card-lg transition-shadow">
                <div className="flex gap-0.5 mb-4">{[...Array(t.rating)].map((_,i)=><Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400"/>)}</div>
                <div className="w-8 h-1 bg-primary-500 rounded-full mb-4"/>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1 italic">"{t.text}"</p>
                <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-black text-sm">{t.name.split(" ").map(w=>w[0]).join("")}</div>
                  <div><div className="font-bold text-slate-900 text-sm">{t.name}</div><div className="text-xs text-slate-500">{t.title} · {t.company}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-600 py-16" id="contact">
        <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="text-white text-center lg:text-left">
            <p className="text-[11px] font-black text-primary-200 uppercase tracking-[0.2em] mb-3">Start Your Project Today</p>
            <h2 className="font-display font-bold text-5xl text-white leading-none mb-3">Ready to Automate?</h2>
            <p className="text-primary-200 text-lg">Free consultation and quotation within 24 hours from our engineers.</p>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0 justify-center">
            <Link href="/shop" className="bg-white text-primary-700 font-bold px-8 py-3.5 rounded-xl hover:bg-primary-50 transition-colors text-base">Request a Quote</Link>
            <a href="tel:+914012345678" className="border-2 border-white/40 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2">
              <Phone className="w-5 h-5"/>Call Now
            </a>
          </div>
        </div>
      </section>

      <Footer/>
    </div>
  );
}
