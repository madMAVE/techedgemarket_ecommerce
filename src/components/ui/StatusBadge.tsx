import { cn } from "@/utils/helpers";
export default function StatusBadge({ label, cls }: { label: string; cls: string }) {
  return <span className={cn(cls)}>{label}</span>;
}
