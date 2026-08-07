import { api, apiRequest } from '@/lib/api';

export interface Quiz {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  mode: 'self_paced' | 'live_kahoot' | 'exam';
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
  longest_streak: number;
}

/* ---------- QUIZ CRUD (trainer/admin) ---------- */
export const quizApi = {
  list: (params: Record<string, string | number> = {}) => api.get('/quizzes', { params }).then((r) => r.data.data),
  create: (data: Partial<Quiz>) => apiRequest.post<Quiz>('/quizzes', data),
  get: (uuid: string) => apiRequest.get<Quiz>(`/quizzes/${uuid}`),
  update: (uuid: string, data: Partial<Quiz>) => apiRequest.patch<Quiz>(`/quizzes/${uuid}`, data),
  delete: (uuid: string) => apiRequest.delete<null>(`/quizzes/${uuid}`),
  syncQuestions: (uuid: string, questions: Array<{ question_id: number; position: number }>) =>
    apiRequest.post<Quiz>(`/quizzes/${uuid}/questions/sync`, { questions }),
  publish: (uuid: string) => apiRequest.post<Quiz>(`/quizzes/${uuid}/publish`),
  host: (uuid: string, mode: 'classic' | 'team' = 'classic') =>
    apiRequest.post<QuizSession>(`/quizzes/${uuid}/host`, { mode }),
};

/* ---------- LIVE SESSION HOST ---------- */
export const sessionApi = {
  startQuestion: (uuid: string) => apiRequest.post(`/sessions/${uuid}/start-question`),
  endQuestion: (uuid: string) => apiRequest.post(`/sessions/${uuid}/end-question`),
  complete: (uuid: string) => apiRequest.post(`/sessions/${uuid}/complete`),
  leaderboard: (uuid: string) => apiRequest.get<LeaderboardEntry[]>(`/sessions/${uuid}/leaderboard`),
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
