import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { WhatsAppFactory } from "@/lib/services/whatsapp.factory";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { groupIds = [], contactIds = [], message } = body;

        const hasGroups = Array.isArray(groupIds) && groupIds.length > 0;
        const hasContacts = Array.isArray(contactIds) && contactIds.length > 0;

        if (!hasGroups && !hasContacts) {
            return NextResponse.json({ error: "Nenhum grupo ou contato selecionado" }, { status: 400 });
        }

        if (!message || typeof message !== 'string' || message.trim() === "") {
            return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
        }

        // 1. Initialize Service
        const settings = await prisma.settings.findFirst();
        if (!settings) {
            return NextResponse.json({ error: "Configurações não encontradas" }, { status: 500 });
        }

        const provider = WhatsAppFactory.getProvider(settings);

        // 2. Fetch Targets
        const targets: { id: string; name: string; jid: string; isContact: boolean }[] = [];

        if (hasGroups) {
            const groups = await prisma.group.findMany({
                where: { id: { in: groupIds }, isActive: true }
            });
            for (const g of groups) {
                targets.push({ id: g.id, name: g.name, jid: g.jid, isContact: false });
            }
        }

        if (hasContacts) {
            const contacts = await prisma.contact.findMany({
                where: { id: { in: contactIds } }
            });
            for (const c of contacts) {
                const contactName = c.name || c.pushName || c.jid;
                targets.push({ id: c.id, name: contactName, jid: c.jid, isContact: true });
            }
        }

        if (targets.length === 0) {
            return NextResponse.json({ error: "Nenhum destinatário válido encontrado" }, { status: 404 });
        }

        // 3. Send Messages
        const results = [];
        let successCount = 0;
        let failCount = 0;

        for (const target of targets) {
            try {
                // Se for contato privado, aplicar delay randômico de 2 a 5 segundos para Anti-Ban
                if (target.isContact) {
                    const waitTime = Math.floor(Math.random() * (5000 - 2000 + 1) + 2000);
                    await delay(waitTime);
                }

                await provider.sendMessage(target.jid, message);
                results.push({ name: `[${target.isContact ? 'Contato' : 'Grupo'}] ${target.name}`, status: "SUCCESS" });
                successCount++;
            } catch (error) {
                const err = error as { message?: string };
                console.error(`Failed to send to ${target.name}:`, err);
                results.push({ name: `[${target.isContact ? 'Contato' : 'Grupo'}] ${target.name}`, status: "ERROR", error: err.message });
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
