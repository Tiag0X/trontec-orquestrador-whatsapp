
import { prisma } from '../lib/prisma';

async function main() {
    console.log("📊 Analisando STATUS dos últimos relatórios...");
    
    const reports = await prisma.report.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { group: true }
    });

    if (reports.length === 0) {
        console.log("❌ Nenhum relatório encontrado no banco.");
        return;
    }

    reports.forEach(r => {
        console.log(`\nID: ${r.id}`);
        console.log(`Grupo: ${r.group?.name || 'N/A'} (${r.group?.jid || 'N/A'})`);
        console.log(`Data Ref: ${r.dateRef}`);
        console.log(`Status: ${r.status}`);
        console.log(`Criado em: ${r.createdAt.toLocaleString()}`);
        
        if (r.status === 'EMPTY') {
            console.log("⚠️ Motivo: Sem mensagens encontradas no intervalo de filtro.");
        }
        
        try {
            const data = JSON.parse(r.processedData || '[]');
            console.log(`Mensagens processadas: ${data.length}`);
            if (data.length > 0) {
                console.log(`Exemplo MSG 1: ${data[0].text.substring(0, 50)}...`);
            }
        } catch (e) {
            console.log("❌ Erro ao ler processedData");
        }
    });

    // Verificar se o grupo específico está ativo e marcado para auto-report
    const targetGroup = await prisma.group.findFirst({
        where: { jid: "555191751921-1452255324@g.us" }
    });

    if (targetGroup) {
        console.log("\n--- Configuração do Grupo Alvo ---");
        console.log(`Nome: ${targetGroup.name}`);
        console.log(`Ativo: ${targetGroup.isActive}`);
        console.log(`Incluir Auto Report: ${targetGroup.includeInAutoReport}`);
    } else {
        console.log("\n❌ Grupo alvo não encontrado no banco!");
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
