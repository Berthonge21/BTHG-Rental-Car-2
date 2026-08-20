import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/admin/login', '/register'];
const adminRoutes = ['/admin'];
const superAdminRoutes = ['/super-admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for auth token in cookies (set by client-side)
  const token = request.cookies.get('bthg_access_token')?.value;

  // For now, we rely on client-side auth checks
  // This middleware just ensures proper routing structure
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
