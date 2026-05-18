import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Web3HeroAnimated } from './animated-web3-landing-page';
import { CTASection } from './hero-dithering-card';

const JURIS_BG = '#050505';

export default function LawTechScroll() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [images, setImages] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [totalFrames, setTotalFrames] = useState(100);

  // Fetch frame list and preload images
  useEffect(() => {
    let hasError = false;
    
    fetch('/sequence/frames.json')
      .then(res => {
        if (!res.ok) throw new Error("frames.json not found");
        return res.json();
      })
      .then(fileNames => {
        const count = fileNames.length;
        if (count === 0) throw new Error("No frames found in json");
        setTotalFrames(count - 1);
        
        let loadedCount = 0;
        const imgArray = [];

        for (let i = 0; i < count; i++) {
            const img = new Image();
            img.src = `/sequence/frames/${fileNames[i]}`;
            img.onload = () => {
                if (hasError) return;
                loadedCount++;
                setLoadingProgress(Math.floor((loadedCount / count) * 100));
                if (loadedCount === count) {
                    setImages(imgArray);
                    setLoaded(true);
                }
            };
            img.onerror = () => {
                hasError = true;
                setLoadError(true);
                setLoaded(true);
            };
            imgArray.push(img);
        }
      })
      .catch(err => {
         console.warn(`law&tech: Failed to fetch sequence manifest. Activating procedural fallback.`, err);
         setLoadError(true);
         setLoaded(true);
      });
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 25,
    restDelta: 0.001
  });

  const renderFrame = useCallback((index) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match display size exactly
    const { width, height } = canvas.getBoundingClientRect();
    if (width === 0 || height === 0) return; // Prevent 0 size 
    
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = JURIS_BG;
    ctx.fillRect(0, 0, width, height);

    if (!loadError && images.length > index) {
        const img = images[index];
        const hRatio = width / img.width;
        const vRatio = height / img.height;
        const ratio = Math.max(hRatio, vRatio); // object-cover fixes blank edges
        const centerShift_x = (width - img.width * ratio) / 2;
        const centerShift_y = (height - img.height * ratio) / 2;
        ctx.drawImage(img, 0, 0, img.width, img.height,
                      centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
        return;
    }

    // Procedural Fallback if images missing
    const progress = index / Math.max(1, totalFrames);
    const cx = width / 2;
    const cy = height / 2;
    const pIngest = Math.min(1, Math.max(0, (progress - 0.1) * 3));
    const pAI = Math.min(1, Math.max(0, (progress - 0.4) * 3));
    const pOut = Math.min(1, Math.max(0, (progress - 0.7) * 4));

    const baseGlow = 1 - (pIngest * 0.5);
    if (baseGlow > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.02 * baseGlow})`;
        ctx.shadowBlur = 100 * baseGlow;
        ctx.shadowColor = 'rgba(255,255,255,0.1)';
        ctx.fillRect(cx - 300, cy - 200, 600, 400);
    }
    ctx.shadowBlur = 0;

    if (pIngest > 0) {
        ctx.beginPath();
        const startX = cx - (pIngest * 350);
        const startY = cy - (pIngest * 180);
        ctx.moveTo(startX, startY);
        ctx.lineTo(cx, cy);
        ctx.strokeStyle = `rgba(212, 175, 55, ${pIngest * 0.4 * (1-pOut)})`;
        ctx.lineWidth = 1 + pIngest * 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    if (pOut > 0) {
       ctx.beginPath();
       const startX = cx + (pAI * 250);
       const startY = cy + (pAI * 180);
       ctx.moveTo(startX, startY);
       ctx.lineTo(cx, cy);
       ctx.strokeStyle = `rgba(0, 240, 255, ${pOut * 0.4})`;
       ctx.lineWidth = 1 + pOut * 2;
       ctx.stroke();
    }

    ctx.save();
    const dX = cx - (pIngest * 350) - 100;
    const dY = cy - (pIngest * 180) - 150;
    ctx.translate(dX, dY);
    ctx.fillStyle = `rgba(212, 175, 55, ${0.05 + pIngest * 0.05})`;
    ctx.globalAlpha = 1 - (pOut * 0.8);
    ctx.strokeStyle = `rgba(212, 175, 55, ${0.2 + pIngest * 0.6})`;
    ctx.shadowBlur = 30 * pIngest;
    ctx.shadowColor = 'rgba(212, 175, 55, 0.4)';
    ctx.beginPath();
    ctx.roundRect(-80, -100, 160, 200, 12);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + pIngest * 0.3})`;
    for(let i=0; i<5; i++) {
        ctx.fillRect(-50, -60 + i*25, 100 - (i%2===0?20:0) - (i===4?50:0), 6);
    }
    ctx.restore();

    ctx.save();
    ctx.translate(cx, cy);
    const pulseRadius = 100 + Math.sin(Date.now() / 200) * 8 * pAI;
    ctx.shadowBlur = 80 * pAI;
    ctx.shadowColor = '#00F0FF';
    ctx.fillStyle = `rgba(0, 240, 255, ${0.05 + pAI * 0.15})`;
    ctx.translate(-(pOut * 200), 0);
    ctx.beginPath();
    ctx.arc(0, 0, pulseRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = `rgba(0, 240, 255, ${0.3 + pAI * 0.5})`;
    ctx.shadowBlur = 20 * pAI;
    ctx.stroke();
    ctx.shadowBlur = 0;
    if (pAI > 0) {
      for (let i=0; i<6; i++) {
        const angle = (Math.PI*2/6) * i + (Date.now()/5000 * pAI);
        const r = 50 * pAI;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(Math.cos(angle)*r, Math.sin(angle)*r, 4, 0, Math.PI*2);
        ctx.fill();
      }
    }
    ctx.restore();

    ctx.save();
    const aX = cx + (pAI * 250);
    const aY = cy + (pAI * 180);
    ctx.translate(aX, aY);
    ctx.globalAlpha = pOut;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.02 + pOut * 0.05})`;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + pOut * 0.2})`;
    ctx.beginPath();
    ctx.roundRect(-150, -100, 300, 200, 16);
    ctx.fill();
    ctx.stroke();
    if (pOut > 0.1) {
        ctx.fillStyle = `rgba(0, 240, 255, ${pOut * 0.6})`;
        ctx.fillRect(-100, 50, 40, -80 * pOut);
        ctx.fillStyle = `rgba(212, 175, 55, ${pOut * 0.6})`;
        ctx.fillRect(-30, 50, 40, -130 * pOut);
        ctx.fillStyle = `rgba(255, 255, 255, ${pOut * 0.6})`;
        ctx.fillRect(40, 50, 40, -60 * pOut);
    }
    ctx.restore();
  }, [images, loadError, totalFrames]);

  useMotionValueEvent(smoothProgress, "change", (latest) => {
    if (loaded) {
      const frameIndex = Math.min(
        totalFrames,
        Math.max(0, Math.floor(latest * totalFrames))
      );
      requestAnimationFrame(() => renderFrame(frameIndex));
    }
  });

  useEffect(() => {
    if (loaded) {
      renderFrame(0);
    }
  }, [loaded, renderFrame]);

  useEffect(() => {
    const handleResize = () => {
      if (loaded) {
        const frameIndex = Math.min(totalFrames, Math.max(0, Math.floor(scrollYProgress.get() * totalFrames)));
        requestAnimationFrame(() => renderFrame(frameIndex));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [loaded, totalFrames, scrollYProgress, renderFrame]);

  // --- Animation Overlays (5 Stages) ---
  
  // 0% -> Hero
  const unifyOpacity = useTransform(smoothProgress, [0, 0.1, 0.15], [1, 1, 0]);
  const unifyY = useTransform(smoothProgress, [0, 0.15], [0, -60]);

  // 25% -> Card 1: Deep Contract Analysis
  const card1Opacity = useTransform(smoothProgress, [0.15, 0.25, 0.35, 0.4], [0, 1, 1, 0]);
  const card1Y = useTransform(smoothProgress, [0.15, 0.25, 0.4], [60, 0, -60]);

  // 50% -> Card 2: Precedent Network
  const card2Opacity = useTransform(smoothProgress, [0.4, 0.5, 0.6, 0.65], [0, 1, 1, 0]);
  const card2Y = useTransform(smoothProgress, [0.4, 0.5, 0.65], [60, 0, -60]);

  // 75% -> Card 3: Enterprise Vault
  const card3Opacity = useTransform(smoothProgress, [0.65, 0.75, 0.85, 0.9], [0, 1, 1, 0]);
  const card3Y = useTransform(smoothProgress, [0.65, 0.75, 0.9], [60, 0, -60]);

  // 95% -> Final CTA
  const ctaOpacity = useTransform(smoothProgress, [0.85, 0.95, 1], [0, 1, 1]);
  const ctaY = useTransform(smoothProgress, [0.85, 0.95], [60, 0]);

  return (
    <div ref={containerRef} className="relative w-full h-[500vh]">
      
      {/* Loading Overlay */}
      {!loaded && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#050505] z-50">
           <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 relative">
               <div className="absolute inset-0 border-2 border-border rounded-full" />
               <div className="absolute inset-0 border-2 border-transparent border-t-white border-l-white rounded-full animate-spin" />
            </div>
            <div className="text-foreground/80 tracking-widest text-[12px] uppercase font-bold text-center">
              Preloading Sequence...<br/>
              <span className="text-foreground/40">{loadingProgress}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Parent for Canvas and Overlays */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        
        {/* Canvas Background */}
        <div className="absolute inset-0 w-full h-full -z-10 bg-[#050505]" style={{ display: loaded ? 'block' : 'none' }}>
          <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        </div>

        {/* Overlay Containers */}
        <div className="absolute inset-0 z-10 pointer-events-none font-[Inter]">
          
          {/* 0% Overlay - Hero */}
          <motion.div style={{ opacity: unifyOpacity, y: unifyY }} className="absolute inset-0 z-20 pointer-events-auto">
            <Web3HeroAnimated />
          </motion.div>

          {/* 25% Overlay - Card 1 */}
          <motion.div style={{ opacity: card1Opacity, y: card1Y }} className="absolute inset-0 flex items-center justify-start px-[5%] md:px-[10%]">
            <div className="max-w-xl bg-[#0a0a0add] p-12 backdrop-blur-3xl border border-border shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#EC4E02] to-transparent opacity-80" />
              <h2 className="text-4xl md:text-5xl text-foreground mb-6 font-serif leading-tight">Digital Contract <br/><span className="text-[#EC4E02]">Engineering</span></h2>
              <p className="text-lg text-neutral-300 font-light leading-relaxed">
                Transform static documents into executable legal logic. **law&tech** enables real-time extraction of anomalies and hidden risks with surgical precision.
              </p>
            </div>
          </motion.div>

          {/* 50% Overlay - Card 2 */}
          <motion.div style={{ opacity: card2Opacity, y: card2Y }} className="absolute inset-0 flex items-center justify-end px-[5%] md:px-[10%]">
            <div className="max-w-xl bg-[#0a0a0add] p-12 backdrop-blur-3xl border border-border shadow-2xl relative overflow-hidden group text-right">
               <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-[#EC4E02] to-transparent opacity-80" />
               <h2 className="text-4xl md:text-5xl text-foreground mb-6 font-serif leading-tight">Scalable Legal <br/><span className="text-[#EC4E02]">Infrastructure</span></h2>
               <p className="text-lg text-neutral-300 font-light leading-relaxed">
                Connect your practice to a global network of computational law. Mapping 10 million+ precedents into actionable engineering data.
              </p>
            </div>
          </motion.div>

          {/* 75% Overlay - Card 3 */}
          <motion.div style={{ opacity: card3Opacity, y: card3Y }} className="absolute inset-0 flex items-center justify-start px-[5%] md:px-[10%]">
            <div className="max-w-xl bg-[#0a0a0add] p-12 backdrop-blur-3xl border border-border shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#EC4E02] to-transparent opacity-80" />
              <h2 className="text-4xl md:text-5xl text-foreground mb-6 font-serif leading-tight">Next-Gen <br/><span className="text-[#EC4E02]">Vault</span></h2>
              <p className="text-lg text-neutral-300 font-light leading-relaxed mb-6">
                Zero-trust legal compute. Perfect secrecy for high-stakes intellectual property and litigation data.
              </p>
              <div className="inline-flex items-center gap-2 text-xs font-mono text-[#EC4E02]/80 uppercase tracking-widest">
                  <div className="w-2 h-2 bg-[#EC4E02] animate-pulse" /> law&tech Secure 
              </div>
            </div>
          </motion.div>

          {/* 95% Overlay - CTA */}
          <motion.div style={{ opacity: ctaOpacity, y: ctaY }} className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto px-[5%]">
             <CTASection />
          </motion.div>

        </div>
      </div>
    </div>
  );
}
