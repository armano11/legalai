import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Command, FileText, Scale, Briefcase, BarChart3, Users, Settings, X, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { modalTransition } from "@/lib/design-tokens";

interface CommandAction {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  path: string;
  category: string;
}

const ACTIONS: CommandAction[] = [
  { id: "research", title: "Legal Research", subtitle: "Case law research & synthesis", icon: Globe, path: "/research", category: "Core Modules" },
  { id: "analyze", title: "Paper Analyzer", subtitle: "Use upload inside Research", icon: FileText, path: "/research", category: "Core Modules" },
  { id: "draft", title: "Drafting (Research)", subtitle: "Generate drafts inside research", icon: Scale, path: "/research", category: "Core Modules" },
  { id: "cases", title: "Case Tracker", subtitle: "Kanban litigation management", icon: Briefcase, path: "/cases", category: "Core Modules" },
  { id: "analytics", title: "Firm Analytics", subtitle: "Performance telemetry", icon: BarChart3, path: "/analytics", category: "Intelligence" },
  { id: "lawyers", title: "Lawyer Directory", subtitle: "Professional network hub", icon: Users, path: "/lawyers", category: "Intelligence" },
  { id: "settings", title: "Settings", subtitle: "System configurations", icon: Settings, path: "/settings", category: "System" },
];

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const filteredActions = ACTIONS.filter(action => 
    action.title.toLowerCase().includes(query.toLowerCase()) || 
    action.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) setQuery("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        {...modalTransition}
        className="w-full max-w-xl bg-black border border-border-charcoal rounded-none shadow-2xl relative overflow-hidden font-geist"
      >
        <div className="absolute inset-0 bg-dot-grid opacity-10 pointer-events-none" />
        
        <div className="relative p-4 border-b border-border-charcoal flex items-center gap-3">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input 
            autoFocus
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent border-none text-white outline-none text-sm font-geist-mono placeholder:text-muted-foreground/50"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && filteredActions.length > 0) {
                navigate(filteredActions[0].path);
                onClose();
              }
            }}
          />
          <div className="px-1.5 py-0.5 border border-border-charcoal bg-white/5 text-[10px] font-geist-mono text-muted-foreground uppercase opacity-50">
            Esc
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto no-scrollbar p-2">
          {filteredActions.length > 0 ? (
            Object.entries(
              filteredActions.reduce((acc, action) => {
                if (!acc[action.category]) acc[action.category] = [];
                acc[action.category].push(action);
                return acc;
              }, {} as Record<string, CommandAction[]>)
            ).map(([category, actions]) => (
              <div key={category} className="mb-4 last:mb-0">
                <div className="px-3 py-2 text-[9px] font-bold text-primary-violet uppercase tracking-[0.2em] font-geist-mono">
                  {category}
                </div>
                <div className="space-y-1">
                  {actions.map(action => (
                    <button
                      key={action.id}
                      onClick={() => {
                        navigate(action.path);
                        onClose();
                      }}
                      className="w-full text-left px-3 py-3 hover:bg-white/[0.04] transition-colors flex items-center gap-4 group"
                    >
                      <div className="w-8 h-8 rounded-none border border-border-charcoal bg-white/[0.02] flex items-center justify-center group-hover:bg-primary-violet/10 group-hover:border-primary-violet/30 transition-colors">
                        <action.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary-violet transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-white group-hover:text-primary-violet transition-colors">{action.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{action.subtitle}</p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                         <Command className="w-3 h-3 text-muted-foreground/30" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-geist-mono">No actions found.</p>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-border-charcoal bg-white/[0.02] flex items-center justify-between font-geist-mono">
          <div className="flex gap-4">
             <span className="text-[9px] text-muted-foreground/50 flex items-center gap-1">
               <span className="px-1 py-0.5 border border-border-charcoal bg-black">↑↓</span> Navigate
             </span>
             <span className="text-[9px] text-muted-foreground/50 flex items-center gap-1">
               <span className="px-1 py-0.5 border border-border-charcoal bg-black">↵</span> Select
             </span>
          </div>
          <p className="text-[9px] text-muted-foreground/30 uppercase tracking-widest font-bold">LegalForge Core v2.5</p>
        </div>
      </motion.div>
    </div>
  );
}
