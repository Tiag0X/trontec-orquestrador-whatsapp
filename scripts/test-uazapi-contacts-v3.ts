
import { prisma } from '../lib/prisma';
import { WhatsAppFactory } from '../lib/services/whatsapp.factory';

async function main() {
    console.log("🚀 Iniciando teste de sincronização de contatos Uazapi (Versão V3 - Híbrida)...");
    
    const settings = await prisma.settings.findFirst();
    if (!settings) {
        console.error("❌ Configurações não encontradas no banco de dados.");
        return;
    }

    try {
        const provider = WhatsAppFactory.getProvider(settings);
        console.log("\n🔄 Chamando fetchAllContacts()...");
        const contacts = await provider.fetchAllContacts();
        
        console.log(`✅ Sucesso! Total de contatos recuperados: ${contacts.length}`);
        
        if (contacts.length > 0) {
            console.log("\n📦 Amostra de contatos (primeiros 10):");
            contacts.slice(0, 10).forEach((c, i) => {
                console.log(`${i + 1}. Nome: ${c.name || 'N/A'} - JID: ${c.jid}`);
            });
            
            // Verificação de nomes vazios
            const emptyNames = contacts.filter(c => !c.name).length;
            console.log(`\n🔍 Contatos sem nome: ${emptyNames}`);
        } else {
            console.log("⚠️ Nenhum contato retornado.");
        }

    } catch (error: any) {
        console.error("\n❌ Erro durante o teste:");
        console.error(error.message);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
