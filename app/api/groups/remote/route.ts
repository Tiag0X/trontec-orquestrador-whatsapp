import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WhatsAppFactory } from '@/lib/services/whatsapp.factory';

export async function GET() {
    try {
        const settings = await prisma.settings.findFirst();
        if (!settings) return NextResponse.json({ error: "Configurações não encontradas" }, { status: 400 });

        const provider = WhatsAppFactory.getProvider(settings);
        const groups = await provider.fetchAllGroups();
        
        return NextResponse.json(groups);
    } catch (error) {
        console.error("Remote Groups Error:", error);
        return NextResponse.json({ error: "Falha ao buscar grupos remotos" }, { status: 500 });
    }
}
