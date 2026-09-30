import axios, { AxiosInstance } from 'axios';
import Cookies from 'js-cookie';
import { TOKEN_KEY } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';

// Separate axios instance for V2 exam endpoints (/api/v2/...)
export const api2: AxiosInstance = axios.create({
  baseURL: `${API_URL}/v2`,
  timeout: 30_000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  withCredentials: false,
});

api2.interceptors.request.use((config) => {
  const token = Cookies.get(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Re-use same 401 redirect as v1
api2.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      Cookies.remove(TOKEN_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

/* ─── Types ──────────────────────────────────────────────────────── */

export type ExamState =
  | 'in_progress' | 'submitted' | 'graded'
  | 'result_held' | 'result_released' | 'under_review' | 'invalidated'
  | 'terminated' | 'suspended';

export interface ExamQuestion {
  question_id: string;      // uuid
  type: string;
  text: string;
  image_url?: string | null;
  options: Array<{ id: string; label: string } | string>;
  points: number;
  time_limit_seconds: number;
  my_answer?: unknown;
  my_sequence?: number;
}

export interface ExamTakingPayload {
  attempt_id: string;
  state: ExamState;
  exam_type: 'practice' | 'mock' | 'final_certification';
  started_at: string;
  deadline_at: string | null;
  seconds_remaining: number | null;
  progress: { answered: number; total: number };
  violations_count: number;
  questions: ExamQuestion[];
  session_token?: string;
}

export interface HeartbeatResponse {
  state: ExamState;
  seconds_remaining: number | null;
  deadline_at: string | null;
}

export interface AnswerResponse {
  saved: boolean;
  sequence: number;
  progress: { answered: number; total: number };
  is_correct?: boolean;
  points_earned?: number;
}

export interface ExamResultPayload {
  attempt_id: string;
  state: ExamState;
  exam_type: string;
  passed: boolean;
  percentage: number;
  passing_mark_percentage: number;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  unanswered: number;
  total_score: number;
  max_possible_score: number;
  duration_seconds: number;
  end_reason: string | null;
  completed_at: string | null;
  review: null | Array<{
    question_id: string;
    text: string;
    type: string;
    options: unknown[];
    correct_answer: unknown;
    my_answer: unknown;
    is_correct: boolean;
    explanation?: string;
    points_earned: number;
    points_possible: number;
  }>;
  quiz: { id: string; name: string };
}

/* ─── API calls ──────────────────────────────────────────────────── */

const unwrap = <T>(p: Promise<{ data: { data: T } }>) => p.then((r) => r.data.data);

export const examApi = {
  start: (quizUuid: string, deviceFingerprint?: string) =>
    unwrap<ExamTakingPayload>(
      api2.post(`quizzes/${quizUuid}/exam`, { device_fingerprint: deviceFingerprint ?? '' })
    ),

  show: (attemptUuid: string, sessionToken: string) =>
    unwrap<ExamTakingPayload | ExamResultPayload>(
      api2.get(`exam-attempts/${attemptUuid}`, {
        headers: { 'X-Exam-Session': sessionToken },
      })
    ),

  heartbeat: (attemptUuid: string, sessionToken: string) =>
    unwrap<HeartbeatResponse>(
      api2.post(
        `exam-attempts/${attemptUuid}/heartbeat`,
        {},
        { headers: { 'X-Exam-Session': sessionToken } }
      )
    ),

  answer: (
    attemptUuid: string,
    sessionToken: string,
    questionId: string,
    answer: unknown,
    sequenceNumber: number
  ) =>
    unwrap<AnswerResponse>(
      api2.post(
        `exam-attempts/${attemptUuid}/answer`,
        { question_id: questionId, answer, sequence_number: sequenceNumber },
        { headers: { 'X-Exam-Session': sessionToken } }
      )
    ),

  submit: (attemptUuid: string) =>
    unwrap<ExamResultPayload>(api2.post(`exam-attempts/${attemptUuid}/submit`)),

  violation: (
    attemptUuid: string,
    sessionToken: string,
    type: string,
    meta?: Record<string, unknown>
  ) =>
    unwrap<{ violations_count: number; state: ExamState }>(
      api2.post(
        `exam-attempts/${attemptUuid}/violation`,
        { type, meta: meta ?? {} },
        { headers: { 'X-Exam-Session': sessionToken } }
      )
    ),
};
