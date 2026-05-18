import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Clock,
  TrendingUp,
  Scale,
  Calendar,
  Building,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

// --- Firm Data Simulation ---
const FIRM_METRICS = {
  billableHours: { value: 12450, trend: 4.2 },
  activeMatters: { value: 312, trend: 1.5 },
  realizationRate: { value: 92.4, trend: -0.8 },
  winRate: { value: 68.5, trend: 2.1 }
};

const UTILIZATION_DATA = [
  { month: 'Jan', partners: 85, associates: 92 },
  { month: 'Feb', partners: 88, associates: 95 },
  { month: 'Mar', partners: 82, associates: 89 },
  { month: 'Apr', partners: 90, associates: 98 },
  { month: 'May', partners: 87, associates: 94 },
  { month: 'Jun', partners: 91, associates: 97 }
];

const REVENUE_DATA = [
  { week: 'W1', billed: 420000, collected: 380000 },
  { week: 'W2', billed: 450000, collected: 410000 },
  { week: 'W3', billed: 390000, collected: 420000 },
  { week: 'W4', billed: 480000, collected: 450000 },
  { week: 'W5', billed: 510000, collected: 460000 },
  { week: 'W6', billed: 490000, collected: 480000 }
];

const UPCOMING_DOCKET = [
  { id: 'DK-1042', case: 'Reliance v. State', court: 'Supreme Court', type: 'Final Hearing', date: 'Oct 12', status: 'critical' },
  { id: 'DK-1043', case: 'Tata Motors Merger', court: 'NCLT Mumbai', type: 'Filing Deadline', date: 'Oct 14', status: 'high' },
  { id: 'DK-1044', case: 'Sharma Property Dispute', court: 'Delhi High Court', type: 'Evidence', date: 'Oct 15', status: 'normal' },
  { id: 'DK-1045', case: 'HDFC Arbitral Tribunal', court: 'Arbitration Centre', type: 'Cross Exam', date: 'Oct 18', status: 'high' },
];

const PRACTICE_AREAS = [
  { area: 'Corporate Litigation', volume: 45, revenue: '₹4.2Cr' },
  { area: 'Intellectual Property', volume: 28, revenue: '₹2.8Cr' },
  { area: 'Real Estate & Trust', volume: 15, revenue: '₹1.5Cr' },
  { area: 'Criminal Defense', volume: 12, revenue: '₹0.9Cr' },
];

// --- Styles ---
const S = {
  bg: '#09090b', // Zinc 950
  surface: '#18181b', // Zinc 900
  border: '#27272a', // Zinc 800
  textPrimary: '#fafafa', // Zinc 50
  textSecondary: '#a1a1aa', // Zinc 400
  textMuted: '#52525b', // Zinc 600
  accent: '#ffffff',
  positive: '#10b981', // Emerald 500
  negative: '#ef4444', // Red 500
  critical: '#f59e0b', // Amber 500
};

// --- Custom Components ---
const MetricCard = ({ title, value, prefix = '', suffix = '', trend, icon: Icon }) => {
  const isPositive = trend >= 0;
  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-5 flex flex-col justify-between h-36">
      <div className="flex justify-between items-start">
        <span className="text-[#a1a1aa] text-sm font-medium tracking-wide">{title}</span>
        <div className="p-2 bg-[#27272a]/50 rounded-md">
          <Icon size={16} className="text-[#fafafa]" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div className="flex items-baseline">
          <span className="text-3xl font-semibold text-[#fafafa] tracking-tight">
            {prefix}{value.toLocaleString()}{suffix}
          </span>
        </div>
        <div className={`flex items-center text-xs font-medium ${isPositive ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
          {isPositive ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
          {Math.abs(trend)}%
        </div>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#18181b] border border-[#27272a] p-3 rounded shadow-xl">
        <p className="text-[#a1a1aa] text-xs font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <span className="text-[#fafafa] text-sm flex items-center">
              <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="text-[#fafafa] font-mono text-sm">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- Main Dashboard ---
export default function AnalyticsDashboard() {
  const [timeframe, setTimeframe] = useState('Q3 2026');

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-20">
      
      {/* Top Navigation / Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold tracking-wide">Firm Intelligence</h1>
            <span className="px-2 py-0.5 rounded bg-[#27272a] text-[#a1a1aa] text-xs font-medium tracking-wider">
              CONFIDENTIAL
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-1.5 border border-[#27272a] rounded-md text-sm text-[#a1a1aa] hover:text-[#fafafa] hover:border-[#52525b] transition-colors">
              <Filter size={14} />
              {timeframe}
              <ChevronDown size={14} />
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-[#fafafa] text-[#09090b] rounded-md text-sm font-medium hover:bg-[#e4e4e7] transition-colors">
              <Download size={14} />
              Export Report
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 mt-8">
        
        {/* Key Metrics Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard title="Billable Hours" value={FIRM_METRICS.billableHours.value} trend={FIRM_METRICS.billableHours.trend} icon={Clock} />
          <MetricCard title="Active Matters" value={FIRM_METRICS.activeMatters.value} trend={FIRM_METRICS.activeMatters.trend} icon={Briefcase} />
          <MetricCard title="Realization Rate" value={FIRM_METRICS.realizationRate.value} suffix="%" trend={FIRM_METRICS.realizationRate.trend} icon={TrendingUp} />
          <MetricCard title="Litigation Win Rate" value={FIRM_METRICS.winRate.value} suffix="%" trend={FIRM_METRICS.winRate.trend} icon={Scale} />
        </section>

        {/* Charts Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Revenue Tracking */}
          <div className="lg:col-span-2 bg-[#18181b] border border-[#27272a] rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-medium">Financial Velocity</h2>
                <p className="text-sm text-[#a1a1aa]">Billed vs. Collected (Last 6 Weeks)</p>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="week" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} dx={-10} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#27272a', opacity: 0.4 }} />
                  <Bar dataKey="billed" name="Billed" fill="#3f3f46" radius={[2, 2, 0, 0]} barSize={32} />
                  <Bar dataKey="collected" name="Collected" fill="#fafafa" radius={[2, 2, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Practice Area Breakdown */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-6 flex flex-col">
            <h2 className="text-base font-medium mb-1">Practice Areas</h2>
            <p className="text-sm text-[#a1a1aa] mb-6">Volume distribution</p>
            
            <div className="flex-1 flex flex-col justify-center gap-6">
              {PRACTICE_AREAS.map((area, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-[#fafafa]">{area.area}</span>
                    <span className="text-[#a1a1aa] font-mono">{area.revenue}</span>
                  </div>
                  <div className="w-full bg-[#27272a] rounded-full h-1.5">
                    <div 
                      className="bg-[#fafafa] h-1.5 rounded-full" 
                      style={{ width: `${area.volume}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Utilization Line Chart */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-medium">Resource Utilization</h2>
                <p className="text-sm text-[#a1a1aa]">Partners vs. Associates (%)</p>
              </div>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={UTILIZATION_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="month" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} domain={[60, 100]} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="partners" name="Partners" stroke="#a1a1aa" strokeWidth={2} dot={{ r: 4, fill: '#18181b', strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="associates" name="Associates" stroke="#fafafa" strokeWidth={2} dot={{ r: 4, fill: '#18181b', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Upcoming Docket Table */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#27272a] flex justify-between items-center">
              <div>
                <h2 className="text-base font-medium">Priority Docket</h2>
                <p className="text-sm text-[#a1a1aa]">Upcoming critical events</p>
              </div>
              <button className="text-sm text-[#fafafa] hover:underline">View All</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#27272a]/30 text-[#a1a1aa]">
                  <tr>
                    <th className="px-6 py-3 font-medium border-b border-[#27272a]">Matter</th>
                    <th className="px-6 py-3 font-medium border-b border-[#27272a]">Court</th>
                    <th className="px-6 py-3 font-medium border-b border-[#27272a]">Date</th>
                    <th className="px-6 py-3 font-medium border-b border-[#27272a]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {UPCOMING_DOCKET.map((event, idx) => (
                    <tr key={idx} className="hover:bg-[#27272a]/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#fafafa]">{event.case}</div>
                        <div className="text-xs text-[#a1a1aa] mt-0.5">{event.id} · {event.type}</div>
                      </td>
                      <td className="px-6 py-4 text-[#a1a1aa] flex items-center gap-2">
                        <Building size={14} />
                        {event.court}
                      </td>
                      <td className="px-6 py-4 font-mono text-[#a1a1aa]">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          {event.date}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wider
                          ${event.status === 'critical' ? 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20' : 
                            event.status === 'high' ? 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20' : 
                            'bg-[#27272a] text-[#a1a1aa] border border-[#3f3f46]'}`}
                        >
                          {event.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}
