import { PrismaClient } from '@prisma/client';
import { WhatsAppFactory } from '../lib/services/whatsapp.factory';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const settings = await prisma.settings.findFirst();
    if (!settings) throw new Error("No settings");

    const provider = WhatsAppFactory.getProvider(settings);

    try {
        console.log("Buscando todos os grupos...");
        const groups = await provider.fetchAllGroups();

        const lines = groups.map(g => `ID: ${g.id} | Name: ${g.subject}`);
        fs.writeFileSync('remote_groups_dump.txt', lines.join('\n'));
        console.log(`Dump salvo em 'remote_groups_dump.txt' com ${lines.length} grupos.`);

        // Print groups with 'Trontec' just in case
        const matches = groups.filter(g => g.subject.toLowerCase().includes('trontec'));
        console.log("\nGrupos com 'Trontec':");
        matches.forEach(m => console.log(`${m.subject} : ${m.id}`));

    } catch (e) {
        console.error("Erro:", e);
    }
}

main();
