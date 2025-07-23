import { NextRequest, NextResponse } from 'next/server';

// Helper function to check if the user is authenticated
function isAuthenticated(request: NextRequest): boolean {
  const accessToken = request.cookies.get('accessToken')?.value;
  return !!accessToken;
}

// Define public routes that don't require authentication
const publicRoutes = ['/', '/login', '/register'];

// Define routes that should redirect authenticated users
const authRedirectRoutes = ['/', '/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuth = isAuthenticated(request);

  // Skip middleware for static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Handle authenticated users
  if (isAuth) {
    // Redirect authenticated users away from auth pages
    if (authRedirectRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Check if route exists by trying common app routes
    const validRoutes = ['/', '/login', '/register', '/dashboard', '/settings'];
    
    // If it's not a known valid route, redirect to dashboard
    if (!validRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Allow access to protected routes
    return NextResponse.next();
  }

  // Handle unauthenticated users
  if (!isAuth) {
    // Allow access to public routes
    if (publicRoutes.includes(pathname)) {
      return NextResponse.next();
    }
    
    // Check if route exists by trying common app routes
    const validRoutes = ['/', '/login', '/register', '/dashboard', '/settings'];
    
    // If it's not a known valid route, redirect to home
    if (!validRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // For protected routes, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};