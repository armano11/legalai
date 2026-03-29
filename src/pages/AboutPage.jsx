import React from 'react';
import { Scale } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-4xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Scale className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary mb-6">
          About JurisAI
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          We are on a mission to democratize legal intelligence and empower modern legal professionals with cutting-edge AI.
        </p>
      </motion.div>

      <div className="space-y-12 text-slate-700 text-lg leading-relaxed">
        <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-heading border-b border-slate-200 pb-2">Our Vision</h2>
          <p>
            JurisAI was founded by a team of legal experts and AI researchers who recognized the massive inefficiencies in traditional legal research and document analysis. We believe that by automating routine, time-consuming tasks, lawyers can focus on what truly matters: strategy, counseling, and high-level legal reasoning.
          </p>
        </motion.section>

        <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-heading border-b border-slate-200 pb-2">Security & Privacy First</h2>
          <p>
            In the legal profession, confidentiality is paramount. JurisAI is built on an enterprise-grade secure infrastructure. We do not use your proprietary uploaded contracts or case data to train our foundational models. All documents are encrypted both in transit and at rest.
          </p>
        </motion.section>

        <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
           <h2 className="text-2xl font-bold text-slate-900 mb-4 font-heading border-b border-slate-200 pb-2">Our Technology</h2>
           <p>
             Our platform uses highly specialized, domain-specific Large Language Models (LLMs) trained exclusively on verified legal datasets, case law, statutes, and regulatory frameworks. This ensures high accuracy and reduces the risk of hallucinations common in generic AI models.
           </p>
        </motion.section>
      </div>
    </div>
  );
}
