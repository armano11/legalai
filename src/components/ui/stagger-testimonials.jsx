"use client"

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const SQRT_5000 = Math.sqrt(5000);

const TestimonialCard = ({ 
  position, 
  testimonial, 
  handleMove, 
  cardSize,
  onAssignCase
}) => {
  const isCenter = position === 0;

  return (
    <div
      onClick={() => handleMove(position)}
      className={cn(
        "absolute left-1/2 top-1/2 cursor-pointer border-2 p-8 transition-all duration-500 ease-in-out",
        isCenter 
          ? "z-10 bg-card text-foreground border-border/50" 
          : "z-0 bg-background text-muted-foreground border-white/5 hover:border-border/50"
      )}
      style={{
        width: cardSize,
        height: cardSize,
        clipPath: `polygon(50px 0%, calc(100% - 50px) 0%, 100% 50px, 100% 100%, calc(100% - 50px) 100%, 50px 100%, 0 100%, 0 0)`,
        transform: `
          translate(-50%, -50%) 
          translateX(${(cardSize / 1.5) * position}px)
          translateY(${isCenter ? -65 : position % 2 ? 15 : -15}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
        `,
        boxShadow: isCenter ? "0px 8px 0px 4px rgba(255,255,255,0.05)" : "0px 0px 0px 0px transparent"
      }}
    >
      <span
        className="absolute block origin-top-right rotate-45 bg-primary/10"
        style={{
          right: -2,
          top: 48,
          width: SQRT_5000,
          height: 2
        }}
      />
      <img
        src={testimonial.src}
        alt={testimonial.name}
        className="mb-4 h-14 w-12 bg-zinc-800 object-cover object-top rounded-sm"
        style={{
          boxShadow: "3px 3px 0px #000"
        }}
      />
      <h3 className={cn(
        "text-base sm:text-xl font-medium",
        isCenter ? "text-foreground" : "text-zinc-500"
      )}>
        "{testimonial.quote}"
      </h3>
      
      <div className="absolute bottom-8 left-8 right-8">
        <p className={cn(
            "text-sm italic mb-4",
            isCenter ? "text-muted-foreground" : "text-zinc-600"
        )}>
            - {testimonial.name}, {testimonial.designation}
        </p>
        
        {isCenter && (
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onAssignCase && onAssignCase(testimonial);
                }}
                className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-zinc-200 transition-colors"
            >
                Assign Case
            </button>
        )}
      </div>
    </div>
  );
};

export const StaggerTestimonials = ({ 
    testimonials = [], 
    onAssignCase 
}) => {
  const [cardSize, setCardSize] = useState(365);
  const [testimonialsList, setTestimonialsList] = useState(testimonials);

  // Sync internal list when prop changes
  useEffect(() => {
    if (testimonials.length > 0) {
        setTestimonialsList(testimonials.map((t, i) => ({ ...t, tempId: t.id || i })));
    }
  }, [testimonials]);

  const handleMove = (steps) => {
    if (testimonialsList.length === 0) return;
    const newList = [...testimonialsList];
    if (steps > 0) {
      for (let i = steps; i > 0; i--) {
        const item = newList.shift();
        if (!item) return;
        newList.push({ ...item, tempId: Math.random() });
      }
    } else {
      for (let i = steps; i < 0; i++) {
        const item = newList.pop();
        if (!item) return;
        newList.unshift({ ...item, tempId: Math.random() });
      }
    }
    setTestimonialsList(newList);
  };

  useEffect(() => {
    const updateSize = () => {
      const { matches } = window.matchMedia("(min-width: 640px)");
      setCardSize(matches ? 365 : 290);
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  if (testimonialsList.length === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden bg-transparent"
      style={{ height: 600 }}
    >
      {testimonialsList.map((testimonial, index) => {
        const position = testimonialsList.length % 2
          ? index - (testimonialsList.length + 1) / 2
          : index - testimonialsList.length / 2;
        
        // Ensure index is within middle range for better layout
        // For a large list, we might want to slice it
        if (Math.abs(position) > 3) return null;

        return (
          <TestimonialCard
            key={testimonial.tempId}
            testimonial={testimonial}
            handleMove={handleMove}
            position={position}
            cardSize={cardSize}
            onAssignCase={onAssignCase}
          />
        );
      })}
      
      <div className="absolute bottom-12 left-1/2 flex -translate-x-1/2 gap-4 z-20">
        <button
          onClick={() => handleMove(-1)}
          className={cn(
            "flex h-12 w-12 items-center justify-center text-foreground transition-colors",
            "bg-card border border-border hover:bg-zinc-800",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
          )}
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleMove(1)}
          className={cn(
            "flex h-12 w-12 items-center justify-center text-foreground transition-colors",
            "bg-card border border-border hover:bg-zinc-800",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
          )}
          aria-label="Next testimonial"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
