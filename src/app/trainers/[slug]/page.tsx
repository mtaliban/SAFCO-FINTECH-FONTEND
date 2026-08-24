'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, ShieldCheck, Mail, MapPin, Clock, Users, GraduationCap,
  Award, Briefcase, BookOpen, Star, AlertTriangle, ExternalLink, Loader2,
} from 'lucide-react';
import { trainerPortalApi } from '@/lib/trainerPortal/api';
import { StarRating } from '@/components/trainer/StarRating';
import { formatTzs } from '@/lib/payment/money';

/**
 * SRS Module 13 — Public trainer profile page.
 * LinkedIn-style layout: cover + avatar → about → qualifications timeline →
 * certifications → experience → courses delivered → student reviews.
 */
export default function TrainerPublicProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['trainer', 'profile', slug],
    queryFn: () => trainerPortalApi.publicProfile(slug),
    staleTime: 60_000,
  });

  if (isLoading) {
    return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>;
  }
  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="card p-12 text-center max-w-md">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Trainer not found</h2>
          <p className="text-slate-500 mb-4">This profile may be private or does not exist.</p>
          <Link href="/trainers" className="btn-primary inline-flex">
            <ArrowLeft className="w-4 h-4" /> Back to directory
          </Link>
        </div>
      </div>
    );
  }

  const t = data;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Cover */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-brand-500 to-navy-700 relative">
        {t.cover && <img src={t.cover} alt="" className="w-full h-full object-cover opacity-40" />}
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-16 relative">
        <Link href="/trainers" className="inline-flex items-center gap-1 mb-4 text-sm text-white/90 hover:text-white font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to directory
        </Link>

        {/* Header card */}
        <div className="card p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-slate-200 overflow-hidden shrink-0 ring-4 ring-white shadow-lg">
              {t.avatar
                ? <img src={t.avatar} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-4xl font-black text-slate-500">
                    {t.name.slice(0, 1).toUpperCase()}
                  </div>}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-black text-slate-900">{t.name}</h1>
                {t.is_verified && (
                  <span title="Certified by SAFCO FINTECH" className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Certified Trainer
                  </span>
                )}
              </div>
              {t.headline && (
                <p className="text-lg text-slate-700 font-medium mt-1">{t.headline}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <StarRating value={t.rating_avg} showNumber={t.rating_avg !== null} />
                <span>({t.rating_count} review{t.rating_count === 1 ? '' : 's'})</span>
                <span className="inline-flex items-center gap-1"><Users className="w-4 h-4" /> {t.students_taught} students taught</span>
                {t.years_experience !== null && (
                  <span className="inline-flex items-center gap-1"><Briefcase className="w-4 h-4" /> {t.years_experience} years experience</span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {t.public_email && (
                  <a href={`mailto:${t.public_email}`} className="btn-primary text-sm">
                    <Mail className="w-4 h-4" /> Contact trainer
                  </a>
                )}
                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest ${
                  t.availability_status === 'available' ? 'bg-emerald-100 text-emerald-800' :
                  t.availability_status === 'busy' ? 'bg-amber-100 text-amber-800' :
                  'bg-slate-200 text-slate-600'
                }`}>
                  {t.availability_status}
                </div>
                {t.hourly_rate_tzs !== null && (
                  <div className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 text-brand-700">
                    TZS {formatTzs(t.hourly_rate_tzs)} / hour
                  </div>
                )}
              </div>

              {t.expertise_areas.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {t.expertise_areas.map((e) => (
                    <span key={e} className="text-xs px-3 py-1 rounded-full bg-navy-50 text-navy-800 font-semibold">
                      {e.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* About */}
        {t.bio_long && (
          <Section title="About" icon={<Users className="w-5 h-5" />}>
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{t.bio_long}</p>
          </Section>
        )}

        {/* Qualifications */}
        {t.qualifications.length > 0 && (
          <Section title="Qualifications" icon={<GraduationCap className="w-5 h-5" />}>
            <ul className="space-y-4">
              {t.qualifications.map((q) => (
                <li key={q.id} className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{q.degree}{q.field_of_study && ` — ${q.field_of_study}`}</div>
                    <div className="text-sm text-slate-600">{q.institution}</div>
                    {(q.start_year || q.end_year) && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        {q.start_year ?? '?'} – {q.end_year ?? 'Present'}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Certifications */}
        {t.certifications.length > 0 && (
          <Section title="Certifications" icon={<Award className="w-5 h-5" />}>
            <div className="grid md:grid-cols-2 gap-3">
              {t.certifications.map((c) => (
                <div key={c.id} className="p-3 rounded-lg border border-slate-200 relative">
                  {c.is_expired && (
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      <AlertTriangle className="w-3 h-3" /> Expired
                    </span>
                  )}
                  {!c.is_expired && c.is_expiring_soon && (
                    <span className="absolute top-2 right-2 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      Expires soon
                    </span>
                  )}
                  <div className="font-bold text-slate-900 text-sm pr-16">{c.name}</div>
                  <div className="text-xs text-slate-600 mt-1">by {c.issuer}</div>
                  {c.credential_id && (
                    <div className="text-[10px] text-slate-500 font-mono mt-1">ID: {c.credential_id}</div>
                  )}
                  <div className="text-xs text-slate-500 mt-1">
                    {c.issue_date && <>Issued {new Date(c.issue_date).toLocaleDateString()}</>}
                    {c.expiry_date && <> · Expires {new Date(c.expiry_date).toLocaleDateString()}</>}
                  </div>
                  {c.verification_url && (
                    <a href={c.verification_url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-semibold mt-2">
                      Verify <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Experience */}
        {t.experiences.length > 0 && (
          <Section title="Experience" icon={<Briefcase className="w-5 h-5" />}>
            <ul className="space-y-4">
              {t.experiences.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-navy-100 text-navy-700 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-900">{e.title}</div>
                    <div className="text-sm text-slate-600">
                      {e.company}{e.location && ` · ${e.location}`}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {new Date(e.start_date).toLocaleDateString()}
                      {' – '}
                      {e.is_current ? <strong className="text-emerald-700">Present</strong> : (e.end_date ? new Date(e.end_date).toLocaleDateString() : '')}
                      {' · '}{e.duration_years}y
                    </div>
                    {e.description && (
                      <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{e.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Courses delivered */}
        {t.courses.length > 0 && (
          <Section title="Courses Delivered" icon={<BookOpen className="w-5 h-5" />}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {t.courses.map((c) => (
                <div key={c.id} className="p-3 rounded-lg border border-slate-200">
                  {c.thumbnail_url && (
                    <img src={c.thumbnail_url} alt="" className="w-full h-24 object-cover rounded mb-2" />
                  )}
                  <div className="font-bold text-slate-900 text-sm line-clamp-2">{c.title}</div>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>{c.enrollments_count} student{c.enrollments_count === 1 ? '' : 's'}</span>
                    <span className="font-semibold text-brand-600">
                      {c.price_tzs ? `TZS ${formatTzs(c.price_tzs)}` : 'Free'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Reviews */}
        <Section title={`Student Reviews (${t.rating_count})`} icon={<Star className="w-5 h-5" />}>
          {t.reviews.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500 border-2 border-dashed border-slate-200 rounded">
              No reviews yet.
            </div>
          ) : (
            <ul className="space-y-4">
              {t.reviews.map((r) => (
                <li key={r.id} className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="font-semibold text-slate-900">{r.student_name}</div>
                      {r.course_title && (
                        <div className="text-xs text-slate-500">on {r.course_title}</div>
                      )}
                    </div>
                    <StarRating value={r.rating} />
                  </div>
                  {r.text && <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{r.text}</p>}
                  <div className="mt-1 text-[10px] text-slate-400">
                    {new Date(r.at).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <div className="h-16" />
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card p-6 md:p-8 mt-4">
      <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
        <span className="text-brand-500">{icon}</span> {title}
      </h2>
      {children}
    </div>
  );
}
