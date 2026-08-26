'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, ShieldCheck, Mail, Users, GraduationCap,
  Award, Briefcase, BookOpen, Star, ExternalLink, Loader2,
  Clock, DollarSign, Globe, BadgeCheck,
} from 'lucide-react';
import { trainerPortalApi } from '@/lib/trainerPortal/api';
import { StarRating } from '@/components/trainer/StarRating';
import { formatTzs } from '@/lib/payment/money';

export default function TrainerPublicProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['trainer', 'profile', slug],
    queryFn: () => trainerPortalApi.publicProfile(slug),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="h-64 animate-pulse" style={{ background: 'linear-gradient(135deg,#0c1a3a 0%,#1e3a8a 100%)' }} />
        <div className="max-w-5xl mx-auto px-6 -mt-16 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 animate-pulse">
            <div className="flex gap-6">
              <div className="w-32 h-32 rounded-full bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-8 bg-slate-200 rounded w-1/2" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/3" />
              </div>
            </div>
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 animate-pulse h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center max-w-md">
          <GraduationCap className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Trainer not found</h2>
          <p className="text-slate-500 mb-6 text-sm">This profile may be private or does not exist.</p>
          <Link href="/trainers"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl transition">
            <ArrowLeft className="w-4 h-4" /> Back to directory
          </Link>
        </div>
      </div>
    );
  }

  const t = data;
  const availCfg = {
    available: { label: 'Available for engagements', bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
    busy: { label: 'Limited availability', bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
    unavailable: { label: 'Unavailable', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  } as const;
  const avail = availCfg[t.availability_status as keyof typeof availCfg] ?? availCfg.unavailable;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── COVER ── */}
      <div className="relative h-52 md:h-72 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0c1a3a 0%, #1e3a8a 50%, #1d4ed8 100%)' }}>
        {t.cover && (
          <img src={t.cover} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-20 relative z-10 pb-16 space-y-4">

        {/* Back link */}
        <Link href="/trainers"
          className="inline-flex items-center gap-1.5 text-white/90 hover:text-white font-semibold text-sm mb-2 drop-shadow">
          <ArrowLeft className="w-4 h-4" /> Back to directory
        </Link>

        {/* ── PROFILE CARD ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">

            {/* Avatar */}
            <div className="shrink-0">
              <div className={`w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden bg-slate-100 shadow-xl ${
                t.is_verified ? 'ring-4 ring-emerald-400 ring-offset-2' : 'ring-4 ring-white'
              }`}>
                {t.avatar
                  ? <img src={t.avatar} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-5xl font-black text-slate-400">
                      {t.name.slice(0, 1).toUpperCase()}
                    </div>}
              </div>
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-3xl font-black text-slate-900">{t.name}</h1>
                {t.is_verified && (
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold">
                    <BadgeCheck className="w-3.5 h-3.5" /> Certified Trainer
                  </span>
                )}
              </div>

              {t.headline && (
                <p className="text-lg text-slate-600 font-medium mt-0.5">{t.headline}</p>
              )}

              {/* Stats row */}
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-1.5">
                  <StarRating value={t.rating_avg} showNumber={t.rating_avg !== null} />
                  <span className="text-slate-400">({t.rating_count} review{t.rating_count === 1 ? '' : 's'})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  <strong>{t.students_taught.toLocaleString()}</strong> students
                </div>
                {t.years_experience !== null && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <strong>{t.years_experience}</strong> years experience
                  </div>
                )}
              </div>

              {/* Actions + status */}
              <div className="mt-4 flex flex-wrap gap-3">
                {t.public_email && (
                  <a href={`mailto:${t.public_email}`}
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl transition text-sm shadow-sm">
                    <Mail className="w-4 h-4" /> Contact trainer
                  </a>
                )}
                <div className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide ${avail.bg} ${avail.text}`}>
                  <span className={`w-2 h-2 rounded-full ${avail.dot}`} />
                  {avail.label}
                </div>
                {t.hourly_rate_tzs !== null && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700">
                    <DollarSign className="w-3.5 h-3.5" /> TZS {formatTzs(t.hourly_rate_tzs)} / hour
                  </div>
                )}
              </div>

              {/* Expertise */}
              {t.expertise_areas.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {t.expertise_areas.map((e) => (
                    <span key={e} className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold">
                      {e.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── ABOUT ── */}
        {t.bio_long && (
          <ProfileSection title="About" icon={<Users className="w-5 h-5" />}>
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{t.bio_long}</p>
          </ProfileSection>
        )}

        {/* ── QUALIFICATIONS ── */}
        {t.qualifications.length > 0 && (
          <ProfileSection title="Education & Qualifications" icon={<GraduationCap className="w-5 h-5" />}>
            <div className="space-y-5">
              {t.qualifications.map((q, idx) => (
                <div key={q.id} className="flex gap-4">
                  <div className="relative shrink-0 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    {idx < t.qualifications.length - 1 && (
                      <div className="w-0.5 flex-1 mt-2 bg-slate-200 min-h-[20px]" />
                    )}
                  </div>
                  <div className="flex-1 pb-5">
                    <div className="font-bold text-slate-900">
                      {q.degree}{q.field_of_study && ` — ${q.field_of_study}`}
                    </div>
                    <div className="text-sm font-semibold text-teal-700 mt-0.5">{q.institution}</div>
                    {(q.start_year || q.end_year) && (
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {q.start_year ?? '?'} – {q.end_year ?? 'Present'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ProfileSection>
        )}

        {/* ── CERTIFICATIONS ── */}
        {t.certifications.length > 0 && (
          <ProfileSection title="Professional Certifications" icon={<Award className="w-5 h-5" />}>
            <div className="grid md:grid-cols-2 gap-3">
              {t.certifications.map((c) => (
                <div key={c.id}
                  className={`p-4 rounded-xl border relative ${c.is_expired ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-slate-50/50'}`}>
                  {c.is_expired && (
                    <span className="absolute top-3 right-3 text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                      Expired
                    </span>
                  )}
                  {!c.is_expired && c.is_expiring_soon && (
                    <span className="absolute top-3 right-3 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                      Expires soon
                    </span>
                  )}

                  <div className="flex items-start gap-3 pr-20">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.is_expired ? 'bg-red-100' : 'bg-amber-100'}`}>
                      <Award className={`w-4.5 h-4.5 ${c.is_expired ? 'text-red-500' : 'text-amber-600'}`} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                      <div className="text-xs text-slate-600 font-semibold mt-0.5">{c.issuer}</div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-500 space-y-0.5">
                    {c.credential_id && <div className="font-mono">ID: {c.credential_id}</div>}
                    <div>
                      {c.issue_date && <>Issued {new Date(c.issue_date).toLocaleDateString()}</>}
                      {c.expiry_date && <> · Expires {new Date(c.expiry_date).toLocaleDateString()}</>}
                    </div>
                  </div>

                  {c.verification_url && (
                    <a href={c.verification_url} target="_blank" rel="noopener"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold mt-2">
                      Verify credential <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </ProfileSection>
        )}

        {/* ── EXPERIENCE ── */}
        {t.experiences.length > 0 && (
          <ProfileSection title="Professional Experience" icon={<Briefcase className="w-5 h-5" />}>
            <div className="space-y-0">
              {t.experiences.map((e, idx) => (
                <div key={e.id} className="flex gap-4">
                  <div className="relative shrink-0 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    {idx < t.experiences.length - 1 && (
                      <div className="w-0.5 flex-1 mt-2 bg-slate-200 min-h-[24px]" />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="font-bold text-slate-900">{e.title}</div>
                    <div className="text-sm font-semibold text-blue-700 mt-0.5">
                      {e.company}{e.location && <span className="text-slate-500 font-normal"> · {e.location}</span>}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(e.start_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                      {' – '}
                      {e.is_current
                        ? <span className="text-emerald-700 font-semibold">Present</span>
                        : (e.end_date ? new Date(e.end_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '')}
                      {' · '}<span className="font-semibold">{e.duration_years}y</span>
                    </div>
                    {e.description && (
                      <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap leading-relaxed">{e.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ProfileSection>
        )}

        {/* ── COURSES DELIVERED ── */}
        {t.courses.length > 0 && (
          <ProfileSection title="Courses Delivered" icon={<BookOpen className="w-5 h-5" />}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {t.courses.map((c) => (
                <div key={c.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-orange-200 hover:shadow-md transition overflow-hidden group">
                  {c.thumbnail_url ? (
                    <img src={c.thumbnail_url} alt="" className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-28 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-slate-300" />
                    </div>
                  )}
                  <div className="p-3">
                    <div className="font-bold text-slate-900 text-sm line-clamp-2 leading-tight">{c.title}</div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {c.enrollments_count.toLocaleString()} students
                      </span>
                      <span className="font-bold text-orange-600">
                        {c.price_tzs && c.price_tzs > 0 ? `TZS ${formatTzs(c.price_tzs)}` : 'Free'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ProfileSection>
        )}

        {/* ── REVIEWS ── */}
        <ProfileSection title={`Student Reviews (${t.rating_count})`} icon={<Star className="w-5 h-5" />}>
          {t.reviews.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <Star className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <div className="text-sm text-slate-500">No reviews yet.</div>
            </div>
          ) : (
            <>
              {/* Rating summary */}
              <div className="bg-slate-50 rounded-xl p-5 flex items-center gap-6 mb-5">
                <div className="text-center shrink-0">
                  <div className="text-5xl font-black text-slate-900 tabular-nums">
                    {t.rating_avg !== null ? t.rating_avg.toFixed(1) : '—'}
                  </div>
                  <StarRating value={t.rating_avg} />
                  <div className="text-xs text-slate-400 mt-1">{t.rating_count} reviews</div>
                </div>
              </div>

              <div className="space-y-3">
                {t.reviews.map((r) => (
                  <div key={r.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                      <div>
                        <div className="font-bold text-slate-900">{r.student_name}</div>
                        {r.course_title && (
                          <div className="text-xs text-slate-500 mt-0.5">on <span className="font-medium text-slate-700">{r.course_title}</span></div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StarRating value={r.rating} />
                        <div className="text-[10px] text-slate-400">
                          {new Date(r.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    {r.text && <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{r.text}</p>}
                  </div>
                ))}
              </div>
            </>
          )}
        </ProfileSection>

      </div>
    </div>
  );
}

function ProfileSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 md:px-8 py-4 border-b border-slate-100 flex items-center gap-2">
        <span className="text-orange-500">{icon}</span>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      </div>
      <div className="px-6 md:px-8 py-6">{children}</div>
    </div>
  );
}
