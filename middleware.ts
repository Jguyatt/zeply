import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/client(.*)',
  '/admin(.*)',
  '/select-workspace',
]);

const isAuthRoute = createRouteMatcher([
  '/auth(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = req.nextUrl.clone();

  // Protect dashboard and workspace routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute(req) && userId) {
    // Redirect to root page, which will handle role-based redirect
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // NOTE: Role-based redirects are handled in page loaders for security
  // Middleware is UX-only - actual authorization happens in server components

  // Set x-pathname header so layouts can read the actual current pathname
  const response = NextResponse.next();
  response.headers.set('x-pathname', req.nextUrl.pathname);
  return response;
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};
