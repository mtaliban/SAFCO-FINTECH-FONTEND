import { api, apiRequest } from '@/lib/api';

export type ExamType = 'practice' | 'mock' | 'final_certification';

export interface AntiCheatSettings {
  browser_lock?: boolean;
  disable_copy_paste?: boolean;
  disable_right_click?: boolean;
  tab_switch_limit?: number;
  max_violations?: number;
  webcam_required?: boolean;
}

export interface Quiz {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  mode: 'self_paced' | 'live_kahoot' | 'exam';
  exam_type?: ExamType | null;
  category: string;
  difficulty: string;
  duration_minutes: number | null;
  number_of_questions: number;
  passing_mark_percentage: number;
  max_attempts: number;
  default_time_per_question: number;
  status: 'draft' | 'published' | 'archived';
  settings: {
    shuffle_questions: boolean;
    shuffle_options: boolean;
    show_correct_after_each: boolean;
    show_leaderboard: boolean;
    award_bonus_for_speed: boolean;
    allow_late_join: boolean;
  };
  anti_cheat_settings?: AntiCheatSettings | null;
  stats: { total_plays: number; avg_score: number };
  questions?: Question[];
  creator?: { id: string; name: string };
  published_at: string | null;
  created_at: string;
}

export interface Question {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'multiple_select' | 'fill_in_blank' | 'matching' | 'short_answer';
  text: string;
  explanation: string | null;
  image_url: string | null;
  options: QuestionOption[] | null;
  correct_answer?: unknown;
  points: number;
  time_limit_seconds: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[] | null;
}

export interface QuestionOption {
  id: string;
  label: string;
  color?: string;
  shape?: string;
}

export interface QuizSession {
  id: string;
  pin: string;
  quiz: { id: string; name: string };
  mode: 'classic' | 'team';
  status: string;
  total_questions: number;
  participant_count: number;
  current_question_index: number;
  current_question_started_at: string | null;
  current_question_ends_at: string | null;
  realtime_topic: string;
  started_at: string | null;
  ended_at: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  participant_id: string;
  nickname: string;
  avatar_url: string | null;
  total_score: number;
  correct_answers: number;
  incorrect_answers?: number;
  current_streak?: number;
  longest_streak: number;
  is_late_join?: boolean;
}

/* ---------- QUIZ CRUD (trainer/admin) ---------- */

/**
 * Flat form of quiz settings used by the "New/Edit Quiz" form.
 * Booleans live at settings.* in the wire format but are flat in the request body.
 */
export interface QuizFormPayload {
  name: string;
  description?: string | null;
  mode?: Quiz['mode'];
  exam_type?: ExamType | null;
  category?: string;
  difficulty?: string;
  duration_minutes?: number | null;
  number_of_questions?: number;
  passing_mark_percentage?: number;
  max_attempts?: number;
  default_time_per_question?: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  show_correct_after_each?: boolean;
  show_leaderboard?: boolean;
  award_bonus_for_speed?: boolean;
  allow_late_join?: boolean;
  anti_cheat_settings?: AntiCheatSettings | null;
  randomize_from_bank_id?: number | null;
}

export const quizApi = {
  list: (params: Record<string, string | number> = {}) => api.get('/quizzes', { params }).then((r) => r.data.data),
  create: (data: QuizFormPayload) => apiRequest.post<Quiz>('/quizzes', data),
  get: (uuid: string) => apiRequest.get<Quiz>(`/quizzes/${uuid}`),
  update: (uuid: string, data: QuizFormPayload) => apiRequest.patch<Quiz>(`/quizzes/${uuid}`, data),
  delete: (uuid: string) => apiRequest.delete<null>(`/quizzes/${uuid}`),
  syncQuestions: (uuid: string, questions: Array<{ question_id: number | string; position: number }>) =>
    apiRequest.post<Quiz>(`/quizzes/${uuid}/questions/sync`, { questions }),
  attachQuestions: (uuid: string, questionUuids: string[]) =>
    apiRequest.post<{ attached: number; total_questions: number; quiz: Quiz }>(
      `/quizzes/${uuid}/attach-questions`, { question_uuids: questionUuids },
    ),
  attachRandom: (uuid: string, bankUuid: string, count: number, filters: { type?: string; difficulty?: string } = {}) =>
    apiRequest.post<{ attached: number; requested: number; total_questions: number; quiz: Quiz }>(
      `/quizzes/${uuid}/attach-random`,
      { bank_uuid: bankUuid, count, ...filters },
    ),
  detachQuestions: (uuid: string, questionUuids: string[]) =>
    apiRequest.post<{ detached: number; total_questions: number; quiz: Quiz }>(
      `/quizzes/${uuid}/detach-questions`, { question_uuids: questionUuids },
    ),
  reorderQuestions: (uuid: string, orderedUuids: string[]) =>
    apiRequest.post<Quiz>(`/quizzes/${uuid}/reorder-questions`, { order: orderedUuids }),
  duplicate: (uuid: string) => apiRequest.post<Quiz>(`/quizzes/${uuid}/duplicate`),
  publish: (uuid: string) => apiRequest.post<Quiz>(`/quizzes/${uuid}/publish`),
  host: (uuid: string, mode: 'classic' | 'team' = 'classic') =>
    apiRequest.post<QuizSession>(`/quizzes/${uuid}/host`, { mode }),
};

/* ---------- LIVE SESSION HOST ---------- */

export interface LiveQuestionOption { id: string; label: string; color?: string | null; shape?: string | null }
export interface LiveEndQuestionPayload {
  question: {
    id: string;
    text: string;
    type: string;
    options: LiveQuestionOption[] | null;
    explanation?: string | null;
  };
  correct_answer: unknown;
  stats: {
    total_answers: number;
    correct_count: number;
    incorrect_count: number;
    correct_rate_percent: number;
    avg_response_time_ms: number;
    distribution: Record<string, number>;
  };
}
export interface LiveParticipant {
  id: string; nickname: string; avatar_url: string | null;
  total_score: number; correct_answers: number;
  is_late_join: boolean; is_connected: boolean;
  joined_at: string | null;
}
export interface LiveAnswerCount { answered: number; total: number; question_index: number }

export const sessionApi = {
  startQuestion: (uuid: string) => apiRequest.post(`/sessions/${uuid}/start-question`),
  endQuestion: (uuid: string) => apiRequest.post<LiveEndQuestionPayload>(`/sessions/${uuid}/end-question`),
  complete: (uuid: string) =>
    apiRequest.post<{ session_pin: string; final_leaderboard: LeaderboardEntry[] }>(`/sessions/${uuid}/complete`),
  leaderboard: (uuid: string, limit = 10) =>
    apiRequest.get<LeaderboardEntry[]>(`/sessions/${uuid}/leaderboard`, { params: { limit } }),
  participants: (uuid: string) =>
    apiRequest.get<{ count: number; participants: LiveParticipant[] }>(`/sessions/${uuid}/participants`),
  answerCount: (uuid: string) => apiRequest.get<LiveAnswerCount>(`/sessions/${uuid}/answer-count`),
};

/* ---------- EXAM / ATTEMPT (SRS Module 8) ---------- */

export interface AttemptQuestion {
  question_id: string;
  type: string;
  text: string;
  image_url?: string | null;
  options: Array<{ id?: string; label?: string; left?: string; right?: string; color?: string; shape?: string }> | null;
  points: number;
  time_limit_seconds: number;
  my_answer: unknown;
}

export interface AttemptState {
  attempt_id: string;
  status: 'in_progress' | 'completed' | 'expired' | 'abandoned';
  exam_type: ExamType | null;
  started_at: string | null;
  expires_at: string | null;
  seconds_remaining: number | null;
  progress: { answered: number; total: number };
  violations_count: number;
  questions: AttemptQuestion[];
}

export interface AttemptSummary {
  attempt_id: string;
  status: 'completed' | 'expired' | 'abandoned' | 'in_progress';
  exam_type: ExamType | null;
  passed: boolean;
  percentage: number;
  passing_mark_percentage: number;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  unanswered: number;
  total_score: number;
  max_possible_score: number;
  duration_seconds: number | null;
  auto_submit_reason: string | null;
  violations: Array<{ type: string; at: string; meta?: Record<string, unknown> }>;
  completed_at: string | null;
  review?: Array<{
    question_id: string; text: string; type: string;
    options: unknown; correct_answer: unknown; my_answer: unknown;
    is_correct: boolean; explanation: string | null;
    points_earned: number; points_possible: number;
  }> | null;
  quiz: { id: string; name: string; exam_type: ExamType | null };
  certificate?: { id: string; cert_number: string; status: string } | null;
}

export interface AvailableExam {
  id: string; name: string; description: string | null;
  category: string; difficulty: string; exam_type: ExamType;
  duration_minutes: number | null;
  number_of_questions: number;
  passing_mark_percentage: number;
  max_attempts: number;
  attempts_remaining: number | null; // null = unlimited (practice)
  best_result: {
    percentage: number; passed: boolean;
    completed_at: string | null; attempt_id: string;
  } | null;
  anti_cheat_settings: AntiCheatSettings | null;
}

export interface MyAttemptRow {
  id: string; attempt_number: number;
  status: 'in_progress' | 'completed' | 'expired' | 'abandoned';
  exam_type: ExamType | null;
  total_questions: number; correct_answers: number;
  percentage: number; passed: boolean;
  duration_seconds: number | null;
  started_at: string | null; completed_at: string | null;
  auto_submit_reason: string | null;
  quiz: {
    id: string; name: string; mode: string;
    exam_type: ExamType | null; category: string;
    passing_mark_percentage: number;
  } | null;
}

export const attemptApi = {
  availableExams: () => apiRequest.get<AvailableExam[]>('/student/exams'),
  start: (quizUuid: string) =>
    apiRequest.post<AttemptState>(`/quizzes/${quizUuid}/attempts`),
  get: (attemptUuid: string) =>
    apiRequest.get<AttemptState | AttemptSummary>(`/attempts/${attemptUuid}`),
  answer: (attemptUuid: string, questionId: string, answer: unknown) =>
    apiRequest.post<{
      is_correct: boolean; points_earned: number;
      progress: { answered: number; total: number };
      total_score: number; percentage: number;
    }>(`/attempts/${attemptUuid}/answer`, { question_id: questionId, answer }),
  complete: (attemptUuid: string) =>
    apiRequest.post<AttemptSummary>(`/attempts/${attemptUuid}/complete`),
  violation: (attemptUuid: string, type: string, meta?: Record<string, unknown>) =>
    apiRequest.post<{ violations_count: number; status: string; auto_submit_reason: string | null }>(
      `/attempts/${attemptUuid}/violation`, { type, meta: meta ?? {} },
    ),
  myAttempts: (params: Record<string, string> = {}) =>
    apiRequest.get<{ data: MyAttemptRow[]; meta: { total: number } }>('/student/my-attempts', { params }),
};

/* ---------- STUDENT PLAY (public) ---------- */
export const playApi = {
  join: (pin: string, nickname: string) =>
    apiRequest.post<{
      session: { pin: string; quiz_name: string; total_questions: number; status: string };
      participant: { id: string; nickname: string; total_participants: number };
    }>('/play/join', { pin, nickname }),
  sessionState: (pin: string) => apiRequest.get<{
    pin: string; quiz_name: string; status: string; participant_count: number;
    total_questions: number; current_question_index: number;
    current_question_ends_at: string | null; realtime_topic: string;
  }>(`/play/session/${pin}`),
  submitAnswer: (pin: string, participantId: string, answer: unknown) =>
    apiRequest.post<{
      is_correct: boolean; points_earned: number; speed_bonus: number;
      streak_bonus: number; current_streak: number; total_score: number;
      response_time_ms: number; answered_at_position: number;
    }>(`/play/session/${pin}/answer`, { participant_id: participantId, answer }),
};
