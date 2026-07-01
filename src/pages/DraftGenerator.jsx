import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, ChevronRight, ChevronLeft, Download, Loader2,
  CheckCircle2, AlertTriangle, Scale, Shield, Pencil, RotateCw,
  Sparkles, Users, Plus, Trash2, Upload, ArrowUp,
  Zap, Lightbulb
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

const TONES = ['Neutral', 'Formal', 'Assertive', 'Conciliatory', 'Aggressive'];

const MODES = [
  'Describe your need',
  'AI understands',
  'Details',
  'Review & Generate',
];

const EXAMPLES = [
  'I need to send breach notices to 12 tenants who haven\'t paid rent for 3 months at my property in Andheri, Mumbai. Each owes ₹45,000.',
  'Draft a consumer complaint against Flipkart for a defective laptop purchased on Jan 15, 2026. I want a full refund of ₹65,000.',
  'Create a rental agreement for my commercial property in Bangalore. Monthly rent ₹1,20,000, 3-year lock-in, maintenance extra.',
  'Generate 5 legal opinion letters for different clients regarding property dispute cases in Delhi High Court.',
];

async function apiFetch(path, body) {
  const token = localStorage.getItem('legalforge_token');
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export default function DraftGenerator() {
  const [mode, setMode] = useState(0);
  const [intentText, setIntentText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [intent, setIntent] = useState(null);

  const [docType, setDocType] = useState('');
  const [tone, setTone] = useState('Neutral');
  const [firmName, setFirmName] = useState('');
  const [caseDescription, setCaseDescription] = useState('');
  const [templateMods, setTemplateMods] = useState([]);

  const [entries, setEntries] = useState([]);
  const [isBulk, setIsBulk] = useState(false);
  const [bulkLabel, setBulkLabel] = useState('recipient');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingIndex, setGeneratingIndex] = useState(-1);
  const [result, setResult] = useState(null);
  const [bulkResult, setBulkResult] = useState(null);
  const [error, setError] = useState('');
  const [editingEntry, setEditingEntry] = useState(null);
  const fileInputRef = useRef(null);

  const TONE_COLORS = {
    Neutral: 'text-zinc-300',
    Formal: 'text-blue-400',
    Assertive: 'text-orange-400',
    Conciliatory: 'text-green-400',
    Aggressive: 'text-red-400',
  };

  const analyzeIntent = async () => {
    if (!intentText.trim()) return;
    setAnalyzing(true);
    setError('');
    try {
      const data = await apiFetch('/draft/understand-intent', {
        description: intentText,
        firm_name: firmName,
      });
      setIntent(data);
      setDocType(data.suggested_doc_type);
      setTone(data.suggested_tone);
      setIsBulk(data.is_bulk);
      setBulkLabel(data.bulk_entity_label || 'recipient');
      setTemplateMods(data.template_modifications || []);
      setCaseDescription(intentText);

      if (data.is_bulk && data.extracted_parties?.length > 1) {
        setEntries(data.extracted_parties.map((name) => ({
          client_name: name,
          opposing_party: '',
          variables: {},
        })));
      } else if (data.extracted_parties?.length > 0) {
        setEntries([{
          client_name: data.extracted_parties[0],
          opposing_party: '',
          variables: {},
        }]);
      } else {
        setEntries([{ client_name: '', opposing_party: '', variables: {} }]);
      }

      setMode(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const confirmIntent = () => {
    if (isBulk) {
      setMode(2);
    } else {
      setMode(2);
    }
  };

  const addEntry = () => {
    setEntries([...entries, { client_name: '', opposing_party: '', variables: {} }]);
  };

  const removeEntry = (idx) => {
    setEntries(entries.filter((_, i) => i !== idx));
  };

  const updateEntry = (idx, field, value) => {
    const updated = [...entries];
    updated[idx] = { ...updated[idx], [field]: value };
    setEntries(updated);
  };

  const updateEntryVar = (idx, key, value) => {
    const updated = [...entries];
    updated[idx] = { ...updated[idx], variables: { ...updated[idx].variables, [key]: value } };
    setEntries(updated);
  };

  const handleCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result || '';
      const lines = text.split('\n').filter((l) => l.trim());
      const csvHeaders = lines[0].split(',').map((h) => h.trim());
      const rows = lines.slice(1).map((line) => {
        const vals = line.split(',').map((v) => v.trim());
        const entry = { client_name: vals[0] || '', opposing_party: vals[1] || '', variables: {} };
        csvHeaders.forEach((h, i) => {
          if (i >= 2 && vals[i]) entry.variables[h] = vals[i];
        });
        return entry;
      });
      setEntries(rows);
    };
    reader.readAsText(file);
  };

  const handleBulkGenerate = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const data = await apiFetch('/draft/bulk-generate', {
        doc_type: docType,
        entries: entries.map((e) => ({
          client_name: e.client_name,
          opposing_party: e.opposing_party,
          variables: e.variables,
        })),
        case_description: caseDescription,
        firm_name: firmName,
        tone: tone,
        template_modifications: templateMods,
      });
      setBulkResult(data);
      setMode(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSingleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const data = await apiFetch('/generate-draft', {
        doc_type: docType,
        client_name: entries[0]?.client_name || '',
        opposing_party: entries[0]?.opposing_party || '',
        case_description: caseDescription,
        firm_name: firmName,
        tone: tone,
      });
      setResult(data);
      setMode(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (url) => {
    const base = API_BASE_URL.replace(/\/api$/, '');
    window.open(`${base}${url}`, '_blank');
  };

  const handleReset = () => {
    setMode(0);
    setIntentText('');
    setIntent(null);
    setDocType('');
    setTone('Neutral');
    setFirmName('');
    setCaseDescription('');
    setTemplateMods([]);
    setEntries([]);
    setIsBulk(false);
    setResult(null);
    setBulkResult(null);
    setError('');
  };

  const canProceedDetails = () => {
    if (isBulk) {
      return entries.every((e) => e.client_name.trim());
    }
    return entries[0]?.client_name?.trim() && caseDescription.trim().length >= 10;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto mb-12">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-6 h-6 text-orange-500" />
          <h1 className="text-3xl font-semibold tracking-tight">Draft Generator</h1>
          {intent?.is_bulk && (
            <span className="ml-3 px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-full text-xs font-medium text-orange-400 flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> BULK
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-500">
          {mode === 0 ? 'Describe what you need in plain language — AI handles the rest.' :
           mode === 1 ? 'Review AI\'s understanding of your requirement.' :
           mode === 2 ? (isBulk ? 'Configure batch recipients and variables.' : 'Fill in the details.') :
           mode === 3 ? 'Review everything before generating.' :
           'Generated successfully.'}
        </p>
      </div>

      {mode < 4 && (
        <div className="max-w-3xl mx-auto mb-10">
          <div className="flex items-center justify-between mb-3">
            {MODES.map((label, i) => (
              <div key={label} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                  i < mode ? 'bg-orange-500 text-white' :
                  i === mode ? 'bg-zinc-100 text-zinc-900' :
                  'bg-zinc-800 text-zinc-500 border border-zinc-700'
                }`}>
                  {i < mode ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                {i < MODES.length - 1 && (
                  <div className={`w-8 sm:w-16 h-px mx-1 sm:mx-2 transition-all ${i < mode ? 'bg-orange-500' : 'bg-zinc-800'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            {MODES.map((label, i) => (
              <span key={label} className={`text-[9px] sm:text-[10px] uppercase tracking-widest ${i === mode ? 'text-zinc-100' : 'text-zinc-600'}`}>
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
          className="max-w-4xl mx-auto"
        >
          {mode === 0 && (
            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-orange-400" />
                  <h2 className="text-lg font-semibold">What do you need drafted?</h2>
                </div>
                <p className="text-sm text-zinc-500 mb-4">
                  Describe your requirement in natural language. Include parties, amounts, dates, and whether this is for one or multiple recipients.
                </p>
                <textarea
                  value={intentText}
                  onChange={(e) => setIntentText(e.target.value)}
                  rows={5}
                  placeholder="e.g. I need to send breach notices to 12 tenants who haven't paid rent for 3 months at my Andheri property. Each owes ₹45,000..."
                  className="w-full bg-black/40 border border-zinc-800 rounded-xl py-4 px-5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all resize-none"
                />
                <div className="flex flex-wrap gap-2 mt-4">
                  {EXAMPLES.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setIntentText(ex)}
                      className="text-[11px] text-zinc-500 hover:text-zinc-300 bg-zinc-800/50 hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition-all border border-zinc-800 hover:border-zinc-600"
                    >
                      {ex.slice(0, 60)}...
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Firm Name (optional)</label>
                <input
                  type="text"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  placeholder="e.g. LegalForge Legal Associates"
                  className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-all"
                />
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-red-950 border border-red-900/50 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={analyzeIntent}
                disabled={analyzing || !intentText.trim()}
                className="w-full py-4 bg-orange-500 hover:bg-orange-400 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing your requirement...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Analyze & Suggest
                  </>
                )}
              </button>
            </div>
          )}

          {mode === 1 && intent && (
            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-gradient-to-br from-orange-950/20 to-zinc-900 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-orange-400" />
                  <h2 className="text-lg font-semibold">AI Understanding</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Document Type</div>
                    <div className="text-sm font-medium text-orange-400">{intent.suggested_doc_type}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Tone</div>
                    <div className={`text-sm font-medium ${TONE_COLORS[intent.suggested_tone] || 'text-zinc-300'}`}>{intent.suggested_tone}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Confidence</div>
                    <div className="text-sm font-medium text-zinc-200">{Math.round(intent.confidence * 100)}%</div>
                  </div>
                  <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Mode</div>
                    <div className="text-sm font-medium text-zinc-200">{intent.is_bulk ? `Bulk (${intent.bulk_entity_label || 'multiple'})` : 'Single Document'}</div>
                  </div>
                </div>

                {intent.extracted_parties?.length > 0 && (
                  <div className="mb-4">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Detected Parties</div>
                    <div className="flex flex-wrap gap-2">
                      {intent.extracted_parties.map((p, i) => (
                        <span key={i} className="px-3 py-1 bg-zinc-800 rounded-lg text-xs text-zinc-300 border border-zinc-700">{p}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Reasoning</div>
                  <p className="text-sm text-zinc-400 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">{intent.reasoning}</p>
                </div>

                {intent.suggested_clauses?.length > 0 && (
                  <div className="mb-4">
                    <div className="text-[10px] uppercase tracking-widest text-orange-500 mb-2 flex items-center gap-1.5">
                      <Scale className="w-3 h-3" /> Suggested Clauses
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {intent.suggested_clauses.map((c, i) => (
                        <span key={i} className="px-3 py-1 bg-orange-500/5 border border-orange-500/20 rounded-lg text-xs text-orange-300">{c}</span>
                      ))}
                    </div>
                  </div>
                )}

                {intent.template_modifications?.length > 0 && (
                  <div className="mb-4">
                    <div className="text-[10px] uppercase tracking-widest text-blue-400 mb-2 flex items-center gap-1.5">
                      <Pencil className="w-3 h-3" /> Template Modifications
                    </div>
                    <div className="space-y-1.5">
                      {intent.template_modifications.map((m, i) => (
                        <label key={i} className="flex items-start gap-2.5 text-sm text-zinc-400 cursor-pointer">
                          <input type="checkbox" defaultChecked className="mt-0.5 accent-orange-500" onChange={() => {
                            const mods = templateMods.includes(m) ? templateMods.filter((x) => x !== m) : [...templateMods, m];
                            setTemplateMods(mods);
                          }} />
                          {m}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {intent.missing_info_questions?.length > 0 && (
                  <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-900/30">
                    <div className="text-[10px] uppercase tracking-widest text-amber-400 mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3" /> Missing Information
                    </div>
                    <ul className="space-y-1">
                      {intent.missing_info_questions.map((q, i) => (
                        <li key={i} className="text-xs text-amber-200/70 flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">?</span>
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setMode(0)} className="px-6 py-3 bg-zinc-800 text-zinc-300 rounded-xl text-sm font-medium hover:bg-zinc-700 transition-colors border border-zinc-700">
                    Revise Description
                  </button>
                  <button onClick={confirmIntent} className="flex-1 py-3 bg-orange-500 hover:bg-orange-400 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Correct — Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  {isBulk ? <Users className="w-5 h-5 text-orange-400" /> : <FileText className="w-5 h-5 text-orange-400" />}
                  {isBulk ? `Batch ${bulkLabel.charAt(0).toUpperCase() + bulkLabel.slice(1)}s` : 'Client Details'}
                </h2>
                {isBulk && (
                  <div className="flex gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 rounded-lg transition-colors flex items-center gap-1.5 border border-zinc-700">
                      <Upload className="w-3 h-3" /> CSV
                    </button>
                    <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSV} className="hidden" />
                    <button onClick={addEntry} className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-xs text-orange-400 rounded-lg transition-colors flex items-center gap-1.5 border border-orange-500/30">
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Document Type</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-100 focus:outline-none focus:border-orange-500/50"
                    >
                      {DOC_TYPES.map((d) => (
                        <option key={d.id} value={d.id}>{d.icon} {d.id}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Drafting Tone</label>
                    <div className="flex flex-wrap gap-1.5">
                      {TONES.map((t) => (
                        <button
                          key={t}
                          onClick={() => setTone(t)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            tone === t
                              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/50'
                              : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:border-zinc-500'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {isBulk ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-[10px] uppercase tracking-widest text-zinc-600 px-3 mb-1">
                      <div className="col-span-4">{bulkLabel.charAt(0).toUpperCase() + bulkLabel.slice(1)} Name</div>
                      <div className="col-span-3">Opposing Party</div>
                      <div className="col-span-4">Notes / Variables</div>
                      <div className="col-span-1"></div>
                    </div>
                    {entries.map((entry, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <input
                            type="text"
                            value={entry.client_name}
                            onChange={(e) => updateEntry(idx, 'client_name', e.target.value)}
                            placeholder="Name"
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg py-2.5 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            value={entry.opposing_party}
                            onChange={(e) => updateEntry(idx, 'opposing_party', e.target.value)}
                            placeholder="Opposing party"
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg py-2.5 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500"
                          />
                        </div>
                        <div className="col-span-4">
                          <input
                            type="text"
                            value={entry.variables?.notes || ''}
                            onChange={(e) => updateEntryVar(idx, 'notes', e.target.value)}
                            placeholder="e.g. Amount, property ref"
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg py-2.5 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500"
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button
                            onClick={() => removeEntry(idx)}
                            disabled={entries.length <= 1}
                            className="p-2 text-zinc-600 hover:text-red-400 disabled:opacity-30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <p className="text-[11px] text-zinc-600 mt-2">
                      {entries.length} {bulkLabel}{entries.length !== 1 ? 's' : ''} • CSV format: Name, Opposing Party, custom fields...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Client / Applicant Name *</label>
                        <input
                          type="text"
                          value={entries[0]?.client_name || ''}
                          onChange={(e) => updateEntry(0, 'client_name', e.target.value)}
                          placeholder="e.g. Rajesh Kumar"
                          className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3.5 px-5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Opposing Party / Respondent *</label>
                        <input
                          type="text"
                          value={entries[0]?.opposing_party || ''}
                          onChange={(e) => updateEntry(0, 'opposing_party', e.target.value)}
                          placeholder="e.g. ABC Pvt. Ltd."
                          className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3.5 px-5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">Case Description / Facts *</label>
                      <textarea
                        value={caseDescription}
                        onChange={(e) => setCaseDescription(e.target.value)}
                        rows={5}
                        placeholder="Describe the factual background, the issue, and the relief sought..."
                        className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3.5 px-5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 transition-all resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-red-950 border border-red-900/50 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <button onClick={() => setMode(1)} className="px-6 py-3 bg-zinc-800 text-zinc-300 rounded-xl text-sm font-medium hover:bg-zinc-700 transition-colors border border-zinc-700 flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setMode(3)}
                  disabled={!canProceedDetails()}
                  className="px-6 py-3 bg-zinc-100 text-zinc-900 rounded-xl text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {mode === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Review & Generate</h2>

              <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                  <span className="text-xs uppercase tracking-widest text-zinc-500">Document Type</span>
                  <span className="text-sm font-medium text-orange-400">{docType}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                  <span className="text-xs uppercase tracking-widest text-zinc-500">Mode</span>
                  <span className="text-sm font-medium text-zinc-200">{isBulk ? `Bulk (${entries.length} ${bulkLabel}s)` : 'Single Document'}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                  <span className="text-xs uppercase tracking-widest text-zinc-500">Tone</span>
                  <span className={`text-sm font-medium ${TONE_COLORS[tone] || 'text-zinc-200'}`}>{tone}</span>
                </div>
                {templateMods?.length > 0 && (
                  <div className="pb-4 border-b border-zinc-800">
                    <span className="text-xs uppercase tracking-widest text-zinc-500 block mb-2">Template Modifications</span>
                    <div className="flex flex-wrap gap-1.5">
                      {templateMods.map((m, i) => (
                        <span key={i} className="px-2.5 py-1 bg-blue-500/5 border border-blue-500/20 rounded text-[11px] text-blue-300">{m}</span>
                      ))}
                    </div>
                  </div>
                )}
                {isBulk && (
                  <div>
                    <span className="text-xs uppercase tracking-widest text-zinc-500 block mb-2">{bulkLabel.charAt(0).toUpperCase() + bulkLabel.slice(1)}s ({entries.length})</span>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {entries.map((e, i) => (
                        <div key={i} className="text-sm text-zinc-400 bg-zinc-800/50 px-3 py-1.5 rounded-lg">
                          {i + 1}. {e.client_name}{e.opposing_party ? ` vs ${e.opposing_party}` : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-red-950 border border-red-900/50 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setMode(2)} className="px-6 py-3 bg-zinc-800 text-zinc-300 rounded-xl text-sm font-medium hover:bg-zinc-700 transition-colors border border-zinc-700 flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={isBulk ? handleBulkGenerate : handleSingleGenerate}
                  disabled={isGenerating}
                  className="flex-1 py-4 bg-orange-500 hover:bg-orange-400 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {isBulk ? `Generating ${entries.length} drafts...` : 'Generating Draft...'}
                    </>
                  ) : (
                    <>
                      <Pencil className="w-5 h-5" />
                      {isBulk ? `Generate ${entries.length} ${docType}s` : `Generate ${docType}`}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {mode === 4 && (result || bulkResult) && (
            <div className="space-y-6">
              {result && (
                <>
                  <div className="text-center py-6">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-semibold mb-1">Draft Generated</h2>
                    <p className="text-sm text-zinc-500">Draft ID: <span className="text-orange-400 font-mono">{result.draft_id}</span></p>
                  </div>

                  {result.draft_brief && (
                    <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800">
                      <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Draft Brief</h3>
                      <p className="text-sm text-zinc-300 leading-relaxed">{result.draft_brief}</p>
                    </div>
                  )}

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

                  <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800">
                    <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Draft Preview</h3>
                    <pre className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto font-sans">
                      {result.preview_text?.slice(0, 2000)}
                      {(result.preview_text?.length || 0) > 2000 ? '\n\n[...truncated — download full PDF]' : ''}
                    </pre>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => handleDownload(result.download_url)} className="flex-1 py-3 bg-orange-500 hover:bg-orange-400 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
                      <Download className="w-5 h-5" /> Download PDF
                    </button>
                    <button onClick={handleReset} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-xl transition-colors border border-zinc-700 flex items-center gap-2">
                      <RotateCw className="w-4 h-4" /> New Draft
                    </button>
                  </div>
                </>
              )}

              {bulkResult && (
                <>
                  <div className="text-center py-6">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-semibold mb-1">{bulkResult.successful} Drafts Generated</h2>
                    <p className="text-sm text-zinc-500">
                      Batch ID: <span className="text-orange-400 font-mono">{bulkResult.batch_id}</span>
                      {bulkResult.total !== bulkResult.successful && (
                        <span className="text-amber-400 ml-3">{bulkResult.total - bulkResult.successful} failed</span>
                      )}
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs uppercase tracking-widest text-zinc-500">Generated Drafts</h3>
                      {bulkResult.zip_download_url && (
                        <button
                          onClick={() => handleDownload(bulkResult.zip_download_url)}
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" /> Download All (ZIP)
                        </button>
                      )}
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {bulkResult.drafts.map((d, i) => (
                        <div key={d.draft_id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 hover:border-zinc-600 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-[10px] text-zinc-600 font-mono w-6">{String(i + 1).padStart(2, '0')}</span>
                            <span className="text-sm text-zinc-200 truncate">{d.client_name}</span>
                            <span className="text-[10px] text-zinc-600 font-mono">{d.draft_id.slice(0, 8)}</span>
                          </div>
                          <button
                            onClick={() => handleDownload(d.download_url)}
                            className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-xs text-zinc-300 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                          >
                            <Download className="w-3 h-3" /> PDF
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={handleReset} className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-xl transition-colors border border-zinc-700 flex items-center justify-center gap-2">
                    <RotateCw className="w-4 h-4" /> New Batch
                  </button>
                </>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
