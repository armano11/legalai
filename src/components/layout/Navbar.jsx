import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Scale, ChevronDown, LogOut, Settings, LayoutDashboard, Bell, Briefcase, Gavel } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('jurisai_token');
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch {}
  };

  const markAllRead = async () => {
    const token = localStorage.getItem('jurisai_token');
    try {
      await fetch('/api/notifications/read-all', { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const markRead = async (id) => {
    const token = localStorage.getItem('jurisai_token');
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Research', path: '/research' },
    { name: 'Contracts', path: '/contracts' },
    { name: 'Drafts', path: '/drafts' },
    { name: 'Cases', path: '/cases' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'Lawyers', path: '/lawyers' },
  ];

  return (
    <motion.header 
      className={`fixed top-0 w-full z-50 transition-all duration-500 pt-4 px-4 sm:px-8`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={`mx-auto max-w-7xl transition-all duration-500 rounded-2xl ${scrolled ? 'glass-panel py-3 px-6' : 'bg-transparent py-4 px-2'}`}>
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Scale className="h-4 w-4 text-primary group-hover:text-white transition-colors" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white uppercase">
              Juris<span className="text-primary-violet italic">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1 glass-panel px-2 py-1.5 rounded-full shadow-none border-white/5">
              {navLinks.map((link) => {
                const isActive = location.pathname.startsWith(link.path);
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`relative px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
                      isActive ? 'text-white' : 'text-muted-foreground hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-primary-violet/20 border border-primary-violet/30 rounded-full shadow-[0_0_10px_rgba(124,58,237,0.15)]"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{link.name}</span>
                  </Link>
                );
              })}
              {isAdmin() && (
                <Link
                  to="/admin"
                  className="relative px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-foreground/40 hover:text-foreground transition-colors"
                >
                  Admin
                </Link>
              )}
            </nav>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 px-2 py-1 rounded-md border border-border-charcoal bg-black/40 text-[9px] font-geist-mono text-muted-foreground/50 border-dashed">
              <span className="text-[10px]">⌘</span> K
            </div>

            {/* 🔔 Notification Bell */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
                  className="relative p-2 rounded-full hover:bg-border/20 transition-colors"
                >
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isNotifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-3 w-80 glass-panel rounded-2xl overflow-hidden z-50 border border-border"
                    >
                      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
                        <span className="text-xs font-black text-foreground uppercase tracking-widest">Notifications</span>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-[320px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center">
                            <Bell className="w-6 h-6 mx-auto mb-2 text-muted-foreground/30" />
                            <p className="text-xs text-muted-foreground/50">No notifications</p>
                          </div>
                        ) : (
                          notifications.slice(0, 10).map(n => (
                            <div
                              key={n.id}
                              onClick={() => { markRead(n.id); setIsNotifOpen(false); }}
                              className={`px-4 py-3 border-b border-border/30 cursor-pointer hover:bg-border/20 transition-colors ${
                                !n.read ? 'bg-indigo-500/[0.03]' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${
                                  n.type === 'case_assigned' ? 'bg-indigo-500/10' :
                                  n.type === 'hearing_reminder' ? 'bg-amber-500/10' : 'bg-zinc-500/10'
                                }`}>
                                  {n.type === 'case_assigned' ? <Briefcase className="w-3 h-3 text-indigo-400" /> :
                                   n.type === 'hearing_reminder' ? <Gavel className="w-3 h-3 text-amber-400" /> :
                                   <Bell className="w-3 h-3 text-muted-foreground" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-foreground">{n.title}</span>
                                    {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                                  <span className="text-[9px] text-muted-foreground/50 mt-1 block">
                                    {n.created_at ? new Date(n.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {!user ? (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-all">
                  Sign In
                </Link>
                <Link to="/register" className="px-6 py-2.5 bg-primary text-background rounded-full text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all">
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border border-border hover:bg-border/20 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black text-primary uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-3 w-56 glass-panel rounded-2xl overflow-hidden z-50 p-2 border border-border"
                    >
                      <div className="px-3 py-3 border-b border-border/50 mb-1">
                        <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      
                      <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-border/30 rounded-lg transition-colors" onClick={() => setIsProfileOpen(false)}>
                        <LayoutDashboard className="h-4 w-4" /> Dashboard
                      </Link>

                      <Link to="/settings" onClick={() => setIsProfileOpen(false)} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-border/30 rounded-lg transition-colors mt-1">
                        <Settings className="h-4 w-4" /> Profile Settings
                      </Link>
                      
                      <button onClick={() => { logout(); setIsProfileOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors mt-1">
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
          
        </div>
      </div>

    </motion.header>
  );
}
