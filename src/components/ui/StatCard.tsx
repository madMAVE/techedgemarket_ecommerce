import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/utils/helpers";

interface Props {
  title: string; value: string; change?: number;
  period?: string; icon: React.ReactNode; iconBg?: string;
}
export default function StatCard({ title, value, change, period="vs last month", icon, iconBg="bg-primary-50 text-primary-600" }: Props) {
  const pos = change !== undefined && change >= 0;
  return (
    <div className="stat-card flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
          <p className="font-display font-bold text-3xl text-slate-900 mt-1.5 tracking-wide">{value}</p>
        </div>
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", iconBg)}>{icon}</div>
      </div>
      {change !== undefined && (
        <div className="flex items-center gap-2 text-xs">
          <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full font-bold", pos?"bg-emerald-50 text-emerald-700":"bg-red-50 text-red-700")}>
            {pos?<TrendingUp className="w-3 h-3"/>:<TrendingDown className="w-3 h-3"/>}
            {pos?"+":""}{change}%
          </div>
          <span className="text-slate-400">{period}</span>
        </div>
      )}
    </div>
  );
}
