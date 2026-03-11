
import { prisma } from '../lib/prisma';
import { WhatsAppFactory } from '../lib/services/whatsapp.factory';

async function main() {
    console.log("🚀 Iniciando teste da API Uazapi...");
    
    const settings = await prisma.settings.findFirst();
    if (!settings) {
        console.error("❌ Configurações não encontradas no banco de dados.");
        return;
    }

    console.log(`📡 Provedor selecionado: ${settings.whatsappProvider}`);
    console.log(`🔗 URL: ${settings.whatsappApiUrl}`);
    console.log(`📝 Instância: ${settings.whatsappInstanceName}`);

    try {
        console.log("\n🔄 Buscando grupos remotos (POST /group/list)...");
        const provider = WhatsAppFactory.getProvider(settings);
        // @ts-ignore
        const url = `${provider.baseUrl}/group/list`;
        // @ts-ignore
        const response = await import('axios').then(a => a.default.post(url, {
            page: 1,
            pageSize: 50,
            limit: 50,
            offset: 0,
            search: "",
            force: false,
            noParticipants: true
        }, { headers: { token: (provider as any).token } }));
        
        const rawResponse = await response;
        console.log("📦 Estrutura da Resposta (primeiro item de groups via POST):");
        console.log(JSON.stringify(rawResponse.data?.groups?.[0], null, 2));

        const groups = await provider.fetchAllGroups();
        console.log(`✅ Sucesso! Encontrados ${groups.length} grupos.`);
        
        if (groups.length > 0) {
            console.log("\n🔍 Procurando por mensagens nos primeiros 10 grupos...");
            for (const g of groups.slice(0, 10)) {
                const groupId = g.id;
                const messages = await provider.fetchMessages(groupId as string, 5);
                if (messages.length > 0) {
                    console.log(`✅ Grupo: ${g.subject} (${groupId}) - ${messages.length} mensagens.`);
                    messages.forEach(m => {
                        console.log(` - [${new Date(m.timestamp).toLocaleString()}] ${m.from}: ${(m.text || "").substring(0, 50)}...`);
                    });
                    break;
                } else {
                    console.log(`ℹ️ Grupo: ${g.subject} (${groupId}) - 0 mensagens.`);
                }
            }
        }

    } catch (error) {
        console.error("\n❌ Erro durante o teste:");
        console.error(error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
