import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { buttonTap } from "@/lib/design-tokens";

interface GlowButtonProps {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
  onClick?: (e?: any) => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

const GlowButton = ({ variant = "primary", size = "md", className, children, onClick, disabled, type = "button" }: GlowButtonProps) => {
  const base =
    "inline-flex items-center justify-center font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

  const variants = {
    primary: "bg-primary text-primary-foreground hover:brightness-110",
    outline: "border border-border bg-transparent text-foreground hover:bg-muted/50",
    ghost: "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
    md: "h-10 px-5 text-sm rounded-lg gap-2",
    lg: "h-12 px-8 text-sm rounded-xl gap-2.5",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={buttonTap}
      className={cn(base, variants[variant], sizes[size], className)}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </motion.button>
  );
};

export { GlowButton };
