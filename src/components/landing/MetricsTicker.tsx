import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const METRICS = [
  { label: 'Cases Routed', value: 12400, suffix: '+' },
  { label: 'Audit Compliance', value: 99.9, suffix: '%' },
  { label: 'Avg Resolution', value: 2, prefix: '<', suffix: 's' },
];

function CountUp({ to, decimals = 0 }: { to: number; decimals?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000; // ms
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(to * ease);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(to);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isInView, to]);

  return <span ref={ref}>{count.toFixed(decimals)}</span>;
}

export function MetricsTicker() {
  const [isClient, setIsClient] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null; // Avoid SSR mismatch

  return (
    <div className="w-full border-y border-white/5 bg-slate-900/30 backdrop-blur-sm py-8 overflow-hidden">
      <div 
        className="container mx-auto px-6"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex flex-col md:flex-row items-center justify-around gap-8 md:gap-4">
          {METRICS.map((metric, idx) => (
            <div key={idx} className="flex flex-col items-center text-center">
              <div className="text-4xl md:text-5xl font-mono font-semibold text-white tracking-tight mb-2">
                {metric.prefix && <span className="text-slate-400 mr-1">{metric.prefix}</span>}
                <CountUp to={metric.value} decimals={metric.value % 1 !== 0 ? 1 : 0} />
                <span className="text-indigo-400 ml-1">{metric.suffix}</span>
              </div>
              <div className="text-sm font-medium text-slate-400 uppercase tracking-widest">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
