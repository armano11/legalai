import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  ShieldCheck, 
  Search, 
  FileText, 
  Users, 
  Workflow, 
  Zap 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Bank-Grade Security',
    description: 'SOC2 Type II certified with end-to-end encryption. Your sensitive case data never leaves our secure perimeter.'
  },
  {
    icon: Search,
    title: 'AI-Powered Discovery',
    description: 'Instantly surface relevant precedents, clauses, and evidence across thousands of documents using semantic search.'
  },
  {
    icon: Workflow,
    title: 'Dynamic Workflows',
    description: 'Automate repetitive routing and approvals. Build custom pipelines that adapt to your exact compliance requirements.'
  },
  {
    icon: FileText,
    title: 'Automated Briefs',
    description: 'Generate comprehensive case summaries and legal briefs in seconds based on your accumulated case facts.'
  },
  {
    icon: Users,
    title: 'Granular Permissions',
    description: 'Control access at the field level. Ensure ethical walls are maintained with robust Role-Based Access Control.'
  },
  {
    icon: Zap,
    title: 'Real-time Analytics',
    description: 'Monitor resolution times, team bandwidth, and bottleneck metrics with live-updating dashboards.'
  }
];

export function FeaturesBento() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="platform" className="py-24 bg-[#0B1120] relative" ref={ref}>
      <div className="container mx-auto px-6 max-w-7xl">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white mb-4">
            Everything you need to <br className="hidden md:block" />
            resolve cases faster.
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            A comprehensive suite of tools designed to replace your fragmented workflow. Built for scale, secured for enterprise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, idx) => (
            <BentoCard 
              key={idx} 
              feature={feature} 
              index={idx} 
              inView={isInView} 
            />
          ))}
        </div>
        
      </div>
    </section>
  );
}

function BentoCard({ feature, index, inView }: { feature: any, index: number, inView: boolean }) {
  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.2, 0.8, 0.2, 1] }}
      className="group relative p-8 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 overflow-hidden"
    >
      {/* Background Hover Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-colors">
          <Icon className="w-6 h-6 text-slate-400 group-hover:text-indigo-400 transition-colors" />
        </div>
        
        <h3 className="text-xl font-medium text-slate-100 mb-3 tracking-tight">
          {feature.title}
        </h3>
        <p className="text-slate-400 leading-relaxed text-sm">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
}
