
import { prisma } from '../lib/prisma';
import { ContactsService } from '../lib/services/contacts.service';

async function main() {
    console.log("🚀 Iniciando teste de sincronização global de contatos...");
    
    const service = new ContactsService();
    try {
        console.log("🔄 Executando syncAllContacts()...");
        const stats = await service.syncAllContacts();
        
        console.log("\n📊 Estatísticas da Sincronização:");
        console.log(`- Encontrados na API: ${stats.totalFound}`);
        console.log(`- Criados no DB: ${stats.created}`);
        console.log(`- Atualizados no DB: ${stats.updated}`);

        const totalInDb = await prisma.contact.count();
        console.log(`\n✅ Total de contatos no banco de dados agora: ${totalInDb}`);

    } catch (error: any) {
        console.error("\n❌ Erro durante a sincronização:");
        console.error(error.message);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
