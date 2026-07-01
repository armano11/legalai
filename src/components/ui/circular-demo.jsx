import React from "react";
import { CircularTestimonials } from './circular-testimonials';

const testimonials = [
  {
    quote:
      "The precision of the AI legal research has reduced our case preparation time by 80%. It's like having a team of 100 paralegals working in sync.",
    name: "Justice Roberts",
    designation: "Chief Litigator - NJ Supreme Court",
    src: "https://images.unsplash.com/photo-1542327897-d73f4005b533?q=80&w=3387&auto=format&fit=crop",
  },
  {
    quote:
      "Integrating LegalForge into our corporate workflow was the best decision we made this quarter. The compliance matrix is flawless.",
    name: "Aria Gupta",
    designation: "International Arbitration Lead",
    src: "https://images.unsplash.com/photo-1551836022-d5d8b5c7190b?q=80&w=3540&auto=format&fit=crop",
  },
  {
    quote:
      "From complex IP disputes to rapid M&A audits, this platform handles it all with unprecedented reliability and speed.",
    name: "Marcus Thorne",
    designation: "Partner - Global Finance Law",
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=3387&auto=format&fit=crop",
  },
];

export const CircularTestimonialsDemo = () => (
  <section className="space-y-12 py-20 px-4">
    {/* Dark premium testimonials section */}
    <div className="bg-[#0a0a0a] border border-white/5 p-16 rounded-3xl min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
      <div className="text-center mb-12">
        <h2 className="text-3xl font-light text-foreground mb-2">Lead Litigator Roster</h2>
        <p className="text-zinc-500 text-sm italic">Trusted by the highest courts and global corporate entities.</p>
      </div>
      
      <div
        className="items-center justify-center relative flex w-full"
        style={{ maxWidth: "1024px" }}
      >
        <CircularTestimonials
          testimonials={testimonials}
          autoplay={true}
          colors={{
            name: "#f7f7ff",
            designation: "#a1a1aa",
            testimony: "#e4e4e7",
            arrowBackground: "#18181b",
            arrowForeground: "#ffffff",
            arrowHoverBackground: "#0369a1",
          }}
          fontSizes={{
            name: "28px",
            designation: "18px",
            quote: "18px",
          }}
        />
      </div>
    </div>
  </section>
);

export default CircularTestimonialsDemo;
