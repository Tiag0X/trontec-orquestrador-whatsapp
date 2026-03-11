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

    // Check S2S Header Auth exclusively for API routes
    if (pathname.startsWith('/api/')) {
        const pwdHeader = request.headers.get('password')
        if (pwdHeader && pwdHeader === process.env.APP_PASSWORD) {
            return NextResponse.next()
        }
    }

    // Check session via Cookie (Frontend Users)
    if (!authCookie || !authCookie.value) {
        // Se for uma requisição de API sem cookie/senha, retorna 401 direto em vez de redirect HTML
        if (pathname.startsWith('/api/')) {
            return new NextResponse(
                JSON.stringify({ error: 'Auth required (Header password or Session Cookie)' }), 
                { status: 401, headers: { 'content-type': 'application/json' } }
            )
        }
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
