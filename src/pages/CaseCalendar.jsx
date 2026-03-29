import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Plus, X, Clock, MapPin, AlertCircle, FileText, User,
  Bell, Mail, CheckCircle2, Send, Sparkles, Database, ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { GradientWaveText } from '../components/ui/gradient-wave-text';
import { HighlightedText } from '../components/ui/highlighted-text';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { Button, buttonVariants } from '../components/ui/button';
import { cn } from '../lib/utils';
import { EventManager } from '../components/ui/event-manager';

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-12 right-12 z-[100] max-w-sm"
    >
      <div className={`flex items-center gap-4 px-8 py-5 rounded-[2rem] border ${
        type === 'success' 
          ? 'bg-[#050505] border-border' 
          : 'bg-background border-red-500/20'
      } shadow-2xl`}>
        {type === 'success' ? (
          <CheckCircle2 className="w-5 h-5 text-foreground" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-400" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-1">
            {type === 'success' ? 'SYSTEM_NOTIFICATION' : 'ERROR_LOG'}
          </p>
          <p className="text-xs text-foreground font-bold truncate">{message}</p>
        </div>
        <button onClick={onClose} className="text-foreground/20 hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
      </div>
    </motion.div>
  );
}

export default function CaseCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [sendingReminder, setSendingReminder] = useState(null);
  const { token } = useAuth();
  
  const [newEvent, setNewEvent] = useState({
    title: '', date: '', time: '', type: 'hearing',
    court: '', case_no: '', severity: 'medium', description: '', lawyers: '',
    client_name: '', client_email: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/events', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        const evts = data.events || data || [];
        setEvents(Array.isArray(evts) ? evts : []);
        
        if (evts.length === 0) {
          await seedDemoData();
        }
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const seedDemoData = async () => {
    try {
      // If we don't have backend populated, let's inject rich, deeply-logical dummy cases to showcase the architectural workflow
      const generateRichDummyCases = () => [
        {
          id: "seed-1",
          title: "Merger Acquisition: TechCorp",
          description: "Full audit of Intellectual Property cross-border transfers.",
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          time: "09:00",
          type: "Discovery",
          severity: "high",
          lawyers: ["Sarah Jenkins"],
          status: "In Progress",
          progress: 65,
          clientName: "TechCorp Global",
          report: "- 0900: Initiated deep IP scan.\n- 1130: Discovered unauthorized open-source licensing compliance failure.\n- Next Action: Draft emergency cease protocol."
        },
        {
          id: "seed-2",
          title: "Federal Appeals: Doe vs State",
          description: "Final hearing preparation for constitutional violations.",
          date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
          time: "14:30",
          type: "Trial Prep",
          severity: "critical",
          lawyers: ["Michael Thorne"],
          status: "Assigned",
          progress: 15,
          clientName: "John Doe",
          report: "Awaiting final batch of depositions from the 5th Circuit prior to binder assembly."
        },
        {
          id: "seed-3",
          title: "Patent Infringement: BioHealth",
          description: "Defending core genetic patents against foreign entity.",
          date: new Date(Date.now() + 259200000).toISOString().split('T')[0],
          time: "11:00",
          type: "Hearing",
          severity: "medium",
          lawyers: ["Elena Rossi"],
          status: "Pending",
          progress: 90,
          clientName: "BioHealth Inc",
          report: "Argument fully constructed. Awaiting judicial assignment in the Delaware District."
        },
        {
          id: "seed-4",
          title: "Corporate Restructuring: Apex Dynamics",
          description: "Executing massive layoffs compliance review and union negotiations.",
          date: new Date(Date.now() - 345600000).toISOString().split('T')[0],
          time: "08:00",
          type: "Consultation",
          severity: "high",
          lawyers: ["Robert Vance"],
          status: "In Progress",
          progress: 45,
          clientName: "Apex Dynamics",
          report: "Union reps have stalled the proceedings based on article 4 severance clauses. Re-evaluating strategy."
        },
        {
          id: "seed-5",
          title: "Class Action Defense: EcoWater",
          description: "Preliminary injunction hearing regarding water table contamination claims.",
          date: new Date(Date.now() + 518400000).toISOString().split('T')[0],
          time: "10:30",
          type: "Hearing",
          severity: "critical",
          lawyers: ["Sarah Jenkins", "Michael Thorne"],
          status: "Assigned",
          progress: 5,
          clientName: "EcoWater Solutions",
          report: "Gathering environmental expert testimonies to counter EPA's preliminary findings."
        },
        {
          id: "seed-6",
          title: "Antitrust Litigation: OmniCorp",
          description: "Preparing defense matrix for monopolistic practice allegations.",
          date: new Date(Date.now() + 864000000).toISOString().split('T')[0],
          time: "13:00",
          type: "Trial Prep",
          severity: "medium",
          lawyers: ["Elena Rossi"],
          status: "In Progress",
          progress: 30,
          clientName: "OmniCorp Ltd.",
          report: "Reviewing decade-long email archives for DOJ subpoenas."
        },
        {
          id: "seed-7",
          title: "Intellectual Property Theft: SynthWave",
          description: "Emergency restraining order against former lead developer.",
          date: new Date(Date.now() + 1209600000).toISOString().split('T')[0],
          time: "16:00",
          type: "Hearing",
          severity: "high",
          lawyers: ["Robert Vance"],
          status: "Pending",
          progress: 10,
          clientName: "SynthWave Audio",
          report: "Filing emergency injunction tomorrow morning in federal court."
        },
        {
          id: "seed-8",
          title: "Real Estate Zoning: Zenith Towers",
          description: "City council zoning dispute representation.",
          date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
          time: "09:30",
          type: "Consultation",
          severity: "low",
          lawyers: ["Michael Thorne"],
          status: "Completed",
          progress: 100,
          clientName: "Zenith Development",
          report: "Zoning board approved the variance. Case closed."
        },
        {
          id: "seed-9",
          title: "Employment Dispute: TechLease",
          description: "Wrongful termination claim involving senior management.",
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          time: "15:00",
          type: "Discovery",
          severity: "medium",
          lawyers: ["Elena Rossi"],
          status: "In Progress",
          progress: 20,
          clientName: "TechLease Inc",
          report: "Reviewing employee handbook and termination notices."
        },
        {
          id: "seed-10",
          title: "Trade Secret Theft: QuantumBits",
          description: "Injunction against competitor using stolen core algorithms.",
          date: new Date(Date.now() + 259200000).toISOString().split('T')[0],
          time: "11:30",
          type: "Hearing",
          severity: "critical",
          lawyers: ["Sarah Jenkins"],
          status: "Pending",
          progress: 40,
          clientName: "QuantumBits Ltd",
          report: "Technical expert witness confirmed code signature matches."
        },
        {
          id: "seed-11",
          title: "Tax Evasion Defense: GoldMining Corp",
          description: "IRS audit representation for offshore asset disclosures.",
          date: new Date(Date.now() + 432000000).toISOString().split('T')[0],
          time: "10:00",
          type: "Consultation",
          severity: "high",
          lawyers: ["Robert Vance"],
          status: "Assigned",
          progress: 15,
          clientName: "GoldMining Corp",
          report: "Reconstructing five years of financial transcripts."
        },
        {
          id: "seed-12",
          title: "Environment Regulation: GreenEarth",
          description: "Compliance certification for new renewable plant.",
          date: new Date(Date.now() + 604800000).toISOString().split('T')[0],
          time: "14:00",
          type: "Trial Prep",
          severity: "low",
          lawyers: ["Michael Thorne"],
          status: "Completed",
          progress: 100,
          clientName: "GreenEarth Energy",
          report: "Certification issued by state board."
        },
        {
          id: "seed-13",
          title: "Contract Negotiation: SkyNet Systems",
          description: "Global procurement agreement with defense contractors.",
          date: new Date(Date.now() + 864000000).toISOString().split('T')[0],
          time: "09:00",
          type: "Consultation",
          severity: "medium",
          lawyers: ["Elena Rossi"],
          status: "Pending",
          progress: 60,
          clientName: "SkyNet Systems",
          report: "Section 12.4 on liability caps is the current bottleneck."
        },
        {
          id: "seed-14",
          title: "Defamation Suit: StarMedia",
          description: "Representing journalist against major studio claims.",
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          time: "11:00",
          type: "Discovery",
          severity: "high",
          lawyers: ["Sarah Jenkins"],
          status: "In Progress",
          progress: 75,
          clientName: "Lara Croft (Journalist)",
          report: "Shield law protections invoked in preliminary motion."
        }
      ];
      setEvents(generateRichDummyCases());
    } catch (err) {
      console.error('Failed to seed demo:', err);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newEvent, lawyers: newEvent.lawyers ? newEvent.lawyers.split(',').map(s => s.trim()) : [] };
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchEvents();
        setIsModalOpen(false);
        setNewEvent({ title: '', date: '', time: '', type: 'hearing', court: '', case_no: '', severity: 'medium', description: '', lawyers: '', client_name: '', client_email: '' });
      }
    } catch (err) {
      console.error('Failed to add event:', err);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Delete this record?')) return;
    try {
      await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      fetchEvents();
      setSelectedEvent(null);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleRemindClient = async (event) => {
    setSendingReminder(event.id);
    try {
      const res = await fetch(`/api/events/${event.id}/remind-client`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (res.ok) {
        setToast({
          message: data.message || `Protocol sent to ${event.client_name || 'entity'}`,
          type: 'success'
        });
      } else {
        setToast({ message: data.detail || 'Protocol transmission failed', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network transmission error', type: 'error' });
    } finally {
      setSendingReminder(null);
    }
  };

  const isTomorrow = (dateStr) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return dateStr === tomorrow.toISOString().split('T')[0];
  };

  const isUpcoming = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    return dateStr >= today && dateStr <= threeDaysLater.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("10:00");

  const timeSlots = Array.from({ length: 37 }, (_, i) => {
    const totalMinutes = i * 15;
    const hour = Math.floor(totalMinutes / 60) + 9;
    const minute = totalMinutes % 60;
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  });

  const formatEventsForManager = (backendEvents) => {
    if (!Array.isArray(backendEvents)) return [];
    return backendEvents.map(e => {
      if (!e || !e.date) return null;
      const parts = e.date.split('-');
      if (parts.length < 3) return null;
      const [year, month, day] = parts;
      const [hour, minute] = (e.time || '10:00').split(':');
      const start = new Date(year, month - 1, day, hour, minute);
      const end = new Date(year, month - 1, day, parseInt(hour) + 1, minute);
      
      let color = 'blue';
      if (e.severity === 'critical') color = 'red';
      else if (e.severity === 'high') color = 'orange';
      else if (e.severity === 'medium') color = 'blue';
      else if (e.severity === 'low') color = 'green';

      return {
        id: e.id || Math.random().toString(),
        title: e.title,
        description: e.description,
        report: e.description, // Mapped to report logic module
        handler: e.lawyers?.[0] || 'Unassigned',
        status: e.status || e.type || 'Assigned',
        progress: e.progress || 0,
        startTime: start,
        endTime: end,
        color,
        category: e.type || 'hearing',
        tags: [e.court, e.case_no].filter(Boolean)
      };
    }).filter(Boolean);
  };

  const currentManagerEvents = formatEventsForManager(events);

  const upcomingEvents = events
    .filter(e => e && e.date && e.date >= new Date().toISOString().split('T')[0])
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const backgroundImageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop";

  const handleManagerEventCreate = async (eventData) => {
    // Determine severity from color
    let severity = 'medium';
    if (eventData.color === 'red') severity = 'critical';
    else if (eventData.color === 'orange') severity = 'high';
    else if (eventData.color === 'green') severity = 'low';

    const dateStr = eventData.startTime.toISOString().split('T')[0];
    const timeStr = eventData.startTime.toTimeString().slice(0, 5);

    try {
      const payload = { 
        title: eventData.title,
        date: dateStr,
        time: timeStr,
        type: eventData.category || 'hearing',
        court: eventData.tags?.[0] || '',
        case_no: eventData.tags?.[1] || '',
        severity,
        description: eventData.description,
        lawyers: eventData.attendees || []
      };
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchEvents();
      }
    } catch (err) {
      console.error('Failed to add event:', err);
    }
  };

  return (
    <div 
      className="w-full min-h-screen bg-cover bg-center bg-fixed relative flex flex-col items-center pt-24 pb-12 px-6 lg:px-8"
      style={{ backgroundImage: `url(${backgroundImageUrl})` }}
    >
      {/* Immersive Overlay */}
      <div className="absolute inset-0 bg-background/40 backdrop-blur-[4px] pointer-events-none z-0"></div>

      
      {/* HEADER */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex flex-col items-center text-center gap-1 relative z-10 w-full max-w-4xl shrink-0 mb-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground italic mb-1">
            <HighlightedText from="bottom" delay={0.2}>JurisCore™ Docket</HighlightedText>
          </h1>
          <p className="text-foreground/60 font-medium text-xs italic max-w-2xl mx-auto mb-4">
            Strategic scheduling and neural-link case management.
          </p>
        </div>
      </motion.div>

      <div className="flex-1 w-full max-w-7xl relative z-10 flex flex-col mb-12">
        {/* EVENT MANAGER ENGINE */}
        <motion.div 
          initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.1 }}
          className="w-full relative group flex flex-col"
        >
          {/* Refined Glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000 pointer-events-none"></div>
          
          <EventManager
            events={currentManagerEvents}
            onEventCreate={handleManagerEventCreate}
            onEventDelete={handleDeleteEvent}
            onEventUpdate={() => fetchEvents()}
            categories={["Hearing", "Trial Prep", "Discovery", "Consultation", "Assigned"]}
            defaultView="month"
            className="relative z-10 w-full flex flex-col"
          />
        </motion.div>
      </div>





      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
