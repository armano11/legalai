"use client";

import React from "react";
import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GradientTextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, keyof MotionProps> {
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
}

/**
 * A robust, high-end Gradient Text component.
 * Guaranteed to never show a background box.
 */
export function GradientText({
  className,
  children,
  as: Component = "span",
  ...props
}: GradientTextProps) {
  const MotionComponent = motion(Component as any);

  return (
    <MotionComponent
      className={cn(
        "relative inline-block bg-gradient-to-r from-[#8BA1FF] via-[#E2D4F0] to-[#F1A7B1] bg-clip-text text-transparent select-none",
        className
      )}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}
