import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  Gavel,
  Layers3,
  Scale,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const REPORT_TABS = ['Overview', 'Risks & Fixes', 'Structure'];

function toneForRisk(score) {
  if (score >= 80) return 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10';
  if (score >= 60) return 'text-amber-200 border-amber-400/30 bg-amber-500/10';
  return 'text-rose-200 border-rose-400/30 bg-rose-500/10';
}

function buildKeyFindings(analysisResult) {
  const findings = [];
  const weakPoints = analysisResult?.weak_points || [];
  const actions = analysisResult?.recommended_actions || [];
  const strategic = analysisResult?.neural_analysis?.strategic_insights || [];

  weakPoints.slice(0, 2).forEach((item) => {
    findings.push(`${item.title}: ${item.issue}`);
  });
  actions.slice(0, 2).forEach((item) => findings.push(item));
  strategic.slice(0, 2).forEach((item) => findings.push(item));

  const cleaned = findings
    .map((item) => String(item || '').replace(/^(CRITICAL ALERT:|WARNING:)\s*/i, '').trim())
    .filter(Boolean);

  return [...new Set(cleaned)].slice(0, 6);
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs leading-5 text-slate-400">{hint}</div>
    </div>
  );
}

export default function ContractAnalysisReport({ analysisResult, onReset, onExport, onBack }) {
  const [activeTab, setActiveTab] = useState(REPORT_TABS[0]);

  const riskClass = toneForRisk(analysisResult?.risk_score ?? 100);
  const structuralMap = analysisResult?.neural_analysis?.structural_map || {};
  const missingElements = analysisResult?.neural_analysis?.missing_elements || [];
  const fixes = analysisResult?.fixing_solutions || [];
  const weakPoints = analysisResult?.weak_points || [];
  const overview = analysisResult?.report_overview || {};
  const keyFindings = useMemo(() => buildKeyFindings(analysisResult), [analysisResult]);

  const topInsights = useMemo(() => {
    const actions = analysisResult?.recommended_actions || [];
    const strategic = analysisResult?.neural_analysis?.strategic_insights || [];
    return [...actions, ...strategic].slice(0, 5);
  }, [analysisResult]);

  return (
    <div className="min-h-screen bg-[#060b14] text-slate-100">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.12),transparent_28%),linear-gradient(180deg,#060b14_0%,#0a1220_45%,#050911_100%)]" />
      <main className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-24">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Contract Analyzer</div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Legal analysis report
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
              A structured review of the uploaded legal paper, covering executive summary, risk points, remediation suggestions, and structural completeness.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => (onBack ? onBack() : onReset?.())}
              className="border-white/15 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08] hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              className="border-white/15 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08] hover:text-white"
            >
              New Scan
            </Button>
            <Button type="button" onClick={onExport} className="bg-white text-slate-950 hover:bg-slate-200">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]"
        >
          <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <Card className="border-white/10 bg-[#0b1320]/90 shadow-[0_22px_90px_rgba(0,0,0,0.32)]">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline" className="border-white/10 bg-white/[0.04] text-slate-300">
                    {analysisResult?.document_type?.type || 'Document'}
                  </Badge>
                  <Badge className={cn('border', riskClass)}>
                    Risk {analysisResult?.risk_score ?? 0}/100
                  </Badge>
                </div>
                <CardTitle className="text-2xl text-white">Snapshot</CardTitle>
                <CardDescription className="text-slate-400">
                  Confidence {analysisResult?.analysis_confidence ?? analysisResult?.document_type?.confidence ?? 0}% • {analysisResult?.total_words?.toLocaleString() || 0} words
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Stat label="Completeness" value={`${analysisResult?.completeness?.score ?? 0}%`} hint="Expected legal components present." />
                <Stat label="Drafting" value={`${analysisResult?.language_quality?.score ?? 0}/100`} hint="Clarity and ambiguity assessment." />
                <Stat label="Integrity" value={`${analysisResult?.neural_analysis?.structural_integrity_score ?? 0}/100`} hint="Overall structural health of the paper." />
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#0b1320]/90">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white">Readiness</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-slate-300">
                <p>{overview.readiness}</p>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Purpose</div>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{overview.purpose}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-[#0b1320]/90">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white">Top actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topInsights.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300">
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,21,33,0.96),rgba(9,14,24,0.96))] p-8 shadow-[0_22px_100px_rgba(0,0,0,0.36)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-slate-400">
                    <Scale className="h-3.5 w-3.5" />
                    Executive Summary
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold text-white">Professional review output</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {REPORT_TABS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        'rounded-full border px-4 py-2 text-sm transition',
                        activeTab === tab
                          ? 'border-white/20 bg-white text-slate-950'
                          : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.08]'
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 grid gap-4">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Case assessment</div>
                  <p className="mt-3 text-[15px] leading-8 text-slate-200">
                    {overview.readiness || analysisResult?.summary || 'Analysis completed.'}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Key findings</div>
                  {keyFindings.length > 0 ? (
                    <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-200">
                      {keyFindings.map((item, index) => (
                        <li key={`${item}-${index}`} className="flex items-start gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      No critical findings were generated. Review risks and structure tabs for detailed checks.
                    </p>
                  )}
                </div>
                {analysisResult?.neural_analysis?.neural_audit && (
                  <details className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
                    <summary className="cursor-pointer text-[11px] uppercase tracking-[0.24em] text-slate-400">
                      Engine narrative (detailed)
                    </summary>
                    <p className="mt-4 text-sm leading-7 text-slate-300">
                      {analysisResult.neural_analysis.neural_audit}
                    </p>
                  </details>
                )}
              </div>
            </motion.div>

            {activeTab === 'Overview' && (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-white/10 bg-[#0b1320]/90">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-300" />
                      <CardTitle className="text-xl text-white">Strengths</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(analysisResult?.strengths || []).map((item, index) => (
                      <div key={index} className="flex items-start gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.06] p-4 text-sm leading-7 text-slate-200">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-[#0b1320]/90">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-sky-300" />
                      <CardTitle className="text-xl text-white">Core obligations</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(analysisResult?.core_obligations || []).length > 0 ? (
                      (analysisResult?.core_obligations || []).map((item, index) => (
                        <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-slate-200">
                          {item}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-slate-400">
                        No clear obligation clauses were confidently extracted from this document.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-[#0b1320]/90 lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-violet-300" />
                      <CardTitle className="text-xl text-white">Extracted entities</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300">
                      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Parties</div>
                      <div className="mt-2">{(analysisResult?.entities?.parties || []).join(', ') || 'None detected'}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300">
                      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Dates</div>
                      <div className="mt-2">{(analysisResult?.entities?.dates || []).join(', ') || 'None detected'}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300">
                      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Amounts</div>
                      <div className="mt-2">{(analysisResult?.entities?.amounts || []).join(', ') || 'None detected'}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300">
                      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Sections cited</div>
                      <div className="mt-2">{(analysisResult?.entities?.sections_cited || []).join(', ') || 'None detected'}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'Risks & Fixes' && (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-white/10 bg-[#0b1320]/90">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-rose-300" />
                      <CardTitle className="text-xl text-white">Weak points</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {weakPoints.length > 0 ? weakPoints.map((item, index) => (
                      <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-base font-medium text-white">{item.title}</div>
                          <Badge className={cn('border capitalize', toneForRisk(item.severity === 'critical' || item.severity === 'high' ? 30 : item.severity === 'medium' ? 65 : 85))}>
                            {item.severity}
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-200">{item.issue}</p>
                        <p className="mt-2 text-sm leading-7 text-slate-400">{item.impact}</p>
                      </div>
                    )) : (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                        No major weak points were extracted.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-[#0b1320]/90">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Gavel className="h-5 w-5 text-sky-300" />
                      <CardTitle className="text-xl text-white">Fixing solutions</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {fixes.map((item, index) => (
                      <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex items-center gap-3">
                          <div className="text-base font-medium text-white">{item.issue}</div>
                          <Badge variant="outline" className="border-sky-400/20 bg-sky-500/10 text-sky-200">
                            {item.priority}
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-200">{item.solution}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'Structure' && (
              <div className="grid gap-6">
                <Card className="border-white/10 bg-[#0b1320]/90">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Layers3 className="h-5 w-5 text-violet-300" />
                      <CardTitle className="text-xl text-white">Structural review</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 lg:grid-cols-2">
                    {Object.entries(structuralMap).map(([key, value]) => (
                      <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{key}</div>
                        <p className="mt-3 text-sm leading-7 text-slate-200">{value}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="border-white/10 bg-[#0b1320]/90">
                    <CardHeader>
                      <CardTitle className="text-xl text-white">Section breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(analysisResult?.section_breakdown || []).map((item, index) => (
                        <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <div className="text-base font-medium text-white">{item.title}</div>
                          <p className="mt-2 text-sm leading-7 text-slate-400">{item.summary}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="border-white/10 bg-[#0b1320]/90">
                    <CardHeader>
                      <CardTitle className="text-xl text-white">Completeness check</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(analysisResult?.completeness?.checklist || []).map((item, index) => (
                        <div key={index} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
                          <span className={cn('text-slate-200', !item.present && 'text-slate-500 line-through')}>{item.item}</span>
                          <span className={cn('h-2.5 w-2.5 rounded-full', item.present ? 'bg-emerald-400' : 'bg-rose-400')} />
                        </div>
                      ))}

                      {missingElements.length > 0 && missingElements[0] !== 'All standard components present for this document type' && (
                        <div className="rounded-2xl border border-rose-400/15 bg-rose-500/[0.06] p-4">
                          <div className="text-[11px] uppercase tracking-[0.24em] text-rose-200">Missing elements</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {missingElements.map((item, index) => (
                              <Badge key={index} className="border border-rose-400/20 bg-rose-500/10 text-rose-100">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </motion.section>
      </main>
    </div>
  );
}
