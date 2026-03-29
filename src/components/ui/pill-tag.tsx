import { cn } from "@/lib/utils";

interface PillTagProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "muted";
  className?: string;
}

const VARIANTS = {
  default: "bg-primary/10 text-primary border-primary/20",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  danger: "bg-red-500/10 text-red-400 border-red-500/20",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  muted: "bg-muted text-muted-foreground border-border",
};

export function PillTag({ children, variant = "default", className }: PillTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider",
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
