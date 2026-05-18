import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { FileSearch, UserCheck, Activity, CheckCircle } from 'lucide-react';

const STEPS = [
  { id: 'intake', title: 'Intake', icon: FileSearch, desc: 'Securely ingest documents and case facts.' },
  { id: 'assign', title: 'Assign', icon: UserCheck, desc: 'Auto-route to the optimal team member.' },
  { id: 'track',  title: 'Track',  icon: Activity, desc: 'Monitor progress and SLA deadlines.' },
  { id: 'resolve',title: 'Resolve',icon: CheckCircle, desc: 'Generate reports and close the loop.' },
];

export function WorkflowPipeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <section id="solutions" ref={containerRef} className="py-32 bg-[#0B1120] relative">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="mb-20 text-center">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white mb-4">
            A pipeline built for precision.
          </h2>
          <p className="text-slate-400 text-lg">
            Standardize your resolution process from end to end.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto h-[400px] flex items-center">
          
          {/* Background Line */}
          <div className="absolute left-0 right-0 h-1 bg-white/5 rounded-full top-1/2 -translate-y-1/2" />
          
          {/* Animated Progress Line */}
          <motion.div 
            className="absolute left-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full top-1/2 -translate-y-1/2 origin-left"
            style={{ scaleX: smoothProgress }}
          />

          {/* Steps */}
          <div className="absolute w-full flex justify-between top-1/2 -translate-y-1/2">
            {STEPS.map((step, idx) => {
              // Calculate at what scroll progress this step becomes "active"
              const threshold = idx / (STEPS.length - 1);
              const isActive = useTransform(smoothProgress, (p) => p >= threshold - 0.05);

              return (
                <div key={step.id} className="relative flex flex-col items-center">
                  
                  {/* Tooltip Card (Top) */}
                  <motion.div 
                    className="absolute bottom-full mb-6 w-48 p-4 bg-slate-900 border border-white/10 rounded-xl shadow-xl shadow-black/50 text-center"
                    initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: idx * 0.2 }}
                  >
                    <h4 className="text-slate-100 font-medium mb-1">{step.title}</h4>
                    <p className="text-xs text-slate-400">{step.desc}</p>
                  </motion.div>

                  {/* Node */}
                  <motion.div 
                    className="w-12 h-12 rounded-full border-4 border-[#0B1120] flex items-center justify-center relative z-10 transition-colors duration-300"
                    style={{
                      backgroundColor: isActive.get() ? '#3b82f6' : '#1e293b', // Blue vs slate
                    }}
                  >
                    <step.icon className="w-5 h-5 text-white" />
                  </motion.div>

                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
