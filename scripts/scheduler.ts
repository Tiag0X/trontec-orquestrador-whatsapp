
import 'dotenv/config';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { ReportProcessor } from '@/lib/services/processor.service';
import { WhatsAppFactory } from '@/lib/services/whatsapp.factory';

const prisma = new PrismaClient();

console.log("🚀 Agendador de Relatórios Iniciado!");
console.log("🕒 Monitorando configurações do banco de dados a cada minuto...");

// Executa A CADA MINUTO para verificar se deve disparar
cron.schedule('* * * * *', async () => {
    const now = new Date();
    const currentHM = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    try {
        const settings = await prisma.settings.findFirst();

        // Update Heartbeat
        await prisma.settings.update({
            where: { id: 1 },
            data: { schedulerHeartbeat: new Date() }
        });

        if (settings?.isAutoReportEnabled) {
            if (settings.autoReportTime === currentHM) {
                console.log(`[${now.toISOString()}] ⏰ Hora agendada (${currentHM}) encontrada! Iniciando processamento...`);

                const processor = new ReportProcessor();
                const result = await processor.process();
                console.log("✅ Relatório Processado Automaticamente:", result);
            }
        }

        // --- SCHEDULED MESSAGES CHECK ---
        const pendingMessages = await prisma.scheduledMessage.findMany({
            where: {
                status: 'PENDING',
                scheduledAt: {
                    lte: now
                }
            }
        });

        if (pendingMessages.length > 0) {
            console.log(`[${now.toISOString()}] ✉️ Encontradas ${pendingMessages.length} mensagens agendadas para envio.`);

            for (const schedMsg of pendingMessages) {
                try {
                    let groupIds: string[] = [];
                    try {
                        groupIds = JSON.parse(schedMsg.recipients);
                    } catch {
                        groupIds = [schedMsg.recipients];
                    }

                    console.log(`-> Processando mensagem agendada (ID: ${schedMsg.id}) para ${groupIds.length} grupos...`);

                    const dbSettings = settings || await prisma.settings.findFirst();
                    if (!dbSettings) throw new Error("Configurações do sistema não encontradas.");

                    const provider = WhatsAppFactory.getProvider(dbSettings);

                    const groups = await prisma.group.findMany({
                        where: {
                            id: { in: groupIds },
                            isActive: true
                        }
                    });

                    if (groups.length === 0) {
                        throw new Error("Nenhum grupo válido encontrado para envio.");
                    }

                    const results = [];
                    let successCount = 0;
                    let failCount = 0;

                    for (const group of groups) {
                        try {
                            await provider.sendMessage(group.jid, schedMsg.message);
                            results.push({ name: group.name, status: "SUCCESS" });
                            successCount++;
                        } catch (error: any) {
                            console.error(`Falha ao enviar para ${group.name}:`, error);
                            results.push({ name: group.name, status: "ERROR", error: error.message });
                            failCount++;
                        }
                    }

                    // Save Broadcast History
                    await prisma.broadcast.create({
                        data: {
                            message: schedMsg.message,
                            recipients: JSON.stringify(results.map(r => r.name)),
                            successCount,
                            failCount
                        }
                    });

                    // Update Scheduled Message Status
                    if (successCount > 0 && failCount === 0) {
                        console.log(`✅ Mensagem agendada enviada! (Sucesso: ${successCount}, Falha: ${failCount})`);
                        await prisma.scheduledMessage.update({
                            where: { id: schedMsg.id },
                            data: { status: 'SENT' }
                        });
                    } else if (successCount > 0) {
                        console.log(`⚠️ Mensagem agendada enviada parcialmente! (Sucesso: ${successCount}, Falha: ${failCount})`);
                        await prisma.scheduledMessage.update({
                            where: { id: schedMsg.id },
                            data: { status: 'PARTIAL' }
                        });
                    } else {
                        console.error(`❌ Falha ao enviar mensagem agendada para todos os grupos.`);
                        await prisma.scheduledMessage.update({
                            where: { id: schedMsg.id },
                            data: { status: 'FAILED' }
                        });
                    }
                } catch (err: any) {
                    console.error(`❌ Erro no processamento da mensagem ${schedMsg.id}:`, err);
                    await prisma.scheduledMessage.update({
                        where: { id: schedMsg.id },
                        data: { status: 'FAILED' }
                    });
                }
            }
        }

    } catch (e) {
        console.error("❌ Erro no Agendador:", e);
    }
});

// Keep alive
process.stdin.resume();
