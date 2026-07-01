import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Database, Globe, Cpu, FileText, Sparkles, BookOpen, CheckCircle, Search, Layers, Network, Brain, Download, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../components/AuthContext';
import { useResearch } from '../components/ResearchContext';
import RuixenMoonChat from '../components/ui/ruixen-moon-chat';
import ContractAnalysisReport from '../components/ui/ContractAnalysisReport';

const PIPELINE_STAGES = [
  { icon: Database, label: 'Retrieving Statutes', sublabel: 'IPC, BNS' },
  { icon: Globe, label: 'Cross-Referencing', sublabel: 'SC Archives' },
  { icon: Cpu, label: 'Legal Synthesis', sublabel: 'Logical Reasoning' },
  { icon: CheckCircle, label: 'Finalizing Brief', sublabel: 'Roadmap' },
];

const DRAFT_COMMAND_PATTERN = /^\\generate\s+draft\b/i;

const DRAFT_QUESTION_FLOW = [
  {
    key: 'doc_type',
    prompt: 'Select a draft type',
    options: [
      { label: 'Legal Notice', value: 'Legal Notice' },
      { label: 'Consumer Complaint', value: 'Consumer Complaint' },
      { label: 'Rental Agreement', value: 'Rental Agreement' },
      { label: 'Affidavit', value: 'Affidavit' },
      { label: 'Power of Attorney', value: 'Power of Attorney' },
      { label: 'Legal Opinion', value: 'Legal Opinion' },
    ],
  },
  {
    key: 'tone',
    prompt: 'Select drafting tone',
    options: [
      { label: 'Neutral', value: 'Neutral' },
      { label: 'Formal', value: 'Formal' },
      { label: 'Aggressive', value: 'Aggressive' },
    ],
  },
  {
    key: 'client_name',
    prompt: 'Select client profile',
    options: [
      { label: 'Individual Client', value: 'Individual Client' },
      { label: 'Corporate Client', value: 'Corporate Client' },
      { label: 'Tenant Association', value: 'Tenant Association' },
      { label: 'Consumer Group', value: 'Consumer Group' },
    ],
  },
  {
    key: 'opposing_party',
    prompt: 'Select opposing party',
    options: [
      { label: 'Individual Respondent', value: 'Individual Respondent' },
      { label: 'Private Company', value: 'Private Company' },
      { label: 'Government Authority', value: 'Government Authority' },
      { label: 'Landlord/Property Owner', value: 'Landlord/Property Owner' },
    ],
  },
  {
    key: 'case_description',
    prompt: 'Select matter summary',
    options: [
      { label: 'Contract breach dispute', value: 'Dispute concerns breach of contractual obligations, non-performance, and claim for damages with immediate legal notice required.' },
      { label: 'Consumer deficiency claim', value: 'Matter concerns deficiency in service and unfair trade practice, with documentary evidence and prayer for compensation and corrective relief.' },
      { label: 'Property possession issue', value: 'Matter concerns possession and occupancy rights, unlawful interference, and request for injunction and restoration of lawful possession.' },
      { label: 'Employment dues claim', value: 'Matter concerns unpaid dues, statutory non-compliance, and demand for payment with legal consequences for continued default.' },
    ],
  },
];

const EMPTY_DRAFT_FLOW = {
  active: false,
  stepIndex: 0,
  answers: {},
  isGenerating: false,
  error: '',
  result: null,
};

export default function LegalResearch() {
  const { 
    query, setQuery, isSearching, isSynthesizing, hasSearched, 
    results, fullData, pipelineStage, handleSearch, viewDeepAnalysis,
    isAnalyzing, analysisResult, handleFileUpload, clearAnalysis
  } = useResearch();

  const { token, user } = useAuth();
  const [draftFlow, setDraftFlow] = useState(EMPTY_DRAFT_FLOW);
  const [deepResearch, setDeepResearch] = useState(null);
  const deepPollRef = useRef(null);

  const activeDraftQuestion = useMemo(
    () => (draftFlow.active ? DRAFT_QUESTION_FLOW[draftFlow.stepIndex] : null),
    [draftFlow.active, draftFlow.stepIndex]
  );

  const buildDraftSummary = (body) => {
    if (body?.draft_brief) return body.draft_brief;
    const draftText = body?.generated_draft || body?.preview_text || '';
    return draftText
      .replace(/\s+/g, ' ')
      .trim()
      .split('.')
      .slice(0, 2)
      .join('. ')
      .trim() || 'Draft generated successfully.';
  };

  const generateFromAnswers = async (answers) => {
    setDraftFlow((prev) => ({
      ...prev,
      isGenerating: true,
      error: '',
      result: null,
    }));

    try {
      const response = await fetch('/api/generate-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          doc_type: answers.doc_type,
          client_name: answers.client_name,
          opposing_party: answers.opposing_party || 'N/A',
          case_description: answers.case_description,
          firm_name: user?.firm_name || '',
          tone: answers.tone || 'Neutral',
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      const body = contentType.includes('application/json') ? await response.json() : null;

      if (!response.ok) {
        const message = body?.detail || 'Draft generation failed.';
        throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
      }

      setDraftFlow((prev) => ({
        ...prev,
        isGenerating: false,
        result: {
          ...body,
          quick_summary: buildDraftSummary(body),
        },
      }));
    } catch (error) {
      setDraftFlow((prev) => ({
        ...prev,
        isGenerating: false,
        error: error.message || 'Unable to generate draft.',
      }));
    }
  };

  const startDraftFlow = () => {
    setDraftFlow({
      ...EMPTY_DRAFT_FLOW,
      active: true,
    });
  };

  const handleDraftOptionSelect = (value) => {
    if (!activeDraftQuestion || draftFlow.isGenerating) return;

    const nextAnswers = {
      ...draftFlow.answers,
      [activeDraftQuestion.key]: value,
    };
    const isLastQuestion = draftFlow.stepIndex >= DRAFT_QUESTION_FLOW.length - 1;

    if (isLastQuestion) {
      setDraftFlow((prev) => ({
        ...prev,
        answers: nextAnswers,
      }));
      generateFromAnswers(nextAnswers);
      return;
    }

    setDraftFlow((prev) => ({
      ...prev,
      answers: nextAnswers,
      stepIndex: prev.stepIndex + 1,
    }));
  };

  const resetDraftFlow = () => {
    setDraftFlow(EMPTY_DRAFT_FLOW);
  };

  const DEEP_PHASES = [
    { icon: Search, label: 'Broad Discovery', sublabel: 'Multi-angle search' },
    { icon: Globe, label: 'Content Extraction', sublabel: 'Reading sources' },
    { icon: Network, label: 'Iterative Deepening', sublabel: 'Following references' },
    { icon: Layers, label: 'Thematic Expansion', sublabel: 'Adjacent topics' },
    { icon: Brain, label: 'LLM Synthesis', sublabel: 'Producing report' },
  ];

  const startDeepResearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setDeepResearch({ status: 'starting', progress: 0, phase: 'Launching research team...', sourcesFound: 0, sources: [], synthesis: null, error: null, taskId: null });

    try {
      const resp = await fetch('/api/research/deep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ query: trimmed, max_sources: 30 }),
      });
      if (!resp.ok) throw new Error('Failed to launch deep research');
      const data = await resp.json();
      setDeepResearch((prev) => ({ ...prev, taskId: data.task_id, status: 'running' }));
      pollDeepTask(data.task_id);
    } catch (err) {
      setDeepResearch((prev) => ({ ...prev, status: 'error', error: err.message }));
    }
  };

  const pollDeepTask = useCallback((taskId) => {
    let attempts = 0;
    const poll = async () => {
      if (attempts > 180) {
        setDeepResearch((prev) => ({ ...prev, status: 'error', error: 'Research timed out (5 min)' }));
        return;
      }
      attempts++;
      try {
        const resp = await fetch(`/api/research/deep/status/${taskId}`);
        if (!resp.ok) throw new Error('Poll failed');
        const data = await resp.json();
        setDeepResearch((prev) => ({
          ...prev,
          status: data.status,
          progress: data.progress,
          phase: data.phase,
          sourcesFound: data.sources_found,
          sources: data.sources || prev.sources,
          synthesis: data.synthesis || prev.synthesis,
          error: data.error || null,
        }));
        if (data.status === 'running' || data.status === 'starting') {
          deepPollRef.current = setTimeout(poll, 1500);
        }
      } catch (err) {
        setDeepResearch((prev) => ({ ...prev, status: 'error', error: err.message }));
      }
    };
    deepPollRef.current = setTimeout(poll, 1500);
  }, []);

  useEffect(() => {
    return () => { if (deepPollRef.current) clearTimeout(deepPollRef.current); };
  }, []);

  const cancelDeepResearch = () => {
    if (deepPollRef.current) clearTimeout(deepPollRef.current);
    setDeepResearch(null);
  };

  const handlePrimaryAction = () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    if (DRAFT_COMMAND_PATTERN.test(trimmed)) {
      setQuery('');
      startDraftFlow();
      return;
    }

    if (draftFlow.active) return;
    handleSearch(trimmed, token);
  };

  const currentPhaseIndex = deepResearch ? Math.min(
    Math.floor(deepResearch.progress / 20),
    DEEP_PHASES.length - 1
  ) : 0;

  if (analysisResult) {
    return (
      <ContractAnalysisReport 
        analysisResult={analysisResult} 
        onReset={clearAnalysis}
        onExport={() => window.print()}
      />
    );
  }

  if ((draftFlow.active || (!hasSearched && !isSearching)) && !isAnalyzing) {
    return (
      <main className="min-h-screen w-full bg-black text-white selection:bg-neutral-800">
        <section className="flex justify-center items-start w-full">
          <RuixenMoonChat 
            query={query}
            setQuery={setQuery}
            onSearch={handlePrimaryAction}
            onFileSelect={(file) => handleFileUpload(file, token)}
            disabled={isSearching || isSynthesizing || isAnalyzing || draftFlow.isGenerating}
            commandHint="Type \\generate draft to start guided drafting"
            commandMode={
              draftFlow.active
                ? {
                    prompt: draftFlow.result
                      ? 'Draft generated. You can restart the flow anytime.'
                      : activeDraftQuestion?.prompt || 'Select an option to continue',
                    options: draftFlow.result
                      ? []
                      : (activeDraftQuestion?.options || []),
                    onOptionSelect: handleDraftOptionSelect,
                    isBusy: draftFlow.isGenerating,
                    error: draftFlow.error,
                    summary: draftFlow.result?.quick_summary,
                    preview: draftFlow.result?.generated_draft || draftFlow.result?.preview_text,
                    onReset: resetDraftFlow,
                    stepLabel: draftFlow.result
                      ? 'Completed'
                      : `Question ${draftFlow.stepIndex + 1} of ${DRAFT_QUESTION_FLOW.length}`,
                  }
                : null
            }
          />
        </section>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-start pt-24 pb-24 relative font-sans text-foreground">
      <div className="w-full max-w-[860px] mx-auto px-6 relative z-10">

        {/* Deep Research Results View */}
        {(deepResearch?.status === 'completed' || deepResearch?.status === 'error') && deepResearch?.synthesis ? (
          <div className="w-full mb-10">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <Brain className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Deep Research Report</h2>
                {deepResearch.status === 'error' && <span className="text-xs text-amber-500">(partial — LLM unavailable)</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-zinc-600">{deepResearch.sourcesFound} sources</span>
                <button onClick={cancelDeepResearch} className="text-xs text-zinc-500 hover:text-white transition-colors">New Research</button>
              </div>
            </div>
            <article className="text-[15px] leading-[1.8] text-zinc-300">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({children}) => <h2 className="text-lg font-semibold text-white mt-6 mb-2">{children}</h2>,
                  h3: ({children}) => <h3 className="text-base font-semibold text-zinc-200 mt-4 mb-2">{children}</h3>,
                  p: ({children}) => <p className="text-[15px] leading-[1.8] text-zinc-300 mb-4">{children}</p>,
                  strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                  ul: ({children}) => <ul className="list-disc list-outside ml-5 mb-4 space-y-1.5">{children}</ul>,
                  ol: ({children}) => <ol className="list-decimal list-outside ml-5 mb-4 space-y-1.5">{children}</ol>,
                  li: ({children}) => <li className="text-[15px] leading-[1.7] text-zinc-300 pl-1">{children}</li>,
                  hr: () => <hr className="border-zinc-800 my-6" />,
                  a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline underline-offset-2 decoration-zinc-600 hover:decoration-emerald-400 transition-colors">{children}</a>,
                  blockquote: ({children}) => <blockquote className="border-l-2 border-zinc-600 pl-4 my-4 text-zinc-400 italic">{children}</blockquote>,
                  table: ({children}) => <div className="overflow-x-auto my-4 border border-zinc-800 rounded-lg"><table className="w-full text-sm">{children}</table></div>,
                  thead: ({children}) => <thead className="bg-zinc-900 text-zinc-400">{children}</thead>,
                  th: ({children}) => <th className="px-4 py-2.5 text-left font-medium text-xs uppercase tracking-wider border-b border-zinc-800">{children}</th>,
                  td: ({children}) => <td className="px-4 py-2.5 text-zinc-300 border-b border-zinc-800/50">{children}</td>,
                  code: ({inline, children}) => inline ? <code className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-200 text-[13px] font-mono">{children}</code> : <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto my-4 text-[13px] font-mono text-zinc-300"><code>{children}</code></pre>,
                }}
              >
                {deepResearch.synthesis}
              </ReactMarkdown>
            </article>
          </div>
        ) : null}

        {/* Deep Research Progress */}
        {deepResearch && deepResearch.status !== 'completed' && (
          <div className="w-full mb-8">
            {/* Phase Timeline */}
            <div className="border border-zinc-800 rounded-lg bg-zinc-900/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-zinc-700 border-t-emerald-400 rounded-full animate-spin" />
                  <span className="text-sm font-medium text-zinc-200">Deep Research in Progress</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-zinc-500">{deepResearch.sourcesFound} sources</span>
                  <span className="text-xs text-zinc-500">{deepResearch.progress}%</span>
                  <button onClick={cancelDeepResearch} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline">Cancel</button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full bg-zinc-800 rounded-full mb-5 overflow-hidden">
                <Motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${deepResearch.progress}%` }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Phase steps */}
              <div className="space-y-2">
                {DEEP_PHASES.map((phase, i) => {
                  const isActive = i === currentPhaseIndex;
                  const isDone = i < currentPhaseIndex;
                  const PhaseIcon = phase.icon;
                  return (
                    <div key={phase.label} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-zinc-800/60 border border-zinc-700' : ''}`}>
                      <div className={`p-1 rounded ${isDone ? 'text-emerald-400 bg-emerald-500/10' : isActive ? 'text-emerald-400' : 'text-zinc-600'}`}>
                        {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : <PhaseIcon className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1">
                        <span className={`text-xs font-medium ${isActive ? 'text-white' : isDone ? 'text-zinc-400' : 'text-zinc-600'}`}>
                          {phase.label}
                        </span>
                        {isActive && <span className="text-[10px] text-zinc-500 ml-2">— {deepResearch.phase}</span>}
                      </div>
                      <span className={`text-[10px] font-mono ${isDone ? 'text-emerald-500' : isActive ? 'text-emerald-400' : 'text-zinc-700'}`}>
                        {isDone ? 'DONE' : isActive ? 'ACTIVE' : 'WAIT'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live sources preview */}
            {deepResearch.sources?.length > 0 && (
              <div className="mt-4 border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Discovered Sources</h3>
                  <span className="text-[10px] font-mono text-zinc-600">{deepResearch.sourcesFound} total</span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {deepResearch.sources.slice(0, 10).map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                      <span className="w-1 h-1 rounded-full bg-zinc-600 shrink-0" />
                      <span className="text-zinc-400 truncate">{s.title}</span>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-zinc-400 shrink-0 ml-auto">↗</a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {deepResearch.status === 'error' && (
              <div className="mt-4 flex items-center gap-2 text-xs text-amber-500 bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-3">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{deepResearch.error || 'An error occurred during research.'}</span>
              </div>
            )}
          </div>
        )}

        {/* Search Bar */}
        <div className="w-full mb-10 sticky top-20 z-50">
          <div className="relative bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-lg p-1.5 flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isSearching && handlePrimaryAction()}
              placeholder="Search statutes, precedents, procedures…"
              className="w-full bg-transparent px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600"
            />
            <button
              disabled={isSearching || isSynthesizing || (deepResearch?.status === 'running')}
              onClick={handlePrimaryAction}
              className="bg-white text-zinc-900 px-5 py-2 rounded-md font-medium text-sm disabled:opacity-40 transition-opacity shrink-0"
            >
              Search
            </button>
            <button
              disabled={isSearching || isSynthesizing || (deepResearch?.status === 'running')}
              onClick={startDeepResearch}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md font-medium text-sm disabled:opacity-40 hover:bg-emerald-500 transition-all shrink-0 flex items-center gap-1.5"
            >
              <Brain className="w-3.5 h-3.5" />
              Deep
            </button>
          </div>
        </div>

        {/* Pipeline Loading */}
        <AnimatePresence>
          {(isSearching || isSynthesizing || isAnalyzing) && (
            <Motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="w-full mb-8 border border-zinc-800 rounded-lg bg-zinc-900/50 px-5 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin" />
                <span className="text-sm text-zinc-300 font-medium">
                  {isAnalyzing ? 'Extracting document intelligence…' : 'Researching statutes & precedents…'}
                </span>
              </div>
              <span className="text-[11px] text-zinc-600 font-mono tracking-wide">
                {isAnalyzing ? 'EXTRACTION' : (PIPELINE_STAGES[pipelineStage]?.label?.toUpperCase() || 'SYNTHESIS')}
              </span>
            </Motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {hasSearched && !isSearching && (fullData?.synthesis || results.length > 0) && (
            <Motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-0"
            >
              {/* ─── Answer Section ─── */}
              {fullData?.synthesis && (
                <div className="mb-10">
                  {/* Section Header */}
                  <div className="flex items-center gap-3 mb-5 pb-3 border-b border-zinc-800">
                    <FileText className="w-4 h-4 text-zinc-500" />
                    <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Legal Research Memorandum</h2>
                  </div>

                  {/* Markdown Body */}
                  <article className={`transition-opacity duration-300 ${isSynthesizing ? 'opacity-50' : 'opacity-100'}`}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({children}) => <h1 className="text-xl font-bold text-white mt-6 mb-3 pb-2 border-b border-zinc-800">{children}</h1>,
                        h2: ({children}) => <h2 className="text-lg font-semibold text-white mt-6 mb-2">{children}</h2>,
                        h3: ({children}) => <h3 className="text-base font-semibold text-zinc-200 mt-4 mb-2">{children}</h3>,
                        p: ({children}) => <p className="text-[15px] leading-[1.8] text-zinc-300 mb-4">{children}</p>,
                        strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                        em: ({children}) => <em className="text-zinc-400 italic">{children}</em>,
                        ul: ({children}) => <ul className="list-disc list-outside ml-5 mb-4 space-y-1.5">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-outside ml-5 mb-4 space-y-1.5">{children}</ol>,
                        li: ({children}) => <li className="text-[15px] leading-[1.7] text-zinc-300 pl-1">{children}</li>,
                        hr: () => <hr className="border-zinc-800 my-6" />,
                        blockquote: ({children}) => (
                          <blockquote className="border-l-2 border-zinc-600 pl-4 my-4 text-zinc-400 italic">
                            {children}
                          </blockquote>
                        ),
                        table: ({children}) => (
                          <div className="overflow-x-auto my-4 border border-zinc-800 rounded-lg">
                            <table className="w-full text-sm">{children}</table>
                          </div>
                        ),
                        thead: ({children}) => <thead className="bg-zinc-900 text-zinc-400">{children}</thead>,
                        th: ({children}) => <th className="px-4 py-2.5 text-left font-medium text-xs uppercase tracking-wider border-b border-zinc-800">{children}</th>,
                        td: ({children}) => <td className="px-4 py-2.5 text-zinc-300 border-b border-zinc-800/50">{children}</td>,
                        a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-zinc-200 underline underline-offset-2 decoration-zinc-600 hover:decoration-zinc-400 transition-colors">{children}</a>,
                        code: ({inline, children}) => inline
                          ? <code className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-200 text-[13px] font-mono">{children}</code>
                          : <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto my-4 text-[13px] font-mono text-zinc-300"><code>{children}</code></pre>,
                      }}
                    >
                      {fullData.synthesis}
                    </ReactMarkdown>
                  </article>

                  {/* View Full Report Button */}
                  <div className="mt-6 pt-4 border-t border-zinc-800">
                    <button
                      onClick={() => viewDeepAnalysis(fullData, query)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-zinc-900 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Full Report
                    </button>
                  </div>
                </div>
              )}

              {/* ─── Sources Section ─── */}
              {results.length > 0 && (
                <div className="pt-6 border-t border-zinc-800">
                  <div className="flex items-center gap-3 mb-4">
                    <BookOpen className="w-4 h-4 text-zinc-500" />
                    <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Cited Authorities</h2>
                    <span className="text-[11px] font-mono text-zinc-600 ml-auto">{results.length} sources</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {results.slice(0, 6).map((res, i) => (
                      <div
                        key={i}
                        onClick={() => viewDeepAnalysis(fullData, query)}
                        className="group bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 hover:bg-zinc-900 transition-all cursor-pointer"
                      >
                        <h4 className="text-sm text-zinc-200 font-medium leading-snug mb-2 group-hover:text-white transition-colors line-clamp-2">
                          {res.case_title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-600 font-mono">
                          {res.court && <span>{res.court}</span>}
                          {res.court && res.year && <span>·</span>}
                          {res.year && <span>{res.year}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
