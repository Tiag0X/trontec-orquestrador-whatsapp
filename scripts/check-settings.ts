
import { prisma } from '../lib/prisma';

async function main() {
    const s = await prisma.settings.findFirst();
    if (!s) {
        console.error("❌ Nenhuma configuração encontrada!");
        return;
    }
    console.log('✅ Configurações encontradas:');
    console.log('OpenAI Key exists:', !!s.openaiApiKey);
    console.log('OpenAI Key length:', s.openaiApiKey?.length || 0);
    console.log('Model:', s.langchainModel);
    console.log('Temperature:', s.langchainTemperature);
}

main().catch(console.error).finally(() => prisma.$disconnect());
