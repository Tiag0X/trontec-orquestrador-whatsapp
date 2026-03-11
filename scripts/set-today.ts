
import { prisma } from '../lib/prisma';

async function main() {
    const result = await prisma.settings.updateMany({
        data: { autoReportPeriod: 'TODAY' }
    });
    console.log('✅ Settings updated to TODAY:', result);
}

main().catch(console.error).finally(() => prisma.$disconnect());
