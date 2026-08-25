'use client';

import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2, ChevronLeft, FileText, Loader2, Youtube, Film,
  FileArchive, Package, ExternalLink, Download, ClipboardList, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { courseApi, lessonApi, type LessonMaterial, type MaterialType, type Assignment } from '@/lib/course/api';
import { mediaUrl } from '@/lib/utils';

export default function LessonViewPage() {
  const { uuid, lessonUuid } = useParams<{ uuid: string; lessonUuid: string }>();
  const qc = useQueryClient();

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', uuid],
    queryFn: () => courseApi.get(uuid as string),
  });

  const lesson = (course?.modules ?? [])
    .flatMap((m) => (m.lessons ?? []).map((l) => ({ ...l, moduleTitle: m.title })))
    .find((l) => l.uuid === lessonUuid);

  async function markComplete() {
    try {
      const res = await lessonApi.markComplete(lessonUuid as string);
      toast.success(`Progress: ${res.progress_percentage}%${res.completed ? ' — Course completed! 🎉' : ''}`);
      qc.invalidateQueries({ queryKey: ['student', 'my-enrollments'] });
    } catch { /* toast handled */ }
  }

  if (isLoading || !course) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  if (!lesson) return <div className="p-8"><Link href={`/student/courses/${uuid}`} className="text-brand-600">← Rudi</Link><p className="mt-4">Lesson haipatikani.</p></div>;

  const materials = lesson.materials ?? [];
  const videos = materials.filter((m) => m.category === 'videos');
  const documents = materials.filter((m) => m.category === 'documents');
  const interactive = materials.filter((m) => m.category === 'interactive');

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <Link href={`/student/courses/${uuid}`} className="text-sm text-brand-600 hover:underline flex items-center gap-1 mb-4">
        <ChevronLeft className="w-4 h-4" /> Rudi kwenye course
      </Link>

      <div className="mb-2 text-sm text-slate-500">{course.title} · {lesson.moduleTitle}</div>
      <h1 className="text-3xl font-bold text-slate-900 mb-6">{lesson.title}</h1>

      {lesson.description && <p className="text-slate-700 mb-6">{lesson.description}</p>}

      {/* Legacy: single video_url (before materials system) */}
      {lesson.video_url && !videos.some((v) => v.url === lesson.video_url) && (
        <div className="mb-6">
          <VideoPlayer url={lesson.video_url} title={lesson.title} />
        </div>
      )}

      {/* Materials — grouped by SRS category */}
      {videos.length > 0 && (
        <Section title="Videos">
          {videos.map((m) => <VideoMaterial key={m.uuid} material={m} />)}
        </Section>
      )}

      {documents.length > 0 && (
        <Section title="Documents">
          <div className="grid md:grid-cols-2 gap-3">
            {documents.map((m) => <DocumentMaterial key={m.uuid} material={m} />)}
          </div>
        </Section>
      )}

      {interactive.length > 0 && (
        <Section title="Interactive Content">
          <div className="space-y-3">
            {interactive.map((m) => <InteractiveMaterial key={m.uuid} material={m} />)}
          </div>
        </Section>
      )}

      {/* Legacy: pdf_url */}
      {lesson.pdf_url && !documents.some((d) => d.url === lesson.pdf_url) && (
        <a href={lesson.pdf_url} target="_blank" rel="noopener noreferrer" className="card p-4 flex items-center gap-3 hover:shadow-md transition mb-6">
          <FileText className="w-6 h-6 text-red-600" />
          <div className="flex-1">
            <div className="font-semibold text-slate-900">PDF Notes</div>
            <div className="text-xs text-slate-500 truncate">{lesson.pdf_url}</div>
          </div>
          <Download className="w-4 h-4 text-slate-400" />
        </a>
      )}

      {/* Assignments (SRS Module 9) */}
      {(lesson.assignments ?? []).length > 0 && (
        <Section title="Assignments">
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
                    {a.max_points} pts{a.due_date ? ` · due ${new Date(a.due_date).toLocaleDateString()}` : ''}
                    {a.brief && ` · brief attached`}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* Content notes */}
      {lesson.content && (
        <div className="card p-6 prose max-w-none mb-6">
          <div className="whitespace-pre-wrap">{lesson.content}</div>
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={markComplete} className="btn-primary">
          <CheckCircle2 className="w-4 h-4" /> Nimefanya — Mark Complete
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold text-slate-900 mb-3">{title}</h2>
      {children}
    </section>
  );
}

/* ---------------------- Video materials (SRS: MP4/YouTube/Vimeo) ---------------------- */

function VideoMaterial({ material }: { material: LessonMaterial }) {
  // Prefer the server-side streaming endpoint (with Range Requests) for stored MP4s.
  // Falls back to embedded iframe for YouTube/Vimeo.
  const streamUrl = material.stream_url ? mediaUrl(material.stream_url)! : material.url;
  const poster = mediaUrl(material.thumbnail_url);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-slate-800">{material.title}</div>
        {material.duration_seconds && (
          <div className="text-xs text-slate-500">{formatDuration(material.duration_seconds)}</div>
        )}
      </div>
      <VideoPlayer
        url={streamUrl}
        embedUrl={(material.metadata?.embed_url as string) ?? undefined}
        title={material.title}
        type={material.type}
        poster={poster}
      />
    </div>
  );
}

function VideoPlayer({ url, embedUrl, title, type, poster }: { url: string; embedUrl?: string; title: string; type?: MaterialType; poster?: string }) {
  // YouTube/Vimeo → iframe (their own player, adaptive streaming, CDN)
  const embed = embedUrl ?? extractEmbed(url);
  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      {embed ? (
        <iframe src={embed} className="w-full h-full" allowFullScreen title={title} />
      ) : (
        // MP4 via our streaming endpoint — HTML5 <video> issues Range requests
        // for seeking, so scrubbing works without loading the whole file.
        <video
          src={url}
          controls
          preload="metadata"
          poster={poster}
          className="w-full h-full"
          controlsList="nodownload"
        >
          Your browser doesn&apos;t support {type ?? 'video'}.
        </video>
      )}
    </div>
  );
}

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

function extractEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const v = url.match(/vimeo\.com\/(\d+)/);
  if (v) return `https://player.vimeo.com/video/${v[1]}`;
  return null;
}

/* ---------------------- Document materials (SRS: PDF/Word/Excel/PowerPoint) ---------------------- */

function DocumentMaterial({ material }: { material: LessonMaterial }) {
  const isPdf = material.type === 'document_pdf';

  // stream_url (e.g. /v1/materials/uuid/stream) goes through the Next.js proxy → backend
  // generates a signed S3 URL and redirects — supports ?disposition=inline|attachment
  const streamUrl = material.stream_url ? mediaUrl(material.stream_url) : null;
  const viewUrl = streamUrl ?? (material.url.startsWith('/storage/') ? mediaUrl(material.url)! : material.url);
  const downloadUrl = streamUrl ? `${streamUrl}?disposition=attachment` : viewUrl;

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3 mb-3">
        <FileText className={`w-6 h-6 shrink-0 ${docColor(material.type)}`} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900 truncate">{material.title}</div>
          <div className="text-xs text-slate-500 uppercase">{material.type.replace('document_', '')}</div>
          {material.file_size && (
            <div className="text-xs text-slate-400">{(material.file_size / 1024 / 1024).toFixed(1)} MB</div>
          )}
        </div>
      </div>
      {isPdf && streamUrl && (
        <div className="rounded overflow-hidden border border-slate-200 mb-3" style={{ height: 520 }}>
          <iframe src={streamUrl} className="w-full h-full" title={material.title} />
        </div>
      )}
      <div className="flex gap-2">
        <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm flex-1 justify-center">
          <ExternalLink className="w-3 h-3" /> Open
        </a>
        <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm justify-center" title="Download">
          <Download className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
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

/* ---------------------- Interactive materials (SRS: SCORM, HTML5) ---------------------- */

function InteractiveMaterial({ material }: { material: LessonMaterial }) {
  const isStorage = material.url.startsWith('/storage/');
  const fullUrl = isStorage ? mediaUrl(material.url)! : material.url;

  if (material.type === 'interactive_html5' && !isStorage) {
    return (
      <div>
        <div className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
          <Package className="w-4 h-4 text-purple-600" /> {material.title}
        </div>
        <div className="aspect-video rounded-lg overflow-hidden border border-slate-200">
          <iframe src={fullUrl} className="w-full h-full" title={material.title} allowFullScreen />
        </div>
      </div>
    );
  }

  // SCORM zip or HTML5 zip → launch button (playback needs SCORM player, out of scope for MVP)
  return (
    <div className="card p-4 flex items-center gap-3">
      <FileArchive className="w-6 h-6 text-purple-600 shrink-0" />
      <div className="flex-1">
        <div className="font-semibold text-slate-900">{material.title}</div>
        <div className="text-xs text-slate-500">
          {material.type === 'interactive_scorm' ? 'SCORM Package' : 'HTML5 Package'}
          {material.file_size && ` · ${(material.file_size/1024/1024).toFixed(1)} MB`}
        </div>
      </div>
      <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">
        <ExternalLink className="w-3 h-3" /> Launch
      </a>
    </div>
  );
}
