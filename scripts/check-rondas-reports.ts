
import { prisma } from '../lib/prisma';

async function main() {
    console.log("Fetching recent reports for Rondas Trontec...");
    const group = await prisma.group.findFirst({ where: { name: { contains: 'Rondas Trontec' } }});
    if (!group) {
        console.log("Group not found");
        return;
    }
    
    const reports = await prisma.report.findMany({
        where: { groupId: group.id },
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    
    console.log(`Found ${reports.length} recent reports for Rondas Trontec:`);
    reports.forEach(r => {
        let count = 0;
        try { count = JSON.parse(r.occurrences || "[]").length; } catch (e) {}
        console.log(`\nID: ${r.id}\nDateRef: ${r.dateRef}\nCreatedAt: ${r.createdAt}\nStatus: ${r.status}\nElements (from occurrences json): ${count}\nSummary: ${r.summary}\nFull JSON Object: ${JSON.stringify(r.occurrences)}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
