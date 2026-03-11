import { prisma } from '../lib/prisma';
async function main() {
    const r = await prisma.report.findUnique({ where: { id: '9578ea5d-c541-4ed8-9d82-5673b69a5467' } });
    if (!r) return;
    console.log(r.fullText.includes('02/12') ? 'YES! AI Generated 02/12' : 'No');
    console.log(r.fullText.substring(0, 1000));
}
main().finally(() => prisma.$disconnect());
