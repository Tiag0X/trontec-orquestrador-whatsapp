import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import { encrypt } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        // Fallback for old login format where frontend sends { password } only
        if (!email && password) {
            // Se o login antigo (só com senha) ainda for tentado, podemos rejeitar:
            return NextResponse.json({ error: 'Email é obrigatório na nova versão' }, { status: 400 });
        }

        if (!email || !password) {
            return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                role: {
                    include: { permissions: true }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
        }

        const isValidPassword = await bcryptjs.compare(password, user.passwordHash);

        if (!isValidPassword) {
            return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
        }

        const permissions = user.role?.permissions.map(p => p.action) || [];

        const token = await encrypt({
            userId: user.id,
            email: user.email,
            role: user.role?.name || 'USER',
            permissions: permissions,
        });

        const isProduction = process.env.NODE_ENV === 'production';
        const isHttps = process.env.NEXT_PUBLIC_APP_URL?.startsWith('https');

        (await cookies()).set('auth', token, {
            httpOnly: true,
            secure: isProduction && isHttps,
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role?.name || 'USER',
                permissions
            }
        });
    } catch (error) {
        const err = error as { message?: string };
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
