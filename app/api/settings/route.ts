import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const settings = await prisma.settings.findFirst();
        return NextResponse.json(settings || {});
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json() as Record<string, unknown>;

        // Sanitize: convert empty strings to null for optional fields
        const sanitized = {
            whatsappProvider: (body.whatsappProvider as string) || 'EVOLUTION',
            whatsappApiUrl: (body.whatsappApiUrl as string) || '',
            whatsappToken: (body.whatsappToken as string) || '',
            whatsappInstanceName: (body.whatsappInstanceName as string) || '',
            evolutionApiUrl: (body.evolutionApiUrl as string) || '',
            evolutionInstanceName: (body.evolutionInstanceName as string) || '',
            evolutionToken: (body.evolutionToken as string) || '',
            whatsappGroupId: (body.whatsappGroupId as string) || '',
            openaiApiKey: (body.openaiApiKey as string) || '',
            systemPrompt: (body.systemPrompt as string) || null,
            defaultPromptId: body.defaultPromptId && String(body.defaultPromptId).trim() !== '' ? String(body.defaultPromptId) : null,
            autoReportTime: (body.autoReportTime as string) || '08:00',
            isAutoReportEnabled: Boolean(body.isAutoReportEnabled),
            autoReportPeriod: (body.autoReportPeriod as string) || 'YESTERDAY',
            langchainModel: (body.langchainModel as string) || 'gpt-4o-mini',
            langchainTemperature: typeof body.langchainTemperature === 'string'
                ? parseFloat(body.langchainTemperature) || 0.7
                : ((body.langchainTemperature as number) ?? 0.7),
        };

        const settings = await prisma.settings.upsert({
            where: { id: 1 },
            update: sanitized,
            create: { id: 1, ...sanitized },
        });
        return NextResponse.json(settings);
    } catch (error) {
        const err = error as { message?: string };
        console.error("Settings Save Error Message:", err.message);
        return NextResponse.json({ error: "Failed to save settings", details: err.message }, { status: 500 });
    }
}
