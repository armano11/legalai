import React, { useEffect, useState } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomCursor } from './CustomCursor';
import { Preloader } from './Preloader';
import { EditorialHero } from './EditorialHero';
import { ProblemStatement } from './ProblemStatement';
import { FeaturesShowcase } from './FeaturesShowcase';
import { InteractiveDemo } from './InteractiveDemo';
import { TestimonialCarousel } from './TestimonialCarousel';
import { EditorialFooter } from './EditorialFooter';

gsap.registerPlugin(ScrollTrigger);

export default function EditorialLanding() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Inject Fonts & Lenis CSS
    const style = document.createElement('style');
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,800;1,400&family=Space+Grotesk:wght@300;400;500;600&display=swap');
      html.lenis, html.lenis body { height: auto; }
      .lenis.lenis-smooth { scroll-behavior: auto !important; }
      .lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
      .lenis.lenis-stopped { overflow: hidden; }
      .lenis.lenis-scrolling iframe { pointer-events: none; }
    `;
    document.head.appendChild(style);

    // Initialize Smooth Scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      document.head.removeChild(style);
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
    };
  }, []);

  return (
    <div className="bg-[#f5f1e8] text-[#1a1a1a] selection:bg-[#ff6b35] selection:text-[#f5f1e8] font-['Space_Grotesk',sans-serif] min-h-screen">
      <CustomCursor />
      
      {loading ? (
        <Preloader onComplete={() => setLoading(false)} />
      ) : (
        <main>
          <EditorialHero />
          <ProblemStatement />
          <FeaturesShowcase />
          <InteractiveDemo />
          <TestimonialCarousel />
          <EditorialFooter />
        </main>
      )}
    </div>
  );
}
