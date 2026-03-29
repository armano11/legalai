"use client"

import * as React from "react";
import { Settings, Plus, Edit2, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, isSameDay, isToday, getDate, getDaysInMonth, startOfMonth } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// --- TYPE DEFINITIONS ---
interface Day {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  hasEvent: boolean;
}

interface GlassCalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onAddEvent?: () => void;
  events?: any[];
  className?: string;
}

// --- HELPER TO HIDE SCROLLBAR ---
const ScrollbarHide = () => (
  <style>{`
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `}</style>
);


// --- MAIN COMPONENT ---
export const GlassCalendar = React.forwardRef<HTMLDivElement, GlassCalendarProps>(
  ({ className, selectedDate: propSelectedDate, onDateSelect, onAddEvent, events = [], ...props }, ref) => {
    const [currentMonth, setCurrentMonth] = React.useState(propSelectedDate || new Date());
    const [selectedDate, setSelectedDate] = React.useState(propSelectedDate || new Date());

    // Generate days with padding for the grid
    const { days, blanks } = React.useMemo(() => {
        const start = startOfMonth(currentMonth);
        const totalDays = getDaysInMonth(currentMonth);
        const firstDayOfMonth = start.getDay(); // 0 = Sunday, 1 = Monday...
        
        const eventDateStrings = (events || []).map(e => e.date);
        
        const daysArray: Day[] = [];
        for (let i = 0; i < totalDays; i++) {
            const date = new Date(start.getFullYear(), start.getMonth(), i + 1);
            const dateStr = format(date, "yyyy-MM-dd");
            daysArray.push({
                date,
                isToday: isToday(date),
                isSelected: isSameDay(date, selectedDate),
                hasEvent: eventDateStrings.includes(dateStr),
            });
        }
        return { days: daysArray, blanks: Array(firstDayOfMonth).fill(null) };
    }, [currentMonth, selectedDate, events]);

    const handleDateClick = (date: Date) => {
      setSelectedDate(date);
      onDateSelect?.(date);
    };
    
    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

    return (
      <div
        ref={ref}
        className={cn(
          "w-full max-w-[480px] rounded-[3rem] p-8 shadow-3xl overflow-hidden",
          "bg-background/20 backdrop-blur-3xl border border-border/50",
          "text-foreground font-sans",
          className
        )}
        {...props}
      >
        <ScrollbarHide />
        {/* Header: Tabs and Settings */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-1 rounded-2xl bg-background/40 p-1.5 border border-white/5">
            <button className="rounded-xl bg-primary px-5 py-2 text-[10px] font-black uppercase tracking-widest text-primary-foreground shadow-lg transition-all active:scale-95">
              Monthly
            </button>
            <button className="rounded-xl px-5 py-2 text-[10px] font-black uppercase tracking-widest text-foreground/40 transition-colors hover:text-foreground">
              Weekly
            </button>
          </div>
          <button className="p-3 text-foreground/70 transition-colors hover:bg-background/40 rounded-2xl border border-white/5">
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="mb-10 flex items-center justify-between px-2">
            <motion.p 
              key={format(currentMonth, "MMMM")}
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="text-5xl font-black tracking-tighter italic uppercase"
            >
                {format(currentMonth, "MMMM")}
            </motion.p>
            <div className="flex items-center space-x-3">
                <button onClick={handlePrevMonth} className="p-2.5 rounded-xl text-foreground/70 bg-primary/5 border border-white/5 hover:bg-primary/10 transition-all">
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={handleNextMonth} className="p-2.5 rounded-xl text-foreground/70 bg-primary/5 border border-white/5 hover:bg-primary/10 transition-all">
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>
        </div>

        {/* FULL MONTH GRID */}
        <div className="grid grid-cols-7 gap-y-6 gap-x-2">
            {/* Week Headers */}
            {weekDays.map(day => (
                <div key={day} className="text-center text-[10px] font-black text-foreground/20 uppercase tracking-[0.2em] mb-4">
                  {day}
                </div>
            ))}

            {/* Empty Slots */}
            {blanks.map((_, i) => <div key={`blank-${i}`} />)}

            {/* Actual Days */}
            {days.map((day) => (
                <div key={format(day.date, "yyyy-MM-dd")} className="flex flex-col items-center flex-shrink-0">
                    <button
                        onClick={() => handleDateClick(day.date)}
                        className={cn(
                            "group flex h-12 w-12 items-center justify-center rounded-2xl text-[13px] font-black italic transition-all duration-300 relative border",
                            {
                                "bg-primary text-primary-foreground border-white shadow-[0_0_30px_rgba(255,255,255,0.4)] scale-110 z-10": day.isSelected,
                                "bg-primary/5 border-white/5 text-foreground/40 hover:bg-primary/10 hover:border-border/50": !day.isSelected,
                            }
                        )}
                    >
                        {(day.isToday || day.hasEvent) && !day.isSelected && (
                            <span className={cn(
                              "absolute bottom-2 w-1 h-1 rounded-full transition-all group-hover:scale-150",
                              day.hasEvent ? "bg-primary" : "bg-primary/20"
                            )}></span>
                        )}
                        {getDate(day.date)}
                    </button>
                </div>
            ))}
        </div>
        
        {/* Divider */}
        <div className="mt-10 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Footer Actions */}
        <div className="mt-8 flex items-center justify-between">
           <button className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-widest text-foreground/40 transition-colors hover:text-foreground group">
             <Edit2 className="h-4 w-4 group-hover:rotate-12 transition-transform" />
             <span>Add Note</span>
           </button>
           <button 
             onClick={onAddEvent}
             className="flex items-center space-x-3 rounded-2xl bg-primary/[0.08] border border-border px-5 py-3 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
           >
             <Plus className="h-4 w-4" />
             <span>New Event</span>
           </button>
        </div>
      </div>
    );
  }
);

GlassCalendar.displayName = "GlassCalendar";
