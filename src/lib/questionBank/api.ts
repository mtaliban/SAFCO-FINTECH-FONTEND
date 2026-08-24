import { api, apiRequest } from '@/lib/api';

export const QUESTION_TYPES = [
  'multiple_choice',
  'true_false',
  'multiple_select',
  'fill_in_blank',
  'matching',
  'short_answer',
] as const;
export type QuestionType = typeof QUESTION_TYPES[number];

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  multiple_choice: 'Multiple Choice',
  true_false: 'True / False',
  multiple_select: 'Multiple Select',
  fill_in_blank: 'Fill in the Blank',
  matching: 'Matching',
  short_answer: 'Short Answer',
};

export interface QuestionBank {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  difficulty: string;
  is_public: boolean;
  total_questions: number;
  questions_count?: number;
  created_at: string;
}

export interface QuestionOption {
  id: string; label: string; color?: string; shape?: string;
}
export interface MatchingPair {
  id?: string; left: string; right: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  explanation?: string | null;
  image_url?: string | null;
  options: QuestionOption[] | MatchingPair[] | null;
  correct_answer?: unknown;
  points: number;
  time_limit_seconds: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[] | null;
  metadata?: Record<string, unknown> | null;
}

type Paginated<T> = { data: T[]; meta: { current_page: number; last_page: number; per_page: number; total: number } };

export const questionBankApi = {
  list: (params: Record<string, string> = {}) =>
    apiRequest.get<Paginated<QuestionBank>>('/question-banks', { params }),
  get: (uuid: string) => apiRequest.get<QuestionBank & { questions: Question[] }>(`/question-banks/${uuid}`),
  create: (data: Partial<QuestionBank>) => apiRequest.post<QuestionBank>('/question-banks', data),
  listQuestions: (bankUuid: string, params: Record<string, string> = {}) =>
    apiRequest.get<Paginated<Question>>(`/question-banks/${bankUuid}/questions`, { params }),
  createQuestion: (bankUuid: string, data: Partial<Question>) =>
    apiRequest.post<Question>(`/question-banks/${bankUuid}/questions`, data),
  updateQuestion: (uuid: string, data: Partial<Question>) =>
    apiRequest.patch<Question>(`/questions/${uuid}`, data),
  deleteQuestion: (uuid: string) => apiRequest.delete<null>(`/questions/${uuid}`),
};
