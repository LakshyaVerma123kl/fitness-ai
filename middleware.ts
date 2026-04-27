/**
 * middleware.ts — Clerk Auth Boundary
 *
 * This middleware runs on every request (except static assets) and enforces
 * authentication via Clerk. It defines two categories:
 *
 * PUBLIC ROUTES (no auth required):
 *   - Landing page, sign-in/up, plan generation APIs, image gen, pose profile,
 *     and the health-check ping endpoint (used by uptime monitors).
 *
 * PROTECTED ROUTES (auth required):
 *   - All other routes. If unauthenticated:
 *     - API routes → return 401 JSON (so the frontend can handle it)
 *     - UI routes  → redirect to Clerk's sign-in page
 */
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/generate(.*)",
  "/api/generate-image(.*)",
  "/api/pose-profile(.*)",
  "/api/plans/ping",
]);

const isApiRoute = createRouteMatcher(["/api/(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  // If it's a public route, do nothing and let it pass
  if (isPublicRoute(request)) return;

  const authObject = await auth();

  if (!authObject.userId) {
    // If unauthorized and it's an API route, return 401 JSON manually
    if (isApiRoute(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For all other protected UI routes, let Clerk securely handle the redirect
    return authObject.redirectToSignIn();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
