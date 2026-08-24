'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, ExternalLink, Save, Eye, EyeOff, ShieldCheck, GraduationCap, Award,
  Briefcase, Plus, Trash2, AlertTriangle, Check, X, Upload, Star, BookOpen, Users,
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
    return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>;
  }

  const p = data.profile;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-orange-500" /> Trainer Portal
          </h1>
          <p className="text-slate-600 mt-1">
            Manage your public profile, qualifications, and credentials (SRS Module 13).
          </p>
        </div>
        <div className="flex items-center gap-2">
          {p.is_verified && (
            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full text-sm font-bold">
              <ShieldCheck className="w-4 h-4" /> Certified Trainer
            </span>
          )}
          <Link
            href={`/trainers/${p.slug}`} target="_blank" rel="noopener"
            className="btn-secondary text-sm"
          >
            <ExternalLink className="w-4 h-4" /> Preview public profile
          </Link>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatSmall label="Rating" value={p.rating_avg !== null ? `${p.rating_avg.toFixed(1)}★` : '—'} />
        <StatSmall label="Reviews" value={p.rating_count} />
        <StatSmall label="Students taught" value={p.students_taught} />
        <StatSmall label="Public" value={p.is_public ? 'YES' : 'NO'}
          highlight={p.is_public ? 'green' : 'amber'} />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {([
          ['profile', 'Profile', null],
          ['qualifications', 'Qualifications', data.qualifications.length],
          ['certifications', 'Certifications', data.certifications.length],
          ['experience', 'Experience', data.experiences.length],
          ['courses', 'Courses Delivered', data.courses?.length ?? 0],
          ['reviews', 'Reviews', p.rating_count],
        ] as [Tab, string, number | null][]).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 whitespace-nowrap transition ${
              tab === key ? 'border-brand-500 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {label} {count !== null && <span className="ml-1 text-xs opacity-70">({count})</span>}
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

function StatSmall({ label, value, highlight }: { label: string; value: string | number; highlight?: 'green' | 'amber' }) {
  const clr = highlight === 'green' ? 'text-emerald-700' : highlight === 'amber' ? 'text-amber-700' : 'text-slate-900';
  return (
    <div className="card p-3">
      <div className="text-xs uppercase font-bold text-slate-500 tracking-widest">{label}</div>
      <div className={`text-2xl font-black mt-1 ${clr}`}>{value}</div>
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
    <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="card p-6 space-y-4">
      <Field label="Headline" hint="One line that appears under your name">
        <input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })}
          className="input" maxLength={180} placeholder="Senior Excel & Power Query Consultant" />
      </Field>

      <Field label="About you" hint="Rich bio for your public profile (max 5000 chars)">
        <textarea value={form.bio_long} onChange={(e) => setForm({ ...form, bio_long: e.target.value })}
          className="input min-h-[140px]" maxLength={5000} rows={6} />
      </Field>

      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Years of experience">
          <input type="number" min="0" max="80" value={form.years_experience}
            onChange={(e) => setForm({ ...form, years_experience: Number(e.target.value) })}
            className="input" />
        </Field>
        <Field label="Hourly rate (TZS)" hint="Optional — leave 0 to hide">
          <input type="number" min="0" value={form.hourly_rate_tzs}
            onChange={(e) => setForm({ ...form, hourly_rate_tzs: Number(e.target.value) })}
            className="input" />
        </Field>
      </div>

      <Field label="Expertise areas" hint="Comma-separated, e.g. excel, power_query, financial_modeling">
        <input value={form.expertise_areas} onChange={(e) => setForm({ ...form, expertise_areas: e.target.value })}
          className="input" placeholder="excel, power_query" />
      </Field>

      <Field label="Teaching languages" hint="Comma-separated ISO codes, e.g. sw, en">
        <input value={form.teaching_languages} onChange={(e) => setForm({ ...form, teaching_languages: e.target.value })}
          className="input" placeholder="sw, en" />
      </Field>

      <Field label="Availability">
        <select value={form.availability_status} onChange={(e) => setForm({ ...form, availability_status: e.target.value as any })} className="input">
          <option value="available">Available for new engagements</option>
          <option value="busy">Busy — limited availability</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </Field>

      <Field label="Contact email" hint="Shown on public profile if inquiries are enabled">
        <input type="email" value={form.public_email} onChange={(e) => setForm({ ...form, public_email: e.target.value })}
          className="input" placeholder="you@example.com" />
      </Field>

      <div className="grid md:grid-cols-2 gap-4">
        <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200">
          <input type="checkbox" checked={form.accepts_direct_inquiries}
            onChange={(e) => setForm({ ...form, accepts_direct_inquiries: e.target.checked })}
            className="mt-1" />
          <div>
            <div className="font-bold text-sm">Accept direct inquiries</div>
            <div className="text-xs text-slate-500">Show your email publicly for booking requests</div>
          </div>
        </label>
        <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200">
          <input type="checkbox" checked={form.is_public}
            onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
            className="mt-1" />
          <div className="flex-1">
            <div className="font-bold text-sm inline-flex items-center gap-1">
              {form.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              Publish to trainer directory
            </div>
            <div className="text-xs text-slate-500">Off = hidden from /trainers browsing</div>
          </div>
        </label>
      </div>

      <button type="submit" disabled={mut.isPending} className="btn-primary">
        {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save profile
      </button>
    </form>
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
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add qualification
        </button>
      )}
      {showForm && <AddQualificationForm onDone={() => { setShowForm(false); onChanged(); }} onCancel={() => setShowForm(false)} />}

      {items.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          No qualifications yet. Add your first education entry.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((q) => (
            <li key={q.id} className="card p-4 flex items-start gap-3">
              <GraduationCap className="w-6 h-6 text-brand-500 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="font-bold text-slate-900">{q.degree}</span>
                  {q.field_of_study && <span className="text-sm text-slate-600">— {q.field_of_study}</span>}
                  <VerificationBadge status={q.verification_status} />
                </div>
                <div className="text-sm text-slate-600">{q.institution}</div>
                <div className="text-xs text-slate-500">
                  {q.start_year ?? '?'} – {q.end_year ?? 'Present'}
                  {q.has_proof && <> · <span className="text-emerald-700 font-semibold">proof uploaded</span></>}
                </div>
                {q.verification_status === 'rejected' && q.rejection_reason && (
                  <div className="mt-2 text-xs text-red-700 bg-red-50 rounded p-2">
                    <strong>Rejected:</strong> {q.rejection_reason}
                  </div>
                )}
              </div>
              <button onClick={() => confirm(`Delete "${q.degree}"?`) && del.mutate(q.id)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
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
    <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="card p-5 space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Institution *"><input required className="input" value={f.institution} onChange={(e) => setF({ ...f, institution: e.target.value })} /></Field>
        <Field label="Degree *"><input required className="input" value={f.degree} onChange={(e) => setF({ ...f, degree: e.target.value })} /></Field>
        <Field label="Field of study"><input className="input" value={f.field_of_study} onChange={(e) => setF({ ...f, field_of_study: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="From year"><input type="number" min="1950" max={new Date().getFullYear()} className="input" value={f.start_year} onChange={(e) => setF({ ...f, start_year: e.target.value })} /></Field>
          <Field label="To year (blank = ongoing)"><input type="number" min="1950" className="input" value={f.end_year} onChange={(e) => setF({ ...f, end_year: e.target.value })} /></Field>
        </div>
      </div>
      <Field label="Proof (PDF or image, max 8 MB)" hint="Diploma, transcript, or official letter — reviewed by admin">
        <input type="file" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
      </Field>
      <div className="flex gap-2">
        <button type="submit" disabled={mut.isPending} className="btn-primary">
          {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Add qualification
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
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
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add certification
        </button>
      )}
      {showForm && <AddCertificationForm onDone={() => { setShowForm(false); onChanged(); }} onCancel={() => setShowForm(false)} />}

      {items.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500">No certifications yet.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((c) => (
            <li key={c.id} className="card p-4 flex items-start gap-3">
              <Award className={`w-6 h-6 mt-0.5 ${c.is_expired ? 'text-red-500' : 'text-amber-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="font-bold text-slate-900">{c.name}</span>
                  <VerificationBadge status={c.verification_status} />
                  {c.is_expired && <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold uppercase">Expired</span>}
                  {!c.is_expired && c.is_expiring_soon && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase">Expires soon</span>}
                </div>
                <div className="text-sm text-slate-600">by {c.issuer}</div>
                <div className="text-xs text-slate-500">
                  {c.credential_id && <>ID: {c.credential_id} · </>}
                  {c.issue_date && <>Issued {new Date(c.issue_date).toLocaleDateString()}</>}
                  {c.expiry_date && <> · Expires {new Date(c.expiry_date).toLocaleDateString()}</>}
                </div>
                {c.verification_status === 'rejected' && c.rejection_reason && (
                  <div className="mt-2 text-xs text-red-700 bg-red-50 rounded p-2">
                    <strong>Rejected:</strong> {c.rejection_reason}
                  </div>
                )}
              </div>
              <button onClick={() => confirm(`Delete "${c.name}"?`) && del.mutate(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
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
    <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="card p-5 space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Certification name *"><input required className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Issuer *"><input required className="input" value={f.issuer} onChange={(e) => setF({ ...f, issuer: e.target.value })} placeholder="Microsoft, PMI, etc." /></Field>
        <Field label="Credential ID"><input className="input" value={f.credential_id} onChange={(e) => setF({ ...f, credential_id: e.target.value })} /></Field>
        <Field label="Public verification URL"><input type="url" className="input" value={f.verification_url} onChange={(e) => setF({ ...f, verification_url: e.target.value })} placeholder="https://..." /></Field>
        <Field label="Issue date"><input type="date" className="input" value={f.issue_date} onChange={(e) => setF({ ...f, issue_date: e.target.value })} /></Field>
        <Field label="Expiry date (blank = never)"><input type="date" className="input" value={f.expiry_date} onChange={(e) => setF({ ...f, expiry_date: e.target.value })} /></Field>
      </div>
      <Field label="Proof (PDF or image, max 8 MB)">
        <input type="file" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
      </Field>
      <div className="flex gap-2">
        <button type="submit" disabled={mut.isPending} className="btn-primary">
          {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Add certification
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
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
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add experience
        </button>
      )}
      {showForm && <AddExperienceForm onDone={() => { setShowForm(false); onChanged(); }} onCancel={() => setShowForm(false)} />}

      {items.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500">No work experience listed.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((e) => (
            <li key={e.id} className="card p-4 flex items-start gap-3">
              <Briefcase className="w-6 h-6 text-navy-500 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900">{e.title}</div>
                <div className="text-sm text-slate-600">{e.company}{e.location && ` · ${e.location}`}</div>
                <div className="text-xs text-slate-500">
                  {new Date(e.start_date).toLocaleDateString()} – {e.is_current ? <strong className="text-emerald-700">Present</strong> : (e.end_date ? new Date(e.end_date).toLocaleDateString() : '')}
                  {' · '}{e.duration_years}y
                </div>
                {e.description && <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{e.description}</p>}
              </div>
              <button onClick={() => confirm(`Delete "${e.title}"?`) && del.mutate(e.id)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
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
    <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="card p-5 space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Job title *"><input required className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Company *"><input required className="input" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></Field>
        <Field label="Location"><input className="input" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="Dar es Salaam, Tanzania" /></Field>
        <div />
        <Field label="Start date *"><input required type="date" className="input" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} /></Field>
        <Field label="End date (blank = current)"><input type="date" className="input" value={f.end_date} onChange={(e) => setF({ ...f, end_date: e.target.value })} /></Field>
      </div>
      <Field label="Description">
        <textarea className="input min-h-[100px]" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={4} maxLength={3000} />
      </Field>
      <div className="flex gap-2">
        <button type="submit" disabled={mut.isPending} className="btn-primary">
          {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Add experience
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
}

// ── REVIEWS TAB ────────────────────────────────────────

function ReviewsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['trainer', 'my-reviews'],
    queryFn: () => trainerPortalApi.myReviews(),
  });

  if (isLoading || !data) {
    return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="card p-4 flex items-center justify-between">
        <div>
          <div className="text-3xl font-black text-slate-900">
            {data.meta.avg ? data.meta.avg.toFixed(1) : '—'}
          </div>
          <StarRating value={data.meta.avg} />
        </div>
        <div className="text-right">
          <div className="text-xs uppercase text-slate-500 font-bold">Total reviews</div>
          <div className="text-2xl font-bold text-slate-900">{data.meta.count}</div>
        </div>
      </div>

      {data.data.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          No reviews yet. Students can rate you after completing your courses.
        </div>
      ) : (
        <ul className="space-y-2">
          {data.data.map((r) => (
            <li key={r.id} className="card p-4">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="font-semibold text-slate-900">{r.student_name}</div>
                  {r.course_title && <div className="text-xs text-slate-500">on {r.course_title}</div>}
                </div>
                <StarRating value={r.rating} />
              </div>
              {r.text && <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{r.text}</p>}
              <div className="mt-1 text-[10px] text-slate-400">{new Date(r.created_at).toLocaleDateString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs uppercase font-bold text-slate-500 tracking-widest mb-1">{label}</div>
      {children}
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </label>
  );
}

function CoursesDeliveredTab({ items }: { items: CourseDeliveredSummary[] }) {
  if (items.length === 0) {
    return (
      <div className="card p-8 text-center text-slate-500">
        <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <div className="font-semibold">No courses yet</div>
        <div className="text-sm mt-1">
          Courses you author appear here. Head to <Link href="/trainer/courses" className="text-brand-600 font-semibold underline">My Courses</Link> to create one.
        </div>
      </div>
    );
  }
  const statusColor = (s: string) => {
    if (s === 'published') return 'bg-emerald-100 text-emerald-800';
    if (s === 'draft') return 'bg-slate-100 text-slate-700';
    if (s === 'archived') return 'bg-amber-100 text-amber-800';
    return 'bg-slate-100 text-slate-700';
  };
  return (
    <div className="space-y-3">
      {items.map((c) => (
        <div key={c.id} className="card p-4 flex items-start gap-4">
          {c.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.thumbnail_url} alt="" className="w-24 h-16 rounded object-cover bg-slate-100 flex-shrink-0" />
          ) : (
            <div className="w-24 h-16 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-slate-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-semibold text-slate-900 truncate">{c.title}</div>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColor(c.status)}`}>
                {c.status}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {c.category} · {c.level}
              {c.price_tzs !== null && <> · TZS {c.price_tzs.toLocaleString()}</>}
            </div>
            <div className="text-xs text-slate-600 mt-2 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> {c.enrollments_count} enrolled
            </div>
          </div>
          <Link href={`/trainer/courses`} className="text-brand-600 text-sm font-semibold whitespace-nowrap self-center">
            Manage
          </Link>
        </div>
      ))}
    </div>
  );
}

function VerificationBadge({ status }: { status: 'pending' | 'verified' | 'rejected' }) {
  if (status === 'verified') {
    return <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
      <Check className="w-3 h-3" /> Verified
    </span>;
  }
  if (status === 'rejected') {
    return <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
      <X className="w-3 h-3" /> Rejected
    </span>;
  }
  return <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
    Pending
  </span>;
}
