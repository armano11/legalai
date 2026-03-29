import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart, PieChart, Activity, ArrowUpRight, Zap, Scale, Hexagon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { GradientWaveText } from '../components/ui/gradient-wave-text';

const stats = [
  {
    label: 'Corporate Disputes',
    value: '+14.2%',
    sub: 'vs trailing 90 days',
    icon: TrendingUp,
    color: 'text-emerald-500',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    label: 'Resolution Velocity',
    value: '8.4 mo',
    sub: '14% acceleration YTD',
    icon: Activity,
    color: 'text-secondary',
    glow: 'shadow-[0_0_20px_rgba(0,240,255,0.15)]',
    bg: 'bg-secondary/10',
    border: 'border-secondary/20',
  },
  {
    label: 'IP Litigations',
    value: '+8.7%',
    sub: 'Tech-sector surge detected',
    icon: Scale,
    color: 'text-rose-500',
    glow: 'shadow-[0_0_20px_rgba(244,63,94,0.15)]',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
  {
    label: 'Precedents Processed',
    value: '2,451',
    sub: 'Extracted in last 72 hours',
    icon: Hexagon,
    color: 'text-primary',
    glow: 'shadow-[0_0_20px_rgba(79,70,229,0.15)]',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
];

const trends = [
  {
    title: 'Algorithmic Evidence Admissibility',
    desc: 'Judicial consensus shifts towards requiring cryptographic audits of AI-generated evidence.',
    date: 'Q1 2026 Prediction',
    impact: 'Critical',
    color: 'rose'
  },
  {
    title: 'Smart Contract Jurisprudence',
    desc: 'Emerging federal frameworks standardizing cryptographic dispute resolution protocols.',
    date: 'Active Analysis',
    impact: 'High',
    color: 'amber'
  },
  {
    title: 'Vendor Liability in B2B Data Breaches',
    desc: 'Strict liability models expanding for SaaS providers managing PII across jurisdictions.',
    date: 'Trend Verified',
    impact: 'High',
    color: 'emerald'
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } },
};

export default function CaseInsights() {
  return (
    <div className="w-full pb-24 text-foreground selection:bg-primary/30">
      {/* Header Hero */}
      <div className="relative pt-32 pb-40 border-b border-border bg-background overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-secondary/[0.04] blur-[160px] rounded-full -translate-y-1/2 pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/[0.04] blur-[120px] rounded-full -translate-y-1/2 pointer-events-none" />
        </div>
        <div className="container mx-auto px-6 max-w-[1400px] relative z-10 flex flex-col items-start md:items-center md:text-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center px-4 py-1.5 bg-secondary/10 text-secondary border border-secondary/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
              <Zap className="h-3 w-3 mr-2" /> Global Market Intelligence
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black mb-6 tracking-tighter">
              <GradientWaveText>Macro Predictive Analysis</GradientWaveText>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
              Institutional-grade telemetry on litigation trends, jurisdictional shifts, and systemic regulatory vectors.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-[1400px] relative z-10 -mt-24 space-y-10">
        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={i} variants={itemVariants}>
                <div className={`p-8 rounded-[2rem] border bg-card ${s.border} ${s.glow} group transition-all duration-500 overflow-hidden relative shadow-lg`}>
                  <div className={`absolute -right-12 -top-12 w-40 h-40 ${s.bg} rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none`} />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-10">
                      <div className={`h-12 w-12 rounded-2xl ${s.bg} border ${s.border} flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
                        <Icon className={`h-5 w-5 ${s.color}`} />
                      </div>
                      <ArrowUpRight className={`h-4 w-4 ${s.color} opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0`} />
                    </div>
                    <div className={`text-4xl font-black ${s.color} mb-3 tracking-tighter leading-none pr-4 break-words`}>{s.value}</div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{s.label}</h3>
                    <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-widest">{s.sub}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Charts + Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart Panel */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="rounded-[2rem] border-border bg-card h-full min-h-[480px] shadow-xl overflow-hidden flex flex-col relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50 pointer-events-none" />
              <CardHeader className="border-b border-border p-8 pb-6 relative z-10">
                <CardTitle className="flex items-center text-sm text-foreground font-black uppercase tracking-widest">
                  <PieChart className="mr-3 h-5 w-5 text-secondary" />
                  Sectoral Dispute Volume (2026 Forecast)
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col items-center justify-center p-10 gap-12 relative z-10">
                {/* SVG Donut */}
                <div className="relative w-64 h-64 group">
                   <div className="absolute inset-0 bg-secondary/5 rounded-full blur-[40px] group-hover:bg-secondary/10 transition-colors duration-1000" />
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90 relative z-10">
                    {/* Background circle */}
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                    {/* Contracts 45% */}
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#00f0ff" strokeWidth="4"
                      strokeDasharray="45 55" strokeDashoffset="0" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]" />
                    {/* IP 30% */}
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#4f46e5" strokeWidth="4"
                      strokeDasharray="30 70" strokeDashoffset="-45" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                    {/* Employment 25% */}
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#10b981" strokeWidth="4"
                      strokeDasharray="25 75" strokeDashoffset="-75" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-[9px] uppercase font-black tracking-widest text-muted-foreground mb-2">Total Volume</div>
                    <div className="text-4xl font-black text-foreground leading-none tracking-tighter">42.8K</div>
                    <div className="text-[9px] text-muted-foreground font-bold mt-2 uppercase tracking-widest bg-secondary/10 text-secondary px-2 py-0.5 rounded-full border border-secondary/20">Analyzed</div>
                  </div>
                </div>

                <div className="flex justify-center flex-wrap gap-x-8 gap-y-4 text-[10px] uppercase font-black tracking-widest border border-border bg-background p-4 rounded-2xl w-full">
                  <span className="flex items-center gap-2.5 text-foreground/80">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
                    Comm. Contracts <span className="text-secondary">(45%)</span>
                  </span>
                  <span className="flex items-center gap-2.5 text-foreground/80">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                    IP / Patents <span className="text-primary">(30%)</span>
                  </span>
                  <span className="flex items-center gap-2.5 text-foreground/80">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    Labor Law <span className="text-emerald-500">(25%)</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Trends Panel */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="rounded-[2rem] border-border bg-card h-full min-h-[480px] shadow-xl overflow-hidden flex flex-col">
              <CardHeader className="border-b border-border p-8 pb-6 bg-secondary/5">
                <CardTitle className="flex items-center text-sm text-foreground font-black uppercase tracking-widest">
                  <TrendingUp className="mr-3 h-5 w-5 text-secondary" />
                  Macro Pattern Detection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-8 flex-1 flex flex-col justify-center">
                {trends.map((trend, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex gap-5 p-6 rounded-2xl bg-background border border-border hover:border-secondary/30 hover:bg-secondary/5 transition-all duration-300 group shadow-sm"
                  >
                    <div className="flex flex-col items-center justify-center gap-3 shrink-0 pt-1 w-24 border-r border-border pr-5">
                      <span className={`px-2 py-1 w-full text-center text-[8px] uppercase font-black rounded-lg tracking-widest border ${
                        trend.impact === 'Critical'
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          : trend.impact === 'High' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      }`}>
                        {trend.impact}
                      </span>
                      <span className="text-[8px] text-muted-foreground font-bold text-center uppercase leading-tight tracking-wider">{trend.date}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-foreground mb-2 group-hover:text-secondary transition-colors tracking-tight leading-snug">{trend.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed font-medium group-hover:text-foreground/80 transition-colors">{trend.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
