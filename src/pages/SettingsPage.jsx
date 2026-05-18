import React, { useMemo, useState } from 'react';
import { Check, ChevronLeft, ImagePlus, Save, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import {
  joinLines,
  joinList,
  readStoredProfiles,
  splitCommaValues,
  splitLineValues,
  writeStoredProfiles,
} from '../lib/lawyerProfileStorage';
import { isValidPhone, sanitizePhoneInput } from '../utils/validators';

const createProfileForm = (user, profiles) => {
  const extra = user?.email ? profiles[user.email] || {} : {};
  return {
    name: user?.name || '',
    bio: user?.bio || '',
    profile_picture: user?.profile_picture || '',
    phone: extra.phone || '',
    location: extra.location || user?.firm_name || '',
    education: extra.education || '',
    languages: joinList(extra.languages),
    practice_areas: joinList(extra.practice_areas),
    residence: extra.residence || '',
    emergency_contact: extra.emergency_contact || '',
    joined_firm: extra.joined_firm || '',
    date_of_birth: extra.date_of_birth || '',
    billable_rate: extra.billable_rate || '',
    assistant_name: extra.assistant_name || '',
    success_rate: extra.success_rate || '',
    certifications: joinList(extra.certifications),
    memberships: joinList(extra.memberships),
    highlights: joinLines(extra.highlights),
  };
};

export default function SettingsPage() {
  const { user, token, refreshUser, updateLocalUser } = useAuth();
  const [storedProfiles, setStoredProfiles] = useState(() => readStoredProfiles());
  const [form, setForm] = useState(() => createProfileForm(user, readStoredProfiles()));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const canManageWorkspace = user?.role === 'admin';

  const previewImage = useMemo(
    () => form.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || 'Attorney')}`,
    [form.name, form.profile_picture],
  );

  const setField = (field, value) => {
    const nextValue = (field === 'phone' || field === 'emergency_contact')
      ? sanitizePhoneInput(value)
      : value;
    setForm((current) => ({ ...current, [field]: nextValue }));
    setError('');
    setNotice('');
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setField('profile_picture', reader.result);
      }
    };
    reader.onerror = () => setError('Image upload failed. Try another file.');
    reader.readAsDataURL(file);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!token || !user?.email) return;

    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setError('Name is required.');
      return;
    }
    if (form.phone.trim() && !isValidPhone(form.phone)) {
      setError('Office phone must be a valid 10-15 digit number.');
      return;
    }
    if (form.emergency_contact.trim() && !isValidPhone(form.emergency_contact)) {
      setError('Emergency contact must be a valid 10-15 digit number.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: trimmedName,
          bio: form.bio,
          profile_picture: form.profile_picture,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || 'Failed to update profile');
      }

      const nextProfiles = {
        ...storedProfiles,
        [user.email]: {
          phone: form.phone,
          location: form.location,
          education: form.education,
          languages: splitCommaValues(form.languages),
          practice_areas: splitCommaValues(form.practice_areas),
          residence: form.residence,
          emergency_contact: form.emergency_contact,
          joined_firm: form.joined_firm,
          date_of_birth: form.date_of_birth,
          billable_rate: form.billable_rate,
          assistant_name: form.assistant_name,
          success_rate: form.success_rate,
          certifications: splitCommaValues(form.certifications),
          memberships: splitCommaValues(form.memberships),
          highlights: splitLineValues(form.highlights),
        },
      };

      writeStoredProfiles(nextProfiles);
      setStoredProfiles(nextProfiles);
      updateLocalUser({
        name: trimmedName,
        bio: form.bio,
        profile_picture: form.profile_picture,
      });
      await refreshUser();
      setNotice('Profile saved successfully.');
    } catch (saveError) {
      setError(saveError.message || 'Profile update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(28,29,34,0.98),rgba(8,8,10,1)_38%)] pt-28 pb-16 text-white">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6">
        <section className="rounded-[2rem] border border-white/8 bg-[#111214]/96 p-8 shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <Link to="/lawyers" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/45 transition hover:text-white">
                <ChevronLeft className="h-4 w-4" />
                Back To Lawyers
              </Link>
              <p className="text-[10px] font-bold uppercase tracking-[0.42em] text-amber-300/75">Profile Settings</p>
              <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">Manage your attorney record in one place.</h1>
              <p className="max-w-2xl text-sm leading-6 text-white/60">
                Update the identity, profile image, expertise, and operating details that appear across the lawyers directory and assignment workflow.
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-white/8 bg-black/20 p-4">
              <div className="text-[10px] uppercase tracking-[0.35em] text-white/40">Workspace Access</div>
              <div className="mt-3 text-lg font-semibold text-white">{canManageWorkspace ? 'Administrator' : 'Attorney'}</div>
              <p className="mt-2 max-w-xs text-sm text-white/50">
                {canManageWorkspace
                  ? 'You can assign cases, view firm code, and manage the workspace roster.'
                  : 'You can manage your own profile and view roster details.'}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
          <aside className="rounded-[2rem] border border-white/8 bg-[#111214]/96 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
            <div className="rounded-[1.8rem] border border-white/10 bg-black/25 p-5">
              <img src={previewImage} alt={form.name || 'Attorney'} className="h-56 w-full rounded-[1.4rem] border border-white/10 object-cover" />
              <div className="mt-5">
                <h2 className="text-2xl font-semibold text-white">{form.name || 'Attorney'}</h2>
                <p className="mt-1 text-sm text-white/50">{user?.email}</p>
                <p className="mt-3 text-sm leading-6 text-white/60">{form.bio || 'Add a professional summary for your internal roster and assignment profile.'}</p>
              </div>
              <div className="mt-5 space-y-3">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-white/[0.08]">
                  <Upload className="h-4 w-4" />
                  Upload Profile Image
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                <Field label="Or Paste Image URL" value={form.profile_picture} onChange={(value) => setField('profile_picture', value)} placeholder="https://images.unsplash.com/..." />
              </div>
            </div>
          </aside>

          <section className="rounded-[2rem] border border-white/8 bg-[#111214]/96 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
            <form onSubmit={saveProfile} className="grid gap-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Full Name" value={form.name} onChange={(value) => setField('name', value)} placeholder="Attorney name" required />
                <Field label="Office Phone" value={form.phone} onChange={(value) => setField('phone', value)} placeholder="+91 ..." type="tel" inputMode="tel" maxLength={16} />
              </div>

              <label className="space-y-2 text-sm">
                <span className="block text-[10px] uppercase tracking-[0.28em] text-white/45">Professional Bio</span>
                <textarea value={form.bio} onChange={(event) => setField('bio', event.target.value)} className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder="Describe your legal focus, courtroom style, client profile, and strengths." />
              </label>

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Location" value={form.location} onChange={(value) => setField('location', value)} placeholder="Mumbai, India" />
                <Field label="Residence" value={form.residence} onChange={(value) => setField('residence', value)} placeholder="Primary office / residence" />
                <Field label="Emergency Contact" value={form.emergency_contact} onChange={(value) => setField('emergency_contact', value)} placeholder="+91 ..." type="tel" inputMode="tel" maxLength={16} />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Education" value={form.education} onChange={(value) => setField('education', value)} placeholder="Law school" />
                <Field label="Joined Firm" value={form.joined_firm} onChange={(value) => setField('joined_firm', value)} placeholder="2024-01-10" />
                <Field label="Date Of Birth" value={form.date_of_birth} onChange={(value) => setField('date_of_birth', value)} placeholder="1993-05-20" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Languages" value={form.languages} onChange={(value) => setField('languages', value)} placeholder="English, Hindi" />
                <Field label="Practice Areas" value={form.practice_areas} onChange={(value) => setField('practice_areas', value)} placeholder="Commercial Litigation, Regulatory Advisory" />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Billable Rate" value={form.billable_rate} onChange={(value) => setField('billable_rate', value)} placeholder="INR 20,000/hr" />
                <Field label="Assistant Desk" value={form.assistant_name} onChange={(value) => setField('assistant_name', value)} placeholder="Desk / assistant" />
                <Field label="Success Rate" value={form.success_rate} onChange={(value) => setField('success_rate', value)} placeholder="89%" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Certifications" value={form.certifications} onChange={(value) => setField('certifications', value)} placeholder="Certification 1, Certification 2" />
                <Field label="Memberships" value={form.memberships} onChange={(value) => setField('memberships', value)} placeholder="IBA, SCBA" />
              </div>

              <label className="space-y-2 text-sm">
                <span className="block text-[10px] uppercase tracking-[0.28em] text-white/45">Profile Highlights</span>
                <textarea value={form.highlights} onChange={(event) => setField('highlights', event.target.value)} className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" placeholder="One highlight per line" />
              </label>

              {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
              {notice ? <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{notice}</div> : null}

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <Link to="/lawyers" className="inline-flex h-11 items-center rounded-xl border border-white/20 bg-white/[0.04] px-5 text-[10px] font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-white/[0.08]">
                  Cancel
                </Link>
                <button type="submit" disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-amber-300 px-5 text-[10px] font-bold uppercase tracking-[0.28em] text-black disabled:opacity-50">
                  {saving ? <ImagePlus className="h-4 w-4 animate-pulse" /> : <Save className="h-4 w-4" />}
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </section>
        </section>
      </main>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required = false, type = "text", inputMode, maxLength }) {
  return (
    <label className="space-y-2 text-sm">
      <span className="block text-[10px] uppercase tracking-[0.28em] text-white/45">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/25"
      />
    </label>
  );
}
