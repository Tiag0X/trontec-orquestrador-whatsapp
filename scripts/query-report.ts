
import { prisma } from '../lib/prisma';

async function main() {
    const r = await prisma.report.findUnique({ 
        where: { id: 'cc7d8c6d-e14f-43c8-8fd6-ee166844d645' }, 
        include: { group: true } 
    }); 
    console.log(JSON.stringify(r, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
