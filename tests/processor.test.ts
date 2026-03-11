import { ReportProcessor } from '../lib/services/processor.service';
import { prisma } from '../lib/prisma';
import { WhatsAppFactory } from '../lib/services/whatsapp.factory';
import { LangChainService } from '../lib/services/langchain-agent.service';

jest.mock('../lib/prisma', () => ({
    prisma: {
        settings: { findFirst: jest.fn(), update: jest.fn() },
        group: { findMany: jest.fn() },
        report: { create: jest.fn(), update: jest.fn() },
        prompt: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() }
    }
}));

jest.mock('../lib/services/whatsapp.factory');
jest.mock('../lib/services/langchain-agent.service');

describe('ReportProcessor', () => {
    let processor: ReportProcessor;
    let mockFetchMessages: jest.Mock;
    let mockSendMessage: jest.Mock;
    let mockGenerateReport: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockFetchMessages = jest.fn();
        mockSendMessage = jest.fn();
        (WhatsAppFactory.getProvider as jest.Mock).mockReturnValue({
            fetchMessages: mockFetchMessages,
            sendMessage: mockSendMessage
        });

        mockGenerateReport = jest.fn();
        (LangChainService as jest.Mock).mockImplementation(() => ({
            generateReport: mockGenerateReport
        }));

        (prisma.settings.findFirst as jest.Mock).mockResolvedValue({
            evolutionApiUrl: 'http://api',
            evolutionInstanceName: 'Inst',
            evolutionToken: 'Tok',
            openaiApiKey: 'Key',
            defaultPromptId: 'p1'
        });

        (prisma.prompt.findUnique as jest.Mock).mockResolvedValue({
            id: 'p1',
            content: 'Default Prompt'
        });

        (prisma.group.findMany as jest.Mock).mockResolvedValue([
            { id: 'g1', jid: '123@g.us', name: 'Test Group', isActive: true, includeInAutoReport: true }
        ]);

        (prisma.report.create as jest.Mock).mockResolvedValue({ id: 'r1' });

        processor = new ReportProcessor();
    });

    test('should truncate messages if over 2500', async () => {
        // Generate 3000 mock messages (Just now - 1h)
        // We pass explicit date range to process(), so filtering will catch them.
        const messages = Array.from({ length: 3000 }, (_, i) => ({
            id: `id_${i}`,
            timestamp: ((Date.now() / 1000) - 3600),
            pushName: `User ${i}`,
            text: `Message ${i}`,
            from: '123@g.us',
            to: '123@g.us',
            isGroup: true
        }));

        mockFetchMessages.mockResolvedValue(messages);

        mockGenerateReport.mockResolvedValue({
            fullText: 'Report',
            summary: 'Summary',
            occurrences: [], problems: [], orders: [], actions: [], engagement: ''
        });

        // Provide wide Date Range to ensure our mock messages are included
        await processor.process({
            groupIds: ['g1'],
            startDate: '2025-01-01',
            endDate: '2030-12-31'
        });

        expect(mockGenerateReport).toHaveBeenCalled();
        const args = mockGenerateReport.mock.calls[0];
        const parsed = JSON.parse(args[0]);
        expect(parsed.length).toBe(2500);
        // Should keep LATEST messages (last ones in array)
        expect(parsed[2499].text).toBe('Message 2999');
    });

    test('should handle empty messages gracefully', async () => {
        mockFetchMessages.mockResolvedValue([]);
        const result = await processor.process({
            groupIds: ['g1'],
            startDate: '2025-01-01',
            endDate: '2030-12-31'
        });

        // Check skipped status using optional chaining for safety
        const results = (result as { results: { result: { status: string } }[] }).results;
        expect(results?.[0]?.result?.status).toBe('SKIPPED');
        expect(mockGenerateReport).not.toHaveBeenCalled();
    });
});
