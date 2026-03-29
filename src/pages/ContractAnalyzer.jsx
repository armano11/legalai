import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ShieldCheck, AlertTriangle, Activity, Zap, Target, FileText, Download, CheckCircle2, ChevronRight, FileSearch, ArrowRight, UploadCloud } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { cn } from '../lib/utils';
import { HeroGeometric } from '@/components/ui/shape-landing-hero';
import { GlassCard } from '@/components/ui/glass-card';
import { PillTag } from '@/components/ui/pill-tag';
import WhisperText from '@/components/ui/whisper-text';
import { PointerHighlight } from '@/components/ui/pointer-highlight';
import { AnimatedUnderline } from '@/components/ui/animated-underline';
import { RatingInteraction } from '@/components/ui/emoji-rating';
import { stagger, fadeUp, pageTransition } from '@/lib/design-tokens';

const STAGGER_VARIANTS = stagger;

const ITEM_VARIANTS = fadeUp;



const TABS = ['Executive Summary', 'Vulnerabilities', 'Structural Analysis'];

const NoiseOverlay = () => (
  <div
    className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
  />
);

function FloatingPaths({ position }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="w-full h-full text-cyan-500/30"
        viewBox="0 0 696 316"
        fill="none"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.1 + path.id * 0.03}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.1, 0.4, 0.1],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </div>
  );
}

const UploadZone = ({ onUpload, isAnalyzing, fileName, onAbort }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) onUpload(selectedFile);
  };

  const handleBrowse = () => fileInputRef.current?.click();

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) onUpload(droppedFile);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-4xl mx-auto mt-10 relative group overflow-hidden rounded-[1.5rem] bg-[#0a0a0c]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/40 transition-colors duration-500 shadow-2xl"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSkiLz48L3N2Zz4=')] opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] shadow-[0_0_15px_rgba(6,182,212,0.8)]" />

      <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 border border-dashed border-white/[0.05] group-hover:border-cyan-500/20 rounded-[1rem] m-1.5 transition-colors duration-500">
        <div className="flex items-center gap-5 text-left">
          <div className="relative h-14 w-14 shrink-0 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-center overflow-hidden group-hover:bg-cyan-500/10 transition-colors duration-500">
            <div className="absolute inset-0 bg-cyan-500/20 blur-xl group-hover:animate-pulse" />
            <UploadCloud className="w-6 h-6 text-cyan-400 relative z-10 group-hover:-translate-y-1 transition-transform duration-300" />
            <svg className="absolute bottom-1.5 right-1.5 w-3 h-3 text-cyan-300 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-white mb-1 tracking-tight">Ingest Precedent Corpus</h3>
            <p className="text-xs text-white/40 max-w-sm">Drop raw legal documents or archives for real-time cryptographic NLP extraction.</p>
            {fileName && <p className="mt-2 text-[11px] text-cyan-200/80">Selected: {fileName}</p>}
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={handleBrowse}
            disabled={isAnalyzing}
            className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] text-white/70 text-xs font-medium transition-all duration-300"
          >
            Browse
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.files?.[0] ? onUpload(fileInputRef.current.files[0]) : handleBrowse()}
            disabled={isAnalyzing}
            className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-400 text-xs font-medium transition-colors shadow-[0_0_20px_rgba(6,182,212,0.15)] flex items-center justify-center gap-2"
          >
            <Zap className="w-3.5 h-3.5" /> {isAnalyzing ? 'Analyzing...' : 'Initialize'}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.txt,.pptx,.odt"
        onChange={handleFileChange}
      />
    </motion.div>
  );
};

export default function ContractAnalyzer() {
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');
  const { token } = useAuth();
  const [rating, setRating] = useState(0);
  
  const [scanPos, setScanPos] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('Initializing Analysis Engine...');
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [selectedRisk, setSelectedRisk] = useState(null);

  useEffect(() => {
    if (isAnalyzing) {
      const statuses = [
        'Initializing Analysis Engine...',
        'Parsing Document Structure...',
        'Extracting Core Clauses...',
        'Cross-checking Compliance...',
        'Synthesizing Final Report...'
      ];
      let i = 0;
      const interval = setInterval(() => {
        setLoadingStatus(statuses[i % statuses.length]);
        i++;
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => setScanPos(p => (p + 3) % 100), 50);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  const handleUpload = async (uploadFile) => {
    if (!uploadFile) return;
    setFile(uploadFile);
    setIsAnalyzing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const res = await fetch('/api/analyze-contract', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Analysis failed');
      }

      const data = await res.json();
      setAnalysisResult(data);
      if (data.risk_clauses && data.risk_clauses.length > 0) {
          setSelectedRisk(data.risk_clauses[0]);
      }
      setHasAnalyzed(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setHasAnalyzed(false);
    setFile(null);
    setAnalysisResult(null);
    setActiveTab(TABS[0]);
    setSelectedRisk(null);
  };

  const handleExportPDF = () => {
      // In a real app this would trigger a backend PDF generation.
      // For now, we simulate success via a browser print dialogue or alert.
      window.print();
  };

  if (!hasAnalyzed) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#030305] text-white selection:bg-cyan-500/30 font-sans">
        <NoiseOverlay />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 text-center flex flex-col items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
            className="max-w-4xl mx-auto w-full flex flex-col items-center justify-center"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-bold mb-6 tracking-tighter leading-[1.1] flex flex-wrap justify-center gap-x-3 md:gap-x-4">
              {['Macro', 'Predictive', 'Analysis'].map((word, wordIndex) => (
                <span key={wordIndex} className="inline-flex overflow-hidden pb-2">
                  {word.split('').map((letter, letterIndex) => (
                    <motion.span
                      key={`${wordIndex}-${letterIndex}`}
                      initial={{ y: 40, opacity: 0, filter: 'blur(8px)' }}
                      animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                      transition={{
                        delay: wordIndex * 0.1 + letterIndex * 0.02,
                        duration: 0.8,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className={word === 'Analysis'
                        ? 'inline-block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-cyan-400 animate-gradient-x bg-[length:200%_auto]'
                        : 'inline-block text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60'}
                    >
                      {letter}
                    </motion.span>
                  ))}
                </span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-base md:text-lg text-white/40 font-light max-w-xl mx-auto leading-relaxed mb-2"
            >
              Institutional-grade telemetry on litigation trends, jurisdictional shifts, and systemic regulatory vectors.
            </motion.p>

            <UploadZone
              onUpload={handleUpload}
              isAnalyzing={isAnalyzing}
              fileName={file?.name}
              onAbort={handleReset}
            />

            {isAnalyzing && (
              <div className="mt-8 w-full max-w-3xl rounded-[1.5rem] border border-cyan-500/20 bg-black/40 p-6 text-left">
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80 mb-3">Analysis in progress</p>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-4">
                  <motion.div
                    className="h-full bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)]"
                    animate={{ width: ['0%', '100%'] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
                <p className="text-sm text-white/80">{loadingStatus}</p>
              </div>
            )}
          </motion.div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes gradient-x { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
          @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
          .animate-gradient-x { animation: gradient-x 8s ease infinite; }
        ` }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col relative overflow-hidden text-slate-200">
      
      {/* Keeping a consistent background logic for results / loading */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at center, #ffffff11 1px, transparent 1px)`, backgroundSize: `24px 24px` }} />
         <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-transparent to-[#030712] opacity-80" />
      </div>

      <main className="container mx-auto px-6 relative z-10 flex flex-col flex-1 max-w-[1400px] pt-24 pb-12">
        {hasAnalyzed && (
            <div className="flex items-center justify-between gap-4 mb-8">
               <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#8BA1FF] via-[#E2D4F0] to-[#F1A7B1]">
                 Analysis Overview
               </h1>
               <div className="flex gap-4">
                 <button 
                    onClick={handleReset}
                    className="px-6 py-2 rounded text-[11px] font-mono tracking-widest text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800/50 transition-all uppercase"
                 >
                   New Scan
                 </button>
                 <button 
                    onClick={handleExportPDF}
                    className="px-6 py-2 rounded bg-[#4C3B8B] hover:bg-[#5C4B9B] text-[11px] font-mono tracking-widest text-white transition-colors shadow-[0_0_15px_rgba(76,59,139,0.4)] uppercase flex items-center gap-2"
                 >
                   <Download className="w-3.5 h-3.5" /> Export Report
                 </button>
               </div>
            </div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold flex items-center gap-3">
             <AlertTriangle className="w-5 h-5 text-red-500" />
             System Error: {error}
          </motion.div>
        )}

        <div className="flex-1 flex flex-col relative z-10">
          <AnimatePresence mode="wait">
            {!hasAnalyzed ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex items-center justify-center py-12 lg:py-24"
              >
                  <div className="w-full max-w-2xl mx-auto rounded-2xl bg-[#0B1021]/80 border border-[#1E2540] p-16 flex flex-col items-center justify-center text-center space-y-12 relative overflow-hidden backdrop-blur-md">
                    <div className="absolute top-0 left-0 w-full h-1 bg-secondary/30">
                       <motion.div 
                         className="h-full bg-primary" 
                         animate={{ width: ["0%", "100%"] }} 
                         transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                       />
                    </div>
                    <div className="w-32 h-32 relative">
                      <div className="absolute inset-0 border-4 border-primary/10 rounded-full animate-ping" />
                      <div className="absolute inset-4 border-2 border-dashed border-primary/30 rounded-full animate-[spin_4s_linear_infinite]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FileSearch className="w-10 h-10 text-primary animate-pulse" />
                      </div>
                      <div 
                         className="absolute left-0 w-full h-[2px] bg-primary shadow-[0_0_15px_rgba(255,255,255,0.8)] blur-[1px]" 
                         style={{ top: `${scanPos}%`, transition: 'top 0.1s linear' }}
                      />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-foreground uppercase tracking-widest">
                        <WhisperText text={loadingStatus} delay={40} duration={0.3} />
                      </h3>
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
                          <PointerHighlight pointerClassName="text-primary hidden md:block">
                            <span className="relative z-10 bg-background/50 px-2 rounded">
                              <AnimatedUnderline>Secure Connection Active</AnimatedUnderline>
                            </span>
                          </PointerHighlight>
                        </p>
                      </div>
                    </div>
                  </div>
              </motion.div>
            ) : (
              <motion.div 
                key="results"
                variants={STAGGER_VARIANTS}
                initial="hidden"
                animate="show"
                className="w-full h-full flex flex-col pb-12"
              >
                {/* Meta Bar */}
                <motion.div variants={ITEM_VARIANTS} className="flex flex-wrap items-center gap-3 mb-8 bg-black border border-border-charcoal p-3 rounded-none text-sm font-medium shadow-none font-geist-mono">
                  <div className="min-w-[120px] px-4 py-2 bg-[#8BA1FF]/10 text-[#8BA1FF] border border-[#8BA1FF]/20 rounded-none flex items-center justify-center gap-2 font-bold tracking-wide">
                    <FileText className="w-4 h-4" /> {analysisResult?.document_type?.type || 'Document'}
                  </div>
                  <div className="px-5 py-2 bg-transparent border border-[#2A3454] rounded-none text-slate-400 font-mono">
                    Confidence: <span className="text-slate-100 font-bold ml-2">{analysisResult?.document_type?.confidence || 0}%</span>
                  </div>
                  <div className="px-5 py-2 bg-transparent border border-[#2A3454] rounded-none text-slate-400 font-mono">
                    Words: <span className="text-slate-100 font-bold ml-2">{analysisResult?.total_words?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex-1 px-5 py-2 bg-transparent border border-[#2A3454] rounded-none text-slate-400 flex items-center gap-4 font-mono">
                    Risk Index: 
                    <span className={cn(
                      "font-bold px-2 py-0.5 rounded-none text-[10px] uppercase tracking-[0.2em]",
                      (analysisResult?.risk_score ?? 100) < 50 ? "bg-red-500/20 text-red-500" : (analysisResult?.risk_score ?? 100) < 75 ? "bg-orange-500/20 text-orange-500" : "bg-emerald-500/20 text-emerald-500"
                    )}>
                      {analysisResult?.risk_score ?? 'N/A'}/100
                    </span>
                  </div>
                </motion.div>

                {/* Dashboard Layout */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[600px]">
                  
                  {/* Left Column: Navigation & Summary */}
                  <div className="lg:col-span-4 flex flex-col gap-6 h-full">
                    {/* Tabs */}
                    <div className="bg-[#0A0F1D] border border-[#2A3454] rounded-none p-2 flex flex-col gap-1 shadow-none font-mono">
                      {TABS.map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={cn(
                            "relative px-5 py-3.5 text-left rounded-none text-[11px] font-medium uppercase tracking-[0.15em] transition-all duration-300 z-10 overflow-hidden flex items-center justify-between group",
                            activeTab === tab ? "text-white" : "text-muted-foreground hover:bg-white/[0.03]"
                          )}
                        >
                          {activeTab === tab && (
                            <motion.div
                              layoutId="activeTabBadge"
                              className="absolute inset-0 bg-primary-violet/20 border-l-2 border-primary-violet z-[-1]"
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          )}
                          <span className="relative z-10">{tab}</span>
                          <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", activeTab === tab ? "text-primary-violet translate-x-1" : "text-muted-foreground/20 group-hover:translate-x-1 group-hover:text-muted-foreground")} />
                        </button>
                      ))}
                    </div>

                    {/* KPI Widget */}
                    <motion.div variants={ITEM_VARIANTS} className="bg-[#0A0F1D] border border-[#2A3454] rounded-none p-6 shadow-none flex-1 flex flex-col font-mono">
                      <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-[#8BA1FF]" /> Analysis Metrics
                      </h3>
                      <div className="flex-1 flex flex-col justify-center space-y-10">
                         <div>
                            <div className="flex justify-between text-[11px] mb-2 uppercase tracking-wider"><span className="text-muted-foreground">Completeness</span><span className="text-white font-bold">{analysisResult?.completeness?.score ?? 0}%</span></div>
                            <div className="h-1 bg-white/5 rounded-none overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${analysisResult?.completeness?.score ?? 0}%` }} transition={{ duration: 1 }} className="h-full bg-primary-violet shadow-[0_0_10px_rgba(124,58,237,0.5)]" /></div>
                         </div>
                         <div>
                            <div className="flex justify-between text-[11px] mb-2 uppercase tracking-wider"><span className="text-muted-foreground">Language Clarity</span><span className="text-white font-bold">{analysisResult?.language_quality?.score ?? 0}/100</span></div>
                            <div className="h-1 bg-white/5 rounded-none overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${analysisResult?.language_quality?.score ?? 0}%` }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" /></div>
                         </div>
                         <div className="pt-8 border-t border-border-charcoal">
                            <div className="text-4xl font-bold text-white tracking-widest">{analysisResult?.neural_analysis?.structural_integrity_score || 0}<span className="text-xl text-muted-foreground font-normal ml-1">/100</span></div>
                            <div className="text-[9px] text-muted-foreground/50 mt-2 uppercase tracking-[0.2em]">Document Health Index</div>
                         </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Right Column: Dynamic Content Area */}
                  <div className="lg:col-span-8 h-full">
                    <motion.div 
                      key={activeTab}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="bg-[#0A0F1D] border border-[#2A3454] rounded-none h-full shadow-none overflow-hidden flex flex-col"
                    >
                      {activeTab === 'Executive Summary' && (
                        <div className="p-8 md:p-10 h-full overflow-y-auto custom-scrollbar flex flex-col">
                           <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border">
                             <div className="p-2.5 bg-primary/10 rounded-xl"><ShieldCheck className="w-6 h-6 text-primary" /></div>
                             <h2 className="text-2xl font-bold text-foreground">Executive Summary</h2>
                           </div>
                           
                           <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed text-justify mb-10">
                             <p className="text-[15px]">{analysisResult?.neural_analysis?.neural_audit || analysisResult?.summary}</p>
                           </div>

                           <div className="space-y-4">
                             <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-4">Strategic Review</h4>
                             {analysisResult?.neural_analysis?.strategic_insights?.map((insight, i) => (
                               <div key={i} className="flex gap-4 p-5 rounded-xl bg-secondary/30 border border-border/50 text-sm text-foreground/90 font-medium leading-relaxed hover:bg-secondary/50 transition-all">
                                  <div className="mt-0.5 shrink-0"><CheckCircle2 className="w-5 h-5 text-primary" /></div>
                                  <span>{insight}</span>
                               </div>
                             ))}
                           </div>
                        </div>
                      )}

                      {activeTab === 'Vulnerabilities' && (
                        <div className="flex flex-col h-full lg:flex-row">
                          {/* Risk List */}
                          <div className="w-full lg:w-[45%] border-r border-[#2A3454] flex flex-col h-full bg-[#030712]/40">
                             <div className="p-6 border-b border-[#2A3454] bg-[#ffffff05]">
                               <h3 className="font-medium text-white flex items-center gap-2 uppercase tracking-widest text-[11px] font-geist-mono">
                                 <AlertTriangle className="w-4 h-4 text-red-500" /> Flagged Risks ({analysisResult?.risk_clauses?.length || 0})
                               </h3>
                             </div>
                             <div className="flex-1 overflow-y-auto no-scrollbar font-geist-mono">
                               {analysisResult?.risk_clauses?.length > 0 ? analysisResult.risk_clauses.map((risk, idx) => (
                                 <button
                                   key={idx}
                                   onClick={() => setSelectedRisk(risk)}
                                   className={cn(
                                     "w-full text-left p-5 border-b border-[#2A3454] hover:bg-white/[0.03] transition-colors",
                                     selectedRisk === risk ? "bg-[#ffffff08] border-l-2 border-l-[#8BA1FF]" : "border-l-2 border-l-transparent"
                                   )}
                                 >
                                   <div className="flex items-center justify-between mb-2">
                                     <span className="font-bold text-white text-[12px]">{risk.clause}</span>
                                     <span className={cn(
                                       "text-[9px] font-bold uppercase px-2 py-0.5 rounded-none tracking-widest",
                                       risk.severity === 'critical' ? "bg-purple-500/20 text-purple-400" :
                                       risk.severity === 'high' ? "bg-red-500/20 text-red-400" :
                                       risk.severity === 'medium' ? "bg-orange-500/20 text-orange-400" :
                                       "bg-blue-500/20 text-blue-400"
                                     )}>{risk.severity}</span>
                                   </div>
                                   <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{risk.detail}</p>
                                 </button>
                               )) : (
                                 <div className="p-8 text-center text-muted-foreground text-xs uppercase tracking-widest font-bold">Secure Document // No Risks Found</div>
                               )}
                             </div>
                          </div>
                          {/* Risk Detail View */}
                          <div className="w-full lg:w-[55%] bg-[#0A0F1D] p-8 flex flex-col h-full overflow-y-auto custom-scrollbar">
                            {selectedRisk ? (
                              <AnimatePresence mode="wait">
                                <motion.div
                                  key={selectedRisk.clause}
                                  initial={{ opacity: 0, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="space-y-6"
                                >
                                  <div>
                                    <div className={cn(
                                       "inline-flex text-[10px] items-center gap-1.5 font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg mb-4",
                                       selectedRisk.severity === 'critical' ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20" :
                                       selectedRisk.severity === 'high' ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20" :
                                       selectedRisk.severity === 'medium' ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20" :
                                       "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                     )}>
                                      <Zap className="w-3 h-3" /> {selectedRisk.severity} Priority
                                    </div>
                                    <h2 className="text-2xl font-bold text-foreground mb-3">{selectedRisk.clause}</h2>
                                    <p className="text-sm text-foreground/80 leading-relaxed p-4 bg-secondary/30 rounded-xl border border-border">
                                      {selectedRisk.detail}
                                    </p>
                                  </div>

                                  {selectedRisk.context && selectedRisk.context !== "Clause detected in document" && (
                                    <div className="pt-4">
                                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Extracted Context</h4>
                                      <div className="relative">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg" />
                                        <p className="text-sm font-serif text-muted-foreground leading-loose italic bg-secondary/10 p-6 pl-8 rounded-lg border border-border shadow-inner">
                                          "{selectedRisk.context}..."
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </motion.div>
                              </AnimatePresence>
                            ) : (
                              <div className="m-auto text-center">
                                <FileSearch className="w-12 h-12 text-border mx-auto mb-4" />
                                <p className="text-muted-foreground text-sm">Select a vulnerability from the list to view exact contextual details.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                       {activeTab === 'Structural Analysis' && (
                        <div className="p-8 md:p-10 h-full overflow-y-auto no-scrollbar font-geist-mono">
                           <h2 className="text-xl font-bold text-white mb-8 uppercase tracking-widest">Document Structure</h2>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                              {analysisResult?.neural_analysis?.structural_map && Object.entries(analysisResult.neural_analysis.structural_map).map(([key, value]) => (
                                <div key={key} className="p-6 rounded-none bg-white/[0.02] border border-border-charcoal hover:bg-white/[0.04] transition-colors">
                                  <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em] mb-3">{key}</h4>
                                  <p className="text-[12px] text-foreground font-medium leading-relaxed">{value}</p>
                                </div>
                              ))}
                           </div>

                           <div className="space-y-8 pt-8 border-t border-border-charcoal">
                             <div>
                               <h3 className="text-[11px] font-bold text-white mb-6 uppercase tracking-widest">Required Components Check</h3>
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                 {analysisResult?.completeness?.checklist?.map((item, i) => (
                                   <div key={i} className="flex items-center gap-3 p-3 rounded-none border border-border-charcoal bg-black/40">
                                     <div className={cn("w-1.5 h-1.5 rounded-none shrink-0", item.present ? "bg-emerald-500" : "bg-red-500")} />
                                     <span className={cn("text-[11px] font-medium uppercase tracking-tight", item.present ? "text-foreground" : "text-muted-foreground/30 line-through")}>{item.item}</span>
                                   </div>
                                 ))}
                               </div>
                             </div>

                             {analysisResult?.neural_analysis?.missing_elements?.length > 0 && analysisResult.neural_analysis.missing_elements[0] !== "All standard components present for this document type" && (
                               <div className="bg-red-500/5 border border-red-500/20 rounded-none p-6">
                                 <h4 className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Critical Omissions</h4>
                                 <div className="flex flex-wrap gap-2">
                                    {analysisResult.neural_analysis.missing_elements.map((el, i) => (
                                      <span key={i} className="px-3 py-1.5 rounded-none bg-red-500/10 text-[10px] font-bold text-red-400 uppercase tracking-widest">
                                        {el}
                                      </span>
                                    ))}
                                 </div>
                               </div>
                             )}
                           </div>
                        </div>
                      )}
                    </motion.div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
