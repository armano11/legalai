import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import SplitType from 'split-type';

export function EditorialHero() {
  const containerRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const illustrationRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Text Reveal
    if (headingRef.current) {
      const split = new SplitType(headingRef.current, { types: 'words' });
      
      gsap.fromTo(split.words, 
        { y: 100, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          stagger: 0.05, 
          duration: 1.2, 
          ease: 'power4.out',
          delay: 0.2 // Wait for preloader
        }
      );
    }

    // Scroll Indicator Animation
    if (scrollIndicatorRef.current) {
      gsap.to(scrollIndicatorRef.current.querySelector('.line'), {
        height: '100%',
        duration: 1.5,
        repeat: -1,
        ease: 'power2.inOut',
        yoyo: true
      });
    }

    // Parallax on Mouse Move
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const xPos = (clientX / innerWidth - 0.5) * 40;
      const yPos = (clientY / innerHeight - 0.5) * 40;

      if (illustrationRef.current) {
        const layers = illustrationRef.current.querySelectorAll('.layer');
        layers.forEach((layer, i) => {
          const depth = i + 1;
          gsap.to(layer, {
            x: xPos * depth,
            y: yPos * depth,
            rotateX: yPos * 0.5,
            rotateY: -xPos * 0.5,
            duration: 1,
            ease: 'power2.out'
          });
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section 
      ref={containerRef} 
      className="relative min-h-screen pt-32 pb-20 px-6 md:px-12 lg:px-24 flex flex-col justify-center border-b border-[#1a1a1a]/10 overflow-hidden"
    >
      <div className="flex flex-col lg:flex-row items-center justify-between w-full max-w-7xl mx-auto gap-12 lg:gap-8">
        
        {/* Left: 50% Typography */}
        <div className="w-full lg:w-[50%] z-10">
          <p className="font-['Space_Grotesk'] text-[#ff6b35] font-semibold tracking-widest uppercase text-sm mb-8" data-cursor-interactive>
            [ 01 ] Enterprise OS
          </p>
          <h1 
            ref={headingRef}
            className="font-['Playfair_Display'] text-5xl md:text-7xl xl:text-[7rem] leading-[0.9] font-semibold text-[#1a1a1a] mb-12"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 120%, 0 120%)' }}
          >
            Law <br />
            <span className="italic font-light">&amp;</span> <br />
            Tech.
          </h1>
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <a 
              href="#demo"
              className="group relative px-8 py-4 bg-[#1a1a1a] text-[#f5f1e8] font-['Space_Grotesk'] font-medium text-sm tracking-wide overflow-hidden"
              data-cursor-interactive
            >
              <div className="absolute inset-0 bg-[#ff6b35] transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]" />
              <span className="relative z-10 flex items-center gap-2 shrink-0">
                Initiate Protocol
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                  <path d="M1 13L13 1M13 1H4M13 1V10" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </span>
            </a>
            <a 
              href="/track"
              className="group relative px-8 py-4 border border-[#1a1a1a]/20 text-[#1a1a1a] font-['Space_Grotesk'] font-medium text-sm tracking-wide overflow-hidden hover:border-[#ff6b35] transition-colors duration-300"
              data-cursor-interactive
            >
              <span className="relative z-10 flex items-center gap-2 shrink-0">
                Track Your Case
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="transform group-hover:translate-x-1 transition-transform">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
            </a>
          </div>
        </div>

        {/* Right: 50% Interactive Illustration */}
        <div className="w-full lg:w-[50%] h-[50vh] lg:h-[70vh] relative perspective-[1200px]">
          <div 
            ref={illustrationRef} 
            className="absolute inset-0 w-full h-full transform-style-preserve-3d"
          >
            {/* Base Layer */}
            <div className="layer absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20rem] md:w-[26rem] h-[28rem] md:h-[34rem] border border-[#1a1a1a]/20 bg-[#f5f1e8]/50 backdrop-blur-sm" />
            
            {/* Mid Layer - Law Imagery */}
            <div className="layer absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[24rem] md:w-[30rem] h-[28rem] md:h-[34rem] -mt-12 -ml-12 flex items-center justify-center pointer-events-none">
              <img 
                src="/lawyer.png" 
                alt="Lawyer Graphics" 
                className="w-full h-full object-contain drop-shadow-2xl" 
              />
            </div>
            
            {/* Top Layer - UI Element */}
            <div className="layer absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-28 mt-32 ml-32 bg-[#1a1a1a] text-[#f5f1e8] p-5 flex flex-col justify-between shadow-2xl">
              <div className="flex justify-between items-center">
                <span className="font-['Space_Grotesk'] text-xs uppercase tracking-widest text-[#f5f1e8]/50">Status</span>
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff6b35] animate-pulse" />
              </div>
              <div className="font-['Playfair_Display'] text-3xl italic tracking-wide">Routed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div 
        ref={scrollIndicatorRef}
        className="absolute bottom-12 left-6 md:left-12 flex flex-col items-center gap-4"
      >
        <span className="font-['Space_Grotesk'] text-[10px] uppercase tracking-widest text-[#1a1a1a]/40" style={{ writingMode: 'vertical-rl' }}>Scroll</span>
        <div className="w-[1px] h-12 bg-[#1a1a1a]/10 relative overflow-hidden">
          <div className="line absolute top-0 left-0 w-full h-0 bg-[#ff6b35]" />
        </div>
      </div>
    </section>
  );
}
