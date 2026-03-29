import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Wand2, Download, ArrowRight, ArrowLeft, Save, Layout, Settings2, UserCircle, Scale, Building2, CheckCircle2, ChevronRight, FileSearch, Zap } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { BeamsBackground } from '@/components/ui/beams-background';
import { cn } from '@/lib/utils';
import { pageTransition } from '@/lib/design-tokens';
import WhisperText from '@/components/ui/whisper-text';

const documentTypes = [
  { id: 'Legal Notice', icon: FileText, desc: 'Formal communication to an opposing party' },
  { id: 'Consumer Complaint', icon: UserCircle, desc: 'Grievance against deficiency in service/goods' },
  { id: 'Rental Agreement', icon: Building2, desc: 'Standard residential or commercial lease' },
  { id: 'Affidavit', icon: Scale, desc: 'Sworn statement of facts for court' },
  { id: 'Power of Attorney', icon: FileText, desc: 'Authorization to act on behalf of principal' },
  { id: 'Legal Opinion', icon: Scale, desc: 'Professional assessment of a legal matter' },
];

export default function DraftGenerator() {
  const [step, setStep] = useState(1);
  const [docType, setDocType] = useState(documentTypes[0].id);
  const [clientName, setClientName] = useState('');
  const [opposingParty, setOpposingParty] = useState('');
  const [caseDescription, setCaseDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [draftResult, setDraftResult] = useState(null);
  const [error, setError] = useState('');
  const { user, token } = useAuth();

  const handleNext = () => setStep(prev => Math.min(prev + 1, 3));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const handleGenerate = async () => {
    if (!clientName.trim() || !caseDescription.trim()) {
      setError('Client name and case description are required.');
      return;
    }
    setIsGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/generate-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          doc_type: docType,
          client_name: clientName,
          opposing_party: opposingParty || 'N/A',
          case_description: caseDescription,
          firm_name: user?.firm_name || ''
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Draft generation failed');
      }

      const data = await res.json();
      setDraftResult(data);
      setHasGenerated(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (draftResult?.download_url) {
      window.open(draftResult.download_url, '_blank');
    }
  };

  const variants = {
    enter: (direction) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction) => ({ zIndex: 0, x: direction < 0 ? 50 : -50, opacity: 0 })
  };

  return (
    <BeamsBackground className="bg-oled bg-dot-matrix-5 font-geist selection:bg-indigo-500/30 overflow-x-hidden">
      <div className="container mx-auto px-6 lg:px-8 pt-32 pb-24 relative z-10 max-w-[1400px]">
        
        {/* Minimal Tool Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-lg bg-black border border-[#27272A] flex items-center justify-center shadow-none">
              <Wand2 className="w-5 h-5 text-[#6366F1]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-geist">Drafting <span className="text-[#6366F1]">Hub</span></h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-geist-mono text-muted-foreground uppercase tracking-[0.2em]">Revision Control 4.2.0</span>
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-geist-mono text-emerald-500/80 uppercase tracking-widest">AI Engine Standing By</span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4 py-2 px-4 border border-[#27272A] bg-black/40 font-geist-mono text-[10px] uppercase tracking-widest text-muted-foreground">
             <span className="text-[#6366F1]">Pipeline:</span> {docType} // Synthesis Ready
          </div>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-8 p-4 bg-red-500/5 border border-red-500/20 text-red-500 text-xs font-geist-mono uppercase tracking-widest flex items-center gap-3">
            <Zap className="w-4 h-4" /> Processing error: {error}
          </motion.div>
        )}

        {/* BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[750px]">

          {/* LEFT: TEMPLATE & PARAMETERS (45%) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-5 flex flex-col bg-black border border-[#27272A] rounded-[8px] overflow-hidden shadow-none"
          >
            {/* Steps Navigation Bar */}
            <div className="flex border-b border-[#27272A] font-geist-mono">
              {[1, 2, 3].map(num => (
                <button 
                  key={num}
                  onClick={() => setStep(num)}
                  disabled={isGenerating}
                  className={cn(
                    "flex-1 py-4 px-6 text-[10px] font-bold uppercase tracking-[0.3em] transition-all border-r border-[#27272A] last:border-r-0 flex items-center justify-center gap-3",
                    step === num ? "bg-[#6366F1]/10 text-[#6366F1] border-b-2 border-b-[#6366F1]" : "text-muted-foreground/40 hover:bg-white/[0.02]"
                  )}
                >
                  <span className="opacity-50">0{num}</span> {num === 1 ? 'Framework' : num === 2 ? 'Parameters' : 'Finalize'}
                </button>
              ))}
            </div>

            <div className="flex-1 p-8 overflow-y-auto no-scrollbar relative">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                    <div className="pb-6 border-b border-[#27272A]/50">
                      <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] font-geist-mono mb-2">Framework Selection</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">Select the document template and legal logic for generation.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {documentTypes.map(type => (
                        <button
                          key={type.id}
                          onClick={() => setDocType(type.id)}
                          className={cn(
                            "group flex items-center justify-between p-4 rounded-[4px] border transition-all duration-200",
                            docType === type.id 
                              ? "bg-[#6366F1]/5 border-[#6366F1] text-white" 
                              : "bg-transparent border-[#27272A] text-muted-foreground/60 hover:border-muted-foreground/30"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <type.icon className={cn("w-4 h-4", docType === type.id ? "text-[#6366F1]" : "text-muted-foreground/40")} />
                            <span className="text-xs font-bold uppercase tracking-widest">{type.id}</span>
                          </div>
                          <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", docType === type.id ? "text-[#6366F1] translate-x-1" : "opacity-0 group-hover:opacity-100")} />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                    <div className="pb-6 border-b border-[#27272A]/50">
                      <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] font-geist-mono mb-2">
                        <WhisperText text="Data Parameters" delay={50} duration={0.4} />
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">Feed the assembly pipeline with case-specific identifiers.</p>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block font-geist-mono">01 // Entity.Primary</label>
                        <input
                          type="text"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className="w-full bg-[#050505] border border-[#27272A] rounded-[4px] p-4 text-xs text-white focus:outline-none focus:border-[#6366F1] transition-all font-geist-mono uppercase tracking-widest placeholder:text-muted-foreground/20"
                          placeholder="ENTER FULL LEGAL NAME..."
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block font-geist-mono">02 // Entity.Opposing</label>
                        <input
                          type="text"
                          value={opposingParty}
                          onChange={(e) => setOpposingParty(e.target.value)}
                          className="w-full bg-[#050505] border border-[#27272A] rounded-[4px] p-4 text-xs text-white focus:outline-none focus:border-[#6366F1] transition-all font-geist-mono uppercase tracking-widest placeholder:text-muted-foreground/20"
                          placeholder="ENTER OPPOSING PARTY ID..."
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block font-geist-mono">03 // Matter.Narrative</label>
                        <textarea
                          value={caseDescription}
                          onChange={(e) => setCaseDescription(e.target.value)}
                          className="w-full bg-[#050505] border border-[#27272A] rounded-[4px] p-4 text-xs text-white focus:outline-none focus:border-[#6366F1] transition-all font-geist-mono uppercase tracking-widest placeholder:text-muted-foreground/20 h-40 resize-none leading-relaxed"
                          placeholder="INITIALIZE CONTEXTUAL NARRATIVE..."
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                    <div className="pb-6 border-b border-[#27272A]/50">
                      <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] font-geist-mono mb-2">Final Review</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">Review the mapping before triggering autonomous synthesis.</p>
                    </div>
                    <div className="space-y-1 bg-[#050505] border border-[#27272A] p-6 rounded-[4px] font-geist-mono">
                      {[
                        { label: 'Document Type', val: docType },
                        { label: 'Client', val: clientName || 'ERR_MISSING' },
                        { label: 'Opposing Party', val: opposingParty || 'N/A' },
                      ].map(item => (
                        <div key={item.label} className="flex justify-between py-3 border-b border-[#27272A]/50 last:border-b-0">
                          <span className="text-[9px] text-muted-foreground uppercase tracking-widest">{item.label}</span>
                          <span className="text-[10px] text-white uppercase font-bold tracking-widest">{item.val}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Wizard Footer */}
            <div className="p-6 border-t border-[#27272A] bg-[#050505]/50 flex justify-between items-center font-geist-mono">
              <button 
                onClick={handleBack} 
                disabled={step === 1 || isGenerating}
                className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground hover:text-white transition-colors disabled:opacity-20"
              >
                // BACK
              </button>
              
              {step < 3 ? (
                <button 
                  onClick={handleNext} 
                  className="px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-[4px] hover:bg-[#6366F1] hover:text-white transition-all shadow-none"
                >
                  NEXT
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !clientName || !caseDescription}
                  className="px-8 py-3 bg-[#6366F1] text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-[4px] transition-all flex items-center gap-4 disabled:opacity-30 group"
                >
                  {isGenerating ? 'GENERATING...' : 'GENERATE DRAFT'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </motion.div>

          {/* RIGHT: DOCUMENT PREVIEW (55%) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-7 flex flex-col bg-black border border-[#27272A] rounded-[8px] overflow-hidden shadow-none h-full"
          >
            {/* Preview Toolbar */}
            <div className="p-4 border-b border-[#27272A] flex justify-between items-center bg-[#050505]/80 backdrop-blur-md">
              <div className="flex items-center gap-3 font-geist-mono">
                <FileSearch className="w-4 h-4 text-[#6366F1]" />
                <span className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">Document.Realtime_View</span>
              </div>
              <button 
                disabled={!hasGenerated || isGenerating} 
                onClick={handleDownload} 
                className="px-4 py-2 border border-[#27272A] text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground hover:text-white hover:border-[#6366F1] transition-all disabled:opacity-20"
              >
                Export_PDF
              </button>
            </div>

            {/* Viewer Stage */}
            <div className="flex-1 p-12 overflow-y-auto no-scrollbar bg-black relative flex flex-col items-center">
              <AnimatePresence mode="wait">
                {!hasGenerated && !isGenerating && (
                  <motion.div 
                    key="blueprint"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="w-full max-w-lg h-full border border-dashed border-[#27272A] rounded-[4px] relative flex flex-col items-center justify-center p-12"
                  >
                     {/* Template Blueprint Wireframe Overlay */}
                     <div className="absolute inset-0 p-8 space-y-6 opacity-10 flex flex-col">
                        <div className="h-6 w-1/3 bg-[#27272A] rounded-[2px]" />
                        <div className="flex justify-between">
                            <div className="h-2 w-1/4 bg-[#27272A] rounded-[1px]" />
                            <div className="h-2 w-1/4 bg-[#27272A] rounded-[1px]" />
                        </div>
                        <div className="space-y-2 pt-10">
                            <div className="h-2 w-full bg-[#27272A] rounded-[1px]" />
                            <div className="h-2 w-full bg-[#27272A] rounded-[1px]" />
                            <div className="h-2 w-[90%] bg-[#27272A] rounded-[1px]" />
                        </div>
                        <div className="space-y-2 pt-10">
                            <div className="h-2 w-full bg-[#27272A] rounded-[1px]" />
                            <div className="h-2 w-[85%] bg-[#27272A] rounded-[1px]" />
                        </div>
                        <div className="flex-1" />
                        <div className="flex justify-end pt-10">
                            <div className="h-10 w-24 border border-[#27272A] rounded-[2px]" />
                        </div>
                     </div>
                     
                     <div className="relative text-center z-10">
                        <div className="w-12 h-12 rounded-full border border-[#27272A] mx-auto mb-6 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] animate-pulse" />
                        </div>
                        <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.5em] mb-4">Ready for Input</h3>
                        <p className="text-[9px] text-muted-foreground/40 font-geist-mono uppercase tracking-widest max-w-xs leading-loose">
                           <WhisperText text="System Idle. Feed document context to initialize synthesis. Current weights: Juris_v4_Core." delay={20} duration={0.2} />
                        </p>
                     </div>
                  </motion.div>
                )}

                {isGenerating && (
                  <motion.div 
                    key="generating"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="w-full max-w-lg space-y-8"
                  >
                     <div className="flex items-center gap-6 justify-center">
                        <div className="w-px h-16 bg-gradient-to-b from-transparent via-[#6366F1] to-transparent animate-pulse" />
                        <div className="font-geist-mono">
                           <div className="text-[10px] font-bold text-[#6366F1] mb-1 uppercase tracking-[0.4em] animate-pulse">
                              <WhisperText text="Analysis Thread Active" delay={40} duration={0.3} />
                           </div>
                           <div className="text-xl font-bold text-white uppercase tracking-widest">
                              <WhisperText text="Compiling Assets..." delay={50} duration={0.4} />
                           </div>
                        </div>
                     </div>
                     <div className="space-y-4 pt-10">
                        {[70, 95, 85, 60, 40, 80].map((w, i) => (
                          <div key={i} className="h-[2px] w-full bg-[#27272A] relative overflow-hidden">
                             <motion.div 
                               initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 1.5, delay: i * 0.1, repeat: Infinity }}
                               className="absolute inset-y-0 w-20 bg-[#6366F1]"
                             />
                          </div>
                        ))}
                     </div>
                  </motion.div>
                )}

                {hasGenerated && draftResult && !isGenerating && (
                  <motion.div 
                    key="output"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-2xl bg-[#050505] border border-[#27272A] p-12 lg:p-16 rounded-[4px] relative selection:bg-[#6366F1]/20 font-serif leading-[2] text-[15px] text-white/90 text-justify"
                  >
                    <div className="absolute top-0 right-0 p-4 font-geist-mono text-[9px] text-[#27272A] uppercase tracking-[0.3em] font-bold">Generated Legal Document</div>
                    <div className="text-center mb-16 border-b border-[#27272A] pb-10">
                      <h2 className="text-xl font-bold uppercase tracking-[0.4em] text-white underline underline-offset-8">{draftResult.document_type}</h2>
                    </div>
                    <div className="whitespace-pre-wrap">{draftResult.preview_text}</div>
                    
                    <div className="mt-20 pt-10 border-t border-[#27272A] flex justify-between items-center text-[9px] font-geist-mono text-muted-foreground/30 uppercase tracking-[0.2em] font-bold">
                       <span>Validated_at: {new Date().toISOString()}</span>
                       <span>Asset_ID: {draftResult.draft_id}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </div>
    </BeamsBackground>
  );
}
