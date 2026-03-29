import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ShieldCheck, Zap, Search, ChevronRight } from 'lucide-react';

export const HeroMockup = () => {
  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden flex items-center justify-center p-6 rounded-2xl">
      {/* Dynamic Background Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,_var(--color-primary)_0%,_transparent_50%)] opacity-20 blur-3xl mix-blend-screen animate-pulse duration-10000" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[100%] h-[100%] bg-[radial-gradient(circle_at_center,_var(--color-secondary)_0%,_transparent_50%)] opacity-10 blur-3xl mix-blend-screen" />

      {/* Main App Window Mockup */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="relative w-full max-w-md bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Window Chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="mx-auto flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-md border border-slate-700/50 w-2/3">
            <Search className="h-3 w-3 text-muted-foreground" />
            <div className="h-2 w-24 bg-slate-600 rounded-full" />
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/20 text-primary rounded-lg border border-primary/20 shrink-0">
               <FileText className="h-6 w-6" />
            </div>
            <div className="space-y-2 w-full">
               <div className="h-3 w-3/4 bg-slate-600 rounded-full" />
               <div className="h-3 w-1/2 bg-slate-700 rounded-full" />
            </div>
          </div>

          <div className="space-y-3 mt-6">
             {[1, 2, 3].map((i) => (
               <motion.div 
                 key={i}
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: 0.5 + (i * 0.2) }}
                 className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 border border-slate-600/30 backdrop-blur-sm"
               >
                 <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded bg-slate-800/80 ${i === 1 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                      {i === 1 ? <ShieldCheck className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                    </div>
                    <div className="h-2 w-20 bg-slate-500 rounded-full" />
                 </div>
                 <ChevronRight className="h-4 w-4 text-slate-500" />
               </motion.div>
             ))}
          </div>

          <motion.div 
             initial={{ scaleY: 0 }}
             animate={{ scaleY: 1 }}
             transition={{ delay: 1.2, duration: 0.5 }}
             className="relative h-24 w-full bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-lg mt-4 overflow-hidden"
          >
             <div className="absolute inset-0 bg-primary/5 [mask-image:linear-gradient(to_bottom,transparent,black)]" />
             <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary/50 shadow-[0_0_10px_var(--color-primary)]" />
             <motion.div 
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-primary/20 to-transparent skew-x-12"
             />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
