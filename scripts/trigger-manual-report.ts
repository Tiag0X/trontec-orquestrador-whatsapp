
import { ReportProcessor } from '../lib/services/processor.service';
import { prisma } from '../lib/prisma';

async function main() {
    const processor = new ReportProcessor();
    
    console.log("🚀 Iniciando processamento MANUAL de relatório para o grupo alvo...");
    
    // Buscar o ID do grupo primeiro
    const group = await prisma.group.findFirst({
        where: { jid: "555191751921-1452255324@g.us" }
    });

    if (!group) {
        console.error("❌ Grupo não encontrado!");
        return;
    }

    // Testar a lógica AUTOMÁTICA de "TODAY" que acabamos de corrigir
    const options = {
        groupIds: [group.id],
        // startDate e endDate omitidos para usar o padrão TODAY do processor
    };

    console.log(`Filtro: ${options.startDate} ate ${options.endDate}`);

    try {
        const result = await processor.process(options);
        console.log("\n--- Resultado do Processamento ---");
        console.log(JSON.stringify(result, null, 2));
    } catch (error: any) {
        console.error("❌ Falha no processamento:", error.message);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
