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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        if (!(await checkUserManagementPerms(req))) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { id } = await params;
        const { name, description, permissionIds } = await req.json();

        const role = await prisma.role.findUnique({ where: { id } });
        if (role?.isSystem && name !== role.name) {
            return NextResponse.json({ error: 'Não é possível renomear um perfil do sistema' }, { status: 400 });
        }

        const updateData: any = { description };
        if (!role?.isSystem && name) {
            updateData.name = name;
        }

        const updatedRole = await prisma.role.update({
            where: { id },
            data: {
                ...updateData,
                permissions: {
                    set: permissionIds?.map((pid: string) => ({ id: pid })) || []
                }
            },
            include: { permissions: true }
        });

        return NextResponse.json(updatedRole);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        if (!(await checkUserManagementPerms(req))) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const { id } = await params;

        const role = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });

        if (!role) {
            return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
        }

        if (role.isSystem) {
            return NextResponse.json({ error: 'Não é possível excluir um perfil padrão do sistema' }, { status: 400 });
        }

        if (role._count.users > 0) {
            return NextResponse.json({ error: 'Não é possível excluir um perfil que possui usuários vinculados' }, { status: 400 });
        }

        await prisma.role.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao excluir perfil' }, { status: 500 });
    }
}
