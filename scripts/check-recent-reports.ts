
import { prisma } from '../lib/prisma';

async function main() {
    const reports = await prisma.report.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { group: true }
    });

    console.log(`📊 Last 10 reports check:`);
    reports.forEach(r => {
        const msgCount = r.processedData ? JSON.parse(r.processedData).length : 0;
        console.log(`ID: ${r.id} | DateRef: ${r.dateRef} | Created: ${r.createdAt.toISOString()} | Status: ${r.status} | Msgs: ${msgCount} | Group: ${r.group?.name}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
