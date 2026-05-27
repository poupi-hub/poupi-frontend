import { getBackendUrl } from '@/lib/backend-url';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PROTECTED_ROUTES = ['/dashboard', '/alertas', '/billing', '/admin'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname === '/operacional') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  if (!isProtected) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const needsAdmin = pathname.startsWith('/admin');
  const role = String((token as any).role ?? '').toLowerCase();
  if (needsAdmin && role !== 'admin') {
    const backendToken = (token as any).backendToken;
    const backendUrl = getBackendUrl();

    if (backendToken) {
      try {
        const res = await fetch(`${backendUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${backendToken}` },
          cache: 'no-store',
        });
        if (res.ok) {
          const me = await res.json();
          if (String(me.role ?? '').toLowerCase() === 'admin') {
            return NextResponse.next();
          }
        }
      } catch {
        // Conservador: se nao conseguir validar no backend, mantem bloqueado.
      }
    }

    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/operacional', '/dashboard/:path*', '/alertas/:path*', '/billing/:path*', '/admin/:path*'],
};
