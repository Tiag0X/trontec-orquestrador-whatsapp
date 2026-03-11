
import { prisma } from '../lib/prisma';
import { ContactsService } from '../lib/services/contacts.service';

async function main() {
    console.log("🚀 Iniciando teste de sincronização baseada em GRUPOS...");
    
    // Configurar um grupo como ativo para o teste
    const firstGroup = await prisma.group.findFirst();
    if (firstGroup) {
        await prisma.group.update({
            where: { id: firstGroup.id },
            data: { isActive: true }
        });
        console.log(`✅ Grupo '${firstGroup.name}' marcado como ativo para o teste.`);
    }

    const service = new ContactsService();
    try {
        console.log("🔄 Executando syncContacts() (baseado em participantes de grupos)...");
        const stats = await service.syncContacts();
        
        console.log("\n📊 Estatísticas da Sincronização por Grupos:");
        console.log(`- Grupos processados: ${stats.totalGroups}`);
        console.log(`- Contatos encontrados nos grupos: ${stats.contactsFound}`);
        console.log(`- Novos contatos criados: ${stats.contactsCreated}`);

        const totalInDb = await prisma.contact.count();
        console.log(`\n✅ Total de contatos no banco de dados agora: ${totalInDb}`);

    } catch (error: any) {
        console.error("\n❌ Erro durante a sincronização por grupos:");
        console.error(error.message);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
