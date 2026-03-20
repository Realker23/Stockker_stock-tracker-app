import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";


//needs to be at root level to protect all routes - checks for session cookie and redirects to sign-in if not found
export async function proxy(request: NextRequest) {
	const sessionCookie = getSessionCookie(request);


	if (!sessionCookie) {
		return NextResponse.redirect(new URL("/sign-in", request.url));
	}

	return NextResponse.next();
}

/**
 * Middleware configuration object that defines which routes the middleware should apply to.
 * 
 * The matcher uses a regular expression pattern to include all routes except:
 * - `/api/*` - API routes
 * - `/_next/static/*` - Next.js static files
 * - `/_next/image/*` - Next.js image optimization routes
 * - `/favicon.ico` - Favicon file
 * - `/sign-in` - Sign in page
 * - `/sign-up` - Sign up page
 * - `/assets/*` - Static asset files
 * 
 * @remarks
 * The negative lookahead pattern `(?!...)` ensures the middleware runs on all routes
 * except those explicitly excluded, providing protection for authenticated routes while
 * allowing public access to authentication pages and static resources.
 */
export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sign-in|sign-up|assets).*)'], // Specify the routes the middleware applies to
};
