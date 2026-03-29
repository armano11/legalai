import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Clock, CheckCircle, AlertTriangle, Search, Gavel,
  ChevronRight, User, Calendar, Send, Plus, FileText,
  X, RefreshCw, BellRing, ExternalLink, MessageSquare,
  ArrowRightLeft, Phone, Paperclip, NotebookPen,
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { cn } from '../lib/utils';

const springCurve = [0.16, 1, 0.3, 1];
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: springCurve } } };

const VALID_STAGES = ["Filed", "Investigation", "Hearing", "Arguments", "Judgment", "Closed"];
const STAGE_COLORS = {
  Filed: 'bg-blue-500 ring-blue-500/30',
  Investigation: 'bg-amber-500 ring-amber-500/30',
  Hearing: 'bg-purple-500 ring-purple-500/30',
  Arguments: 'bg-indigo-500 ring-indigo-500/30',
  Judgment: 'bg-emerald-500 ring-emerald-500/30',
  Closed: 'bg-zinc-500 ring-zinc-500/30',
};
const PRIORITY_STYLES = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
};

const ACTIVITY_ICONS = {
  case_created: Plus, hearing_added: Gavel, note_added: MessageSquare,
  stage_changed: ArrowRightLeft, case_reassigned: User, daily_update: NotebookPen,
  status_updated: CheckCircle, reminder_sent: BellRing,
};

// Rich defaults
const DEFAULT_CASES = [
  {
    id: "case-101", case_no: "LIT-2026-001", title: "Sharma v. State of Maharashtra",
    description: "Criminal appeal — Final arguments stage. Key evidence: CCTV footage from Exhibit P-12.",
    lawyer_name: "Sarah Chen", lawyer_email: "s.chen@demo.com", stage: "Hearing", priority: "critical",
    deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
    client_name: "Rajesh Sharma", client_email: "sharma@mail.com", client_number: "C-98210", case_type: "Criminal", court: "Bombay High Court",
    hearings: [
      { id: 1, date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], time: "10:30", court: "Bombay High Court", hearing_type: "Final Arguments", notes: "Client must be present", status: "upcoming", created_by: "Admin" },
    ],
    notes_log: [
      { id: 1, content: "Client requested update on hearing preparation", note_type: "client_call", author: "Sarah Chen", created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
      { id: 2, content: "Reviewed 400 pages of technical documentation", note_type: "internal", author: "Sarah Chen", created_at: new Date(Date.now() - 86400000).toISOString() },
    ],
    activity_log: [
      { id: 1, action: "case_created", actor: "Admin", details: "Case created and assigned to Sarah Chen", timestamp: new Date(Date.now() - 86400000 * 10).toISOString() },
    ],
    daily_updates: [
      { date: new Date(Date.now() - 86400000).toISOString(), author: "Sarah Chen", summary: "Reviewed CCTV evidence and prepared arguments outline.", hours_logged: 4.5 },
    ],
    urgency_flags: ["hearing_imminent"],
  },
  {
    id: "case-102", case_no: "CORP-2026-089", title: "Acquisition of NextGen Robotics",
    description: "Multi-jurisdictional M&A clearance bridging EU and NA regulatory frameworks.",
    lawyer_name: "Michael Rodriguez", lawyer_email: "m.rod@demo.com", stage: "Investigation", priority: "high",
    deadline: new Date(Date.now() + 86400000 * 14).toISOString(),
    client_name: "Derek Hall", client_email: "dhall@robocorp.com", client_number: "C-44120", case_type: "Corporate", court: "Regulatory Board HQ",
    hearings: [], notes_log: [], activity_log: [], daily_updates: [], urgency_flags: [],
  },
  {
    id: "case-103", case_no: "IP-2026-042", title: "Quantum Chip Patent Filing",
    description: "Drafting comprehensive patent claims for room-temperature quantum stabilization.",
    lawyer_name: "James Kim", lawyer_email: "j.kim@demo.com", stage: "Judgment", priority: "medium",
    deadline: new Date(Date.now() - 86400000 * 2).toISOString(),
    client_name: "Lisa Drago", client_email: "drago@qxlab.io", client_number: "C-77331", case_type: "IP", court: "Patent Office",
    hearings: [], notes_log: [], activity_log: [], daily_updates: [], urgency_flags: ["overdue"],
  },
];

export default function CaseDashboard() {
  const { token, user, isAdmin } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  
  // Modals
  const [showCreateCase, setShowCreateCase] = useState(false);
  const [showAddHearing, setShowAddHearing] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [detailTab, setDetailTab] = useState('overview');
  
  // Create case form
  const [newCase, setNewCase] = useState({ title: '', description: '', lawyer_email: '', client_name: '', client_email: '', client_number: '', case_type: 'Civil', court: '', deadline: '', priority: 'medium', case_no: '' });
  // Hearing form
  const [newHearing, setNewHearing] = useState({ date: '', time: '10:00', court: '', notes: '', hearing_type: 'Regular Hearing' });
  // Note form
  const [newNote, setNewNote] = useState({ content: '', note_type: 'internal' });
  // Daily update
  const [dailyUpdate, setDailyUpdate] = useState('');
  const [researchNotes, setResearchNotes] = useState('');
  const [hoursLogged, setHoursLogged] = useState('');
  
  const [lawyers, setLawyers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      fetchCases();
      fetchLawyers();
    }
  }, [token]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await fetchWithTimeout('/api/lawyers/cases', { headers: { Authorization: `Bearer ${token}` } }, 12000);
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases?.length > 0 ? data.cases : DEFAULT_CASES);
      } else {
        setCases(DEFAULT_CASES);
      }
    } catch {
      setCases(DEFAULT_CASES);
    } finally {
      setLoading(false);
    }
  };

  const fetchLawyers = async () => {
    try {
      const res = await fetchWithTimeout('/api/lawyers/directory', { headers: { Authorization: `Bearer ${token}` } }, 12000);
      if (res.ok) {
        const data = await res.json();
        setLawyers(data.lawyers || []);
      }
    } catch {
      setLawyers([]);
    }
  };

  // ── API Actions ──
  const createCase = async (e) => {
    e.preventDefault();
    if (!newCase.lawyer_email) { alert('Lawyer assignment is mandatory!'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/lawyers/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newCase)
      });
      if (res.ok) {
        setShowCreateCase(false);
        setNewCase({ title: '', description: '', lawyer_email: '', client_name: '', client_email: '', client_number: '', case_type: 'Civil', court: '', deadline: '', priority: 'medium', case_no: '' });
        fetchCases();
      }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const addHearing = async (e) => {
    e.preventDefault();
    if (!selectedCase) return;
    setSubmitting(true);
    try {
      await fetch(`/api/lawyers/cases/${selectedCase.id}/hearings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newHearing)
      });
      setShowAddHearing(false);
      setNewHearing({ date: '', time: '10:00', court: '', notes: '', hearing_type: 'Regular Hearing' });
      refreshSelected();
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!selectedCase) return;
    setSubmitting(true);
    try {
      await fetch(`/api/lawyers/cases/${selectedCase.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newNote)
      });
      setShowAddNote(false);
      setNewNote({ content: '', note_type: 'internal' });
      refreshSelected();
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const changeStage = async (newStage) => {
    if (!selectedCase) return;
    try {
      await fetch(`/api/lawyers/cases/${selectedCase.id}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ new_stage: newStage })
      });
      refreshSelected();
    } catch (err) { console.error(err); }
  };

  const submitDailyUpdate = async () => {
    if (!selectedCase || !dailyUpdate.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`/api/lawyers/cases/${selectedCase.id}/daily-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ summary: dailyUpdate, research_notes: researchNotes, hours_logged: parseFloat(hoursLogged) || 0 })
      });
      setDailyUpdate(''); setResearchNotes(''); setHoursLogged('');
      refreshSelected();
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const refreshSelected = async () => {
    await fetchCases();
    if (selectedCase) {
      try {
        const res = await fetch('/api/lawyers/cases', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          const updated = (data.cases || []).find(c => c.id === selectedCase.id);
          if (updated) setSelectedCase(updated);
        }
      } catch {}
    }
  };

  // ── Computed ──
  const stats = useMemo(() => {
    const total = cases.length;
    const active = cases.filter(c => c.stage !== 'Closed').length;
    const hearingsSoon = cases.filter(c => (c.hearings || []).some(h => {
      const d = (new Date(h.date) - new Date()) / 86400000;
      return d >= 0 && d <= 7;
    })).length;
    const overdue = cases.filter(c => c.urgency_flags?.includes('overdue')).length;
    return [
      { label: 'Active', value: active, icon: Briefcase, color: 'text-foreground' },
      { label: 'Hearings Soon', value: hearingsSoon, icon: Gavel, color: 'text-amber-400' },
      { label: 'Overdue', value: overdue, icon: AlertTriangle, color: 'text-red-400' },
      { label: 'Total', value: total, icon: FileText, color: 'text-indigo-400' },
    ];
  }, [cases]);

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const matchSearch = !searchQuery ||
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.case_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.client_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lawyer_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStage = stageFilter === 'all' || c.stage === stageFilter;
      return matchSearch && matchStage;
    }).sort((a, b) => {
      const po = { critical: 0, high: 1, medium: 2, low: 3 };
      return (po[a.priority] || 2) - (po[b.priority] || 2);
    });
  }, [cases, searchQuery, stageFilter]);

  const formatDate = (d) => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return d; } };
  const formatDateTime = (d) => { if (!d) return ''; try { return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return d; } };
  const daysUntil = (d) => { if (!d) return null; try { return Math.ceil((new Date(d) - new Date()) / 86400000); } catch { return null; } };
  const noteTypeIcon = (t) => ({ client_call: Phone, document: Paperclip, meeting: Calendar, internal: NotebookPen }[t] || NotebookPen);

  return (
    <div className="min-h-screen pt-28 pb-24 relative overflow-hidden" style={{ background: 'var(--background, #09090B)' }}>
      <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full blur-[140px] pointer-events-none opacity-15" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />

      <main className="container mx-auto px-6 relative z-10 max-w-[1500px]">

        {/* HEADER */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-2">
              {isAdmin() ? 'Firm Command Center' : 'My Active Matters'}
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter">Case Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin() && (
              <button onClick={() => setShowCreateCase(true)} className="h-10 px-5 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all flex items-center gap-2">
                <Plus className="w-3.5 h-3.5" /> New Case
              </button>
            )}
            <button onClick={fetchCases} className="h-10 px-4 bg-card border border-border text-foreground text-[10px] font-black rounded-xl hover:bg-accent transition-all flex items-center gap-2">
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            </button>
          </div>
        </motion.div>

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: i * 0.05 }}
              className="p-5 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-accent border border-border"><s.icon className={cn("w-4 h-4", s.color)} /></div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{s.label}</span>
              </div>
              <div className="text-2xl font-black text-foreground">{s.value}</div>
            </motion.div>
          ))}
        </div>

        {/* FILTERS */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search cases, ID, or lawyer..."
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring transition-all" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto p-1 bg-card border border-border rounded-xl">
            {['all', ...VALID_STAGES].map(s => (
              <button key={s} onClick={() => setStageFilter(s)}
                className={cn("px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                  stageFilter === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}>{s === 'all' ? 'All' : s}</button>
            ))}
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="flex flex-col xl:flex-row gap-6 items-start">

          {/* LEFT: CASE LIST */}
          <div className={cn("transition-all duration-500", selectedCase ? "w-full xl:w-[380px]" : "w-full")}>
            <div className={cn("grid gap-3", !selectedCase ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 max-h-[800px] overflow-y-auto pr-1")}>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-card border border-border animate-pulse">
                    <div className="flex justify-between mb-3"><div className="w-16 h-2 bg-white/5 rounded" /><div className="w-12 h-2 bg-white/5 rounded" /></div>
                    <div className="w-full h-4 bg-white/10 rounded mb-4" />
                    <div className="flex justify-between"><div className="w-20 h-2 bg-white/5 rounded" /><div className="w-16 h-2 bg-white/5 rounded" /></div>
                  </div>
                ))
              ) : filteredCases.length === 0 ? (
                <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed border-border rounded-3xl">
                   <p className="text-xs">No cases found matching your criteria.</p>
                </div>
              ) : filteredCases.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  onClick={() => { setSelectedCase(c); setDetailTab('overview'); }}
                  className={cn("p-5 rounded-2xl border transition-all cursor-pointer group",
                    selectedCase?.id === c.id ? "bg-indigo-500/5 border-indigo-500/30" : "bg-card border-border hover:border-muted-foreground/20"
                  )}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{c.case_no} {c.client_number && `· ${c.client_number}`}</span>
                    <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase border", PRIORITY_STYLES[c.priority])}>{c.priority}</span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground mb-2 leading-snug">{c.title}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" />{c.lawyer_name || c.lawyer_email || 'Unassigned'}</span>
                    <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase", STAGE_COLORS[c.stage]?.replace('bg-', 'bg-').replace(' ring-', '/10 text-').split(' ')[0] + '/10',
                      c.stage === 'Filed' ? 'text-blue-400' : c.stage === 'Investigation' ? 'text-amber-400' : c.stage === 'Hearing' ? 'text-purple-400' : c.stage === 'Arguments' ? 'text-indigo-400' : c.stage === 'Judgment' ? 'text-emerald-400' : 'text-zinc-400'
                    )}>{c.stage}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* RIGHT: DETAIL PANEL */}
          <AnimatePresence mode="wait">
            {selectedCase && (
              <motion.div key={selectedCase.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                className="flex-1 w-full rounded-2xl border border-border bg-card overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-border bg-accent/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{selectedCase.case_no} · {selectedCase.case_type || 'Civil'}</span>
                    <button onClick={() => setSelectedCase(null)} className="p-2 rounded-lg hover:bg-accent"><X className="w-4 h-4 text-muted-foreground" /></button>
                  </div>
                  <h2 className="text-2xl font-black text-foreground mb-2">{selectedCase.title}</h2>
                  <p className="text-xs text-muted-foreground mb-4">{selectedCase.description}</p>

                  {/* STAGE PIPELINE */}
                  <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
                    {VALID_STAGES.map((stage, i) => {
                      const stageIdx = VALID_STAGES.indexOf(selectedCase.stage);
                      const isActive = i <= stageIdx;
                      const isCurrent = stage === selectedCase.stage;
                      return (
                        <React.Fragment key={stage}>
                          <button onClick={() => changeStage(stage)}
                            className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                              isCurrent ? `${STAGE_COLORS[stage]} text-white ring-2` :
                              isActive ? 'bg-accent text-foreground' : 'bg-transparent text-muted-foreground hover:bg-accent'
                            )}>{stage}</button>
                          {i < VALID_STAGES.length - 1 && <ChevronRight className="w-3 h-3 text-border shrink-0" />}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Detail Meta */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-card border border-border">
                      <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Assigned To</div>
                      <div className="text-xs font-bold text-foreground">{selectedCase.lawyer_name || selectedCase.lawyer_email || 'Unassigned'}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-card border border-border">
                      <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Client</div>
                      <div className="text-xs font-bold text-foreground">{selectedCase.client_name || '—'}</div>
                      {selectedCase.client_number && <div className="text-[8px] text-muted-foreground mt-0.5">{selectedCase.client_number}</div>}
                    </div>
                    <div className="p-3 rounded-xl bg-card border border-border">
                      <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Court</div>
                      <div className="text-xs font-bold text-foreground">{selectedCase.court || '—'}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-card border border-border">
                      <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Deadline</div>
                      <div className={cn("text-xs font-bold", daysUntil(selectedCase.deadline) < 0 && selectedCase.stage !== 'Closed' ? 'text-red-400' : 'text-foreground')}>
                        {formatDate(selectedCase.deadline)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-border flex">
                  {[
                    { key: 'overview', label: 'Hearings', icon: Gavel },
                    { key: 'notes', label: 'Notes', icon: MessageSquare },
                    { key: 'updates', label: 'Updates', icon: NotebookPen },
                    { key: 'activity', label: 'Activity Log', icon: Clock },
                  ].map(t => (
                    <button key={t.key} onClick={() => setDetailTab(t.key)}
                      className={cn("flex-1 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all border-b-2",
                        detailTab === t.key ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-muted-foreground hover:text-foreground'
                      )}>
                      <t.icon className="w-3.5 h-3.5" /> {t.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="p-6 max-h-[500px] overflow-y-auto">

                  {/* HEARINGS TAB */}
                  {detailTab === 'overview' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Scheduled Hearings ({(selectedCase.hearings || []).length})</h3>
                        <button onClick={() => setShowAddHearing(true)} className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Hearing</button>
                      </div>
                      {(selectedCase.hearings || []).length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground/50"><Gavel className="w-8 h-8 mx-auto mb-3 opacity-30" /><p className="text-xs">No hearings scheduled.</p></div>
                      ) : (
                        <div className="space-y-3">
                          {[...(selectedCase.hearings || [])].sort((a,b) => a.date?.localeCompare(b.date)).map((h, i) => {
                            const days = daysUntil(h.date);
                            return (
                              <div key={i} className={cn("p-4 rounded-xl border transition-all",
                                days !== null && days <= 2 && days >= 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-accent/30 border-border'
                              )}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Gavel className={cn("w-4 h-4", days !== null && days <= 2 ? 'text-red-400' : 'text-muted-foreground')} />
                                    <span className="text-xs font-bold text-foreground">{h.hearing_type}</span>
                                  </div>
                                  {days !== null && (
                                    <span className={cn("text-[10px] font-black",
                                      days < 0 ? 'text-zinc-500' : days <= 2 ? 'text-red-400' : 'text-muted-foreground'
                                    )}>{days === 0 ? 'TODAY' : days < 0 ? 'Passed' : `T-${days}d`}</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-muted-foreground space-y-0.5">
                                  <div>{formatDate(h.date)} at {h.time}</div>
                                  <div>{h.court}</div>
                                  {h.notes && <div className="mt-1 text-foreground/60 italic">{h.notes}</div>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* NOTES TAB */}
                  {detailTab === 'notes' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Case Notes ({(selectedCase.notes_log || []).length})</h3>
                        <button onClick={() => setShowAddNote(true)} className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Note</button>
                      </div>
                      {(selectedCase.notes_log || []).length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground/50"><MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-30" /><p className="text-xs">No notes yet.</p></div>
                      ) : (
                        <div className="space-y-3">
                          {[...(selectedCase.notes_log || [])].reverse().map((n, i) => {
                            const Icon = noteTypeIcon(n.note_type);
                            return (
                              <div key={i} className="p-4 rounded-xl bg-accent/30 border border-border">
                                <div className="flex items-center gap-2 mb-2">
                                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{(n.note_type || 'internal').replace('_', ' ')}</span>
                                  <span className="text-[9px] text-muted-foreground/50 ml-auto">{formatDateTime(n.created_at)}</span>
                                </div>
                                <p className="text-xs text-foreground/80">{n.content}</p>
                                <div className="text-[9px] text-muted-foreground mt-1">{n.author}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* DAILY UPDATES TAB */}
                  {detailTab === 'updates' && (
                    <div>
                      {/* Submit form (for lawyers) */}
                      {!isAdmin() && selectedCase.stage !== 'Closed' && (
                        <div className="mb-6 p-4 rounded-xl bg-accent/30 border border-border">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Submit Daily Update</h4>
                          <textarea value={dailyUpdate} onChange={e => setDailyUpdate(e.target.value)} placeholder="What did you work on today?"
                            className="w-full p-3 bg-card border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground outline-none resize-none h-16 mb-2" />
                          <textarea value={researchNotes} onChange={e => setResearchNotes(e.target.value)} placeholder="Research notes (optional)"
                            className="w-full p-3 bg-card border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground outline-none resize-none h-12 mb-2" />
                          <div className="flex gap-2">
                            <input type="number" value={hoursLogged} onChange={e => setHoursLogged(e.target.value)} placeholder="Hours"
                              className="w-20 p-2 bg-card border border-border rounded-lg text-xs text-foreground outline-none" />
                            <button onClick={submitDailyUpdate} disabled={!dailyUpdate.trim() || submitting}
                              className="flex-1 h-9 bg-indigo-500 text-white text-[10px] font-black rounded-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 disabled:opacity-30">
                              <Send className="w-3 h-3" /> {submitting ? 'Submitting...' : 'Submit'}
                            </button>
                          </div>
                        </div>
                      )}
                      {(selectedCase.daily_updates || []).length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground/50"><NotebookPen className="w-8 h-8 mx-auto mb-3 opacity-30" /><p className="text-xs">No updates yet.</p></div>
                      ) : (
                        <div className="space-y-4">
                          {[...(selectedCase.daily_updates || [])].reverse().map((u, i) => (
                            <div key={i} className="relative pl-6 border-l-2 border-indigo-500/20">
                              <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-indigo-500" />
                              <div className="text-[10px] text-muted-foreground font-bold mb-1">{formatDateTime(u.date)} — {u.author}</div>
                              <p className="text-xs text-foreground/80 mb-1">{u.summary}</p>
                              {u.research_notes && <p className="text-[11px] text-muted-foreground italic p-2 bg-accent/30 rounded-lg">{u.research_notes}</p>}
                              {u.hours_logged > 0 && <span className="text-[9px] text-muted-foreground">{u.hours_logged}h logged</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ACTIVITY LOG TAB */}
                  {detailTab === 'activity' && (
                    <div>
                      {(selectedCase.activity_log || []).length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground/50"><Clock className="w-8 h-8 mx-auto mb-3 opacity-30" /><p className="text-xs">No activity recorded.</p></div>
                      ) : (
                        <div className="space-y-3">
                          {[...(selectedCase.activity_log || [])].reverse().map((a, i) => {
                            const Icon = ACTIVITY_ICONS[a.action] || Clock;
                            return (
                              <div key={i} className="flex gap-3 p-3 rounded-xl hover:bg-accent/30 transition-all">
                                <div className="p-2 rounded-lg bg-accent border border-border shrink-0 h-fit"><Icon className="w-3.5 h-3.5 text-muted-foreground" /></div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-bold text-foreground">{a.actor}</span>
                                    <span className="text-[9px] text-muted-foreground">{formatDateTime(a.timestamp)}</span>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground">{a.details}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ═══════ MODALS ═══════ */}

      {/* CREATE CASE MODAL */}
      {showCreateCase && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-[9999] px-4">
          <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-black text-foreground">Create New Case</h3>
              <button onClick={() => setShowCreateCase(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={createCase} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Case No.</label>
                  <input value={newCase.case_no} onChange={e => setNewCase({...newCase, case_no: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl p-2.5 text-sm text-foreground outline-none focus:border-ring" placeholder="Auto if empty" />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Priority *</label>
                  <select value={newCase.priority} onChange={e => setNewCase({...newCase, priority: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl p-2.5 text-sm text-foreground outline-none cursor-pointer">
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Case Title *</label>
                <input required value={newCase.title} onChange={e => setNewCase({...newCase, title: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-sm text-foreground outline-none focus:border-ring" placeholder="e.g. State vs. Doe" />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Assign Lawyer * (Mandatory)</label>
                <select required value={newCase.lawyer_email} onChange={e => setNewCase({...newCase, lawyer_email: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-sm text-foreground outline-none cursor-pointer">
                  <option value="">— Select Lawyer —</option>
                  {lawyers.map(l => (
                    <option key={l.email} value={l.email}>
                      {l.name} ({l.active_cases} active{l.overloaded ? ' ⚠️ OVERLOADED' : ''})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Client Name</label>
                  <input value={newCase.client_name} onChange={e => setNewCase({...newCase, client_name: e.target.value})} className="w-full bg-background border border-border rounded-xl p-2.5 text-sm text-foreground outline-none" /></div>
                <div><label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Client Number / Phone</label>
                  <input value={newCase.client_number} onChange={e => setNewCase({...newCase, client_number: e.target.value})} className="w-full bg-background border border-border rounded-xl p-2.5 text-sm text-foreground outline-none" placeholder="e.g. +91 9876543210" /></div>
              </div>
              <div><label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Client Email</label>
                <input value={newCase.client_email} onChange={e => setNewCase({...newCase, client_email: e.target.value})} className="w-full bg-background border border-border rounded-xl p-2.5 text-sm text-foreground outline-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Case Type</label>
                  <select value={newCase.case_type} onChange={e => setNewCase({...newCase, case_type: e.target.value})} className="w-full bg-background border border-border rounded-xl p-2.5 text-sm text-foreground outline-none cursor-pointer">
                    {['Civil', 'Criminal', 'Corporate', 'IP', 'Family', 'Tax', 'Constitutional', 'Labour'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select></div>
                <div><label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Court</label>
                  <input value={newCase.court} onChange={e => setNewCase({...newCase, court: e.target.value})} className="w-full bg-background border border-border rounded-xl p-2.5 text-sm text-foreground outline-none" placeholder="e.g. Supreme Court" /></div>
              </div>
              <div><label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Deadline</label>
                <input type="date" value={newCase.deadline} onChange={e => setNewCase({...newCase, deadline: e.target.value})} className="w-full bg-background border border-border rounded-xl p-2.5 text-sm text-foreground outline-none cursor-pointer" /></div>
              <div><label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Description</label>
                <textarea required value={newCase.description} onChange={e => setNewCase({...newCase, description: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-sm text-foreground outline-none resize-none h-20" placeholder="Case details..." /></div>
              <button type="submit" disabled={submitting} className="w-full h-11 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all disabled:opacity-30">
                {submitting ? 'Creating...' : 'Create Case & Assign Lawyer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD HEARING MODAL */}
      {showAddHearing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-[9999] px-4">
          <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-black text-foreground">Add Hearing</h3>
              <button onClick={() => setShowAddHearing(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={addHearing} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Date *</label>
                  <input required type="date" value={newHearing.date} onChange={e => setNewHearing({...newHearing, date: e.target.value})} className="w-full bg-background border border-border rounded-xl p-2.5 text-sm text-foreground outline-none" /></div>
                <div><label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Time</label>
                  <input type="time" value={newHearing.time} onChange={e => setNewHearing({...newHearing, time: e.target.value})} className="w-full bg-background border border-border rounded-xl p-2.5 text-sm text-foreground outline-none" /></div>
              </div>
              <div><label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Court</label>
                <input value={newHearing.court} onChange={e => setNewHearing({...newHearing, court: e.target.value})} className="w-full bg-background border border-border rounded-xl p-2.5 text-sm text-foreground outline-none" placeholder={selectedCase?.court || 'Court name'} /></div>
              <div><label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Hearing Type</label>
                <select value={newHearing.hearing_type} onChange={e => setNewHearing({...newHearing, hearing_type: e.target.value})} className="w-full bg-background border border-border rounded-xl p-2.5 text-sm text-foreground outline-none cursor-pointer">
                  {['Regular Hearing', 'Final Arguments', 'Evidence', 'Bail Hearing', 'Mediation', 'Appeal', 'Initial Filing'].map(t => <option key={t} value={t}>{t}</option>)}
                </select></div>
              <div><label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Notes</label>
                <textarea value={newHearing.notes} onChange={e => setNewHearing({...newHearing, notes: e.target.value})} className="w-full bg-background border border-border rounded-xl p-2.5 text-sm text-foreground outline-none resize-none h-16" placeholder="Any notes..." /></div>
              <button type="submit" disabled={submitting} className="w-full h-10 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all disabled:opacity-30">
                {submitting ? 'Adding...' : 'Add Hearing'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD NOTE MODAL */}
      {showAddNote && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-[9999] px-4">
          <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-black text-foreground">Add Note</h3>
              <button onClick={() => setShowAddNote(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={addNote} className="space-y-4">
              <div><label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Type</label>
                <select value={newNote.note_type} onChange={e => setNewNote({...newNote, note_type: e.target.value})} className="w-full bg-background border border-border rounded-xl p-2.5 text-sm text-foreground outline-none cursor-pointer">
                  <option value="internal">Internal Note</option><option value="client_call">Client Call</option><option value="document">Document Reference</option><option value="meeting">Meeting Note</option>
                </select></div>
              <div><label className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Content *</label>
                <textarea required value={newNote.content} onChange={e => setNewNote({...newNote, content: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-sm text-foreground outline-none resize-none h-24" placeholder="Note content..." /></div>
              <button type="submit" disabled={submitting} className="w-full h-10 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all disabled:opacity-30">
                {submitting ? 'Adding...' : 'Add Note'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
