import { PrismaClient } from '@prisma/client';
import { WhatsAppFactory } from '../lib/services/whatsapp.factory';

const prisma = new PrismaClient();

async function main() {
    const settings = await prisma.settings.findFirst();
    if (!settings) throw new Error("No settings");

    console.log("Conectando ao WhatsApp via Provider...");
    const provider = WhatsAppFactory.getProvider(settings);

    try {
        const groups = await provider.fetchAllGroups();
        console.log(`Total de grupos remotos: ${groups.length}`);

        const rondas = groups.filter(g => g.subject.toLowerCase().includes('ronda'));

        console.log("\nGrupos encontrados com 'Ronda':");
        rondas.forEach(g => {
            console.log(`- Nome: "${g.subject}" | ID: ${g.id}`);
        });

        const teste = groups.filter(g => g.subject.toLowerCase().includes('teste'));
        console.log("\nGrupos encontrados com 'Teste':");
        teste.forEach(g => {
            console.log(`- Nome: "${g.subject}" | ID: ${g.id}`);
        });

    } catch (e) {
        console.error("Erro:", e);
    }
}

main();
