import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, ChevronRight, ChevronLeft, Download, Loader2,
  CheckCircle2, AlertTriangle, Scale, Shield, Pencil, RotateCw
} from 'lucide-react';
import { API_BASE_URL } from '../config';

const DOC_TYPES = [
  { id: 'Legal Notice', icon: '⚖️', desc: 'Formal demand or breach notification' },
  { id: 'Consumer Complaint', icon: '🛡️', desc: 'Consumer protection filing' },
  { id: 'Rental Agreement', icon: '🏠', desc: 'Lease / rental contract' },
  { id: 'Affidavit', icon: '📜', desc: 'Sworn statement of facts' },
  { id: 'Power of Attorney', icon: '🔑', desc: 'Legal authority delegation' },
  { id: 'Legal Opinion', icon: '📋', desc: 'Professional legal analysis' },
];

const TONES = ['Neutral', 'Assertive', 'Conciliatory', 'Formal', 'Aggressive'];

const STEPS = ['Document Type', 'Client Details', 'Case Description', 'Review & Generate'];

export default function DraftGenerator() {
  const [step, setStep] = useState(0);
  const [docType, setDocType] = useState('');
  const [clientName, setClientName] = useState('');
  const [opposingParty, setOpposingParty] = useState('');
  const [caseDescription, setCaseDescription] = useState('');
  const [firmName, setFirmName] = useState('');
  const [tone, setTone] = useState('Neutral');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const contentRef = useRef(null);

  const canProceed = () => {
    switch (step) {
      case 0: return !!docType;
      case 1: return !!clientName.trim() && !!opposingParty.trim();
      case 2: return caseDescription.trim().length >= 20;
      default: return true;
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const token = localStorage.getItem('jurisai_token');
      const res = await fetch(`${API_BASE_URL}/generate-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          doc_type: docType,
          client_name: clientName,
          opposing_party: opposingParty,
          case_description: caseDescription,
          firm_name: firmName,
          tone: tone,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Draft generation failed');
      }
      const data = await res.json();
      setResult(data);
      setStep(4); // Success view
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (result?.download_url) {
      // API_BASE_URL might be '/api' or 'https://api.example.com/api'
      // result.download_url is '/api/download-draft/xxx'
      const base = API_BASE_URL.replace(/\/api$/, '');
      window.open(`${base}${result.download_url}`, '_blank');
    }
  };

  const handleReset = () => {
    setStep(0);
    setDocType('');
    setClientName('');
    setOpposingParty('');
    setCaseDescription('');
    setFirmName('');
    setTone('Neutral');
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-12">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-6 h-6 text-orange-500" />
          <h1 className="text-3xl font-semibold tracking-tight">Draft Generator</h1>
        </div>
        <p className="text-sm text-zinc-500">
          Step-by-step guided legal document drafting powered by AI.
        </p>
      </div>

      {/* Progress Bar */}
      {step < 4 && (
        <div className="max-w-3xl mx-auto mb-10">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                  i < step ? 'bg-orange-500 text-white' :
                  i === step ? 'bg-zinc-100 text-zinc-900' :
                  'bg-zinc-800 text-zinc-500 border border-zinc-700'
                }`}>
                  {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-12 sm:w-24 h-px mx-2 transition-all ${i < step ? 'bg-orange-500' : 'bg-zinc-800'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            {STEPS.map((label, i) => (
              <span key={label} className={`text-[10px] uppercase tracking-widest ${i === step ? 'text-zinc-100' : 'text-zinc-600'}`}>
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className="max-w-3xl mx-auto"
        >
          {/* Step 0: Document Type */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-6">Select Document Type</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DOC_TYPES.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setDocType(doc.id)}
                    className={`p-5 rounded-xl border text-left transition-all group ${
                      docType === doc.id
                        ? 'bg-orange-500/10 border-orange-500 ring-1 ring-orange-500'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <div className="text-2xl mb-2">{doc.icon}</div>
                    <div className="text-sm font-medium text-zinc-100">{doc.id}</div>
                    <div className="text-xs text-zinc-500 mt-1">{doc.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Client Details */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-6">Client & Party Details</h2>
              
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Client / Applicant Name *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3.5 px-5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Opposing Party / Respondent *</label>
                <input
                  type="text"
                  value={opposingParty}
                  onChange={(e) => setOpposingParty(e.target.value)}
                  placeholder="e.g. ABC Pvt. Ltd."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3.5 px-5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Firm / Chamber Name <span className="text-zinc-600">(optional)</span></label>
                <input
                  type="text"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  placeholder="e.g. JurisAI Legal Associates"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3.5 px-5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-all"
                />
              </div>
            </div>
          )}

          {/* Step 2: Case Description */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-2">Describe the Case</h2>
              <p className="text-sm text-zinc-500 mb-6">
                Provide the factual background, dispute details, and relief sought. The more detail you provide, the better the draft.
              </p>

              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Case Description / Facts *</label>
                <textarea
                  value={caseDescription}
                  onChange={(e) => setCaseDescription(e.target.value)}
                  rows={8}
                  placeholder="Describe the factual background, the issue, any prior correspondence, and the relief you seek..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3.5 px-5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all resize-none"
                />
                <div className="flex justify-between mt-2 text-[11px] text-zinc-600">
                  <span>{caseDescription.length} characters</span>
                  <span>{caseDescription.length < 20 ? 'Min 20 characters required' : '✓ Sufficient'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-3">Drafting Tone</label>
                <div className="flex flex-wrap gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                        tone === t
                          ? 'bg-orange-500 text-white'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-500'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review & Generate */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-6">Review & Generate</h2>

              <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                  <span className="text-xs uppercase tracking-widest text-zinc-500">Document Type</span>
                  <span className="text-sm font-medium text-orange-400">{docType}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                  <span className="text-xs uppercase tracking-widest text-zinc-500">Client</span>
                  <span className="text-sm text-zinc-200">{clientName}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                  <span className="text-xs uppercase tracking-widest text-zinc-500">Opposing Party</span>
                  <span className="text-sm text-zinc-200">{opposingParty}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                  <span className="text-xs uppercase tracking-widest text-zinc-500">Tone</span>
                  <span className="text-sm text-zinc-200">{tone}</span>
                </div>
                {firmName && (
                  <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                    <span className="text-xs uppercase tracking-widest text-zinc-500">Firm</span>
                    <span className="text-sm text-zinc-200">{firmName}</span>
                  </div>
                )}
                <div>
                  <span className="text-xs uppercase tracking-widest text-zinc-500 block mb-2">Case Brief</span>
                  <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-800/50 p-4 rounded-lg">
                    {caseDescription.slice(0, 300)}{caseDescription.length > 300 ? '...' : ''}
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-red-950 border border-red-900/50 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 bg-orange-500 hover:bg-orange-400 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Draft...
                  </>
                ) : (
                  <>
                    <Pencil className="w-5 h-5" />
                    Generate Legal Draft
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 4: Result View */}
          {step === 4 && result && (
            <div className="space-y-6">
              {/* Success Header */}
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-semibold mb-1">Draft Generated Successfully</h2>
                <p className="text-sm text-zinc-500">
                  Draft ID: <span className="text-orange-400 font-mono">{result.draft_id}</span>
                </p>
              </div>

              {/* Draft Brief */}
              {result.draft_brief && (
                <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Draft Brief</h3>
                  <p className="text-sm text-zinc-300 leading-relaxed">{result.draft_brief}</p>
                </div>
              )}

              {/* Clause Notes */}
              {result.clause_notes?.length > 0 && (
                <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Clause Guidance</h3>
                  <div className="space-y-3">
                    {result.clause_notes.map((note, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-orange-400">{i + 1}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-zinc-200">{note.clause}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{note.guidance}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Flags */}
              {result.risk_flags?.length > 0 && (
                <div className="p-5 rounded-xl bg-amber-950/30 border border-amber-900/50">
                  <h3 className="text-xs uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Risk Flags
                  </h3>
                  <ul className="space-y-2">
                    {result.risk_flags.map((flag, i) => (
                      <li key={i} className="text-sm text-amber-200/80 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Open Questions */}
              {result.open_questions?.length > 0 && (
                <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Open Questions</h3>
                  <ul className="space-y-2">
                    {result.open_questions.map((q, i) => (
                      <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                        <span className="text-orange-400 font-mono text-xs mt-0.5">?</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview */}
              <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800">
                <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Draft Preview</h3>
                <pre className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto font-sans">
                  {result.preview_text?.slice(0, 2000)}
                  {(result.preview_text?.length || 0) > 2000 ? '\n\n[...truncated — download full PDF]' : ''}
                </pre>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-400 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download PDF
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 border border-zinc-700"
                >
                  <RotateCw className="w-4 h-4" />
                  New Draft
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      {step < 4 && (
        <div className="max-w-3xl mx-auto mt-10 flex justify-between items-center">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-6 py-3 bg-zinc-800 text-zinc-300 rounded-xl text-sm font-medium hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {step < 3 && (
            <button
              onClick={() => setStep((s) => Math.min(3, s + 1))}
              disabled={!canProceed()}
              className="px-6 py-3 bg-zinc-100 text-zinc-900 rounded-xl text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
