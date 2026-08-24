import { apiRequest } from '@/lib/api';

/** SRS Module 13 — Certified Trainer Portal API types + client. */

export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type AvailabilityStatus = 'available' | 'busy' | 'unavailable';

export interface TrainerDirectoryEntry {
  slug: string;
  name: string;
  headline: string | null;
  avatar: string | null;
  years_experience: number | null;
  expertise_areas: string[];
  is_verified: boolean;
  rating_avg: number | null;
  rating_count: number;
  students_taught: number;
  availability_status: AvailabilityStatus;
}

export interface TrainerPublicProfile {
  slug: string;
  name: string;
  headline: string | null;
  bio_long: string | null;
  avatar: string | null;
  cover: string | null;
  years_experience: number | null;
  expertise_areas: string[];
  teaching_languages: string[];
  timezone: string;
  hourly_rate_tzs: number | null;
  availability_status: AvailabilityStatus;
  is_verified: boolean;
  verified_at: string | null;
  rating_avg: number | null;
  rating_count: number;
  students_taught: number;
  public_email: string | null;
  qualifications: Array<{
    id: string; institution: string; degree: string;
    field_of_study: string | null;
    start_year: number | null; end_year: number | null;
  }>;
  certifications: Array<{
    id: string; name: string; issuer: string;
    credential_id: string | null; verification_url: string | null;
    issue_date: string | null; expiry_date: string | null;
    is_expired: boolean; is_expiring_soon: boolean;
  }>;
  experiences: Array<{
    id: string; title: string; company: string;
    location: string | null;
    start_date: string; end_date: string | null;
    is_current: boolean; duration_years: number;
    description: string | null;
  }>;
  courses: Array<{
    id: string; title: string; category: string;
    thumbnail_url: string | null;
    enrollments_count: number; price_tzs: number | null;
  }>;
  reviews: Array<{
    id: string; rating: number; text: string | null;
    student_name: string; course_title: string | null;
    at: string;
  }>;
}

export interface DirectoryQuery {
  q?: string;
  expertise?: string;
  verified_only?: boolean;
  min_rating?: number;
  sort?: 'rating' | 'newest' | 'experience';
  page?: number;
}

export interface MyTrainerPortal {
  profile: {
    slug: string;
    headline: string | null;
    bio_long: string | null;
    years_experience: number | null;
    expertise_areas: string[];
    teaching_languages: string[];
    timezone: string;
    hourly_rate_tzs: number | null;
    availability_status: AvailabilityStatus;
    is_public: boolean;
    is_verified: boolean;
    verified_at: string | null;
    rating_avg: number | null;
    rating_count: number;
    students_taught: number;
    accepts_direct_inquiries: boolean;
    public_email: string | null;
  };
  qualifications: Array<QualificationSummary>;
  certifications: Array<CertificationSummary>;
  experiences: Array<ExperienceSummary>;
  courses: Array<CourseDeliveredSummary>;
}

export interface CourseDeliveredSummary {
  id: string;
  title: string;
  slug: string;
  category: string;
  level: string;
  status: string;
  thumbnail_url: string | null;
  enrollments_count: number;
  price_tzs: number | null;
  created_at: string | null;
}

export interface QualificationSummary {
  id: string; institution: string; degree: string;
  field_of_study: string | null;
  start_year: number | null; end_year: number | null;
  verification_status: VerificationStatus;
  rejection_reason: string | null;
  has_proof: boolean;
  proof_file_name: string | null;
}

export interface CertificationSummary {
  id: string; name: string; issuer: string;
  credential_id: string | null; verification_url: string | null;
  issue_date: string | null; expiry_date: string | null;
  is_expired: boolean; is_expiring_soon: boolean;
  verification_status: VerificationStatus;
  rejection_reason: string | null;
  has_proof: boolean;
  proof_file_name: string | null;
}

export interface ExperienceSummary {
  id: string; title: string; company: string;
  location: string | null;
  start_date: string; end_date: string | null;
  is_current: boolean; duration_years: number;
  description: string | null;
}

const toQs = (q: DirectoryQuery = {}): string => {
  const p = new URLSearchParams();
  if (q.q) p.set('q', q.q);
  if (q.expertise) p.set('expertise', q.expertise);
  if (q.verified_only) p.set('verified_only', '1');
  if (q.min_rating) p.set('min_rating', String(q.min_rating));
  if (q.sort) p.set('sort', q.sort);
  if (q.page) p.set('page', String(q.page));
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const trainerPortalApi = {
  // Public
  directory: (q?: DirectoryQuery) =>
    apiRequest.get<{
      data: TrainerDirectoryEntry[];
      meta: { current_page: number; last_page: number; per_page: number; total: number };
    }>(`/trainers${toQs(q)}`),
  publicProfile: (slug: string) => apiRequest.get<TrainerPublicProfile>(`/trainers/${slug}`),
  postReview: (slug: string, body: { course_uuid: string; rating: number; review_text?: string }) =>
    apiRequest.post<{ review: any; trainer_rating_avg: number; trainer_rating_count: number }>(
      `/trainers/${slug}/reviews`, body,
    ),

  // Trainer self-management
  myPortal: () => apiRequest.get<MyTrainerPortal>('/trainer/portal/profile'),
  updateProfile: (patch: Partial<MyTrainerPortal['profile']>) =>
    apiRequest.patch<{ profile: MyTrainerPortal['profile'] }>('/trainer/portal/profile', patch),

  addQualification: (body: FormData) =>
    apiRequest.post<QualificationSummary>('/trainer/portal/qualifications', body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteQualification: (id: string) =>
    apiRequest.delete<null>(`/trainer/portal/qualifications/${id}`),

  addCertification: (body: FormData) =>
    apiRequest.post<CertificationSummary>('/trainer/portal/certifications', body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteCertification: (id: string) =>
    apiRequest.delete<null>(`/trainer/portal/certifications/${id}`),

  addExperience: (body: {
    title: string; company: string; location?: string;
    start_date: string; end_date?: string; description?: string;
  }) => apiRequest.post<ExperienceSummary>('/trainer/portal/experiences', body),
  deleteExperience: (id: string) =>
    apiRequest.delete<null>(`/trainer/portal/experiences/${id}`),

  myReviews: () =>
    apiRequest.get<{
      data: Array<{ id: string; rating: number; text: string | null; student_name: string; course_title: string | null; status: string; created_at: string }>;
      meta: { current_page: number; last_page: number; total: number; avg: number; count: number };
    }>('/trainer/portal/reviews'),

  proofUrl: (type: 'qualifications' | 'certifications', id: string) =>
    apiRequest.get<{ download_url: string; expires_in_seconds: number }>(
      `/trainer/portal/proof/${type}/${id}/url`,
    ),

  // Admin
  pendingVerifications: () =>
    apiRequest.get<{
      qualifications: Array<any>;
      certifications: Array<any>;
      totals: { pending_qualifications: number; pending_certifications: number };
    }>('/admin/trainer-verifications'),
  verifyQualification: (id: string) =>
    apiRequest.post<{ id: string; status: string }>(`/admin/trainer-qualifications/${id}/verify`, {}),
  rejectQualification: (id: string, reason: string) =>
    apiRequest.post<{ id: string; status: string; reason: string }>(
      `/admin/trainer-qualifications/${id}/reject`, { reason },
    ),
  verifyCertification: (id: string) =>
    apiRequest.post<{ id: string; status: string }>(`/admin/trainer-certifications/${id}/verify`, {}),
  rejectCertification: (id: string, reason: string) =>
    apiRequest.post<{ id: string; status: string; reason: string }>(
      `/admin/trainer-certifications/${id}/reject`, { reason },
    ),
};
