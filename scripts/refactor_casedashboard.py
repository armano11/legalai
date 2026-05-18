import re
import os

filepath = r'c:\Users\ARMAN\OneDrive\Desktop\legalai\src\pages\CaseDashboard.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Remove blobs
code = re.sub(r'<div className="absolute top-0 right-0 w-\[800px\].*?rgba\(99,102,241,0\.25\).*? />', '', code, flags=re.DOTALL)
code = re.sub(r'<div className="absolute bottom-0 left-0 w-\[600px\].*?rgba\(6,182,212,0\.2\).*? />', '', code, flags=re.DOTALL)

# 2. Root div classes
code = code.replace('bg-slate-950 bg-oled bg-dot-matrix-5', 'bg-zinc-950')
code = code.replace('selection:bg-indigo-500/30', 'selection:bg-zinc-100/30')

# 3. Remove dropshadows & blurs everywhere
code = re.sub(r'\s*drop-shadow-\[[^\]]+\]', '', code)
code = re.sub(r'\s*shadow-\[0_0_15px_rgba[^\]]+\]', '', code)
code = re.sub(r'\s*shadow-\[0_0_20px_rgba[^\]]+\]', '', code)
code = re.sub(r'\s*shadow-\[0_0_10px_rgba[^\]]+\]', '', code)
code = re.sub(r'\s*shadow-\[0_8px_30px_rgb[^\]]+\]', '', code)
code = re.sub(r'\s*backdrop-blur-xl\s*', ' ', code)
code = re.sub(r'\s*backdrop-blur-md\s*', ' ', code)
code = re.sub(r'\s*drop-shadow-sm\s*', ' ', code)
code = re.sub(r'\s*drop-shadow-md\s*', ' ', code)
code = re.sub(r'\s*drop-shadow\s*', ' ', code)
code = re.sub(r'\s*shadow-inner\s*', ' ', code)

# 4. Global typography replace
code = code.replace('text-[9px] font-black uppercase tracking-widest', 'text-[11px] font-medium text-zinc-500')
code = code.replace('text-[10px] font-black uppercase tracking-widest', 'text-[11px] font-medium text-zinc-500')
code = code.replace('text-[10px] font-black text-indigo-400', 'text-xs font-medium text-zinc-100')

# 5. Header overline & title
code = re.sub(r'<p className="text-xs font-semibold uppercase tracking-\[0\.3em\] text-cyan-400 mb-2.*?">.*?</p>', '<p className="text-sm text-zinc-500 mb-2">{isAdmin() ? \'Firm Command Center\' : \'My Active Matters\'}</p>', code, flags=re.DOTALL)
code = code.replace('text-4xl md:text-5xl font-bold text-white tracking-tight', 'text-2xl font-semibold text-zinc-100 tracking-tight')

# 6. Stat Cards
code = code.replace('rounded-[1.5rem] bg-slate-900/60 border border-white/[0.08]', 'rounded-xl bg-zinc-900 border border-zinc-800')
code = re.sub(r'<div className="p-2\.5 rounded-\[0\.8rem\] bg-white/\[0\.05\] border border-white/\[0\.06\]\s*"><s\.icon className=\{cn\("w-4 h-4", s\.color\)\} /></div>', '<s.icon className="w-4 h-4 text-zinc-500" />', code)
code = code.replace('text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400', 'text-xs font-medium text-zinc-500')
code = code.replace('text-3xl font-bold text-white', 'text-2xl font-semibold text-zinc-100 tabular-nums mt-1')

# 7. Case list cards
code = code.replace('rounded-2xl', 'rounded-lg')
code = code.replace('bg-card border-border hover:border-muted-foreground/20', 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700')
code = code.replace('bg-indigo-500/5 border-indigo-500/30', 'bg-zinc-800 border-zinc-600')
code = code.replace('text-[10px] text-muted-foreground', 'text-xs text-zinc-500')
code = code.replace('text-sm font-bold text-foreground mb-2', 'text-sm font-medium text-zinc-100 mb-2')
code = code.replace('text-[9px] font-black uppercase tracking-widest text-muted-foreground', 'text-[11px] font-mono text-zinc-500')

# 8. Priority Badges
code = code.replace("critical: 'bg-red-500/10 text-red-400 border-red-500/20'", "critical: 'bg-red-950 text-red-400'")
code = code.replace("high: 'bg-orange-500/10 text-orange-400 border-orange-500/20'", "high: 'bg-amber-950 text-amber-400'")
code = code.replace("medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'", "medium: 'bg-zinc-800 text-zinc-400'")
code = code.replace("low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'", "low: 'bg-emerald-950 text-emerald-500'")
code = code.replace('text-[8px] font-black uppercase border', 'text-[10px] font-medium')

# 9. Detail panel header
code = code.replace('border-white/[0.08] bg-slate-900/40', 'border-zinc-800 bg-zinc-900')
code = code.replace('<div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />', '')
code = code.replace('bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-400', 'bg-zinc-800 text-zinc-400 border-0 text-[11px] font-mono px-2 py-1 rounded')
code = code.replace('text-2xl lg:text-3xl font-bold text-white', 'text-xl font-semibold text-zinc-100')
code = code.replace('text-sm text-slate-400 mb-6 max-w-2xl leading-relaxed', 'text-sm text-zinc-500 leading-relaxed mb-6')

# 10. Stage Pipeline
code = re.sub(r'<button onClick=\{\(\) => changeStage\(stage\)\}.*?</button>', r'<div onClick={() => changeStage(stage)} className="flex items-center gap-2 transition-all cursor-pointer group"><div className={cn("w-2 h-2 rounded-full transition-all", isCurrent ? "bg-zinc-100" : isActive ? "bg-zinc-600" : "border border-zinc-700")} /><span className={cn("text-xs whitespace-nowrap", isCurrent ? "text-zinc-100 font-medium" : isActive ? "text-zinc-500" : "text-zinc-600 group-hover:text-zinc-400")}>{stage}</span></div>', code, flags=re.DOTALL)
code = re.sub(r'\{i < VALID_STAGES\.length - 1 && <ChevronRight.*?/>\}', r'{i < VALID_STAGES.length - 1 && <div className={cn("w-6 h-px mx-1", isActive ? "bg-zinc-600" : "bg-zinc-800")} />}', code, flags=re.DOTALL)

# 11. Meta info cards
code = code.replace('rounded-[1.25rem] bg-slate-900/60 border border-white/[0.08] hover:border-white/[0.15]', 'rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700')
code = code.replace('text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500', 'text-[11px] font-medium text-zinc-500')
code = code.replace('text-sm font-medium text-white', 'text-sm font-medium text-zinc-100')

# 12. Tabs
code = code.replace('text-[10px] font-black uppercase tracking-widest', 'text-xs font-medium')
code = code.replace('border-indigo-500 text-indigo-400', 'border-zinc-100 text-zinc-100')
code = code.replace('border-transparent text-muted-foreground hover:text-foreground', 'border-transparent text-zinc-500 hover:text-zinc-300')

# 13. Hearing cards
code = code.replace('bg-red-500/5 border-red-500/20', 'bg-zinc-900 border-l-2 border-l-red-500 border-zinc-800')
code = code.replace('bg-accent/30 border-border', 'bg-zinc-900 border-zinc-800')
code = code.replace('bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-semibold uppercase tracking-widest', 'bg-zinc-800 text-zinc-300 border border-zinc-700 text-[11px] font-medium')
code = code.replace('hover:bg-cyan-500/30', 'hover:bg-zinc-700')
code = code.replace('text-red-400 bg-red-500/10 border-red-500/20', 'text-red-400 bg-red-950 border-red-500/20')

# 14. Activity Log
code = code.replace('hover:bg-accent/30', 'hover:bg-zinc-900')
code = code.replace('bg-accent border border-border shrink-0', 'bg-zinc-900 border border-zinc-800 shrink-0')
code = code.replace('text-[9px] text-muted-foreground', 'text-[11px] text-zinc-600 font-mono')
code = code.replace('text-xs font-bold text-foreground', 'text-xs font-medium text-zinc-300')
code = code.replace('text-[11px] text-muted-foreground', 'text-[11px] text-zinc-500')

# 15. Modals & Forms
code = code.replace('bg-background/80', 'bg-black/60')
code = code.replace('bg-card border border-border', 'bg-zinc-950 border border-zinc-800')
code = code.replace('text-[11px] font-medium text-zinc-500 mb-1', 'text-[11px] font-medium text-zinc-500 mb-1') # Ensure replacement

# Filter bar
code = code.replace('bg-slate-900/60 border border-white/[0.08]', 'bg-zinc-900 border border-zinc-800')
code = code.replace('focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50', 'focus:border-zinc-600')
code = code.replace('bg-cyan-500 text-slate-950', 'bg-zinc-100 text-zinc-900')

# Buttons
code = code.replace('bg-indigo-500 text-white', 'bg-zinc-100 text-zinc-900')
code = code.replace('hover:bg-indigo-600', 'hover:bg-zinc-200')
code = code.replace('text-indigo-400 hover:text-indigo-300', 'text-zinc-100 hover:text-zinc-300')
code = code.replace('border-indigo-500/30', 'border-zinc-600')
code = code.replace('bg-indigo-500/5', 'bg-zinc-800')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(code)
print("Updated CaseDashboard.jsx")
