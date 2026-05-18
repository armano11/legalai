import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Loader2, Calendar, Clock, FileText, Briefcase,
  Activity, ChevronRight, AlertCircle, MapPin, Scale,
  CheckCircle, Circle, ArrowRight, Copy, Check, Shield
} from 'lucide-react';
import { API_BASE_URL } from '../config';

/* ─── Stage Config ─── */
const STAGES = [
  { key: 'Filed',         label: 'Case Filed',        icon: FileText,    desc: 'Petition filed and registered with the court' },
  { key: 'Investigation', label: 'Under Review',      icon: Search,      desc: 'Evidence gathering and preliminary assessment' },
  { key: 'Hearing',       label: 'Active Hearings',   icon: Scale,       desc: 'Court hearings in progress' },
  { key: 'Arguments',     label: 'Final Arguments',   icon: Briefcase,   desc: 'Closing arguments and submissions' },
  { key: 'Judgment',      label: 'Judgment Reserved',  icon: Shield,      desc: 'Awaiting court verdict' },
  { key: 'Closed',        label: 'Case Disposed',     icon: CheckCircle, desc: 'Matter concluded' },
];

const getStageIndex = (stage) => STAGES.findIndex(s => s.key === stage);

/* ─── Date Utils ─── */
const parseDate = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const parsed = new Date(`${raw}T23:59:59`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (d) => {
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  } catch { return '—'; }
};

const formatTime = (d) => {
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  } catch { return ''; }
};

const daysUntil = (d) => {
  try { return Math.ceil((new Date(d) - new Date()) / 86400000); }
  catch { return null; }
};

/* ─── Copy Button ─── */
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors" title="Copy Case ID">
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-zinc-500" />}
    </button>
  );
}

/* ─── Interactive Journey Map ─── */
function JourneyMap({ currentStage }) {
  const currentIdx = getStageIndex(currentStage);
  const containerRef = useRef(null);

  // Auto-scroll to current stage on mount
  useEffect(() => {
    if (containerRef.current) {
      const activeEl = containerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentStage]);

  return (
    <div className="relative w-full overflow-x-auto pb-2" ref={containerRef}>
      <div className="flex items-start min-w-[700px] px-2 py-6">
        {STAGES.map((stage, i) => {
          const isPast = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isFuture = i > currentIdx;
          const Icon = stage.icon;

          return (
            <div key={stage.key} className="flex items-start flex-1" data-active={isCurrent ? 'true' : 'false'}>
              {/* Node */}
              <div className="flex flex-col items-center relative flex-shrink-0 w-full">
                {/* Connector line before */}
                {i > 0 && (
                  <div className="absolute top-5 right-1/2 w-full h-[2px] -z-0"
                    style={{ transform: 'translateX(-50%)' }}>
                    <div className={`h-full transition-all duration-700 ${isPast || isCurrent ? 'bg-zinc-500' : 'bg-zinc-800'}`} />
                  </div>
                )}

                {/* Circle Node */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    isCurrent
                      ? 'bg-white border-white shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                      : isPast
                        ? 'bg-zinc-800 border-zinc-600'
                        : 'bg-zinc-900 border-zinc-800'
                  }`}
                >
                  {isPast ? (
                    <CheckCircle size={16} className="text-zinc-400" />
                  ) : isCurrent ? (
                    <Icon size={16} className="text-zinc-900" />
                  ) : (
                    <Circle size={16} className="text-zinc-700" />
                  )}

                  {/* Pulse ring for current */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-white/30"
                      animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}
                </motion.div>

                {/* Label */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 + 0.1 }}
                  className="mt-3 text-center px-1"
                >
                  <p className={`text-xs font-semibold mb-0.5 transition-colors ${
                    isCurrent ? 'text-white' : isPast ? 'text-zinc-400' : 'text-zinc-600'
                  }`}>
                    {stage.label}
                  </p>
                  <p className={`text-[10px] leading-tight max-w-[110px] mx-auto ${
                    isCurrent ? 'text-zinc-400' : 'text-zinc-700'
                  }`}>
                    {stage.desc}
                  </p>
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Hearing Card ─── */
function HearingCard({ hearing, variant = 'upcoming' }) {
  const days = daysUntil(hearing.date);
  const isUrgent = days !== null && days >= 0 && days <= 3;

  return (
    <div className={`p-4 rounded-lg border transition-colors ${
      variant === 'upcoming'
        ? isUrgent
          ? 'bg-amber-950/20 border-amber-800/30 hover:border-amber-700/40'
          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
        : 'bg-zinc-950/30 border-zinc-800/50'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Scale size={14} className={isUrgent ? 'text-amber-500' : 'text-zinc-500'} />
          <span className="text-sm font-medium text-zinc-200">
            {hearing.hearing_type || 'Hearing'}
          </span>
        </div>
        {variant === 'upcoming' && days !== null && (
          <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
            isUrgent
              ? 'bg-amber-900/30 text-amber-400 border border-amber-800/30'
              : 'bg-zinc-800 text-zinc-500'
          }`}>
            {days === 0 ? 'TODAY' : days === 1 ? 'TOMORROW' : `${days}d`}
          </span>
        )}
      </div>

      <div className="ml-[22px] space-y-1">
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <Calendar size={12} className="text-zinc-600 shrink-0" />
          {formatDate(hearing.date)}
          {hearing.time && <span className="text-zinc-600">·</span>}
          {hearing.time && <span className="text-zinc-500">{hearing.time}</span>}
        </div>
        {hearing.court && (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <MapPin size={12} className="text-zinc-600 shrink-0" />
            {hearing.court}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Activity Item ─── */
function ActivityItem({ log, isLast }) {
  return (
    <div className="flex gap-4 relative">
      {/* Timeline connector */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-zinc-700 border border-zinc-600 mt-1.5 relative z-10" />
        {!isLast && <div className="w-px flex-1 bg-zinc-800 mt-1" />}
      </div>

      {/* Content */}
      <div className="pb-6 flex-1 min-w-0">
        <p className="text-sm text-zinc-300 leading-relaxed">{log.details}</p>
        <p className="text-[11px] text-zinc-600 font-mono mt-1">
          {formatTime(log.timestamp)}
        </p>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function ClientPortal() {
  const [caseId, setCaseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [caseData, setCaseData] = useState(null);
  const [error, setError] = useState('');

  const normalizeCaseIdInput = (rawInput) => {
    const raw = String(rawInput || '').trim();
    if (!raw) return '';

    const directMatch = raw.match(/([A-Z]+-\d{4}-\d+|JA-[A-Z0-9]{5,}|CASE-[A-Z0-9]{6,})/i);
    if (directMatch?.[1]) return directMatch[1].toUpperCase();

    try {
      const parsedUrl = new URL(raw);
      const queryId = parsedUrl.searchParams.get('id');
      if (queryId) return String(queryId).trim().toUpperCase();
      const pathTail = parsedUrl.pathname.split('/').filter(Boolean).pop();
      if (pathTail) return pathTail.toUpperCase();
    } catch {
      // Not a URL, continue.
    }

    return raw.toUpperCase();
  };

  // Auto-read ?id= from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get('id');
    if (urlId) {
      const normalized = normalizeCaseIdInput(urlId);
      setCaseId(normalized);
      setTimeout(() => doSearch(normalized), 300);
    }
  }, []);

  const doSearch = async (searchId) => {
    const id = normalizeCaseIdInput(searchId || caseId);
    if (!id) return;

    setLoading(true);
    setError('');
    setCaseData(null);

    try {
      const res = await fetch(`${API_BASE_URL}/client/track/${encodeURIComponent(id)}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Case not found. Please verify the Case ID with your counsel.');
        }
        throw new Error('An error occurred. Please try again.');
      }
      const data = await res.json();
      setCaseData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    doSearch();
  };

  const now = new Date();
  const upcomingHearings = caseData?.hearings?.filter(h => {
    const d = parseDate(h.date);
    return d && d >= now;
  }) || [];
  const pastHearings = caseData?.hearings?.filter(h => {
    const d = parseDate(h.date);
    return d && d < now;
  })?.reverse() || [];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pt-24 pb-20">

      {/* ─── Search Section ─── */}
      <div className="max-w-2xl mx-auto px-6 mb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-1">
            Case Tracking
          </h1>
          <p className="text-sm text-zinc-500">
            Enter your unique Case ID to view status, hearings, and updates.
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden focus-within:border-zinc-600 transition-colors">
            <Search className="ml-4 w-4 h-4 text-zinc-600 shrink-0" />
            <input
              type="text"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              placeholder="JA-XXXXX"
              className="flex-1 bg-transparent py-3.5 px-3 text-sm text-zinc-100 placeholder:text-zinc-700 outline-none font-mono tracking-wider"
            />
            <button
              type="submit"
              disabled={loading || !caseId.trim()}
              className="m-1.5 px-5 py-2 bg-white text-zinc-900 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Track'}
            </button>
          </div>
        </form>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mt-4 px-4 py-3 rounded-lg bg-red-950/40 border border-red-900/30 flex items-start gap-3"
            >
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Results ─── */}
      <AnimatePresence mode="wait">
        {caseData && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl mx-auto px-6 space-y-6"
          >

            {/* ─── Case Header ─── */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 text-xs font-mono tracking-wider border border-zinc-700/50">
                        {caseData.case_no}
                      </span>
                      <CopyButton text={caseData.case_no} />
                      <span className="text-[11px] text-zinc-600 uppercase tracking-widest font-medium">
                        {caseData.case_type}
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold text-zinc-100 mb-1">
                      {caseData.title}
                    </h2>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg shrink-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-medium text-zinc-200">{caseData.stage}</span>
                  </div>
                </div>

                {/* Meta Row */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-500">
                  {caseData.court && caseData.court !== 'TBD' && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-zinc-600" />
                      {caseData.court}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Briefcase size={14} className="text-zinc-600" />
                    {caseData.lawyer_name}
                  </div>
                  {caseData.updated_at && (
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-zinc-600" />
                      Last updated {formatDate(caseData.updated_at)}
                    </div>
                  )}
                </div>
              </div>

              {/* ─── Journey Map ─── */}
              <div className="border-t border-zinc-800 bg-zinc-950/50">
                <JourneyMap currentStage={caseData.stage} />
              </div>
            </div>

            {/* ─── Content Grid ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

              {/* Left: Activity Timeline (3 cols) */}
              <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-zinc-500" />
                    <h3 className="text-sm font-medium text-zinc-200">Case Activity</h3>
                  </div>
                  {caseData.activity_log?.length > 0 && (
                    <span className="text-[11px] font-mono text-zinc-600">
                      {caseData.activity_log.length} events
                    </span>
                  )}
                </div>

                <div className="p-6">
                  {caseData.activity_log?.length > 0 ? (
                    <div>
                      {caseData.activity_log.map((log, i) => (
                        <ActivityItem
                          key={log.id || i}
                          log={log}
                          isLast={i === caseData.activity_log.length - 1}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <Activity size={32} className="text-zinc-800 mx-auto mb-3" />
                      <p className="text-sm text-zinc-600">No public updates available yet.</p>
                      <p className="text-xs text-zinc-700 mt-1">Your counsel will post updates here as the case progresses.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Hearings (2 cols) */}
              <div className="lg:col-span-2 space-y-6">

                {/* Upcoming Hearings */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
                  <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
                    <Calendar size={16} className="text-zinc-500" />
                    <h3 className="text-sm font-medium text-zinc-200">Upcoming Hearings</h3>
                  </div>
                  <div className="p-4">
                    {upcomingHearings.length > 0 ? (
                      <div className="space-y-3">
                        {upcomingHearings.map((hearing, i) => (
                          <HearingCard key={hearing.id || i} hearing={hearing} variant="upcoming" />
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center border border-dashed border-zinc-800 rounded-lg">
                        <Calendar size={24} className="text-zinc-800 mx-auto mb-2" />
                        <p className="text-sm text-zinc-600">No upcoming hearings</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Past Hearings */}
                {pastHearings.length > 0 && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
                    <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
                      <Clock size={16} className="text-zinc-500" />
                      <h3 className="text-sm font-medium text-zinc-200">Past Hearings</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {pastHearings.slice(0, 3).map((hearing, i) => (
                        <HearingCard key={hearing.id || i} hearing={hearing} variant="past" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Info */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
                    Need Assistance?
                  </h4>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                    Contact your assigned counsel for detailed case updates or to schedule a consultation.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <Briefcase size={14} className="text-zinc-600" />
                    <span>{caseData.lawyer_contact?.name || caseData.lawyer_name}</span>
                  </div>
                  {caseData.lawyer_contact?.email && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-zinc-300">
                      <span className="text-zinc-600">@</span>
                      <span>{caseData.lawyer_contact.email}</span>
                    </div>
                  )}
                  {caseData.client_email && (
                    <p className="mt-3 text-xs text-zinc-500">
                      For urgent updates, also reply to your intake email thread.
                    </p>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Empty State (before search) ─── */}
      {!caseData && !loading && !error && (
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-5">
            <FileText size={24} className="text-zinc-700" />
          </div>
          <h3 className="text-lg font-medium text-zinc-400 mb-2">Track Your Case</h3>
          <p className="text-sm text-zinc-600 leading-relaxed max-w-sm mx-auto">
            Your counsel will provide you with a unique Case ID (format: <span className="font-mono text-zinc-500">JA-XXXXX</span>). Enter it above to view your case status, scheduled hearings, and activity updates.
          </p>
        </div>
      )}
    </div>
  );
}
