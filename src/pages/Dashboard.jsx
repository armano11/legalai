import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, FileText, Gavel, 
  ChevronRight, ArrowRight, Sparkles, 
  Clock, Briefcase, TrendingUp
} from 'lucide-react';
import { cn } from '../lib/utils';

const springCurve = [0.16, 1, 0.3, 1];
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: springCurve } } };

export default function Dashboard() {
  const { user, isAdmin, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ active_cases: 0, hearings_today: 0, pending_tasks: 0 });
  const [loading, setLoading] = useState(true);
  const userName = user?.name || user?.email?.split('@')[0] || 'Counsel';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lawyers/dashboard/today', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const d = await res.json();
        setStats({
          active_cases: d.stats?.total_active || 0,
          hearings_today: d.stats?.hearings_today || 0,
          pending_tasks: d.stats?.urgent || 0
        });
      }
    } catch {}
    finally { setLoading(false); }
  };

  const actionCards = [
    {
      title: "Legal Research",
      desc: "Search global precedents with AI-powered intelligence.",
      icon: Search,
      path: "/research",
      color: "from-blue-500/20 to-indigo-500/20",
      iconColor: "text-blue-400"
    },
    {
      title: "Draft Generator",
      desc: "Produce production-grade legal drafts in seconds.",
      icon: FileText,
      path: "/drafts",
      color: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-400"
    },
    {
      title: "Case Management",
      desc: "Track hearings, notes, and case lifecycles.",
      icon: Briefcase,
      path: "/cases",
      color: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-400"
    }
  ];

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 lg:px-12 relative overflow-hidden bg-[#09090B]">
      {/* Background Orbs */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-12">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-4 opacity-70">Workspace Overview</p>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-6 leading-none">
            Welcome back,<br />
            <span className="text-white/30 capitalize">{userName}.</span>
          </h1>
          
          <div className="flex flex-wrap gap-4 mt-8">
            {loading ? (
              <>
                <div className="w-32 h-20 rounded-3xl bg-white/[0.03] animate-pulse" />
                <div className="w-32 h-20 rounded-3xl bg-white/[0.03] animate-pulse" />
                <div className="w-32 h-20 rounded-3xl bg-white/[0.03] animate-pulse" />
              </>
            ) : (
              <>
                <div className="px-6 py-4 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
                  <div className="text-3xl font-black text-white">{stats.active_cases}</div>
                  <div className="text-[8px] font-black uppercase tracking-widest text-white/40">Active Cases</div>
                </div>
                <div className="px-6 py-4 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
                  <div className="text-3xl font-black text-amber-400">{stats.hearings_today}</div>
                  <div className="text-[8px] font-black uppercase tracking-widest text-white/40">Today's Hearings</div>
                </div>
                <div className="px-6 py-4 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
                  <div className="text-3xl font-black text-red-500">{stats.pending_tasks}</div>
                  <div className="text-[8px] font-black uppercase tracking-widest text-white/40">Urgent Alerts</div>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Action Grid */}
        <motion.div 
          initial="hidden" animate="visible" 
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          {actionCards.map((card, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              whileHover={{ y: -8, transition: { duration: 0.3, ease: springCurve } }}
              onClick={() => navigate(card.path)}
              className={cn(
                "group relative p-8 rounded-[2rem] border border-white/10 bg-gradient-to-br transition-all cursor-pointer overflow-hidden",
                card.color
              )}
            >
              <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
              
              <div className={cn("w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6", card.iconColor)}>
                <card.icon className="w-6 h-6" />
              </div>
              
              <h3 className="text-xl font-black text-white mb-2">{card.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{card.desc}</p>
              
              <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                Open Module <ChevronRight className="w-3 h-3" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Insights / Bottom Section */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/10 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/60">Professional Guidance</h3>
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            
            <div className="space-y-6">
              <p className="text-lg text-white/80 leading-snug">
                "JurisAI has processed <span className="text-white font-black">1.2k+ documents</span> for your firm this week. You have <span className="text-amber-400 font-bold">{stats.hearings_today} hearings</span> scheduled for today across different courts."
              </p>
              <button 
                onClick={() => navigate('/cases')}
                className="px-6 py-3 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all"
              >
                View Daily Schedule
              </button>
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-indigo-600/10 border border-indigo-500/20 relative overflow-hidden group hover:border-indigo-500/40 transition-all cursor-pointer" onClick={() => navigate('/research')}>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-4">AI Research Assistant</h3>
                <p className="text-2xl font-black text-white leading-tight mb-4">
                  Identify legal precedents with 99.8% precision.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40">
                Launch Assistant <ArrowRight className="w-3 h-3" />
              </div>
            </div>
            {/* Geometric patterns */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-all" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
