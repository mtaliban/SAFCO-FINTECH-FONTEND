import { NextRequest, NextResponse } from 'next/server';

const TOKEN_COOKIE = 'safco_token';
const USER_COOKIE  = 'safco_user';

// Routes that require authentication
const PROTECTED_PREFIXES = [
  '/dashboard', '/admin', '/student', '/trainer', '/corporate',
  '/forum', '/notifications', '/billing', '/checkout',
  '/trainers', '/settings', '/play', '/verify',
];

// Routes accessible only to specific roles
const ROLE_ROUTES: Record<string, string[]> = {
  '/admin':     ['system_admin'],
  '/corporate': ['corporate_client', 'system_admin'],
  '/trainer':   ['trainer', 'facilitator', 'system_admin'],
  '/student':   ['student', 'system_admin'],
};

const ROLE_HOME: Record<string, string> = {
  system_admin:     '/admin',
  trainer:          '/trainer',
  facilitator:      '/trainer',
  student:          '/student',
  corporate_client: '/corporate',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths — always allowed
  if (
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/verify/certificate') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-otp')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  // Not authenticated → send to login
  if (isProtected && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Already logged in, visiting auth pages → redirect to dashboard
  if (token && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Role-based access control
  if (token) {
    const userCookie = request.cookies.get(USER_COOKIE)?.value;
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie) as { roles?: string[] };
        const role = user.roles?.[0];

        // Check if the current path requires a specific role
        for (const [prefix, allowedRoles] of Object.entries(ROLE_ROUTES)) {
          if (pathname.startsWith(prefix) && role && !allowedRoles.includes(role)) {
            // Redirect to the user's correct home instead of showing a 403 toast
            const url = request.nextUrl.clone();
            url.pathname = ROLE_HOME[role] ?? '/dashboard';
            return NextResponse.redirect(url);
          }
        }
      } catch {
        // Malformed user cookie — let it pass, the client will handle auth
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
