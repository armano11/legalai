import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { cardHover } from "@/lib/design-tokens";

interface GlassCardProps {
  children: React.ReactNode;
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

const GlassCard = ({ children, hover = true, className, onClick }: GlassCardProps) => {
  if (!hover) {
    return (
      <div className={cn("rounded-xl border border-border bg-card/80 backdrop-blur-sm shadow-sm transition-colors", className)} onClick={onClick}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      whileHover={cardHover}
      className={cn("rounded-xl border border-border bg-card/80 backdrop-blur-sm shadow-sm transition-colors", className)}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

export { GlassCard };
