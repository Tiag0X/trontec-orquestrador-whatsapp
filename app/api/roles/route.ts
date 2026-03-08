import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
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

        const roles = await prisma.role.findMany({
            include: { permissions: true },
            orderBy: { createdAt: 'desc' }
        });

        const permissionsList = await prisma.permission.findMany();

        return NextResponse.json({ roles, permissionsList });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao listar perfis' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        if (!(await checkUserManagementPerms(req))) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { name, description, permissionIds } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Nome do perfil é obrigatório' }, { status: 400 });
        }

        const existingRole = await prisma.role.findUnique({ where: { name } });
        if (existingRole) {
            return NextResponse.json({ error: 'Perfil já existe' }, { status: 400 });
        }

        const newRole = await prisma.role.create({
            data: {
                name,
                description,
                permissions: {
                    connect: permissionIds?.map((id: string) => ({ id })) || []
                }
            },
            include: { permissions: true }
        });

        return NextResponse.json(newRole, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao criar perfil' }, { status: 500 });
    }
}
