import React from 'react';
import { Scale, Shield, Brain, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function AboutPage() {
  return (
    <div className="w-full" style={{ backgroundColor: '#0a0e1a' }}>
      {/* Header */}
      <div className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-[500px] h-[400px] rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, #00F0FF, transparent 70%)' }} />
        </div>
        <div className="container mx-auto px-6 lg:px-8 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.15)' }}>
              <Scale className="h-7 w-7" style={{ color: '#00F0FF' }} />
            </div>
            <h1 className="text-5xl font-bold text-foreground tracking-tight mb-5">About JurisAI</h1>
            <p className="text-lg text-[#5a6577] max-w-2xl mx-auto leading-relaxed">
              We are on a mission to democratize legal intelligence and empower modern legal professionals with cutting-edge AI.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-8 max-w-4xl pb-24 space-y-16">
        {[
          {
            icon: Brain, title: 'Our Vision',
            text: 'JurisAI was founded by a team of legal experts and AI researchers who recognized the massive inefficiencies in traditional legal research and document analysis. We believe that by automating routine, time-consuming tasks, lawyers can focus on what truly matters: strategy, counseling, and high-level legal reasoning.'
          },
          {
            icon: Lock, title: 'Security & Privacy First',
            text: 'In the legal profession, confidentiality is paramount. JurisAI is built on an enterprise-grade secure infrastructure. We do not use your proprietary uploaded contracts or case data to train our foundational models. All documents are encrypted both in transit and at rest.'
          },
          {
            icon: Shield, title: 'Our Technology',
            text: 'Our platform uses highly specialized, domain-specific Large Language Models (LLMs) trained exclusively on verified legal datasets, case law, statutes, and regulatory frameworks. This ensures high accuracy and reduces the risk of hallucinations common in generic AI models.'
          },
        ].map((section, i) => {
          const Icon = section.icon;
          return (
            <motion.section key={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} transition={{ delay: i * 0.1 }}
              className="p-8 rounded-2xl" style={{ background: 'linear-gradient(145deg, rgba(20,28,50,0.5), rgba(10,14,26,0.7))', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.15)' }}>
                  <Icon className="h-5 w-5" style={{ color: '#00F0FF' }} />
                </div>
                <h2 className="text-xl font-bold text-foreground tracking-tight">{section.title}</h2>
              </div>
              <p className="text-[#6b7a8d] leading-relaxed">{section.text}</p>
            </motion.section>
          );
        })}
      </div>
    </div>
  );
}
