'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, ExternalLink, Save, Eye, EyeOff, ShieldCheck, GraduationCap, Award,
  Briefcase, Plus, Trash2, Check, X, Star, BookOpen, Users,
  Clock, Globe, DollarSign, MessageSquare, Mail, BadgeCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { trainerPortalApi, type MyTrainerPortal, type CourseDeliveredSummary } from '@/lib/trainerPortal/api';
import { StarRating } from '@/components/trainer/StarRating';

type Tab = 'profile' | 'qualifications' | 'certifications' | 'experience' | 'courses' | 'reviews';

export default function TrainerPortalPage() {
  const [tab, setTab] = useState<Tab>('profile');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['trainer', 'portal'],
    queryFn: () => trainerPortalApi.myPortal(),
  });

  if (isLoading || !data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <div className="h-20 bg-white rounded-xl border border-slate-200 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
        <div className="h-12 bg-white rounded-xl border border-slate-200 animate-pulse" />
        <div className="h-64 bg-white rounded-xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  const p = data.profile;
  const availColor = p.availability_status === 'available'
    ? 'bg-emerald-400' : p.availability_status === 'busy' ? 'bg-amber-400' : 'bg-slate-400';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-2xl font-black text-orange-600 shrink-0">
            {p.slug ? p.slug.slice(0, 1).toUpperCase() : 'T'}
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-orange-500 text-[11px] font-bold uppercase tracking-widest mb-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Trainer Portal
            </div>
            {p.headline ? (
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">{p.headline}</h1>
            ) : (
              <h1 className="text-2xl sm:text-3xl font-black text-slate-400 italic">Add your headline in Profile tab…</h1>
            )}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {p.is_verified && (
                <span className="inline-flex items-center gap-1 bg-emerald-100 border border-emerald-200 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                  <BadgeCheck className="w-3 h-3" /> Certified
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-slate-500 text-xs">
                <span className={`w-2 h-2 rounded-full ${availColor}`} />
                {p.availability_status === 'available' ? 'Available' : p.availability_status === 'busy' ? 'Limited' : 'Unavailable'}
              </span>
              {p.is_public ? (
                <span className="inline-flex items-center gap-1 text-slate-500 text-xs"><Globe className="w-3 h-3" /> Public</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-400 text-xs"><EyeOff className="w-3 h-3" /> Hidden</span>
              )}
            </div>
          </div>
        </div>
        <Link
          href={`/trainers/${p.slug}`} target="_blank" rel="noopener"
          className="self-start flex items-center gap-2 bg-white border border-slate-200 hover:border-orange-300 hover:text-orange-600 text-slate-700 text-sm font-semibold px-4 py-2 rounded-xl transition shadow-sm"
        >
          <ExternalLink className="w-4 h-4" /> Preview profile
        </Link>
      </div>

      {/* ── KPI CHIPS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatChip icon={<Star className="w-4 h-4 text-amber-500" />} label="Rating" value={p.rating_avg !== null ? p.rating_avg.toFixed(1) + ' ★' : '—'} />
        <StatChip icon={<MessageSquare className="w-4 h-4 text-orange-500" />} label="Reviews" value={p.rating_count} />
        <StatChip icon={<Users className="w-4 h-4 text-emerald-600" />} label="Students Taught" value={p.students_taught} />
        <StatChip icon={<Clock className="w-4 h-4 text-slate-500" />} label="Years Exp." value={p.years_experience ?? '—'} />
      </div>

      {/* Tab bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex gap-1 p-1.5 overflow-x-auto">
          {([
            ['profile', 'Profile', null],
            ['qualifications', 'Qualifications', data.qualifications.length],
            ['certifications', 'Certifications', data.certifications.length],
            ['experience', 'Experience', data.experiences.length],
            ['courses', 'Courses', data.courses?.length ?? 0],
            ['reviews', 'Reviews', p.rating_count],
          ] as [Tab, string, number | null][]).map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                tab === key
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {label}
              {count !== null && count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  tab === key ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'profile' && <ProfileTab profile={p} onSaved={() => qc.invalidateQueries({ queryKey: ['trainer', 'portal'] })} />}
        {tab === 'qualifications' && <QualificationsTab items={data.qualifications} onChanged={() => qc.invalidateQueries({ queryKey: ['trainer', 'portal'] })} />}
        {tab === 'certifications' && <CertificationsTab items={data.certifications} onChanged={() => qc.invalidateQueries({ queryKey: ['trainer', 'portal'] })} />}
        {tab === 'experience' && <ExperienceTab items={data.experiences} onChanged={() => qc.invalidateQueries({ queryKey: ['trainer', 'portal'] })} />}
        {tab === 'courses' && <CoursesDeliveredTab items={data.courses ?? []} />}
        {tab === 'reviews' && <ReviewsTab />}

    </div>
  );
}

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{label}</div>
        <div className="text-xl font-black text-slate-900 tabular-nums leading-tight">{value}</div>
      </div>
    </div>
  );
}

// ── PROFILE TAB ──────────────────────────────────────────────

function ProfileTab({ profile: p, onSaved }: { profile: MyTrainerPortal['profile']; onSaved: () => void }) {
  const [form, setForm] = useState({
    headline: p.headline ?? '',
    bio_long: p.bio_long ?? '',
    years_experience: p.years_experience ?? 0,
    expertise_areas: (p.expertise_areas ?? []).join(', '),
    teaching_languages: (p.teaching_languages ?? []).join(', '),
    hourly_rate_tzs: p.hourly_rate_tzs ?? 0,
    availability_status: p.availability_status,
    is_public: p.is_public,
    accepts_direct_inquiries: p.accepts_direct_inquiries,
    public_email: p.public_email ?? '',
  });

  const mut = useMutation({
    mutationFn: () => trainerPortalApi.updateProfile({
      headline: form.headline || null,
      bio_long: form.bio_long || null,
      years_experience: Number(form.years_experience) || null,
      expertise_areas: form.expertise_areas.split(',').map((s) => s.trim()).filter(Boolean),
      teaching_languages: form.teaching_languages.split(',').map((s) => s.trim()).filter(Boolean),
      hourly_rate_tzs: Number(form.hourly_rate_tzs) || null,
      availability_status: form.availability_status,
      is_public: form.is_public,
      accepts_direct_inquiries: form.accepts_direct_inquiries,
      public_email: form.public_email || null,
    }),
    onSuccess: () => { toast.success('Profile saved'); onSaved(); },
    onError: () => toast.error('Save failed'),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-5">

      {/* Identity */}
      <ProfileSection title="Identity" subtitle="What students see first on your public profile">
        <Field label="Professional headline" hint="One compelling line under your name (max 180 chars)">
          <input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })}
            className="input" maxLength={180} placeholder="Senior Financial Modelling Consultant · 12+ Years" />
        </Field>
        <Field label="About you" hint="Rich bio for your public profile — tell your story (max 5000 chars)">
          <textarea value={form.bio_long} onChange={(e) => setForm({ ...form, bio_long: e.target.value })}
            className="input min-h-[160px]" maxLength={5000} rows={7} />
        </Field>
      </ProfileSection>

      {/* Expertise */}
      <ProfileSection title="Expertise & Languages" subtitle="Help students find you through search filters">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Expertise areas" hint="Comma-separated — e.g. excel, power_query, financial_modeling">
            <input value={form.expertise_areas} onChange={(e) => setForm({ ...form, expertise_areas: e.target.value })}
              className="input" placeholder="excel, power_query, data_analysis" />
          </Field>
          <Field label="Teaching languages" hint="ISO codes comma-separated — e.g. sw, en">
            <input value={form.teaching_languages} onChange={(e) => setForm({ ...form, teaching_languages: e.target.value })}
              className="input" placeholder="sw, en" />
          </Field>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Years of experience">
            <input type="number" min="0" max="80" value={form.years_experience}
              onChange={(e) => setForm({ ...form, years_experience: Number(e.target.value) })}
              className="input" />
          </Field>
          <Field label="Hourly rate (TZS)" hint="Optional — set to 0 to hide from profile">
            <input type="number" min="0" value={form.hourly_rate_tzs}
              onChange={(e) => setForm({ ...form, hourly_rate_tzs: Number(e.target.value) })}
              className="input" />
          </Field>
        </div>
      </ProfileSection>

      {/* Availability & Visibility */}
      <ProfileSection title="Availability & Visibility" subtitle="Control how students can find and contact you">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Availability status">
            <select value={form.availability_status} onChange={(e) => setForm({ ...form, availability_status: e.target.value as typeof form.availability_status })} className="input">
              <option value="available">Available for new engagements</option>
              <option value="busy">Busy — limited availability</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </Field>
          <Field label="Contact email" hint="Shown publicly only when inquiries are enabled">
            <input type="email" value={form.public_email} onChange={(e) => setForm({ ...form, public_email: e.target.value })}
              className="input" placeholder="you@example.com" />
          </Field>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-1">
          <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-orange-300 cursor-pointer transition group">
            <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
              form.accepts_direct_inquiries ? 'bg-orange-500 border-orange-500' : 'border-slate-300 bg-white'
            }`}>
              {form.accepts_direct_inquiries && <Check className="w-3 h-3 text-white" />}
            </div>
            <input type="checkbox" checked={form.accepts_direct_inquiries}
              onChange={(e) => setForm({ ...form, accepts_direct_inquiries: e.target.checked })}
              className="sr-only" />
            <div>
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500" /> Accept direct inquiries
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Show your email publicly for booking requests</div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-orange-300 cursor-pointer transition group">
            <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
              form.is_public ? 'bg-orange-500 border-orange-500' : 'border-slate-300 bg-white'
            }`}>
              {form.is_public && <Check className="w-3 h-3 text-white" />}
            </div>
            <input type="checkbox" checked={form.is_public}
              onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
              className="sr-only" />
            <div>
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                {form.is_public ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                Publish to trainer directory
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Off = hidden from public /trainers browsing</div>
            </div>
          </label>
        </div>
      </ProfileSection>

      <div className="flex justify-end">
        <button type="submit" disabled={mut.isPending}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-sm">
          {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save profile
        </button>
      </div>
    </form>
  );
}

function ProfileSection({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        <div className="font-bold text-slate-900 text-sm">{title}</div>
        {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );
}

// ── QUALIFICATIONS TAB ────────────────────────────────────────

function QualificationsTab({ items, onChanged }: { items: MyTrainerPortal['qualifications']; onChanged: () => void }) {
  const [showForm, setShowForm] = useState(false);

  const del = useMutation({
    mutationFn: (id: string) => trainerPortalApi.deleteQualification(id),
    onSuccess: () => { toast.success('Removed'); onChanged(); },
    onError: () => toast.error('Delete failed'),
  });

  return (
    <div className="space-y-4">
      {!showForm && (
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl transition shadow-sm text-sm">
          <Plus className="w-4 h-4" /> Add qualification
        </button>
      )}
      {showForm && <AddQualificationForm onDone={() => { setShowForm(false); onChanged(); }} onCancel={() => setShowForm(false)} />}

      {items.length === 0 ? (
        <EmptyState icon={<GraduationCap className="w-10 h-10" />} title="No qualifications yet" subtitle="Add your education history to build trust with students." />
      ) : (
        <div className="space-y-3">
          {items.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex gap-4 group hover:border-teal-200 transition">
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-orange-600" />
                </div>
                {idx < items.length - 1 && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-11 w-0.5 h-6 bg-slate-200" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2 mb-0.5">
                  <span className="font-bold text-slate-900 text-sm">{q.degree}</span>
                  {q.field_of_study && <span className="text-sm text-slate-500">— {q.field_of_study}</span>}
                  <VerificationBadge status={q.verification_status} />
                </div>
                <div className="text-sm font-semibold text-orange-700">{q.institution}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {q.start_year ?? '?'} – {q.end_year ?? 'Present'}
                  {q.has_proof && <> · <span className="text-emerald-600 font-semibold">proof uploaded</span></>}
                </div>
                {q.verification_status === 'rejected' && q.rejection_reason && (
                  <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <strong>Rejected:</strong> {q.rejection_reason}
                  </div>
                )}
              </div>
              <button onClick={() => confirm(`Delete "${q.degree}"?`) && del.mutate(q.id)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddQualificationForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [f, setF] = useState({ institution: '', degree: '', field_of_study: '', start_year: '', end_year: '' });
  const [file, setFile] = useState<File | null>(null);

  const mut = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('institution', f.institution);
      fd.append('degree', f.degree);
      if (f.field_of_study) fd.append('field_of_study', f.field_of_study);
      if (f.start_year) fd.append('start_year', f.start_year);
      if (f.end_year) fd.append('end_year', f.end_year);
      if (file) fd.append('proof', file);
      return trainerPortalApi.addQualification(fd);
    },
    onSuccess: () => { toast.success('Qualification added — pending review'); onDone(); },
    onError: () => toast.error('Failed to add'),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
      className="bg-white rounded-xl border border-teal-200 shadow-sm p-6 space-y-4">
      <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">New Qualification</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Institution *"><input required className="input" value={f.institution} onChange={(e) => setF({ ...f, institution: e.target.value })} placeholder="University of Dar es Salaam" /></Field>
        <Field label="Degree *"><input required className="input" value={f.degree} onChange={(e) => setF({ ...f, degree: e.target.value })} placeholder="Bachelor of Science" /></Field>
        <Field label="Field of study"><input className="input" value={f.field_of_study} onChange={(e) => setF({ ...f, field_of_study: e.target.value })} placeholder="Finance, Accounting, IT..." /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From year"><input type="number" min="1950" max={new Date().getFullYear()} className="input" value={f.start_year} onChange={(e) => setF({ ...f, start_year: e.target.value })} /></Field>
          <Field label="To year"><input type="number" min="1950" className="input" value={f.end_year} onChange={(e) => setF({ ...f, end_year: e.target.value })} placeholder="ongoing" /></Field>
        </div>
      </div>
      <Field label="Proof document" hint="PDF or image, max 8 MB — diploma, transcript, or official letter (reviewed by admin)">
        <input type="file" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 transition" />
      </Field>
      <div className="flex gap-3">
        <button type="submit" disabled={mut.isPending}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold px-5 py-2 rounded-xl transition text-sm">
          {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save qualification
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition">Cancel</button>
      </div>
    </form>
  );
}

// ── CERTIFICATIONS TAB ────────────────────────────────────────

function CertificationsTab({ items, onChanged }: { items: MyTrainerPortal['certifications']; onChanged: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const del = useMutation({
    mutationFn: (id: string) => trainerPortalApi.deleteCertification(id),
    onSuccess: () => { toast.success('Removed'); onChanged(); },
  });

  return (
    <div className="space-y-4">
      {!showForm && (
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl transition shadow-sm text-sm">
          <Plus className="w-4 h-4" /> Add certification
        </button>
      )}
      {showForm && <AddCertificationForm onDone={() => { setShowForm(false); onChanged(); }} onCancel={() => setShowForm(false)} />}

      {items.length === 0 ? (
        <EmptyState icon={<Award className="w-10 h-10" />} title="No certifications yet" subtitle="Add professional certifications to validate your expertise." />
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {items.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 group hover:border-amber-200 transition relative">
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                {c.is_expired && (
                  <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Expired</span>
                )}
                {!c.is_expired && c.is_expiring_soon && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Expires soon</span>
                )}
                <button onClick={() => confirm(`Delete "${c.name}"?`) && del.mutate(c.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-start gap-3 pr-20">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.is_expired ? 'bg-red-50' : 'bg-amber-50'}`}>
                  <Award className={`w-5 h-5 ${c.is_expired ? 'text-red-500' : 'text-amber-500'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                    <VerificationBadge status={c.verification_status} />
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 font-semibold">{c.issuer}</div>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-500 space-y-0.5">
                {c.credential_id && <div className="font-mono">ID: {c.credential_id}</div>}
                <div>
                  {c.issue_date && <>Issued {new Date(c.issue_date).toLocaleDateString()}</>}
                  {c.expiry_date && <> · Expires {new Date(c.expiry_date).toLocaleDateString()}</>}
                </div>
              </div>

              {c.verification_status === 'rejected' && c.rejection_reason && (
                <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <strong>Rejected:</strong> {c.rejection_reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddCertificationForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [f, setF] = useState({ name: '', issuer: '', credential_id: '', verification_url: '', issue_date: '', expiry_date: '' });
  const [file, setFile] = useState<File | null>(null);

  const mut = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('name', f.name);
      fd.append('issuer', f.issuer);
      if (f.credential_id) fd.append('credential_id', f.credential_id);
      if (f.verification_url) fd.append('verification_url', f.verification_url);
      if (f.issue_date) fd.append('issue_date', f.issue_date);
      if (f.expiry_date) fd.append('expiry_date', f.expiry_date);
      if (file) fd.append('proof', file);
      return trainerPortalApi.addCertification(fd);
    },
    onSuccess: () => { toast.success('Certification added — pending review'); onDone(); },
    onError: () => toast.error('Failed to add'),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
      className="bg-white rounded-xl border border-amber-200 shadow-sm p-6 space-y-4">
      <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">New Certification</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Certification name *"><input required className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="CFA Level I, PMP, etc." /></Field>
        <Field label="Issuer *"><input required className="input" value={f.issuer} onChange={(e) => setF({ ...f, issuer: e.target.value })} placeholder="CFA Institute, PMI, Microsoft..." /></Field>
        <Field label="Credential ID"><input className="input" value={f.credential_id} onChange={(e) => setF({ ...f, credential_id: e.target.value })} /></Field>
        <Field label="Public verification URL"><input type="url" className="input" value={f.verification_url} onChange={(e) => setF({ ...f, verification_url: e.target.value })} placeholder="https://..." /></Field>
        <Field label="Issue date"><input type="date" className="input" value={f.issue_date} onChange={(e) => setF({ ...f, issue_date: e.target.value })} /></Field>
        <Field label="Expiry date"><input type="date" className="input" value={f.expiry_date} onChange={(e) => setF({ ...f, expiry_date: e.target.value })} /></Field>
      </div>
      <Field label="Proof document" hint="PDF or image, max 8 MB">
        <input type="file" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 transition" />
      </Field>
      <div className="flex gap-3">
        <button type="submit" disabled={mut.isPending}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold px-5 py-2 rounded-xl transition text-sm">
          {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save certification
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition">Cancel</button>
      </div>
    </form>
  );
}

// ── EXPERIENCE TAB ────────────────────────────────────────

function ExperienceTab({ items, onChanged }: { items: MyTrainerPortal['experiences']; onChanged: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const del = useMutation({
    mutationFn: (id: string) => trainerPortalApi.deleteExperience(id),
    onSuccess: () => { toast.success('Removed'); onChanged(); },
  });

  return (
    <div className="space-y-4">
      {!showForm && (
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl transition shadow-sm text-sm">
          <Plus className="w-4 h-4" /> Add experience
        </button>
      )}
      {showForm && <AddExperienceForm onDone={() => { setShowForm(false); onChanged(); }} onCancel={() => setShowForm(false)} />}

      {items.length === 0 ? (
        <EmptyState icon={<Briefcase className="w-10 h-10" />} title="No experience listed" subtitle="Add your professional work history to build credibility." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {items.map((e, idx) => (
            <div key={e.id} className="p-5 flex gap-4 group hover:bg-slate-50 transition">
              <div className="relative shrink-0 flex flex-col items-center">
                <div className="w-11 h-11 rounded-xl bg-navy-50 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-navy-500" />
                </div>
                {idx < items.length - 1 && (
                  <div className="w-0.5 flex-1 mt-3 bg-slate-200 min-h-[24px]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900">{e.title}</div>
                    <div className="text-sm font-semibold text-navy-600">{e.company}{e.location && <span className="text-slate-500 font-normal"> · {e.location}</span>}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {new Date(e.start_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                      {' – '}
                      {e.is_current
                        ? <span className="text-emerald-700 font-semibold">Present</span>
                        : (e.end_date ? new Date(e.end_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '')}
                      {' · '}<span className="font-semibold">{e.duration_years}y</span>
                    </div>
                  </div>
                  <button onClick={() => confirm(`Delete "${e.title}"?`) && del.mutate(e.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {e.description && <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{e.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddExperienceForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [f, setF] = useState({ title: '', company: '', location: '', start_date: '', end_date: '', description: '' });

  const mut = useMutation({
    mutationFn: () => trainerPortalApi.addExperience({
      title: f.title, company: f.company,
      location: f.location || undefined,
      start_date: f.start_date,
      end_date: f.end_date || undefined,
      description: f.description || undefined,
    }),
    onSuccess: () => { toast.success('Experience added'); onDone(); },
    onError: () => toast.error('Failed to add'),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
      className="bg-white rounded-xl border border-navy-200 shadow-sm p-6 space-y-4">
      <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">New Work Experience</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Job title *"><input required className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Senior Trainer, Financial Analyst..." /></Field>
        <Field label="Company *"><input required className="input" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></Field>
        <Field label="Location"><input className="input" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="Dar es Salaam, Tanzania" /></Field>
        <div />
        <Field label="Start date *"><input required type="date" className="input" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} /></Field>
        <Field label="End date (blank = current role)"><input type="date" className="input" value={f.end_date} onChange={(e) => setF({ ...f, end_date: e.target.value })} /></Field>
      </div>
      <Field label="Description">
        <textarea className="input min-h-[100px]" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={4} maxLength={3000} placeholder="Key responsibilities and achievements..." />
      </Field>
      <div className="flex gap-3">
        <button type="submit" disabled={mut.isPending}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold px-5 py-2 rounded-xl transition text-sm">
          {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save experience
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition">Cancel</button>
      </div>
    </form>
  );
}

// ── COURSES DELIVERED TAB ─────────────────────────────────────

function CoursesDeliveredTab({ items }: { items: CourseDeliveredSummary[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen className="w-10 h-10" />}
        title="No courses yet"
        subtitle="Courses you author appear here."
        action={<Link href="/trainer/courses" className="mt-4 inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition">Create a course</Link>}
      />
    );
  }

  const statusCfg: Record<string, { bg: string; text: string }> = {
    published: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    draft: { bg: 'bg-slate-100', text: 'text-slate-600' },
    archived: { bg: 'bg-amber-100', text: 'text-amber-800' },
  };

  return (
    <div className="space-y-3">
      {items.map((c) => {
        const s = statusCfg[c.status] ?? statusCfg.draft;
        return (
          <div key={c.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start gap-4 hover:border-orange-200 transition group">
            {c.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.thumbnail_url} alt="" className="w-28 h-18 rounded-xl object-cover bg-slate-100 shrink-0 aspect-video" />
            ) : (
              <div className="w-28 shrink-0 aspect-video rounded-xl bg-slate-100 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-slate-300" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <div className="font-bold text-slate-900 truncate">{c.title}</div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${s.bg} ${s.text}`}>
                  {c.status}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {c.category} · {c.level}
                {c.price_tzs !== null && c.price_tzs > 0 && <> · TZS {c.price_tzs.toLocaleString()}</>}
              </div>
              <div className="mt-2 flex items-center gap-1 text-sm text-slate-700 font-semibold">
                <Users className="w-4 h-4 text-slate-400" /> {c.enrollments_count.toLocaleString()} students
              </div>
            </div>
            <Link href={`/trainer/courses`} className="shrink-0 text-xs text-orange-600 hover:text-orange-700 font-bold self-center whitespace-nowrap">
              Manage →
            </Link>
          </div>
        );
      })}
    </div>
  );
}

// ── REVIEWS TAB ────────────────────────────────────────

function ReviewsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['trainer', 'my-reviews'],
    queryFn: () => trainerPortalApi.myReviews(),
  });

  if (isLoading || !data) {
    return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center justify-between gap-6">
        <div>
          <div className="text-5xl font-black text-slate-900 tabular-nums">
            {data.meta.avg ? data.meta.avg.toFixed(1) : '—'}
          </div>
          <StarRating value={data.meta.avg} />
          <div className="text-xs text-slate-500 mt-1">out of 5.0</div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase text-slate-400 font-bold tracking-widest">Total Reviews</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">{data.meta.count}</div>
          <div className="text-xs text-slate-500 mt-1">from students</div>
        </div>
      </div>

      {data.data.length === 0 ? (
        <EmptyState icon={<Star className="w-10 h-10" />} title="No reviews yet" subtitle="Students can rate you after completing your courses." />
      ) : (
        <div className="space-y-3">
          {data.data.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                <div>
                  <div className="font-bold text-slate-900">{r.student_name}</div>
                  {r.course_title && <div className="text-xs text-slate-500 mt-0.5">on {r.course_title}</div>}
                </div>
                <StarRating value={r.rating} />
              </div>
              {r.text && <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{r.text}</p>}
              <div className="mt-2 text-[10px] text-slate-400">{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase font-bold text-slate-400 tracking-widest mb-1.5">{label}</div>
      {children}
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </label>
  );
}

function EmptyState({ icon, title, subtitle, action }: { icon: React.ReactNode; title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
      <div className="text-slate-300 flex justify-center mb-3">{icon}</div>
      <div className="font-bold text-slate-700">{title}</div>
      <div className="text-sm text-slate-500 mt-1">{subtitle}</div>
      {action}
    </div>
  );
}

function VerificationBadge({ status }: { status: 'pending' | 'verified' | 'rejected' }) {
  if (status === 'verified') {
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
        <Check className="w-3 h-3" /> Verified
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
        <X className="w-3 h-3" /> Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
      Pending review
    </span>
  );
}
