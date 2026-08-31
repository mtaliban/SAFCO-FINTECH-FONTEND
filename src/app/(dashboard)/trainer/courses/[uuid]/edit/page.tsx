'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import {
  Loader2, Plus, CheckCircle2, Trash2, Upload, FileText,
  PlayCircle, Zap, ChevronUp, ChevronDown, ClipboardList,
  Package, FileArchive, Youtube, Film, ArrowLeft,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { mediaUrl } from '@/lib/utils';
import {
  courseApi, moduleApi, lessonApi, assignmentApi, instructorApi, materialApi,
  CATEGORY_LABEL, MATERIAL_TYPE_LABEL,
  ASSIGNMENT_ALLOWED_EXT, ASSIGNMENT_ACCEPT_ATTR, ASSIGNMENT_MAX_MB,
  type CourseModule, type Lesson, type LessonMaterial, type MaterialType, type Assignment,
} from '@/lib/course/api';
import { useMaterialStatus } from '@/lib/course/useMaterialStatus';

export default function EditCoursePage() {
  const { uuid } = useParams<{ uuid: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', uuid],
    queryFn: () => courseApi.get(uuid as string),
  });
  const { data: instructors } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => instructorApi.list(),
  });
  const { data: myQuizzes } = useQuery({
    queryKey: ['trainer', 'my-quizzes-for-attach'],
    queryFn: () => api.get('/trainer/my-quizzes').then((r) => r.data.data.data ?? r.data.data ?? []),
  });

  const [editingDetails, setEditingDetails] = useState(false);
  const [detailForm, setDetailForm] = useState({ title: '', description: '', level: '', duration_hours: '' });
  const [showAddModule, setShowAddModule] = useState(false);
  const [addLessonForModule, setAddLessonForModule] = useState<string | null>(null);
  const [attachQuizForModule, setAttachQuizForModule] = useState<string | null>(null);
  const [addAssignmentForLesson, setAddAssignmentForLesson] = useState<string | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ['course', uuid] });

  async function submitForApproval() {
    if (!confirm('Tuma course kwa admin ya-approve? Baada ya kutuma huwezi kubadilisha.')) return;
    try {
      await courseApi.submit(uuid as string);
      toast.success('Imetumwa kwa admin. Subiri approval.');
      refresh();
    } catch { /* toast handled */ }
  }

  async function handleThumbnail(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show local preview immediately while uploading
    const preview = URL.createObjectURL(file);
    setThumbnailPreview(preview);
    setThumbnailUploading(true);
    try {
      await courseApi.uploadThumbnail(uuid as string, file);
      toast.success('Thumbnail imepakiwa ✓');
      refresh();
    } catch {
      setThumbnailPreview(null);
    } finally {
      setThumbnailUploading(false);
      URL.revokeObjectURL(preview);
    }
  }

  async function updateInstructor(instructorUuid: string) {
    try {
      await courseApi.update(uuid as string, { /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ instructor_uuid: instructorUuid } as any);
      toast.success('Instructor imebadilishwa');
      refresh();
    } catch { /* toast handled */ }
  }

  function startEditDetails() {
    setDetailForm({
      title: course?.title ?? '',
      description: course?.description ?? '',
      level: course?.level ?? '',
      duration_hours: String(course?.duration_hours ?? ''),
    });
    setEditingDetails(true);
  }

  async function saveDetails() {
    try {
      await courseApi.update(uuid as string, {
        title: detailForm.title,
        description: detailForm.description || undefined,
        level: detailForm.level,
        duration_hours: detailForm.duration_hours ? Number(detailForm.duration_hours) : undefined,
      } as Parameters<typeof courseApi.update>[1]);
      toast.success('Course imebadilishwa');
      setEditingDetails(false);
      refresh();
    } catch { /* handled */ }
  }

  async function updateFinalAssessment(quizUuid: string | null) {
    try {
      await courseApi.update(uuid as string, { /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ final_assessment_quiz_uuid: quizUuid } as any);
      toast.success(quizUuid ? 'Final assessment imesetiwa' : 'Final assessment imeondolewa');
      refresh();
    } catch { /* toast handled */ }
  }

  async function deleteCourse() {
    if (!confirm(`Futa course "${course?.title}" kabisa? Hatua hii haiwezi kurudishwa.`)) return;
    try {
      await courseApi.destroy(uuid as string);
      toast.success('Course imefutwa');
      qc.invalidateQueries({ queryKey: ['trainer', 'courses'] });
      router.push('/trainer/courses');
    } catch {
      toast.error('Imeshindwa kufuta course');
    }
  }

  async function moveModule(idx: number, dir: -1 | 1) {
    if (!course?.modules) return;
    const items = [...course.modules];
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    [items[idx], items[j]] = [items[j], items[idx]];
    await moduleApi.reorder(uuid as string, items.map((m) => m.uuid));
    refresh();
  }

  async function moveLesson(module: CourseModule, idx: number, dir: -1 | 1) {
    if (!module.lessons) return;
    const items = [...module.lessons];
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    [items[idx], items[j]] = [items[j], items[idx]];
    await moduleApi.reorderLessons(module.uuid, items.map((l) => l.uuid));
    refresh();
  }

  if (isLoading || !course) {
    return <div className="p-4 sm:p-6 lg:p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  }

  const isDraft = course.status === 'draft';
  const isRejected = course.status === 'rejected';
  const isEditable = isDraft || isRejected;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">

      {/* Top nav */}
      <div className="flex items-center justify-between mb-5">
        <Link href="/trainer/courses" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-navy-700 font-medium">
          <ArrowLeft className="w-4 h-4" /> Kozi Zangu
        </Link>
        {isEditable && (
          <button
            onClick={deleteCourse}
            className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 font-semibold transition"
          >
            <Trash2 className="w-3.5 h-3.5" /> Futa Course
          </button>
        )}
      </div>

      <div className="mb-6">
        {editingDetails ? (
          <div className="card p-5 mb-4 border-navy-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Badilisha Maelezo ya Course</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Kichwa cha Course</label>
                <input className="input" value={detailForm.title} onChange={(e) => setDetailForm({ ...detailForm, title: e.target.value })} />
              </div>
              <div>
                <label className="label">Maelezo</label>
                <textarea rows={2} className="input" value={detailForm.description} onChange={(e) => setDetailForm({ ...detailForm, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Kiwango</label>
                  <select className="input" value={detailForm.level} onChange={(e) => setDetailForm({ ...detailForm, level: e.target.value })}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
                <div>
                  <label className="label">Muda (masaa)</label>
                  <input type="number" min={1} className="input" value={detailForm.duration_hours} onChange={(e) => setDetailForm({ ...detailForm, duration_hours: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setEditingDetails(false)} className="btn-secondary text-sm">Ghairi</button>
              <button onClick={saveDetails} className="btn-primary text-sm">Hifadhi Mabadiliko</button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{course.title}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm flex-wrap">
                <StatusBadge status={course.status} />
                <span className="text-slate-500">{CATEGORY_LABEL[course.category]}</span>
                <span className="text-slate-500 capitalize">{course.level}</span>
                {course.duration_hours && <span className="text-slate-500">{course.duration_hours}h</span>}
                {isEditable && (
                  <button
                    onClick={startEditDetails}
                    className="text-xs text-navy-600 hover:text-navy-800 font-semibold"
                  >
                    ✎ Badilisha maelezo
                  </button>
                )}
              </div>
              {course.description && (
                <p className="text-slate-500 text-sm mt-2 line-clamp-2">{course.description}</p>
              )}
              {isRejected && course.rejection_reason && (
                <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
                  <strong>Imekataliwa:</strong> {course.rejection_reason}
                </div>
              )}
            </div>
            {isEditable && (course.modules?.length ?? 0) > 0 && (
              <button onClick={submitForApproval} className="btn-primary text-sm shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                {isRejected ? 'Tuma Tena kwa Admin' : 'Submit for Approval'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Thumbnail + Instructor + Final Assessment */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 mb-2">Thumbnail</h3>
          <div className="aspect-video rounded-lg bg-gradient-to-br from-navy-500 to-navy-800 relative overflow-hidden mb-3">
            {(thumbnailPreview || course.thumbnail_url) ? (
              <Image
                src={thumbnailPreview ?? mediaUrl(course.thumbnail_url)!}
                alt=""
                fill
                className="object-cover"
                unoptimized={!!thumbnailPreview}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-40">📚</div>
            )}
            {thumbnailUploading && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
                <span className="text-white text-sm font-semibold">Inapakia S3...</span>
              </div>
            )}
          </div>
          {isEditable && (
            <>
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden ref={fileRef} onChange={handleThumbnail} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={thumbnailUploading}
                className="btn-secondary text-sm w-full disabled:opacity-60"
              >
                {thumbnailUploading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Inapakia...</>
                  : <><Upload className="w-4 h-4" /> {course.thumbnail_url ? 'Badilisha Thumbnail' : 'Pakia Thumbnail'}</>
                }
              </button>
              <p className="text-xs text-slate-400 mt-1 text-center">JPG · PNG · WebP · max 4MB</p>
            </>
          )}
        </div>

        <div className="card p-5 space-y-4">
          <div>
            <label className="label">Instructor wa Course</label>
            <select
              className="input"
              disabled={!isEditable}
              value={course.instructor?.uuid ?? ''}
              onChange={(e) => updateInstructor(e.target.value)}
            >
              <option value="">— Chagua instructor —</option>
              {(instructors?.data ?? []).map((i) => (
                <option key={i.uuid} value={i.uuid}>{i.name} ({i.email})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Tathmini ya Mwisho (Final Assessment)</label>
            <select
              className="input"
              disabled={!isEditable}
              value={course.final_assessment?.uuid ?? ''}
              onChange={(e) => updateFinalAssessment(e.target.value || null)}
            >
              <option value="">— Hakuna final exam —</option>
              {(myQuizzes ?? []).map((q: { id: string; name: string; status: string }) => (
                <option key={q.id} value={q.id}>{q.name} ({q.status})</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Quiz atakayotakiwa student akifika mwisho wa course.
            </p>
          </div>
        </div>
      </div>

      {/* Modules + Lessons + Quizzes + Assignments */}
      <div className="card p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Course Structure ({course.modules?.length ?? 0} modules)</h2>
          {isEditable && (
            <button onClick={() => setShowAddModule(true)} className="btn-secondary text-sm">
              <Plus className="w-4 h-4" /> Ongeza Module
            </button>
          )}
        </div>

        {!course.modules?.length ? (
          <p className="text-slate-500 text-center py-8">Bado hakuna module. Anza kuongeza.</p>
        ) : (
          <div className="space-y-4">
            {course.modules.map((m, i) => (
              <ModuleBlock
                key={m.uuid}
                module={m}
                position={i + 1}
                total={course.modules!.length}
                editable={isEditable}
                onMove={(dir) => moveModule(i, dir)}
                onAddLesson={() => setAddLessonForModule(m.uuid)}
                onAttachQuiz={() => setAttachQuizForModule(m.uuid)}
                onAddAssignment={(lu) => setAddAssignmentForLesson(lu)}
                onMoveLesson={(idx, dir) => moveLesson(m, idx, dir)}
                onChanged={refresh}
              />
            ))}
          </div>
        )}
      </div>

      {showAddModule && (
        <AddModuleModal
          courseUuid={uuid as string}
          onClose={() => setShowAddModule(false)}
          onCreated={() => { refresh(); setShowAddModule(false); }}
        />
      )}
      {addLessonForModule && (
        <AddLessonModal
          moduleUuid={addLessonForModule}
          onClose={() => setAddLessonForModule(null)}
          onCreated={() => { refresh(); setAddLessonForModule(null); }}
        />
      )}
      {attachQuizForModule && (
        <AttachQuizModal
          moduleUuid={attachQuizForModule}
          quizzes={myQuizzes ?? []}
          onClose={() => setAttachQuizForModule(null)}
          onAttached={() => { refresh(); setAttachQuizForModule(null); }}
        />
      )}
      {addAssignmentForLesson && (
        <AddAssignmentModal
          lessonUuid={addAssignmentForLesson}
          onClose={() => setAddAssignmentForLesson(null)}
          onCreated={() => { refresh(); setAddAssignmentForLesson(null); }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    pending_approval: 'bg-amber-100 text-amber-800',
    published: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${map[status] ?? 'bg-slate-100'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function ModuleBlock({ module, position, total, editable, onMove, onAddLesson, onAttachQuiz, onAddAssignment, onMoveLesson, onChanged }: {
  module: CourseModule;
  position: number; total: number; editable: boolean;
  onMove: (dir: -1 | 1) => void;
  onAddLesson: () => void; onAttachQuiz: () => void;
  onAddAssignment: (lessonUuid: string) => void;
  onMoveLesson: (idx: number, dir: -1 | 1) => void;
  onChanged: () => void;
}) {
  async function delModule() {
    if (!confirm(`Futa module "${module.title}" na lessons zake zote?`)) return;
    await moduleApi.destroy(module.uuid);
    toast.success('Module imefutwa');
    onChanged();
  }
  async function detachQuiz(quizUuid: string) {
    if (!confirm('Ondoa quiz kwenye module hii?')) return;
    await moduleApi.detachQuiz(quizUuid);
    toast.success('Quiz imeondolewa');
    onChanged();
  }

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
            {position}
          </div>
          <div className="flex-1">
            <div className="font-bold text-slate-900">{module.title}</div>
            {module.description && <div className="text-sm text-slate-600">{module.description}</div>}
          </div>
        </div>
        {editable && (
          <div className="flex items-center gap-1">
            <button onClick={() => onMove(-1)} disabled={position === 1} className="p-1 text-slate-500 hover:bg-slate-200 rounded disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
            <button onClick={() => onMove(1)} disabled={position === total} className="p-1 text-slate-500 hover:bg-slate-200 rounded disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
            <button onClick={delModule} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {/* Attached Quizzes (SRS "Module Contains Quiz") */}
      {(module.quizzes ?? []).length > 0 && (
        <div className="ml-11 mt-3 space-y-1">
          {module.quizzes!.map((q) => (
            <div key={q.uuid} className="flex items-center gap-3 p-2 rounded bg-white text-sm">
              <Zap className="w-4 h-4 text-brand-500 shrink-0" />
              <span className="flex-1 font-medium text-slate-800">{q.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">{q.mode === 'live_quiz' || q.mode === 'live_kahoot' ? 'SAFCO Live' : q.mode}</span>
              <span className="text-xs text-slate-500">{q.number_of_questions}Q</span>
              {editable && (
                <button onClick={() => detachQuiz(q.uuid)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lessons */}
      {(module.lessons ?? []).length > 0 && (
        <div className="ml-11 mt-3 space-y-1">
          {module.lessons!.map((l, j) => (
            <LessonRow
              key={l.uuid}
              lesson={l}
              num={`${position}.${j + 1}`}
              editable={editable}
              onMove={(dir) => onMoveLesson(j, dir)}
              onDeleted={onChanged}
              onAddAssignment={() => onAddAssignment(l.uuid)}
              first={j === 0}
              last={j === (module.lessons?.length ?? 1) - 1}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      {editable && (
        <div className="ml-11 mt-3 flex gap-2 flex-wrap">
          <button onClick={onAddLesson} className="text-xs text-brand-600 hover:underline flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add Lesson
          </button>
          <button onClick={onAttachQuiz} className="text-xs text-brand-600 hover:underline flex items-center gap-1">
            <Zap className="w-3 h-3" /> Attach Quiz
          </button>
        </div>
      )}
    </div>
  );
}

function LessonRow({ lesson, num, editable, onDeleted, onAddAssignment, onMove, first, last }: {
  lesson: Lesson; num: string; editable: boolean;
  onDeleted: () => void; onAddAssignment: () => void;
  onMove: (dir: -1 | 1) => void; first: boolean; last: boolean;
}) {
  const videoRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const [uploadPct, setUploadPct] = useState<{ label: string; pct: number } | null>(null);
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);

  async function del() {
    if (!confirm(`Futa lesson "${lesson.title}"?`)) return;
    await lessonApi.destroy(lesson.uuid);
    toast.success('Lesson imefutwa');
    onDeleted();
  }
  async function delAssignment(uuid: string) {
    if (!confirm('Futa assignment?')) return;
    await assignmentApi.destroy(uuid);
    toast.success('Assignment imefutwa');
    onDeleted();
  }

  async function handleFileUpload(file: File, label: string, type?: MaterialType) {
    setUploadPct({ label, pct: 0 });
    try {
      const title = file.name.replace(/\.[^.]+$/, '');
      await materialApi.upload(lesson.uuid, title, file, type, (pct) => setUploadPct({ label, pct }));
      toast.success(`${label} imepakiwa`);
      onDeleted();
    } catch {
      toast.error('Upload imeshindwa');
    } finally {
      setUploadPct(null);
    }
  }

  return (
    <div className="rounded-lg bg-white border border-slate-100 p-3 mb-2">
      {/* Lesson header */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-xs font-mono text-slate-400 w-10 shrink-0">{num}</span>
        <PlayCircle className="w-4 h-4 text-brand-500 shrink-0" />
        <span className="flex-1 font-medium text-slate-800">{lesson.title}</span>
        {lesson.duration_seconds && (
          <span className="text-xs text-slate-400">{Math.round(lesson.duration_seconds / 60)}m</span>
        )}
        {editable && (
          <div className="flex items-center gap-1">
            <button onClick={() => onMove(-1)} disabled={first} className="p-1 text-slate-400 hover:bg-slate-100 rounded disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
            <button onClick={() => onMove(1)} disabled={last} className="p-1 text-slate-400 hover:bg-slate-100 rounded disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
            <button onClick={del} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 className="w-3 h-3" /></button>
          </div>
        )}
      </div>

      {/* Upload buttons — visible directly, no modal needed */}
      {editable && (
        <div className="ml-14 mt-2 flex flex-wrap gap-2">
          {/* Video upload */}
          <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-50 hover:bg-navy-100 text-navy-600 text-xs font-semibold transition">
            <Film className="w-3.5 h-3.5" /> Upload Video
            <input
              ref={videoRef}
              type="file"
              accept=".mp4,.webm,.mov"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'Video', 'video_mp4'); e.target.value = ''; }}
            />
          </label>

          {/* PDF upload */}
          <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition">
            <FileText className="w-3.5 h-3.5" /> Upload PDF
            <input
              ref={pdfRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'PDF', 'document_pdf'); e.target.value = ''; }}
            />
          </label>

          {/* Word/Excel/PPT upload */}
          <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition">
            <FileText className="w-3.5 h-3.5" /> Upload Word/Excel/PPT
            <input
              ref={docRef}
              type="file"
              accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'Document'); e.target.value = ''; }}
            />
          </label>

          {/* SCORM upload */}
          <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-50 hover:bg-navy-100 text-navy-600 text-xs font-semibold transition">
            <FileArchive className="w-3.5 h-3.5" /> Upload SCORM (.zip)
            <input
              type="file"
              accept=".zip"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'SCORM', 'interactive_scorm'); e.target.value = ''; }}
            />
          </label>

          {/* YouTube / Vimeo / HTML5 URL */}
          <button
            onClick={() => setShowYouTubeModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-semibold transition"
          >
            <Youtube className="w-3.5 h-3.5" /> Video / HTML5 URL
          </button>

          {/* Assignment */}
          <button
            onClick={onAddAssignment}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold transition"
          >
            <ClipboardList className="w-3.5 h-3.5" /> Add Assignment
          </button>
        </div>
      )}

      {/* Upload progress bar */}
      {uploadPct && (
        <div className="ml-14 mt-2">
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span className="font-semibold">{uploadPct.label} inapakiwa...</span>
            <span>{uploadPct.pct}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-brand-600 h-2 rounded-full transition-all" style={{ width: `${uploadPct.pct}%` }} />
          </div>
        </div>
      )}

      {/* Existing materials */}
      {(lesson.materials ?? []).length > 0 && (
        <div className="ml-14 mt-2 space-y-0.5">
          {lesson.materials!.map((m) => (
            <MaterialRow key={m.uuid} material={m} editable={editable} onDeleted={onDeleted} />
          ))}
        </div>
      )}

      {/* Existing assignments */}
      {(lesson.assignments ?? []).length > 0 && (
        <div className="ml-14 mt-1 space-y-1">
          {lesson.assignments!.map((a) => (
            <AssignmentRow key={a.uuid} a={a} editable={editable} onDeleted={() => delAssignment(a.uuid)} onChanged={onDeleted} />
          ))}
        </div>
      )}

      {/* YouTube/Vimeo link modal */}
      {showYouTubeModal && (
        <AddYouTubeLinkModal
          lessonUuid={lesson.uuid}
          onClose={() => setShowYouTubeModal(false)}
          onCreated={() => { setShowYouTubeModal(false); onDeleted(); }}
        />
      )}
    </div>
  );
}

function AssignmentRow({ a, editable, onDeleted, onChanged }: { a: Assignment; editable: boolean; onDeleted: () => void; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const briefUrl = a.brief?.download_url ?? null;

  async function uploadBrief(file: File) {
    setBusy(true);
    try {
      await assignmentApi.uploadBrief(a.uuid, file);
      toast.success('Brief uploaded');
      onChanged();
    } catch (e) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Upload failed');
    } finally { setBusy(false); }
  }

  async function removeBrief() {
    if (!confirm('Remove the brief file?')) return;
    setBusy(true);
    try {
      await assignmentApi.deleteBrief(a.uuid);
      toast.success('Brief removed');
      onChanged();
    } finally { setBusy(false); }
  }

  return (
    <div className="p-2 rounded-lg bg-amber-50/50 border border-amber-100 text-xs">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-3 h-3 text-amber-600 shrink-0" />
        <span className="flex-1 font-medium text-slate-800">{a.title}</span>
        <span className="text-slate-500">{a.max_points} pts</span>
        {a.due_date && <span className="text-slate-500">· due {new Date(a.due_date).toLocaleDateString()}</span>}
        <Link href={`/trainer/assignments/${a.uuid}/submissions`} className="text-brand-600 hover:text-brand-700 underline">Submissions</Link>
        {editable && (
          <button onClick={onDeleted} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button>
        )}
      </div>
      <div className="mt-1.5 flex items-center gap-2 flex-wrap pl-5">
        {briefUrl ? (
          <>
            <a href={briefUrl} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">
              📎 {a.brief!.file_name} ({fmtSize(a.brief!.file_size)})
            </a>
            {editable && (
              <button onClick={removeBrief} disabled={busy} className="text-red-500 hover:text-red-700 text-[10px] uppercase">Remove brief</button>
            )}
          </>
        ) : editable && (
          <label className="text-brand-600 hover:text-brand-700 cursor-pointer underline">
            <input
              type="file"
              className="hidden"
              accept={ASSIGNMENT_ACCEPT_ATTR}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBrief(f); e.target.value = ''; }}
              disabled={busy}
            />
            {busy ? 'Uploading…' : '+ Attach brief (PDF/Word/Excel/ZIP)'}
          </label>
        )}
        {a.allowed_file_types && a.allowed_file_types.length > 0 && (
          <span className="ml-auto text-slate-500">Answer: {a.allowed_file_types.map((t) => '.' + t).join(', ')}</span>
        )}
      </div>
    </div>
  );
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function MaterialRow({ material, editable, onDeleted }: { material: LessonMaterial; editable: boolean; onDeleted: () => void }) {
  const Icon = materialIcon(material.type);
  const colorClass = material.category === 'documents' ? 'text-red-600' : material.category === 'videos' ? 'text-navy-500' : 'text-navy-500';

  // Real-time processing status via MQTT (falls back to poll)
  const status = useMaterialStatus(material.uuid, {
    status: material.processing_status ?? 'ready',
    progress: material.processing_progress ?? 100,
  });

  async function del() {
    if (!confirm(`Futa material "${material.title}"?`)) return;
    await materialApi.destroy(material.uuid);
    toast.success('Material imefutwa');
    onDeleted();
  }

  return (
    <div className="p-1 text-xs text-slate-700">
      <div className="flex items-center gap-2">
        <Icon className={`w-3 h-3 ${colorClass}`} />
        <span className="flex-1">{material.title}</span>
        <StatusPill status={status.status} progress={status.progress} />
        <span className="text-slate-400 text-xs">{MATERIAL_TYPE_LABEL[material.type]}</span>
        {editable && (
          <button onClick={del} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button>
        )}
      </div>
      {status.status === 'processing' && (
        <div className="ml-5 mt-1 w-full bg-slate-100 rounded-full h-1">
          <div className="bg-brand-600 h-1 rounded-full transition-all" style={{ width: `${status.progress}%` }} />
        </div>
      )}
      {status.status === 'failed' && status.error && (
        <div className="ml-5 mt-1 text-red-600 text-xs">Failed: {status.error}</div>
      )}
    </div>
  );
}

function StatusPill({ status, progress }: { status: string; progress: number }) {
  if (status === 'ready') return null;
  const map: Record<string, string> = {
    pending: 'bg-slate-100 text-slate-600',
    processing: 'bg-amber-100 text-amber-700',
    failed: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${map[status] ?? ''}`}>
      {status === 'processing' ? `${progress}%` : status}
    </span>
  );
}

function materialIcon(type: MaterialType) {
  if (type.startsWith('document_pdf')) return FileText;
  if (type === 'document_word' || type === 'document_excel' || type === 'document_powerpoint') return FileText;
  if (type === 'video_youtube') return Youtube;
  if (type === 'video_vimeo' || type === 'video_mp4') return Film;
  if (type === 'interactive_scorm') return FileArchive;
  return Package;
}

function AddModuleModal({ courseUuid, onClose, onCreated }: { courseUuid: string; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!title.trim()) return;
    setBusy(true);
    try { await moduleApi.create(courseUuid, { title, description: desc }); toast.success('Module imeongezwa'); onCreated(); }
    catch { setBusy(false); }
  }
  return (
    <Modal onClose={onClose} title="Ongeza Module">
      <div className="space-y-4">
        <div><label className="label">Title *</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><label className="label">Description</label><textarea rows={2} className="input" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={save} busy={busy} />
    </Modal>
  );
}

function AddLessonModal({ moduleUuid, onClose, onCreated }: { moduleUuid: string; onClose: () => void; onCreated: () => void }) {
  const [f, setF] = useState({ title: '', description: '' });
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!f.title.trim()) return;
    setBusy(true);
    try {
      await lessonApi.create(moduleUuid, { title: f.title, description: f.description || undefined });
      toast.success('Lesson imeongezwa — sasa pakia video na PDF');
      onCreated();
    } catch { setBusy(false); }
  }
  return (
    <Modal onClose={onClose} title="Ongeza Lesson">
      <div className="space-y-3">
        <div><label className="label">Lesson Title *</label><input className="input" autoFocus value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Introduction to Excel Interface" /></div>
        <div><label className="label">Description (optional)</label><textarea rows={2} className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Maelezo mafupi ya lesson hii" /></div>
        <p className="text-xs text-slate-500">Baada ya kuongeza lesson, utaweza kupakia Video, PDF, na Documents moja kwa moja.</p>
      </div>
      <ModalFooter onClose={onClose} onSave={save} busy={busy} />
    </Modal>
  );
}

function AddYouTubeLinkModal({ lessonUuid, onClose, onCreated }: { lessonUuid: string; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle]   = useState('');
  const [url, setUrl]       = useState('');
  const [kind, setKind]     = useState<'video' | 'html5'>('video');
  const [busy, setBusy]     = useState(false);

  function detectKind(val: string) {
    setUrl(val);
    if (val.match(/youtube\.com|youtu\.be|vimeo\.com/i)) setKind('video');
    else if (val.startsWith('http')) setKind('html5');
  }

  async function save() {
    if (!url.trim()) return;
    const t = title.trim() || (kind === 'html5' ? 'Interactive Content' : 'Video');
    setBusy(true);
    try {
      const type = kind === 'html5' ? 'interactive_html5' : undefined; // auto-detect youtube/vimeo
      await materialApi.addUrl(lessonUuid, { title: t, url: url.trim(), type });
      toast.success('Link imeongezwa');
      onCreated();
    } catch { setBusy(false); }
  }

  return (
    <Modal onClose={onClose} title="Ongeza Video au Interactive URL">
      <div className="space-y-3">
        {/* Kind selector */}
        <div className="flex gap-2">
          {(['video', 'html5'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition ${
                kind === k
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {k === 'video' ? '🎬 YouTube / Vimeo' : '⚡ HTML5 Interactive URL'}
            </button>
          ))}
        </div>

        <div>
          <label className="label">
            {kind === 'video' ? 'YouTube / Vimeo URL *' : 'HTML5 Content URL *'}
          </label>
          <input
            className="input"
            autoFocus
            value={url}
            onChange={(e) => detectKind(e.target.value)}
            placeholder={kind === 'video' ? 'https://www.youtube.com/watch?v=...' : 'https://example.com/interactive/index.html'}
          />
          {kind === 'html5' && (
            <p className="text-xs text-slate-400 mt-1">
              URL ya HTML5 interactive content (H5P, Genially, Articulate Rise, etc.)
            </p>
          )}
        </div>

        <div>
          <label className="label">Title (optional)</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={kind === 'video' ? 'Jina la video' : 'Jina la interactive content'}
          />
        </div>
      </div>
      <ModalFooter onClose={onClose} onSave={save} busy={busy} disabled={!url.trim()} />
    </Modal>
  );
}

function AttachQuizModal({ moduleUuid, quizzes, onClose, onAttached }: {
  moduleUuid: string;
  quizzes: Array<{ id: string; name: string; status: string; mode: string }>;
  onClose: () => void; onAttached: () => void;
}) {
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!selected) return;
    setBusy(true);
    try { await moduleApi.attachQuiz(moduleUuid, selected); toast.success('Quiz imeattachwa'); onAttached(); }
    catch { setBusy(false); }
  }
  return (
    <Modal onClose={onClose} title="Ongeza Quiz kwenye Module">
      <p className="text-sm text-slate-600 mb-3">Chagua quiz yako ya ku-attach:</p>
      {!quizzes.length ? (
        <p className="text-slate-400 text-sm">Hakuna quiz. Kwanza tengeneza kwenye <a href="/dashboard/quizzes/new" className="text-brand-600 underline">Quizzes</a>.</p>
      ) : (
        <select className="input" value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">— Chagua —</option>
          {quizzes.map((q) => <option key={q.id} value={q.id}>{q.name} ({q.status})</option>)}
        </select>
      )}
      <ModalFooter onClose={onClose} onSave={save} busy={busy} disabled={!selected} />
    </Modal>
  );
}

function AddAssignmentModal({ lessonUuid, onClose, onCreated }: { lessonUuid: string; onClose: () => void; onCreated: () => void }) {
  const [f, setF] = useState({ title: '', instructions: '', max_points: 100, due_date: '' });
  const [allowed, setAllowed] = useState<string[]>([...ASSIGNMENT_ALLOWED_EXT]);
  const [briefFile, setBriefFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  function toggleExt(ext: string) {
    setAllowed((prev) => prev.includes(ext) ? prev.filter((x) => x !== ext) : [...prev, ext]);
  }

  async function save() {
    if (!f.title.trim()) return;
    if (allowed.length === 0) { toast.error('Chagua angalau aina moja ya file'); return; }
    setBusy(true);
    try {
      const created = await assignmentApi.create(lessonUuid, {
        title: f.title,
        instructions: f.instructions || undefined,
        max_points: f.max_points,
        due_date: f.due_date || undefined,
        allowed_file_types: allowed,
      });
      if (briefFile) {
        await assignmentApi.uploadBrief(created.uuid, briefFile);
      }
      toast.success('Assignment imeongezwa');
      onCreated();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Save failed';
      toast.error(msg);
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose} title="Ongeza Assignment">
      <div className="space-y-3">
        <div>
          <label className="label">Title *</label>
          <input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Practice: build a Power Query" />
        </div>
        <div>
          <label className="label">Instructions</label>
          <textarea rows={3} className="input" value={f.instructions} onChange={(e) => setF({ ...f, instructions: e.target.value })} placeholder="What should students do? (You can also attach a PDF brief below.)" />
        </div>

        <div>
          <label className="label">Brief document (optional — students will download this)</label>
          <input
            type="file"
            className="input"
            accept={ASSIGNMENT_ACCEPT_ATTR}
            onChange={(e) => setBriefFile(e.target.files?.[0] ?? null)}
          />
          <p className="help">
            Accepted: PDF · Word · Excel · ZIP · max {ASSIGNMENT_MAX_MB} MB
          </p>
          {briefFile && (
            <p className="text-xs text-slate-700 mt-1">Selected: <strong>{briefFile.name}</strong> ({(briefFile.size / 1024).toFixed(1)} KB)</p>
          )}
        </div>

        <div>
          <label className="label">Allowed answer file types *</label>
          <div className="flex flex-wrap gap-2">
            {ASSIGNMENT_ALLOWED_EXT.map((ext) => (
              <label key={ext} className={`px-3 py-1.5 rounded-full text-sm font-semibold cursor-pointer border-2 transition ${
                allowed.includes(ext) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 hover:border-brand-300'
              }`}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={allowed.includes(ext)}
                  onChange={() => toggleExt(ext)}
                />
                .{ext}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Max Points</label>
            <input type="number" className="input" min={1} max={1000} value={f.max_points} onChange={(e) => setF({ ...f, max_points: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Due Date</label>
            <input type="datetime-local" className="input" value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} />
          </div>
        </div>
      </div>
      <ModalFooter onClose={onClose} onSave={save} busy={busy} disabled={!f.title.trim()} />
    </Modal>
  );
}


function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}
function ModalFooter({ onClose, onSave, busy, disabled = false }: { onClose: () => void; onSave: () => void; busy: boolean; disabled?: boolean }) {
  return (
    <div className="flex justify-end gap-2 mt-6">
      <button onClick={onClose} className="btn-secondary">Cancel</button>
      <button onClick={onSave} disabled={busy || disabled} className="btn-primary">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
      </button>
    </div>
  );
}
