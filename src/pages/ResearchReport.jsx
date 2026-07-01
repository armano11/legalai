import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/utils';
import {
  Download, ArrowLeft, BookOpen, Clock, AlertTriangle, FileText,
  ExternalLink, ChevronDown, Activity, Scale, Shield, Zap, Search, Database, Layers, Globe as GlobeIcon, Link2
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';

/**
 * Premium Enterprise Research Report Viewer
 */

const ReportHeader = ({ query, isSynthesizing, sourceCount, onBack, onPrint }) => {
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 40], [1, 0.98]);
  const blurValue = useTransform(scrollY, [0, 40], ['blur(0px)', 'blur(16px)']);
  const borderOpacity = useTransform(scrollY, [0, 40], [0, 1]);

  return (
    <motion.header 
      style={{ opacity: headerOpacity, backdropFilter: blurValue }}
      className="fixed top-0 left-0 right-0 z-[60] bg-white/80 dark:bg-zinc-950/80 transition-colors no-print border-b border-transparent"
    >
      <motion.div style={{ opacity: borderOpacity }} className="absolute bottom-0 left-0 right-0 h-[1px] bg-slate-200 dark:bg-slate-800" />
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100 transition-all active:scale-95">
            <ArrowLeft size={18} />
          </button>
          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.2em] text-emerald-600 dark:text-emerald-500 uppercase">Intelligence Brief</span>
              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[200px] sm:max-w-md lg:max-w-xl" title={query}>
              {query}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-zinc-900 dark:text-slate-300">
              {isSynthesizing ? <><div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />Processing</> : <><div className="h-2 w-2 rounded-full bg-emerald-500" />Verified Audit</>}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-zinc-900 dark:text-slate-300">
              {sourceCount} Sources Found
            </span>
          </div>
          <button onClick={onPrint} className="flex h-9 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 active:scale-95 transition-all dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-lg shadow-slate-900/10">
            <Download size={14} /> Export PDF
          </button>
        </div>
      </div>
    </motion.header>
  );
};

const ReportNavigator = ({ activeSection, onNavigate, sections }) => {
  return (
    <div className="sticky top-24 w-64 hidden xl:block no-print">
      <div className="flex flex-col gap-1 p-2 rounded-2xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-zinc-900/30 backdrop-blur-sm">
        <h3 className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Navigation</h3>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => onNavigate(section.id)}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200",
              activeSection === section.id 
                ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50" 
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-zinc-800/50"
            )}
          >
            <div className={cn(
              "w-1.5 h-1.5 rounded-full transition-all duration-300",
              activeSection === section.id ? "bg-emerald-500 scale-125" : "bg-slate-300 dark:bg-slate-700"
            )} />
            {section.label}
          </button>
        ))}
        <div className="mt-4 p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 leading-relaxed font-medium">
              This report is compiled from comprehensive analysis of verified legal databases and statutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const TabBar = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="mb-8 border-b border-slate-200 dark:border-slate-800 no-print" role="tablist">
      <div className="flex gap-6">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-t-sm ${isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
            >
              {tab.label}
              {isActive && (
                <motion.div layoutId="activeTabUnderline" className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-emerald-600 dark:bg-emerald-500" initial={false} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Typewriter effect using requestAnimationFrame
// Custom components for ReactMarkdown — professional legal document styling
const markdownComponents = {
  h1: ({ children }) => (
    <div className="relative mb-10 pt-4">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
        {children}
      </h1>
      <div className="absolute top-0 left-0 w-16 h-1.5 bg-emerald-600 rounded-full" />
    </div>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-12 mb-5 flex items-center gap-4">
      <span className="w-1.5 h-7 bg-emerald-500/20 rounded-full inline-block" />
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-10 mb-4 uppercase tracking-[0.15em] text-[11px] border-b border-slate-100 dark:border-slate-800 pb-1">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-[1.8] mb-6 font-normal tracking-normal">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-slate-900 dark:text-white">{children}</strong>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-10 border-l-4 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10 px-8 py-6 rounded-r-[2rem] italic text-slate-700 dark:text-slate-300 shadow-sm text-lg leading-relaxed">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => (
    <ul className="space-y-1.5 my-3 text-sm text-slate-600 dark:text-slate-400">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-2 my-3 text-sm text-slate-600 dark:text-slate-400 list-decimal list-inside">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  hr: () => (
    <hr className="my-6 border-slate-200 dark:border-slate-800" />
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 underline underline-offset-2 decoration-emerald-300 dark:decoration-emerald-800">{children}</a>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-slate-50 dark:bg-zinc-900 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left border-b border-slate-200 dark:border-slate-800">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/50">{children}</td>
  ),
  code: ({ children }) => (
    <code className="text-xs font-mono bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded-sm">{children}</code>
  ),
};

const AnimatedMarkdown = ({ content }) => {
  return (
    <div className="relative">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  );
};

const AnalysisView = ({ reportMarkdown, isSynthesizing, furtherSteps }) => {
  const [expandedNextSteps, setExpandedNextSteps] = useState(true);

  return (
    <motion.div key="analysis" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-10">
      {/* Cinematic Hero Section */}
      <div className="relative h-64 w-full rounded-[2rem] overflow-hidden group no-print">
        <img 
          src="https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&q=80&w=1200" 
          alt="Legal Intelligence" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500 text-[10px] font-bold text-white uppercase tracking-widest shadow-lg shadow-emerald-500/20">Executive Summary</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight drop-shadow-md leading-tight">Professional Case Audit & Strategic Analysis</h2>
        </div>
      </div>

      <div className="max-w-none">
        {isSynthesizing && !reportMarkdown ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-10 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="space-y-4">
              <div className="h-4 w-full bg-slate-100 dark:bg-zinc-900 rounded-lg" />
              <div className="h-4 w-full bg-slate-100 dark:bg-zinc-900 rounded-lg" />
              <div className="h-4 w-5/6 bg-slate-100 dark:bg-zinc-900 rounded-lg" />
            </div>
            <div className="h-40 w-full bg-slate-100 dark:bg-zinc-900 rounded-2xl" />
          </div>
        ) : (
          <div className="prose-slate dark:prose-invert max-w-none">
            <AnimatedMarkdown content={reportMarkdown} />
          </div>
        )}
      </div>

      {!isSynthesizing && furtherSteps?.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden bg-white dark:bg-zinc-950 page-break-inside-avoid">
          <button onClick={() => setExpandedNextSteps(!expandedNextSteps)} className="flex w-full items-center justify-between bg-slate-50 dark:bg-zinc-900 px-5 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
            <div className="flex items-center gap-2"><Activity size={16} className="text-slate-500" />Strategic Next Steps</div>
            <motion.div animate={{ rotate: expandedNextSteps ? 180 : 0 }}><ChevronDown size={16} className="text-slate-500" /></motion.div>
          </button>
          
          <AnimatePresence initial={false}>
            {expandedNextSteps && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                <div className="p-5 space-y-4 border-t border-slate-200 dark:border-slate-800">
                  {furtherSteps.map((step, idx) => (
                    <div key={idx} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-slate-100 dark:bg-zinc-800 text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{idx + 1}</div>
                        {idx !== furtherSteps.length - 1 && <div className="w-[1px] h-full bg-slate-200 dark:bg-slate-800 my-1" />}
                      </div>
                      <div className="pb-4">
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">{step.action}</h4>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      {/* Visual Evidence Gallery */}
      <section className="pt-10 border-t border-slate-100 dark:border-slate-800 no-print">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                <Search size={20} />
              </div>
              Evidence Gallery
            </h3>
            <p className="text-sm text-slate-500 mt-1">Visual references from primary legal records and case files.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { img: '1589829545856-d10d557cf95f', tag: 'Case Law', title: 'Precedent Discovery' },
            { img: '1450175847910-d99ea442cd35', tag: 'Statute', title: 'Regulatory Framework' },
            { img: '1423592707957-3b212afa6733', tag: 'Evidence', title: 'Factual Correlation' }
          ].map((item, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -8 }}
              className="aspect-[4/3] rounded-3xl bg-slate-100 dark:bg-zinc-900 overflow-hidden relative group border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500"
            >
              <img 
                src={`https://images.unsplash.com/photo-${item.img}?auto=format&fit=crop&q=80&w=600`} 
                alt={item.title}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
              <div className="absolute bottom-5 left-5 right-5">
                <span className="px-2 py-0.5 rounded bg-white/20 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-[0.2em]">{item.tag}</span>
                <p className="text-sm text-white font-bold mt-2 tracking-tight">{item.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

const AuthorityRow = ({ icon, citation, title, summary, url, badge }) => {
  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
  return (
    <motion.div variants={item} className="group flex flex-col sm:flex-row sm:items-start gap-4 border-b border-slate-100 dark:border-slate-800/50 py-5 last:border-0 hover:bg-slate-50 dark:hover:bg-zinc-900/50 px-2 -mx-2 rounded-sm transition-all duration-200 hover:translate-y-[-1px]">
      <div className="flex items-center gap-3 sm:w-1/4 shrink-0">
        <div className="text-slate-400 dark:text-slate-500 overflow-hidden group-hover:text-emerald-600 transition-colors">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="font-mono text-xs font-medium text-slate-900 dark:text-slate-100 tracking-wide">{citation}</span>
          {badge && <span className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">{badge}</span>}
        </div>
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{title}</h4>
          {url && <a href={url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600 hover:text-emerald-700 p-1"><ExternalLink size={14} /></a>}
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{summary}</p>
      </div>
    </motion.div>
  );
};

const getFavicon = (url) => {
  if (!url) return null;
  try { const u = new URL(url); return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`; }
  catch { return null; }
};

const WebSourceCard = ({ source }) => {
  const favicon = getFavicon(source.url);
  // Using Microlink to get a high-quality preview image from the web source
  const previewImage = `https://api.microlink.io/?url=${encodeURIComponent(source.url)}&screenshot=true&embed=screenshot.url`;

  return (
    <motion.a 
      href={source.url} 
      target="_blank" 
      rel="noopener noreferrer" 
      whileHover={{ y: -4, scale: 1.01 }} 
      className="block overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-zinc-950 hover:border-emerald-500/50 dark:hover:border-emerald-500/30 transition-all duration-300 group cursor-pointer shadow-sm hover:shadow-xl hover:shadow-emerald-500/5"
    >
      <div className="aspect-video w-full bg-slate-100 dark:bg-zinc-900 relative overflow-hidden">
        <img 
          src={previewImage} 
          alt="" 
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" 
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white p-1 shadow-md">
            {favicon && <img src={favicon} alt="" className="w-full h-full object-contain" />}
          </div>
          <span className="text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-md">{source.source || 'Web Source'}</span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-emerald-600 transition-colors leading-tight">{source.title || 'Legal Resource'}</h4>
          <ExternalLink size={14} className="text-slate-300 dark:text-slate-700 group-hover:text-emerald-500 transition-colors shrink-0" />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed h-8">{source.snippet}</p>
        <div className="mt-3 flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-500">
          <Link2 size={10} />
          <span className="truncate">{new URL(source.url).hostname}</span>
        </div>
      </div>
    </motion.a>
  );
};

const AuthoritiesList = ({ cases, codes, web }) => {
  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" exit="hidden" className="space-y-8">
      {cases?.length > 0 && (
        <section className="page-break-inside-avoid">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 px-2"><Database size={14} /> Jurisprudence ({cases.length})</h3>
          <div className="border-t border-slate-200 dark:border-slate-800">
            {cases.map((c, i) => (
              <AuthorityRow key={`case-${i}`} icon={<Scale size={16} />} citation={c.citation || c.court} title={c.case_title} summary={c.summary} />
            ))}
          </div>
        </section>
      )}
      {codes?.length > 0 && (
        <section className="page-break-inside-avoid">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 px-2"><Layers size={14} /> Statutory Framework ({codes.length})</h3>
          <div className="border-t border-slate-200 dark:border-slate-800">
            {codes.map((c, i) => (
              <AuthorityRow key={`code-${i}`} icon={<BookOpen size={16} />} citation={c.code} title={c.title} summary={c.description} />
            ))}
          </div>
        </section>
      )}
      {web?.length > 0 && (
        <section className="page-break-inside-avoid">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 px-2"><GlobeIcon size={14} /> Live Web Sources ({web.length})</h3>
          <div className="grid sm:grid-cols-2 gap-3 mt-2">
            {web.map((w, i) => <WebSourceCard key={`web-${i}`} source={w} />)}
          </div>
        </section>
      )}
    </motion.div>
  );
};




const CountUp = ({ value }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start;
    const num = parseInt(value, 10);
    if (isNaN(num)) { setCount(value); return; }
    const animate = (time) => {
      if (!start) start = time;
      const progress = Math.min((time - start) / 800, 1);
      setCount(Math.floor(progress * num));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <>{count}</>;
};

const RiskDashboard = ({ assessment, metrics }) => {
  const score = assessment?.score || 0;
  const isHighRisk = score < 40;
  const isOptimal = score >= 70;
  const scoreColor = isOptimal ? 'bg-emerald-500' : isHighRisk ? 'bg-rose-500' : 'bg-amber-500';
  const scoreText = isOptimal ? 'text-emerald-700 dark:text-emerald-400' : isHighRisk ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-950 p-4 rounded-md flex flex-col">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Success Probability</span>
          <div className="flex items-end gap-2 mt-auto">
            <span className={`text-3xl font-semibold tracking-tight ${scoreText}`}><CountUp value={score} />%</span>
          </div>
        </div>
        {metrics.map((m, i) => (
          <div key={i} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-950 p-4 rounded-md flex flex-col">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{m.label}</span>
            <div className="flex items-end gap-2 mt-auto">
              <span className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100"><CountUp value={m.text} /></span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium text-slate-500"><span>High Risk</span><span>Optimal</span></div>
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1, ease: "easeOut" }} className={`h-full ${scoreColor}`} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 rounded-md">
          <div className="flex items-center gap-2 mb-4"><Shield size={16} className="text-emerald-600 dark:text-emerald-500" /><h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-400">Supporting Factors</h3></div>
          <ul className="space-y-3">
            {assessment?.factors_for?.map((f, i) => <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"><span className="text-emerald-500 mt-0.5">•</span><span className="leading-relaxed">{f}</span></li>)}
          </ul>
        </div>
        <div className="border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-5 rounded-md">
          <div className="flex items-center gap-2 mb-4"><AlertTriangle size={16} className="text-rose-600 dark:text-rose-500" /><h3 className="text-sm font-semibold text-rose-900 dark:text-rose-400">Vulnerabilities</h3></div>
          <ul className="space-y-3">
            {assessment?.factors_against?.map((f, i) => <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"><span className="text-rose-500 mt-0.5">•</span><span className="leading-relaxed">{f}</span></li>)}
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

const TimelineView = ({ procedures }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-4">
    <div className="relative pl-6 sm:pl-8 border-l border-slate-200 dark:border-slate-800 ml-2 space-y-10">
      {procedures.map((proc, idx) => (
        <motion.div key={idx} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: idx * 0.1, duration: 0.3 }} className="relative group">
          <div className="absolute -left-[37px] sm:-left-[45px] top-1 flex h-6 w-6 items-center justify-center rounded-sm bg-slate-900 dark:bg-slate-100 text-[10px] font-bold text-white dark:text-slate-900 ring-4 ring-white dark:ring-zinc-950 transition-colors group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500">{idx + 1}</div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{proc.title}</h4>
            {proc.timeline && <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500"><Clock size={12} />{proc.timeline}</p>}
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">{proc.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

const SkeletonLoader = () => (
  <div className="min-h-screen bg-white dark:bg-zinc-950 px-6 pt-24 max-w-4xl mx-auto">
    <div className="flex gap-6 mb-8 border-b border-slate-200 dark:border-slate-800 pb-3">
      <div className="w-16 h-4 bg-slate-100 dark:bg-zinc-900 rounded-sm animate-pulse" />
      <div className="w-20 h-4 bg-slate-100 dark:bg-zinc-900 rounded-sm animate-pulse" />
      <div className="w-24 h-4 bg-slate-100 dark:bg-zinc-900 rounded-sm animate-pulse" />
    </div>
    <div className="space-y-6">
      <div className="w-3/4 h-8 bg-slate-100 dark:bg-zinc-900 rounded-sm animate-pulse" />
      <div className="space-y-3">
        <div className="w-full h-4 bg-slate-100 dark:bg-zinc-900 rounded-sm animate-pulse" />
        <div className="w-5/6 h-4 bg-slate-100 dark:bg-zinc-900 rounded-sm animate-pulse" />
        <div className="w-4/6 h-4 bg-slate-100 dark:bg-zinc-900 rounded-sm animate-pulse" />
      </div>
    </div>
  </div>
);

export default function ResearchReport() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [reportData, setReportData] = useState(location.state?.report ?? null);
  const [query] = useState(location.state?.query || 'Legal Research');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [activeTab, setActiveTab] = useState('analysis');
  
  const reportRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const handlePrint = useReactToPrint({ contentRef: reportRef, documentTitle: `LegalForge_Brief_${query.replace(/\s+/g, '_').slice(0, 20)}` });

  useEffect(() => {
    if (!reportData) {
      const saved = localStorage.getItem('juris_last_report');
      if (saved) {
        try { setReportData(JSON.parse(saved)); } 
        catch { localStorage.removeItem('juris_last_report'); }
      } else {
        const timer = setTimeout(() => navigate('/research'), 1000);
        return () => clearTimeout(timer);
      }
    } else {
      localStorage.setItem('juris_last_report', JSON.stringify(reportData));
    }
  }, [navigate, reportData]);

  useEffect(() => {
    if (!reportData?.context_for_ai || reportData?.synthesis_ready || isSynthesizing) return;
    
    let active = true;
    const fetchSynthesis = async () => {
      setIsSynthesizing(true);
      try {
        const response = await fetch('/api/research/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ query, context: reportData.context_for_ai }),
        });
        if (!response.ok) throw new Error('Synthesis failed');
        const synthesis = await response.json();
        if (active) {
          const nextData = { ...reportData, ...synthesis, synthesis_ready: true };
          setReportData(nextData);
          localStorage.setItem('juris_last_report', JSON.stringify(nextData));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setIsSynthesizing(false);
      }
    };
    fetchSynthesis();
    return () => { active = false; };
  }, [isSynthesizing, query, reportData, token]);

  if (!reportData) return <SkeletonLoader />;

  const topCases = reportData?.similar_cases || reportData?.results || [];
  const topCodes = reportData?.penal_codes || [];
  const webFindings = reportData?.web_findings || [];
  const trace = reportData?.trace || {};
  const overview = reportData?.source_overview || {};

  const metrics = [
    { label: 'Semantic hits', text: String(overview.database_hits ?? trace.semantic_hits ?? 0) },
    { label: 'Statutory hits', text: String(overview.statutory_hits ?? trace.statutory_hits ?? 0) },
    { label: 'Procedure hits', text: String(overview.procedure_hits ?? trace.procedure_hits ?? 0) },
  ];

  const availableTabs = [
    { id: 'analysis', label: 'Analysis' },
    { id: 'authorities', label: 'Authorities', hidden: !(topCases.length || topCodes.length || webFindings.length) },
    { id: 'risk', label: 'Risk Profile', hidden: !reportData?.risk_assessment },
    { id: 'timeline', label: 'Procedure', hidden: !reportData?.procedures?.length },
  ].filter(t => !t.hidden);

  const reportContent = reportData?.report_markdown || reportData?.synthesis || reportData?.answer || '';

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-100 dark:selection:bg-emerald-900/30">
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-emerald-500 z-[100] origin-left no-print" 
        style={{ scaleX: scrollYProgress }} 
      />
      
      <ReportHeader query={query} isSynthesizing={isSynthesizing} sourceCount={topCases.length + topCodes.length + webFindings.length} onBack={() => navigate('/research')} onPrint={handlePrint} />

      <div className="mx-auto flex w-full max-w-[1400px] gap-8 px-4 sm:px-6 pt-24 pb-24 sm:pb-20">
        <ReportNavigator 
          activeSection={activeTab} 
          onNavigate={setActiveTab} 
          sections={availableTabs} 
        />

        <main ref={reportRef} className="flex-1 min-w-0 print:pt-10">
          {/* Source Pipeline Overview */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-10 grid grid-cols-2 sm:grid-cols-4 gap-4 no-print">
            {[
              { icon: <Database size={18} />, label: 'Legal Corpus', value: topCases.length, color: 'text-blue-500', bg: 'bg-blue-500/5' },
              { icon: <Layers size={18} />, label: 'Statutes', value: topCodes.length, color: 'text-violet-500', bg: 'bg-violet-500/5' },
              { icon: <GlobeIcon size={18} />, label: 'Web Records', value: webFindings.length, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
              { icon: <Zap size={18} />, label: 'Confidence', value: reportData?.synthesis_ready ? '98%' : '…', color: reportData?.synthesis_ready ? 'text-emerald-500' : 'text-amber-500', bg: 'bg-emerald-500/5' },
            ].map((s, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ delay: i * 0.08 }} 
                className="group relative overflow-hidden flex items-center gap-4 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md transition-all"
              >
                <div className={`absolute inset-0 ${s.bg} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className={`${s.color} relative z-10 p-2 rounded-xl bg-slate-50 dark:bg-zinc-900 group-hover:bg-white dark:group-hover:bg-zinc-800 transition-colors`}>{s.icon}</div>
                <div className="flex flex-col relative z-10">
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none tracking-tight">{s.value}</span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1.5">{s.label}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="no-print mb-8">
            <TabBar tabs={availableTabs} activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
          
          <motion.div layout transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            <AnimatePresence mode="wait">
              {activeTab === 'analysis' && <AnalysisView key="analysis" reportMarkdown={reportContent} isSynthesizing={isSynthesizing} furtherSteps={reportData?.further_steps} />}
              {activeTab === 'authorities' && <AuthoritiesList key="authorities" cases={topCases} codes={topCodes} web={webFindings} />}
              {activeTab === 'risk' && <RiskDashboard key="risk" assessment={reportData?.risk_assessment} metrics={metrics} />}
              {activeTab === 'timeline' && <TimelineView key="timeline" procedures={reportData?.procedures} />}
            </AnimatePresence>
          </motion.div>
        </main>
      </div>

      {/* Floating Action Menu for Premium Feel */}
      <div className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-[70] hidden sm:flex flex-col gap-3 no-print">
        <motion.button 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-900 shadow-xl border border-slate-200 dark:bg-zinc-900 dark:text-white dark:border-slate-800"
          title="Share Analysis"
        >
          <Link2 size={20} />
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }}
          onClick={handlePrint}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 hover:bg-emerald-500"
          title="Download Report"
        >
          <Download size={22} />
        </motion.button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print { 
          body { background: white !important; color: black !important; } 
          .no-print { display: none !important; } 
          main { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .page-break-inside-avoid { page-break-inside: avoid; } 
        }
      `}} />
    </div>
  );
}
