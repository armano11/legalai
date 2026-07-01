
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { cn } from '../lib/utils';
import { isValidEmail, isValidPhone, sanitizePhoneInput } from '../utils/validators';
import TeamShowcase from '@/components/ui/team-showcase';
import { useNavigate } from 'react-router-dom';

const PRIORITY_STYLES = {
  critical: 'border-red-500/20 bg-red-500/10 text-red-200',
  high: 'border-amber-500/20 bg-amber-500/10 text-amber-100',
  medium: 'border-sky-500/20 bg-sky-500/10 text-sky-100',
  low: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
};

const FALLBACK_PRACTICES = [
  'Commercial Litigation',
  'Corporate Governance',
  'Regulatory Advisory',
  'Data Privacy',
  'Intellectual Property',
  'Employment Advisory',
  'Dispute Resolution',
  'Infrastructure Projects',
];

const FALLBACK_TEAM = [
  { name: 'Asha Kapoor', designation: 'Senior Litigation Counsel', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Nikhil Sharma', designation: 'Corporate Partner', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Priya Singh', designation: 'Head of Regulatory', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Arjun Mehta', designation: 'Senior Defense Counsel', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Meera Patel', designation: 'Family Law Specialist', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Vikram Rao', designation: 'M&A Counsel', image: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Ananya Bose', designation: 'Data Privacy Lead', image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Kabir Malik', designation: 'International Trade Counsel', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Sana Qureshi', designation: 'Arbitration Lead', image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Rohan Desai', designation: 'Corporate Counsel', image: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Ira Menon', designation: 'Employment Law Specialist', image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Dev Batra', designation: 'Commercial Disputes Counsel', image: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Tara Nair', designation: 'Constitutional Law Counsel', image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Yash Malhotra', designation: 'Real Estate Advisory Lead', image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Leena Joseph', designation: 'White Collar Defense Counsel', image: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Karan Sethi', designation: 'Technology Transactions Counsel', image: 'https://images.unsplash.com/photo-1548449112-96a38a643324?q=80&w=1200&auto=format&fit=crop' },
];

const EMPTY_CASE_FORM = {
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

const PROFILE_ADDRESSES = [
  '14 Marine Drive Chambers, Mumbai',
  '21 Defence Colony, New Delhi',
  '7 Residency Road, Bengaluru',
  '88 Jubilee Hills, Hyderabad',
  '42 Boat Club Road, Chennai',
  '16 Koregaon Park, Pune',
];

const CERTIFICATION_POOL = [
  'Supreme Court Practice Certification',
  'Advanced Corporate Compliance Program',
  'International Arbitration Fellowship',
  'Data Privacy & Cyber Law Certification',
  'Mediation and Negotiation Accreditation',
  'Forensic Case Strategy Workshop',
];

const MEMBERSHIP_POOL = [
  'Bar Council of India',
  'Supreme Court Bar Association',
  'International Bar Association',
  'Society of Indian Law Firms',
  'Corporate Counsel Forum of India',
  'Young Arbitration Practitioners Network',
];

const RECORD_FORUMS = [
  'Delhi High Court',
  'Bombay High Court',
  'National Company Law Tribunal',
  'Supreme Court of India',
  'Arbitration Centre, Mumbai',
  'Karnataka High Court',
];

const RECORD_OUTCOMES = [
  'Favorable settlement secured',
  'Interim relief granted',
  'Petition successfully defended',
  'Regulatory approval unlocked',
  'Cross-border dispute resolved',
  'Client liability reduced materially',
];

const seedNumber = (value, max) => {
  if (!max) return 0;
  const input = String(value || 'lawyer');
  let total = 0;
  for (let index = 0; index < input.length; index += 1) {
    total = (total * 31 + input.charCodeAt(index)) % 2147483647;
  }
  return total % max;
};

const pickSeeded = (seed, list, count = 1) => {
  if (!Array.isArray(list) || list.length === 0) return count === 1 ? '' : [];
  const values = [];
  const start = seedNumber(seed, list.length);
  for (let index = 0; index < count; index += 1) {
    values.push(list[(start + index) % list.length]);
  }
  return count === 1 ? values[0] : values;
};

const buildMockCurrentCases = (lawyer, index, practiceAreas) => {
  const matters = 2 + (index % 2);
  const primaryArea = practiceAreas[0] || FALLBACK_PRACTICES[index % FALLBACK_PRACTICES.length];
  const secondaryArea = practiceAreas[1] || FALLBACK_PRACTICES[(index + 2) % FALLBACK_PRACTICES.length];
  const stages = ['Filed', 'Investigation', 'Hearing'];
  const priorities = ['medium', 'high', 'critical'];
  const courts = ['Delhi High Court', 'Bombay High Court', 'NCLT Mumbai Bench'];

  return Array.from({ length: matters }, (_, caseIndex) => ({
    id: `${lawyer.email || lawyer.name || index}-matter-${caseIndex + 1}`,
    title: `${caseIndex % 2 === 0 ? primaryArea : secondaryArea} matter ${caseIndex + 1}`,
    case_no: `MAT-${2026 + caseIndex}-${index + 111 + caseIndex}`,
    stage: stages[(index + caseIndex) % stages.length],
    priority: priorities[(index + caseIndex) % priorities.length],
    progress: 28 + ((index * 17 + caseIndex * 19) % 58),
    deadline: new Date(Date.now() + (caseIndex + 4) * 86400000).toISOString(),
    case_type: caseIndex % 2 === 0 ? primaryArea : secondaryArea,
    court: courts[(index + caseIndex) % courts.length],
    client_name: `${lawyer.name?.split(' ')[0] || 'Client'} Holdings`,
    next_hearing: new Date(Date.now() + (caseIndex + 2) * 86400000).toISOString(),
    last_update: 'Drafted strategy note, coordinated filings, and updated client timeline.',
  }));
};

const enrichLawyerProfile = (baseLawyer, index) => {
  const seed = `${baseLawyer.email || baseLawyer.name || 'lawyer'}-${index}`;
  const practiceAreas = Array.isArray(baseLawyer.practice_areas) && baseLawyer.practice_areas.length
    ? baseLawyer.practice_areas
    : [
        FALLBACK_PRACTICES[index % FALLBACK_PRACTICES.length],
        FALLBACK_PRACTICES[(index + 3) % FALLBACK_PRACTICES.length],
      ];
  const currentCases = Array.isArray(baseLawyer.current_cases) && baseLawyer.current_cases.length
    ? baseLawyer.current_cases
    : buildMockCurrentCases(baseLawyer, index, practiceAreas);
  const activeCases = typeof baseLawyer.active_cases === 'number' ? baseLawyer.active_cases : currentCases.length;
  const averageProgress = typeof baseLawyer.average_progress === 'number'
    ? baseLawyer.average_progress
    : Math.round(currentCases.reduce((sum, item) => sum + (item.progress || 0), 0) / Math.max(currentCases.length, 1));
  const previousRecords = Array.from({ length: 3 }, (_, recordIndex) => ({
    year: 2022 + recordIndex,
    title: `${pickSeeded(`${seed}-record-title-${recordIndex}`, practiceAreas, 1)} advisory ${recordIndex + 1}`,
    outcome: pickSeeded(`${seed}-record-outcome-${recordIndex}`, RECORD_OUTCOMES, 1),
    forum: pickSeeded(`${seed}-record-forum-${recordIndex}`, RECORD_FORUMS, 1),
  }));

  return {
    ...baseLawyer,
    practice_areas: practiceAreas,
    current_cases: currentCases,
    active_cases: activeCases,
    average_progress: averageProgress,
    upcoming_hearings: baseLawyer.upcoming_hearings ?? currentCases.filter((item) => item.next_hearing).length,
    overdue_cases: baseLawyer.overdue_cases ?? (index % 2),
    availability: baseLawyer.availability || (activeCases >= 6 ? 'At capacity' : 'Available'),
    overloaded: baseLawyer.overloaded ?? activeCases >= 6,
    residence: baseLawyer.residence || PROFILE_ADDRESSES[index % PROFILE_ADDRESSES.length],
    date_of_birth: baseLawyer.date_of_birth || `19${86 + (index % 10)}-0${(index % 8) + 1}-1${index % 9}`,
    joined_firm: baseLawyer.joined_firm || `${2016 + (index % 8)}-0${(index % 8) + 1}-15`,
    emergency_contact: baseLawyer.emergency_contact || `+91 98${String(10000000 + index * 731).slice(0, 8)}`,
    assistant_name: baseLawyer.assistant_name || `${pickSeeded(`${seed}-assistant`, ['Ria', 'Kunal', 'Megha', 'Aarav', 'Sonia', 'Dev'], 1)} Desk`,
    success_rate: baseLawyer.success_rate || `${72 + (index % 21)}%`,
    billable_rate: baseLawyer.billable_rate || `INR ${18000 + index * 1250}/hr`,
    total_closed_cases: baseLawyer.total_closed_cases ?? 18 + (index % 24),
    consultation_volume: baseLawyer.consultation_volume ?? 45 + index * 3,
    certifications: Array.isArray(baseLawyer.certifications) && baseLawyer.certifications.length
      ? baseLawyer.certifications
      : pickSeeded(`${seed}-certifications`, CERTIFICATION_POOL, 2),
    memberships: Array.isArray(baseLawyer.memberships) && baseLawyer.memberships.length
      ? baseLawyer.memberships
      : pickSeeded(`${seed}-memberships`, MEMBERSHIP_POOL, 2),
    highlights: Array.isArray(baseLawyer.highlights) && baseLawyer.highlights.length
      ? baseLawyer.highlights
      : [
          `Leads ${practiceAreas[0].toLowerCase()} mandates for priority clients.`,
          `Known for concise strategy memos and fast hearing preparation.`,
          `Coordinates closely with research and client success teams.`,
        ],
    previous_records: Array.isArray(baseLawyer.previous_records) && baseLawyer.previous_records.length
      ? baseLawyer.previous_records
      : previousRecords,
  };
};

const buildFallbackRoster = () =>
  FALLBACK_TEAM.map((member, index) => {
    const currentCases = Array.from({ length: 2 }, (_, caseIndex) => ({
      id: `${index + 1}-${caseIndex + 1}`,
      title: `${member.designation} Matter ${caseIndex + 1}`,
      case_no: `CAS-2026-${index + 100 + caseIndex}`,
      stage: ['Filed', 'Investigation'][caseIndex % 2],
      priority: ['high', 'medium'][caseIndex % 2],
      progress: 30 + caseIndex * 25,
      deadline: new Date(Date.now() + (caseIndex + 3) * 86400000).toISOString(),
      case_type: FALLBACK_PRACTICES[(index + caseIndex) % FALLBACK_PRACTICES.length],
      court: ['Delhi High Court', 'Bombay High Court'][caseIndex % 2],
      client_name: `${member.name.split(' ')[0]} Client`,
      next_hearing: new Date(Date.now() + (caseIndex + 1) * 86400000).toISOString(),
      last_update: 'Prepared matter summary and client briefing notes.',
    }));

    return enrichLawyerProfile({
      id: `fallback-${index + 1}`,
      name: member.name,
      designation: member.designation,
      email: `${member.name.toLowerCase().replace(/[^a-z]+/g, '.')}@legalai.team`,
      src: member.image,
      bio: `${member.designation} with active experience in ${FALLBACK_PRACTICES[index % FALLBACK_PRACTICES.length].toLowerCase()}.`,
      phone: '+91 98765 43210',
      location: ['Mumbai, India', 'New Delhi, India', 'Bengaluru, India', 'Hyderabad, India'][index % 4],
      education: ['National Law School of India University', 'Faculty of Law, University of Delhi', 'Symbiosis Law School', 'NALSAR University of Law'][index % 4],
      languages: ['English', 'Hindi', index % 2 === 0 ? 'Marathi' : 'Tamil'],
      practice_areas: [FALLBACK_PRACTICES[index % FALLBACK_PRACTICES.length], FALLBACK_PRACTICES[(index + 3) % FALLBACK_PRACTICES.length]],
      experience_years: 5 + (index % 12),
      bar_registration: `BAR-${100000 + index}`,
      registered_at: new Date(Date.now() - (index + 1) * 86400000).toISOString(),
      active_cases: currentCases.length,
      upcoming_hearings: 1 + (index % 2),
      overdue_cases: index % 2,
      average_progress: Math.round(currentCases.reduce((sum, item) => sum + item.progress, 0) / currentCases.length),
      availability: 'Available',
      overloaded: false,
      current_cases: currentCases,
    }, index);
  });

const normalizeLawyer = (lawyer, index) => {
  const currentCases = Array.isArray(lawyer.current_cases)
    ? lawyer.current_cases.map((item, caseIndex) => ({
        id: item.id || `${lawyer.email || index}-${caseIndex}`,
        title: item.title || 'Untitled Matter',
        case_no: item.case_no || 'CASE-000',
        stage: item.stage || 'Filed',
        priority: item.priority || 'medium',
        progress: typeof item.progress === 'number' ? item.progress : 40,
        deadline: item.deadline || '',
        case_type: item.case_type || '',
        court: item.court || '',
        client_name: item.client_name || '',
        next_hearing: item.next_hearing || '',
        last_update: item.last_update || '',
      }))
    : [];

  const activeCases = typeof lawyer.active_cases === 'number' ? lawyer.active_cases : currentCases.length;
  const averageProgress = typeof lawyer.average_progress === 'number'
    ? lawyer.average_progress
    : currentCases.length
      ? Math.round(currentCases.reduce((sum, item) => sum + item.progress, 0) / currentCases.length)
      : 0;

  return enrichLawyerProfile({
    id: lawyer.id || lawyer.email || `lawyer-${index}`,
    name: lawyer.name || 'Attorney',
    designation: lawyer.designation || lawyer.role || 'Attorney',
    email: lawyer.email || '',
    src: lawyer.src || `https://ui-avatars.com/api/?name=${encodeURIComponent(lawyer.name || 'Attorney')}`,
    bio: lawyer.bio || lawyer.quote || 'Dedicated legal professional.',
    phone: lawyer.phone || '+91 98765 43210',
    location: lawyer.location || 'Not available',
    education: lawyer.education || 'Not available',
    languages: Array.isArray(lawyer.languages) ? lawyer.languages : ['English'],
    practice_areas: Array.isArray(lawyer.practice_areas) ? lawyer.practice_areas : [],
    experience_years: lawyer.experience_years ?? 6 + (index % 10),
    bar_registration: lawyer.bar_registration || `BAR-${100000 + index}`,
    registered_at: lawyer.registered_at || '',
    active_cases: activeCases,
    upcoming_hearings: lawyer.upcoming_hearings ?? currentCases.filter((item) => item.next_hearing).length,
    overdue_cases: lawyer.overdue_cases ?? 0,
    average_progress: averageProgress,
    availability: lawyer.availability || (activeCases >= 6 ? 'At capacity' : 'Available'),
    overloaded: lawyer.overloaded ?? activeCases >= 6,
    current_cases: currentCases,
  }, index);
};
const PROFILE_STORAGE_KEY = 'legalforge_lawyer_profile_details';

const readStoredProfiles = () => {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeStoredProfiles = (profiles) => {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // Ignore storage write failures and keep the UI responsive.
  }
};

const splitCommaValues = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const splitLineValues = (value) =>
  String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const joinList = (value) => Array.isArray(value) ? value.join(', ') : '';
const joinLines = (value) => Array.isArray(value) ? value.join('\n') : '';

const applyStoredProfile = (lawyer, profiles = {}) => {
  if (!lawyer?.email) return lawyer;
  const extra = profiles[lawyer.email];
  if (!extra) return lawyer;
  return {
    ...lawyer,
    ...extra,
    languages: extra.languages || lawyer.languages,
    practice_areas: extra.practice_areas || lawyer.practice_areas,
    certifications: extra.certifications || lawyer.certifications,
    memberships: extra.memberships || lawyer.memberships,
    highlights: extra.highlights || lawyer.highlights,
  };
};

const buildViewerLawyer = (viewer, profiles = {}) => {
  if (!viewer?.email) return null;
  const fallback = enrichLawyerProfile({
    id: `viewer-${viewer.email}`,
    name: viewer.name || 'Attorney',
    designation: viewer.role === 'admin' ? 'Managing Partner' : 'Legal Counsel',
    email: viewer.email,
    src: viewer.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewer.name || 'Attorney')}`,
    bio: viewer.bio || 'Legal Counsel',
    phone: '+91 98765 43210',
    location: viewer.firm_name || 'India',
    education: 'Not available',
    languages: ['English'],
    practice_areas: ['Dispute Resolution', 'Advisory'],
    registered_at: viewer.registered_at || new Date().toISOString(),
    current_cases: [],
    active_cases: 0,
    upcoming_hearings: 0,
    overdue_cases: 0,
    average_progress: 0,
    availability: 'Available',
  }, 0);
  return applyStoredProfile(fallback, profiles);
};

const mergeRosterWithViewer = (roster, viewer, profiles = {}) => {
  const normalized = (roster || []).map((lawyer) => applyStoredProfile(lawyer, profiles));
  const viewerLawyer = buildViewerLawyer(viewer, profiles);
  if (!viewerLawyer || viewer.role === 'admin') {
    return normalized;
  }
  const existingIndex = normalized.findIndex((lawyer) => lawyer.email === viewerLawyer.email);
  if (existingIndex >= 0) {
    normalized[existingIndex] = {
      ...normalized[existingIndex],
      ...viewerLawyer,
      current_cases: normalized[existingIndex].current_cases?.length ? normalized[existingIndex].current_cases : viewerLawyer.current_cases,
    };
    return normalized;
  }
  return [viewerLawyer, ...normalized];
};

const createProfileForm = (lawyer) => ({
  name: lawyer?.name || '',
  bio: lawyer?.bio || '',
  profile_picture: lawyer?.src || '',
  phone: lawyer?.phone || '',
  location: lawyer?.location || '',
  education: lawyer?.education || '',
  languages: joinList(lawyer?.languages),
  practice_areas: joinList(lawyer?.practice_areas),
  residence: lawyer?.residence || '',
  emergency_contact: lawyer?.emergency_contact || '',
  joined_firm: lawyer?.joined_firm || '',
  date_of_birth: lawyer?.date_of_birth || '',
  billable_rate: lawyer?.billable_rate || '',
  assistant_name: lawyer?.assistant_name || '',
  success_rate: lawyer?.success_rate || '',
  certifications: joinList(lawyer?.certifications),
  memberships: joinList(lawyer?.memberships),
  highlights: joinLines(lawyer?.highlights),
});

export default function LawyerDirectory() {
  const { user, token, isAdmin, refreshUser, updateLocalUser } = useAuth();
  const navigate = useNavigate();
  const [lawyers, setLawyers] = useState([]);
  const [adminProfile, setAdminProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [practiceFilter, setPracticeFilter] = useState('all');
  const [selectedLawyerEmail, setSelectedLawyerEmail] = useState('');
  const [profileModalEmail, setProfileModalEmail] = useState('');
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignSuccess, setAssignSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [copiedFirmId, setCopiedFirmId] = useState(false);
  const [storedProfiles, setStoredProfiles] = useState(() => readStoredProfiles());
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileNotice, setProfileNotice] = useState('');
  const [profileForm, setProfileForm] = useState(() => createProfileForm(buildViewerLawyer(user, readStoredProfiles())));
  const [form, setForm] = useState(EMPTY_CASE_FORM);
  const MotionPanel = motion.div;

  const fetchDirectory = useCallback(async () => {
    if (!token) {
      setLawyers([]);
      setAdminProfile(null);
      setSelectedLawyerEmail('');
      setProfileModalEmail('');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithTimeout('/api/lawyers/directory', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error('Directory fetch failed');
      const data = await response.json();
      const roster = Array.isArray(data.lawyers) ? data.lawyers.map(normalizeLawyer) : [];
      const resolved = mergeRosterWithViewer(roster, user, storedProfiles);
      setLawyers(resolved);
      setAdminProfile(data.admin || (user?.role === 'admin' ? buildViewerLawyer(user, storedProfiles) : null));
      const preferredEmail = user?.role !== 'admin' && user?.email && resolved.some((item) => item.email === user.email)
        ? user.email
        : resolved[0]?.email || '';
      setSelectedLawyerEmail((current) => current && resolved.some((item) => item.email === current) ? current : preferredEmail);
      setProfileModalEmail((current) => current && resolved.some((item) => item.email === current) ? current : '');
    } catch (error) {
      console.error('Failed to fetch lawyer directory', error);
      const fallback = mergeRosterWithViewer([], user, storedProfiles);
      setLawyers(fallback);
      setAdminProfile(user?.role === 'admin' ? buildViewerLawyer(user, storedProfiles) : null);
      setSelectedLawyerEmail(user?.role !== 'admin' && user?.email ? user.email : fallback[0]?.email || '');
      setProfileModalEmail('');
    } finally {
      setLoading(false);
    }
  }, [storedProfiles, token, user]);

  useEffect(() => {
    fetchDirectory();
  }, [fetchDirectory]);

  const currentUserLawyer = useMemo(() => {
    if (!user?.email) return null;
    return lawyers.find((lawyer) => lawyer.email === user.email) || buildViewerLawyer(user, storedProfiles);
  }, [lawyers, storedProfiles, user]);

  const workspaceLead = useMemo(() => {
    if (adminProfile?.email) return adminProfile;
    if (user?.role === 'admin') return buildViewerLawyer(user, storedProfiles);
    return null;
  }, [adminProfile, storedProfiles, user]);

  const openProfileEditor = () => {
    navigate('/settings');
  };

  const handleProfileFieldChange = (field, value) => {
    const nextValue = (field === 'phone' || field === 'emergency_contact')
      ? sanitizePhoneInput(value)
      : value;
    setProfileForm((current) => ({ ...current, [field]: nextValue }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!user?.email) return;

    const trimmedName = profileForm.name.trim();
    if (!trimmedName) {
      setProfileError('Name is required.');
      return;
    }
    if (profileForm.phone.trim() && !isValidPhone(profileForm.phone)) {
      setProfileError('Phone must be a valid 10-15 digit number.');
      return;
    }
    if (profileForm.emergency_contact.trim() && !isValidPhone(profileForm.emergency_contact)) {
      setProfileError('Emergency contact must be a valid 10-15 digit number.');
      return;
    }

    setProfileSaving(true);
    setProfileError('');
    setProfileNotice('');

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: trimmedName,
          bio: profileForm.bio,
          profile_picture: profileForm.profile_picture,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || 'Failed to update profile');
      }

      const extendedProfile = {
        phone: profileForm.phone,
        location: profileForm.location,
        education: profileForm.education,
        languages: splitCommaValues(profileForm.languages),
        practice_areas: splitCommaValues(profileForm.practice_areas),
        residence: profileForm.residence,
        emergency_contact: profileForm.emergency_contact,
        joined_firm: profileForm.joined_firm,
        date_of_birth: profileForm.date_of_birth,
        billable_rate: profileForm.billable_rate,
        assistant_name: profileForm.assistant_name,
        success_rate: profileForm.success_rate,
        certifications: splitCommaValues(profileForm.certifications),
        memberships: splitCommaValues(profileForm.memberships),
        highlights: splitLineValues(profileForm.highlights),
      };

      const nextStoredProfiles = {
        ...storedProfiles,
        [user.email]: extendedProfile,
      };
      setStoredProfiles(nextStoredProfiles);
      writeStoredProfiles(nextStoredProfiles);

      updateLocalUser({
        name: trimmedName,
        bio: profileForm.bio,
        profile_picture: profileForm.profile_picture,
      });

      const nextViewer = {
        ...user,
        name: trimmedName,
        bio: profileForm.bio,
        profile_picture: profileForm.profile_picture,
      };

      setLawyers((current) => mergeRosterWithViewer(current, nextViewer, nextStoredProfiles));
      if (user.role === 'admin') {
        setAdminProfile(buildViewerLawyer(nextViewer, nextStoredProfiles));
      }
      setSelectedLawyerEmail((current) => current || user.email);
      setIsEditingProfile(false);
      await refreshUser();
      setProfileNotice('Profile updated successfully. Your roster card and lawyer details are now current.');
    } catch (error) {
      setProfileError(error.message || 'Profile update failed');
    } finally {
      setProfileSaving(false);
    }
  };
  useEffect(() => {
    if (!user?.email) return;
    setLawyers((current) => mergeRosterWithViewer(current.length ? current : buildFallbackRoster(), user, storedProfiles));
    if (user.role === 'admin' && !adminProfile) {
      setAdminProfile(buildViewerLawyer(user, storedProfiles));
    }
    if (user.role !== 'admin') {
      setSelectedLawyerEmail((current) => current || user.email);
    }
  }, [adminProfile, storedProfiles, user]);

  useEffect(() => {
    if (!profileNotice) return undefined;
    const timer = window.setTimeout(() => setProfileNotice(''), 3000);
    return () => window.clearTimeout(timer);
  }, [profileNotice]);

  const practiceLabels = useMemo(() => {
    const labels = new Set(['all']);
    lawyers.forEach((lawyer) => (lawyer.practice_areas || []).forEach((item) => labels.add(item)));
    return Array.from(labels);
  }, [lawyers]);

  const filteredLawyers = useMemo(() => {
    return lawyers.filter((lawyer) => {
      const haystack = `${lawyer.name} ${lawyer.designation} ${lawyer.email} ${(lawyer.practice_areas || []).join(' ')}`.toLowerCase();
      const matchesSearch = !searchQuery || haystack.includes(searchQuery.toLowerCase());
      const matchesPractice = practiceFilter === 'all' || (lawyer.practice_areas || []).includes(practiceFilter);
      return matchesSearch && matchesPractice;
    });
  }, [lawyers, practiceFilter, searchQuery]);

  const selectedLawyer = filteredLawyers.find((item) => item.email === selectedLawyerEmail)
    || lawyers.find((item) => item.email === selectedLawyerEmail)
    || filteredLawyers[0]
    || lawyers[0]
    || null;
  const modalLawyer = lawyers.find((item) => item.email === profileModalEmail) || null;
  const filteredMembers = filteredLawyers.map((lawyer) => ({
    id: lawyer.email,
    name: lawyer.name,
    role: lawyer.designation,
    image: lawyer.src,
    social: {
      twitter: '#',
      linkedin: lawyer.email ? `mailto:${lawyer.email}` : '#',
      instagram: '#',
      behance: '#',
    },
  }));

  const stats = useMemo(() => {
    const activeCases = lawyers.reduce((sum, item) => sum + (item.active_cases || 0), 0);
    const hearings = lawyers.reduce((sum, item) => sum + (item.upcoming_hearings || 0), 0);
    const avgProgress = lawyers.length ? Math.round(lawyers.reduce((sum, item) => sum + (item.average_progress || 0), 0) / lawyers.length) : 0;
    return [
      { label: 'Lawyers', value: lawyers.length, icon: ShieldCheck },
      { label: 'Active Matters', value: activeCases, icon: Briefcase },
      { label: 'Hearings Ahead', value: hearings, icon: CalendarDays },
      { label: 'Avg. Progress', value: `${avgProgress}%`, icon: BadgeCheck },
    ];
  }, [lawyers]);

  const leastBusy = useMemo(() => {
    if (!lawyers.length) return null;
    return [...lawyers].sort((a, b) => (a.active_cases || 0) - (b.active_cases || 0))[0];
  }, [lawyers]);

  const openAssignModal = (lawyer) => {
    if (!isAdmin()) return;
    setAssignTarget(lawyer);
    setAssignSuccess(null);
    setAssignError('');
    setForm(EMPTY_CASE_FORM);
  };

  const submitCase = async (event) => {
    event.preventDefault();
    if (!assignTarget) return;
    if (form.client_email.trim() && !isValidEmail(form.client_email)) {
      setAssignError('Client email is invalid.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/lawyers/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, lawyer_email: assignTarget.email, lawyer_name: assignTarget.name }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || 'Failed to create case');
      }
      const data = await response.json();
      setAssignSuccess({ title: form.title, lawyer: assignTarget.name, caseNo: data.case_no });
      await fetchDirectory();
    } catch (error) {
      console.error(error);
      setAssignError(error.message || 'Case assignment failed');
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
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(32,32,36,0.96),rgba(9,9,11,1)_34%)] pt-28 pb-20 text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top_left,rgba(184,160,106,0.14),transparent_35%),radial-gradient(circle_at_top_right,rgba(85,110,138,0.16),transparent_32%)]" />
      <main className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-8 px-6">
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.32)]">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.45em] text-amber-300/80">Lawyers Command Desk</p>
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-5xl">Counsel operations with live profiles, visible workload, and assignment control.</h1>
                <p className="max-w-2xl text-sm leading-6 text-white/60">Review each lawyer with the level of detail an operations team actually needs: profile quality, active matters, progress, prior record, and assignment readiness in one place.</p>
              </div>
              {isAdmin() ? (
                <div className="rounded-2xl border border-amber-300/15 bg-amber-300/10 px-4 py-3 text-right">
                  <div className="text-[10px] uppercase tracking-[0.35em] text-amber-100/80">Workspace Code</div>
                  <div className="mt-1 text-xl font-semibold tracking-[0.2em] text-white">{user?.firm_id || 'Unavailable'}</div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
                  <div className="text-[10px] uppercase tracking-[0.35em] text-white/40">Workspace</div>
                  <div className="mt-1 text-base font-semibold text-white">{user?.firm_name || 'Darwin Legal'}</div>
                </div>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-[1.4rem] border border-white/10 bg-black/25 p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/[0.06] p-2"><stat.icon className="h-4 w-4 text-amber-200" /></div>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-white/45">{stat.label}</span>
                  </div>
                  <div className="text-2xl font-semibold text-white">{stat.value}</div>
                </div>
              ))}
            </div>

            {isAdmin() && leastBusy ? (
              <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[1.4rem] border border-emerald-400/15 bg-emerald-400/8 px-4 py-3">
                <Sparkles className="h-4 w-4 text-emerald-300" />
                <p className="text-sm text-white/70">Smart suggestion: <span className="font-semibold text-white">{leastBusy.name}</span> currently has the lightest workload.</p>
                <button onClick={() => openAssignModal(leastBusy)} className="ml-auto inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-300 px-4 text-[10px] font-bold uppercase tracking-[0.28em] text-black transition hover:bg-emerald-200"><UserPlus className="h-4 w-4" />Assign Case</button>
              </div>
            ) : null}
          </div>

          <div className="rounded-[2rem] border border-white/8 bg-[#111214]/96 p-7 shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-emerald-300/75">Workspace Leadership</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">{workspaceLead?.name || 'LegalForge Workspace Admin'}</h2>
                <p className="mt-2 text-sm leading-6 text-white/55">{workspaceLead?.bio || 'This workspace is managed with firm-level controls. Attorneys who register with the firm code are expected to appear in the roster and case assignment workflow automatically.'}</p>
              </div>
              <img src={workspaceLead?.src || 'https://ui-avatars.com/api/?name=Workspace+Admin'} alt={workspaceLead?.name || 'Workspace Admin'} className="h-16 w-16 rounded-2xl border border-white/10 object-cover" />
            </div>

            <div className="mt-6 space-y-3 text-sm text-white/70">
              <div className="flex items-center gap-3"><Building2 className="h-4 w-4 text-amber-200" /><span>{workspaceLead?.firm_name || user?.firm_name || 'LegalAI Workspace'}</span></div>
              <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-amber-200" /><span>{workspaceLead?.email || 'admin@legalforge.com'}</span></div>
            </div>

            <div className="mt-6 rounded-[1.3rem] border border-white/8 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-white/40">My Profile</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{currentUserLawyer?.name || user?.name || 'Attorney'}</h3>
                  <p className="mt-1 text-sm text-white/50">{currentUserLawyer?.designation || (isAdmin() ? 'Managing Partner' : 'Legal Counsel')}</p>
                </div>
                <img src={currentUserLawyer?.src || user?.profile_picture || 'https://ui-avatars.com/api/?name=Attorney'} alt={currentUserLawyer?.name || user?.name || 'Attorney'} className="h-14 w-14 rounded-2xl border border-white/10 object-cover" />
              </div>
              <p className="mt-3 text-sm leading-6 text-white/55">{currentUserLawyer?.bio || 'Keep your profile polished so your roster card, assignment presence, and internal directory stay current.'}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={openProfileEditor} className="inline-flex h-10 items-center rounded-xl bg-amber-300 px-4 text-[10px] font-bold uppercase tracking-[0.24em] text-black transition hover:bg-amber-200">Open Settings</button>
                {isAdmin() ? <button onClick={copyFirmCode} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-white/[0.1]"><Copy className="h-3.5 w-3.5" />{copiedFirmId ? 'Copied' : 'Copy Firm Code'}</button> : null}
              </div>
            </div>
          </div>
        </section>
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            {profileNotice ? (
              <div className="rounded-[1.4rem] border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                {profileNotice}
              </div>
            ) : null}
            <div className="flex flex-col gap-3 rounded-[1.8rem] border border-white/8 bg-[#111214]/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.24)] md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by name, role, or expertise" className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25" />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto">
                {practiceLabels.map((filter) => (
                  <button key={filter} onClick={() => setPracticeFilter(filter)} className={cn('whitespace-nowrap rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] transition', practiceFilter === filter ? 'border-amber-300/30 bg-amber-300/15 text-amber-50' : 'border-white/10 bg-white/[0.04] text-white/50 hover:text-white')}>
                    {filter === 'all' ? 'All Expertise' : filter}
                  </button>
                ))}
              </div>
              <button onClick={fetchDirectory} className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 px-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white/65 transition hover:text-white"><RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />Refresh</button>
            </div>

            {loading ? (
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8"><div className="h-[680px] animate-pulse rounded-[1.6rem] bg-white/[0.04]" /></div>
            ) : filteredMembers.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.03] px-6 py-20 text-center text-sm text-white/55">No attorneys match your search yet.</div>
            ) : (
              <div className="rounded-[2rem] border border-white/8 bg-transparent">
                <TeamShowcase
                  members={filteredMembers}
                  selectedId={selectedLawyer?.email || null}
                  onSelectMember={(member) => { setSelectedLawyerEmail(member.id); setProfileModalEmail(member.id); }}
                  className="max-w-none"
                />
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-white/8 bg-[#111214]/96 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
            {selectedLawyer ? (
              <MotionPanel key={selectedLawyer.email} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-5 border-b border-white/10 pb-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img src={selectedLawyer.src} alt={selectedLawyer.name} className="h-20 w-20 rounded-[1.4rem] border border-white/10 object-cover" />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-emerald-300/75">Selected Counsel</p>
                          <h2 className="mt-2 text-3xl font-semibold text-white">{selectedLawyer.name}</h2>
                          <p className="mt-1 text-sm text-white/55">{selectedLawyer.designation}</p>
                        </div>
                      </div>
                      {isAdmin() ? <button onClick={() => openAssignModal(selectedLawyer)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-amber-300 px-4 text-[10px] font-bold uppercase tracking-[0.28em] text-black transition hover:bg-amber-200"><Plus className="h-4 w-4" />Assign Case</button> : null}
                    </div>

                    <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-100">{selectedLawyer.availability}</span>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">{selectedLawyer.experience_years} Years Experience</span>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">Success Rate {selectedLawyer.success_rate}</span>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-white/65">{selectedLawyer.bio}</p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.35em] text-white/45">Personal Overview</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <InfoRow icon={Mail} label="Email" value={selectedLawyer.email} />
                          <InfoRow icon={Phone} label="Office Line" value={selectedLawyer.phone} />
                          <InfoRow icon={MapPin} label="Location" value={selectedLawyer.location} />
                          <InfoRow icon={Building2} label="Residence" value={selectedLawyer.residence} />
                          <InfoRow icon={CalendarDays} label="Date of Birth" value={formatDate(selectedLawyer.date_of_birth)} />
                          <InfoRow icon={ShieldCheck} label="Emergency Contact" value={selectedLawyer.emergency_contact} />
                        </div>
                      </div>

                      <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.35em] text-white/45">Professional Snapshot</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <CaseMeta label="Bar Registration" value={selectedLawyer.bar_registration} />
                          <CaseMeta label="Joined Firm" value={formatDate(selectedLawyer.joined_firm)} />
                          <CaseMeta label="Education" value={selectedLawyer.education} />
                          <CaseMeta label="Billable Rate" value={selectedLawyer.billable_rate} />
                          <CaseMeta label="Assistant Desk" value={selectedLawyer.assistant_name} />
                          <CaseMeta label="Languages" value={(selectedLawyer.languages || []).join(', ')} />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-4">
                      <MetricCard label="Active Cases" value={selectedLawyer.active_cases} icon={Briefcase} />
                      <MetricCard label="Hearings" value={selectedLawyer.upcoming_hearings} icon={Gavel} />
                      <MetricCard label="Closed Matters" value={selectedLawyer.total_closed_cases} icon={BadgeCheck} />
                      <MetricCard label="Progress" value={`${selectedLawyer.average_progress}%`} icon={CalendarDays} />
                    </div>

                    <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/45">Expertise, Credentials & Notes</p>
                      <div className="mt-3 flex flex-wrap gap-2">{(selectedLawyer.practice_areas || []).map((area) => <span key={area} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] text-white/70">{area}</span>)}</div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <CaseMeta label="Certifications" value={(selectedLawyer.certifications || []).join(', ')} />
                        <CaseMeta label="Memberships" value={(selectedLawyer.memberships || []).join(', ')} />
                      </div>
                      <div className="mt-4 space-y-2">
                        {(selectedLawyer.highlights || []).map((highlight, index) => (
                          <div key={`${selectedLawyer.email}-highlight-${index}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/65">{highlight}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/45">Track Record</p>
                        <p className="mt-1 text-sm text-white/50">Outcome history and delivery notes to support higher-confidence assignment decisions.</p>
                      </div>
                      <div className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-white/45">Consultations {selectedLawyer.consultation_volume}</div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {(selectedLawyer.previous_records || []).map((record, index) => (
                        <div key={`${selectedLawyer.email}-record-${index}`} className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                          <div className="text-[10px] uppercase tracking-[0.3em] text-white/35">{record.year}</div>
                          <h3 className="mt-2 text-base font-semibold text-white">{record.title}</h3>
                          <p className="mt-2 text-sm text-white/60">{record.outcome}</p>
                          <p className="mt-3 text-[11px] uppercase tracking-[0.24em] text-amber-200/80">{record.forum}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/45">Matter Portfolio</p>
                        <p className="mt-1 text-sm text-white/50">Current case load, delivery progress, and latest matter-level activity.</p>
                      </div>
                      <div className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-white/45">Registered {formatDate(selectedLawyer.registered_at)}</div>
                    </div>

                    <div className="space-y-3">
                      {(selectedLawyer.current_cases || []).length === 0 ? (
                        <div className="rounded-[1.4rem] border border-dashed border-white/10 bg-black/20 px-5 py-10 text-center text-sm text-white/45">No matters assigned yet.</div>
                      ) : (
                        selectedLawyer.current_cases.map((caseItem) => (
                          <div key={`${selectedLawyer.email}-${caseItem.id}`} className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="text-[10px] uppercase tracking-[0.3em] text-white/35">{caseItem.case_no || 'Case'} • {caseItem.case_type || 'Matter'}</div>
                                <h3 className="mt-2 text-lg font-semibold text-white">{caseItem.title}</h3>
                                <p className="mt-1 text-sm text-white/50">{caseItem.client_name || 'Client pending'} • {caseItem.court || 'Court pending'}</p>
                              </div>
                              <div className={cn('rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em]', PRIORITY_STYLES[caseItem.priority] || PRIORITY_STYLES.medium)}>{caseItem.priority}</div>
                            </div>

                            <div className="mt-4 space-y-2">
                              <div className="flex items-center justify-between text-xs text-white/55"><span>{caseItem.stage}</span><span>{caseItem.progress}% complete</span></div>
                              <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-amber-300 via-emerald-300 to-sky-300" style={{ width: `${caseItem.progress}%` }} /></div>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                              <CaseMeta label="Deadline" value={formatDate(caseItem.deadline)} />
                              <CaseMeta label="Next Hearing" value={formatDate(caseItem.next_hearing)} />
                              <CaseMeta label="Recent Update" value={caseItem.last_update || 'No update logged'} />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </MotionPanel>
            ) : (
              <div className="flex h-full min-h-[520px] items-center justify-center rounded-[1.6rem] border border-dashed border-white/10 bg-black/20 px-8 text-center text-white/45">Select a lawyer from the roster to view their full profile and case progress.</div>
            )}
          </div>
        </section>
      </main>
      <AnimatePresence>
        {isEditingProfile ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9997] flex items-center justify-center bg-black/75 px-4 py-8 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} className="w-full max-w-4xl rounded-[2rem] border border-white/10 bg-[#111214] p-6 text-white shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-amber-300/75">Edit My Profile</p>
                  <h3 className="mt-2 text-3xl font-semibold text-white">Keep your lawyer record current</h3>
                  <p className="mt-2 text-sm leading-6 text-white/55">These updates refine how your profile appears across the lawyers roster and assignment workspace.</p>
                </div>
                <button onClick={() => setIsEditingProfile(false)} className="rounded-xl border border-white/10 p-2 text-white/55 transition hover:text-white"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={saveProfile} className="mt-6 grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Name" value={profileForm.name} onChange={(value) => handleProfileFieldChange('name', value)} placeholder="Your full name" required />
                  <Field label="Profile Picture URL" value={profileForm.profile_picture} onChange={(value) => handleProfileFieldChange('profile_picture', value)} placeholder="https://images.unsplash.com/..." />
                </div>
                <label className="space-y-2 text-sm"><span className="block text-[10px] uppercase tracking-[0.28em] text-white/45">Bio</span><textarea value={profileForm.bio} onChange={(event) => handleProfileFieldChange('bio', event.target.value)} placeholder="Professional bio" className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" /></label>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Phone" value={profileForm.phone} onChange={(value) => handleProfileFieldChange('phone', value)} placeholder="+91 ..." type="tel" inputMode="tel" maxLength={16} />
                  <Field label="Location" value={profileForm.location} onChange={(value) => handleProfileFieldChange('location', value)} placeholder="Mumbai, India" />
                  <Field label="Residence" value={profileForm.residence} onChange={(value) => handleProfileFieldChange('residence', value)} placeholder="Office / residence" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Education" value={profileForm.education} onChange={(value) => handleProfileFieldChange('education', value)} placeholder="Law school" />
                  <Field label="Joined Firm" value={profileForm.joined_firm} onChange={(value) => handleProfileFieldChange('joined_firm', value)} placeholder="2021-07-15" />
                  <Field label="Date of Birth" value={profileForm.date_of_birth} onChange={(value) => handleProfileFieldChange('date_of_birth', value)} placeholder="1990-05-20" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Languages" value={profileForm.languages} onChange={(value) => handleProfileFieldChange('languages', value)} placeholder="English, Hindi" />
                  <Field label="Practice Areas" value={profileForm.practice_areas} onChange={(value) => handleProfileFieldChange('practice_areas', value)} placeholder="Corporate Governance, Litigation" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Emergency Contact" value={profileForm.emergency_contact} onChange={(value) => handleProfileFieldChange('emergency_contact', value)} placeholder="+91 ..." type="tel" inputMode="tel" maxLength={16} />
                  <Field label="Billable Rate" value={profileForm.billable_rate} onChange={(value) => handleProfileFieldChange('billable_rate', value)} placeholder="INR 25000/hr" />
                  <Field label="Assistant Desk" value={profileForm.assistant_name} onChange={(value) => handleProfileFieldChange('assistant_name', value)} placeholder="Desk / assistant" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Success Rate" value={profileForm.success_rate} onChange={(value) => handleProfileFieldChange('success_rate', value)} placeholder="89%" />
                  <Field label="Certifications" value={profileForm.certifications} onChange={(value) => handleProfileFieldChange('certifications', value)} placeholder="Certification 1, Certification 2" />
                  <Field label="Memberships" value={profileForm.memberships} onChange={(value) => handleProfileFieldChange('memberships', value)} placeholder="IBA, SCBA" />
                </div>
                <label className="space-y-2 text-sm"><span className="block text-[10px] uppercase tracking-[0.28em] text-white/45">Highlights</span><textarea value={profileForm.highlights} onChange={(event) => handleProfileFieldChange('highlights', event.target.value)} placeholder="One highlight per line" className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" /></label>
                {profileError ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{profileError}</div> : null}
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsEditingProfile(false)} className="inline-flex h-11 items-center rounded-xl border border-white/10 px-5 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/60">Cancel</button>
                  <button type="submit" disabled={profileSaving} className="inline-flex h-11 items-center rounded-xl bg-amber-300 px-5 text-[10px] font-bold uppercase tracking-[0.28em] text-black disabled:opacity-50">{profileSaving ? 'Saving...' : 'Save Profile'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
        {modalLawyer ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/75 px-4 py-8 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#111214] text-white shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
              <div className="flex max-h-[85vh] flex-col overflow-hidden">
                <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
                  <div className="flex items-center gap-4">
                    <img src={modalLawyer.src} alt={modalLawyer.name} className="h-20 w-20 rounded-[1.4rem] border border-white/10 object-cover" />
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.35em] text-emerald-300/75">Full Lawyer Profile</p>
                      <h3 className="mt-2 text-3xl font-semibold text-white">{modalLawyer.name}</h3>
                      <p className="mt-1 text-sm text-white/55">{modalLawyer.designation}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isAdmin() ? <button onClick={() => openAssignModal(modalLawyer)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-amber-300 px-4 text-[10px] font-bold uppercase tracking-[0.28em] text-black transition hover:bg-amber-200"><Plus className="h-4 w-4" />Assign Case</button> : null}
                    <button onClick={() => setProfileModalEmail('')} className="rounded-xl border border-white/10 p-2 text-white/55 transition hover:text-white"><X className="h-5 w-5" /></button>
                  </div>
                </div>
                <div className="grid gap-0 overflow-y-auto lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="space-y-4 border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
                    <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-100">{modalLawyer.availability}</span>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">{modalLawyer.experience_years} Years Experience</span>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">Success Rate {modalLawyer.success_rate}</span>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-white/65">{modalLawyer.bio}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoRow icon={Mail} label="Email" value={modalLawyer.email} />
                      <InfoRow icon={Phone} label="Office Line" value={modalLawyer.phone} />
                      <InfoRow icon={MapPin} label="Location" value={modalLawyer.location} />
                      <InfoRow icon={Building2} label="Residence" value={modalLawyer.residence} />
                      <InfoRow icon={CalendarDays} label="Date of Birth" value={formatDate(modalLawyer.date_of_birth)} />
                      <InfoRow icon={ShieldCheck} label="Bar Registration" value={modalLawyer.bar_registration} />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <CaseMeta label="Education" value={modalLawyer.education} />
                      <CaseMeta label="Languages" value={(modalLawyer.languages || []).join(', ')} />
                      <CaseMeta label="Billable Rate" value={modalLawyer.billable_rate} />
                      <CaseMeta label="Assistant Desk" value={modalLawyer.assistant_name} />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <MetricCard label="Active Cases" value={modalLawyer.active_cases} icon={Briefcase} />
                      <MetricCard label="Hearings" value={modalLawyer.upcoming_hearings} icon={Gavel} />
                      <MetricCard label="Closed" value={modalLawyer.total_closed_cases} icon={BadgeCheck} />
                    </div>
                  </div>
                  <div className="space-y-4 p-6">
                    <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/45">Professional Notes</p>
                      <div className="mt-3 flex flex-wrap gap-2">{(modalLawyer.practice_areas || []).map((area) => <span key={area} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] text-white/70">{area}</span>)}</div>
                      <div className="mt-4 space-y-2">
                        {(modalLawyer.highlights || []).map((highlight, index) => <div key={`${modalLawyer.email}-modal-highlight-${index}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/65">{highlight}</div>)}
                      </div>
                    </div>
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/45">Previous Records</p>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-white/45">Consultations {modalLawyer.consultation_volume}</span>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        {(modalLawyer.previous_records || []).map((record, index) => (
                          <div key={`${modalLawyer.email}-modal-record-${index}`} className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                            <div className="text-[10px] uppercase tracking-[0.3em] text-white/35">{record.year}</div>
                            <h4 className="mt-2 text-base font-semibold text-white">{record.title}</h4>
                            <p className="mt-2 text-sm text-white/60">{record.outcome}</p>
                            <p className="mt-3 text-[11px] uppercase tracking-[0.24em] text-amber-200/80">{record.forum}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/45">Current Matters</p>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-white/45">Registered {formatDate(modalLawyer.registered_at)}</span>
                      </div>
                      <div className="space-y-3">
                        {(modalLawyer.current_cases || []).map((caseItem) => (
                          <div key={`${modalLawyer.email}-modal-case-${caseItem.id}`} className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="text-[10px] uppercase tracking-[0.3em] text-white/35">{caseItem.case_no || 'Case'} • {caseItem.case_type || 'Matter'}</div>
                                <h4 className="mt-2 text-lg font-semibold text-white">{caseItem.title}</h4>
                                <p className="mt-1 text-sm text-white/50">{caseItem.client_name || 'Client pending'} • {caseItem.court || 'Court pending'}</p>
                              </div>
                              <div className={cn('rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em]', PRIORITY_STYLES[caseItem.priority] || PRIORITY_STYLES.medium)}>{caseItem.priority}</div>
                            </div>
                            <div className="mt-4 space-y-2">
                              <div className="flex items-center justify-between text-xs text-white/55"><span>{caseItem.stage}</span><span>{caseItem.progress}% complete</span></div>
                              <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-amber-300 via-emerald-300 to-sky-300" style={{ width: `${caseItem.progress}%` }} /></div>
                            </div>
                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                              <CaseMeta label="Deadline" value={formatDate(caseItem.deadline)} />
                              <CaseMeta label="Next Hearing" value={formatDate(caseItem.next_hearing)} />
                              <CaseMeta label="Recent Update" value={caseItem.last_update || 'No update logged'} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
        {assignTarget ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 px-4 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#111214] p-6 text-white shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
              {assignSuccess ? (
                <div className="py-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15"><CheckCircle2 className="h-8 w-8 text-emerald-300" /></div>
                  <h3 className="mt-5 text-2xl font-semibold text-white">Case assigned successfully</h3>
                  <p className="mt-3 text-sm leading-6 text-white/55"><span className="font-semibold text-white">{assignSuccess.title}</span> is now assigned to <span className="font-semibold text-white">{assignSuccess.lawyer}</span>.</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-white/35">{assignSuccess.caseNo}</p>
                  <button onClick={() => { setAssignTarget(null); setAssignSuccess(null); }} className="mt-6 inline-flex h-11 items-center rounded-xl bg-amber-300 px-5 text-[10px] font-bold uppercase tracking-[0.28em] text-black">Close</button>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img src={assignTarget.src} alt={assignTarget.name} className="h-16 w-16 rounded-2xl border border-white/10 object-cover" />
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.35em] text-amber-300/75">Assign Matter</p>
                        <h3 className="mt-2 text-2xl font-semibold text-white">{assignTarget.name}</h3>
                        <p className="mt-1 text-sm text-white/55">{assignTarget.designation} • {assignTarget.active_cases} active matters</p>
                      </div>
                    </div>
                    <button onClick={() => setAssignTarget(null)} className="rounded-xl border border-white/10 p-2 text-white/55 transition hover:text-white"><X className="h-5 w-5" /></button>
                  </div>

                  <form onSubmit={submitCase} className="mt-6 grid gap-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Case Number" value={form.case_no} onChange={(value) => setForm((current) => ({ ...current, case_no: value }))} placeholder="Auto generated if blank" />
                      <SelectField label="Priority" value={form.priority} onChange={(value) => setForm((current) => ({ ...current, priority: value }))} options={['low', 'medium', 'high', 'critical']} />
                    </div>
                    <Field label="Case Title" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} placeholder="Enter case title" required />
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Client Name" value={form.client_name} onChange={(value) => setForm((current) => ({ ...current, client_name: value }))} placeholder="Client or company" />
                      <Field label="Client Email" value={form.client_email} onChange={(value) => setForm((current) => ({ ...current, client_email: value }))} placeholder="client@company.com" type="email" inputMode="email" maxLength={120} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <SelectField label="Case Type" value={form.case_type} onChange={(value) => setForm((current) => ({ ...current, case_type: value }))} options={['Civil', 'Criminal', 'Corporate', 'IP', 'Family', 'Tax', 'Constitutional', 'Labour']} />
                      <Field label="Court / Forum" value={form.court} onChange={(value) => setForm((current) => ({ ...current, court: value }))} placeholder="Court or authority" />
                    </div>
                    <label className="space-y-2 text-sm"><span className="block text-[10px] uppercase tracking-[0.28em] text-white/45">Deadline</span><input type="date" value={form.deadline} onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))} className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none" /></label>
                    <label className="space-y-2 text-sm"><span className="block text-[10px] uppercase tracking-[0.28em] text-white/45">Matter Summary</span><textarea value={form.description} required onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Key facts, instructions, urgency, and next steps" className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" /></label>
                    {assignError ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{assignError}</div> : null}
                    <div className="flex justify-end gap-3 pt-2">
                      <button type="button" onClick={() => setAssignTarget(null)} className="inline-flex h-11 items-center rounded-xl border border-white/10 px-5 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/60">Cancel</button>
                      <button type="submit" disabled={submitting} className="inline-flex h-11 items-center rounded-xl bg-amber-300 px-5 text-[10px] font-bold uppercase tracking-[0.28em] text-black disabled:opacity-50">{submitting ? 'Assigning...' : 'Create & Assign'}</button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MetricCard({ label, value, icon }) {
  const IconComponent = icon;
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="mb-3 flex items-center gap-3"><div className="rounded-xl border border-white/10 bg-white/[0.05] p-2">{IconComponent ? <IconComponent className="h-4 w-4 text-amber-200" /> : null}</div><span className="text-[10px] uppercase tracking-[0.28em] text-white/40">{label}</span></div><div className="text-xl font-semibold text-white">{value}</div></div>;
}

function InfoRow({ icon, label, value }) {
  const IconComponent = icon;
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-white/40">{IconComponent ? <IconComponent className="h-4 w-4 text-amber-200" /> : null}{label}</div><div className="text-sm text-white/75">{value || 'Not available'}</div></div>;
}

function CaseMeta({ label, value }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"><div className="text-[10px] uppercase tracking-[0.28em] text-white/35">{label}</div><div className="mt-2 text-sm leading-6 text-white/70">{value}</div></div>;
}

function Field({ label, value, onChange, placeholder, required = false, type = "text", inputMode, maxLength }) {
  return <label className="space-y-2 text-sm"><span className="block text-[10px] uppercase tracking-[0.28em] text-white/45">{label}</span><input type={type} inputMode={inputMode} maxLength={maxLength} value={value} required={required} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/25" /></label>;
}

function SelectField({ label, value, onChange, options }) {
  return <label className="space-y-2 text-sm"><span className="block text-[10px] uppercase tracking-[0.28em] text-white/45">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}






















