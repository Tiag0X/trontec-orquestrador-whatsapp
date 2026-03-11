
import { prisma } from '../lib/prisma';
import { WhatsAppFactory } from '../lib/services/whatsapp.factory';

async function main() {
    console.log("🚀 Iniciando teste de sincronização de contatos Uazapi (Versão V2 com Paginação)...");
    
    const settings = await prisma.settings.findFirst();
    if (!settings) {
        console.error("❌ Configurações não encontradas no banco de dados.");
        return;
    }

    console.log(`📡 Provedor selecionado: ${settings.whatsappProvider}`);
    console.log(`🔗 URL: ${settings.whatsappApiUrl}`);

    try {
        const provider = WhatsAppFactory.getProvider(settings);
        console.log("\n🔄 Chamando fetchAllContacts()...");
        const contacts = await provider.fetchAllContacts();
        
        console.log(`✅ Sucesso! Total de contatos recuperados: ${contacts.length}`);
        
        if (contacts.length > 0) {
            console.log("\n📦 Amostra dos primeiros 5 contatos:");
            contacts.slice(0, 5).forEach((c, i) => {
                console.log(`${i + 1}. Nome: ${c.name || 'N/A'} - JID: ${c.jid}`);
            });
        } else {
            console.log("⚠️ Nenhum contato retornado.");
        }

    } catch (error: any) {
        console.error("\n❌ Erro durante o teste:");
        console.error(error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
