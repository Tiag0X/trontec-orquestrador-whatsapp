import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

const prisma = new PrismaClient();

async function checkUserManagementPerms(req: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth')?.value;
    if (!token) return false;

    const payload = await decrypt(token);
    return payload?.permissions?.includes('USER_MANAGEMENT');
}

export async function GET(req: Request) {
    try {
        if (!(await checkUserManagementPerms(req))) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                roleId: true,
                role: {
                    select: {
                        name: true,
                        description: true,
                    }
                },
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao listar usuários' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        if (!(await checkUserManagementPerms(req))) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const body = await req.json();
        const { email, password, name, roleId } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
        }

        // Verifica se usuário já existe
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: 'Usuário já cadastrado' }, { status: 400 });
        }

        // Cria o hash da senha
        const passwordHash = await bcryptjs.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                roleId
            },
            select: {
                id: true,
                email: true,
                name: true,
                roleId: true,
                role: {
                    select: { name: true }
                },
                createdAt: true,
            }
        });

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
    }
}
