'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  ArrowLeft, CheckCircle2, XCircle, Loader2,
  BookOpen, Play, FileText, Download, ExternalLink,
  ChevronRight, Users, Clock, LayoutGrid,
  FileArchive, ClipboardList, ChevronLeft,
} from 'lucide-react';
import {
  courseApi, adminCoursesApi, CATEGORY_LABEL,
  type LessonMaterial, type MaterialType, type Module, type Lesson,
} from '@/lib/course/api';
import { mediaUrl } from '@/lib/utils';
import { useNotifications } from '@/lib/notifications/hook';

type LessonWithMeta = Lesson & { moduleTitle: string; modIdx: number; lesIdx: number };

const LEVEL: Record<string, string> = {
  beginner: 'Beginner', intermediate: 'Intermediate',
  advanced: 'Advanced', expert: 'Expert',
};

export default function AdminCourseReviewPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { markReadForRoute } = useNotifications();

  // null = show course overview; string = show that lesson
  const [activeLessonUuid, setActiveLessonUuid] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => { markReadForRoute('/admin/course-approvals'); }, [markReadForRoute]);

  const { data: course, isLoading } = useQuery({
    queryKey: ['admin', 'course-review', uuid],
    queryFn: () => courseApi.get(uuid as string),
    staleTime: 30_000,
  });

  async function approve() {
    if (!confirm('Approve na ipublish course hii?')) return;
    try {
      await adminCoursesApi.approve(uuid as string);
      toast.success('✅ Course imepublished — trainer amearifu');
      qc.invalidateQueries({ queryKey: ['admin', 'course-approvals'] });
      qc.invalidateQueries({ queryKey: ['admin', 'course-approvals-history'] });
      router.push('/admin/course-approvals');
    } catch { /* toast handled by api client */ }
  }

  async function submitReject() {
    if (!reason.trim()) return;
    try {
      await adminCoursesApi.reject(uuid as string, reason);
      toast.success('Course imekataliwa — trainer amearifu');
      qc.invalidateQueries({ queryKey: ['admin', 'course-approvals'] });
      qc.invalidateQueries({ queryKey: ['admin', 'course-approvals-history'] });
      router.push('/admin/course-approvals');
    } catch { /* toast handled */ }
  }

  if (isLoading || !course) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  const allLessons: LessonWithMeta[] = (course.modules ?? []).flatMap((m, mi) =>
    (m.lessons ?? []).map((l, li) => ({ ...l, moduleTitle: m.title, modIdx: mi, lesIdx: li }))
  );

  const activeLesson = allLessons.find((l) => l.uuid === activeLessonUuid) ?? null;
  const isPending   = course.status === 'pending_approval';
  const isPublished = course.status === 'published';
  const isRejected  = course.status === 'rejected';
  const totalLessons = allLessons.length;

  // ── Lesson viewer ──────────────────────────────────────────────────────────
  if (activeLesson) {
    const currentIdx = allLessons.findIndex((l) => l.uuid === activeLessonUuid);
    const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
    const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

    return (
      <div className="flex h-[calc(100vh-56px)] lg:h-screen overflow-hidden bg-slate-50">

        {/* ── Sidebar — hidden on mobile, visible on lg+ ── */}
        <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col shrink-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <button
              onClick={() => setActiveLessonUuid(null)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Rudi Overview
            </button>
            <h2 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2">{course.title}</h2>
          </div>

          <nav className="flex-1 overflow-y-auto">
            {(course.modules ?? []).map((mod, mi) => (
              <ModuleBlock
                key={mod.uuid}
                mod={mod}
                mi={mi}
                activeLessonUuid={activeLessonUuid}
                onSelect={(luuid) => setActiveLessonUuid(luuid)}
              />
            ))}
          </nav>

          <div className="p-3 border-t border-slate-200 space-y-2">
            <StatusBadge isPublished={isPublished} isRejected={isRejected} course={course} />
            {isPending && (
              <>
                <button onClick={approve} className="w-full btn-primary text-sm justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Approve &amp; Publish
                </button>
                <button
                  onClick={() => { setRejectOpen(true); setReason(''); }}
                  className="w-full btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50 justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> Kataa Course
                </button>
              </>
            )}
          </div>
        </aside>

        {/* ── Lesson content ── */}
        <div className="flex-1 overflow-y-auto">
          {/* Mobile top bar — shown only on small screens */}
          <div className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white border-b border-slate-200 sticky top-0 z-10">
            <button
              onClick={() => setActiveLessonUuid(null)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-brand-600 font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Overview
            </button>
            <span className="flex-1 text-xs font-semibold text-slate-800 truncate text-center">{activeLesson.title}</span>
            <span className="text-xs text-slate-400 shrink-0">{currentIdx + 1}/{allLessons.length}</span>
          </div>

          <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Lesson header */}
            <div className="mb-6">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">
                Module {activeLesson.modIdx + 1} · {activeLesson.moduleTitle}
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {activeLesson.modIdx + 1}.{activeLesson.lesIdx + 1} — {activeLesson.title}
              </h1>
              {activeLesson.description && (
                <p className="mt-2 text-slate-600 leading-relaxed">{activeLesson.description}</p>
              )}
            </div>

            {/* Videos */}
            {(activeLesson.materials ?? []).filter((m) => m.category === 'videos').length > 0 && (
              <Section icon={<Play className="w-4 h-4" />} title="Video">
                <div className="space-y-6">
                  {(activeLesson.materials ?? []).filter((m) => m.category === 'videos')
                    .map((m) => <VideoMaterial key={m.uuid} material={m} />)}
                </div>
              </Section>
            )}

            {activeLesson.video_url &&
              !(activeLesson.materials ?? []).some((v) => v.url === activeLesson.video_url) && (
              <Section icon={<Play className="w-4 h-4" />} title="Video">
                <VideoPlayer url={activeLesson.video_url} title={activeLesson.title} />
              </Section>
            )}

            {/* Lesson notes */}
            {activeLesson.content && (
              <Section icon={<BookOpen className="w-4 h-4" />} title="Maelezo ya Somo">
                <div
                  className="prose prose-sm max-w-none text-slate-700 leading-relaxed
                    prose-headings:text-slate-900 prose-headings:font-semibold
                    prose-h2:text-lg prose-h2:mt-5 prose-h2:mb-2
                    prose-h3:text-base prose-h3:mt-4 prose-h3:mb-1
                    prose-p:mb-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5
                    prose-strong:text-slate-900
                    prose-blockquote:border-l-4 prose-blockquote:border-brand-400
                    prose-blockquote:bg-brand-50 prose-blockquote:rounded-r-lg
                    prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:not-italic
                    prose-pre:bg-slate-900 prose-pre:text-green-400 prose-pre:rounded-lg
                    prose-code:bg-slate-100 prose-code:text-slate-800 prose-code:px-1 prose-code:rounded
                    prose-table:text-sm prose-th:bg-slate-100 prose-th:px-3 prose-th:py-2
                    prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-slate-200"
                  dangerouslySetInnerHTML={{ __html: activeLesson.content }}
                />
              </Section>
            )}

            {/* Documents */}
            {(activeLesson.materials ?? []).filter((m) => m.category === 'documents').length > 0 && (
              <Section icon={<FileText className="w-4 h-4" />} title="Nyaraka">
                <div className="space-y-4">
                  {(activeLesson.materials ?? []).filter((m) => m.category === 'documents')
                    .map((m) => <DocMaterial key={m.uuid} material={m} />)}
                </div>
              </Section>
            )}

            {activeLesson.pdf_url &&
              !(activeLesson.materials ?? []).some((d) => d.url === activeLesson.pdf_url) && (
              <a href={activeLesson.pdf_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 card hover:shadow-md transition mb-6">
                <FileText className="w-6 h-6 text-red-600 shrink-0" />
                <div className="flex-1 font-semibold text-slate-900">PDF Notes</div>
                <Download className="w-4 h-4 text-slate-400" />
              </a>
            )}

            {/* Interactive */}
            {(activeLesson.materials ?? []).filter((m) => m.category === 'interactive').length > 0 && (
              <Section icon={<Play className="w-4 h-4" />} title="Interactive Content">
                <div className="space-y-3">
                  {(activeLesson.materials ?? []).filter((m) => m.category === 'interactive')
                    .map((m) => <InteractiveMaterial key={m.uuid} material={m} />)}
                </div>
              </Section>
            )}

            {/* Assignments */}
            {(activeLesson.assignments ?? []).length > 0 && (
              <Section icon={<ClipboardList className="w-4 h-4" />} title="Kazi za Nyumbani">
                <div className="space-y-2">
                  {(activeLesson.assignments ?? []).map((a) => (
                    <div key={a.uuid}
                      className="flex items-center gap-4 p-4 rounded-xl border border-amber-200 bg-amber-50">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <ClipboardList className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{a.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>{a.max_points} pointi</span>
                          {a.due_date && <><span className="text-slate-300">·</span>
                            <span>Deadline: {new Date(a.due_date).toLocaleDateString('sw-TZ')}</span></>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Empty lesson */}
            {(activeLesson.materials ?? []).length === 0 && !activeLesson.video_url &&
              !activeLesson.pdf_url && !activeLesson.content &&
              (activeLesson.assignments ?? []).length === 0 && (
              <div className="card p-10 text-center text-slate-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Somo hili halina maudhui bado.</p>
              </div>
            )}

            {/* Prev / Next */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex items-center gap-3">
              {prevLesson ? (
                <button
                  onClick={() => setActiveLessonUuid(prevLesson.uuid)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Iliyopita</span>
                </button>
              ) : (
                <button
                  onClick={() => setActiveLessonUuid(null)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Overview</span>
                </button>
              )}
              <div className="flex-1 text-center text-xs text-slate-400">
                Lesson {currentIdx + 1} / {allLessons.length}
              </div>
              {nextLesson ? (
                <button
                  onClick={() => setActiveLessonUuid(nextLesson.uuid)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-navy-700 text-white text-sm font-semibold hover:bg-navy-800 transition shadow-sm"
                >
                  <span className="hidden sm:inline">Inayofuata</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setActiveLessonUuid(null)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-navy-700 text-white text-sm font-semibold hover:bg-navy-800 transition shadow-sm"
                >
                  <span className="hidden sm:inline">Rudi Overview</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Mobile approve/reject — shown only on small screens where sidebar is hidden */}
            {isPending && (
              <div className="lg:hidden mt-6 pt-5 border-t border-slate-200 space-y-2">
                <button onClick={approve} className="w-full btn-primary justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Approve &amp; Publish
                </button>
                <button
                  onClick={() => { setRejectOpen(true); setReason(''); }}
                  className="w-full btn-secondary justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4" /> Kataa Course
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reject modal */}
        <RejectModal
          open={rejectOpen}
          reason={reason}
          onReasonChange={setReason}
          onClose={() => setRejectOpen(false)}
          onSubmit={submitReject}
        />
      </div>
    );
  }

  // ── Course overview (same layout as student course detail page) ────────────
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto animate-fade-in">

      {/* Back link */}
      <Link
        href="/admin/course-approvals"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Orodha ya Approvals
      </Link>

      {/* ── Header grid — same as student detail page ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

        {/* Left: course info */}
        <div className="lg:col-span-2">
          <div className="text-xs text-orange-600 font-bold uppercase tracking-wider mb-2">
            {CATEGORY_LABEL[course.category as keyof typeof CATEGORY_LABEL]} · {LEVEL[course.level] ?? course.level}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 leading-tight">{course.title}</h1>
          {course.description && (
            <p className="text-slate-600 mb-4 leading-relaxed">{course.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4" />
              {course.stats?.modules ?? 0} modules · {totalLessons} lessons
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {course.stats?.enrollments ?? 0} wanafunzi
            </span>
            {course.duration_hours && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {course.duration_hours}h
              </span>
            )}
            {course.instructor?.name && (
              <span>👨‍🏫 {course.instructor.name}</span>
            )}
          </div>
        </div>

        {/* Right: admin action card (replaces student enrollment card) */}
        <div className="card overflow-hidden">
          {/* Thumbnail — same as student page */}
          <div className="aspect-video bg-gradient-to-br from-navy-600 to-navy-900 relative">
            {course.thumbnail_url ? (
              <Image
                src={mediaUrl(course.thumbnail_url)!}
                alt={course.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-30">📚</div>
            )}
          </div>

          <div className="p-4 space-y-3">
            <StatusBadge isPublished={isPublished} isRejected={isRejected} course={course} />

            {isPending && (
              <>
                <button onClick={approve} className="btn-primary w-full justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Approve &amp; Publish
                </button>
                <button
                  onClick={() => { setRejectOpen(true); setReason(''); }}
                  className="btn-secondary w-full justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4" /> Kataa Course
                </button>
              </>
            )}

            {!isPending && (
              <Link href="/admin/course-approvals" className="btn-secondary w-full justify-center gap-2 flex">
                <ArrowLeft className="w-4 h-4" /> Rudi Orodhani
              </Link>
            )}

            {/* Start reading */}
            {allLessons.length > 0 && (
              <button
                onClick={() => setActiveLessonUuid(allLessons[0].uuid)}
                className="btn-secondary w-full justify-center gap-2"
              >
                <Play className="w-4 h-4" /> Soma Lesson ya Kwanza
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Module / lesson structure — same as student page ── */}
      <div className="card p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1">Muundo wa Course</h2>
        <p className="text-sm text-slate-500 mb-4">
          {course.stats?.modules ?? 0} modules · {totalLessons} lessons
        </p>

        {!(course.modules ?? []).length ? (
          <p className="text-slate-500 text-center py-8">Trainer bado hajaongeza modules.</p>
        ) : (
          <div className="space-y-3">
            {(course.modules ?? []).map((mod, mi) => (
              <details key={mod.uuid} open={mi === 0} className="border border-slate-200 rounded-xl overflow-hidden">
                <summary className="flex items-center gap-2 px-3 sm:px-5 py-3 sm:py-4 cursor-pointer select-none hover:bg-slate-50 transition">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">
                      Module {mi + 1}: {mod.title}
                    </p>
                    {mod.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{mod.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">
                    {mod.lessons?.length ?? 0}L
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 transition-transform shrink-0" />
                </summary>

                <div className="border-t border-slate-100 divide-y divide-slate-50">
                  {(mod.lessons ?? []).map((l: Lesson, li) => (
                    <button
                      key={l.uuid}
                      onClick={() => setActiveLessonUuid(l.uuid)}
                      className="w-full text-left flex items-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 text-sm hover:bg-brand-50 transition group"
                    >
                      <Play className="w-4 h-4 text-brand-400 shrink-0 group-hover:text-brand-600" />
                      <span className="flex-1 text-slate-700 group-hover:text-brand-700 min-w-0 truncate">
                        {mi + 1}.{li + 1} · {l.title}
                      </span>
                      {l.duration_seconds && (
                        <span className="text-xs text-slate-400 shrink-0">
                          {Math.round(l.duration_seconds / 60)}m
                        </span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>

      {/* Reject modal */}
      <RejectModal
        open={rejectOpen}
        reason={reason}
        onReasonChange={setReason}
        onClose={() => setRejectOpen(false)}
        onSubmit={submitReject}
      />
    </div>
  );
}

/* ── Sidebar module block ── */
function ModuleBlock({
  mod, mi, activeLessonUuid, onSelect,
}: {
  mod: Module; mi: number; activeLessonUuid: string | null; onSelect: (uuid: string) => void;
}) {
  const [open, setOpen] = useState(
    mi === 0 || (mod.lessons ?? []).some((l) => l.uuid === activeLessonUuid)
  );
  return (
    <div className="border-b border-slate-100">
      <button onClick={() => setOpen(!open)} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2">
        <div className="flex-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Module {mi + 1}</div>
          <div className="text-sm font-semibold text-slate-800 leading-tight">{mod.title}</div>
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="pb-1">
          {(mod.lessons ?? []).map((l, li) => {
            const isActive = l.uuid === activeLessonUuid;
            return (
              <button
                key={l.uuid}
                onClick={() => onSelect(l.uuid)}
                className={`w-full text-left flex items-start gap-2.5 pl-4 pr-3 py-2.5 text-sm transition
                  ${isActive ? 'bg-brand-50 border-r-[3px] border-brand-600' : 'hover:bg-slate-50'}`}
              >
                <Play className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isActive ? 'text-brand-500' : 'text-slate-300'}`} />
                <span className={`text-[13px] leading-snug ${isActive ? 'text-brand-700 font-semibold' : 'text-slate-700'}`}>
                  {mi + 1}.{li + 1} · {l.title}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Status badge ── */
function StatusBadge({ isPublished, isRejected, course }: {
  isPublished: boolean; isRejected: boolean;
  course: { approved_at?: string | null; rejection_reason?: string | null };
}) {
  if (isPublished) return (
    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
      <div>
        <p className="text-xs font-bold text-green-700">Imepublished</p>
        {course.approved_at && (
          <p className="text-[10px] text-green-600">{new Date(course.approved_at).toLocaleString('sw-TZ')}</p>
        )}
      </div>
    </div>
  );
  if (isRejected) return (
    <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-2 mb-1">
        <XCircle className="w-4 h-4 text-red-600 shrink-0" />
        <p className="text-xs font-bold text-red-700">Imekataliwa</p>
      </div>
      {course.rejection_reason && (
        <p className="text-[11px] text-red-700 leading-relaxed">{course.rejection_reason}</p>
      )}
    </div>
  );
  return (
    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
      <p className="text-xs font-bold text-amber-700">Inasubiri Approval</p>
    </div>
  );
}

/* ── Reject modal ── */
function RejectModal({ open, reason, onReasonChange, onClose, onSubmit }: {
  open: boolean; reason: string;
  onReasonChange: (v: string) => void;
  onClose: () => void; onSubmit: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-500" /> Kataa Course
        </h3>
        <p className="text-sm text-slate-600 mb-4">Eleza sababu — trainer ataona na ataweza kuhariri.</p>
        <textarea
          rows={4} className="input"
          placeholder="Mfano: Video hazipo, modules ni mafupi sana..."
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="btn-secondary">Ghairi</button>
          <button
            onClick={onSubmit}
            disabled={!reason.trim()}
            className="btn-primary bg-red-600 hover:bg-red-700 border-red-600 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" /> Kataa &amp; Arifu Trainer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Section wrapper ── */
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="flex items-center justify-center w-7 h-7 rounded-md bg-brand-50 text-brand-600">{icon}</span>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">{title}</h2>
      </div>
      {children}
    </section>
  );
}

/* ── Video material ── */
function VideoMaterial({ material }: { material: LessonMaterial }) {
  const directUrl = material.direct_url ?? null;
  const streamUrl = material.stream_url ? mediaUrl(material.stream_url)! : material.url;
  const videoSrc  = directUrl ?? streamUrl;
  const poster    = mediaUrl(material.thumbnail_url) ?? undefined;
  const isYouTube = material.type === 'video_youtube';
  const isVimeo   = material.type === 'video_vimeo';
  const isMp4     = material.type === 'video_mp4';

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
      <VideoPlayer url={videoSrc} embedUrl={(material.metadata?.embed_url as string) ?? undefined}
        title={material.title} type={material.type} poster={poster} />
      <div className="flex items-center gap-3 px-4 py-3 border-t border-slate-100">
        {isYouTube && (
          <span className="flex items-center gap-1 text-[11px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/></svg>
            YouTube
          </span>
        )}
        {isVimeo && <span className="text-[11px] font-bold bg-navy-100 text-navy-600 px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">Vimeo</span>}
        {isMp4 && <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">MP4</span>}
        <p className="text-sm font-semibold text-slate-900 flex-1 truncate">{material.title}</p>
        {material.duration_seconds && (
          <span className="text-xs text-slate-400 font-medium shrink-0">{formatDur(material.duration_seconds)}</span>
        )}
      </div>
      {material.description && <p className="text-xs text-slate-500 px-4 pb-3">{material.description}</p>}
    </div>
  );
}

/* ── Generic video player ── */
function VideoPlayer({ url, embedUrl, title, type, poster }: {
  url: string; embedUrl?: string; title: string; type?: MaterialType; poster?: string;
}) {
  const [loading, setLoading] = useState(true);
  const embed = embedUrl ?? extractEmbed(url);
  return (
    <div className="relative aspect-video bg-slate-900">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
        </div>
      )}
      {embed ? (
        <iframe src={embed} className="w-full h-full" allowFullScreen title={title}
          onLoad={() => setLoading(false)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
      ) : (
        <video src={url} controls preload="metadata" poster={poster} className="w-full h-full"
          controlsList="nodownload" onLoadedMetadata={() => setLoading(false)} onError={() => setLoading(false)}>
          Kivinjari chako hakitumii {type ?? 'video'}.
        </video>
      )}
    </div>
  );
}

/* ── Document material ── */
function DocMaterial({ material }: { material: LessonMaterial }) {
  const [viewerLoading, setViewerLoading] = useState(true);
  const isPdf    = material.type === 'document_pdf';
  const isOffice = ['document_word', 'document_excel', 'document_powerpoint'].includes(material.type);
  const streamUrl   = material.stream_url ? mediaUrl(material.stream_url) : null;
  const signedUrl   = material.direct_url ?? material.office_viewer_url ?? null;
  const viewUrl     = signedUrl ?? streamUrl ?? material.url;
  const downloadUrl = signedUrl
    ? signedUrl.replace('ResponseContentDisposition=inline', 'ResponseContentDisposition=attachment')
    : (streamUrl ? `${streamUrl}?disposition=attachment` : viewUrl);
  const isExternal  = material.url?.startsWith('http') ?? false;
  const hasViewer   = (isPdf && !!(signedUrl || streamUrl || isExternal)) || (isOffice && !!signedUrl);

  const pdfEmbedUrl = isPdf
    ? (signedUrl ?? streamUrl ?? (isExternal ? `https://docs.google.com/viewer?url=${encodeURIComponent(material.url)}&embedded=true` : null))
    : null;
  const officeViewerUrl = isOffice && signedUrl
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(signedUrl)}`
    : null;
  const { label, bgClass, textClass, borderClass } = docMeta(material.type);

  return (
    <div className={`rounded-2xl border overflow-hidden bg-white shadow-sm ${borderClass}`}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
        <div className={`w-9 h-9 rounded-lg ${bgClass} flex items-center justify-center shrink-0`}>
          <FileText className={`w-5 h-5 ${textClass}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate text-sm">{material.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${bgClass} ${textClass}`}>{label}</span>
            {material.file_size && (
              <span className="text-[11px] text-slate-400">
                {material.file_size > 1048576 ? `${(material.file_size / 1048576).toFixed(1)} MB` : `${Math.round(material.file_size / 1024)} KB`}
              </span>
            )}
            {material.page_count && <span className="text-[11px] text-slate-400">{material.page_count} ukurasa</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <a href={viewUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition">
            <ExternalLink className="w-3.5 h-3.5" /><span className="hidden sm:inline">Fungua</span>
          </a>
          {(signedUrl || streamUrl || isExternal) && (
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition" title="Download">
              <Download className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
      {(pdfEmbedUrl || officeViewerUrl) && (
        <div className="relative" style={{ height: 'clamp(280px, 65vh, 560px)' }}>
          {viewerLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 gap-3">
              <Loader2 className={`w-8 h-8 animate-spin ${textClass}`} />
              <p className="text-sm text-slate-500">Inapakia {label}...</p>
            </div>
          )}
          <iframe src={(pdfEmbedUrl ?? officeViewerUrl)!} className="w-full h-full border-0"
            title={material.title} onLoad={() => setViewerLoading(false)} />
        </div>
      )}
      {!hasViewer && (
        <div className="flex flex-col items-center gap-3 py-8 px-4 text-center bg-slate-50">
          <div className={`w-14 h-14 rounded-2xl ${bgClass} flex items-center justify-center`}>
            <FileText className={`w-7 h-7 ${textClass}`} />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{material.title}</p>
            <p className="text-xs text-slate-500 mt-1">Bonyeza kupakua au kufungua faili</p>
          </div>
          <a href={viewUrl} target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl ${bgClass} ${textClass} hover:opacity-80 transition`}>
            <Download className="w-4 h-4" /> Download {label}
          </a>
        </div>
      )}
    </div>
  );
}

/* ── Interactive material ── */
function InteractiveMaterial({ material }: { material: LessonMaterial }) {
  const isScorm = material.type === 'interactive_scorm';
  if (isScorm) {
    const notReady  = !material.metadata?.scorm_extracted;
    const launchUrl = (material.metadata?.launch_url as string) ?? 'index.html';
    const scormSrc  = `/api/proxy/v1/scorm/${material.uuid}/${launchUrl}`;
    if (notReady) return (
      <div className="card p-6 flex flex-col items-center gap-3 text-center">
        <FileArchive className="w-10 h-10 text-navy-500" />
        <p className="font-semibold text-slate-800">{material.title}</p>
        <p className="text-sm text-slate-500">SCORM package inashughulikiwa...</p>
        <Loader2 className="w-5 h-5 animate-spin text-navy-500 mt-1" />
      </div>
    );
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">{material.title}</p>
          <span className="text-xs bg-navy-100 text-navy-600 font-semibold px-2 py-0.5 rounded-full">SCORM</span>
        </div>
        <div className="rounded-xl overflow-hidden border-2 border-purple-200 shadow-lg bg-white" style={{ height: 620 }}>
          <iframe src={scormSrc} className="w-full h-full" title={material.title} allow="fullscreen" />
        </div>
      </div>
    );
  }
  if (material.type === 'interactive_html5' && material.url.startsWith('http')) {
    return (
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-semibold text-slate-800">{material.title}</p>
          <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">HTML5</span>
        </div>
        <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 shadow">
          <iframe src={material.url} className="w-full h-full" title={material.title} allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals" />
        </div>
      </div>
    );
  }
  const streamUrl = material.stream_url ? mediaUrl(material.stream_url) : null;
  const url = streamUrl ?? material.url;
  return (
    <div className="card p-4 flex items-center gap-3">
      <FileArchive className="w-6 h-6 text-navy-500 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold text-slate-900">{material.title}</p>
        <p className="text-xs text-slate-500">Interactive Content</p>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs gap-1">
        <ExternalLink className="w-3 h-3" /> Launch
      </a>
    </div>
  );
}

/* ── Helpers ── */
function extractEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

function formatDur(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

function docMeta(type: MaterialType) {
  const map: Partial<Record<MaterialType, { label: string; bgClass: string; textClass: string; borderClass: string }>> = {
    document_pdf:        { label: 'PDF',       bgClass: 'bg-red-50',    textClass: 'text-red-600',    borderClass: 'border-red-100' },
    document_word:       { label: 'Word',       bgClass: 'bg-blue-50',   textClass: 'text-blue-600',   borderClass: 'border-blue-100' },
    document_excel:      { label: 'Excel',      bgClass: 'bg-green-50',  textClass: 'text-green-700',  borderClass: 'border-green-100' },
    document_powerpoint: { label: 'PowerPoint', bgClass: 'bg-orange-50', textClass: 'text-orange-600', borderClass: 'border-orange-100' },
  };
  return map[type] ?? { label: 'Document', bgClass: 'bg-slate-50', textClass: 'text-slate-600', borderClass: 'border-slate-200' };
}
