import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

const prisma = new PrismaClient();

async function checkUserManagementPerms(req: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth')?.value;
    if (!token) return { hasPerms: false, userId: null };

    const payload = await decrypt(token);
    return {
        hasPerms: payload?.permissions?.includes('USER_MANAGEMENT') === true,
        userId: payload?.userId
    };
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await checkUserManagementPerms(req);
        if (!auth.hasPerms) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const { email, name, roleId, password } = body;

        // Prepara update data
        const updateData: any = {};
        if (email) updateData.email = email;
        if (name !== undefined) updateData.name = name;
        if (roleId) updateData.roleId = roleId;

        if (password) {
            updateData.passwordHash = await bcryptjs.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                roleId: true,
                role: { select: { name: true } }
            }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await checkUserManagementPerms(req);
        if (!auth.hasPerms) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { id } = await params;

        // Impedir que o usuário delete a si mesmo
        if (auth.userId === id) {
            return NextResponse.json({ error: 'Você não pode excluir a sua própria conta' }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao excluir usuário' }, { status: 500 });
    }
}
