import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { ArrowRight, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const EASE = [0.2, 0.8, 0.2, 1];

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } }
};

export function Hero() {
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);
  
  // Parallax setup for the right mockup
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    mouseX.set(clientX / innerWidth - 0.5);
    mouseY.set(clientY / innerHeight - 0.5);
  };

  const x1 = useTransform(mouseX, [-0.5, 0.5], [-20, 20]);
  const y1 = useTransform(mouseY, [-0.5, 0.5], [-20, 20]);
  const x2 = useTransform(mouseX, [-0.5, 0.5], [-40, 40]);
  const y2 = useTransform(mouseY, [-0.5, 0.5], [-40, 40]);

  return (
    <section 
      className="relative min-h-[90vh] flex items-center pt-32 pb-20 overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none opacity-50" />
      
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">
          
          {/* Left: Copy */}
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-2xl"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8">
              <Lock className="w-4 h-4" />
              <span>Enterprise-Grade Compliance</span>
            </motion.div>
            
            <motion.h1 
              variants={fadeUp}
              className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-[-0.02em] text-slate-50 mb-6 leading-[1.1]"
            >
              Control the Chaos of <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">Complex Cases.</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeUp}
              className="text-lg md:text-xl text-slate-300 mb-10 leading-[1.6] max-w-xl"
            >
              The definitive case management system for legal, compliance, and enterprise operations. Resolve faster with uncompromising security.
            </motion.p>
            
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4">
              <Link 
                to="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-[0_0_30px_-10px_rgba(99,102,241,0.5)]"
              >
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <a 
                href="#platform"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 text-slate-50 border border-white/10 font-medium hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center"
              >
                Explore Platform
              </a>
            </motion.div>
          </motion.div>

          {/* Right: Interactive Mockup */}
          <div className="relative h-[500px] lg:h-[600px] w-full perspective-1000">
            <motion.div 
              style={{ x: x1, y: y1 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Mockup Header */}
              <div className="h-12 border-b border-white/10 flex items-center px-4 gap-2 bg-slate-800/50">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              
              {/* Mockup Body */}
              <div className="p-6 flex-1 flex flex-col gap-4">
                <div className="h-8 w-1/3 bg-white/5 rounded-lg" />
                
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {['Open', 'Assigned', 'Resolved'].map((status) => (
                    <div 
                      key={status}
                      onMouseEnter={() => setHoveredTag(status)}
                      onMouseLeave={() => setHoveredTag(null)}
                      className="relative h-24 rounded-xl border border-white/5 bg-white/5 p-4 cursor-pointer overflow-hidden transition-colors hover:border-white/20"
                    >
                      <div className="text-sm font-medium text-slate-400 mb-2">{status} Cases</div>
                      <div className="text-2xl font-mono text-slate-100 font-semibold">
                        {status === 'Open' ? '24' : status === 'Assigned' ? '142' : '8,401'}
                      </div>
                      
                      <AnimatePresence>
                        {hoveredTag === status && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute top-4 right-4"
                          >
                            {status === 'Open' ? <AlertCircle className="w-5 h-5 text-amber-400" /> : 
                             status === 'Resolved' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
                             <ArrowRight className="w-5 h-5 text-indigo-400" />}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
                
                <div className="flex-1 mt-4 rounded-xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent relative overflow-hidden">
                  <motion.div 
                    style={{ x: x2, y: y2 }}
                    className="absolute inset-x-4 top-4 bottom-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20"
                  />
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
