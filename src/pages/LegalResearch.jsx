import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, Database, Globe, Cpu, FileText, Sparkles, BookOpen, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { useResearch } from '../components/ResearchContext';
import RuixenMoonChat from '../components/ui/ruixen-moon-chat';

const PIPELINE_STAGES = [
  { icon: Database, label: 'Retrieving Statues', sublabel: 'IPC, BNS' },
  { icon: Globe, label: 'Cross-Referencing', sublabel: 'SC Archives' },
  { icon: Cpu, label: 'AI Synthesis', sublabel: 'Logical Reasoning' },
  { icon: CheckCircle, label: 'Finalizing Brief', sublabel: 'Roadmap' },
];

export default function LegalResearch() {
  const { 
    query, setQuery, isSearching, isSynthesizing, hasSearched, 
    results, fullData, error, pipelineStage, handleSearch, viewDeepAnalysis 
  } = useResearch();

  const navigate = useNavigate();
  const { token } = useAuth();

  if (!hasSearched && !isSearching) {
    return (
      <main className="min-h-screen w-full bg-black text-white selection:bg-neutral-800">
        <section className="flex justify-center items-start w-full">
          <RuixenMoonChat 
            query={query}
            setQuery={setQuery}
            onSearch={() => handleSearch(query, token)}
            disabled={isSearching || isSynthesizing}
          />
        </section>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-start pt-32 pb-24 relative font-sans text-zinc-300">
      
      <div className="w-full max-w-4xl mx-auto px-6 relative z-10">
        
        {/* Sticky Small Search Bar when results are showing */}
        <div className="w-full mb-8 sticky top-24 z-50">
          <div className="relative bg-black/60 backdrop-blur-xl rounded-2xl border border-neutral-700/50 shadow-2xl p-2 flex gap-2">
            <input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isSearching && handleSearch(query, token)}
              placeholder="Refine search..."
              className="w-full bg-transparent px-4 text-white outline-none"
            />
            <button 
              disabled={isSearching || isSynthesizing}
              onClick={() => handleSearch(query, token)}
              className="bg-white text-black px-4 py-2 rounded-xl font-medium text-sm disabled:opacity-50"
            >
              Search
            </button>
          </div>
        </div>

        {/* Pipeline Stage Minimal */}
        <AnimatePresence>
          {(isSearching || isSynthesizing) && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="w-full mt-6 bg-card/50 border border-border rounded-xl p-4 flex items-center justify-between"
            >
               <div className="flex items-center gap-3">
                 <div className="w-5 h-5 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
                 <span className="text-sm text-foreground font-medium">Researching laws and precedents...</span>
               </div>
               <span className="text-xs text-zinc-500">{PIPELINE_STAGES[pipelineStage]?.label || 'Synthesizing'}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Stream */}
        <AnimatePresence>
          {hasSearched && !isSearching && results.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="w-full mt-8 space-y-8"
            >
              {/* Answer Box (Perplexity Style) */}
              {fullData?.synthesis && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-foreground">
                    <Sparkles className="w-4 h-4" />
                    <h2 className="text-lg font-medium">Answer</h2>
                  </div>
                  <div className={`text-base leading-relaxed text-zinc-300 font-sans ${isSynthesizing ? 'opacity-70' : 'opacity-100'}`}>
                    {fullData.synthesis}
                  </div>
                  <div className="pt-2">
                    <button onClick={() => viewDeepAnalysis(fullData, query)} className="px-4 py-2 bg-card border border-border rounded-lg text-xs text-zinc-300 font-medium hover:bg-zinc-800 hover:text-foreground transition-all flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" /> View Detailed Output
                    </button>
                  </div>
                </div>
              )}

              {/* Sources */}
              {results.length > 0 && (
                <div className="pt-6 border-t border-border space-y-3">
                  <div className="flex items-center gap-2 text-foreground">
                    <BookOpen className="w-4 h-4" />
                    <h2 className="text-lg font-medium">Sources</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {results.slice(0, 4).map((res, i) => (
                      <div key={i} className="bg-card/50 border border-border rounded-lg p-3 hover:bg-zinc-800 transition-colors cursor-pointer" onClick={() => viewDeepAnalysis(fullData, query)}>
                         <h4 className="text-xs text-foreground font-medium line-clamp-2">{res.case_title}</h4>
                         <p className="text-[10px] text-zinc-500 mt-2 truncate">{res.court} • {res.year}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
