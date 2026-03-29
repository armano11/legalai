import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Activity } from 'lucide-react';

export const DashboardMockup = () => {
  return (
    <div className="relative w-full h-full bg-slate-950 p-4 sm:p-6 lg:p-8 flex items-center justify-center overflow-hidden rounded-2xl">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
      
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-4 gap-4 z-10">
        
        {/* Sidebar Mini */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          className="hidden md:flex flex-col gap-4 col-span-1 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-4"
        >
          <div className="h-6 w-24 bg-slate-800 rounded-md mb-6" />
          {[1,2,3,4,5].map(i => (
             <div key={i} className={`h-8 w-full rounded-md ${i===1 ? 'bg-primary/20 border border-primary/30' : 'bg-slate-800/50'}`} />
          ))}
        </motion.div>

        {/* Main Content Area */}
        <div className="col-span-1 md:col-span-3 flex flex-col gap-4">
          
          {/* Top Stats */}
          <div className="grid grid-cols-3 gap-4">
             {[
               { icon: Activity, color: 'text-primary', delay: 0.1 },
               { icon: Users, color: 'text-secondary', delay: 0.2 },
               { icon: TrendingUp, color: 'text-emerald-500', delay: 0.3 }
             ].map((stat, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: stat.delay }}
                  className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-4 flex flex-col gap-3"
                >
                   <div className="flex justify-between items-start">
                      <div className="h-2 w-12 bg-slate-700 rounded-full" />
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                   </div>
                   <div className={`h-5 w-16 bg-slate-600 rounded-sm mt-3`} />
                   <div className="h-1.5 w-10 bg-slate-700 rounded-full" />
                </motion.div>
             ))}
          </div>

          {/* Large Chart Area */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex-1 min-h-[200px] bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-5 flex flex-col"
          >
             <div className="flex justify-between items-center mb-6">
                <div className="h-3 w-32 bg-slate-700 rounded-full" />
                <div className="flex gap-2">
                   <div className="h-6 w-16 bg-slate-800 rounded-md" />
                   <div className="h-6 w-16 bg-primary/20 border border-primary/30 rounded-md" />
                </div>
             </div>

             <div className="flex-1 flex items-end justify-between gap-2 mt-auto pb-2">
                {[40, 70, 45, 90, 65, 85, 50, 100, 75].map((height, i) => (
                   <div key={i} className="w-full relative group">
                     {/* Bar Fill */}
                     <motion.div 
                       initial={{ height: 0 }}
                       whileInView={{ height: `${height}%` }}
                       transition={{ delay: 0.6 + (i * 0.05), type: 'spring' }}
                       className={`w-full rounded-t-sm ${i % 2 === 0 ? 'bg-primary' : 'bg-primary/50'}`}
                     />
                   </div>
                ))}
             </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
