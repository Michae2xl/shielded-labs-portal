import { NextResponse, type NextRequest } from 'next/server';
import { launchRoute, requestHost } from '@/lib/shielded-preview/launch';

const HIDDEN = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' };

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if ((pathname === '/' || pathname === '/shielded-preview' || pathname === '/governance' || pathname === '/poll' || pathname === '/api/shielded-preview' || pathname.startsWith('/api/shielded-preview/')) && process.env.SHIELDED_LABS_PREVIEW !== '1') {
    return new NextResponse('Not found', { status: 404, headers: HIDDEN });
  }
  // The launch address shows the poll page alone; see launch.ts.
  const host = requestHost(req.headers);
  const route = launchRoute(host, pathname);
  if (route && 'rewrite' in route) return NextResponse.rewrite(new URL(route.rewrite, req.url));
  // Behind the hosting proxy the request URL is internal: send the reader to the public address.
  if (route && 'redirect' in route) return NextResponse.redirect(new URL(route.redirect, `https://${host}`), 307);
  if (route && 'notFound' in route) return new NextResponse('Not found', { status: 404, headers: HIDDEN });
  return NextResponse.next();
}
export const config = { matcher: ['/', '/shielded-preview', '/governance', '/poll', '/landing', '/landing/:path*', '/api/shielded-preview/:path*'] };
