import React from 'react';

const TESTIMONIALS = [
  {
    name: 'Sarah Jenkins',
    role: 'Chief Operating Officer',
    quote: 'An architecture of pure logic. It removed our administrative bottlenecks entirely.',
    img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400'
  },
  {
    name: 'Marcus Vance',
    role: 'Operations Director',
    quote: 'The semantic discovery engine surfaced precedents we would have otherwise missed.',
    img: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=400'
  },
  {
    name: 'Elena Rostova',
    role: 'VP of Compliance',
    quote: 'JurisAI is uncompromising on security without sacrificing the UX. A rare triumph.',
    img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400'
  },
  {
    name: 'David Chen',
    role: 'Managing Partner',
    quote: 'We replaced five systems with one platform. The ROI was evident within two weeks.',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400'
  }
];

export function TestimonialCarousel() {
  return (
    <section className="py-32 bg-[#1a1a1a] text-[#f5f1e8] relative flex flex-col">
      <div className="container mx-auto px-6 text-center mb-16">
        <h2 className="font-['Playfair_Display'] text-5xl md:text-6xl font-semibold italic mb-4">
          Industry Consensus
        </h2>
        <p className="font-['Space_Grotesk'] text-sm uppercase tracking-widest text-[#ff6b35]">
          Swipe to explore &bull; Trusted by top firms
        </p>
      </div>

      <div className="w-full relative">
        <div 
          className="flex overflow-x-auto snap-x snap-mandatory gap-8 px-[5vw] pb-12 w-full"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Injecting a style to hide webkit scrollbar specifically for this container */}
          <style dangerouslySetInnerHTML={{__html: `
            .snap-x::-webkit-scrollbar { display: none; }
          `}} />

          {TESTIMONIALS.map((t, i) => (
            <div 
              key={i}
              className="snap-center shrink-0 w-[85vw] md:w-[450px] bg-[#f5f1e8] text-[#1a1a1a] p-8 md:p-10 border-l-4 border-[#ff6b35] flex flex-col justify-between"
            >
              {/* Custom SVG Quote */}
              <svg width="40" height="40" viewBox="0 0 100 100" fill="none" className="text-[#ff6b35] mb-6 shrink-0">
                <path d="M0 50 Q0 0 50 0 V20 Q20 20 20 50 H50 V100 H0 Z" fill="currentColor" />
                <path d="M50 50 Q50 0 100 0 V20 Q70 20 70 50 H100 V100 H50 Z" fill="currentColor" />
              </svg>
              
              <p className="font-['Space_Grotesk'] text-xl md:text-2xl font-medium leading-[1.4] mb-10">
                {t.quote}
              </p>
              
              <div className="flex items-center gap-4 border-t border-[#1a1a1a]/10 pt-6 mt-auto">
                <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full object-cover grayscale shrink-0" />
                <div>
                  <div className="font-['Playfair_Display'] font-semibold text-lg leading-tight">{t.name}</div>
                  <div className="font-['Space_Grotesk'] text-xs uppercase tracking-widest text-[#1a1a1a]/50 mt-1">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
