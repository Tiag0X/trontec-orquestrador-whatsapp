import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@trontec.com.br' // Default admin login
    const password = 'admin' // Default simple password, to be changed
    const passwordHash = await bcryptjs.hash(password, 10)

    // 1. Create Default Permissions
    const permissions = [
        { action: 'DASHBOARD_VIEW', description: 'Visualizar Dashboard principal. (Acesso à tela inicial com as métricas, últimos alertas e avisos)' },
        { action: 'SETTINGS_VIEW', description: 'Acessar área de Configurações. (Permite modificar integrações, prompts e automações de relatório)' },
        { action: 'USER_MANAGEMENT', description: 'Criar, editar e apagar usuários. (Gerenciamento completo de acessos e membros da equipe)' },
        { action: 'GROUP_MANAGEMENT', description: 'Adicionar e remover Grupos via WhatsApp. (Controle sobre quais grupos estão sendo monitorados e vinculação remota)' },
        { action: 'PROMPT_MANAGEMENT', description: 'Criar e editar Prompts do Chat. (Definição do comportamento e instruções para a Inteligência Artificial)' },
        { action: 'REPORTS_VIEW', description: 'Visualizar os Relatórios gerados. (Acesso ao histórico e informações consolidadas da operação diária)' },
        { action: 'DASH_RONDAS_VIEW', description: 'Acessar Dashboard Rondas. (Redirecionamento para a visão analítica de Rondas da Trontec)' },
        { action: 'TRONTEC_EXTRAS_VIEW', description: 'Acessar Trontec Extras. (Navegação para o portal de módulos extras do sistema)' },
    ]

    for (const p of permissions) {
        await prisma.permission.upsert({
            where: { action: p.action },
            update: { description: p.description },
            create: p,
        })
    }

    const allPermissions = await prisma.permission.findMany()

    // 2. Create Default 'Admin' Role and link all permissions
    const adminRole = await prisma.role.upsert({
        where: { name: 'ADMIN' },
        update: {
            isSystem: true,
            permissions: {
                set: allPermissions.map(p => ({ id: p.id }))
            }
        },
        create: {
            name: 'ADMIN',
            description: 'Administrador do Sistema (Acesso Total)',
            isSystem: true,
            permissions: {
                connect: allPermissions.map(p => ({ id: p.id }))
            }
        }
    })

    // 3. Create Default 'User' Role with basic permissions
    await prisma.role.upsert({
        where: { name: 'USER' },
        update: {
            isSystem: true,
            permissions: {
                set: allPermissions.filter(p => ['DASHBOARD_VIEW', 'REPORTS_VIEW'].includes(p.action)).map(p => ({ id: p.id }))
            }
        },
        create: {
            name: 'USER',
            description: 'Usuário Padrão',
            isSystem: true,
            permissions: {
                connect: allPermissions.filter(p => ['DASHBOARD_VIEW', 'REPORTS_VIEW'].includes(p.action)).map(p => ({ id: p.id }))
            }
        }
    })


    // 4. Create the Admin User and link to the Admin Role
    const admin = await prisma.user.upsert({
        where: { email },
        update: { roleId: adminRole.id },
        create: {
            email,
            name: 'Administrador Geral',
            passwordHash,
            roleId: adminRole.id,
        },
    })

    console.log('Admin user seeded:', admin.email, 'with role:', adminRole.name)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
