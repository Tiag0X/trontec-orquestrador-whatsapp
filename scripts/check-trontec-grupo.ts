
import { WhatsAppFactory } from '../lib/services/whatsapp.factory';
import { prisma } from '../lib/prisma';

async function main() {
    console.log("Initializing provider...");
    const settings = await prisma.settings.findFirst();
    if (!settings) throw new Error("Settings not found");
    const provider = WhatsAppFactory.getProvider(settings);
    
    const groupId = "120363405467242383@g.us";
    console.log(`Fetching messages for ${groupId}...`);
    const messages = await provider.fetchMessages(groupId, 100);
    console.log(`Provider returned ${messages.length} messages for this group.`);
    
    if (messages.length > 0) {
        console.log(`First message date: ${new Date(messages[0].timestamp).toLocaleString('pt-BR')}`);
        console.log(`Last message date: ${new Date(messages[messages.length - 1].timestamp).toLocaleString('pt-BR')}`);
    } else {
        console.log("No messages returned by the provider for this group.");
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
