import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/auth'

export async function middleware(request: NextRequest) {
    const authCookie = request.cookies.get('auth')
    const { pathname } = request.nextUrl

    // Allow public paths
    if (pathname === '/login' || pathname.startsWith('/_next') || pathname.startsWith('/api/auth/login')) {
        return NextResponse.next()
    }

    // Check auth
    if (!authCookie || !authCookie.value) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Validate JWT
    const payload = await decrypt(authCookie.value)
    if (!payload) {
        const response = NextResponse.redirect(new URL('/login', request.url))
        // Cleanup invalid cookie
        response.cookies.delete('auth')
        return response
    }

    // Rotas protegidas (Requerem permissão SETTINGS_VIEW)
    if (pathname.startsWith('/settings') || pathname.startsWith('/api/settings') || pathname.startsWith('/api/users') || pathname.startsWith('/api/roles')) {
        if (!payload.permissions.includes('SETTINGS_VIEW')) {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (API routes for auth)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
    ],
}
