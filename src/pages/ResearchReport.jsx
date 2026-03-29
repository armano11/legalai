import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';
import {
  Download, ArrowLeft, Shield, Scale, Gavel,
  Target, Sparkles, BookOpen, Activity, Clock, CheckCircle, ChevronDown
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { GlassCard } from '@/components/ui/glass-card';
import { GlowButton } from '@/components/ui/glow-button';
import { PillTag } from '@/components/ui/pill-tag';
import { SkeletonBlock } from '@/components/ui/skeleton-shimmer';
import WhisperText from '@/components/ui/whisper-text';
import { PointerHighlight } from '@/components/ui/pointer-highlight';
import { AnimatedUnderline } from '@/components/ui/animated-underline';
import { stagger, fadeUp, pageTransition, expandCollapse } from '@/lib/design-tokens';

export default function ResearchReport() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [reportData, setReportData] = useState(location.state?.report);
  const [query, setQuery] = useState(location.state?.query || "Legal Research Request");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [expandedCase, setExpandedCase] = useState(null);

  useEffect(() => {
    if (!reportData) {
      const saved = localStorage.getItem('last_research_report');
      if (saved) {
        setReportData(JSON.parse(saved));
      } else {
        const timer = setTimeout(() => navigate('/research'), 2000);
        return () => clearTimeout(timer);
      }
    } else {
      localStorage.setItem('last_research_report', JSON.stringify(reportData));
    }

    if (reportData && !reportData.synthesis_ready && reportData.context_for_ai) {
      const fetchSynthesis = async () => {
        setIsSynthesizing(true);
        try {
          const res = await fetch('/api/research/synthesize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ query, context: reportData.context_for_ai })
          });
          if (res.ok) {
            const synData = await res.json();
            const updated = { ...reportData, ...synData, synthesis_ready: true };
            setReportData(updated);
            localStorage.setItem('last_research_report', JSON.stringify(updated));
          }
        } catch (err) {
          console.error("Synthesis failed", err);
        } finally {
          setIsSynthesizing(false);
        }
      };
      fetchSynthesis();
    }
  }, [reportData, navigate, token, query]);

  const reportRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Brief_${query.slice(0, 15).replace(/\s+/g, '_')}`,
  });

  if (!reportData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold">Loading Report...</p>
      </div>
    );
  }

  const riskScore = reportData?.risk_assessment?.score || 0;
  const riskVariant = riskScore >= 70 ? 'success' : riskScore >= 45 ? 'warning' : 'danger';

  return (
    <motion.div {...pageTransition} className="min-h-screen bg-background text-foreground">

      {/* Top Bar */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-panel border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/research')}
              className="w-8 h-8 rounded-lg bg-muted/50 border border-border flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="flex flex-col">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary flex items-center gap-1.5">
                <PointerHighlight pointerClassName="bg-primary/20">
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded cursor-default group">
                    <Shield className="w-3 h-3 group-hover:text-white transition-colors" /> 
                    <AnimatedUnderline>Intelligence Brief</AnimatedUnderline>
                  </span>
                </PointerHighlight>
              </p>
              <p className="text-sm font-medium text-foreground truncate max-w-sm mt-0.5">{query}</p>
            </div>
          </div>
          <GlowButton size="sm" onClick={handlePrint}>
            <Download className="w-3.5 h-3.5" /> Export
          </GlowButton>
        </div>
      </nav>

      <main ref={reportRef} className="max-w-7xl mx-auto px-6 pt-24 pb-24 print:pt-4 print:text-black print:bg-white">

        {/* Header */}
        <motion.div {...fadeUp} className="mb-10 pb-6 border-b border-border/50">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">
            Legal <span className="text-primary">Synthesis Report</span>
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" /> {new Date().toLocaleDateString()}</span>
            <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-primary" /> 
              {isSynthesizing ? <WhisperText text="Synthesizing..." delay={40} duration={0.3} triggerStart="top bottom" /> : <WhisperText text="Complete" delay={40} duration={0.3} triggerStart="top bottom" />}
            </span>
            <PillTag variant={riskVariant}>Risk Score: {riskScore}/100</PillTag>
          </div>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Main Column */}
          <div className="lg:col-span-8 space-y-6">

            {/* Synthesis */}
            <GlassCard hover={false} className="p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-full" />
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-1.5 rounded-lg bg-primary/10"><Sparkles className="w-4 h-4 text-primary" /></div>
                <h3 className="text-base font-semibold text-foreground">Executive Synthesis</h3>
              </div>
              {isSynthesizing ? (
                <SkeletonBlock lines={6} />
              ) : (
                <div className="text-base text-muted-foreground leading-relaxed space-y-4 max-w-none text-justify font-sans selection:bg-primary/20">
                  {(reportData.synthesis || "Unavailable.").split('\n').map((p, i) =>
                    p.trim() && <p key={i} className="first-letter:text-2xl first-letter:font-bold first-letter:text-primary first-letter:mr-1">{p}</p>
                  )}
                </div>
              )}
            </GlassCard>

            {/* Action Items */}
            <motion.section variants={fadeUp}>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-primary" /> Recommended Actions
              </h3>
              <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reportData?.further_steps?.map((step, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <GlassCard className="p-4">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle className={`w-4 h-4 mt-0.5 shrink-0 ${step.priority === 'high' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">{step.action}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{step.reason}</p>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </motion.div>
            </motion.section>

            {/* Procedures */}
            {reportData?.procedures?.length > 0 && (
              <motion.section variants={fadeUp} className="pt-4 border-t border-border/50">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-primary" /> Procedural Pathway
                </h3>
                <div className="space-y-3 border-l-2 border-primary/20 ml-2 pl-5">
                  {reportData.procedures.map((proc, i) => (
                    <motion.div key={i} variants={fadeUp} className="relative">
                      <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-background border-2 border-primary" />
                      <p className="text-sm font-medium text-foreground">{proc.title}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mt-0.5">{proc.timeline}</p>
                      <p className="text-xs text-muted-foreground mt-1">{proc.description}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-5">

            {/* Risk Assessment */}
            <GlassCard hover={false} className="p-5">
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Risk Evaluation</h4>
              <div className="flex items-end gap-1.5 mb-4 pb-3 border-b border-border/50">
                <span className="text-4xl font-bold text-foreground">{riskScore}</span>
                <span className="text-sm text-muted-foreground pb-1">/ 100</span>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 mb-1.5">Positive</p>
                  <ul className="space-y-1.5">
                    {reportData?.risk_assessment?.factors_for?.map((f, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-emerald-400">+</span> {f}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400 mb-1.5 mt-3">Risks</p>
                  <ul className="space-y-1.5">
                    {reportData?.risk_assessment?.factors_against?.map((f, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-red-400">−</span> {f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </GlassCard>

            {/* Statutes */}
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-3">
                <Scale className="w-3.5 h-3.5 text-primary" /> Statutes
              </h4>
              <div className="space-y-2">
                {reportData?.penal_codes?.map((code, i) => (
                  <GlassCard key={i} className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground">{code.code}</span>
                      <PillTag variant={code.severity === 'serious' ? 'danger' : 'muted'}>{code.severity}</PillTag>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{code.title}</p>
                  </GlassCard>
                ))}
              </div>
            </div>

            {/* Precedents */}
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-3">
                <BookOpen className="w-3.5 h-3.5 text-primary" /> Precedents
              </h4>
              <div className="space-y-2">
                {reportData?.similar_cases?.map((c, i) => (
                  <GlassCard key={i} className="p-3 cursor-pointer" onClick={() => setExpandedCase(expandedCase === i ? null : i)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{c.case_title}</p>
                        <p className="text-[10px] text-muted-foreground">{c.citation}</p>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground shrink-0 ml-2 transition-transform duration-200 ${expandedCase === i ? 'rotate-180' : ''}`} />
                    </div>
                    <AnimatePresence>
                      {expandedCase === i && (
                        <motion.div {...expandCollapse} className="overflow-hidden">
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{c.summary}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {c.legal_principles?.slice(0, 3).map((p, idx) => (
                              <PillTag key={idx} variant="muted">{p.slice(0, 25)}</PillTag>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </GlassCard>
                ))}
              </div>
            </div>

          </div>
        </motion.div>
      </main>
    </motion.div>
  );
}
