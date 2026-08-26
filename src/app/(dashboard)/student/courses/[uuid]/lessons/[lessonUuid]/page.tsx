'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  CheckCircle2, Circle, ChevronLeft, ChevronRight, Menu, X,
  FileText, ExternalLink, Download, ClipboardList, ArrowRight,
  Loader2, BookOpen, Play, FileArchive,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  courseApi, lessonApi,
  type LessonMaterial, type MaterialType, type Assignment, type Module, type Lesson,
} from '@/lib/course/api';
import { mediaUrl } from '@/lib/utils';

type LessonWithMeta = Lesson & { moduleTitle: string; modIndex: number; lesIndex: number };

export default function LessonViewPage() {
  const { uuid, lessonUuid } = useParams<{ uuid: string; lessonUuid: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completedSet, setCompletedSet] = useState<Set<string> | null>(null);
  const [markingComplete, setMarkingComplete] = useState(false);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', uuid],
    queryFn: () => courseApi.get(uuid as string),
  });

  // Initialise completion state from server data (runs once)
  useEffect(() => {
    if (!course || completedSet !== null) return;
    const initial = new Set<string>();
    for (const mod of course.modules ?? []) {
      for (const l of mod.lessons ?? []) {
        if (l.is_completed) initial.add(l.uuid);
      }
    }
    setCompletedSet(initial);
  }, [course, completedSet]);

  // Flat ordered list for prev / next navigation
  const allLessons = useMemo<LessonWithMeta[]>(() => {
    return (course?.modules ?? []).flatMap((m, mi) =>
      (m.lessons ?? []).map((l, li) => ({
        ...l,
        moduleTitle: m.title,
        modIndex: mi,
        lesIndex: li,
      }))
    );
  }, [course]);

  const currentIdx = allLessons.findIndex((l) => l.uuid === lessonUuid);
  const lesson      = currentIdx >= 0 ? allLessons[currentIdx] : null;
  const prevLesson  = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson  = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;
  const isDone      = completedSet?.has(lessonUuid as string) ?? false;

  const completedCount = completedSet?.size ?? 0;
  const totalLessons   = allLessons.length;
  const progressPct    = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  async function handleMarkComplete() {
    if (isDone || markingComplete) return;
    setMarkingComplete(true);
    try {
      const res = await lessonApi.markComplete(lessonUuid as string);
      setCompletedSet((prev) => new Set([...(prev ?? []), lessonUuid as string]));
      qc.invalidateQueries({ queryKey: ['student', 'my-enrollments'] });
      if (res.completed) {
        toast.success('🎉 Hongera! Umefanikiwa kumaliza course nzima!');
        setTimeout(() => router.push(`/student/courses/${uuid}`), 1800);
      } else {
        toast.success(`Progress: ${Number(res.progress_percentage).toFixed(0)}%`);
        if (nextLesson) {
          setTimeout(() => router.push(`/student/courses/${uuid}/lessons/${nextLesson.uuid}`), 700);
        }
      }
    } catch {
      toast.error('Imeshindwa. Jaribu tena.');
    } finally {
      setMarkingComplete(false);
    }
  }

  if (isLoading || !course) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="p-8">
        <Link href={`/student/courses/${uuid}`} className="text-brand-600 hover:underline">← Rudi</Link>
        <p className="mt-4 text-slate-500">Lesson haipatikani.</p>
      </div>
    );
  }

  const materials    = lesson.materials ?? [];
  const videos       = materials.filter((m) => m.category === 'videos');
  const docs         = materials.filter((m) => m.category === 'documents');
  const interactive  = materials.filter((m) => m.category === 'interactive');

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50">

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Left sidebar ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200
        flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        {/* Sidebar header */}
        <div className="flex items-center gap-2 p-4 border-b border-slate-200 bg-slate-50">
          <BookOpen className="w-4 h-4 text-brand-600 shrink-0" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex-1 truncate">
            Muundo wa Course
          </span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded hover:bg-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Module / lesson tree */}
        <div className="flex-1 overflow-y-auto">
          {(course.modules ?? []).map((mod, mi) => (
            <ModuleBlock
              key={mod.uuid}
              mod={mod}
              mi={mi}
              courseUuid={uuid as string}
              activeLessonUuid={lessonUuid as string}
              completedSet={completedSet ?? new Set()}
              onSelect={() => setSidebarOpen(false)}
            />
          ))}
        </div>

        {/* Sidebar footer — overall progress */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{completedCount} / {totalLessons} lessons</span>
            <span className="font-bold text-slate-700">{progressPct}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </aside>

      {/* ── Main lesson content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded hover:bg-slate-100"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <Link
            href={`/student/courses/${uuid}`}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 min-w-0"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
            <span className="truncate">{course.title}</span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-20 bg-slate-200 rounded-full h-1.5">
                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="text-xs font-semibold text-slate-600">{progressPct}%</span>
            </div>
          </div>
        </div>

        {/* Scrollable lesson body */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-6">

            {/* Lesson header */}
            <div className="mb-6">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">
                Module {lesson.modIndex + 1} · {lesson.moduleTitle}
              </p>
              <h1 className="text-2xl font-bold text-slate-900">
                {lesson.modIndex + 1}.{lesson.lesIndex + 1} — {lesson.title}
              </h1>
              {lesson.description && (
                <p className="mt-2 text-slate-600 leading-relaxed">{lesson.description}</p>
              )}
            </div>

            {/* Videos */}
            {videos.length > 0 && (
              <ContentSection title="🎬 Videos">
                <div className="space-y-4">
                  {videos.map((m) => <VideoMaterial key={m.uuid} material={m} />)}
                </div>
              </ContentSection>
            )}

            {/* Legacy video_url */}
            {lesson.video_url && !videos.some((v) => v.url === lesson.video_url) && (
              <ContentSection title="🎬 Video">
                <VideoPlayer url={lesson.video_url} title={lesson.title} />
              </ContentSection>
            )}

            {/* Lesson notes (content field) */}
            {lesson.content && (
              <ContentSection title="📖 Maelezo ya Somo (Notes)">
                <div
                  className="prose prose-sm max-w-none text-slate-700 leading-relaxed
                    prose-headings:text-slate-900 prose-headings:font-bold
                    prose-h3:text-base prose-h3:mt-4 prose-h3:mb-1
                    prose-p:mb-3 prose-ul:my-2 prose-ol:my-2
                    prose-li:my-0.5 prose-strong:text-slate-900"
                  dangerouslySetInnerHTML={{ __html: lesson.content }}
                />
              </ContentSection>
            )}

            {/* Documents */}
            {docs.length > 0 && (
              <ContentSection title="📄 Nyaraka (Documents)">
                <div className="grid sm:grid-cols-2 gap-3">
                  {docs.map((m) => <DocMaterial key={m.uuid} material={m} />)}
                </div>
              </ContentSection>
            )}

            {/* Legacy pdf_url */}
            {lesson.pdf_url && !docs.some((d) => d.url === lesson.pdf_url) && (
              <a
                href={lesson.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 card hover:shadow-md transition mb-6"
              >
                <FileText className="w-6 h-6 text-red-600 shrink-0" />
                <div className="flex-1 font-semibold text-slate-900">PDF Notes</div>
                <Download className="w-4 h-4 text-slate-400" />
              </a>
            )}

            {/* Interactive */}
            {interactive.length > 0 && (
              <ContentSection title="⚡ Interactive">
                <div className="space-y-3">
                  {interactive.map((m) => (
                    <InteractiveMaterial
                      key={m.uuid}
                      material={m}
                      onComplete={!isDone ? handleMarkComplete : undefined}
                    />
                  ))}
                </div>
              </ContentSection>
            )}

            {/* Assignments */}
            {(lesson.assignments ?? []).length > 0 && (
              <ContentSection title="📝 Kazi za Nyumbani (Assignments)">
                <div className="space-y-2">
                  {(lesson.assignments as Assignment[]).map((a) => (
                    <Link
                      key={a.uuid}
                      href={`/student/assignments/${a.uuid}`}
                      className="card p-4 flex items-center gap-3 hover:shadow-md hover:border-amber-300 transition"
                    >
                      <ClipboardList className="w-6 h-6 text-amber-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900">{a.title}</div>
                        <div className="text-xs text-slate-500">
                          {a.max_points} pts
                          {a.due_date ? ` · Deadline: ${new Date(a.due_date).toLocaleDateString('sw-TZ')}` : ''}
                        </div>
                      </div>
                      <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                        Fanya →
                      </span>
                    </Link>
                  ))}
                </div>
              </ContentSection>
            )}

            {/* ── Prev / Mark Complete / Next ── */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex items-stretch gap-3">
                {/* Previous */}
                {prevLesson ? (
                  <Link
                    href={`/student/courses/${uuid}/lessons/${prevLesson.uuid}`}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Iliyopita</span>
                  </Link>
                ) : (
                  <div className="w-10" />
                )}

                {/* Mark complete — centre */}
                <button
                  onClick={handleMarkComplete}
                  disabled={isDone || markingComplete}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition
                    ${isDone
                      ? 'bg-green-50 text-green-700 border border-green-200 cursor-default'
                      : 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm'
                    }`}
                >
                  {markingComplete
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <CheckCircle2 className="w-4 h-4" />
                  }
                  {isDone ? 'Imekamilika ✓' : 'Nimefanya — Mark Complete'}
                </button>

                {/* Next */}
                {nextLesson ? (
                  <Link
                    href={`/student/courses/${uuid}/lessons/${nextLesson.uuid}`}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-navy-700 text-white text-sm font-semibold hover:bg-navy-800 transition shadow-sm"
                  >
                    <span className="hidden sm:inline">Inayofuata</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    href={`/student/courses/${uuid}`}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-navy-700 text-white text-sm font-semibold hover:bg-navy-800 transition shadow-sm"
                  >
                    <span className="hidden sm:inline">Rudi</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

              {/* Next lesson preview */}
              {nextLesson && (
                <p className="text-center text-xs text-slate-400 mt-3">
                  Inayofuata: <span className="font-medium text-slate-600">{nextLesson.title}</span>
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ── Sidebar module block ── */
function ModuleBlock({
  mod, mi, courseUuid, activeLessonUuid, completedSet, onSelect,
}: {
  mod: Module; mi: number; courseUuid: string;
  activeLessonUuid: string; completedSet: Set<string>; onSelect: () => void;
}) {
  const total     = mod.lessons?.length ?? 0;
  const done      = (mod.lessons ?? []).filter((l) => completedSet.has(l.uuid)).length;
  const allDone   = total > 0 && done === total;
  const hasActive = (mod.lessons ?? []).some((l) => l.uuid === activeLessonUuid);
  const [open, setOpen] = useState(hasActive || mi === 0);

  return (
    <div className="border-b border-slate-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-start gap-2"
      >
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Module {mi + 1}
          </div>
          <div className="text-sm font-semibold text-slate-800 leading-tight">{mod.title}</div>
          <div className={`text-xs mt-0.5 ${allDone ? 'text-green-600' : 'text-slate-400'}`}>
            {allDone ? '✓ Imekamilika' : `${done}/${total} lessons`}
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-400 mt-1 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="pb-1">
          {(mod.lessons ?? []).map((l, li) => {
            const isActive   = l.uuid === activeLessonUuid;
            const isComplete = completedSet.has(l.uuid);
            return (
              <Link
                key={l.uuid}
                href={`/student/courses/${courseUuid}/lessons/${l.uuid}`}
                onClick={onSelect}
                className={`flex items-start gap-2.5 pl-4 pr-3 py-2.5 text-sm transition
                  ${isActive
                    ? 'bg-brand-50 border-r-[3px] border-brand-600'
                    : 'hover:bg-slate-50'
                  }`}
              >
                {isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <Circle className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-brand-500' : 'text-slate-300'}`} />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`leading-snug text-[13px] ${
                    isActive ? 'text-brand-700 font-semibold' :
                    isComplete ? 'text-slate-400' : 'text-slate-700'
                  }`}>
                    {mi + 1}.{li + 1} · {l.title}
                  </p>
                  {l.duration_seconds && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {Math.floor(l.duration_seconds / 60)}m {l.duration_seconds % 60}s
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Section wrapper ── */
function ContentSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </section>
  );
}

/* ── Video material ── */
function VideoMaterial({ material }: { material: LessonMaterial }) {
  const streamUrl = material.stream_url ? mediaUrl(material.stream_url)! : material.url;
  const poster    = mediaUrl(material.thumbnail_url) ?? undefined;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-semibold text-slate-800">{material.title}</p>
        {material.duration_seconds && (
          <span className="text-xs text-slate-400">{formatDur(material.duration_seconds)}</span>
        )}
      </div>
      <VideoPlayer
        url={streamUrl}
        embedUrl={(material.metadata?.embed_url as string) ?? undefined}
        title={material.title}
        type={material.type}
        poster={poster}
      />
      {material.description && (
        <p className="text-xs text-slate-500 mt-1.5">{material.description}</p>
      )}
    </div>
  );
}

function VideoPlayer({
  url, embedUrl, title, type, poster,
}: {
  url: string; embedUrl?: string; title: string; type?: MaterialType; poster?: string;
}) {
  const embed = embedUrl ?? extractEmbed(url);
  return (
    <div className="aspect-video bg-black rounded-xl overflow-hidden shadow">
      {embed ? (
        <iframe src={embed} className="w-full h-full" allowFullScreen title={title} />
      ) : (
        <video
          src={url}
          controls
          preload="metadata"
          poster={poster}
          className="w-full h-full"
          controlsList="nodownload"
        >
          Kivinjari chako hakitumii {type ?? 'video'}.
        </video>
      )}
    </div>
  );
}

/* ── Document material ── */
function DocMaterial({ material }: { material: LessonMaterial }) {
  const isPdf      = material.type === 'document_pdf';
  const isOffice   = ['document_word', 'document_excel', 'document_powerpoint'].includes(material.type);
  const streamUrl  = material.stream_url ? mediaUrl(material.stream_url) : null;
  const viewUrl    = streamUrl ?? material.url;
  const downloadUrl = streamUrl ? `${streamUrl}?disposition=attachment` : viewUrl;
  const isExternal = material.url.startsWith('http');

  // PDF: stream URL (private S3) or Google Docs viewer for public external URLs
  const pdfEmbedUrl = streamUrl
    ? streamUrl
    : (isPdf && isExternal
        ? `https://docs.google.com/viewer?url=${encodeURIComponent(material.url)}&embedded=true`
        : null);

  // Office (Word/Excel/PPT): Microsoft Office Online viewer via pre-signed S3 URL
  const officeViewerUrl = isOffice && material.office_viewer_url
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(material.office_viewer_url)}`
    : null;

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <FileText className={`w-6 h-6 shrink-0 mt-0.5 ${docColor(material.type)}`} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate">{material.title}</p>
          <p className="text-xs text-slate-400 uppercase mt-0.5">
            {material.type.replace('document_', '')}
            {material.file_size ? ` · ${(material.file_size / 1024 / 1024).toFixed(1)} MB` : ''}
          </p>
        </div>
      </div>

      {/* PDF inline viewer */}
      {isPdf && pdfEmbedUrl && (
        <div className="rounded-lg overflow-hidden border border-slate-200" style={{ height: 500 }}>
          <iframe src={pdfEmbedUrl} className="w-full h-full" title={material.title} />
        </div>
      )}

      {/* Word / Excel / PowerPoint viewer via Microsoft Office Online */}
      {officeViewerUrl && (
        <div className="rounded-lg overflow-hidden border border-slate-200" style={{ height: 500 }}>
          <iframe
            src={officeViewerUrl}
            className="w-full h-full"
            title={material.title}
            frameBorder={0}
          />
        </div>
      )}

      <div className="flex gap-2">
        <a
          href={viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-xs flex-1 justify-center gap-1"
        >
          <ExternalLink className="w-3 h-3" />
          {isPdf || officeViewerUrl ? 'Fungua Tab Mpya' : 'Fungua / Download'}
        </a>
        {(streamUrl || isExternal) && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs px-3 justify-center"
            title="Download"
          >
            <Download className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

/* ── Interactive material (SCORM 1.2 + HTML5) ── */
function InteractiveMaterial({ material, onComplete }: { material: LessonMaterial; onComplete?: () => void }) {
  const isScorm = material.type === 'interactive_scorm';

  // Inject SCORM 1.2 window.API — same-origin iframe reads it via window.parent.API
  useEffect(() => {
    if (!isScorm) return;
    let fired = false;
    const markDone = () => { if (!fired) { fired = true; onComplete?.(); } };

    (window as any).API = {
      LMSInitialize:   (_: string) => 'true',
      LMSGetValue:     (el: string) => {
        if (el === 'cmi.core.lesson_status') return 'not attempted';
        if (el === 'cmi.core.student_id')    return 'student';
        if (el === 'cmi.core.student_name')  return 'Student';
        return '';
      },
      LMSSetValue:     (el: string, val: string) => {
        if (el === 'cmi.core.lesson_status' && ['completed', 'passed'].includes(val)) markDone();
        return 'true';
      },
      LMSCommit:       (_: string) => 'true',
      LMSFinish:       (_: string) => { markDone(); return 'true'; },
      LMSGetLastError: () => '0',
      LMSGetErrorString: (_: string) => 'No error',
      LMSGetDiagnostic:  (_: string) => 'No diagnostic info',
    };
    return () => { delete (window as any).API; };
  }, [isScorm, onComplete]);

  // ── SCORM player ──
  if (isScorm) {
    const notReady  = !material.metadata?.scorm_extracted;
    const launchUrl = (material.metadata?.launch_url as string) ?? 'index.html';
    const scormSrc  = `/api/proxy/v1/scorm/${material.uuid}/${launchUrl}`;

    if (notReady) {
      return (
        <div className="card p-6 flex flex-col items-center gap-3 text-center">
          <FileArchive className="w-10 h-10 text-purple-400" />
          <p className="font-semibold text-slate-800">{material.title}</p>
          <p className="text-sm text-slate-500">SCORM package inashughulikiwa... Subiri dakika chache kisha refresh.</p>
          <Loader2 className="w-5 h-5 animate-spin text-purple-500 mt-1" />
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">{material.title}</p>
          <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">SCORM</span>
        </div>
        <div className="rounded-xl overflow-hidden border-2 border-purple-200 shadow-lg bg-white" style={{ height: 620 }}>
          <iframe src={scormSrc} className="w-full h-full" title={material.title} allow="fullscreen" />
        </div>
      </div>
    );
  }

  // ── HTML5 external URL — sandboxed iframe ──
  if (material.type === 'interactive_html5' && material.url.startsWith('http')) {
    return (
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-semibold text-slate-800">{material.title}</p>
          <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">HTML5</span>
        </div>
        <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 shadow">
          <iframe
            src={material.url}
            className="w-full h-full"
            title={material.title}
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        </div>
        {material.description && (
          <p className="text-xs text-slate-500 mt-1.5">{material.description}</p>
        )}
      </div>
    );
  }

  // ── Fallback: download card ──
  const streamUrl = material.stream_url ? mediaUrl(material.stream_url) : null;
  const url       = streamUrl ?? material.url;
  return (
    <div className="card p-4 flex items-center gap-3">
      <FileArchive className="w-6 h-6 text-purple-600 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold text-slate-900">{material.title}</p>
        <p className="text-xs text-slate-500">
          {material.type === 'interactive_scorm' ? 'SCORM Package' : 'Interactive Content'}
          {material.file_size ? ` · ${(material.file_size / 1024 / 1024).toFixed(1)} MB` : ''}
        </p>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs gap-1">
        <ExternalLink className="w-3 h-3" /> Launch
      </a>
    </div>
  );
}

/* ── Helpers ── */
function formatDur(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

function extractEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

function docColor(type: MaterialType): string {
  const map: Partial<Record<MaterialType, string>> = {
    document_pdf: 'text-red-600',
    document_word: 'text-blue-700',
    document_excel: 'text-green-700',
    document_powerpoint: 'text-orange-600',
  };
  return map[type] ?? 'text-slate-600';
}
