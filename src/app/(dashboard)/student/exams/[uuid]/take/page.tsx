'use client';

export const dynamic = 'force-dynamic';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2, ShieldAlert, Timer, ChevronLeft, ChevronRight, Send,
  CheckCircle2, AlertTriangle, Lock, Maximize2, Camera, CameraOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { quizApi, type AttemptQuestion, type Quiz } from '@/lib/quiz/api';
import { examApi, type ExamTakingPayload } from '@/lib/exam/api';

/**
 * SRS Module 8 — Examination taking page.
 *
 *   Pre-start   → instructions + agree + fullscreen prompt
 *   In-progress → question navigator + running timer + anti-cheat guards
 *   Submitted   → redirect to result page
 */

type Phase = 'loading' | 'ready' | 'taking' | 'submitting' | 'done';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function TakeExamPage() {
  const { uuid: quizUuid } = useParams<{ uuid: string }>();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('loading');
  const [attempt, setAttempt] = useState<ExamTakingPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [sequences, setSequences] = useState<Record<string, number>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({});
  const [sessionConflict, setSessionConflict] = useState(false);
  const [current, setCurrent] = useState(0);
  const [violationCount, setViolationCount] = useState(0);
  const [violationWarning, setViolationWarning] = useState<string | null>(null);
  // Session token (kept in memory only)
  const sessionTokenRef = useRef('');
  const attemptUuidRef = useRef('');
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Server-corrected seconds remaining
  const [serverSecondsLeft, setServerSecondsLeft] = useState<number | null>(null);
  const serverDeadlineRef = useRef<string | null>(null);
  // Webcam monitoring
  const [camStream, setCamStream] = useState<MediaStream | null>(null);
  const [camDenied, setCamDenied] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const snapshotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: ['quiz-for-exam', quizUuid],
    queryFn: () => quizApi.get(quizUuid as string),
  });

  const ac = quiz?.anti_cheat_settings ?? {};

  /* ---------- Start / resume (V2 API) ---------- */

  async function beginAttempt() {
    setPhase('loading');
    try {
      const state = await examApi.start(quizUuid as string);

      // Store session token in memory (not localStorage)
      const token = state.session_token ?? '';
      sessionTokenRef.current = token;
      attemptUuidRef.current = state.attempt_id;
      serverDeadlineRef.current = state.deadline_at;
      setServerSecondsLeft(state.seconds_remaining);

      setAttempt(state);
      // Pre-fill answers from server (resume)
      const initial: Record<string, unknown> = {};
      const initialSeqs: Record<string, number> = {};
      for (const q of state.questions) {
        if (q.my_answer !== null && q.my_answer !== undefined) {
          initial[q.question_id] = q.my_answer;
          initialSeqs[q.question_id] = q.my_sequence ?? 0;
        }
      }
      setAnswers(initial);
      setSequences(initialSeqs);
      setViolationCount(state.violations_count ?? 0);

      // Enter fullscreen if browser_lock is enabled
      if (ac.browser_lock) await requestFullscreen();

      // Start webcam if webcam_required
      if (ac.webcam_required) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false });
          setCamStream(stream);
          setCamDenied(false);
        } catch {
          setCamDenied(true);
        }
      }

      setPhase('taking');
    } catch (e) {
      // 409 = SESSION_CONFLICT: another tab holds this exam — blocked immediately on page load
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setSessionConflict(true);
        setPhase('ready');
        return;
      }
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Cannot start exam';
      toast.error(msg);
      setPhase('ready');
    }
  }

  // Set to 'ready' as soon as quiz loads
  useEffect(() => {
    if (quiz && phase === 'loading') setPhase('ready');
  }, [quiz, phase]);

  /* ---------- Heartbeat (every 30 s) — syncs server time + detects session conflict ---------- */

  const runHeartbeat = useCallback(async () => {
    const tok = sessionTokenRef.current;
    const aid = attemptUuidRef.current;
    if (!tok || !aid || phase !== 'taking') return;
    try {
      const hb = await examApi.heartbeat(aid, tok);
      // Sync countdown from server
      setServerSecondsLeft(hb.seconds_remaining);
      if (hb.state !== 'in_progress') {
        // Auto-submitted by server (deadline passed)
        clearInterval(heartbeatRef.current!);
        toast('Exam auto-submitted by server.');
        router.replace(`/dashboard/student/exams/${quizUuid}`);
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { message?: string } } })?.response?.status;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
      if (status === 409 || msg === 'SESSION_CONFLICT') {
        clearInterval(heartbeatRef.current!);
        setSessionConflict(true);
      }
    }
  }, [phase, quizUuid, router]);

  useEffect(() => {
    if (phase !== 'taking') return;
    heartbeatRef.current = setInterval(runHeartbeat, 30_000);
    return () => clearInterval(heartbeatRef.current!);
  }, [phase, runHeartbeat]);

  /* ---------- Anti-cheat guards ---------- */

  const violation = useCallback(async (type: string, meta: Record<string, unknown> = {}) => {
    const tok = sessionTokenRef.current;
    const aid = attemptUuidRef.current;
    if (!tok || !aid || phase !== 'taking') return;
    try {
      const r = await examApi.violation(aid, tok, type, meta);
      setViolationCount(r.violations_count);
      setViolationWarning(`⚠ Violation: ${type.replace(/_/g, ' ')} (${r.violations_count})`);
      setTimeout(() => setViolationWarning(null), 3500);
      if (r.state !== 'in_progress') {
        toast.error('Auto-submitted: violation threshold exceeded.');
        router.replace(`/dashboard/student/exams/${quizUuid}`);
      }
    } catch { /* ignore network errors */ }
  }, [phase, quizUuid, router]);

  // 1) Tab switch / visibilitychange
  useEffect(() => {
    if (phase !== 'taking') return;
    function onVis() {
      if (document.hidden) violation('tab_switch', { visibility: document.visibilityState });
    }
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [phase, violation]);

  // 2) Fullscreen exit
  useEffect(() => {
    if (phase !== 'taking' || !ac.browser_lock) return;
    function onFsChange() {
      if (!document.fullscreenElement) violation('fullscreen_exit');
    }
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [phase, ac.browser_lock, violation]);

  // 3) Copy-paste block
  useEffect(() => {
    if (phase !== 'taking' || !ac.disable_copy_paste) return;
    function block(e: ClipboardEvent) {
      e.preventDefault();
      violation('copy_paste', { action: e.type });
    }
    document.addEventListener('copy', block);
    document.addEventListener('paste', block);
    document.addEventListener('cut', block);
    return () => {
      document.removeEventListener('copy', block);
      document.removeEventListener('paste', block);
      document.removeEventListener('cut', block);
    };
  }, [phase, ac.disable_copy_paste, violation]);

  // 4) Right-click block
  useEffect(() => {
    if (phase !== 'taking' || !ac.disable_right_click) return;
    function block(e: MouseEvent) {
      e.preventDefault();
      violation('right_click');
    }
    document.addEventListener('contextmenu', block);
    return () => document.removeEventListener('contextmenu', block);
  }, [phase, ac.disable_right_click, violation]);

  // 5) Before-unload confirmation
  useEffect(() => {
    if (phase !== 'taking') return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = 'Exam in progress. Are you sure you want to leave?';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [phase]);

  // 6) Block DevTools keyboard shortcuts (F12, Ctrl+Shift+I/J/C/U, Ctrl+S)
  useEffect(() => {
    if (phase !== 'taking' || !ac.browser_lock) return;
    function onKeyDown(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey;
      const blocked =
        e.key === 'F12' ||
        (ctrl && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) ||
        (ctrl && ['u', 'U', 's', 'S', 'a', 'A'].includes(e.key));
      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
        violation('devtools_shortcut', { key: e.key });
      }
    }
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [phase, ac.browser_lock, violation]);

  // 7) Text selection block when copy-paste is disabled
  useEffect(() => {
    if (phase !== 'taking' || !ac.disable_copy_paste) return;
    const style = document.createElement('style');
    style.id = 'exam-noselect';
    style.textContent = '* { user-select: none !important; -webkit-user-select: none !important; }';
    document.head.appendChild(style);
    return () => document.getElementById('exam-noselect')?.remove();
  }, [phase, ac.disable_copy_paste]);

  // 8) Window blur — user switched to another window/app (not just a tab)
  const [windowBlurred, setWindowBlurred] = useState(false);
  useEffect(() => {
    if (phase !== 'taking') return;
    function onBlur() {
      setWindowBlurred(true);
      violation('window_blur');
    }
    function onFocus() {
      setWindowBlurred(false);
    }
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }, [phase, violation]);

  // 9) Screen Wake Lock — keep screen on during exam (browser_lock)
  useEffect(() => {
    if (phase !== 'taking' || !ac.browser_lock) return;
    if (!('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } })
      .wakeLock.request('screen').then((l) => { lock = l; }).catch(() => null);
    return () => { lock?.release().catch(() => null); };
  }, [phase, ac.browser_lock]);

  // 10) Webcam — attach stream to video element and take periodic snapshots
  useEffect(() => {
    if (!camStream || !videoRef.current) return;
    const vid = videoRef.current;
    vid.srcObject = camStream;
    vid.play().catch(() => null);
  }, [camStream]);

  useEffect(() => {
    if (!camStream || phase !== 'taking' || !attempt) return;
    const canvas = canvasRef.current;
    const vid = videoRef.current;
    if (!canvas || !vid) return;

    snapshotIntervalRef.current = setInterval(() => {
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = 320; canvas.height = 240;
        ctx.drawImage(vid, 0, 0, 320, 240);
        canvas.toBlob((blob) => {
          if (!blob) return;
          // V2: snapshot upload would go here when S3 wiring is added
          void blob;
        }, 'image/jpeg', 0.6);
      } catch { /* ignore */ }
    }, 30_000); // every 30 seconds

    return () => {
      if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current);
    };
  }, [camStream, phase, attempt]);

  // 11) Webcam denial violation — flag it once on exam start
  useEffect(() => {
    if (camDenied && phase === 'taking' && attempt) {
      violation('webcam_denied', { reason: 'Camera access was blocked by the user or browser' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camDenied, phase]);

  // Clean up stream on unmount or exam end
  useEffect(() => {
    return () => {
      camStream?.getTracks().forEach((t) => t.stop());
      if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current);
    };
  }, [camStream]);

  /* ---------- Timer — countdown from server-provided seconds_remaining ---------- */

  // Use deadline_at for local tick; heartbeat corrects it every 30 s
  const expiresAt = attempt?.deadline_at ?? null;
  const secondsLeft = useCountdownFrom(serverSecondsLeft, expiresAt);

  useEffect(() => {
    if (phase === 'taking' && expiresAt && secondsLeft === 0) {
      toast.error('Muda umeisha — submitting your answers…');
      submitAll(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase, expiresAt]);

  /* ---------- Answer save (V2: sequence numbers + save status) ---------- */

  async function saveAnswer(questionId: string, ans: unknown) {
    const tok = sessionTokenRef.current;
    const aid = attemptUuidRef.current;
    if (!tok || !aid) return;

    setAnswers((prev) => ({ ...prev, [questionId]: ans }));
    const nextSeq = (sequences[questionId] ?? 0) + 1;
    setSequences((p) => ({ ...p, [questionId]: nextSeq }));
    setSaveStatus((p) => ({ ...p, [questionId]: 'saving' }));

    try {
      await examApi.answer(aid, tok, questionId, ans, nextSeq);
      setSaveStatus((p) => ({ ...p, [questionId]: 'saved' }));
    } catch (e) {
      setSaveStatus((p) => ({ ...p, [questionId]: 'error' }));
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Save failed';
      toast.error(msg);
    }
  }

  async function submitAll(auto = false) {
    const aid = attemptUuidRef.current;
    if (!aid) return;
    if (!auto && !confirm('Submit exam? You cannot change your answers after this.')) return;
    setPhase('submitting');
    try {
      await examApi.submit(aid);
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => null);
      camStream?.getTracks().forEach((t) => t.stop());
      setCamStream(null);
      clearInterval(heartbeatRef.current!);
      router.replace(`/dashboard/student/exams/${quizUuid}`);
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Submit failed';
      toast.error(msg);
      setPhase('taking');
    }
  }

  async function requestFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    } catch { /* browsers block if not from user gesture */ }
  }

  /* ---------- Render ---------- */

  if (quizLoading || !quiz) {
    return <FullScreenLoader />;
  }

  if (phase === 'ready') {
    return <InstructionsScreen quiz={quiz} onBegin={beginAttempt} />;
  }

  if (phase === 'submitting') {
    return <FullScreenLoader label="Submitting exam…" />;
  }

  /* ---------- Session conflict — shown immediately when load returns 409 ---------- */
  if (sessionConflict) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-xl">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access denied</h2>
          <p className="text-slate-700 mb-3 text-sm font-medium">
            This exam is already open in another window or device.
          </p>
          <p className="text-slate-500 mb-6 text-xs">
            This attempt is locked to its original session. Contact your exam proctor if you
            believe this is an error or if your previous session crashed.
          </p>
          <button onClick={() => router.back()} className="btn-secondary">
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!attempt) return <FullScreenLoader />;

  const qList = attempt.questions as unknown as AttemptQuestion[];
  const q = qList[current];
  const answeredCount = Object.keys(answers).filter((k) => qList.some((x) => x.question_id === k)).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Window-blur overlay — covers screen when student leaves the window */}
      {windowBlurred && phase === 'taking' && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/95 flex flex-col items-center justify-center text-white text-center p-6">
          <ShieldAlert className="w-16 h-16 text-red-400 mb-4" />
          <div className="text-2xl font-black mb-2">Exam paused</div>
          <div className="text-slate-300 text-sm mb-1">You left the exam window. Click here to return.</div>
          <div className="text-red-400 text-xs font-semibold">This switch has been recorded as a violation.</div>
        </div>
      )}

      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-2 sticky top-0 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-bold text-slate-700 truncate">{quiz.name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase font-semibold">
            {attempt.exam_type ?? 'exam'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {ac.browser_lock && !document.fullscreenElement && (
            <button onClick={requestFullscreen} className="text-xs flex items-center gap-1 text-amber-700 hover:text-amber-900 font-semibold">
              <Maximize2 className="w-3 h-3" /> Return to fullscreen
            </button>
          )}
          <div className="text-xs text-slate-500">Answered: <strong className="text-slate-900">{answeredCount}</strong> / {qList.length}</div>
          <TimerBadge secondsLeft={secondsLeft} />
        </div>
      </div>

      {violationWarning && (
        <div className="bg-red-600 text-white text-sm text-center py-2 font-semibold flex items-center justify-center gap-2 animate-pulse">
          <ShieldAlert className="w-4 h-4" /> {violationWarning}
        </div>
      )}
      {violationCount > 0 && ac.max_violations && ac.max_violations > 0 && (
        <div className="bg-amber-100 text-amber-900 text-xs text-center py-1">
          Violations: {violationCount} / {ac.max_violations} · Auto-submit at threshold
        </div>
      )}

      {/* Webcam preview — fixed bottom-right corner */}
      {ac.webcam_required && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl overflow-hidden shadow-lg border-2 border-slate-300 bg-slate-900 w-32 h-24">
          {camStream ? (
            <>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline autoPlay />
              <div className="absolute top-1 left-1 flex items-center gap-1 bg-green-500/90 rounded px-1 py-0.5 text-[9px] text-white font-bold">
                <Camera className="w-2.5 h-2.5" /> REC
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-red-400">
              <CameraOff className="w-6 h-6" />
              <span className="text-[9px] font-bold">No camera</span>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6">
        <QuestionCard
          index={current}
          total={qList.length}
          question={q}
          answer={answers[q.question_id]}
          onAnswer={(a) => saveAnswer(q.question_id, a)}
          examType={attempt.exam_type}
          shuffleOptions={!!quiz?.settings?.shuffle_options}
          saveStatus={saveStatus[q.question_id] ?? 'idle'}
        />

        {/* Navigation */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setCurrent((i) => Math.max(0, i - 1))}
            disabled={current === 0}
            className="btn-secondary disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <div className="flex items-center gap-2 flex-wrap max-w-2xl">
            {qList.map((qq, i) => {
              const done = answers[qq.question_id] !== undefined;
              const active = i === current;
              return (
                <button
                  key={qq.question_id}
                  onClick={() => setCurrent(i)}
                  className={`w-8 h-8 text-xs font-bold rounded flex items-center justify-center border-2 transition ${
                    active ? 'border-brand-500 bg-brand-100 text-brand-700'
                    : done ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                    : 'border-slate-300 bg-white text-slate-500 hover:border-slate-400'
                  }`}
                  title={`Question ${i + 1}${done ? ' — answered' : ''}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {current < qList.length - 1 ? (
            <button onClick={() => setCurrent((i) => i + 1)} className="btn-secondary">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => submitAll(false)} className="btn-primary">
              <Send className="w-4 h-4" /> Submit Exam
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================ *
 * Sub-components
 * ============================================================ */

function InstructionsScreen({ quiz, onBegin }: { quiz: Quiz; onBegin: () => void }) {
  const ac = quiz.anti_cheat_settings ?? {};
  const [agreed, setAgreed] = useState(false);
  const examType = quiz.exam_type;
  return (
    <div className="min-h-screen bg-slate-100 p-6 flex items-center justify-center">
      <div className="card p-4 sm:p-6 lg:p-8 max-w-2xl w-full">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-5 h-5 text-red-600" />
          <span className="text-xs font-semibold uppercase tracking-widest text-red-700">Exam Instructions</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">{quiz.name}</h1>
        {quiz.description && <p className="text-slate-600 mb-5">{quiz.description}</p>}

        <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
          <InfoRow label="Type" value={examType === 'final_certification' ? 'Final Certification (1 attempt)' : examType === 'mock' ? 'Mock Exam' : 'Practice Test'} />
          <InfoRow label="Duration" value={quiz.duration_minutes ? `${quiz.duration_minutes} minutes` : 'No time limit'} />
          <InfoRow label="Questions" value={`${quiz.number_of_questions}`} />
          <InfoRow label="Passing mark" value={`${quiz.passing_mark_percentage}%`} />
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-5">
          <div className="flex items-center gap-2 font-semibold text-red-800 mb-3">
            <ShieldAlert className="w-4 h-4" /> Anti-Cheat Rules — Soma kwa makini
          </div>
          <ul className="text-sm text-red-900 space-y-1.5 list-none">
            <li className="flex items-start gap-2"><span className="text-red-400 font-bold shrink-0">•</span>Kubadilisha tab au dirisha la browser ni ukiukwaji.</li>
            {ac.browser_lock && <>
              <li className="flex items-start gap-2"><span className="text-red-400 font-bold shrink-0">•</span>Mtihani unaendesha katika fullscreen. Kutoka fullscreen ni ukiukwaji.</li>
              <li className="flex items-start gap-2"><span className="text-red-400 font-bold shrink-0">•</span>Vitufe vya DevTools (F12, Ctrl+Shift+I, nk.) vimezuiwa.</li>
              <li className="flex items-start gap-2"><span className="text-red-400 font-bold shrink-0">•</span>Kutoka kwenye dirisha la mtihani kunaandikwa moja kwa moja.</li>
            </>}
            {ac.disable_copy_paste && <li className="flex items-start gap-2"><span className="text-red-400 font-bold shrink-0">•</span>Copy, paste, na cut zimezuiwa. Kuchagua maandishi kumezuiwa.</li>}
            {ac.disable_right_click && <li className="flex items-start gap-2"><span className="text-red-400 font-bold shrink-0">•</span>Right-click / context menu imezuiwa.</li>}
            {ac.webcam_required && <li className="flex items-start gap-2"><span className="text-red-400 font-bold shrink-0">•</span>Kamera inahitajika kwa ufuatiliaji. Picha zinachukuliwa moja kwa moja wakati wa mtihani. Kata kamera = ukiukwaji.</li>}
            {ac.max_violations && ac.max_violations > 0 && (
              <li className="flex items-start gap-2 font-bold"><span className="text-red-600 font-bold shrink-0">⚠</span>Baada ya ukiukwaji {ac.max_violations}, mtihani utawasilishwa moja kwa moja.</li>
            )}
            {quiz.duration_minutes && <li className="flex items-start gap-2"><span className="text-red-400 font-bold shrink-0">•</span>Muda ukiisha, mtihani unawasilishwa moja kwa moja.</li>}
            <li className="flex items-start gap-2 text-green-800"><span className="text-green-600 font-bold shrink-0">✓</span>Majibu yanajihifadhi moja kwa moja. Unaweza kurudi swali lolote kabla ya kuwasilisha.</li>
          </ul>
        </div>

        <label className="flex items-start gap-2 mb-5 p-3 rounded-lg border border-slate-200 cursor-pointer">
          <input type="checkbox" className="w-5 h-5 mt-0.5" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span className="text-sm text-slate-800">
            I understand the rules above and I am ready to start this exam.
          </span>
        </label>

        <button
          onClick={onBegin}
          disabled={!agreed}
          className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" /> Begin Exam
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded p-2">
      <div className="text-[10px] font-semibold uppercase text-slate-500">{label}</div>
      <div className="text-sm font-bold text-slate-800">{value}</div>
    </div>
  );
}

function TimerBadge({ secondsLeft }: { secondsLeft: number | null }) {
  if (secondsLeft === null) return null;
  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;
  const critical = secondsLeft <= 60;
  const warn = secondsLeft <= 300;
  const color = critical ? 'bg-red-100 text-red-700 animate-pulse' : warn ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';
  return (
    <div className={`px-3 py-1 rounded-full font-mono font-bold text-sm flex items-center gap-1 ${color}`}>
      <Timer className="w-4 h-4" />
      {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
    </div>
  );
}

/**
 * Counts down locally from a server-provided seconds_remaining value.
 * When the server sends a new value via heartbeat, the countdown resets.
 * Falls back to computing from deadline_at if serverSeconds is null.
 */
function useCountdownFrom(serverSeconds: number | null, deadlineAt: string | null): number | null {
  const [ticks, setTicks] = useState(0);
  const baseRef = useRef<{ seconds: number; ts: number } | null>(null);

  // Reset base whenever server provides a new value
  useEffect(() => {
    if (serverSeconds !== null) {
      baseRef.current = { seconds: serverSeconds, ts: Date.now() };
      setTicks((t) => t + 1);
    }
  }, [serverSeconds]);

  // Tick every second
  useEffect(() => {
    if (!deadlineAt && serverSeconds === null) return;
    const t = setInterval(() => setTicks((n) => n + 1), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlineAt]);

  if (serverSeconds === null && !deadlineAt) return null;
  // ticks used to force re-render every second
  if (ticks < 0) return null; // never true; silences unused-var warning

  if (baseRef.current) {
    const elapsed = Math.floor((Date.now() - baseRef.current.ts) / 1000);
    return Math.max(0, baseRef.current.seconds - elapsed);
  }

  if (deadlineAt) {
    return Math.max(0, Math.floor((new Date(deadlineAt).getTime() - Date.now()) / 1000));
  }

  return null;
}

function FullScreenLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-brand-600 mb-3" />
      <div className="text-sm text-slate-600">{label}</div>
    </div>
  );
}

/* ============================================================ *
 * Question renderer — handles all 6 SRS types
 * ============================================================ */

function QuestionCard({
  index, total, question, answer, onAnswer, examType, shuffleOptions, saveStatus,
}: {
  index: number; total: number;
  question: AttemptQuestion;
  answer: unknown;
  onAnswer: (a: unknown) => void;
  examType: string | null;
  shuffleOptions: boolean;
  saveStatus: SaveStatus;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-1">
        <div className="text-xs uppercase font-bold tracking-wider text-slate-500">
          Question {index + 1} of {total} · {question.points} pts
        </div>
        {/* Save status badge — the "Saved ✓" indicator */}
        {saveStatus === 'saving' && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Loader2 className="w-3 h-3 animate-spin" /> Saving…
          </span>
        )}
        {saveStatus === 'saved' && (
          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-semibold">
            <CheckCircle2 className="w-3 h-3" /> Saved ✓
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="inline-flex items-center gap-1 text-xs text-red-500">
            <AlertTriangle className="w-3 h-3" /> Save failed — retry
          </span>
        )}
      </div>
      <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-5">{question.text}</h2>

      {question.image_url && (
        <img src={question.image_url} alt="" className="max-w-full h-auto rounded-lg mb-4 border" />
      )}

      <QuestionInput question={question} answer={answer} onAnswer={onAnswer} shuffleOptions={shuffleOptions} />

      {examType === 'practice' && (
        <div className="mt-5 text-xs text-slate-500 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-green-600" /> Answers auto-save. Feedback shown after you submit.
        </div>
      )}
    </div>
  );
}

function QuestionInput({ question, answer, onAnswer, shuffleOptions }: { question: AttemptQuestion; answer: unknown; onAnswer: (a: unknown) => void; shuffleOptions: boolean }) {
  const rawOpts = (question.options ?? []) as Array<{ id?: string; label?: string; left?: string; right?: string }>;
  // Shuffle once per question (stable for the session); matching uses fixed order
  const opts = useMemo(() => {
    if (!shuffleOptions || question.type === 'matching') return rawOpts;
    return shuffleArray(rawOpts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.question_id, shuffleOptions]);

  switch (question.type) {
    case 'multiple_choice':
    case 'true_false':
      return (
        <div className="space-y-2">
          {opts.map((o, i) => {
            const id = String(o.id ?? i);
            const selected = normaliseSingle(answer) === id;
            return (
              <label key={id} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                selected ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300'
              }`}>
                <input
                  type="radio"
                  name={`q-${question.question_id}`}
                  className="w-5 h-5"
                  checked={selected}
                  onChange={() => onAnswer(id)}
                />
                <span className="text-slate-900">{o.label}</span>
              </label>
            );
          })}
        </div>
      );

    case 'multiple_select': {
      const arr = Array.isArray(answer) ? (answer as string[]).map(String) : [];
      return (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">Select all that apply</p>
          {opts.map((o, i) => {
            const id = String(o.id ?? i);
            const checked = arr.includes(id);
            return (
              <label key={id} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                checked ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300'
              }`}>
                <input
                  type="checkbox"
                  className="w-5 h-5"
                  checked={checked}
                  onChange={() => onAnswer(checked ? arr.filter((x) => x !== id) : [...arr, id])}
                />
                <span className="text-slate-900">{o.label}</span>
              </label>
            );
          })}
        </div>
      );
    }

    case 'fill_in_blank':
      return (
        <input
          className="input text-lg"
          placeholder="Type your answer here…"
          value={typeof answer === 'string' ? answer : ''}
          onChange={(e) => onAnswer(e.target.value)}
          autoFocus
        />
      );

    case 'short_answer':
      return (
        <textarea
          rows={5}
          className="input"
          placeholder="Write your answer…"
          value={typeof answer === 'string' ? answer : ''}
          onChange={(e) => onAnswer(e.target.value)}
          autoFocus
        />
      );

    case 'matching': {
      const map = (answer && typeof answer === 'object' && !Array.isArray(answer))
        ? (answer as Record<string, string>) : {};
      const rights = opts.map((o) => o.right ?? '').filter(Boolean);
      return (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">Match each item on the left to one on the right</p>
          {opts.map((o, i) => {
            const key = o.left ?? String(i);
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
                <div className="flex-1 font-semibold text-slate-800">{o.left}</div>
                <span className="text-slate-400">→</span>
                <select
                  className="input flex-1"
                  value={map[key] ?? ''}
                  onChange={(e) => {
                    const next = { ...map, [key]: e.target.value };
                    if (!e.target.value) delete next[key];
                    onAnswer(next);
                  }}
                >
                  <option value="">— pick match —</option>
                  {rights.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            );
          })}
        </div>
      );
    }
  }

  return <p className="text-slate-500 italic">Unsupported question type: {question.type}</p>;
}

function normaliseSingle(v: unknown): string {
  if (Array.isArray(v)) return String(v[0] ?? '');
  if (v === null || v === undefined) return '';
  return String(v);
}

function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
