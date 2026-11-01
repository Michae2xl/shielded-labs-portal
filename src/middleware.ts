import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if ((pathname === '/' || pathname === '/shielded-preview' || pathname === '/api/shielded-preview' || pathname.startsWith('/api/shielded-preview/')) && process.env.SHIELDED_LABS_PREVIEW !== '1') {
    return new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
  }
  return NextResponse.next();
}
export const config = { matcher: ['/', '/shielded-preview', '/api/shielded-preview/:path*'] };
