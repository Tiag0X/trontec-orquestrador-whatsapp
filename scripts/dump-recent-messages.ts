
import { WhatsAppFactory } from '../lib/services/whatsapp.factory';
import { prisma } from '../lib/prisma';

async function main() {
    const settings = await prisma.settings.findFirst();
    if (!settings) return;

    const provider = WhatsAppFactory.getProvider(settings);
    const jid = "555191751921-1452255324@g.us";

    console.log(`📡 Dumping 1000 messages from group: ${jid}...`);
    try {
        const messages = await provider.fetchMessages(jid, 1000);
        console.log(`Total: ${messages.length}`);
        
        messages.forEach((m, i) => {
            const date = new Date(m.timestamp > 1e12 ? m.timestamp : m.timestamp * 1000);
            console.log(`[${i}] ID: ${m.id} | Date: ${date.toISOString()} | Text: ${m.text.substring(0, 30)}... | HasText: ${!!m.text && m.text.trim() !== ""}`);
        });

    } catch (e: any) {
        console.error("❌ Error:", e.message);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
