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
  ChevronRight, Users, Clock, LayoutGrid, Award,
} from 'lucide-react';
import { courseApi, adminCoursesApi, CATEGORY_LABEL, type LessonMaterial, type MaterialType } from '@/lib/course/api';
import { mediaUrl } from '@/lib/utils';
import { useNotifications } from '@/lib/notifications/hook';

export default function AdminCourseReviewPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { markReadForRoute } = useNotifications();

  const [activeLessonUuid, setActiveLessonUuid] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');

  // Mark this route's notifications as read on mount
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
      router.push('/admin/course-approvals');
    } catch { /* toast handled by api client */ }
  }

  async function submitReject() {
    if (!reason.trim()) return;
    try {
      await adminCoursesApi.reject(uuid as string, reason);
      toast.success('Course imekataliwa — trainer amearifu');
      qc.invalidateQueries({ queryKey: ['admin', 'course-approvals'] });
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

  const allLessons = (course.modules ?? []).flatMap((m, mi) =>
    (m.lessons ?? []).map((l, li) => ({ ...l, moduleTitle: m.title, modIdx: mi, lesIdx: li }))
  );
  const activeLesson = allLessons.find((l) => l.uuid === activeLessonUuid) ?? allLessons[0] ?? null;

  const materials = activeLesson?.materials ?? [];
  const videos = materials.filter((m) => m.category === 'videos');
  const docs = materials.filter((m) => m.category === 'documents');

  const LEVEL: Record<string, string> = {
    beginner: 'Beginner', intermediate: 'Intermediate',
    advanced: 'Advanced', expert: 'Expert',
  };

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden bg-slate-50">

      {/* ── Left sidebar: course outline ── */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-100 bg-slate-50">
          <Link
            href="/admin/course-approvals"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Orodha ya Approvals
          </Link>
          <h2 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2">{course.title}</h2>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full uppercase">
              {CATEGORY_LABEL[course.category as keyof typeof CATEGORY_LABEL] ?? course.category}
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
              {LEVEL[course.level] ?? course.level}
            </span>
          </div>
          <div className="flex gap-3 mt-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><LayoutGrid className="w-3 h-3" />{course.stats?.modules ?? 0} modules</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.instructor?.name ?? course.instructor?.email ?? '—'}</span>
          </div>
        </div>

        {/* Module / lesson tree */}
        <nav className="flex-1 overflow-y-auto">
          {(course.modules ?? []).map((mod, mi) => (
            <div key={mod.uuid} className="border-b border-slate-100">
              <div className="px-4 py-2.5 bg-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Module {mi + 1}</p>
                <p className="text-sm font-semibold text-slate-800 leading-tight">{mod.title}</p>
              </div>
              {(mod.lessons ?? []).map((l, li) => {
                const isActive = (activeLessonUuid ?? allLessons[0]?.uuid) === l.uuid;
                return (
                  <button
                    key={l.uuid}
                    onClick={() => setActiveLessonUuid(l.uuid)}
                    className={`w-full text-left flex items-center gap-2 pl-5 pr-3 py-2.5 text-sm transition
                      ${isActive
                        ? 'bg-brand-50 border-r-[3px] border-brand-600 text-brand-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <BookOpen className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-brand-500' : 'text-slate-300'}`} />
                    <span className="text-[13px] leading-snug">{mi + 1}.{li + 1} · {l.title}</span>
                    {(l.materials?.length ?? 0) > 0 && (
                      <ChevronRight className="w-3 h-3 ml-auto text-slate-300 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Approve / Reject actions at bottom */}
        <div className="p-3 border-t border-slate-200 space-y-2">
          <button onClick={approve} className="w-full btn-primary text-sm justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Approve &amp; Publish
          </button>
          <button
            onClick={() => { setRejectOpen(true); setReason(''); }}
            className="w-full btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50 justify-center gap-2"
          >
            <XCircle className="w-4 h-4" /> Kataa Course
          </button>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex-1 overflow-y-auto">
        {activeLesson ? (
          <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Lesson header */}
            <div className="mb-5">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">
                Module {activeLesson.modIdx + 1} · {activeLesson.moduleTitle}
              </p>
              <h1 className="text-2xl font-bold text-slate-900">
                {activeLesson.modIdx + 1}.{activeLesson.lesIdx + 1} — {activeLesson.title}
              </h1>
              {activeLesson.description && (
                <p className="mt-2 text-slate-600">{activeLesson.description}</p>
              )}
            </div>

            {/* Videos */}
            {videos.length > 0 && (
              <Section icon={<Play className="w-4 h-4" />} title="Video">
                <div className="space-y-4">
                  {videos.map((m) => <VideoCard key={m.uuid} material={m} />)}
                </div>
              </Section>
            )}

            {/* Legacy video_url */}
            {activeLesson.video_url && !videos.some((v) => v.url === activeLesson.video_url) && (
              <Section icon={<Play className="w-4 h-4" />} title="Video">
                <LegacyVideoPlayer url={activeLesson.video_url} title={activeLesson.title} />
              </Section>
            )}

            {/* Lesson notes */}
            {activeLesson.content && (
              <Section icon={<BookOpen className="w-4 h-4" />} title="Maelezo ya Somo">
                <div
                  className="prose prose-sm max-w-none text-slate-700 leading-relaxed
                    prose-headings:text-slate-900 prose-h2:text-lg prose-h3:text-base
                    prose-p:mb-3 prose-ul:my-2 prose-li:my-0.5 prose-strong:text-slate-900"
                  dangerouslySetInnerHTML={{ __html: activeLesson.content }}
                />
              </Section>
            )}

            {/* Documents */}
            {docs.length > 0 && (
              <Section icon={<FileText className="w-4 h-4" />} title="Nyaraka">
                <div className="space-y-3">
                  {docs.map((m) => <DocCard key={m.uuid} material={m} />)}
                </div>
              </Section>
            )}

            {/* Legacy pdf_url */}
            {activeLesson.pdf_url && !docs.some((d) => d.url === activeLesson.pdf_url) && (
              <a
                href={activeLesson.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 card hover:shadow-md transition mb-6"
              >
                <FileText className="w-6 h-6 text-red-600 shrink-0" />
                <div className="flex-1 font-semibold text-slate-900">PDF Notes</div>
                <Download className="w-4 h-4 text-slate-400" />
              </a>
            )}

            {/* Empty lesson */}
            {videos.length === 0 && !activeLesson.video_url && docs.length === 0 && !activeLesson.pdf_url && !activeLesson.content && (
              <div className="card p-10 text-center text-slate-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Somo hili halina maudhui bado.</p>
              </div>
            )}
          </div>
        ) : (
          /* No lessons at all */
          <div className="max-w-3xl mx-auto px-4 py-10">
            {/* Course overview */}
            <div className="card overflow-hidden mb-6">
              {course.thumbnail_url && (
                <div className="aspect-video relative">
                  <Image src={mediaUrl(course.thumbnail_url)!} alt="" fill className="object-cover" />
                </div>
              )}
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-2">{course.title}</h2>
                {course.description && <p className="text-slate-600 text-sm leading-relaxed">{course.description}</p>}
                <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5"><LayoutGrid className="w-4 h-4" />{course.stats?.modules ?? 0} modules</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{course.duration_hours ? `${course.duration_hours}h` : '—'}</span>
                  <span className="flex items-center gap-1.5"><Award className="w-4 h-4" />{LEVEL[course.level] ?? course.level}</span>
                </div>
              </div>
            </div>
            <p className="text-slate-400 text-sm text-center">Course haina lessons bado. Bonyeza module upande wa kushoto kuanza.</p>
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectOpen && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={() => setRejectOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" /> Kataa Course
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Eleza sababu — trainer ataona na ataweza kuhariri.
            </p>
            <textarea
              rows={4}
              className="input"
              placeholder="Mfano: Video hazipo, modules ni mafupi sana..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setRejectOpen(false)} className="btn-secondary">Ghairi</button>
              <button
                onClick={submitReject}
                disabled={!reason.trim()}
                className="btn-primary bg-red-600 hover:bg-red-700 border-red-600 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Kataa &amp; Arifu Trainer
              </button>
            </div>
          </div>
        </div>
      )}
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

/* ── Video card ── */
function VideoCard({ material }: { material: LessonMaterial }) {
  const [loading, setLoading] = useState(true);
  const streamUrl = material.stream_url ? mediaUrl(material.stream_url)! : material.url;
  const embed = material.metadata?.embed_url as string | undefined ?? extractEmbed(streamUrl);

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-video bg-slate-900">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
          </div>
        )}
        {embed ? (
          <iframe
            src={embed}
            className="w-full h-full"
            allowFullScreen
            title={material.title}
            onLoad={() => setLoading(false)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <video
            src={streamUrl}
            controls
            preload="metadata"
            className="w-full h-full"
            controlsList="nodownload"
            onLoadedMetadata={() => setLoading(false)}
          />
        )}
      </div>
      <div className="flex items-center gap-3 px-4 py-3 border-t border-slate-100">
        <p className="text-sm font-semibold text-slate-900 flex-1 truncate">{material.title}</p>
        {material.duration_seconds && (
          <span className="text-xs text-slate-400">{formatDur(material.duration_seconds)}</span>
        )}
      </div>
    </div>
  );
}

/* ── Legacy video player (video_url field) ── */
function LegacyVideoPlayer({ url, title }: { url: string; title: string }) {
  const [loading, setLoading] = useState(true);
  const embed = extractEmbed(url);
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-video bg-slate-900">
        {loading && <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10"><Loader2 className="w-8 h-8 animate-spin text-slate-600" /></div>}
        {embed
          ? <iframe src={embed} className="w-full h-full" allowFullScreen title={title} onLoad={() => setLoading(false)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          : <video src={url} controls preload="metadata" className="w-full h-full" onLoadedMetadata={() => setLoading(false)} />
        }
      </div>
    </div>
  );
}

/* ── Document card ── */
function DocCard({ material }: { material: LessonMaterial }) {
  const [viewerLoading, setViewerLoading] = useState(true);
  const isPdf = material.type === 'document_pdf';
  const isOffice = ['document_word', 'document_excel', 'document_powerpoint'].includes(material.type);
  const streamUrl = material.stream_url ? mediaUrl(material.stream_url) : null;
  const viewUrl = streamUrl ?? material.url;
  const isExternal = material.url.startsWith('http');

  const pdfSrc = streamUrl ?? (isPdf && isExternal ? `https://docs.google.com/viewer?url=${encodeURIComponent(material.url)}&embedded=true` : null);
  const officeSrc = isOffice && material.office_viewer_url
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(material.office_viewer_url)}`
    : null;

  const { label, bg, text } = docMeta(material.type);

  return (
    <div className={`rounded-2xl border overflow-hidden bg-white shadow-sm border-${text.replace('text-', '')}-100`}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
        <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
          <FileText className={`w-5 h-5 ${text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate text-sm">{material.title}</p>
          <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${bg} ${text}`}>{label}</span>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <a href={viewUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition">
            <ExternalLink className="w-3.5 h-3.5" /> Fungua
          </a>
        </div>
      </div>
      {(pdfSrc || officeSrc) && (
        <div className="relative" style={{ height: 480 }}>
          {viewerLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
              <Loader2 className={`w-8 h-8 animate-spin ${text}`} />
            </div>
          )}
          <iframe
            src={(pdfSrc ?? officeSrc)!}
            className="w-full h-full border-0"
            title={material.title}
            onLoad={() => setViewerLoading(false)}
          />
        </div>
      )}
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
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

function docMeta(type: MaterialType) {
  const map: Partial<Record<MaterialType, { label: string; bg: string; text: string }>> = {
    document_pdf:        { label: 'PDF',        bg: 'bg-red-50',    text: 'text-red-600' },
    document_word:       { label: 'Word',        bg: 'bg-blue-50',   text: 'text-blue-600' },
    document_excel:      { label: 'Excel',       bg: 'bg-green-50',  text: 'text-green-700' },
    document_powerpoint: { label: 'PowerPoint',  bg: 'bg-orange-50', text: 'text-orange-600' },
  };
  return map[type] ?? { label: 'Doc', bg: 'bg-slate-50', text: 'text-slate-600' };
}
