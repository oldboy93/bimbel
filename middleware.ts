import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;
  const isDashboardRoute = pathname.startsWith('/owner') || pathname.startsWith('/guru') || pathname.startsWith('/murid');

  // 1. Belum login -> redirect ke /login
  if (!session && isDashboardRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Sudah login tapi akses /login -> otomatis diarahkan ke dashboard sesuai role
  if (session && pathname === '/login') {
    // app_metadata lebih aman (hanya bisa diset server/admin), fallback ke user_metadata untuk user lama
    const role = session.user.app_metadata?.role ?? session.user.user_metadata?.role ?? 'murid';
    return NextResponse.redirect(new URL(`/${role}`, request.url));
  }

  // 3. Role Guard: guru tidak bisa akses /owner, dst.
  if (session && isDashboardRoute) {
    const role = session.user.app_metadata?.role ?? session.user.user_metadata?.role ?? 'murid';
    const routeRole = pathname.split('/')[1]; // ambil segmen ke-1, misal: 'murid' dari '/murid'
    
    // Pastikan user tidak menembus batas role lain (kecuali owner yang bebas)
    if (routeRole && routeRole !== role && role !== 'owner') {
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
