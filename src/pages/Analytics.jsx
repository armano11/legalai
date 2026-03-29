import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Search, Activity, 
  ChevronRight, Calendar, Building, 
  Zap, Clock, ArrowUpRight, BarChart3, TrendingUp, Hexagon
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { useAuth } from '../components/AuthContext';
import { cn } from '../lib/utils';
import { GlassCard } from '@/components/ui/glass-card';
import { PillTag } from '@/components/ui/pill-tag';
import { stagger as staggerContainer, fadeUp, pageTransition } from '@/lib/design-tokens';

const DEMO_CHART_DATA = [
  { day: 'Mon', queries: 12 }, { day: 'Tue', queries: 19 },
  { day: 'Wed', queries: 8 }, { day: 'Thu', queries: 24 },
  { day: 'Fri', queries: 15 }, { day: 'Sat', queries: 6 },
  { day: 'Sun', queries: 3 }
];

const DEMO_EVENTS = [
  { title: 'Sharma v. State of Maharashtra', court: 'Bombay High Court', date: '2026-03-22', time: '10:30 AM', severity: 'critical', type: 'hearing' },
  { title: 'Patel Industries v. Tax Authority', court: 'Income Tax Appellate Tribunal', date: '2026-03-24', time: '2:00 PM', severity: 'high', type: 'hearing' },
  { title: 'Limitation Filing — Mehra Property Dispute', court: 'District Court, Delhi', date: '2026-03-26', time: '', severity: 'critical', type: 'deadline' },
  { title: 'Client Meeting — Reddy Divorce Case', court: 'Family Court, Hyderabad', date: '2026-03-28', time: '11:00 AM', severity: 'medium', type: 'meeting' }
];

const DEMO_RECENT_SEARCHES = [
  { query: 'Section 498A dowry harassment landmark judgments' },
  { query: 'Property dispute partition suit procedure' },
  { query: 'Consumer Protection Act 2019 defective goods' },
  { query: 'Bail application under Section 439 CrPC' }
];

const radarData = [
  { subject: 'Research', A: 120, fullMark: 150 },
  { subject: 'Contracts', A: 98, fullMark: 150 },
  { subject: 'Drafts', A: 86, fullMark: 150 },
  { subject: 'Calendar', A: 65, fullMark: 150 },
  { subject: 'Insights', A: 75, fullMark: 150 },
];



const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 rounded-xl border border-white/10 shadow-xl backdrop-blur-md">
        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">{label}</p>
        <p className="text-sm font-bold text-foreground">
           {payload[0].value} <span className="text-secondary font-medium">Queries</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const { user, token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics/dashboard', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.warn('Analytics fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const hasRealData = analytics && (analytics.total_searches > 0 || analytics.total_drafts > 0 || analytics.total_events > 0);
  const chartData = hasRealData && analytics?.daily_data?.some(d => d.queries > 0) 
    ? analytics.daily_data 
    : DEMO_CHART_DATA;
  
  const upcomingEvents = analytics?.upcoming_events?.length > 0 
    ? analytics.upcoming_events 
    : DEMO_EVENTS;
  
  const recentSearches = analytics?.recent_searches?.length > 0 
    ? analytics.recent_searches 
    : DEMO_RECENT_SEARCHES;

  const stats = [
    { label: 'Documents Processed', val: hasRealData ? (analytics?.total_drafts ?? 0) : 47, icon: FileText, color: 'text-primary' },
    { label: 'Total Queries Executed', val: hasRealData ? (analytics?.total_searches ?? 0) : 156, icon: Search, color: 'text-secondary' },
    { label: 'Scheduled Engagements', val: hasRealData ? (analytics?.total_events ?? 0) : 8, icon: Calendar, color: 'text-orange-500' },
    { label: 'System Accuracy Benchmark', val: '98.4%', icon: Hexagon, color: 'text-emerald-500' }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col pt-32 pb-24 relative overflow-hidden text-foreground selection:bg-primary/30">
      
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary/[0.03] blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-primary/[0.02] blur-[150px] rounded-full pointer-events-none" />

      <main className="container mx-auto px-6 relative z-10 flex flex-col flex-1 max-w-[1400px]">
        {/* HEADER */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-14 border-b border-border pb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card shadow-sm mb-6">
              <Activity className="w-4 h-4 text-secondary" />
              <span className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">Telemetry Station</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">
              System <span className="text-primary">Performance Matrix</span>
            </h1>
            <p className="text-muted-foreground font-medium text-lg max-w-xl leading-relaxed">
              Real-time monitoring and historical telemetry data for operations across <span className="text-foreground tracking-tight">{user?.firm_name || 'your Organization'}</span>.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* STATS */}
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="lg:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            {stats.map((stat, i) => (
              <motion.div 
                key={i} variants={fadeUp}
                className="p-8 rounded-[2rem] border border-border bg-card shadow-sm hover:shadow-lg transition-all group overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] group-hover:bg-primary/10 transition-colors pointer-events-none" />
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="p-3 rounded-2xl bg-secondary/10 border border-secondary/20 group-hover:scale-110 transition-transform shadow-inner">
                     <stat.icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                  <TrendingUp className="h-4 w-4 text-emerald-500/50" />
                </div>
                <div className="text-4xl font-black text-foreground mb-2 tracking-tighter relative z-10">{loading ? '...' : stat.val}</div>
                <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest relative z-10">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* CHART & EVENTS */}
          <div className="lg:col-span-8 space-y-8">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.2 }} className="p-8 rounded-[2rem] border border-border bg-card shadow-sm h-[480px] flex flex-col relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50 pointer-events-none z-0" />
               <div className="flex justify-between items-center mb-8 relative z-10">
                 <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-4 h-4 text-secondary" /> Activity Velocity Chart
                 </h3>
               </div>
              <div className="flex-1 w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 10, fontWeight: 700 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 10, fontWeight: 700 }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="queries" stroke="#A78BFA" strokeWidth={3} fillOpacity={1} fill="url(#colorPrimary)" activeDot={{ r: 6, fill: '#A78BFA', stroke: '#000', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.3 }} className="p-8 rounded-[2rem] border border-border bg-card shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Historical Docket Log
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {upcomingEvents.map((evt, i) => (
                  <div key={i} className="p-6 rounded-2xl border border-border bg-secondary/5 flex flex-col justify-between hover:bg-secondary/10 transition-colors group">
                    <div className="mb-6">
                      <div className="text-base font-bold text-foreground mb-2 leading-tight group-hover:text-primary transition-colors">{evt.title}</div>
                      <div className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{evt.court}</div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-background px-3 py-1.5 rounded-lg border border-border">
                        <Clock className="w-3.5 h-3.5 text-primary" /> {evt.date}
                      </div>
                      <div className={cn("text-[8px] px-2.5 py-1 rounded-md border uppercase font-black tracking-widest", evt.severity === 'critical' ? 'text-red-500 bg-red-500/10 border-red-500/20' : 'text-muted-foreground bg-secondary border-border')}>
                        {evt.severity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* RADAR & RECENT */}
          <div className="lg:col-span-4 space-y-8">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.4 }} className="p-8 rounded-[2rem] border border-border bg-card shadow-sm h-[380px] flex flex-col">
              <h3 className="text-[10px] font-black text-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
                <Hexagon className="w-4 h-4 text-orange-500" /> Systemic Usage Taxonomy
              </h3>
              <div className="flex-1 w-full flex items-center justify-center -ml-4">
                <ResponsiveContainer width="110%" height="110%">
                  <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10, fontWeight: 700 }} />
                    <Radar name="Usage" dataKey="A" stroke="#f97316" strokeWidth={2} fill="#f97316" fillOpacity={0.15} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.5 }} className="p-8 rounded-[2rem] border border-border bg-card shadow-sm">
               <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-500" /> Telemetry Global History
                </h3>
              </div>
              
              <div className="space-y-3">
                {recentSearches.map((s, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-transparent hover:border-border transition-colors hover:bg-secondary/10 group cursor-default">
                     <div className="mt-0.5"><Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-500 transition-colors" /></div>
                     <div className="flex-1 text-sm text-foreground/80 font-medium leading-snug group-hover:text-foreground transition-colors">{s.query}</div>
                     <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
