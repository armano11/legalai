import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export function ProblemStatement() {
  const sectionRef = useRef<HTMLElement>(null);
  const quoteRef = useRef<HTMLHeadingElement>(null);
  const filterRef = useRef<SVGFEColorMatrixElement>(null);

  useEffect(() => {
    if (!quoteRef.current) return;

    const originalText = quoteRef.current.innerText;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';

    // Scramble effect
    gsap.to(quoteRef.current, {
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 75%',
        end: 'top 25%',
        scrub: 1,
        onUpdate: (self) => {
          if (!quoteRef.current) return;
          const progress = self.progress;
          const revealCount = Math.floor(progress * originalText.length);
          
          let newText = '';
          for (let i = 0; i < originalText.length; i++) {
            if (originalText[i] === ' ' || originalText[i] === '\n') {
              newText += originalText[i];
              continue;
            }
            if (i < revealCount) {
              newText += originalText[i];
            } else {
              newText += chars[Math.floor(Math.random() * chars.length)];
            }
          }
          quoteRef.current.innerText = newText;
        }
      }
    });

    // Mesh Gradient Animation via SVG filter hue rotation
    gsap.to(filterRef.current, {
      attr: { values: '360' },
      duration: 20,
      repeat: -1,
      ease: 'none'
    });

  }, []);

  return (
    <section ref={sectionRef} className="relative py-40 bg-[#1a1a1a] overflow-hidden">
      
      {/* Abstract Mesh Background */}
      <div className="absolute inset-0 opacity-40 pointer-events-none mix-blend-screen">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <filter id="noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" result="noise" />
              <feColorMatrix type="hueRotate" values="0" ref={filterRef} />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.5" />
              </feComponentTransfer>
              <feBlend mode="screen" in="SourceGraphic" in2="noise" />
            </filter>
            <radialGradient id="grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff6b35" />
              <stop offset="100%" stopColor="#1a1a1a" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#grad)" filter="url(#noise)" />
        </svg>
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10 max-w-5xl">
        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-2">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-[#ff6b35]">
              <path d="M0 0 H15 V40 H0 Z M25 0 H40 V40 H25 Z" fill="currentColor" />
            </svg>
          </div>
          <div className="md:col-span-10">
            <h2 
              ref={quoteRef}
              className="font-['Space_Grotesk'] text-3xl md:text-5xl lg:text-6xl text-[#f5f1e8] font-medium leading-[1.3] tracking-tight uppercase"
            >
              The era of fragmented case management is over. We engineered a singular truth for your law firm's most critical matters.
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}
