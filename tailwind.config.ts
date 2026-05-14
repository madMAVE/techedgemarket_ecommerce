import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: { 50:"#eff6ff",100:"#dbeafe",200:"#bfdbfe",300:"#93c5fd",400:"#60a5fa",500:"#3b82f6",600:"#2563eb",700:"#1d4ed8",800:"#1e40af",900:"#1e3a8a" },
        gold:    { 400:"#fbbf24",500:"#f59e0b",600:"#d97706" },
        slate:   { 50:"#f8fafc",100:"#f1f5f9",200:"#e2e8f0",300:"#cbd5e1",400:"#94a3b8",500:"#64748b",600:"#475569",700:"#334155",800:"#1e293b",900:"#0f172a" },
      },
      fontFamily: {
        display: ["'Barlow Condensed'","'Arial Narrow'","sans-serif"],
        body:    ["'Outfit'","system-ui","sans-serif"],
        mono:    ["'IBM Plex Mono'","monospace"],
      },
      boxShadow: {
        card:    "0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.06)",
        "card-lg":"0 4px 6px rgba(0,0,0,0.04),0 10px 40px rgba(0,0,0,0.08)",
        "top":   "0 -1px 0 rgba(255,255,255,0.8) inset",
      },
      animation: {
        "fade-in":"fadeIn 0.3s ease","slide-up":"slideUp 0.35s ease-out","pulse-dot":"pulseDot 2s infinite",
      },
      keyframes: {
        fadeIn:   {"0%":{opacity:"0"},"100%":{opacity:"1"}},
        slideUp:  {"0%":{opacity:"0",transform:"translateY(16px)"},"100%":{opacity:"1",transform:"translateY(0)"}},
        pulseDot: {"0%,100%":{opacity:"1",transform:"scale(1)"},"50%":{opacity:"0.4",transform:"scale(0.75)"}},
      },
    },
  },
  plugins: [],
};
export default config;
