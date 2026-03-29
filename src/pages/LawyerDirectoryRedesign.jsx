import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Copy,
  Gavel,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { cn } from '../lib/utils';
import KineticTeamHybrid from '@/components/ui/kinetic-team-hybrid';

const emptyCaseForm = {
  title: '',
  description: '',
  case_no: '',
  priority: 'medium',
  client_name: '',
  client_email: '',
  case_type: 'Civil',
  court: '',
  deadline: '',
};

const priorityStyles = {
  critical: 'border-red-500/20 bg-red-500/10 text-red-200',
  high: 'border-amber-500/20 bg-amber-500/10 text-amber-100',
  medium: 'border-sky-500/20 bg-sky-500/10 text-sky-100',
  low: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
};

const fetchWithTimeout = async (url, options = {}, timeout = 12000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return response;
  } catch (error) {
    clearTimeout(timer);
    throw error;
  }
};

const formatDate = (value) => {
  if (!value) return 'Not available';
  try {
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return value;
  }
};

export default function LawyerDirectoryRedesign() {
  const { user, token, isAdmin } = useAuth();
  const [lawyers, setLawyers] = useState([]);
  const [adminProfile, setAdminProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [practiceFilter, setPracticeFilter] = useState('all');
  const [selectedLawyerEmail, setSelectedLawyerEmail] = useState('');
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignSuccess, setAssignSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedFirmId, setCopiedFirmId] = useState(false);
  const [form, setForm] = useState(emptyCaseForm);

  useEffect(() => {
    if (token) {
      fetchDirectory();
    }
  }, [token]);

  const fetchDirectory = async () => {
    setLoading(true);
    try {
      const response = await fetchWithTimeout('/api/lawyers/directory', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Directory request failed');
      const data = await response.json();
      const roster = data.lawyers || [];
      setLawyers(roster);
      setAdminProfile(data.admin || null);
      setSelectedLawyerEmail((current) => {
        if (current && roster.some((lawyer) => lawyer.email === current)) {
          return current;
        }
        return roster[0]?.email || '';
      });
    } catch (error) {
      console.error('Failed to fetch lawyer directory:', error);
      setLawyers([]);
      setAdminProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const practiceFilters = useMemo(() => {
    const values = new Set();
    lawyers.forEach((lawyer) => {
      (lawyer.practice_areas || []).forEach((area) => values.add(area));
    });
    return ['all', ...Array.from(values)];
  }, [lawyers]);

  const filteredLawyers = useMemo(() => {
    return lawyers.filter((lawyer) => {
      const searchText = `${lawyer.name} ${lawyer.designation} ${lawyer.email} ${(lawyer.practice_areas || []).join(' ')}`.toLowerCase();
      const matchesSearch = !searchQuery || searchText.includes(searchQuery.toLowerCase());
      const matchesPractice =
        practiceFilter === 'all' || (lawyer.practice_areas || []).includes(practiceFilter);
      return matchesSearch && matchesPractice;
    });
  }, [lawyers, practiceFilter, searchQuery]);

  const selectedLawyer =
    lawyers.find((lawyer) => lawyer.email === selectedLawyerEmail) || filteredLawyers[0] || null;

  useEffect(() => {
    if (!selectedLawyer && filteredLawyers[0]) {
      setSelectedLawyerEmail(filteredLawyers[0].email);
    }
  }, [filteredLawyers, selectedLawyer]);

  const teamMembers = filteredLawyers.map((lawyer) => ({
    id: lawyer.email,
    name: lawyer.name,
    role: lawyer.designation,
    image: lawyer.src,
    subtitle: `${lawyer.active_cases} active cases • ${lawyer.upcoming_hearings} hearings due`,
  }));

  const stats = useMemo(() => {
    const activeCases = lawyers.reduce((sum, lawyer) => sum + (lawyer.active_cases || 0), 0);
    const hearings = lawyers.reduce((sum, lawyer) => sum + (lawyer.upcoming_hearings || 0), 0);
    const avgProgress =
      lawyers.length > 0
        ? Math.round(
            lawyers.reduce((sum, lawyer) => sum + (lawyer.average_progress || 0), 0) / lawyers.length
          )
        : 0;

    return [
      { label: 'Lawyers', value: lawyers.length, icon: ShieldCheck },
      { label: 'Active Matters', value: activeCases, icon: Briefcase },
      { label: 'Hearings Ahead', value: hearings, icon: CalendarDays },
      { label: 'Avg. Progress', value: `${avgProgress}%`, icon: BadgeCheck },
    ];
  }, [lawyers]);

  const openAssignModal = (lawyer) => {
    if (!isAdmin()) return;
    setAssignTarget(lawyer);
    setAssignSuccess(null);
    setForm(emptyCaseForm);
  };

  const submitCase = async (event) => {
    event.preventDefault();
    if (!assignTarget) return;
    setSubmitting(true);
    try {
      const response = await fetch('/api/lawyers/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          lawyer_email: assignTarget.email,
          lawyer_name: assignTarget.name,
        }),
      });

      if (!response.ok) throw new Error('Failed to create case');
      const data = await response.json();
      setAssignSuccess({
        title: form.title,
        lawyer: assignTarget.name,
        caseNo: data.case_no,
      });
      await fetchDirectory();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const copyFirmCode = async () => {
    if (!user?.firm_id) return;
    try {
      await navigator.clipboard.writeText(user.firm_id);
      setCopiedFirmId(true);
      setTimeout(() => setCopiedFirmId(false), 1600);
    } catch (error) {
      console.error('Unable to copy firm id', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] pt-28 pb-20 text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_35%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_30%)]" />

      <main className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-8 px-6">
        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.32)]">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.45em] text-amber-300/80">
                  Lawyers Command Desk
                </p>
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
                  Assign cases through a live team roster, not a blank list.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-white/60">
                  Every attorney in this firm is pulled from the workspace database, surfaced in the
                  lawyers page, and reused by the case assignment flow.
                </p>
              </div>
              <div className="rounded-2xl border border-amber-300/15 bg-amber-300/10 px-4 py-3 text-right">
                <div className="text-[10px] uppercase tracking-[0.35em] text-amber-100/80">Workspace Code</div>
                <div className="mt-1 text-xl font-semibold tracking-[0.2em] text-white">
                  {user?.firm_id || 'Unavailable'}
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-[1.4rem] border border-white/10 bg-black/25 p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/[0.06] p-2">
                      <stat.icon className="h-4 w-4 text-amber-200" />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-white/45">{stat.label}</span>
                  </div>
                  <div className="text-2xl font-semibold text-white">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.32)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-emerald-300/75">
                  Firm Lead
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  {adminProfile?.name || user?.name || 'Workspace Admin'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/55">
                  {adminProfile?.bio || 'Attorneys who register with this firm code are added directly to this roster and appear in case assignment.'}
                </p>
              </div>
              <img
                src={adminProfile?.src || user?.profile_picture || 'https://ui-avatars.com/api/?name=Admin'}
                alt={adminProfile?.name || 'Admin'}
                className="h-16 w-16 rounded-2xl border border-white/10 object-cover"
              />
            </div>

            <div className="mt-6 space-y-3 text-sm text-white/70">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-amber-200" />
                <span>{adminProfile?.firm_name || user?.firm_name || 'LegalAI Workspace'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-amber-200" />
                <span>{adminProfile?.email || 'admin@jurisai.com'}</span>
              </div>
            </div>

            <button
              onClick={copyFirmCode}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-white/[0.1]"
            >
              <Copy className="h-3.5 w-3.5" />
              {copiedFirmId ? 'Copied' : 'Copy Firm Code'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
