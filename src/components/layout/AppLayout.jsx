import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { motion, AnimatePresence } from 'framer-motion';

export function AppLayout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col relative bg-background text-foreground">
      
      {/* Global Ambient Accents - Very subtle white/5 glows for depth */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-20">
         <div className="absolute top-[-10%] left-[-10%] w-[1000px] h-[1000px] bg-primary opacity-[0.03] blur-[150px] rounded-full" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary opacity-[0.02] blur-[150px] rounded-full" />
      </div>

      <Navbar />
      
      <AnimatePresence mode="wait">
        <motion.main 
          key={location.pathname}
          className="flex-1 relative z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      
      <Footer />
    </div>
  );
}
