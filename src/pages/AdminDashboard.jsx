import { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Activity, FileText, Search, Shield, Copy, 
  Trash2, RefreshCw, Key, Eye,
  BarChart3, UserCheck, TrendingUp, ArrowUpRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';

const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [firmUsers, setFirmUsers] = useState([]);
  const [stats, setStats] = useState({ total_users: 0, total_searches: 0, total_drafts: 0, total_activities: 0, daily_data: [] });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userActivities, setUserActivities] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { token, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [usersRes, firmRes, statsRes, activityRes] = await Promise.all([
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/firm-users', { headers }),
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/activity', { headers })
      ]);

      if (usersRes.ok) setUsers((await usersRes.json()).users || []);
      if (firmRes.ok) setFirmUsers((await firmRes.json()).users || []);
      if (statsRes.ok) setStats(await statsRes.json());
      if (activityRes.ok) setActivities((await activityRes.json()).activities || []);
    } catch (err) {
      setError('Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [isAdmin, loadData, navigate]);

  const viewUserActivity = async (userId) => {
    setSelectedUserId(userId);
    try {
      const res = await fetch(`/api/admin/activity?user_id=${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserActivities(data.activities || []);
      }
    } catch (err) {
      console.error('Failed to load user activity:', err);
    }
  };

  const handleUpdateUser = async (userId, plan = null, role = null) => {
    try {
      const params = new URLSearchParams();
      if (plan) params.set('plan', plan);
      if (role) params.set('role', role);
      await fetch(`/api/admin/users/${userId}?${params.toString()}`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
    } catch (err) { console.error('Update failed:', err); }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteConfirm(null);
      setSelectedUserId(null);
      loadData();
    } catch (err) { console.error('Delete failed:', err); }
  };

  const copyFirmId = () => {
    if (user?.firm_id) {
      navigator.clipboard.writeText(user.firm_id);
    }
  };

  const statCards = [
    { label: 'Firm Members', value: firmUsers.length, icon: UserCheck },
    { label: 'Total Users', value: stats.total_users, icon: Users },
    { label: 'Searches', value: stats.total_searches, icon: Search },
    { label: 'Documents', value: stats.total_drafts, icon: FileText },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'members', label: 'Firm Members', icon: UserCheck },
    { id: 'all-users', label: 'All Users', icon: Users },
    { id: 'activity', label: 'Activity Log', icon: Activity },
  ];

  return (
    <div className="container mx-auto px-6 lg:px-8 py-24 min-h-screen bg-background">
      
      {/* HEADER */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-14 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-primary/5 px-3 py-1 mb-4">
            <Shield className="w-3 h-3 text-foreground/60" />
            <span className="text-[10px] font-black text-foreground/60 uppercase tracking-[0.14em]">Firm Admin</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground mb-1">{user?.firm_name || 'System Admin'}</h1>
          <p className="text-foreground/40 font-medium">Manage your team, review incoming work, and keep the firm moving.</p>
        </div>
        <div className="flex items-center gap-4">
          {user?.firm_id && (
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-[#050505] border border-border cursor-pointer group" onClick={copyFirmId}>
              <Key className="w-4 h-4 text-foreground/40" />
              <span className="text-sm font-black text-foreground tracking-widest">{user.firm_id}</span>
              <Copy className="w-3.5 h-3.5 text-foreground/10 group-hover:text-foreground transition-colors" />
            </div>
          )}
          <button onClick={loadData} className="h-12 px-6 bg-primary text-primary-foreground text-xs font-black rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> REFRESH
          </button>
        </div>
      </motion.div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {statCards.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: i * 0.05 }}
            className="rounded-lg border border-white/5 bg-[#050505] p-5 transition-all group hover:border-white/15"
          >
            <div className="p-2.5 rounded-xl bg-primary/5 border border-border inline-block mb-6">
              <stat.icon className="w-5 h-5 text-foreground/40 group-hover:text-foreground transition-colors" />
            </div>
            <div className="text-2xl font-black text-foreground mb-1 tracking-tighter">{loading ? '...' : stat.value}</div>
            <div className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em]">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* TABS */}
      <div className="mb-10 flex gap-2 overflow-x-auto rounded-lg border border-white/5 bg-[#050505] p-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-foreground/40 hover:text-foreground hover:bg-primary/5'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="relative z-10">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex h-[400px] flex-col rounded-lg border border-white/5 bg-[#050505] p-10">
              <h3 className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-foreground/30">
                <TrendingUp className="w-4 h-4" /> Search Activity
              </h3>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.daily_data || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#444', fontSize: 10, fontWeight: 900 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#444', fontSize: 10, fontWeight: 900 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="queries" stroke="#FFFFFF" strokeWidth={2} fillOpacity={1} fill="url(#adminGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: 0.1 }} className="max-h-[400px] overflow-y-auto rounded-lg border border-white/5 bg-[#050505] p-10">
              <h3 className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-foreground/30">
                <Activity className="w-4 h-4" /> Recent Activity
              </h3>
              {activities.length === 0 ? (
                <p className="text-foreground/20 text-xs text-center py-12 italic">No activity detected.</p>
              ) : (
                <div className="space-y-3">
                  {activities.slice(0, 10).map((act, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-primary/[0.01] border border-white/5 hover:border-border transition-all">
                      <div className={`w-2 h-2 rounded-full ${act.action === 'login' ? 'bg-primary' : 'bg-primary/20'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-foreground font-bold">{act.user_name || 'Entity'}</div>
                        <div className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest">{act.action}: {act.details}</div>
                      </div>
                      <span className="text-[10px] text-foreground/10 font-black shrink-0">{new Date(act.created_at).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {(activeTab === 'members' || activeTab === 'all-users') && (
          <div className="flex flex-col lg:flex-row gap-8">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex-1 overflow-hidden rounded-lg border border-white/5 bg-[#050505] shadow-2xl">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-primary/[0.01]">
                <h3 className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.16em]">
                  {activeTab === 'members' ? 'Firm Members' : 'All Users'}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left p-6 text-[10px] font-black text-foreground/30 uppercase tracking-widest">Identity</th>
                      <th className="text-left p-6 text-[10px] font-black text-foreground/30 uppercase tracking-widest">Credentials</th>
                      <th className="text-left p-6 text-[10px] font-black text-foreground/30 uppercase tracking-widest">Authorization</th>
                      <th className="text-left p-6 text-[10px] font-black text-foreground/30 uppercase tracking-widest">Plan</th>
                      <th className="text-left p-6 text-[10px] font-black text-foreground/30 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeTab === 'members' ? firmUsers : users).map(u => (
                      <tr key={u.id} className={`border-b border-white/5 hover:bg-primary/[0.02] transition-colors ${selectedUserId === u.id ? 'bg-primary/5' : ''}`}>
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/5 border border-border flex items-center justify-center text-sm font-black text-foreground">
                              {u.name?.charAt(0) || '?'}
                            </div>
                            <span className="text-sm font-bold text-foreground">{u.name}</span>
                          </div>
                        </td>
                        <td className="p-6 text-xs text-foreground/40 font-bold">{u.email}</td>
                        <td className="p-6">
                          <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-primary/5 border border-border text-foreground/60">{u.role}</span>
                        </td>
                        <td className="p-6">
                          <select 
                            value={u.plan} 
                            onChange={(e) => handleUpdateUser(u.id, e.target.value)}
                            className="bg-background border border-border rounded-lg px-3 py-2 text-[10px] font-black uppercase text-foreground tracking-widest outline-none hover:border-white/30 transition-all cursor-pointer"
                          >
                            <option value="trial">Trial</option>
                            <option value="basic">Basic</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        </td>
                        <td className="p-6">
                          <div className="flex gap-2">
                            <button onClick={() => viewUserActivity(u.id)} className="p-2 hover:bg-primary/10 rounded-xl transition-all text-foreground/20 hover:text-foreground">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteConfirm(u.id)} className="p-2 hover:bg-primary/10 rounded-xl transition-all text-foreground/20 hover:text-foreground">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Sidebar Activity */}
            <AnimatePresence>
              {selectedUserId && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="w-96 rounded-[2.5rem] border border-border bg-[#050505] overflow-hidden shrink-0 shadow-2xl h-fit sticky top-32"
                >
                  <div className="flex items-center justify-between border-b border-white/5 bg-primary/[0.01] p-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-foreground">User Activity</h3>
                    <button onClick={() => setSelectedUserId(null)} className="text-foreground/20 hover:text-foreground transition-colors">
                       <ArrowUpRight className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                  <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
                    {userActivities.map((act, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-primary/[0.02] border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full mt-2 bg-primary/20" />
                        <div>
                          <div className="text-[10px] font-black text-foreground uppercase tracking-widest mb-1">{act.action}</div>
                          <div className="text-xs text-foreground/40 font-medium mb-2">{act.details}</div>
                          <div className="text-[9px] text-foreground/20 font-black">{new Date(act.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg border border-border text-foreground text-sm">
              Cancel
            </button>
            <button onClick={() => handleDeleteUser(deleteConfirm)} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium">
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
