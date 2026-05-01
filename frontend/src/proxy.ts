import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('nexuspulse_token')?.value;
  return !!token;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public paths and static files
  if (
    pathname === '/' ||
    pathname === '/forbidden' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  // Only check authentication for dashboard routes
  // Role checking is handled client-side by ProtectedRoute component
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated(request)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
