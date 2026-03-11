import { prisma } from "../prisma";
import { WhatsAppProvider } from "./whatsapp.provider";
import { WhatsAppFactory } from "./whatsapp.factory";
import { LangChainService } from "./langchain-agent.service";


interface ProcessOptions {
    startDate?: string;
    endDate?: string;
    groupIds?: string[];
    agentType?: 'SIMPLE' | 'LANGCHAIN';
}

export class ReportProcessor {
    private whatsappProvider: WhatsAppProvider | null = null;
    private langchainService: LangChainService;

    constructor() {
        this.langchainService = new LangChainService("");
    }

    async initialize() {
        const settings = await prisma.settings.findFirst();
        if (!settings) throw new Error("Settings not configured");

        this.whatsappProvider = WhatsAppFactory.getProvider(settings);

        // Advanced AI Settings
        const lcModel = settings.langchainModel || "gpt-4o-mini";
        const lcTemp = settings.langchainTemperature ?? 0.7;
        this.langchainService = new LangChainService(settings.openaiApiKey, lcModel, lcTemp);

        // Auto-Seed: Ensure "System Default" prompt exists and is linked if none selected
        if (!settings.defaultPromptId) {
            const SYSTEM_PROMPT_NAME = "Sistema - Business Analyst (Padrão)";
            const SYSTEM_PROMPT_CONTENT = `Agente de Resumos: Senior Business Analyst.
            
CRITÉRIOS DE ANÁLISE:
1. FILTRAGEM: Ignore saudações simples ("Bom dia", "Boa tarde", "Ok", "👍"), figurinhas e mensagens irrelevantes.
2. CATEGORIZAÇÃO: Separe claramente Problemas (FALHAS) de Solicitações (PEDIDOS) e Ações (RESOLUÇÕES).
3. TOM: Profissional, direto e focado em resultados.
            
CRITÉRIOS DE SAÍDA (FORMATO JSON OBRIGATÓRIO):
Você deve retornar um objeto JSON válido com a seguinte estrutura:
{
  "summary": "Resumo executivo de alto nível (2-3 frases).",
  "occurrences": ["Fato 1", "Fato 2..."],
  "problems": ["Problema 1", "Problema 2..."],
  "orders": ["Pedido 1", "Pedido 2..."],
  "actions": ["Ação 1", "Ação 2..."],
  "engagement": "Clima: Positivo/Neutro/Tenso + Justificativa.",
  "fullText": "Texto formatado com emojis para envio no WhatsApp (Ex: 📊 *Resumo*, ⚠️ *Problemas*)."
}`;

            let defaultPrompt = await prisma.prompt.findFirst({ where: { name: SYSTEM_PROMPT_NAME } });

            if (!defaultPrompt) {
                console.log("[INFO] Auto-seeding default system prompt...");
                defaultPrompt = await prisma.prompt.create({
                    data: { name: SYSTEM_PROMPT_NAME, content: SYSTEM_PROMPT_CONTENT }
                });
            }

            // Link it
            await prisma.settings.update({
                where: { id: settings.id },
                data: { defaultPromptId: defaultPrompt.id }
            });
            console.log(`[INFO] Linked default prompt: ${defaultPrompt.name}`);
        }

        return settings;
    }

    async process(options: ProcessOptions = {}) {
        try {

            const settings = await this.initialize();

            // 0. Fetch Settings
            const dbSettings = await prisma.settings.findFirst();

            const whereClause: Record<string, unknown> = { isActive: true };
            if (options.groupIds && options.groupIds.length > 0) {
                whereClause.id = { in: options.groupIds };
            } else {
                // Auto Mode: Only include groups marked for auto-report
                whereClause.includeInAutoReport = true;
            }

            const groups = await prisma.group.findMany({
                where: whereClause as never,
                include: { prompt: true }
            });

            if (groups.length === 0) {
                // Fallback (only if specific ID was in settings but no groups in DB? Legacy case)
                if (!options.groupIds && settings.whatsappGroupId) {
                    // ... legacy handling ...
                }
                return { status: "SKIPPED", reason: "No active groups found for this criteria" };
            }

            // Calculate Dates based on Settings if not provided
            let startDate = options.startDate;
            let endDate = options.endDate;

            if (!startDate) {
                const period = dbSettings?.autoReportPeriod || 'YESTERDAY';
                const now = new Date();
                
                // Use America/Sao_Paulo for date logic (UTC-3)
                const localDate = now.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }); // YYYY-MM-DD

                if (period === 'TODAY') {
                    startDate = localDate;
                    endDate = localDate;
                } else if (period === '24H') {
                    const yesterday = new Date(now);
                    yesterday.setDate(now.getDate() - 1);
                    startDate = yesterday.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
                    endDate = localDate;
                } else {
                    // YESTERDAY (Default)
                    const yesterday = new Date(now);
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yStr = yesterday.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
                    startDate = yStr;
                    endDate = yStr;
                }
                console.log(`[AUTO] Calculated Local Period (${period}): ${startDate} to ${endDate} (Ref: ${now.toISOString()})`);
            }

            const results = [];
            for (const group of groups) {
                console.log(`[INFO] Processing group: ${group.name} (${group.jid})`);
                const result = await this.processSingleGroup(group.jid, group.name, group.id, {
                    ...options, // Keep original options but override dates
                    startDate,
                    endDate,
                    sendToJid: group.sendToJid || undefined,
                    customPrompt: group.prompt?.content,
                    agentType: options.agentType
                });
                results.push({ group: group.name, result });
            }


            return { status: "COMPLETED", results };

        } catch (error) {
            console.error("Processing failed:", error);
            throw error;
        }
    }

    private async processSingleGroup(groupJid: string, groupName: string, groupId?: string, options?: { startDate?: string, endDate?: string, sendToJid?: string, customPrompt?: string, agentType?: 'SIMPLE' | 'LANGCHAIN' }) {
        try {
            // 1. Fetch
            const settings = await prisma.settings.findFirst();
            if (!this.whatsappProvider) await this.initialize();
            const messages = await this.whatsappProvider!.fetchMessages(groupJid, 2000);

            // 2. Filter
            let filterStart: Date;
            let filterEnd: Date = new Date(); // Default to now

            if (options?.startDate) {
                // Fix Timezone: Start of day
                filterStart = new Date(`${options.startDate}T00:00:00`);
            } else {
                // Default: previous 30 days
                filterStart = new Date();
                filterStart.setDate(filterStart.getDate() - 30);
                filterStart.setHours(0, 0, 0, 0);
            }

            if (options?.endDate) {
                // Fix Timezone: End of day (Extend by 4h to cover Western Timezones like Brazil UTC-3)
                // If message is 22:00 BRT, it is 01:00 UTC Next Day. We need to catch it.
                filterEnd = new Date(`${options.endDate}T23:59:59.999`);
                filterEnd.setHours(filterEnd.getHours() + 4);
            }

            console.log(`[DEBUG] Range: ${filterStart.toISOString()} to ${filterEnd.toISOString()}`);
            let filteredMessages = messages.filter((msg, idx) => {
                // Uazapi Provider already returns ms if > 1e12
                const timestamp = (msg.timestamp && msg.timestamp > 1e12) ? msg.timestamp : (msg.timestamp ? msg.timestamp * 1000 : Date.now());
                const msgTime = new Date(timestamp);
                const hasText = !!msg.text && msg.text.trim() !== "";
                
                const isWithinRange = msgTime >= filterStart && msgTime <= filterEnd;
                
                if (idx < 5) {
                    console.log(`[DEBUG] Msg ${idx}: ${msgTime.toISOString()} | text: ${msg.text?.substring(0, 20)}... | Range: ${isWithinRange} | Text: ${hasText}`);
                }
                
                return isWithinRange && hasText;
            });
            console.log(`[DEBUG] [${groupName}] Filtered ${filteredMessages.length} messages out of ${messages.length}.`);

            console.log(`[DEBUG] [${groupName}] Fetched ${messages.length} messages.`);

            let dateRef = filterStart.toLocaleDateString('pt-BR');
            if (options?.endDate && options.endDate !== options.startDate) {
                const endDateObj = new Date(`${options.endDate}T00:00:00`);
                dateRef = `${dateRef} a ${endDateObj.toLocaleDateString('pt-BR')}`;
            }

            if (filteredMessages.length === 0) {
                console.warn(`[WARN] No messages found for ${groupName}. Creating EMPTY report.`);
                const emptyReport = await prisma.report.create({
                    data: {
                        dateRef: dateRef,
                        summary: "Sem mensagens no período.",
                        fullText: "Nenhuma mensagem encontrada para gerar o relatório neste período.",
                        status: "EMPTY",
                        groupId: groupId,
                        processedData: "[]",
                        occurrences: "[]",
                        problems: "[]",
                        orders: "[]",
                        actions: "[]",
                        engagement: ""
                    }
                });
                return { status: "EMPTY", reportId: emptyReport.id, reason: "No messages found" };
            }

            // Ensure chronological order (oldest to newest) for the AI
            filteredMessages.reverse();

            // Limit messages to prevent token overflow
            // GPT-4o-mini has 128k context, 3500 messages usually fit (~100k-120k tokens)
            const MAX_MESSAGES = 3500;
            if (filteredMessages.length > MAX_MESSAGES) {
                console.warn(`[WARN] Truncating messages from ${filteredMessages.length} to ${MAX_MESSAGES} (Token Safety Limit)`);
                // Since it is chronological [oldest -> newest], slice(-MAX) keeps the NEWEST of the period
                filteredMessages = filteredMessages.slice(-MAX_MESSAGES);
            }

            // 3. Prepare for AI
            const messagesJson = JSON.stringify(filteredMessages.map(m => {
                const timestamp = (m.timestamp && m.timestamp > 1e12) ? m.timestamp : (m.timestamp ? m.timestamp * 1000 : Date.now());
                return {
                    user: m.pushName,
                    text: m.text,
                    time: new Date(timestamp).toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' })
                };
            }));

            // dateRef moved up

            // 4. Generate
            // Default Prompt
            let systemPrompt = `Agente de Resumos para Grupo de WhatsApp: ${groupName}
CONTEXTO:
- O título do relatório deve ser SEMPRE: RESUMO EXECUTIVO - ${groupName.toUpperCase()}
- Você receberá mensagens de texto e localizações (Latitude, Longitude).
- IMPORTANTE: Sempre que encontrar uma localização (ex: "📍 Localização: -30.0..., -51.0..."), você DEVE converter essas coordenadas para o endereço aproximado (Rua, Bairro, Cidade) ou nome do local conhecido no texto do relatório. Use seu conhecimento geográfico para isso.`;


            // Override with Custom Prompt if available (Group Specific > System Default)
            let chosenPromptTemplate = options?.customPrompt;
            if (!chosenPromptTemplate || chosenPromptTemplate.trim() === "") {
                // If no group prompt, check system default prompt ID
                if (settings?.defaultPromptId) {
                    const defaultPrompt = await prisma.prompt.findUnique({
                        where: { id: settings.defaultPromptId }
                    });
                    if (defaultPrompt) {
                        chosenPromptTemplate = defaultPrompt.content;
                    }
                } else if (settings?.systemPrompt && settings.systemPrompt.trim() !== "") {
                    // Legacy fallback
                    chosenPromptTemplate = settings.systemPrompt;
                }
            }

            if (chosenPromptTemplate) {
                const processedTemplate = chosenPromptTemplate
                    .replace(/\$\{GROUP_NAME\}/g, groupName)
                    .replace(/\{GROUP_NAME\}/g, groupName) // Support both ${} and {}
                    .replace(/\$\{DATE\}/g, dateRef)
                    .replace(/\{DATE\}/g, dateRef);

                // Force context header so AI always knows the group name
                systemPrompt = `[METADADOS OBRIGATÓRIOS DO RELATÓRIO]
NOME DO GRUPO: ${groupName}
DATA DE REFERÊNCIA: ${dateRef}

[INSTRUÇÃO DO USUÁRIO]
${processedTemplate}

[REGRAS PRIORITÁRIAS DE FORMATAÇÃO]
1. O Título do Relatório DEVE obrigatoriamente conter o nome do grupo: "${groupName}".
2. Se houver conflito entre a instrução e os metadados, os metadados ("${groupName}") prevalecem.`;
            }



            // 4.1 AI returns pure Markdown now
            let markdownReport = "";
            let aiFailed = false;
            let aiErrorReason = "";
            try {
                markdownReport = await this.langchainService.generateReport(messagesJson, dateRef, systemPrompt, groupName);
            } catch (aiError: any) {
                console.error(`[WARN] AI Generation failed for ${groupName}:`, aiError.message);
                aiFailed = true;
                aiErrorReason = aiError.message || "Erro desconhecido na IA (verifique a API Key)";
                markdownReport = `🚨 **Falha na Inteligência Artificial**\n\nNão foi possível gerar o resumo devido a um erro na API da IA.\n\n**Detalhes do Erro:** ${aiErrorReason}\n\n*A extração das mensagens brutas foi salva no banco de dados para proteção.*`;
            }

            // 4.1.1 Helper to extract Markdown sections precisely (Handling Emojis in Headers)
            const extractSection = (md: string, sectionTitle: string): string => {
                // Escaping special characters in titles and making it robust with regex
                const escapedTitle = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`## ${escapedTitle}[\\s\\S]*?(?=\\n---?|\\n## |$)`, 'i');
                const match = md.match(regex);
                if (!match) return "";
                // Remove the header line itself and trim
                return match[0].replace(new RegExp(`## ${escapedTitle}`, 'i'), "").trim();
            };

            // 4.2 Precise Extraction from the new Master Prompt Structure
            const summary = extractSection(markdownReport, "✅ Resumo executivo");
            const occurrences = extractSection(markdownReport, "🧭 O que aconteceu \\(linha do tempo\\)");
            const decisions = extractSection(markdownReport, "🧾 Decisões");
            const orders = extractSection(markdownReport, "📥 Pedidos e solicitações");
            const problems = extractSection(markdownReport, "🚨 Problemas e ocorrências");
            const actions = extractSection(markdownReport, "🛠️ Ações tomadas");
            const pendencies = extractSection(markdownReport, "🔁 Pendências \\(open loops\\)");
            const engagement = extractSection(markdownReport, "😊 Engajamento e humor do grupo");
            const risks = extractSection(markdownReport, "⚠️ Riscos e pontos de atenção");

            // The specific text for WhatsApp
            const whatsappText = extractSection(markdownReport, "📲 Texto pronto para WhatsApp");

            const reportData = {
                whatsappText: whatsappText || markdownReport,
                fullText: markdownReport,
                summary: summary || markdownReport.substring(0, 500),

                // Grouping for database columns
                occurrences: occurrences + (decisions ? "\n\n### DECISÕES\n" + decisions : ""),
                problems: problems + (risks ? "\n\n### RISCOS E ATENÇÃO\n" + risks : ""),
                orders: orders + (pendencies ? "\n\n### PENDÊNCIAS\n" + pendencies : ""),
                actions: actions || "",
                engagement: engagement || "",

                // Resulting message
            };

            console.log(`[DEBUG] Master Prompt Mapping Completed. Total Length: ${markdownReport.length}`);

            // 5. Save
            const report = await prisma.report.create({
                data: {
                    dateRef: dateRef,
                    summary: reportData.summary || "Sem resumo",
                    fullText: reportData.fullText || "Erro ao gerar texto.",

                    // Data is already stringified by our mapping logic
                    occurrences: reportData.occurrences || "[]",
                    problems: reportData.problems || "[]",
                    orders: reportData.orders || "[]",
                    actions: reportData.actions || "[]",
                    engagement: reportData.engagement || "",

                    status: aiFailed ? "FAILED" : "GENERATED",
                    groupId: groupId || undefined,
                    processedData: messagesJson
                }
            });

            if (aiFailed) {
                console.log(`[INFO] AI Failed for ${groupName}. Report saved with FAILED status. WhatsApp send skipped.`);
                return { status: "FAILED", reportId: report.id, reason: aiErrorReason };
            }

            // 6. Send
            const targetJid = options?.sendToJid || groupJid;
            console.log(`[INFO] Sending report for ${groupName} to ${targetJid} ${options?.sendToJid ? '(Custom Destination)' : '(Origin Group)'}`);

            await this.whatsappProvider!.sendMessage(targetJid, reportData.whatsappText || "Erro no relatório.");

            // 7. Update status
            await prisma.report.update({
                where: { id: report.id },
                data: { status: "SENT" }
            });



            return { status: "SUCCESS", reportId: report.id };

        } catch (e) {
            const err = e as { message?: string };
            console.error(`[ERROR] Failed to process group ${groupName}:`, err.message);
            return { status: "ERROR", error: err.message };
        }
    }
}
