import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import SplitType from 'split-type';

export function Preloader({ onComplete }: { onComplete: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate asset loading
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
      }
      setProgress(Math.floor(currentProgress));
    }, 150);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const tl = gsap.timeline({
        onComplete: onComplete
      });

      if (textRef.current) {
        const split = new SplitType(textRef.current, { types: 'chars' });
        tl.to(split.chars, {
          y: -100,
          opacity: 0,
          stagger: 0.02,
          duration: 0.8,
          ease: 'power4.inOut'
        });
      }

      tl.to(containerRef.current, {
        height: 0,
        duration: 1,
        ease: 'expo.inOut'
      }, '-=0.4');
    }
  }, [progress, onComplete]);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-[10000] bg-[#1a1a1a] flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="relative w-full max-w-sm px-6">
        <div ref={textRef} className="font-['Playfair_Display'] text-4xl md:text-6xl text-[#f5f1e8] italic font-semibold text-center mb-8 overflow-hidden">
          LegalForge
        </div>
        
        <div className="w-full h-[1px] bg-[#333] relative">
          <div 
            ref={progressRef}
            className="absolute top-0 left-0 h-full bg-[#ff6b35] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="mt-4 text-[#f5f1e8] font-['Space_Grotesk'] text-xs font-medium tracking-widest text-right flex justify-between">
          <span>SYSTEM LOAD</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
}
