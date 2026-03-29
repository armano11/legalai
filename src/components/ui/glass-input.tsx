import React from "react";
import { cn } from "@/lib/utils";

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full h-10 px-3 rounded-lg text-sm",
        "bg-muted/30 border border-input text-foreground placeholder:text-muted-foreground",
        "transition-colors duration-200",
        "focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring",
        className
      )}
      {...props}
    />
  )
);
GlassInput.displayName = "GlassInput";

interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const GlassTextarea = React.forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full px-3 py-2.5 rounded-lg text-sm resize-none",
        "bg-muted/30 border border-input text-foreground placeholder:text-muted-foreground",
        "transition-colors duration-200",
        "focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring",
        className
      )}
      {...props}
    />
  )
);
GlassTextarea.displayName = "GlassTextarea";

export { GlassInput, GlassTextarea };
