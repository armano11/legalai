import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function TrackCaseSection() {
  const [caseId, setCaseId] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    gsap.fromTo(
      sectionRef.current.querySelectorAll('.reveal-item'),
      { y: 60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.12,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          end: 'top 40%',
          toggleActions: 'play none none reverse',
        },
      }
    );
  }, []);

  const handleTrack = () => {
    if (!caseId.trim()) return;
    window.location.href = `/track?id=${encodeURIComponent(caseId.trim())}`;
  };

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#1a1a1a] px-6 py-32 text-[#f5f1e8] md:px-12 lg:px-24"
    >
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(245,241,232,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(245,241,232,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <p className="reveal-item mb-8 font-['Space_Grotesk'] text-xs font-semibold uppercase tracking-[0.22em] text-[#ff6b35]">
          Client Tracking
        </p>

        <h2
          ref={headingRef}
          className="reveal-item mb-6 font-['Playfair_Display'] text-4xl font-semibold leading-[1.05] md:text-6xl"
        >
          Track Your <span className="font-light italic">Case</span>
        </h2>

        <p className="reveal-item mx-auto mb-12 max-w-lg font-['Space_Grotesk'] text-sm leading-relaxed text-[#f5f1e8]/50">
          Enter the reference code shared by your firm to see status, hearings, and recent updates.
        </p>

        <div className="reveal-item mx-auto flex max-w-xl flex-col items-center justify-center gap-4 sm:flex-row">
          <div className={`relative flex-1 w-full transition-all duration-300 ${isFocused ? 'ring-1 ring-[#ff6b35]' : ''}`}>
            <input
              type="text"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
              placeholder="e.g. JA-A7B3F or CASE-1714529381"
              className="w-full border border-[#f5f1e8]/15 bg-[#f5f1e8]/5 px-6 py-4 text-sm tracking-wider text-[#f5f1e8] placeholder:text-[#f5f1e8]/25 focus:outline-none"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#f5f1e8]/30">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>

          <button
            onClick={handleTrack}
            disabled={!caseId.trim()}
            className="group relative shrink-0 overflow-hidden bg-[#ff6b35] px-8 py-4 font-['Space_Grotesk'] text-sm font-semibold uppercase tracking-wider text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-40"
            data-cursor-interactive
          >
            <div className="absolute inset-0 translate-y-full bg-[#f5f1e8] transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-y-0" />
            <span className="relative z-10 flex items-center gap-2">
              Track
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-transform group-hover:translate-x-1">
                <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </span>
          </button>
        </div>

        <div className="reveal-item mt-16 flex flex-wrap justify-center gap-8 font-['Space_Grotesk'] text-[10px] uppercase tracking-[0.18em] text-[#f5f1e8]/25">
          <span className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#ff6b35]" />
            Client-safe updates
          </span>
          <span className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#ff6b35]" />
            No login needed
          </span>
          <span className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#ff6b35]" />
            Shared by your firm
          </span>
        </div>
      </div>
    </section>
  );
}
