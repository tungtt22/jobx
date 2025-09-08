import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /protected, /api/admin)
  const path = request.nextUrl.pathname;

  // Define protected API routes
  const isApiRoute = path.startsWith('/api');
  const isProtectedRoute = path.includes('/api/protected') || 
                          path.includes('/api/admin');

  // Check authentication for protected routes
  if (isProtectedRoute) {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Here you would typically verify the JWT token
    // This is a simplified example
    try {
      // verifyToken(token);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
  }

  // Add CORS headers for API routes
  if (isApiRoute) {
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );
    return response;
  }

  return NextResponse.next();
}

// Configure middleware matching
export const config = {
  // Matcher for routes
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
