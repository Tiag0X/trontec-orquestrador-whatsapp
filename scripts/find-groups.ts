
import { prisma } from '../lib/prisma';

async function main() {
    const groups = await prisma.group.findMany({
        where: { name: { contains: 'Rondas' } }
    });

    console.log(`🔍 Found ${groups.length} groups with 'Rondas' in name:`);
    groups.forEach(g => {
        console.log(`ID: ${g.id} | Name: ${g.name} | Active: ${g.isActive} | AutoReport: ${g.includeInAutoReport}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
