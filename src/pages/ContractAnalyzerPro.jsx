import React, { useMemo, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileBadge2,
  FileSearch,
  Gavel,
  Layers3,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
  Wand2,
  Zap,
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { cn } from '../lib/utils';

const SUPPORTED_TYPES = [
  'Contracts',
  'FIRs',
  'Petitions',
  'Affidavits',
  'Legal Notices',
  'Lease Agreements',
  'Deeds',
  'Court Orders',
  'Powers of Attorney',
  'Wills',
];

const REPORT_SECTIONS = [
  'Executive Summary',
  'Weak Points',
  'Fixing Solutions',
  'Structure Review',
];

function getRiskTone(score) {
  if (score >= 80) {
    return {
      label: 'Lower Risk',
      badge: 'text-emerald-200 bg-emerald-500/15 border-emerald-400/30',
    };
  }
  if (score >= 60) {
    return {
      label: 'Moderate Risk',
      badge: 'text-amber-200 bg-amber-500/15 border-amber-400/30',
    };
  }
  return {
    label: 'High Risk',
    badge: 'text-rose-200 bg-rose-500/15 border-rose-400/30',
  };
}

function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.2)] backdrop-blur-md">
      <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm leading-6 text-slate-400">{hint}</div>
    </div>
  );
}

function UploadPanel({ onUpload, isAnalyzing, fileName }) {
  const inputRef = useRef(null);

  const pickFile = () => inputRef.current?.click();

  const handleChange = (event) => {
    const selected = event.target.files?.[0];
    if (selected) {
      onUpload(selected);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) {
      onUpload(dropped);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(11,18,32,0.78))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,255,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.08),transparent_35%)]" />
      <div className="relative z-10 grid gap-6 md:grid-cols-[1.3fr_0.9fr] md:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" />
            Legal Analysis Engine
          </div>
          <h2 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight text-white md:text-4xl">
            Upload any legal paper and get a real review with summary, weak points, fixes, and structured legal observations.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            The analyzer is built for real legal work, not just clause extraction. It reads the document, identifies type, evaluates completeness, surfaces risk, and turns the result into an executive-grade report.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {SUPPORTED_TYPES.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-slate-300"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-slate-950/55 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200">
              <UploadCloud className="h-7 w-7" />
            </div>
            <div>
              <div className="text-lg font-medium text-white">Upload document</div>
              <div className="mt-1 text-sm leading-6 text-slate-400">
                Supports `PDF`, `DOCX`, `TXT`, `MD`, `RTF`, `JPG`, `JPEG`, and `PNG`.
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] p-5">
            <div className="text-sm text-slate-300">
              {fileName ? `Selected file: ${fileName}` : 'Drop a legal document here or browse from your device.'}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={pickFile}
                disabled={isAnalyzing}
                className="rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm text-white transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Browse file
              </button>
              <button
                type="button"
                onClick={pickFile}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Wand2 className="h-4 w-4" />
                {isAnalyzing ? 'Analyzing' : 'Analyze now'}
              </button>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.txt,.md,.rtf,.jpg,.jpeg,.png"
            onChange={handleChange}
          />
        </div>
      </div>
    </motion.div>
  );
}

function ReportScene({ analysisResult }) {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [10, 0, -10]);
  const rotateY = useTransform(scrollYProgress, [0, 0.5, 1], [-8, 0, 8]);
  const translateY = useTransform(scrollYProgress, [0, 1], [60, -40]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.97]);

  const riskTone = getRiskTone(analysisResult?.risk_score ?? 100);
  const overview = analysisResult?.report_overview || {};
  const weakPoints = analysisResult?.weak_points || [];
  const fixes = analysisResult?.fixing_solutions || [];
  const sectionBreakdown = analysisResult?.section_breakdown || [];
  const strengths = analysisResult?.strengths || [];
  const strategicInsights = analysisResult?.neural_analysis?.strategic_insights || [];
  const structuralMap = analysisResult?.neural_analysis?.structural_map || {};

  return (
    <div ref={containerRef} className="relative mt-12">
      <div className="pointer-events-none absolute inset-x-0 top-16 h-[620px] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.15),transparent_32%),radial-gradient(circle_at_70%_20%,rgba(251,191,36,0.12),transparent_25%)]" />

      <div className="grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
        <motion.aside
          style={{ y: translateY }}
          className="xl:sticky xl:top-24 xl:self-start"
        >
          <div className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(7,12,22,0.88))] p-6 shadow-[0_25px_120px_rgba(0,0,0,0.35)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.26em] text-slate-300">
              <FileBadge2 className="h-3.5 w-3.5" />
              Analysis Snapshot
            </div>
            <div className="mt-5 text-3xl font-semibold text-white">
              {analysisResult?.document_type?.type || 'Legal Document'}
            </div>
            <div className="mt-2 text-sm leading-6 text-slate-400">
              Confidence {analysisResult?.document_type?.confidence || 0}% • {analysisResult?.total_words?.toLocaleString() || 0} words
            </div>

            <div className={cn('mt-5 inline-flex rounded-full border px-3 py-1 text-sm', riskTone.badge)}>
              {riskTone.label}
            </div>

            <div className="mt-6 space-y-4">
              <MetricCard
                label="Risk Score"
                value={`${analysisResult?.risk_score ?? 0}/100`}
                hint="Higher means the draft appears safer after pattern review."
              />
              <MetricCard
                label="Completeness"
                value={`${analysisResult?.completeness?.score ?? 0}%`}
                hint="Checks whether expected legal components are present."
              />
              <MetricCard
                label="Drafting Clarity"
                value={`${analysisResult?.language_quality?.score ?? 0}/100`}
                hint="Reflects clarity, ambiguity, and sentence discipline."
              />
              <MetricCard
                label="Engine Confidence"
                value={`${analysisResult?.analysis_confidence ?? 0}%`}
                hint="Indicates how strong the extraction and classification signals were."
              />
              <MetricCard
                label="Runtime Mode"
                value={analysisResult?.analysis_runtime_mode === 'hybrid' ? 'Hybrid' : 'Fast'}
                hint="Fast mode skips the optional deep-analysis pass for quicker results."
              />
            </div>

            <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Readiness</div>
              <p className="mt-3 text-sm leading-7 text-slate-300">{overview.readiness}</p>
            </div>
          </div>
        </motion.aside>

        <div className="space-y-8">
          <motion.section
            style={{
              rotateX,
              rotateY,
              scale,
              transformPerspective: 1600,
            }}
            className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(155deg,rgba(18,29,53,0.94),rgba(6,10,20,0.98))] p-8 shadow-[0_35px_160px_rgba(0,0,0,0.4)] md:p-10"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.12),transparent_28%)]" />
            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-cyan-100">
                  <Sparkles className="h-3.5 w-3.5" />
                  Executive Report
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-slate-300">
                  {REPORT_SECTIONS.join(' • ')}
                </div>
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-tight text-white md:text-5xl">
                Professional legal review for {analysisResult?.document_type?.type || 'your document'} with real breakdowns, drafting gaps, and next-step guidance.
              </h1>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-5">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Purpose</div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{overview.purpose}</p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-5">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Quality Overview</div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {overview.completeness_status} • {overview.language_status}
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            {/* Advanced Neural Audit Section - Primary Highlight */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-[32px] border border-emerald-500/20 bg-[linear-gradient(165deg,rgba(16,185,129,0.08),rgba(15,23,42,0.9))] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.4)]"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <Sparkles size={80} className="text-emerald-400" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Advanced Structural Audit</h2>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">NVIDIA Gemma 3n Intelligence</p>
                  </div>
                </div>
                <div className="prose prose-invert max-w-none">
                  <p className="text-[15px] leading-relaxed text-slate-200">
                    {analysisResult?.neural_analysis?.neural_audit || analysisResult?.summary}
                  </p>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {strengths.map((item, index) => (
                    <div key={index} className="rounded-2xl border border-emerald-400/10 bg-white/[0.03] p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <p className="text-xs leading-6 text-slate-300">{item}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <div className="rounded-[32px] border border-white/10 bg-slate-950/60 p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-200">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">Strategic insights</h2>
                  <p className="text-sm text-slate-400">Tactical litigation & drafting advice.</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {(analysisResult?.neural_analysis?.strategic_insights || analysisResult?.recommended_actions || []).map((item, index) => (
                  <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 hover:bg-white/[0.06] transition-colors">
                    <div className="flex items-start gap-3">
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-amber-300" />
                      <p className="text-sm leading-7 text-slate-300">{item}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-[32px] border border-white/10 bg-slate-950/60 p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-300/10 text-rose-200">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">Weak points</h2>
                  <p className="text-sm text-slate-400">Where the document is vulnerable.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {weakPoints.length > 0 ? weakPoints.map((point, index) => (
                  <div key={index} className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-lg font-medium text-white">{point.title}</h3>
                      <span className={cn(
                        'rounded-full border px-3 py-1 text-xs uppercase tracking-[0.22em]',
                        point.severity === 'critical' && 'border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200',
                        point.severity === 'high' && 'border-rose-400/30 bg-rose-400/10 text-rose-200',
                        point.severity === 'medium' && 'border-amber-400/30 bg-amber-400/10 text-amber-200',
                        point.severity !== 'critical' && point.severity !== 'high' && point.severity !== 'medium' && 'border-sky-400/30 bg-sky-400/10 text-sky-200'
                      )}>
                        {point.severity}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{point.issue}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-400">{point.impact}</p>
                  </div>
                )) : (
                  <div className="rounded-[26px] border border-emerald-400/20 bg-emerald-400/5 p-5 text-sm text-slate-300">
                    No major weak points were extracted beyond standard review observations.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-slate-950/60 p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200">
                  <Wand2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">Fixing solutions</h2>
                  <p className="text-sm text-slate-400">Concrete drafting improvements.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {fixes.map((fix, index) => (
                  <div key={index} className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-lg font-medium text-white">{fix.issue}</div>
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-cyan-100">
                        {fix.priority}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{fix.solution}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[32px] border border-white/10 bg-slate-950/60 p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-300/10 text-violet-200">
                  <Layers3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">Section breakdown</h2>
                  <p className="text-sm text-slate-400">How the document is organized.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {sectionBreakdown.map((section, index) => (
                  <div key={index} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                    <div className="text-base font-medium text-white">{section.title}</div>
                    <p className="mt-2 text-sm leading-7 text-slate-400">{section.summary}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-slate-950/60 p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-300/10 text-sky-200">
                  <Gavel className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">Structural legal review</h2>
                  <p className="text-sm text-slate-400">Core enforceability dimensions.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {Object.entries(structuralMap).map(([key, value]) => (
                  <div key={key} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                    <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">{key}</div>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Missing elements</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(analysisResult?.neural_analysis?.missing_elements || []).map((item, index) => (
                    <span
                      key={index}
                      className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1.5 text-xs text-rose-100"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[32px] border border-white/10 bg-slate-950/60 p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-200">
                  <FileBadge2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">Core obligations</h2>
                  <p className="text-sm text-slate-400">Likely operative duties and commitments extracted from the paper.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {(analysisResult?.core_obligations || []).length > 0 ? (analysisResult?.core_obligations || []).map((item, index) => (
                  <div key={index} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                    <div className="flex items-start gap-3">
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-emerald-200" />
                      <p className="text-sm leading-7 text-slate-300">{item}</p>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-300">
                    No clear obligation-style clauses were confidently extracted from this document.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-slate-950/60 p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-fuchsia-300/10 text-fuchsia-200">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">Engine profile</h2>
                  <p className="text-sm text-slate-400">Internal quality signals behind the analysis.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Document focus</div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{analysisResult?.issue_profile?.document_focus}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Risk posture</div>
                  <p className="mt-3 text-sm leading-7 capitalize text-slate-300">{analysisResult?.issue_profile?.risk_posture}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Principal concerns</div>
                  <div className="mt-3 space-y-3">
                    {(analysisResult?.issue_profile?.principal_concerns || []).map((item, index) => (
                      <p key={index} className="text-sm leading-7 text-slate-300">{item}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-slate-950/60 p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">Coverage and extracted entities</h2>
                <p className="mt-1 text-sm text-slate-400">What the analyzer can read and what it found in this document.</p>
              </div>
              <div className="text-sm text-slate-300">
                Structural Integrity {analysisResult?.neural_analysis?.structural_integrity_score || 0}/100
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Supported legal papers</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(analysisResult?.supported_document_scope || []).map((item) => (
                    <span key={item} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-slate-300">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Extracted entities</div>
                <div className="mt-4 space-y-4 text-sm text-slate-300">
                  <div>Parties: {(analysisResult?.entities?.parties || []).join(', ') || 'None detected'}</div>
                  <div>Dates: {(analysisResult?.entities?.dates || []).join(', ') || 'None detected'}</div>
                  <div>Amounts: {(analysisResult?.entities?.amounts || []).join(', ') || 'None detected'}</div>
                  <div>Sections: {(analysisResult?.entities?.sections_cited || []).join(', ') || 'None detected'}</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function ContractAnalyzerPro() {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');

  const loadingSteps = useMemo(
    () => [
      'Identifying document class and legal context',
      'Extracting parties, dates, amounts, and statutory references',
      'Checking completeness, language quality, and structural integrity',
      'Generating weak points, fixes, and executive report output',
    ],
    []
  );

  const handleUpload = async (uploadFile) => {
    if (!uploadFile) {
      return;
    }

    setFile(uploadFile);
    setIsAnalyzing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await fetch('/api/analyze-contract', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || 'Analysis failed');
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err) {
      setError(err.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetReport = () => {
    setFile(null);
    setAnalysisResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#07111f] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_25%),radial-gradient(circle_at_85%_15%,rgba(251,191,36,0.12),transparent_20%),linear-gradient(180deg,#07111f_0%,#081523_45%,#050a12_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:84px_84px]" />

      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-24">
        {!analysisResult ? (
          <>
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-slate-300">
                <FileSearch className="h-3.5 w-3.5" />
                Contract Analyzer
              </div>
              <h1 className="mt-6 text-5xl font-semibold leading-tight text-white md:text-7xl">
                Real legal document analysis with a professional report, not a shallow AI summary.
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                Review contracts, notices, petitions, affidavits, deeds, and other legal papers through one serious workflow that surfaces summary, risks, weaknesses, fixes, structural issues, and next actions.
              </p>
            </div>

            <div className="mt-12">
              <UploadPanel onUpload={handleUpload} isAnalyzing={isAnalyzing} fileName={file?.name} />
            </div>

            {error && (
              <div className="mt-8 rounded-[28px] border border-rose-400/20 bg-rose-400/10 p-5 text-sm leading-7 text-rose-100">
                {error}
              </div>
            )}

            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 rounded-[34px] border border-white/10 bg-slate-950/55 p-7"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200">
                    <Sparkles className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-lg font-medium text-white">Analysis running</div>
                    <div className="text-sm text-slate-400">Building a structured legal report from your document.</div>
                  </div>
                </div>

                <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#67e8f9,#fde68a,#67e8f9)]"
                    animate={{ x: ['-30%', '100%'] }}
                    transition={{ duration: 2.4, ease: 'linear', repeat: Infinity }}
                    style={{ width: '40%' }}
                  />
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {loadingSteps.map((step) => (
                    <div key={step} className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
                      {step}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Report ready</div>
                <h1 className="mt-2 text-4xl font-semibold text-white md:text-5xl">Document analysis report</h1>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={resetReport}
                  className="rounded-full border border-white/15 bg-white/[0.05] px-5 py-2.5 text-sm text-white transition hover:bg-white/[0.12]"
                >
                  Analyze another file
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-cyan-200"
                >
                  <Download className="h-4 w-4" />
                  Export report
                </button>
              </div>
            </div>

            <ReportScene analysisResult={analysisResult} />
          </>
        )}
      </main>
    </div>
  );
}
