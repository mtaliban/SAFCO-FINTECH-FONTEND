import { api, apiRequest } from '@/lib/api';

export interface AiGeneratedQuestion {
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_in_blank';
  options: Array<{ label: string; is_correct: boolean }>;
  correct_answer: unknown;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  time_limit_seconds: number;
  tags: string[];
}

export interface GenerateTextPayload {
  source_type: 'text' | 'topic';
  text?: string;
  topic?: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_in_blank' | 'mixed';
  count: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  language: 'en' | 'sw';
}

export interface TutorMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GradePayload {
  assignment_title: string;
  assignment_instructions?: string;
  student_answer: string;
  max_points: number;
}

export interface GradeResult {
  suggested_grade: number;
  percentage: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export const aiApi = {
  generateFromFile: async (
    file: File,
    params: { question_type: string; count: number; difficulty: string; language: string },
  ): Promise<{ questions: AiGeneratedQuestion[] }> => {
    const form = new FormData();
    form.append('file', file);
    form.append('source_type', 'file');
    form.append('question_type', params.question_type);
    form.append('count', String(params.count));
    form.append('difficulty', params.difficulty);
    form.append('language', params.language);
    const res = await api.post<{ data: { questions: AiGeneratedQuestion[] } }>(
      '/ai/generate-questions',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return res.data.data;
  },

  generateFromText: (payload: GenerateTextPayload) =>
    apiRequest.post<{ questions: AiGeneratedQuestion[] }>('/ai/generate-questions', payload),

  tutorChat: (messages: TutorMessage[], context?: { course?: string; lesson?: string; topic?: string }) =>
    apiRequest.post<{ reply: string }>('/ai/tutor', { messages, context }),

  gradeSubmission: (payload: GradePayload) =>
    apiRequest.post<GradeResult>('/ai/grade', payload),
};
