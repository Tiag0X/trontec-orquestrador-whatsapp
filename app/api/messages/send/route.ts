import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { WhatsAppFactory } from "@/lib/services/whatsapp.factory";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { groupIds, message } = body;

        // ... validation logic (keep identical, assuming lines 10-16 are fine, but I'll replace the block to be safe)

        if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
            return NextResponse.json({ error: "Nenhum grupo selecionado" }, { status: 400 });
        }
        if (!message || message.trim() === "") {
            return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
        }

        // 1. Initialize Service
        const settings = await prisma.settings.findFirst();
        if (!settings) {
            return NextResponse.json({ error: "Configurações não encontradas" }, { status: 500 });
        }

        const provider = WhatsAppFactory.getProvider(settings);

        // 2. Fetch Groups
        const groups = await prisma.group.findMany({
            where: {
                id: { in: groupIds },
                isActive: true
            }
        });

        if (groups.length === 0) {
            return NextResponse.json({ error: "Nenhum grupo válido encontrado" }, { status: 404 });
        }

        // 3. Send Messages
        const results = [];
        let successCount = 0;
        let failCount = 0;

        for (const group of groups) {
            try {
                // Always send to the actual group JID for broadcasts
                // (sendToJid is only for forwarding incoming messages, not broadcasts)
                await provider.sendMessage(group.jid, message);
                results.push({ name: group.name, status: "SUCCESS" });
                successCount++;
            } catch (error) {
                const err = error as { message?: string };
                console.error(`Failed to send to ${group.name}:`, err);
                results.push({ name: group.name, status: "ERROR", error: err.message });
                failCount++;
            }
        }

        // 4. Save History
        await prisma.broadcast.create({
            data: {
                message,
                recipients: JSON.stringify(results.map(r => r.name)),
                successCount,
                failCount
            }
        });

        return NextResponse.json({
            status: "COMPLETED",
            successCount,
            failCount,
            results
        });

    } catch (error) {
        const err = error as { message?: string };
        console.error("Critical error in message broadcast:", err);
        return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
    }
}
