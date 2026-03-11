
import { WhatsAppFactory } from '../lib/services/whatsapp.factory';
import { prisma } from '../lib/prisma';

async function main() {
    const settings = await prisma.settings.findFirst();
    if (!settings) return;

    const provider = WhatsAppFactory.getProvider(settings);
    const jid = "555191751921-1452255324@g.us";

    console.log(`📡 Buscando mensagens do grupo: ${jid}...`);
    try {
        const messages = await provider.fetchMessages(jid, 10);
        console.log(`✅ Foram encontradas ${messages.length} mensagens.`);
        if (messages.length > 0) {
            console.log("Exemplo da primeira mensagem:");
            console.log(`- De: ${messages[0].pushName}`);
            console.log(`- Texto: ${messages[0].text}`);
            console.log(`- Data: ${new Date(messages[0].timestamp).toLocaleString()}`);
        }
    } catch (e: any) {
        console.error("❌ Erro ao buscar mensagens:", e.message);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
