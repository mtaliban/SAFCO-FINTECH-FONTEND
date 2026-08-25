import { api, apiRequest } from '@/lib/api';

export type SessionStatus = 'scheduled' | 'open' | 'closed';
export type RecordStatus = 'present' | 'late' | 'absent' | 'excused';
export type CheckInMethod = 'qr' | 'manual' | 'auto';

export interface AttendanceSession {
  uuid: string;
  title: string;
  description: string | null;
  location: string | null;
  course: { uuid: string; title: string } | null;
  trainer: { uuid: string; email: string } | null;
  starts_at: string;
  ends_at: string;
  late_threshold_minutes: number;
  status: SessionStatus;
  opened_at: string | null;
  closed_at: string | null;
  qr_token: string;
  qr_expires_at: string | null;
  records_count: number;
}

export interface AttendanceRecord {
  uuid: string;
  student: { uuid: string; email: string; full_name?: string };
  status: RecordStatus;
  method: CheckInMethod;
  checked_in_at: string | null;
  notes: string | null;
}

export interface SessionDetail extends AttendanceSession {
  records: AttendanceRecord[];
  expected_students: Array<{ uuid: string; email: string; full_name?: string }>;
}

export interface SessionReport {
  session: { uuid: string; title: string; starts_at: string; status: SessionStatus };
  totals: {
    expected: number; checked_in: number;
    present: number; late: number; absent: number; excused: number;
  };
  attendance_percentage: number;
  absentees: Array<{ student: { uuid: string; email: string; full_name?: string } }>;
  records: AttendanceRecord[];
}

type Paginated<T> = { data: T[]; meta: { current_page: number; last_page: number; per_page: number; total: number } };

export const attendanceApi = {
  list: () => apiRequest.get<Paginated<AttendanceSession>>('/attendance-sessions'),
  get: (uuid: string) => apiRequest.get<SessionDetail>(`/attendance-sessions/${uuid}`),
  create: (data: {
    title: string; course_uuid?: string; location?: string;
    starts_at: string; ends_at: string;
    late_threshold_minutes?: number; status?: 'scheduled' | 'open';
  }) => apiRequest.post<AttendanceSession>('/attendance-sessions', data),
  open: (uuid: string) => apiRequest.post<AttendanceSession>(`/attendance-sessions/${uuid}/open`),
  close: (uuid: string) => apiRequest.post<AttendanceSession>(`/attendance-sessions/${uuid}/close`),
  rotateQr: (uuid: string) => apiRequest.post<{ qr_token: string }>(`/attendance-sessions/${uuid}/rotate-qr`),
  qrUrl: (uuid: string) => `/api/proxy/v1/attendance-sessions/${uuid}/qr`,
  mark: (sessionUuid: string, studentUuid: string, status: RecordStatus, notes?: string) =>
    apiRequest.post<AttendanceRecord>(`/attendance-sessions/${sessionUuid}/mark`, {
      student_uuid: studentUuid, status, notes,
    }),
  report: (uuid: string) => apiRequest.get<SessionReport>(`/attendance-sessions/${uuid}/report`),
  destroy: (uuid: string) => apiRequest.delete<null>(`/attendance-sessions/${uuid}`),
  checkIn: (token: string) =>
    apiRequest.post<{ status: RecordStatus; session: { title: string; location: string | null }; checked_in_at: string }>(
      '/attendance/check-in', { token }
    ),
};

/** Auth token needed by <img src> fetches — Next.js image can't set headers. */
export function qrSvgUrl(sessionUuid: string): string {
  return attendanceApi.qrUrl(sessionUuid);
}
