import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run on non-touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const cursor = cursorRef.current;
    const follower = followerRef.current;
    
    if (!cursor || !follower) return;

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let followerX = 0;
    let followerY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener('mousemove', onMouseMove);

    const render = () => {
      // Fast cursor
      cursorX += (mouseX - cursorX) * 0.5;
      cursorY += (mouseY - cursorY) * 0.5;
      
      // Smooth follower
      followerX += (mouseX - followerX) * 0.15;
      followerY += (mouseY - followerY) * 0.15;

      gsap.set(cursor, { x: cursorX, y: cursorY });
      gsap.set(follower, { x: followerX, y: followerY });

      requestAnimationFrame(render);
    };
    
    requestAnimationFrame(render);

    // Hover effects
    const interactiveElements = document.querySelectorAll('a, button, input, [data-cursor-interactive]');
    
    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        gsap.to(follower, { scale: 2.5, backgroundColor: '#ff6b35', opacity: 0.8, duration: 0.3 });
        gsap.to(cursor, { scale: 0, duration: 0.2 });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(follower, { scale: 1, backgroundColor: 'transparent', opacity: 1, duration: 0.3 });
        gsap.to(cursor, { scale: 1, duration: 0.2 });
      });
    });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <>
      <div 
        ref={cursorRef} 
        className="fixed top-0 left-0 w-2 h-2 bg-[#ff6b35] rounded-full pointer-events-none z-[9999] mix-blend-difference hidden md:block" 
        style={{ transform: 'translate(-50%, -50%)' }}
      />
      <div 
        ref={followerRef} 
        className="fixed top-0 left-0 w-8 h-8 border border-[#1a1a1a] rounded-full pointer-events-none z-[9998] hidden md:block transition-colors duration-200" 
        style={{ transform: 'translate(-50%, -50%)' }}
      />
    </>
  );
}
