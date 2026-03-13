import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const scheduledMessages = await prisma.scheduledMessage.findMany({
            where: {
                status: {
                    in: ['PENDING', 'FAILED', 'PARTIAL']
                }
            },
            orderBy: { scheduledAt: 'asc' },
        });
        return NextResponse.json(scheduledMessages);
    } catch (error) {
        console.error("Error fetching scheduled messages:", error);
        return NextResponse.json({ error: "Failed to fetch scheduled messages" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { message, groupIds = [], contactIds = [], scheduledAt } = body;

        const hasGroups = Array.isArray(groupIds) && groupIds.length > 0;
        const hasContacts = Array.isArray(contactIds) && contactIds.length > 0;

        if (!hasGroups && !hasContacts) {
            return NextResponse.json({ error: "Missing required fields: groupIds or contactIds" }, { status: 400 });
        }

        if (!message || typeof message !== 'string' || message.trim() === "") {
            return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
        }

        if (!scheduledAt) {
            return NextResponse.json({ error: "Missing required field: scheduledAt" }, { status: 400 });
        }

        const scheduledDate = new Date(scheduledAt);
        if (isNaN(scheduledDate.getTime())) {
            return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
        }

        // Armazena no BD o objeto com as duas listas para que o scheduler processe ambos
        const recipientsPayload = {
            groupIds: hasGroups ? groupIds : [],
            contactIds: hasContacts ? contactIds : []
        };

        const scheduledMessage = await prisma.scheduledMessage.create({
            data: {
                message,
                recipients: JSON.stringify(recipientsPayload),
                scheduledAt: scheduledDate,
                status: 'PENDING',
            }
        });

        return NextResponse.json(scheduledMessage);
    } catch (error) {
        console.error("Error scheduling message:", error);
        return NextResponse.json({ error: "Failed to schedule message" }, { status: 500 });
    }
}
