export interface User {
  id: string;
  username: string | null;
  email: string;
  email_verified: boolean;
  phone: string | null;
  phone_verified: boolean;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  auth_provider: 'email' | 'phone' | 'google' | 'microsoft';
  two_factor: { enabled: boolean; method: string | null };
  locale: string;
  timezone: string;
  roles?: string[];
  permissions?: string[];
  profile?: UserProfile;
  organization?: Organization;
  last_login_at?: string;
  created_at?: string;
}

export interface UserProfile {
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  gender: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  position: string | null;
  department: string | null;
  bio: string | null;
  profile_picture: string | null;
  profile_picture_thumbnail: string | null;
  address: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    region: string | null;
    postal_code: string | null;
    country: string | null;
  };
  social_links: Record<string, string> | null;
  preferences: Record<string, unknown> | null;
  completion_percentage: number;
  is_complete: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: 'bank' | 'saccos' | 'government' | 'corporate' | 'individual';
  email: string | null;
  phone: string | null;
  logo_url: string | null;
  country: string;
  is_verified: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
  token_type: string;
  expires_at: string;
  requires_2fa: boolean;
}

export interface LoginOtpPending {
  otp_sent: true;
  email: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: { first: string; last: string; prev: string | null; next: string | null };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface LoginHistoryItem {
  id: number;
  status: 'success' | 'failed' | 'blocked' | 'logged_out';
  auth_method: string;
  ip_address: string;
  device_type: string | null;
  device_name: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  created_at: string;
}
