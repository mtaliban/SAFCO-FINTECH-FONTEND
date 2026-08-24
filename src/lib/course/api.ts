import { api, apiRequest } from '@/lib/api';

export const CATEGORIES = [
  'microsoft_office', 'excel', 'power_query', 'power_bi',
  'accounting', 'finance', 'ifrs', 'erp_systems',
  'coding', 'data_analytics', 'general',
] as const;
export type Category = typeof CATEGORIES[number];

export const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
export type Level = typeof LEVELS[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  microsoft_office: 'Microsoft Office',
  excel: 'Excel',
  power_query: 'Power Query',
  power_bi: 'Power BI',
  accounting: 'Accounting',
  finance: 'Finance',
  ifrs: 'IFRS',
  erp_systems: 'ERP Systems',
  coding: 'Coding',
  data_analytics: 'Data Analytics',
  general: 'General',
};

export type CourseStatus = 'draft' | 'pending_approval' | 'published' | 'rejected' | 'archived';

export interface Course {
  uuid: string;
  slug: string;
  title: string;
  description: string | null;
  category: Category;
  level: Level;
  duration_hours: number | null;
  thumbnail_url: string | null;
  status: CourseStatus;
  rejection_reason: string | null;
  instructor?: { uuid: string; email: string; name: string | null };
  stats: { modules: number; enrollments: number };
  published_at: string | null;
  approved_at: string | null;
  created_at: string;
  modules?: CourseModule[];
  final_assessment?: { uuid: string; name: string; status: string } | null;
}

export interface AttachedQuiz {
  uuid: string; name: string; status: string; mode: string; number_of_questions: number;
}

export interface AssignmentBrief {
  /** Short-lived signed absolute URL (~30 min TTL) to the private brief file. */
  download_url: string;
  file_name: string;
  file_size: number;
  mime_type: string | null;
  expires_in_minutes?: number;
}

export interface Assignment {
  uuid: string;
  title: string;
  instructions?: string | null;
  brief?: AssignmentBrief | null;
  max_points: number;
  due_date: string | null;
  allowed_file_types?: string[] | null;
  lesson_uuid?: string;
  // Populated by student /assignments list only
  course?: { id: string; title: string } | null;
  lesson?: { id: string; title: string } | null;
  my_status?: 'pending' | 'submitted' | 'graded' | 'returned' | 'overdue';
  my_grade?: number | null;
  my_submitted_at?: string | null;
}

/** SRS Module 9 allowed answer/brief file extensions. */
export const ASSIGNMENT_ALLOWED_EXT = ['pdf', 'xlsx', 'xls', 'docx', 'doc', 'zip'] as const;
export const ASSIGNMENT_ACCEPT_ATTR = '.pdf,.xlsx,.xls,.docx,.doc,.zip';
export const ASSIGNMENT_MAX_MB = 25;

export interface CourseModule {
  uuid: string;
  title: string;
  description: string | null;
  position: number;
  lessons?: Lesson[];
  quizzes?: AttachedQuiz[];
}

export interface Lesson {
  uuid: string;
  title: string;
  description: string | null;
  content?: string | null;
  video_url: string | null;
  pdf_url: string | null;
  duration_seconds: number | null;
  position: number;
  assignments?: Assignment[];
  materials?: LessonMaterial[];
}

export type MaterialType =
  | 'document_pdf' | 'document_word' | 'document_excel' | 'document_powerpoint'
  | 'video_mp4' | 'video_youtube' | 'video_vimeo'
  | 'interactive_scorm' | 'interactive_html5';

export interface LessonMaterial {
  uuid: string;
  type: MaterialType;
  category: 'documents' | 'videos' | 'interactive';
  title: string;
  description: string | null;
  url: string;
  mime_type: string | null;
  file_size: number | null;
  position: number;
  metadata: Record<string, unknown> | null;
  processing_status?: 'pending' | 'processing' | 'ready' | 'failed';
  processing_progress?: number;
  processing_error?: string | null;
  thumbnail_url?: string | null;
  duration_seconds?: number | null;
  page_count?: number | null;
  width?: number | null;
  height?: number | null;
  stream_url?: string | null;
}

export const MATERIAL_TYPE_LABEL: Record<MaterialType, string> = {
  document_pdf: 'PDF',
  document_word: 'Word',
  document_excel: 'Excel',
  document_powerpoint: 'PowerPoint',
  video_mp4: 'Video (MP4)',
  video_youtube: 'YouTube',
  video_vimeo: 'Vimeo',
  interactive_scorm: 'SCORM',
  interactive_html5: 'HTML5',
};

export interface Instructor { uuid: string; email: string; name: string }
export interface Submission {
  uuid: string;
  student: { uuid: string; email: string; name?: string | null };
  answer_text: string | null;
  file_url: string | null;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  submitted_at: string;
  status: 'submitted' | 'graded' | 'returned';
  grade: number | null;
  feedback: string | null;
  graded_at: string | null;
}

export interface Enrollment {
  uuid: string;
  progress_percentage: number;
  enrolled_at: string;
  completed_at: string | null;
  course: {
    uuid: string; slug: string; title: string;
    category: Category; thumbnail_url: string | null;
    duration_hours: number | null;
  };
}

type Paginated<T> = { data: T[]; meta: { current_page: number; last_page: number; per_page: number; total: number } };

export const courseApi = {
  list: (params: Record<string, string> = {}) =>
    apiRequest.get<Paginated<Course>>('/courses', { params }),
  get: (uuid: string) => apiRequest.get<Course>(`/courses/${uuid}`),
  create: (data: Partial<Course>) => apiRequest.post<Course>('/courses', data),
  update: (uuid: string, data: Partial<Course>) => apiRequest.patch<Course>(`/courses/${uuid}`, data),
  submit: (uuid: string) => apiRequest.post<Course>(`/courses/${uuid}/submit`),
  destroy: (uuid: string) => apiRequest.delete<null>(`/courses/${uuid}`),
  uploadThumbnail: (uuid: string, file: File) => {
    const fd = new FormData();
    fd.append('thumbnail', file);
    return api.post(`/courses/${uuid}/thumbnail`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data as { thumbnail_url: string });
  },
};

export const moduleApi = {
  create: (courseUuid: string, data: Partial<CourseModule>) =>
    apiRequest.post<CourseModule>(`/courses/${courseUuid}/modules`, data),
  update: (uuid: string, data: Partial<CourseModule>) =>
    apiRequest.patch<CourseModule>(`/modules/${uuid}`, data),
  destroy: (uuid: string) => apiRequest.delete<null>(`/modules/${uuid}`),
  attachQuiz: (moduleUuid: string, quizUuid: string) =>
    apiRequest.post(`/modules/${moduleUuid}/attach-quiz`, { quiz_uuid: quizUuid }),
  detachQuiz: (quizUuid: string) =>
    apiRequest.post(`/quizzes/${quizUuid}/detach`),
  reorder: (courseUuid: string, order: string[]) =>
    apiRequest.post(`/courses/${courseUuid}/reorder-modules`, { order }),
  reorderLessons: (moduleUuid: string, order: string[]) =>
    apiRequest.post(`/modules/${moduleUuid}/reorder-lessons`, { order }),
};

export const assignmentApi = {
  create: (lessonUuid: string, data: Partial<Assignment>) =>
    apiRequest.post<Assignment>(`/lessons/${lessonUuid}/assignments`, data),
  update: (uuid: string, data: Partial<Assignment>) =>
    apiRequest.patch<Assignment>(`/assignments/${uuid}`, data),
  destroy: (uuid: string) => apiRequest.delete<null>(`/assignments/${uuid}`),
  get: (uuid: string) =>
    apiRequest.get<{ assignment: Assignment; my_submission: Submission | null; submission_count: number | null }>(
      `/assignments/${uuid}`,
    ),
  studentIndex: () => apiRequest.get<Assignment[]>('/student/assignments'),
  submissions: (uuid: string) =>
    apiRequest.get<{ data: Submission[] }>(`/assignments/${uuid}/submissions`),
  uploadBrief: (uuid: string, file: File, onProgress?: (pct: number) => void) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/assignments/${uuid}/brief`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => { if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100)); },
    }).then((r) => r.data.data as Assignment);
  },
  deleteBrief: (uuid: string) => apiRequest.delete<Assignment>(`/assignments/${uuid}/brief`),
  submit: (uuid: string, body: { answer_text?: string; file?: File }, onProgress?: (pct: number) => void) => {
    const fd = new FormData();
    if (body.answer_text) fd.append('answer_text', body.answer_text);
    if (body.file) fd.append('file', body.file);
    return api.post(`/assignments/${uuid}/submit`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => { if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100)); },
    }).then((r) => r.data.data as Submission);
  },
  grade: (submissionUuid: string, grade: number, feedback?: string) =>
    apiRequest.post<Submission>(`/submissions/${submissionUuid}/grade`, { grade, feedback }),
};

export const instructorApi = {
  list: () => apiRequest.get<{ data: Instructor[] }>('/instructors'),
};

export const materialApi = {
  addUrl: (lessonUuid: string, data: { title: string; url: string; type?: MaterialType; description?: string }) =>
    apiRequest.post<LessonMaterial>(`/lessons/${lessonUuid}/materials`, data),
  upload: (lessonUuid: string, title: string, file: File, type?: MaterialType, onProgress?: (pct: number) => void) => {
    const fd = new FormData();
    fd.append('title', title);
    fd.append('file', file);
    if (type) fd.append('type', type);
    return api.post(`/lessons/${lessonUuid}/materials`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    }).then((r) => r.data.data as LessonMaterial);
  },
  destroy: (uuid: string) => apiRequest.delete<null>(`/materials/${uuid}`),
};

export const lessonApi = {
  create: (moduleUuid: string, data: Partial<Lesson>) =>
    apiRequest.post<Lesson>(`/modules/${moduleUuid}/lessons`, data),
  update: (uuid: string, data: Partial<Lesson>) =>
    apiRequest.patch<Lesson>(`/lessons/${uuid}`, data),
  destroy: (uuid: string) => apiRequest.delete<null>(`/lessons/${uuid}`),
  markComplete: (uuid: string) => apiRequest.post<{ progress_percentage: number; completed: boolean }>(`/lessons/${uuid}/mark-complete`),
};

export const enrollmentApi = {
  enroll: (courseUuid: string) => apiRequest.post<Enrollment>(`/courses/${courseUuid}/enroll`),
  myEnrollments: () => apiRequest.get<Paginated<Enrollment>>('/student/my-enrollments'),
};

export const adminCoursesApi = {
  pending: () => apiRequest.get<Paginated<Course>>('/admin/course-approvals'),
  approve: (uuid: string) => apiRequest.post(`/admin/courses/${uuid}/approve`),
  reject: (uuid: string, reason: string) => apiRequest.post(`/admin/courses/${uuid}/reject`, { reason }),
};
