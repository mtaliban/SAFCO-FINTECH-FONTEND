import { apiRequest } from '@/lib/api';

/** SRS Module 11 — role-specific dashboards. */

export type WindowDays = 7 | 30 | 90 | 365 | null;

/* -------- Student -------- */
export interface StudentDashboard {
  window_days: WindowDays;
  headline: {
    enrolled_count: number;
    completed_count: number;
    avg_score_percent: number | null;
    certificates_earned: number;
  };
  enrollments: Array<{
    course_id: string | null;
    course_title: string | null;
    course_category: string | null;
    thumbnail_url: string | null;
    progress_percentage: number;
    enrolled_at: string | null;
    completed_at: string | null;
  }>;
  score_trend: Array<{
    quiz_name: string;
    percentage: number;
    passed: boolean;
    completed_at: string | null;
  }>;
  recent_activity: Array<{
    type: 'attempt' | 'certificate';
    title: string | null;
    value: string;
    passed?: boolean;
    status?: string;
    at: string | null;
  }>;
}

/* -------- Trainer -------- */
export interface TrainerDashboard {
  window_days: WindowDays;
  headline: {
    active_courses: number;
    total_courses: number;
    student_count: number;
    avg_quiz_score_percent: number | null;
  };
  per_course_students: Array<{
    id: string; title: string; status: string;
    students: number; avg_progress: number;
  }>;
  quiz_performance: Array<{
    id: string; name: string; mode: string; exam_type: string | null; status: string;
    attempts: number; passes: number; pass_rate: number; avg_score: number | null;
  }>;
  category_distribution: Array<{ category: string; count: number }>;
  recent_activity: Array<{
    type: 'enrollment' | 'attempt';
    title: string | null; value: string | null;
    passed?: boolean;
    at: string | null;
  }>;
}

/* -------- Corporate -------- */
export interface CorporateDashboard {
  window_days: WindowDays;
  headline: {
    employees_total: number;
    employees_trained: number;
    completion_percent: number;
    avg_score_percent: number;
    certificates_earned: number;
  };
  by_department: Array<{
    department: string;
    employees: number;
    enrollments: number;
    completed: number;
    avg_progress: number;
    avg_score: number | null;
  }>;
  status_distribution: Array<{ status: string; count: number }>;
  top_performers: Array<{
    id: string; name: string;
    department: string | null;
    attempts: number; avg_score: number;
  }>;
  courses_progress: Array<{
    id: string; title: string; category: string | null;
    enrolled: number; completed: number; in_progress: number;
    avg_progress: number;
  }>;
}

/* -------- Drill-down: employee report -------- */
export interface EmployeeReport {
  employee: {
    id: string; email: string; name: string; department: string | null;
  };
  enrollments: Array<{
    course_id: string | null; course_title: string | null; category: string | null;
    progress: number; enrolled_at: string | null; completed_at: string | null;
  }>;
  attempts: Array<{
    quiz: string | null; mode: string | null;
    percentage: number; passed: boolean; completed_at: string | null;
  }>;
  certificates: Array<{
    cert_number: string; course_title_snapshot: string; status: string;
    issued_at: string | null; revoked_at: string | null;
  }>;
}

/* -------- Drill-down: course roster -------- */
export interface CourseReport {
  course: {
    id: string; title: string; status: string; passing_score: number | null;
  };
  roster: Array<{
    user_id: string | null; email: string | null; name: string;
    department: string | null;
    progress: number;
    enrolled_at: string | null; completed_at: string | null;
    best_score: number | null; passed_final: boolean | null;
  }>;
  headline: {
    enrolled: number; completed: number;
    avg_progress: number; avg_score: number | null;
  };
}

const qs = (days?: WindowDays) => (days ? `?days=${days}` : '');

export const dashboardApi = {
  student: (days?: WindowDays) => apiRequest.get<StudentDashboard>(`/student/dashboard${qs(days)}`),
  trainer: (days?: WindowDays) => apiRequest.get<TrainerDashboard>(`/trainer/dashboard${qs(days)}`),
  corporate: (days?: WindowDays) => apiRequest.get<CorporateDashboard>(`/corporate/dashboard${qs(days)}`),
  employeeReport: (employeeUuid: string) =>
    apiRequest.get<EmployeeReport>(`/corporate/employees/${employeeUuid}/report`),
  courseReport: (courseUuid: string) =>
    apiRequest.get<CourseReport>(`/trainer/courses/${courseUuid}/report`),
};
