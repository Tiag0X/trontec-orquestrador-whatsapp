import { prisma } from '../lib/prisma';
async function main() {
    const perms = await prisma.permission.findMany();
    const userRole = await prisma.role.findUnique({
        where: { name: 'USER' },
        include: { permissions: true }
    });
    console.log(JSON.stringify({ 
        totalPermissions: perms.length, 
        permissions: perms.map(p => p.action),
        userRole: userRole ? { name: userRole.name, isSystem: userRole.isSystem, perms: userRole.permissions.map(p => p.action) } : null
    }, null, 2));
}
main().finally(() => prisma.$disconnect());
