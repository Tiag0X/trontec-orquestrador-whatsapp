import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { WhatsAppFactory } from '@/lib/services/whatsapp.factory';

const prisma = new PrismaClient();

async function run() {
    const now = new Date();
    // Simulate a future time to catch anything that was pending
    now.setMinutes(now.getMinutes() + 10);

    console.log("-> Iniciando teste manual do scheduler. Agora + 10m =", now);

    try {
        const settings = await prisma.settings.findFirst();

        const pendingMessages = await prisma.scheduledMessage.findMany({
            where: {
                status: 'PENDING',
                scheduledAt: {
                    lte: now
                }
            }
        });

        if (pendingMessages.length > 0) {
            console.log(`✉️ Encontradas ${pendingMessages.length} mensagens agendadas para envio.`);

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

                    await prisma.broadcast.create({
                        data: {
                            message: schedMsg.message,
                            recipients: JSON.stringify(results.map(r => r.name)),
                            successCount,
                            failCount
                        }
                    });

                    if (successCount > 0 && failCount === 0) {
                        console.log(`✅ Mensagem enviada com sucesso!`);
                        await prisma.scheduledMessage.update({
                            where: { id: schedMsg.id },
                            data: { status: 'SENT' }
                        });
                    } else if (successCount > 0) {
                        console.log(`⚠️ Mensagem enviada parcialmente!`);
                        await prisma.scheduledMessage.update({
                            where: { id: schedMsg.id },
                            data: { status: 'PARTIAL' }
                        });
                    } else {
                        console.error(`❌ Falha geral no envio.`);
                        await prisma.scheduledMessage.update({
                            where: { id: schedMsg.id },
                            data: { status: 'FAILED' }
                        });
                    }
                } catch (err: any) {
                    console.error(`❌ Error processando a msg ${schedMsg.id}:`, err);
                    await prisma.scheduledMessage.update({
                        where: { id: schedMsg.id },
                        data: { status: 'FAILED' }
                    });
                }
            }
        } else {
            console.log("Zero mensagens pendentes.");
        }
    } catch (e) {
        console.error("❌ Fatal Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
