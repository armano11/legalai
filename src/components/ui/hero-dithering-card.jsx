"use client";

import React, { useState, Suspense, lazy } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Dithering = lazy(() => 
  import("@paper-design/shaders-react").then((mod) => ({ default: mod.Dithering }))
);

export function CTASection() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="py-12 w-full flex justify-center items-center px-4 md:px-6">
      <div 
        className="w-full max-w-7xl relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative overflow-hidden rounded-[48px] border border-border bg-[#0a0a0a] shadow-2xl min-h-[600px] flex flex-col items-center justify-center transition-all duration-500 hover:border-border/50">
          
          <Suspense fallback={<div className="absolute inset-0 bg-primary/5" />}>
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-30 mix-blend-screen">
              <Dithering
                colorBack="#00000000"
                colorFront="#EC4E02"
                shape="warp"
                type="4x4"
                speed={isHovered ? 0.6 : 0.2}
                className="size-full"
                minPixelRatio={1}
              />
            </div>
          </Suspense>

          <div className="relative z-10 px-6 max-w-4xl mx-auto text-center flex flex-col items-center">
            
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#EC4E02]/20 bg-[#EC4E02]/10 px-4 py-1.5 text-sm font-medium text-[#EC4E02] backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EC4E02] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EC4E02]"></span>
              </span>
              Next-Gen Legal Engineering
            </div>

            <h2 className="font-serif text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight text-foreground mb-8 leading-[1.05]">
              Modern law, <br />
              <span className="text-foreground/60">redefined by technology.</span>
            </h2>
            
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
              Join thousands of elite firms using **law&tech** to bridge the gap between complex legal code and high-performance engineering.
            </p>

            <Link to="/register" className="group relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-full bg-primary px-12 text-base font-bold text-primary-foreground transition-all duration-300 hover:scale-105 active:scale-95 hover:ring-4 hover:ring-white/20">
              <span className="relative z-10">Start Your Implementation</span>
              <ArrowRight className="h-5 w-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
