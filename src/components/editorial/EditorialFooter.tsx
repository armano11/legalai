import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

export function EditorialFooter() {
  const magneticRef = useRef<HTMLAnchorElement>(null);
  const filterRef = useRef<SVGFEColorMatrixElement>(null);

  useEffect(() => {
    // Magnetic Button Effect
    const magnetic = magneticRef.current;
    if (magnetic && !window.matchMedia('(pointer: coarse)').matches) {
      const onMouseMove = (e: MouseEvent) => {
        const { left, top, width, height } = magnetic.getBoundingClientRect();
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        const distanceX = e.clientX - centerX;
        const distanceY = e.clientY - centerY;
        
        // Magnet radius
        if (Math.abs(distanceX) < width && Math.abs(distanceY) < height) {
          gsap.to(magnetic, {
            x: distanceX * 0.3,
            y: distanceY * 0.3,
            duration: 0.4,
            ease: 'power2.out'
          });
        } else {
          gsap.to(magnetic, {
            x: 0,
            y: 0,
            duration: 0.4,
            ease: 'power2.out'
          });
        }
      };

      const onMouseLeave = () => {
        gsap.to(magnetic, { x: 0, y: 0, duration: 0.4, ease: 'power2.out' });
      };

      window.addEventListener('mousemove', onMouseMove);
      magnetic.addEventListener('mouseleave', onMouseLeave);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        magnetic.removeEventListener('mouseleave', onMouseLeave);
      };
    }
  }, []);

  useEffect(() => {
    // Background noise animation
    gsap.to(filterRef.current, {
      attr: { values: '360' },
      duration: 2,
      repeat: -1,
      ease: 'none'
    });
  }, []);

  return (
    <footer className="bg-[#1a1a1a] text-[#f5f1e8] relative overflow-hidden">
      
      {/* Animated Noise Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <filter id="cta-noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" result="noise" />
              <feColorMatrix type="hueRotate" values="0" ref={filterRef} />
              <feBlend mode="multiply" in="SourceGraphic" in2="noise" />
            </filter>
          </defs>
          <rect width="100" height="100" fill="#ff6b35" filter="url(#cta-noise)" />
        </svg>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 pt-40 pb-20 border-b border-[#f5f1e8]/10 text-center flex flex-col items-center">
        <h2 className="font-['Playfair_Display'] text-[10vw] leading-[0.8] tracking-tighter font-semibold mb-12 text-transparent" style={{ WebkitTextStroke: '1px #f5f1e8' }}>
          Engage.
        </h2>
        
        <a 
          ref={magneticRef}
          href="#demo" 
          className="relative flex items-center justify-center w-40 h-40 rounded-full bg-[#ff6b35] text-[#1a1a1a] font-['Space_Grotesk'] font-medium uppercase tracking-widest text-sm hover:scale-110 transition-transform duration-300"
          data-cursor-interactive
        >
          Begin Trial
        </a>
      </div>

      {/* Footer Links */}
      <div className="relative z-10 container mx-auto px-6 lg:px-12 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8">
          
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-['Playfair_Display'] text-3xl italic mb-6">JurisAI</h3>
            <p className="font-['Space_Grotesk'] text-[#f5f1e8]/60 text-sm max-w-sm leading-relaxed">
              The definitive architecture for complex legal case management. Engineered for modern law firms.
            </p>
          </div>

          <div>
            <h4 className="font-['Space_Grotesk'] text-xs uppercase tracking-widest text-[#ff6b35] mb-6">Platform</h4>
            <ul className="space-y-4 font-['Space_Grotesk']">
              {['Case Management', 'AI Discovery', 'Client Portal', 'Firm Analytics'].map((item) => (
                <li key={item}>
                  <a href="#" className="group relative inline-block overflow-hidden" data-cursor-interactive>
                    <span className="relative z-10">{item}</span>
                    <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#ff6b35] transform -translate-x-[101%] group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-['Space_Grotesk'] text-xs uppercase tracking-widest text-[#ff6b35] mb-6">Company</h4>
            <ul className="space-y-4 font-['Space_Grotesk']">
              {['About Us', 'Security', 'Privacy Policy', 'Contact Support'].map((item) => (
                <li key={item}>
                  <a href="#" className="group relative inline-block overflow-hidden" data-cursor-interactive>
                    <span className="relative z-10">{item}</span>
                    <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#ff6b35] transform -translate-x-[101%] group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <div className="mt-32 pt-8 border-t border-[#f5f1e8]/10 flex flex-col md:flex-row justify-between items-center gap-4 font-['Space_Grotesk'] text-xs text-[#f5f1e8]/40 uppercase tracking-widest">
          <span>&copy; {new Date().getFullYear()} JurisAI. Form Follows Function.</span>
          <div className="flex gap-8">
            <a href="#" className="hover:text-[#f5f1e8] transition-colors" data-cursor-interactive>Privacy</a>
            <a href="#" className="hover:text-[#f5f1e8] transition-colors" data-cursor-interactive>Terms</a>
          </div>
        </div>
      </div>

    </footer>
  );
}
