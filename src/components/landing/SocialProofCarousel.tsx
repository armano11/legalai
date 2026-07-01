import React, { useRef, useState, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote: "We've reduced our compliance review cycle by 40%. The AI-powered discovery is nothing short of magic for our audit teams.",
    author: "Elena Rostova",
    role: "VP of Compliance",
    company: "Stark Industries"
  },
  {
    quote: "LegalForge replaced three different legacy systems for us. The role-based permissions ensure our ethical walls are never compromised.",
    author: "David Chen",
    role: "Managing Partner",
    company: "Chen & Associates"
  },
  {
    quote: "The automated briefs save our paralegals over 15 hours a week. It's the highest ROI tool we've deployed this year.",
    author: "Marcus Vance",
    role: "Operations Director",
    company: "Vanguard Legal"
  },
  {
    quote: "Finally, a case management tool that doesn't look like it was built in 1995. Our team actually enjoys logging in every morning.",
    author: "Sarah Jenkins",
    role: "Chief Operating Officer",
    company: "Nexus Health"
  }
];

export function SocialProofCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.scrollWidth - containerRef.current.offsetWidth);
    }
  }, []);

  return (
    <section className="py-24 bg-[#0B1120] overflow-hidden border-y border-white/5">
      <div className="container mx-auto px-6 max-w-7xl mb-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between">
        <h2 className="text-3xl font-semibold text-white tracking-tight">
          Trusted by industry leaders.
        </h2>
        <div className="text-slate-400 text-sm mt-4 md:mt-0 flex items-center gap-2">
          <span>&larr;</span> Drag to explore <span>&rarr;</span>
        </div>
      </div>

      <motion.div ref={containerRef} className="cursor-grab active:cursor-grabbing px-6">
        <motion.div 
          drag="x"
          dragControls={dragControls}
          dragConstraints={{ right: 0, left: -width }}
          className="flex gap-6 w-max"
        >
          {TESTIMONIALS.map((t, i) => (
            <motion.div 
              key={i}
              className="w-[350px] md:w-[450px] p-8 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm flex flex-col justify-between"
              whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.04)' }}
            >
              <div>
                <Quote className="w-8 h-8 text-indigo-500/50 mb-6" />
                <p className="text-slate-200 text-lg leading-relaxed mb-8">
                  "{t.quote}"
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-lg">
                  {t.author[0]}
                </div>
                <div>
                  <div className="text-slate-100 font-medium">{t.author}</div>
                  <div className="text-slate-400 text-sm">{t.role}, {t.company}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
