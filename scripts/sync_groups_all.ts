import { PrismaClient } from '@prisma/client';
import { WhatsAppFactory } from '../lib/services/whatsapp.factory';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Iniciando sincronização de grupos...");

        const settings = await prisma.settings.findFirst();
        if (!settings) throw new Error("Configurações não encontradas.");

        const provider = WhatsAppFactory.getProvider(settings);

        console.log("Buscando grupos no WhatsApp...");
        const remoteGroups = await provider.fetchAllGroups();
        console.log(`Encontrados ${remoteGroups.length} grupos na API.`);

        const localGroups = await prisma.group.findMany();
        console.log(`Encontrados ${localGroups.length} grupos no banco local.`);

        let updatedCount = 0;

        for (const local of localGroups) {
            // Find remote group with same name
            // Note: remote.subject might differ slightly? process.stdout normalizes?
            // checking exact match first.
            const match = remoteGroups.find(r => r.subject === local.name);

            if (match) {
                if (match.id !== local.jid) {
                    console.log(`\n[DIVERGÊNCIA] Grupo: "${local.name}"`);
                    console.log(`  JID Local: ${local.jid}`);
                    console.log(`  JID Remoto: ${match.id}`);

                    if (local.jid.includes('-') && !match.id.includes('-')) {
                        console.log(`  -> Detectado formato legado no local. Atualizando para novo JID...`);

                        await prisma.group.update({
                            where: { id: local.id },
                            data: { jid: match.id }
                        });
                        console.log(`  ✅ Atualizado com sucesso.`);
                        updatedCount++;
                    } else {
                        console.log(`  -> Formatos ambíguos. Mantendo local para segurança.`);
                    }
                } else {
                    // JID matches
                    // console.log(`[OK] "${local.name}" sincronizado.`);
                }
            } else {
                console.log(`[AVISO] Grupo local "${local.name}" não encontrado na API (Pode ter mudado de nome).`);
            }
        }

        console.log(`\n--- Sincronização Concluída ---`);
        console.log(`Grupos atualizados: ${updatedCount}`);

    } catch (e) {
        console.error("Erro fatal:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
